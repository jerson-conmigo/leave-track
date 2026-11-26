export type AccrualTrigger = "cron" | "manual";

export type AccruedPeriod = { period: string; usersAccrued: number; daysAccrued: number };

export type AccrualOutcome =
  | { status: "accrued"; accrued: AccruedPeriod[] } // accrued may be [] (up to date)
  | { status: "too_far_behind"; monthsMissing: number };

/**
 * Persistence port for the monthly accrual (TASK-017, ADR-LeaveTrack-E002).
 * One atomic unit: claim each missing month in the accrual_runs ledger (unique
 * period — a month already claimed by another run is skipped), add each tracked
 * policy's accrual_per_month to its balance, and record the run's audit fields.
 */
export interface AccrualStore {
  runAccrual(input: {
    now: Date;
    trigger: AccrualTrigger;
    maxCatchUpMonths: number;
  }): Promise<AccrualOutcome>;
}
