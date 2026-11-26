import type { PGlite } from "@electric-sql/pglite";
import { afterAll, describe, expect, it } from "vitest";
import { memoryAccrualStore } from "@/lib/accrual/memory-store";
import { createPostgresAccrualStore } from "@/lib/accrual/postgres-store";
import type { AccrualStore } from "@/lib/accrual/store";
import { runMonthlyAccrual } from "@/lib/accrual/run";
import { users, USER_IDS, LEAVE_TYPE_IDS } from "@/lib/data/mock/fixtures";
import { mockRepository } from "@/lib/data/mock/repository";
import { mockDb, resetMockDb } from "@/lib/data/mock/store";
import { createPostgresRepository } from "@/lib/data/postgres-repository";
import type { LeaveRepository } from "@/lib/data/repositories";
import { createTestDb } from "../db/helpers";

/** TASK-017 — the in-memory dev store accrues exactly like Postgres. */
const SCRIPT = [
  new Date("2026-12-02T02:00:00Z"), // December
  new Date("2026-12-20T02:00:00Z"), // repeat → no-op
  new Date("2027-03-03T02:00:00Z"), // catch-up Jan, Feb, Mar
];

async function runScript(store: AccrualStore) {
  const out = [];
  for (const now of SCRIPT) out.push(await runMonthlyAccrual({ store }, { trigger: "cron", now }));
  return out;
}
const balancesFor = async (repo: LeaveRepository) => {
  const all: Record<string, unknown> = {};
  for (const u of users) {
    all[u.id] = (await repo.getBalances(u.id)).map(({ asOf, ...rest }) => ({
      ...rest,
      hasAsOf: asOf !== null,
    }));
  }
  return all;
};

let db: PGlite | undefined;
afterAll(async () => db?.close());

describe("accrual parity: memory vs Postgres", () => {
  it("same results, balances and ledger for a scripted sequence (incl. a non-trivial rate)", async () => {
    const t = await createTestDb();
    db = t.db;
    resetMockDb();
    // A rate that exposes float drift, applied to both stores.
    await t.db.query(
      `update leave_policies set accrual_per_month = 1.33 where user_id = $1 and leave_type_id = $2`,
      [USER_IDS.ana, LEAVE_TYPE_IDS.Vacation],
    );
    mockDb.leavePolicies.find(
      (p) => p.userId === USER_IDS.ana && p.leaveTypeId === LEAVE_TYPE_IDS.Vacation,
    )!.accrualPerMonth = 1.33;

    const pg = await runScript(createPostgresAccrualStore(t.sql));
    const mem = await runScript(memoryAccrualStore);
    expect(mem).toEqual(pg);
    expect(pg.map((r) => r.accrued.map((a) => a.period))).toEqual([
      ["2026-12-01"],
      [],
      ["2027-01-01", "2027-02-01", "2027-03-01"],
    ]);

    expect(await balancesFor(mockRepository)).toEqual(
      await balancesFor(createPostgresRepository(t.sql)),
    );

    const pgRuns = (
      await t.db.query<{
        period: string;
        trigger: string;
        users_accrued: number;
        days_accrued: string;
        rates: unknown;
      }>(
        `select period::text, trigger, users_accrued, days_accrued::text, rates from accrual_runs order by period`,
      )
    ).rows.map((r) => ({
      period: r.period,
      trigger: r.trigger,
      usersAccrued: r.users_accrued,
      daysAccrued: Number(r.days_accrued),
      rates: r.rates,
    }));
    const memRuns = [...mockDb.accrualRuns]
      .sort((a, b) => a.period.localeCompare(b.period))
      .map(({ ranAt: _r, ...rest }) => rest);
    expect(memRuns).toEqual(pgRuns);
  });

  it("the balance 'as of' date moves to the new run in both stores", async () => {
    resetMockDb();
    const before = (await mockRepository.getBalances(USER_IDS.ana))[0]!.asOf;
    await runMonthlyAccrual({ store: memoryAccrualStore }, { trigger: "cron", now: SCRIPT[0] });
    expect((await mockRepository.getBalances(USER_IDS.ana))[0]!.asOf).not.toBe(before);

    const t = await createTestDb();
    const pgBefore = (await createPostgresRepository(t.sql).getBalances(USER_IDS.ana))[0]!.asOf;
    await runMonthlyAccrual(
      { store: createPostgresAccrualStore(t.sql) },
      { trigger: "cron", now: SCRIPT[0] },
    );
    expect((await createPostgresRepository(t.sql).getBalances(USER_IDS.ana))[0]!.asOf).not.toBe(
      pgBefore,
    );
    await t.db.close();
  });
});

