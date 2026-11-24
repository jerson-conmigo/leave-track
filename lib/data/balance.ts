import type { BalanceSummary, LeaveBalance, LeavePolicy, LeaveType } from "@/lib/data/types";
import { countDays } from "@/lib/format";

export type PendingRange = { leaveTypeId: string; startDate: string; endDate: string };

/**
 * Single source of the US-02 balance rules, shared by every repository so the
 * mock and Postgres implementations cannot drift:
 *  - confirmed: the balance row (0 if none); null for untracked types (Unpaid, US-08)
 *  - pending:   days in the user's pending, non-deleted requests — shown SEPARATELY,
 *               never deducted from confirmed (US-02 AC2)
 *  - available: confirmed − pending; null when untracked
 *  - asOf:      the last completed accrual run (US-02 AC1); null if untracked or none yet
 * Callers pass only the user's rows; order follows `leaveTypes`.
 */
export function buildBalanceSummaries(input: {
  leaveTypes: LeaveType[];
  balances: Pick<LeaveBalance, "leaveTypeId" | "balance">[];
  policies: Pick<LeavePolicy, "leaveTypeId" | "accrualPerMonth">[];
  pendingRanges: PendingRange[];
  lastAccrualAt: string | null;
}): BalanceSummary[] {
  const { leaveTypes, balances, policies, pendingRanges, lastAccrualAt } = input;
  return leaveTypes.map((leaveType) => {
    const pending = pendingRanges
      .filter((r) => r.leaveTypeId === leaveType.id)
      .reduce((sum, r) => sum + countDays(r.startDate, r.endDate), 0);
    const confirmed = leaveType.tracksBalance
      ? (balances.find((b) => b.leaveTypeId === leaveType.id)?.balance ?? 0)
      : null;
    return {
      leaveType,
      confirmed,
      pending,
      available: confirmed === null ? null : confirmed - pending,
      accrualPerMonth:
        policies.find((p) => p.leaveTypeId === leaveType.id)?.accrualPerMonth ?? null,
      asOf: leaveType.tracksBalance ? lastAccrualAt : null,
    };
  });
}
