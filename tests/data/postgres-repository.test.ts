import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { LEAVE_TYPE_IDS, users, USER_IDS } from "@/lib/data/mock/fixtures";
import { mockRepository } from "@/lib/data/mock/repository";
import { createPostgresRepository } from "@/lib/data/postgres-repository";
import type { LeaveRepository } from "@/lib/data/repositories";
import type { SqlClient } from "@/lib/db/sql";
import { createTestDb } from "../db/helpers";

/**
 * TASK-012 — Postgres reads against real Postgres (PGlite) with the seed.
 * The seed mirrors fixtures.ts, so the Postgres and mock repositories must agree
 * exactly (parity guard). Fresh DB per test → order-independent.
 */
const ACCRUAL_AT = "2026-11-01T02:00:00.000Z";
const { Vacation, Sick } = LEAVE_TYPE_IDS;

let db: PGlite;
let sql: SqlClient;
let repo: LeaveRepository;
let fallback: LeaveRepository;
const dbs: PGlite[] = [];

beforeEach(async () => {
  const t = await createTestDb();
  db = t.db;
  sql = t.sql;
  dbs.push(db);
  fallback = {
    ...mockRepository,
    listTeamRequests: vi.fn().mockResolvedValue([]),
    listAudit: vi.fn().mockResolvedValue([]),
    listPolicies: vi.fn().mockResolvedValue([]),
    getOrgStats: vi
      .fn()
      .mockResolvedValue({ pendingCount: 0, approvedThisMonth: 0, employeeCount: 0 }),
  };
  repo = createPostgresRepository(t.sql, fallback);
});

afterAll(async () => {
  await Promise.all(dbs.map((d) => d.close()));
});

const insertPending = (userId: string, leaveTypeId: string, start: string, end: string) =>
  db.query<{ id: string }>(
    `insert into leave_requests (user_id, leave_type_id, start_date, end_date, reason)
     values ($1, $2, $3, $4, 'test') returning id`,
    [userId, leaveTypeId, start, end],
  );

describe("AC1 — current balance per leave type, as of the last accrual run", () => {
  it("returns Vacation / Sick / Unpaid with the seeded confirmed balances", async () => {
    const balances = await repo.getBalances(USER_IDS.ana);
    expect(balances.map((b) => [b.leaveType.name, b.confirmed, b.accrualPerMonth])).toEqual([
      ["Vacation", 11.25, 1.25],
      ["Sick", 5, 1],
      ["Unpaid", null, null],
    ]);
  });

  it("dates tracked balances by the latest accrual_runs.ran_at", async () => {
    const balances = await repo.getBalances(USER_IDS.ana);
    expect(balances.map((b) => b.asOf)).toEqual([ACCRUAL_AT, ACCRUAL_AT, null]);
    await db.query(
      `insert into accrual_runs (period, ran_at) values ('2026-12-01', '2026-12-01T02:00:00Z')`,
    );
    expect((await repo.getBalances(USER_IDS.ana))[0]?.asOf).toBe("2026-12-01T02:00:00.000Z");
  });

  it("is not fooled by balance.updated_at changing (e.g. an approval decrement)", async () => {
    await db.query(
      `update leave_balances set updated_at = '2026-11-20T10:00:00Z', balance = 10 where user_id = $1 and leave_type_id = $2`,
      [USER_IDS.ana, Vacation],
    );
    const [vac] = await repo.getBalances(USER_IDS.ana);
    expect(vac).toMatchObject({ confirmed: 10, asOf: ACCRUAL_AT });
  });

  it("reports asOf null when no accrual has ever run", async () => {
    const fresh = await createTestDb();
    dbs.push(fresh.db);
    await fresh.db.exec(`truncate accrual_runs`);
    const balances = await createPostgresRepository(fresh.sql, fallback).getBalances(USER_IDS.ana);
    expect(balances.map((b) => b.asOf)).toEqual([null, null, null]);
  });
});

describe("AC2 — pending amounts shown separately from the confirmed balance", () => {
  it("keeps Ana's pending Vacation separate and undeducted", async () => {
    const [vac, sick] = await repo.getBalances(USER_IDS.ana);
    expect(vac).toMatchObject({ confirmed: 11.25, pending: 11, available: 0.25 });
    // Ana's approved Sick request (Oct 6–7) is NOT pending.
    expect(sick).toMatchObject({ confirmed: 5, pending: 0, available: 5 });
  });

  it("ignores approved and rejected requests", async () => {
    // Priya: Vacation rejected (5 days) → nothing pending.
    const [vac] = await repo.getBalances(USER_IDS.priya);
    expect(vac).toMatchObject({ confirmed: 15, pending: 0, available: 15 });
  });

  it("picks up a newly submitted pending request and drops a soft-deleted one", async () => {
    const [{ id }] = (await insertPending(USER_IDS.ana, Sick, "2027-03-01", "2027-03-02")).rows as [
      { id: string },
    ];
    expect((await repo.getBalances(USER_IDS.ana))[1]).toMatchObject({ pending: 2, available: 3 });
    await db.query(`update leave_requests set is_deleted = true where id = $1`, [id]);
    expect((await repo.getBalances(USER_IDS.ana))[1]).toMatchObject({ pending: 0, available: 5 });
  });
});

