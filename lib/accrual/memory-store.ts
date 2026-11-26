import { currentPeriod, monthsToAccrue } from "@/lib/accrual/periods";
import type { AccrualStore, AccruedPeriod } from "@/lib/accrual/store";
import { addDays, sumDays } from "@/lib/data/decimal";
import { mockDb } from "@/lib/data/mock/store";

/**
 * AccrualStore over the in-memory mock DB (local dev) — same rules as Postgres,
 * parity-tested. Day amounts use exact integer-hundredths arithmetic (decimal.ts).
 * Runs synchronously after the plan is computed, so a run is all-or-nothing.
 */
export const memoryAccrualStore: AccrualStore = {
  async runAccrual({ now, trigger, maxCatchUpMonths }) {
    const last = mockDb.accrualRuns.reduce<string | null>(
      (max, r) => (max === null || r.period > max ? r.period : max),
      null,
    );
    const plan = monthsToAccrue(last, currentPeriod(now), maxCatchUpMonths);
    if ("tooFarBehind" in plan)
      return { status: "too_far_behind", monthsMissing: plan.tooFarBehind };

    const tracked = new Set(mockDb.leaveTypes.filter((t) => t.tracksBalance).map((t) => t.id));
    const policies = mockDb.leavePolicies
      .filter((p) => tracked.has(p.leaveTypeId) && p.accrualPerMonth > 0)
      .sort(
        (a, b) => a.userId.localeCompare(b.userId) || a.leaveTypeId.localeCompare(b.leaveTypeId),
      );

    const accrued: AccruedPeriod[] = [];
    for (const period of plan.periods) {
      if (mockDb.accrualRuns.some((r) => r.period === period)) continue; // claimed already
      const ranAt = new Date().toISOString();
      for (const p of policies) {
        let bal = mockDb.leaveBalances.find(
          (b) => b.userId === p.userId && b.leaveTypeId === p.leaveTypeId,
        );
        if (!bal) {
          bal = {
            id: crypto.randomUUID(),
            userId: p.userId,
            leaveTypeId: p.leaveTypeId,
            balance: 0,
            updatedAt: ranAt,
          };
          mockDb.leaveBalances.push(bal);
        }
        bal.balance = addDays(bal.balance, p.accrualPerMonth);
        bal.updatedAt = ranAt;
      }
      const usersAccrued = new Set(policies.map((p) => p.userId)).size;
      const daysAccrued = sumDays(policies.map((p) => p.accrualPerMonth));
      mockDb.accrualRuns.push({
        period,
        ranAt,
        trigger,
        usersAccrued,
        daysAccrued,
        rates: policies.map((p) => ({
          userId: p.userId,
          leaveTypeId: p.leaveTypeId,
          accrualPerMonth: p.accrualPerMonth,
        })),
      });
      accrued.push({ period, usersAccrued, daysAccrued });
    }
    return { status: "accrued", accrued };
  },
};
