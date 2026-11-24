import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  auditLog,
  LEAVE_TYPE_IDS,
  leaveRequests,
  leaveTypes,
  USER_IDS,
  users,
} from "@/lib/data/mock/fixtures";
import { AUDIT_ACTIONS, LEAVE_TYPE_NAMES, REQUEST_STATUSES, ROLES } from "@/lib/data/types";

/**
 * TASK-010 — schema contract, run against real Postgres 17 (PGlite, in-process).
 * Every migration must keep this suite green; new tables / columns / enum values /
 * invariants get an assertion here in the same PR.
 *
 * NOTE: PGlite has no Supabase `auth` schema or `anon`/`authenticated` roles. A
 * migration that references them (e.g. RLS policies using auth.uid()) needs a
 * shim in `beforeAll` before it can be applied here.
 */

const root = path.resolve(import.meta.dirname, "../..");
const migrationsDir = path.join(root, "supabase/migrations");
/** Every migration, in filename (timestamp) order — new files are picked up automatically. */
const MIGRATION_FILES = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();
const MIGRATIONS = MIGRATION_FILES.map((f) => readFileSync(path.join(migrationsDir, f), "utf8"));
const SEED = readFileSync(path.join(root, "supabase/seed.sql"), "utf8");

const ARCH_TABLES = [
  "users",
  "leave_types",
  "leave_policies",
  "leave_balances",
  "leave_requests",
  "audit_log",
] as const;

/** Columns per ARCH-LeaveTrack-v1.0 › Data Model (+ approved additions). */
const EXPECTED_COLUMNS: Record<string, string[]> = {
  users: ["id", "name", "email", "role", "manager_id", "created_at"],
  leave_types: ["id", "name", "tracks_balance"],
  leave_policies: ["id", "user_id", "leave_type_id", "accrual_per_month"],
  leave_balances: ["id", "user_id", "leave_type_id", "balance", "updated_at"],
  leave_requests: [
    "id",
    "user_id",
    "leave_type_id",
    "start_date",
    "end_date",
    "reason",
    "status",
    "decided_by",
    "decided_at",
    "decision_reason",
    "is_deleted",
    "created_at",
  ],
  audit_log: ["id", "leave_request_id", "actor_id", "action", "occurred_at"],
  accrual_runs: ["id", "period", "ran_at"],
};

/** [table, column, referenced table] — every FK the arch doc implies. */
const EXPECTED_FKS: [string, string, string][] = [
  ["users", "manager_id", "users"],
  ["leave_policies", "user_id", "users"],
  ["leave_policies", "leave_type_id", "leave_types"],
  ["leave_balances", "user_id", "users"],
  ["leave_balances", "leave_type_id", "leave_types"],
  ["leave_requests", "user_id", "users"],
  ["leave_requests", "leave_type_id", "leave_types"],
  ["leave_requests", "decided_by", "users"],
  ["audit_log", "leave_request_id", "leave_requests"],
  ["audit_log", "actor_id", "users"],
];

const ANA = USER_IDS.ana;
const BEN = USER_IDS.ben;
const VACATION = LEAVE_TYPE_IDS.Vacation;

let db: PGlite;

async function rows<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await db.query<T>(sql, params)).rows;
}

async function counts() {
  const [r] = await rows<Record<string, number>>(`
    select (select count(*)::int from users) users,
           (select count(*)::int from leave_types) leave_types,
           (select count(*)::int from leave_policies) leave_policies,
           (select count(*)::int from leave_balances) leave_balances,
           (select count(*)::int from leave_requests) leave_requests,
           (select count(*)::int from audit_log) audit_log,
           (select count(*)::int from accrual_runs) accrual_runs`);
  return r!;
}

/** Run a statement in a transaction that is always rolled back, so tests never mutate shared state. */
async function attempt(sql: string, params: unknown[] = []) {
  await db.exec("begin");
  try {
    await db.query(sql, params);
    return null;
  } catch (error) {
    return error as { code?: string; message: string };
  } finally {
    await db.exec("rollback");
  }
}

const insertRequest = (overrides: Record<string, string | null>) => {
  const row: Record<string, string | null> = {
    user_id: ANA,
    leave_type_id: VACATION,
    start_date: "2027-02-01",
    end_date: "2027-02-02",
    reason: "test",
    status: "pending",
    decided_by: null,
    decided_at: null,
    decision_reason: null,
    ...overrides,
  };
  const cols = Object.keys(row);
  return attempt(
    `insert into leave_requests (${cols.join(",")}) values (${cols.map((_, i) => `$${i + 1}`).join(",")})`,
    Object.values(row),
  );
};

/** Snapshots taken in beforeAll so every test is independent of run order. */
let afterMigrations: Awaited<ReturnType<typeof counts>>;
let afterSeed: Awaited<ReturnType<typeof counts>>;