describe("exact decimals in the memory store (inputs verified to drift with floats)", () => {
  // In binary floats: 0.1 + 0.2 = 0.30000000000000004 and 0.1 + 0.2×4 = 0.8999999999999999.
  const V = LEAVE_TYPE_IDS.Vacation;
  const S = LEAVE_TYPE_IDS.Sick;
  const setup = () => {
    resetMockDb();
    mockDb.leavePolicies.splice(0, mockDb.leavePolicies.length);
    mockDb.leavePolicies.push(
      { id: "p1", userId: USER_IDS.ana, leaveTypeId: V, accrualPerMonth: 0.1 },
      { id: "p2", userId: USER_IDS.ana, leaveTypeId: S, accrualPerMonth: 0.2 },
    );
    const bal = (t: string) =>
      mockDb.leaveBalances.find((b) => b.userId === USER_IDS.ana && b.leaveTypeId === t)!;
    bal(V).balance = 0;
    bal(S).balance = 0.1;
    return bal;
  };
  const DEC = new Date("2026-12-02T00:00:00Z"); // 1 month
  const MAR = new Date("2027-03-02T00:00:00Z"); // Dec..Mar = 4 months

  it("one month: 0.10 + 0.20 = 0.30 exactly; days_accrued 0.1 + 0.2 = 0.3 exactly", async () => {
    expect(0.1 + 0.2).not.toBe(0.3); // the inputs really do drift
    const bal = setup();
    const res = await runMonthlyAccrual(
      { store: memoryAccrualStore },
      { trigger: "manual", now: DEC },
    );
    expect(bal(S).balance).toBe(0.3);
    expect(res.accrued[0]?.daysAccrued).toBe(0.3);
    expect(mockDb.accrualRuns.at(-1)?.daysAccrued).toBe(0.3);
  });

  it("four-month catch-up: 0.10 + 0.20×4 = 0.90 exactly", async () => {
    const bal = setup();
    await runMonthlyAccrual({ store: memoryAccrualStore }, { trigger: "manual", now: MAR });
    expect(bal(S).balance).toBe(0.9);
    expect(bal(V).balance).toBe(0.4);
  });

  it("matches Postgres exactly for the same drift-prone inputs", async () => {
    setup();
    const t = await createTestDb();
    await t.db.exec(`delete from leave_policies`);
    await t.db.query(
      `insert into leave_policies (user_id, leave_type_id, accrual_per_month) values ($1, $2, 0.10), ($1, $3, 0.20)`,
      [USER_IDS.ana, V, S],
    );
    await t.db.query(
      `update leave_balances set balance = 0 where user_id = $1 and leave_type_id = $2`,
      [USER_IDS.ana, V],
    );
    await t.db.query(
      `update leave_balances set balance = 0.10 where user_id = $1 and leave_type_id = $2`,
      [USER_IDS.ana, S],
    );
    const pg = await runMonthlyAccrual(
      { store: createPostgresAccrualStore(t.sql) },
      { trigger: "manual", now: MAR },
    );
    const mem = await runMonthlyAccrual(
      { store: memoryAccrualStore },
      { trigger: "manual", now: MAR },
    );
    expect(mem).toEqual(pg);
    expect(pg.accrued.map((a) => a.daysAccrued)).toEqual([0.3, 0.3, 0.3, 0.3]);
    const pgBal = (await createPostgresRepository(t.sql).getBalances(USER_IDS.ana)).map(
      (b) => b.confirmed,
    );
    const memBal = (await mockRepository.getBalances(USER_IDS.ana)).map((b) => b.confirmed);
    expect(memBal).toEqual(pgBal);
    expect(pgBal.slice(0, 2)).toEqual([0.4, 0.9]);
    await t.db.close();
  });
});
