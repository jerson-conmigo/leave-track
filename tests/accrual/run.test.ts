import type { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import { createPostgresAccrualStore } from "@/lib/accrual/postgres-store";
import { runMonthlyAccrual } from "@/lib/accrual/run";
import { LEAVE_TYPE_IDS, USER_IDS, users } from "@/lib/data/mock/fixtures";
import type { SqlClient } from "@/lib/db/sql";
import { closeAfterEachTest, createTestDb } from "../db/helpers";

/**
 * TASK-017 / US-07 — monthly accrual against real Postgres (PGlite) with the seed
 * (policies: Vacation 1.25, Sick 1.00 for all 9 users; last run 2026-11-01).
 * Fresh DB per test; `now` is injected.
 */
const { Vacation, Sick, Unpaid } = LEAVE_TYPE_IDS;
const DEC = new Date("2026-12-02T02:00:00Z");

let db: PGlite;
let sql: SqlClient;
const track = closeAfterEachTest(); // B30: each test's database closes after that test

beforeEach(async () => {
  ({ db, sql } = await createTestDb());
  track(db);
});

const run = (now: Date, client: SqlClient = sql, trigger: "cron" | "manual" = "manual") =>
  runMonthlyAccrual({ store: createPostgresAccrualStore(client) }, { trigger, now });

/** Exact balances as text (numeric(6,2)), keyed by user:type. */
async function balances() {
  const rows = (
    await db.query<{ user_id: string; leave_type_id: string; balance: string }>(
      `select user_id, leave_type_id, balance::text from leave_balances order by user_id, leave_type_id`,
    )
  ).rows;
  return Object.fromEntries(rows.map((r) => [`${r.user_id}:${r.leave_type_id}`, r.balance]));
}
const runs = async () =>
  (
    await db.query<{
      period: string;
      trigger: string;
      users_accrued: number;
      days_accrued: string;
    }>(
      `select period::text, trigger, users_accrued, days_accrued::text from accrual_runs order by period`,
    )
  ).rows;
const plus = (a: string, cents: number) => (Math.round(Number(a) * 100 + cents) / 100).toFixed(2);

describe("AC1 — one run increases each balance by exactly the policy's accrual_per_month", () => {
  it("Vacation +1.25 and Sick +1.00 for every policy holder; Unpaid untouched", async () => {
    const before = await balances();
    const result = await run(DEC);
    const after = await balances();

    expect(result).toEqual({
      accrued: [{ period: "2026-12-01", usersAccrued: 9, daysAccrued: 20.25 }],
      upToDate: false,
      catchUp: false,
    });
    for (const u of users) {
      expect(after[`${u.id}:${Vacation}`]).toBe(plus(before[`${u.id}:${Vacation}`]!, 125));
      expect(after[`${u.id}:${Sick}`]).toBe(plus(before[`${u.id}:${Sick}`]!, 100));
      expect(after[`${u.id}:${Unpaid}`]).toBeUndefined();
    }
  });

  it("records the month in the ledger with trigger, totals (exact) and the rate snapshot", async () => {
    await run(DEC, sql, "cron");
    const [row] = (
      await db.query<{
        trigger: string;
        users_accrued: number;
        days_accrued: string;
        rates: { accrualPerMonth: number }[];
      }>(
        `select trigger, users_accrued, days_accrued::text, rates from accrual_runs where period = '2026-12-01'`,
      )
    ).rows;
    expect(row).toMatchObject({ trigger: "cron", users_accrued: 9, days_accrued: "20.25" });
    expect(row!.rates).toHaveLength(18);
  });

  it("creates a missing balance row for a tracked type; leaves users without a policy alone", async () => {
    await db.query(`delete from leave_balances where user_id = $1 and leave_type_id = $2`, [
      USER_IDS.ana,
      Sick,
    ]);
    await db.query(
      `insert into users (id, name, email, role, manager_id)
       values ('00000000-0000-4000-8000-000000000301', 'No Policy', 'np@leavetrack.test', 'employee', $1)`,
      [USER_IDS.ben],
    );
    await run(DEC);
    const after = await balances();
    expect(after[`${USER_IDS.ana}:${Sick}`]).toBe("1.00");
    expect(
      Object.keys(after).some((k) => k.startsWith("00000000-0000-4000-8000-000000000301")),
    ).toBe(false);
  });

  it("skips zero-rate policies", async () => {
    await db.query(
      `update leave_policies set accrual_per_month = 0 where user_id = $1 and leave_type_id = $2`,
      [USER_IDS.ana, Vacation],
    );
    const before = await balances();
    await run(DEC);
    const after = await balances();
    expect(after[`${USER_IDS.ana}:${Vacation}`]).toBe(before[`${USER_IDS.ana}:${Vacation}`]);
    expect(after[`${USER_IDS.ana}:${Unpaid}`]).toBeUndefined();
  });

  it("an untracked (Unpaid) policy cannot exist — the database refuses it (TASK-018), so there is nothing to accrue", async () => {
    await expect(
      db.query(
        `insert into leave_policies (user_id, leave_type_id, accrual_per_month) values ($1, $2, 2)`,
        [USER_IDS.ana, Unpaid],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await run(DEC);
    expect((await balances())[`${USER_IDS.ana}:${Unpaid}`]).toBeUndefined();
  });
});

describe("AC2 — a second run in the same month is a no-op", () => {
  it.each([
    ["the same instant", DEC],
    ["later in the month", new Date("2026-12-28T23:59:00Z")],
  ])("re-running at %s changes nothing", async (_l, again) => {
    await run(DEC);
    const balancesAfterFirst = await balances();
    const runsAfterFirst = await runs();

    const second = await run(again);
    expect(second).toEqual({ accrued: [], upToDate: true, catchUp: false });
    expect(await balances()).toEqual(balancesAfterFirst);
    expect(await runs()).toEqual(runsAfterFirst);
  });

  it("the seeded month (November) is already accrued → no-op", async () => {
    const before = await balances();
    expect((await run(new Date("2026-11-20T00:00:00Z"))).upToDate).toBe(true);
    expect(await balances()).toEqual(before);
  });
});

describe("catch-up for missed cron runs", () => {
  it("accrues every missed month once, oldest first (Nov → Feb = Dec, Jan, Feb)", async () => {
    const before = await balances();
    const result = await run(new Date("2027-02-10T00:00:00Z"));
    expect(result.catchUp).toBe(true);
    expect(result.accrued.map((a) => a.period)).toEqual(["2026-12-01", "2027-01-01", "2027-02-01"]);
    expect((await runs()).map((r) => r.period)).toEqual([
      "2026-11-01",
      "2026-12-01",
      "2027-01-01",
      "2027-02-01",
    ]);
    const after = await balances();
    expect(after[`${USER_IDS.ana}:${Vacation}`]).toBe(
      plus(before[`${USER_IDS.ana}:${Vacation}`]!, 375),
    );
    expect(after[`${USER_IDS.ana}:${Sick}`]).toBe(plus(before[`${USER_IDS.ana}:${Sick}`]!, 300));
  });

  it("first-ever run (empty ledger) accrues only the current month", async () => {
    await db.exec(`truncate accrual_runs`);
    const result = await run(DEC);
    expect(result.accrued.map((a) => a.period)).toEqual(["2026-12-01"]);
  });

  it("a gap over 12 months is refused (409) and writes nothing", async () => {
    const before = await balances();
    const runsBefore = await runs();
    await expect(run(new Date("2028-01-15T00:00:00Z"))).rejects.toMatchObject({
      code: "CONFLICT",
      status: 409,
    });
    expect(await balances()).toEqual(before);
    expect(await runs()).toEqual(runsBefore);
  });

  it("catch-up after a policy change uses the CURRENT rate for every missed month (documented)", async () => {
    await db.query(
      `update leave_policies set accrual_per_month = 2.00 where user_id = $1 and leave_type_id = $2`,
      [USER_IDS.ana, Vacation],
    );
    const before = await balances();
    await run(new Date("2027-02-10T00:00:00Z"));
    expect((await balances())[`${USER_IDS.ana}:${Vacation}`]).toBe(
      plus(before[`${USER_IDS.ana}:${Vacation}`]!, 600),
    );
    const snapshots = (
      await db.query<{ period: string; rate: string }>(
        `select period::text, (select x->>'accrualPerMonth' from jsonb_array_elements(rates) x
                                where x->>'userId' = $1 and x->>'leaveTypeId' = $2) rate
           from accrual_runs where period > '2026-11-01' order by period`,
        [USER_IDS.ana, Vacation],
      )
    ).rows;
    expect(snapshots.map((s) => Number(s.rate))).toEqual([2, 2, 2]);
  });
});

describe("exact decimal arithmetic", () => {
  it("1.33/month over a 3-month catch-up adds exactly 3.99; 0.10 + 0.20 = 0.30", async () => {
    await db.query(
      `update leave_policies set accrual_per_month = 1.33 where user_id = $1 and leave_type_id = $2`,
      [USER_IDS.ana, Vacation],
    );
    await db.query(
      `update leave_balances set balance = 0.10 where user_id = $1 and leave_type_id = $2`,
      [USER_IDS.ana, Sick],
    );
    await db.query(
      `update leave_policies set accrual_per_month = 0.20 where user_id = $1 and leave_type_id = $2`,
      [USER_IDS.ana, Sick],
    );
    const before = await balances();
    await run(DEC);
    expect((await balances())[`${USER_IDS.ana}:${Sick}`]).toBe("0.30");
    await run(new Date("2027-03-05T00:00:00Z")); // Jan, Feb, Mar
    const after = await balances();
    expect(after[`${USER_IDS.ana}:${Vacation}`]).toBe(
      plus(before[`${USER_IDS.ana}:${Vacation}`]!, 133 * 4),
    );
  });
});

describe("atomicity", () => {
  it("a failure while recording the run rolls back the ledger row AND every balance change", async () => {
    const failing: SqlClient = {
      query: (t, p) => sql.query(t, p),
      transaction: (fn) =>
        sql.transaction((tx) =>
          fn({
            query: (t, p) => {
              if (/^\s*update accrual_runs/i.test(t)) throw new Error("audit update failed");
              return tx.query(t, p);
            },
            transaction: tx.transaction,
          }),
        ),
    };
    const before = await balances();
    const runsBefore = await runs();
    await expect(run(DEC, failing)).rejects.toThrow("audit update failed");
    expect(await balances()).toEqual(before);
    expect(await runs()).toEqual(runsBefore);
  });

  it("every accrual statement runs inside the transaction", async () => {
    const outside: string[] = [];
    const recording: SqlClient = {
      query: (t, p) => {
        outside.push(t);
        return sql.query(t, p);
      },
      transaction: sql.transaction,
    };
    await run(DEC, recording);
    expect(outside).toEqual([]);
  });
});
