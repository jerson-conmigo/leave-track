import type { ResolutionView } from "@/lib/resolutions/types";
import { monthlyDeduction } from "@/lib/resolutions/types";

/**
 * The resolution store port (TASK-032 propose; TASK-033 accept / decline / re-propose / finalize).
 * Every method is ONE transaction: a guarded transition (the row is locked, its status and
 * deadline checked), the balance change + its ledger rows, the schedule, the event and the
 * notification — all or nothing. Postgres and memory implement the same outcomes (parity-tested).
 */
export type SplitInput = {
  unpaidDays: number;
  recoveryDays: number;
  recoveryStartPeriod: string | null;
  recoveryMonths: number | null;
};
export type ProposeInput = SplitInput & { userId: string; leaveTypeId: string; actorId: string };
export type RespondInput = { resolutionId: string; actorId: string };

export type FailureReason =
  | "not_found"
  | "untracked"
  | "not_in_deficit"
  | "split_mismatch"
  | "recovery_too_high"
  | "expired"
  | "not_open"
  | "own_balance"
  | "final_round"
  | "repropose_first";

export type Failure = {
  ok: false;
  reason: FailureReason;
  deficit?: number;
  accrualPerMonth?: number;
};
export type ResolutionOutcome = { ok: true; resolution: ResolutionView } | Failure;

export interface ResolutionStore {
  proposeWithAudit(input: ProposeInput): Promise<ResolutionOutcome>;
  /** The employee, on their own proposed resolution, before respond_by. */
  acceptWithApply(input: RespondInput): Promise<ResolutionOutcome>;
  declineWithReason(input: RespondInput & { reason: string }): Promise<ResolutionOutcome>;
  /** HR, on a FIRST-proposal decline: supersede it with proposal 2 (one re-proposal, D6). */
  reproposeWithAudit(input: RespondInput & SplitInput): Promise<ResolutionOutcome>;
  /** HR, on a SECOND-proposal decline: a binding final decision, applied now (D6). */
  finalizeWithAudit(
    input: RespondInput & SplitInput & { reason: string },
  ): Promise<ResolutionOutcome>;
  /**
   * TASK-034 — convert up to `limit` past-deadline proposals to Unpaid, one transaction each
   * (a failing row is logged and skipped). Rows locked by a concurrent response are skipped
   * (SKIP LOCKED) and picked up on the next run.
   */
  expireDue(input: { limit: number }): Promise<ExpireResult>;
}

export type ExpireResult = { expired: { id: string; unpaid: number }[]; skipped: number };

export const cents = (n: number) => Math.round(n * 100);

/** The split rules shared by both stores: sum = deficit; monthly recovery ≤ the accrual rate. */
export function checkSplit(
  split: SplitInput,
  deficit: number,
  accrualPerMonth: number,
): Failure | null {
  if (cents(split.unpaidDays) + cents(split.recoveryDays) !== cents(deficit)) {
    return { ok: false, reason: "split_mismatch", deficit };
  }
  if (
    split.recoveryDays > 0 &&
    (accrualPerMonth <= 0 ||
      monthlyDeduction(split.recoveryDays, split.recoveryMonths!) > accrualPerMonth)
  ) {
    return { ok: false, reason: "recovery_too_high", accrualPerMonth };
  }
  return null;
}
