import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { LEAVE_TYPE_IDS, users, USER_IDS } from "@/lib/data/mock/fixtures";
import { mockRepository } from "@/lib/data/mock/repository";
import { createPostgresRepository } from "@/lib/data/postgres-repository";
import type { LeaveRepository } from "@/lib/data/repositories";
import { createTestDb } from "../db/helpers";

/**
 * TASK-012 — Postgres reads against real Postgres (PGlite) with the seed.
 * The seed mirrors fixtures.ts, so the Postgres and mock repositories must agree
 * exactly (parity guard). Fresh DB per test → order-independent.
 */
const ACCRUAL_AT = "2026-11-01T02:00:00.000Z";
const { Vacation, Sick } = LEAVE_TYPE_IDS;

let db: PGlite;
let repo: LeaveRepository;
let fallback: LeaveRepository;
const dbs: PGlite[] = [];

beforeEach(async () => {
  const t = await createTestDb();
  db = t.db;
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
  it("team, audit, policies and stats come from the fallback", async () => {
    await repo.listTeamRequests(USER_IDS.ben, { status: "pending" });
    await repo.listAudit({ employeeId: USER_IDS.ana });
    await repo.listPolicies();
    await repo.getOrgStats();
    expect(fallback.listTeamRequests).toHaveBeenCalledWith(USER_IDS.ben, { status: "pending" });
    expect(fallback.listAudit).toHaveBeenCalledWith({ employeeId: USER_IDS.ana });
    expect(fallback.listPolicies).toHaveBeenCalled();
    expect(fallback.getOrgStats).toHaveBeenCalled();
  });
});
