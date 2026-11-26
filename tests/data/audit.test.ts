import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { leaveRequests, users, USER_IDS } from "@/lib/data/mock/fixtures";
import { mockRepository } from "@/lib/data/mock/repository";
import { createPostgresRepository } from "@/lib/data/postgres-repository";
import type { LeaveRepository } from "@/lib/data/repositories";
import { AUDIT_LOG_LIMIT } from "@/lib/data/types";
import type { SqlClient } from "@/lib/db/sql";
import { createTestDb } from "../db/helpers";

/**
 * TASK-015 / US-05 — HR audit report against real Postgres (PGlite) with the seed.
 * Compliance-critical: AC2 must prove BOTH halves — excluded from the report AND
 * still present in the table. Fresh DB per test → order-independent.
 */
const req = (n: number) => `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const VACATION = "10000000-0000-4000-8000-000000000001";

let db: PGlite;
let sql: SqlClient;
let repo: LeaveRepository;
const dbs: PGlite[] = [];

beforeEach(async () => {
  ({ db, sql } = await createTestDb());
  dbs.push(db);
  repo = createPostgresRepository(sql);
});
afterAll(async () => Promise.all(dbs.map((d) => d.close())));

async function insertOldRequest() {
  // Created and approved 3+ years ago (BR-04 retention window).
  const [r] = (
    await db.query<{ id: string }>(
      `insert into leave_requests (user_id, leave_type_id, start_date, end_date, reason, status,
                                   decided_by, decided_at, created_at)
       values ($1, $2, '2023-06-05', '2023-06-09', 'Old trip', 'approved', $3,
               '2023-05-21T09:00:00Z', '2023-05-20T09:00:00Z')
       returning id`,
      [USER_IDS.ana, VACATION, USER_IDS.ben],
    )
  ).rows;
  await db.query(
    `insert into audit_log (leave_request_id, actor_id, action, occurred_at) values
       ($1, $2, 'submitted', '2023-05-20T09:00:00Z'), ($1, $3, 'approved', '2023-05-21T09:00:00Z')`,
    [r!.id, USER_IDS.ana, USER_IDS.ben],
  );
  return r!.id;
}

describe("AC1 — any employee's history: every request with status, decided_by, decided_at", () => {
  it.each(users.map((u) => [u.name, u.id]))(
    "%s: every non-deleted request is present with its decision fields",
    async (_n, id) => {
      const history = await repo.getEmployeeAuditHistory(id);
      const expected = leaveRequests
        .filter((r) => r.userId === id)
        .map((r) => r.id)
        .sort();
      expect(history?.requests.map((r) => r.id).sort()).toEqual(expected);
      for (const r of history!.requests) {
        const fixture = leaveRequests.find((f) => f.id === r.id)!;
        expect(r.status).toBe(fixture.status);
        expect(r.decidedBy?.id ?? null).toBe(fixture.decidedBy);
        expect(r.decidedAt).toBe(fixture.decidedAt);
        expect(r.decisionReason).toBe(fixture.decisionReason);
      }
    },
  );

  it("includes the decision-maker's name and the full event trail", async () => {
    const ana = await repo.getEmployeeAuditHistory(USER_IDS.ana);
    expect(ana?.employee).toMatchObject({
      name: "Ana Reyes",
      role: "employee",
      managerName: "Ben Ortiz",
    });
    const flu = ana!.requests.find((r) => r.id === req(2))!;
    expect(flu).toMatchObject({
      status: "approved",
      decidedBy: { id: USER_IDS.ben, name: "Ben Ortiz" },
    });
    expect(flu.events.map((e) => [e.action, e.actorName])).toEqual([
      ["submitted", "Ana Reyes"],
      ["approved", "Ben Ortiz"],
    ]);
  });

  it("goes back 3+ years with no default date cap (BR-04)", async () => {
    const old = await insertOldRequest();
    const ana = await repo.getEmployeeAuditHistory(USER_IDS.ana);
    const rec = ana!.requests.find((r) => r.id === old);
    expect(rec).toMatchObject({
      status: "approved",
      decidedAt: "2023-05-21T09:00:00.000Z",
      decidedBy: { id: USER_IDS.ben, name: "Ben Ortiz" },
    });
    expect(rec!.events).toHaveLength(2);
    expect(ana!.requests.at(-1)?.id).toBe(old); // newest first → oldest last
  });

  it("returns null for an unknown employee", async () => {
    expect(await repo.getEmployeeAuditHistory("00000000-0000-4000-8000-000000000999")).toBeNull();
  });

  it("returns the employee with an empty list when they have no requests", async () => {
    expect((await repo.getEmployeeAuditHistory(USER_IDS.carla))?.requests).toEqual([]);
  });
});

describe("AC2 — soft-deleted records are excluded, but still exist (no purge)", () => {
  it("drops a soft-deleted request from the history and the event log, while the row and its audit trail remain", async () => {
    const target = req(3); // Ana's approved Summer trip
    expect((await repo.getEmployeeAuditHistory(USER_IDS.ana))!.requests.map((r) => r.id)).toContain(
      target,
    );
    await db.query(`update leave_requests set is_deleted = true where id = $1`, [target]);

    // Excluded from the report…
    expect(
      (await repo.getEmployeeAuditHistory(USER_IDS.ana))!.requests.map((r) => r.id),
    ).not.toContain(target);
    expect((await repo.listAudit({})).map((e) => e.requestId)).not.toContain(target);
    expect(
      (await repo.listAudit({ employeeId: USER_IDS.ana })).map((e) => e.requestId),
    ).not.toContain(target);

    // …but preserved in the table, with its full audit history.
    const [row] = (
      await db.query<{ is_deleted: boolean; status: string }>(
        `select is_deleted, status::text from leave_requests where id = $1`,
        [target],
      )
    ).rows;
    expect(row).toEqual({ is_deleted: true, status: "approved" });
    const trail = (
      await db.query<{ action: string }>(
        `select action::text from audit_log where leave_request_id = $1 order by occurred_at`,
        [target],
      )
    ).rows.map((r) => r.action);
    expect(trail).toEqual(["submitted", "approved"]);

    // …and there is no purge path: hard deletes are rejected by the database.
    await expect(db.query(`delete from leave_requests where id = $1`, [target])).rejects.toThrow(
      /Hard delete is not allowed/,
    );
    await expect(
      db.query(`delete from audit_log where leave_request_id = $1`, [target]),
    ).rejects.toThrow(/Hard delete is not allowed/);
  });

  it("every audit statement filters soft-deleted requests in SQL", async () => {
    const seen: string[] = [];
    const recording: SqlClient = {
      query: (t, p = []) => {
        seen.push(t);
        return sql.query(t, p);
      },
      transaction: sql.transaction,
    };
    const r = createPostgresRepository(recording);
    await r.listAudit({});
    await r.getEmployeeAuditHistory(USER_IDS.ana);
    const touchingRequests = seen.filter((t) =>
      /from leave_requests r|join leave_requests r/i.test(t),
    );
    expect(touchingRequests.length).toBeGreaterThanOrEqual(2);
    for (const t of touchingRequests) expect(t).toMatch(/not r\.is_deleted/);
  });
});

describe("date filters — identical UTC semantics in Postgres and mock", () => {
  it("listAudit from/to are inclusive on the UTC date of occurredAt", async () => {
    // Seed events on 2026-11-19: Lena 06:55 + 08:10 (submitted/approved), Jordan 11:05.
    const day = await repo.listAudit({ from: "2026-11-19", to: "2026-11-19" });
    expect(day.length).toBeGreaterThan(0);
    expect(day.every((e) => e.occurredAt.startsWith("2026-11-19"))).toBe(true);
  });

  it("a timestamp at 23:30 UTC belongs to that UTC day, not the next (boundary)", async () => {
    await db.query(`set time zone 'Pacific/Auckland'`); // session TZ must not matter
    const [fresh] = (
      await db.query<{ id: string }>(
        `insert into leave_requests (user_id, leave_type_id, start_date, end_date, reason, created_at)
         values ($1, $2, '2027-01-11', '2027-01-11', 'Boundary', '2026-11-25T23:30:00Z') returning id`,
        [USER_IDS.diego, VACATION],
      )
    ).rows;
    await db.query(
      `insert into audit_log (leave_request_id, actor_id, action, occurred_at)
       values ($1, $2, 'submitted', '2026-11-25T23:30:00Z')`,
      [fresh!.id, USER_IDS.diego],
    );
    const on25 = (await repo.listAudit({ from: "2026-11-25", to: "2026-11-25" })).map(
      (e) => e.requestId,
    );
    const on26 = (await repo.listAudit({ from: "2026-11-26", to: "2026-11-26" })).map(
      (e) => e.requestId,
    );
    expect(on25).toContain(fresh!.id);
    expect(on26).not.toContain(fresh!.id);
    const hist25 = await repo.getEmployeeAuditHistory(USER_IDS.diego, {
      from: "2026-11-25",
      to: "2026-11-25",
    });
    const hist26 = await repo.getEmployeeAuditHistory(USER_IDS.diego, { from: "2026-11-26" });
    expect(hist25!.requests.map((r) => r.id)).toEqual([fresh!.id]);
    expect(hist26!.requests.map((r) => r.id)).not.toContain(fresh!.id);
  });

  it.each([
    ["no filter", {}],
    ["one employee", { employeeId: USER_IDS.ana }],
    ["a date range", { from: "2026-11-01", to: "2026-11-19" }],
    ["employee + range", { employeeId: USER_IDS.jordan, from: "2026-11-19", to: "2026-11-20" }],
    ["open-ended from", { from: "2026-11-15" }],
    ["open-ended to", { to: "2026-10-31" }],
  ])("listAudit parity with the mock: %s", async (_l, filter) => {
    expect(await repo.listAudit(filter)).toEqual(await mockRepository.listAudit(filter));
  });

  it.each([
    ["all time", {}],
    ["Nov 2026", { from: "2026-11-01", to: "2026-11-30" }],
    ["before Nov", { to: "2026-10-31" }],
  ])("history parity with the mock for every seeded user: %s", async (_l, filter) => {
    for (const u of users) {
      expect(await repo.getEmployeeAuditHistory(u.id, filter)).toEqual(
        await mockRepository.getEmployeeAuditHistory(u.id, filter),
      );
    }
  });
});

describe("event log cap (cursor paging: backlog B21)", () => {
  it(`returns at most ${AUDIT_LOG_LIMIT} entries, newest first`, async () => {
    await db.query(
      `insert into audit_log (leave_request_id, actor_id, action, occurred_at)
       select $1::uuid, $2::uuid, 'submitted', timestamptz '2020-01-01' + (g || ' minutes')::interval
         from generate_series(1, $3::int) g`,
      [req(10), USER_IDS.ben, AUDIT_LOG_LIMIT],
    );
    const log = await repo.listAudit({});
    expect(log).toHaveLength(AUDIT_LOG_LIMIT);
    const times = log.map((e) => e.occurredAt);
    expect([...times].sort().reverse()).toEqual(times);
    expect(times[0]! > "2026-01-01").toBe(true); // the real (recent) events win over 2020 filler
  });
});

describe("policies and org stats (B13 closed)", () => {
  it("listPolicies parity with the mock (policy row ids are DB-generated in the seed, so compared without id)", async () => {
    const strip = (rows: { id: string }[]) => rows.map(({ id: _id, ...rest }) => rest);
    expect(strip(await repo.listPolicies())).toEqual(strip(await mockRepository.listPolicies()));
  });

  it.each([
    ["Nov 2026 (Lena, Nov 19)", new Date("2026-11-26T12:00:00Z"), 1],
    ["Oct 2026 (Ana, Oct 6)", new Date("2026-10-15T00:00:00Z"), 1],
    ["Jul 2026 (Summer trip, Jul 21)", new Date("2026-07-31T23:59:59Z"), 1],
    ["Aug 2026 (none — Jul 21 is outside)", new Date("2026-08-01T00:00:00Z"), 0],
    ["Jan 2027 (none)", new Date("2027-01-10T00:00:00Z"), 0],
  ])(
    "getOrgStats uses the real UTC month of `now` — %s, parity with mock",
    async (_l, now, approved) => {
      const pg = await repo.getOrgStats(now);
      expect(pg).toEqual(await mockRepository.getOrgStats(now));
      expect(pg.approvedThisMonth).toBe(approved);
      expect(pg.employeeCount).toBe(9);
    },
  );

  it("employeeCount counts people WITH a leave policy (dashboard label)", async () => {
    await db.query(
      `insert into users (id, name, email, role, manager_id)
       values ('00000000-0000-4000-8000-000000000300', 'No Policy', 'np@leavetrack.test', 'employee', $1)`,
      [USER_IDS.ben],
    );
    expect((await repo.getOrgStats(new Date("2026-11-26T00:00:00Z"))).employeeCount).toBe(9);
  });
});