describe("listMyRequests", () => {
  it("returns only the user's own, non-deleted requests, newest first, with the decider's name", async () => {
    const mine = await repo.listMyRequests(USER_IDS.ana);
    expect(mine.map((r) => r.reason)).toEqual([
      "Year-end holiday with family",
      "Flu",
      "Summer trip",
    ]);
    expect(mine[1]).toMatchObject({
      status: "approved",
      decidedByName: "Ben Ortiz",
      days: 2,
      leaveType: "Sick",
    });
    await db.query(`update leave_requests set is_deleted = true where reason = 'Flu'`);
    expect((await repo.listMyRequests(USER_IDS.ana)).map((r) => r.reason)).not.toContain("Flu");
  });
});

describe("parity guard — Postgres and mock repositories agree on the seed", () => {
  it.each(users.map((u) => [u.name, u.id]))(
    "%s: getBalances and listMyRequests match",
    async (_name, id) => {
      expect(await repo.getBalances(id)).toEqual(await mockRepository.getBalances(id));
      expect(await repo.listMyRequests(id)).toEqual(await mockRepository.listMyRequests(id));
    },
  );

  it("users and leave types match", async () => {
    expect(await repo.listUsers()).toEqual(await mockRepository.listUsers());
    expect(await repo.listLeaveTypes()).toEqual(await mockRepository.listLeaveTypes());
    expect(await repo.getUserById(USER_IDS.ben)).toEqual(
      await mockRepository.getUserById(USER_IDS.ben),
    );
    expect(await repo.getUserById("00000000-0000-4000-8000-000000000999")).toBeNull();
  });
});

describe("not-yet-migrated reads delegate to the fallback (backlog B13)", () => {
  it("audit, policies and stats come from the fallback; the team queue does NOT", async () => {
    await repo.listTeamRequests(USER_IDS.ben, { status: "pending" });
    await repo.listAudit({ employeeId: USER_IDS.ana });
    await repo.listPolicies();
    await repo.getOrgStats();
    expect(fallback.listTeamRequests).not.toHaveBeenCalled();
    expect(fallback.listAudit).toHaveBeenCalledWith({ employeeId: USER_IDS.ana });
    expect(fallback.listPolicies).toHaveBeenCalled();
    expect(fallback.getOrgStats).toHaveBeenCalled();
  });
});

/* ── TASK-013 — manager queue scoped to direct reports (US-04, BR-02) ───────── */

const MIA = "00000000-0000-4000-8000-000000000013";
const MIA_REPORTS = [201, 202, 203, 204, 205].map((n) => `00000000-0000-4000-8000-000000000${n}`);
const ids = (rows: { employee: { id: string } }[]) =>
  [...new Set(rows.map((r) => r.employee.id))].sort();

async function seedMiasTeam() {
  await db.query(
    `insert into users (id, name, email, role, manager_id) values ($1, 'Mia Park', 'mia@leavetrack.test', 'manager', $2)`,
    [MIA, USER_IDS.carla],
  );
  for (const [i, id] of MIA_REPORTS.entries()) {
    await db.query(
      `insert into users (id, name, email, role, manager_id) values ($1, $2, $3, 'employee', $4)`,
      [id, `Report ${i + 1}`, `report${i + 1}@leavetrack.test`, MIA],
    );
    await db.query(
      `insert into leave_balances (user_id, leave_type_id, balance) values ($1, $2, 10)`,
      [id, Vacation],
    );
    await insertPending(id, Vacation, `2027-0${(i % 9) + 1}-01`, `2027-0${(i % 9) + 1}-02`);
  }
  // One report also has an already-approved request.
  await db.query(
    `insert into leave_requests (user_id, leave_type_id, start_date, end_date, reason, status, decided_by, decided_at)
     values ($1, $2, '2026-06-01', '2026-06-01', 'old', 'approved', $3, now())`,
    [MIA_REPORTS[0], Sick, MIA],
  );
  // Decoys that must never appear in Mia's queue: Mia's OWN request, and one of Ben's employees.
  await insertPending(MIA, Vacation, "2027-08-01", "2027-08-02");
  await insertPending(USER_IDS.ana, Sick, "2027-08-03", "2027-08-03");
}

