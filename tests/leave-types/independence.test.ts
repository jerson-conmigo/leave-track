import type { PGlite } from "@electric-sql/pglite";
import { afterAll, describe, expect, it, vi } from "vitest";
import { memoryAccrualStore } from "@/lib/accrual/memory-store";
import { createPostgresAccrualStore } from "@/lib/accrual/postgres-store";
import { runMonthlyAccrual } from "@/lib/accrual/run";
import { LEAVE_TYPE_IDS, USER_IDS } from "@/lib/data/mock/fixtures";
import { mockRepository } from "@/lib/data/mock/repository";
import { mockDb, resetMockDb } from "@/lib/data/mock/store";
import { createPostgresRepository } from "@/lib/data/postgres-repository";
import type { LeaveRepository } from "@/lib/data/repositories";
import type { LeaveTypeName } from "@/lib/data/types";
import { decideLeaveRequest } from "@/lib/leave-requests/decide";
import { memoryDecideStore, memorySubmitStore } from "@/lib/leave-requests/memory-store";
import {
  createPostgresDecideStore,
  createPostgresSubmitStore,
} from "@/lib/leave-requests/postgres-store";
import type { DecideStore, SubmitStore } from "@/lib/leave-requests/store";
import { submitLeaveRequest } from "@/lib/leave-requests/submit";
import { createTestDb } from "../db/helpers";

/**
 * TASK-018 / US-08 — every balance writer (submit, approve, reject, accrual) touches
 * ONLY the request's own leave type, and untracked types (Unpaid — and any future
 * one, e.g. "Study leave" added here) are never balance-checked, blocked or changed.
 * Runs the same matrix on the Postgres store (PGlite) and the in-memory store.
 */
const { Vacation, Sick, Unpaid } = LEAVE_TYPE_IDS;
const STUDY = "10000000-0000-4000-8000-000000000009"; // a NEW untracked type
const TYPES = [
  { id: Vacation, name: "Vacation", tracked: true },
  { id: Sick, name: "Sick", tracked: true },
  { id: Unpaid, name: "Unpaid", tracked: false },
  { id: STUDY, name: "Study leave", tracked: false },
] as const;
const ANA = { userId: USER_IDS.ana };
const BEN = { userId: USER_IDS.ben, role: "manager" as const };
const notifier = { leaveRequestSubmitted: vi.fn(), leaveRequestDecided: vi.fn() };

type Snapshot = Record<string, number | undefined>;
type Harness = {
  label: string;
  submit: SubmitStore;
  decide: DecideStore;
  accrual: Parameters<typeof runMonthlyAccrual>[0]["store"];
  repo: LeaveRepository;
  snapshot: (userId: string) => Promise<Snapshot>;
  close: () => Promise<void>;
};

const dbs: PGlite[] = [];
afterAll(async () => Promise.all(dbs.map((d) => d.close())));

async function postgresHarness(): Promise<Harness> {
  const { db, sql } = await createTestDb();
  dbs.push(db);
  await db.query(
    `insert into leave_types (id, name, tracks_balance) values ($1, 'Study leave', false)`,
    [STUDY],
  );
  return {
    label: "postgres",
    submit: createPostgresSubmitStore(sql),
    decide: createPostgresDecideStore(sql),
    accrual: createPostgresAccrualStore(sql),
    repo: createPostgresRepository(sql),
    snapshot: async (userId) => {
      const rows = (
        await db.query<{ leave_type_id: string; balance: string }>(
          `select leave_type_id, balance::text from leave_balances where user_id = $1`,
          [userId],
        )
      ).rows;
      return Object.fromEntries(
        TYPES.map((t) => [
          t.name,
          rows.find((r) => r.leave_type_id === t.id)
            ? Number(rows.find((r) => r.leave_type_id === t.id)!.balance)
            : undefined,
        ]),
      );
    },
    close: async () => undefined,
  };
}

async function memoryHarness(): Promise<Harness> {
  resetMockDb();
  mockDb.leaveTypes.push({ id: STUDY, name: "Study leave" as LeaveTypeName, tracksBalance: false });
  return {
    label: "memory",
    submit: memorySubmitStore,
    decide: memoryDecideStore,
    accrual: memoryAccrualStore,
    repo: mockRepository,
    snapshot: async (userId) =>
      Object.fromEntries(
        TYPES.map((t) => [
          t.name,
          mockDb.leaveBalances.find((b) => b.userId === userId && b.leaveTypeId === t.id)?.balance,
        ]),
      ),
    close: async () => undefined,
  };
}

const HARNESSES = [postgresHarness, memoryHarness];

const submit = (h: Harness, leaveTypeId: string, startDate: string, endDate: string) =>
  submitLeaveRequest(
    ANA,
    { leaveTypeId, startDate, endDate, reason: "Independence test" },
    { store: h.submit, notifier },
  );
const decide = (h: Harness, id: string, body: unknown) =>
  decideLeaveRequest(BEN, id, body, { store: h.decide, notifier });

