import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  accrualRuns,
  auditLog,
  LEAVE_TYPE_IDS,
  leaveRequests,
  leaveTypes,
  USER_IDS,
  users,
} from "@/lib/data/mock/fixtures";
import { AUDIT_ACTIONS, LEAVE_TYPE_NAMES, REQUEST_STATUSES, ROLES } from "@/lib/data/types";
import { MIGRATION_FILES, MIGRATIONS, migratedDb, SEED } from "./helpers";

/**
 * TASK-010 — schema contract, run against real Postgres 17 (PGlite, in-process).
 * Every migration must keep this suite green; new tables / columns / enum values /
 * invariants get an assertion here in the same PR.
 *
 * NOTE: PGlite has no Supabase `auth` schema or `anon`/`authenticated` roles. A
 * migration that references them (e.g. RLS policies using auth.uid()) needs a
 * shim in `beforeAll` before it can be applied here.
 */

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
  users: ["id", "name", "email", "role", "manager_id", "created_at", "auth_user_id"],
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
  accrual_runs: ["id", "period", "ran_at", "trigger", "users_accrued", "days_accrued", "rates"],
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
  db = await migratedDb();
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
  it("creates exactly the arch tables plus accrual_runs and rate_limits (TASK-025)", async () => {
    const tables = await rows<{ table_name: string }>(
      `select table_name from information_schema.tables where table_schema = 'public' order by 1`,
    );
    expect(tables.map((t) => t.table_name).sort()).toEqual(
      [...ARCH_TABLES, "accrual_runs", "rate_limits"].sort(),
    );
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

  it("has the audit event-log index (TASK-015)", async () => {
    const idx = await rows<{ indexname: string }>(
      `select indexname from pg_indexes where tablename = 'audit_log' and indexname = 'audit_log_occurred_idx'`,
    );
    expect(idx).toHaveLength(1);
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
  it("allows at most one decision audit row per request (TASK-014 backstop)", async () => {
    // r2 (Ana, approved) already has its `approved` audit row in the seed.
    const decided = leaveRequests[1]!.id;
    const err = await attempt(
      `insert into audit_log (leave_request_id, actor_id, action) values ($1, $2, 'rejected')`,
      [decided, BEN],
    );
    expect(err?.code).toBe("23505");
    expect(err?.message).toMatch(/audit_log_one_decision_per_request/);
    // `submitted` rows are outside the invariant.
    expect(
      await attempt(
        `insert into audit_log (leave_request_id, actor_id, action) values ($1, $2, 'submitted')`,
        [decided, ANA],
      ),
    ).toBeNull();
  });

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

  it("seeded accrual runs match fixtures.ts (TASK-017)", async () => {
    const seeded = await rows<{
      period: string;
      ran_at: Date;
      trigger: string;
      users_accrued: number;
      days_accrued: string;
      rates: unknown;
    }>(
      `select period::text, ran_at, trigger, users_accrued, days_accrued::text, rates from accrual_runs order by period`,
    );
    expect(
      seeded.map((r) => ({
        period: r.period,
        ranAt: r.ran_at.toISOString(),
        trigger: r.trigger,
        usersAccrued: r.users_accrued,
        daysAccrued: Number(r.days_accrued),
        rates: r.rates,
      })),
    ).toEqual(accrualRuns);
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

/* ── TASK-018 / US-08 — untracked leave types can never hold balances or policies ── */
describe("US-08 database guard (generic on tracks_balance)", () => {
  const UNPAID = "10000000-0000-4000-8000-000000000003";
  const VACATION_ID = "10000000-0000-4000-8000-000000000001";
  const STUDY = "10000000-0000-4000-8000-000000000004"; // a NEW untracked type

  const expectGuard = (err: { code?: string; message: string } | null, constraint: string) => {
    expect(err?.code).toBe("23514");
    expect(err && ((err as { constraint?: string }).constraint ?? "")).toBe(constraint);
  };

  it.each([
    [
      "insert an Unpaid balance",
      `insert into leave_balances (user_id, leave_type_id, balance) values ($1, '${UNPAID}', 1)`,
    ],
    [
      "insert an Unpaid policy",
      `insert into leave_policies (user_id, leave_type_id, accrual_per_month) values ($1, '${UNPAID}', 1)`,
    ],
    [
      "move an existing balance onto Unpaid",
      `update leave_balances set leave_type_id = '${UNPAID}' where user_id = $1 and leave_type_id = '${VACATION_ID}'`,
    ],
  ])("rejects: %s", async (_l, statement) => {
    expectGuard(await attempt(statement, [ANA]), "leave_type_must_track_balance");
  });

  it("is generic: a brand-new untracked type is rejected the same way, with no code change", async () => {
    await db.exec("begin");
    try {
      await db.query(
        `insert into leave_types (id, name, tracks_balance) values ($1, 'Study leave', false)`,
        [STUDY],
      );
      const err = await db
        .query(`insert into leave_balances (user_id, leave_type_id, balance) values ($1, $2, 1)`, [
          ANA,
          STUDY,
        ])
        .then(
          () => null,
          (e: { code?: string; message: string; constraint?: string }) => e,
        );
      expectGuard(err, "leave_type_must_track_balance");
    } finally {
      await db.exec("rollback");
    }
  });

  it("a type with balances or policies cannot stop tracking balances", async () => {
    expectGuard(
      await attempt(`update leave_types set tracks_balance = false where id = $1`, [VACATION_ID]),
      "leave_type_has_balances",
    );
  });

  it("tracked writes still work, and an empty untracked type may still be created", async () => {
    expect(
      await attempt(
        `update leave_balances set balance = balance + 1 where user_id = $1 and leave_type_id = $2`,
        [ANA, VACATION_ID],
      ),
    ).toBeNull();
    expect(
      await attempt(
        `insert into leave_types (id, name, tracks_balance) values ($1, 'Study leave', false)`,
        [STUDY],
      ),
    ).toBeNull();
  });

  it("the type check locks the leave_types row (FOR SHARE) so it serialises with a concurrent flip", async () => {
    const [fn] = await rows<{ src: string }>(
      `select prosrc src from pg_proc where proname = 'enforce_tracked_leave_type'`,
    );
    expect(fn?.src.replace(/\s+/g, " ").toLowerCase()).toMatch(
      /where t\.id = new\.leave_type_id for share/,
    );
  });

  it.each([
    ["flip first, then insert", ["flip", "insert"]],
    ["insert first, then flip", ["insert", "flip"]],
  ])("flip vs insert (%s): exactly one succeeds and the invariant holds", async (_l, order) => {
    const STUDY_TRACKED = "10000000-0000-4000-8000-000000000005";
    await db.exec("begin");
    try {
      await db.query(
        `insert into leave_types (id, name, tracks_balance) values ($1, 'Training', true)`,
        [STUDY_TRACKED],
      );
      const ops = {
        flip: () =>
          db.query(`update leave_types set tracks_balance = false where id = $1`, [STUDY_TRACKED]),
        insert: () =>
          db.query(
            `insert into leave_balances (user_id, leave_type_id, balance) values ($1, $2, 1)`,
            [ANA, STUDY_TRACKED],
          ),
      } as const;
      const results: boolean[] = [];
      for (const op of order as ("flip" | "insert")[]) {
        await db.exec("savepoint s");
        results.push(
          await ops[op]().then(
            async () => {
              await db.exec("release savepoint s");
              return true;
            },
            async () => {
              await db.exec("rollback to savepoint s");
              return false;
            },
          ),
        );
      }
      expect(results.filter(Boolean)).toHaveLength(1);
      const [bad] = await rows<{ n: number }>(
        `select count(*)::int n from leave_balances b join leave_types t on t.id = b.leave_type_id where not t.tracks_balance`,
      );
      expect(bad?.n).toBe(0);
    } finally {
      await db.exec("rollback");
    }
  });
});

describe("US-08 migration pre-check refuses to run on bad existing data", () => {
  it("fails with the pre-check message and leaves the schema without the guard", async () => {
    const GUARD = "20261129000000_untracked_types_guard.sql";
    const pre = await migratedDb({ upTo: GUARD });
    try {
      await pre.exec(SEED);
      await pre.query(
        `insert into leave_balances (user_id, leave_type_id, balance) values ($1, $2, 3)`,
        [ANA, "10000000-0000-4000-8000-000000000003"],
      );
      const guardSql = MIGRATIONS[MIGRATION_FILES.indexOf(GUARD)]!;
      await expect(pre.exec(guardSql)).rejects.toThrow(
        /US-08 pre-check failed: 1 leave_balances and 0 leave_policies/,
      );
      const triggers = await pre.query(
        `select 1 from pg_trigger where tgname = 'leave_balances_tracked_type'`,
      );
      expect(triggers.rows).toHaveLength(0); // nothing was changed
    } finally {
      await pre.close();
    }
  });
});