describe("TASK-013 AC1 — a manager with 5 direct reports sees exactly those 5, no others", () => {
  it("returns every pending request of exactly the 5 reports — not her own, not another team's", async () => {
    await seedMiasTeam();
    const queue = await repo.listTeamRequests(MIA, { status: "pending" });
    expect(ids(queue)).toEqual([...MIA_REPORTS].sort());
    expect(queue).toHaveLength(5);
    expect(queue.every((r) => r.status === "pending")).toBe(true);
    expect(queue.some((r) => r.employee.id === MIA)).toBe(false);
  });

  it("status=all adds decided requests, still only the 5 reports", async () => {
    await seedMiasTeam();
    const all = await repo.listTeamRequests(MIA);
    expect(ids(all)).toEqual([...MIA_REPORTS].sort());
    expect(all).toHaveLength(6);
    expect(all.filter((r) => r.status === "approved")).toHaveLength(1);
  });

  it("a manager never sees another team (Ben vs Maya on the seed)", async () => {
    const ben = ids(await repo.listTeamRequests(USER_IDS.ben));
    const maya = ids(await repo.listTeamRequests(USER_IDS.maya));
    expect(
      ben.every((id) => [USER_IDS.ana, USER_IDS.jordan, USER_IDS.priya].includes(id as never)),
    ).toBe(true);
    expect(
      maya.every((id) => [USER_IDS.sam, USER_IDS.lena, USER_IDS.diego].includes(id as never)),
    ).toBe(true);
    expect(ben.filter((id) => maya.includes(id))).toEqual([]);
    // An employee has no reports → empty queue.
    expect(await repo.listTeamRequests(USER_IDS.ana)).toEqual([]);
  });

  it("excludes soft-deleted requests", async () => {
    const before = await repo.listTeamRequests(USER_IDS.ben, { status: "pending" });
    await db.query(`update leave_requests set is_deleted = true where id = $1`, [before[0]!.id]);
    const after = await repo.listTeamRequests(USER_IDS.ben, { status: "pending" });
    expect(after.map((r) => r.id)).not.toContain(before[0]!.id);
    expect(after).toHaveLength(before.length - 1);
  });
});

describe("TASK-013 AC2 — an org-chart change moves pending requests to the new manager", () => {
  it("moves Jordan's pending requests from Ben's queue to Maya's, and back", async () => {
    const jordanIn = async (m: string) =>
      (await repo.listTeamRequests(m, { status: "pending" })).filter(
        (r) => r.employee.id === USER_IDS.jordan,
      );
    const jordansPending = (await jordanIn(USER_IDS.ben)).map((r) => r.id).sort();
    expect(jordansPending).toHaveLength(2);
    expect(await jordanIn(USER_IDS.maya)).toEqual([]);

    await db.query(`update users set manager_id = $1 where id = $2`, [
      USER_IDS.maya,
      USER_IDS.jordan,
    ]);
    expect(await jordanIn(USER_IDS.ben)).toEqual([]);
    expect((await jordanIn(USER_IDS.maya)).map((r) => r.id).sort()).toEqual(jordansPending);
    // Nothing else changed in Ben's queue: only Ana remains pending (Priya's request was rejected).
    expect(ids(await repo.listTeamRequests(USER_IDS.ben, { status: "pending" }))).toEqual([
      USER_IDS.ana,
    ]);

    await db.query(`update users set manager_id = $1 where id = $2`, [
      USER_IDS.ben,
      USER_IDS.jordan,
    ]);
    expect((await jordanIn(USER_IDS.ben)).map((r) => r.id).sort()).toEqual(jordansPending);
  });
});

describe("TASK-013 — scoping is enforced IN SQL, not in application code (BR-02)", () => {
  it("every statement listTeamRequests sends filters on u.manager_id = $1 with the manager id", async () => {
    const seen: { text: string; params: readonly unknown[] }[] = [];
    const recording: SqlClient = {
      query: (text, params = []) => {
        seen.push({ text, params });
        return sql.query(text, params);
      },
      transaction: sql.transaction,
    };
    await createPostgresRepository(recording, fallback).listTeamRequests(USER_IDS.ben, {
      status: "pending",
    });
    expect(seen.length).toBeGreaterThan(0);
    for (const q of seen) {
      expect(q.text).toMatch(/where\s+u\.manager_id\s*=\s*\$1/i);
      expect(q.params[0]).toBe(USER_IDS.ben);
    }
  });
});

describe("TASK-013 — balance hint per queued request", () => {
  it("excludes the request under review from the deduction (Jordan: 6.5 for his 5-day request)", async () => {
    const queue = await repo.listTeamRequests(USER_IDS.ben, { status: "pending" });
    const vac = queue.find((r) => r.employee.id === USER_IDS.jordan && r.leaveType === "Vacation");
    expect(vac?.balanceAvailable).toBe(6.5);
    const unpaid = queue.find((r) => r.leaveType === "Unpaid");
    expect(unpaid?.balanceAvailable).toBeNull();
  });

  it("treats a tracked type with no balance row as 0", async () => {
    await seedMiasTeam();
    await db.query(`delete from leave_balances where user_id = $1`, [MIA_REPORTS[1]]);
    const queue = await repo.listTeamRequests(MIA, { status: "pending" });
    expect(queue.find((r) => r.employee.id === MIA_REPORTS[1])?.balanceAvailable).toBe(0);
  });
});

describe("TASK-013 parity guard — Postgres queue equals the mock queue on the seed", () => {
  it.each(users.map((u) => [u.name, u.id]))(
    "%s: listTeamRequests (pending and all) match",
    async (_name, id) => {
      expect(await repo.listTeamRequests(id, { status: "pending" })).toEqual(
        await mockRepository.listTeamRequests(id, { status: "pending" }),
      );
      expect(await repo.listTeamRequests(id)).toEqual(await mockRepository.listTeamRequests(id));
    },
  );
});