describe.each(HARNESSES.map((f) => [f.name.replace("Harness", ""), f]))(
  "US-08 on the %s store",
  (_label, makeHarness) => {
    it("AC1 — approving a Sick request decrements only Sick; Vacation and Unpaid unchanged", async () => {
      const h = await makeHarness();
      const before = await h.snapshot(USER_IDS.ana);
      const { request } = await submit(h, Sick, "2027-03-01", "2027-03-02"); // 2 days
      await decide(h, request.id, { decision: "approve" });
      const after = await h.snapshot(USER_IDS.ana);
      expect(after.Sick).toBe(before.Sick! - 2);
      expect(after.Vacation).toBe(before.Vacation);
      expect(after.Unpaid).toBeUndefined(); // still no Unpaid balance at all
      expect(after["Study leave"]).toBeUndefined();
    });

    it("AC2 — Unpaid is never blocked by a balance check: 92 days, nothing accrued, still submitted and approved", async () => {
      const h = await makeHarness();
      const before = await h.snapshot(USER_IDS.ana);
      const res = await submit(h, Unpaid, "2027-05-01", "2027-07-31"); // 92 days
      expect(res.request).toMatchObject({ status: "pending", leaveType: "Unpaid", days: 92 });
      expect(res.warnings).toEqual([]);
      const decided = await decide(h, res.request.id, { decision: "approve" });
      expect(decided.request.status).toBe("approved");
      expect(decided.warnings).toEqual([]); // no NEGATIVE_BALANCE for an untracked type
      expect(await h.snapshot(USER_IDS.ana)).toEqual(before);
    });

    it.each(TYPES.map((t) => [t.name, t]))(
      "matrix — %s: submit / approve / reject touch only that type; untracked never warned, blocked or changed",
      async (_n, type) => {
        const h = await makeHarness();
        const start = await h.snapshot(USER_IDS.ana);

        // (a) submit, deliberately above any balance (12 days)
        const sub = await submit(h, type.id, "2027-05-03", "2027-05-14");
        expect(sub.request.status).toBe("pending"); // never blocked
        expect(await h.snapshot(USER_IDS.ana)).toEqual(start); // submit writes no balance
        expect(sub.warnings.map((w) => w.code)).toEqual(type.tracked ? ["EXCEEDS_BALANCE"] : []);

        // (b) approve → only this type changes, by exactly −12, and only if tracked
        const dec = await decide(h, sub.request.id, { decision: "approve" });
        const afterApprove = await h.snapshot(USER_IDS.ana);
        for (const t of TYPES) {
          if (t.id === type.id && t.tracked) expect(afterApprove[t.name]).toBe(start[t.name]! - 12);
          else expect(afterApprove[t.name]).toBe(start[t.name]);
        }
        expect(dec.warnings.length > 0).toBe(type.tracked && start[type.name]! - 12 < 0);

        // (c) reject another request of the same type → nothing changes
        const sub2 = await submit(h, type.id, "2027-06-07", "2027-06-08");
        await decide(h, sub2.request.id, { decision: "reject", reason: "Team coverage that week" });
        expect(await h.snapshot(USER_IDS.ana)).toEqual(afterApprove);
      },
    );

    it("matrix — monthly accrual credits only tracked types, each by its own rate; untracked never get a row", async () => {
      const h = await makeHarness();
      const before = await h.snapshot(USER_IDS.ana);
      await runMonthlyAccrual(
        { store: h.accrual },
        { trigger: "manual", now: new Date("2026-12-02T00:00:00Z") },
      );
      const after = await h.snapshot(USER_IDS.ana);
      expect(after.Vacation).toBe(before.Vacation! + 1.25);
      expect(after.Sick).toBe(before.Sick! + 1);
      expect(after.Unpaid).toBeUndefined();
      expect(after["Study leave"]).toBeUndefined();
    });

    it("the balance view reports untracked types as not tracked (generic: Unpaid and the new type)", async () => {
      const h = await makeHarness();
      const balances = await h.repo.getBalances(USER_IDS.ana);
      for (const name of ["Unpaid", "Study leave"]) {
        expect(balances.find((b) => b.leaveType.name === name)).toMatchObject({
          confirmed: null,
          available: null,
          asOf: null,
        });
      }
    });
  },
);

describe("memory store has no DB guard — its own filter must still skip untracked types", () => {
  it("an Unpaid / new-type policy that slipped into the mock data is never accrued", async () => {
    const h = await memoryHarness();
    for (const leaveTypeId of [Unpaid, STUDY]) {
      mockDb.leavePolicies.push({
        id: crypto.randomUUID(),
        userId: USER_IDS.ana,
        leaveTypeId,
        accrualPerMonth: 2,
      });
    }
    await runMonthlyAccrual(
      { store: h.accrual },
      { trigger: "manual", now: new Date("2026-12-02T00:00:00Z") },
    );
    const after = await h.snapshot(USER_IDS.ana);
    expect(after.Unpaid).toBeUndefined();
    expect(after["Study leave"]).toBeUndefined();
  });
});

describe("parity — the full scripted sequence leaves both stores identical", () => {
  it("same balances for Ana after AC1 + AC2 + an accrual, on Postgres and memory", async () => {
    const run = async (h: Harness) => {
      const a = await submit(h, Sick, "2027-03-01", "2027-03-02");
      await decide(h, a.request.id, { decision: "approve" });
      const b = await submit(h, Unpaid, "2027-05-01", "2027-07-31");
      await decide(h, b.request.id, { decision: "approve" });
      await runMonthlyAccrual(
        { store: h.accrual },
        { trigger: "manual", now: new Date("2026-12-02T00:00:00Z") },
      );
      return (await h.repo.getBalances(USER_IDS.ana)).map(({ asOf: _a, ...rest }) => rest);
    };
    const pg = await run(await postgresHarness());
    const mem = await run(await memoryHarness());
    expect(mem).toEqual(pg);
  });
});