beforeAll(async () => {
  db = new PGlite();
  for (const sql of MIGRATIONS) await db.exec(sql);
  afterMigrations = await counts();
  await db.exec(SEED);
  afterSeed = await counts();
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("AC1 — migration runs clean on an empty DB", () => {
  it("discovers at least the initial migration", () => {
    expect(MIGRATION_FILES[0]).toBe("20261124000000_init.sql");
  });

  it("applies all migrations without error; only reference data is present", () => {
    expect(afterMigrations).toEqual({
      users: 0,
      leave_types: 3,
      leave_policies: 0,
      leave_balances: 0,
      leave_requests: 0,
      audit_log: 0,
      accrual_runs: 0,
    });
  });

  it("applies the seed, and re-applying it changes nothing (idempotent)", async () => {
    await db.exec(SEED);
    expect(await counts()).toEqual(afterSeed);
    expect(afterSeed).toEqual({
      users: 9,
      leave_types: 3,
      leave_policies: 18,
      leave_balances: 18,
      leave_requests: 10,
      audit_log: 14,
      accrual_runs: 1,
    });
  });
});

describe("AC2 — all 6 tables exist with FKs matching the arch doc", () => {
  it("creates exactly the arch tables plus accrual_runs", async () => {
    const tables = await rows<{ table_name: string }>(
      `select table_name from information_schema.tables where table_schema = 'public' order by 1`,
    );
    expect(tables.map((t) => t.table_name).sort()).toEqual([...ARCH_TABLES, "accrual_runs"].sort());
  });

  it.each(Object.entries(EXPECTED_COLUMNS))("%s has the expected columns", async (table, cols) => {
    const actual = await rows<{ column_name: string }>(
      `select column_name from information_schema.columns
       where table_schema = 'public' and table_name = $1`,
      [table],
    );
    expect(actual.map((c) => c.column_name).sort()).toEqual([...cols].sort());
  });

  it("has every arch-doc foreign key, all ON DELETE RESTRICT", async () => {
    const fks = await rows<{ tbl: string; col: string; ref: string; del: string }>(`
      select c.conrelid::regclass::text tbl, a.attname col,
             c.confrelid::regclass::text ref, c.confdeltype del
      from pg_constraint c
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
      where c.contype = 'f' and c.connamespace = 'public'::regnamespace`);
    const actual = fks.map((f) => [f.tbl, f.col, f.ref]);
    for (const fk of EXPECTED_FKS) expect(actual).toContainEqual(fk);
    expect(fks).toHaveLength(EXPECTED_FKS.length);
    expect(fks.every((f) => f.del === "r")).toBe(true);
  });

  it("indexes every foreign-key column", async () => {
    const unindexed = await rows<{ fk: string }>(`
      select c.conrelid::regclass || '.' || a.attname fk
      from pg_constraint c
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
      where c.contype = 'f' and c.connamespace = 'public'::regnamespace
        and not exists (select 1 from pg_index i
                        where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1])`);
    expect(unindexed).toEqual([]);
  });

  it("enables row level security on every table", async () => {
    const off = await rows<{ relname: string }>(`
      select relname from pg_class
      where relnamespace = 'public'::regnamespace and relkind = 'r' and not relrowsecurity`);
    expect(off).toEqual([]);
  });
});

describe("AC3 — leave_types seeded with exactly 3 rows", () => {
  it("contains Vacation, Sick, Unpaid with fixture IDs; only Unpaid is untracked", async () => {
    const types = await rows<{ id: string; name: string; tracks_balance: boolean }>(
      `select id, name, tracks_balance from leave_types order by name`,
    );
    expect(types).toEqual(
      [...leaveTypes]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((t) => ({ id: t.id, name: t.name, tracks_balance: t.tracksBalance })),
    );
    expect(types.map((t) => t.name).sort()).toEqual([...LEAVE_TYPE_NAMES].sort());
  });
});

describe("AC4 — is_deleted defaults to false; no hard-delete path", () => {
  it("defaults leave_requests.is_deleted to false", async () => {
    const [col] = await rows<{ column_default: string; is_nullable: string }>(
      `select column_default, is_nullable from information_schema.columns
       where table_name = 'leave_requests' and column_name = 'is_deleted'`,
    );
    expect(col).toEqual({ column_default: "false", is_nullable: "NO" });
  });

  it.each(["leave_requests", "audit_log"])("blocks DELETE on %s (BR-04)", async (table) => {
    const err = await attempt(`delete from ${table}`);
    expect(err?.message).toMatch(/Hard delete is not allowed/);
  });

  it("allows soft delete", async () => {
    await db.exec("begin");
    await db.query(`update leave_requests set is_deleted = true where id = $1`, [
      leaveRequests[0]!.id,
    ]);
    const [r] = await rows<{ is_deleted: boolean }>(
      `select is_deleted from leave_requests where id = $1`,
      [leaveRequests[0]!.id],
    );
    await db.exec("rollback");
    expect(r?.is_deleted).toBe(true);
  });

  it("restricts deleting a user who has history", async () => {
    expect((await attempt(`delete from users where id = $1`, [ANA]))?.code).toBe("23001");
  });
});

describe("invariants enforced by the database", () => {
  it("rejects an end date before the start date (US-01 AC2)", async () => {
    const err = await insertRequest({ start_date: "2027-02-10", end_date: "2027-02-01" });
    expect(err?.message).toMatch(/leave_requests_date_range/);
  });

  it("rejects a pending request that already has a decider or reason", async () => {
    expect((await insertRequest({ decided_by: BEN }))?.message).toMatch(/decision_consistent/);
    expect((await insertRequest({ decision_reason: "nope" }))?.message).toMatch(
      /decision_consistent/,
    );
  });

  it("rejects a decision without decided_by / decided_at", async () => {
    expect((await insertRequest({ status: "approved" }))?.message).toMatch(/decision_consistent/);
  });

  it("requires a non-blank reason to reject (US-03 AC2)", async () => {
    const decided = { status: "rejected", decided_by: BEN, decided_at: "2027-01-01T00:00:00Z" };
    expect((await insertRequest(decided))?.message).toMatch(/leave_requests_reject_reason/);
    for (const blank of ["   ", "\n\t ", ""]) {
      expect((await insertRequest({ ...decided, decision_reason: blank }))?.message).toMatch(
        /leave_requests_reject_reason/,
      );
    }
    expect(await insertRequest({ ...decided, decision_reason: "Release freeze" })).toBeNull();
  });

  it("allows approving without a reason", async () => {
    expect(
      await insertRequest({
        status: "approved",
        decided_by: BEN,
        decided_at: "2027-01-01T00:00:00Z",
      }),
    ).toBeNull();
  });

  it("makes accrual idempotent per month (US-07 AC2)", async () => {
    expect((await attempt(`insert into accrual_runs (period) values ('2026-11-01')`))?.code).toBe(
      "23505",
    );
    expect((await attempt(`insert into accrual_runs (period) values ('2026-12-15')`))?.code).toBe(
      "23514",
    );
  });

  it("allows one balance row per user and leave type", async () => {
    const err = await attempt(
      `insert into leave_balances (user_id, leave_type_id, balance) values ($1, $2, 1)`,
      [ANA, VACATION],
    );
    expect(err?.code).toBe("23505");
  });

  it("prevents a user from being their own manager", async () => {
    const err = await attempt(`update users set manager_id = id where id = $1`, [ANA]);
    expect(err?.message).toMatch(/users_not_own_manager/);
  });
});

describe("drift guards — SQL ↔ TypeScript ↔ fixtures", () => {
  const enumValues = async (name: string) =>
    (await rows<{ v: string }>(`select unnest(enum_range(null::${name}))::text v`)).map((r) => r.v);

  it("Postgres enums match the TS constants", async () => {
    expect(await enumValues("user_role")).toEqual([...ROLES]);
    expect(await enumValues("request_status")).toEqual([...REQUEST_STATUSES]);
    expect(await enumValues("audit_action")).toEqual([...AUDIT_ACTIONS]);
  });

  it("seeded users match fixtures.ts", async () => {
    const seeded = await rows<{
      id: string;
      name: string;
      email: string;
      role: string;
      manager_id: string | null;
    }>(`select id, name, email, role, manager_id from users order by id`);
    expect(seeded).toEqual(
      [...users]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          manager_id: u.managerId,
        })),
    );
  });

  it("seeded leave requests match fixtures.ts", async () => {
    const seeded = await rows<Record<string, unknown>>(`
      select id, user_id, leave_type_id, start_date::text, end_date::text, reason, status,
             decided_by, decided_at, decision_reason, is_deleted, created_at
      from leave_requests order by id`);
    expect(
      seeded.map((r) => ({
        ...r,
        decided_at: r.decided_at ? (r.decided_at as Date).toISOString() : null,
        created_at: (r.created_at as Date).toISOString(),
      })),
    ).toEqual(
      [...leaveRequests]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((r) => ({
          id: r.id,
          user_id: r.userId,
          leave_type_id: r.leaveTypeId,
          start_date: r.startDate,
          end_date: r.endDate,
          reason: r.reason,
          status: r.status,
          decided_by: r.decidedBy,
          decided_at: r.decidedAt,
          decision_reason: r.decisionReason,
          is_deleted: r.isDeleted,
          created_at: r.createdAt,
        })),
    );
  });

  it("seeded audit log matches fixtures.ts", async () => {
    const seeded = await rows<{
      id: string;
      leave_request_id: string;
      actor_id: string;
      action: string;
    }>(`select id, leave_request_id, actor_id, action from audit_log order by id`);
    expect(seeded).toEqual(
      [...auditLog]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((a) => ({
          id: a.id,
          leave_request_id: a.leaveRequestId,
          actor_id: a.actorId,
          action: a.action,
        })),
    );
  });
});

describe("scoped visibility query shape (US-04)", () => {
  it("returns only a manager's direct reports, excluding soft-deleted rows", async () => {
    const team = async (managerId: string) =>
      (
        await rows<{ user_id: string }>(
          `select distinct r.user_id from leave_requests r
           join users u on u.id = r.user_id
           where u.manager_id = $1 and not r.is_deleted`,
          [managerId],
        )
      )
        .map((r) => r.user_id)
        .sort();
    expect(await team(BEN)).toEqual([USER_IDS.ana, USER_IDS.jordan, USER_IDS.priya].sort());
    expect(await team(USER_IDS.maya)).not.toContain(USER_IDS.ana);
  });
});
