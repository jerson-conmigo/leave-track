import type { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import { memoryAccrualStore } from "@/lib/accrual/memory-store";
import { createPostgresAccrualStore } from "@/lib/accrual/postgres-store";
import type { AccrualStore } from "@/lib/accrual/store";
import { runMonthlyAccrual } from "@/lib/accrual/run";
import { LEAVE_TYPE_IDS, USER_IDS } from "@/lib/data/mock/fixtures";
import { mockDb, resetMockDb } from "@/lib/data/mock/store";
import { closeAfterEachTest, createTestDb } from "../db/helpers";

/**
 * TASK-017 — overlapping / duplicate invocations across MULTIPLE missed months
 * (Vercel may invoke the same run twice or overlap runs). Last run: 2026-11-01.
 *
 * PGlite serialises transactions, so these prove the claim-or-skip LOGIC
 * deterministically; true parallel row-locking on real Postgres relies on the
 * unique accrual_runs.period index (ADR-LeaveTrack-E002) and is verified on real
 * Supabase under backlog B12.
 */
const JAN = new Date("2027-01-15T02:00:00Z");
const FEB = new Date("2027-02-15T02:00:00Z");
const MONTHS = ["2026-11-01", "2026-12-01", "2027-01-01", "2027-02-01"];

const runAll = (store: AccrualStore, nows: Date[]) =>
  Promise.allSettled(nows.map((now) => runMonthlyAccrual({ store }, { trigger: "cron", now })));

let db: PGlite;
const track = closeAfterEachTest(); // B30: each test's database closes after that test

describe("Postgres store", () => {
  let store: AccrualStore;
  const anaVacation = async () =>
    (
      await db.query<{ b: string }>(
        `select balance::text b from leave_balances where user_id = $1 and leave_type_id = $2`,
        [USER_IDS.ana, LEAVE_TYPE_IDS.Vacation],
      )
    ).rows[0]!.b;
  const periods = async () =>
    (
      await db.query<{ p: string }>(`select period::text p from accrual_runs order by period`)
    ).rows.map((r) => r.p);

  beforeEach(async () => {
    const t = await createTestDb();
    db = t.db;
    track(db);
    store = createPostgresAccrualStore(t.sql);
  });

  it("three identical catch-up runs at once: Dec, Jan, Feb each accrued exactly once", async () => {
    const before = Number(await anaVacation());
    const results = await runAll(store, [FEB, FEB, FEB]);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    const accruedTotal = results.flatMap((r) => (r.status === "fulfilled" ? r.value.accrued : []));
    expect(accruedTotal.map((a) => a.period).sort()).toEqual(MONTHS.slice(1)); // no month twice
    expect(await periods()).toEqual(MONTHS);
    expect(Number(await anaVacation())).toBe(before + 3 * 1.25);
  });

  it("staggered overlap (one run claims Dec+Jan, another Dec+Jan+Feb): every month once, none missing", async () => {
    const before = Number(await anaVacation());
    const results = await runAll(store, [JAN, FEB]);
    const accruedTotal = results.flatMap((r) => (r.status === "fulfilled" ? r.value.accrued : []));
    expect(accruedTotal.map((a) => a.period).sort()).toEqual(MONTHS.slice(1));
    expect(await periods()).toEqual(MONTHS);
    expect(Number(await anaVacation())).toBe(before + 3 * 1.25);
  });
});

describe("memory store (parity of the claim-or-skip rule)", () => {
  beforeEach(() => resetMockDb());
  const anaVacation = () =>
    mockDb.leaveBalances.find(
      (b) => b.userId === USER_IDS.ana && b.leaveTypeId === LEAVE_TYPE_IDS.Vacation,
    )!.balance;

  it.each([
    ["three identical catch-up runs", [FEB, FEB, FEB]],
    ["staggered overlap (Jan + Feb)", [JAN, FEB]],
  ])("%s: each month exactly once", async (_l, nows) => {
    const before = anaVacation();
    const results = await runAll(memoryAccrualStore, nows);
    const accruedTotal = results.flatMap((r) => (r.status === "fulfilled" ? r.value.accrued : []));
    expect(accruedTotal.map((a) => a.period).sort()).toEqual(MONTHS.slice(1));
    expect(mockDb.accrualRuns.map((r) => r.period).sort()).toEqual(MONTHS);
    expect(anaVacation()).toBe(before + 3.75);
  });
});
