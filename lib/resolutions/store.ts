import type { LeaveTypeName } from "@/lib/data/types";

/** TASK-032 — the proposal store port. One transaction: re-read, validate, insert, event, notify. */
export type ProposeInput = {
  userId: string;
  leaveTypeId: string;
  unpaidDays: number;
  recoveryDays: number;
  recoveryStartPeriod: string | null;
  recoveryMonths: number | null;
  actorId: string;
};

export type ProposeOutcome =
  | {
      ok: true;
      id: string;
      userName: string;
      leaveType: LeaveTypeName;
      deficit: number;
      respondBy: string;
      proposedAt: string;
    }
  | {
      ok: false;
      reason: "not_found" | "untracked" | "not_in_deficit" | "split_mismatch" | "recovery_too_high";
      deficit?: number;
      accrualPerMonth?: number;
    };

export interface ResolutionStore {
  proposeWithAudit(input: ProposeInput): Promise<ProposeOutcome>;
}

export const cents = (n: number) => Math.round(n * 100);
