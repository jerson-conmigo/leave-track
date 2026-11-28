import type { LeaveTypeName } from "@/lib/data/types";

/**
 * TASK-032 (US-09, ADR-LeaveTrack-E006) — negative-balance resolutions. HR proposes how a
 * deficit is resolved: converted to Unpaid and/or recovered from future accruals. This task
 * covers PROPOSING; accepting, declining, expiry, recovery and conversion are TASK-033–036.
 */
export const OPEN_RESOLUTION_STATUSES = ["proposed", "declined"] as const;
export type ResolutionStatus =
  "proposed" | "accepted" | "declined" | "expired" | "withdrawn" | "superseded" | "finalized";

/** A tracked balance below zero with no open resolution — HR's "Needs proposal" list. */
export type ResolutionQueueRow = {
  userId: string;
  userName: string;
  leaveTypeId: string;
  leaveType: LeaveTypeName;
  balance: number;
  deficit: number;
  /** Days accrued per month for this person and type (0 = recovery not possible). */
  accrualPerMonth: number;
};

export type ResolutionView = {
  id: string;
  userId: string;
  userName: string;
  leaveType: LeaveTypeName;
  status: ResolutionStatus;
  deficit: number;
  unpaidDays: number;
  recoveryDays: number;
  monthlyDeduction: number | null;
  recoveryStartPeriod: string | null;
  recoveryMonths: number | null;
  respondBy: string;
  proposedByName: string;
  proposedAt: string;
};

/** Memory-store rows (mirror the SQL tables). */
export type MockResolution = {
  id: string;
  userId: string;
  leaveTypeId: string;
  status: ResolutionStatus;
  deficitAtProposal: number;
  unpaidDaysProposed: number;
  recoveryDaysProposed: number;
  recoveryStartPeriod: string | null;
  recoveryMonths: number | null;
  respondBy: string;
  proposalNumber: number;
  proposedBy: string;
  proposedAt: string;
  closedAt: string | null;
};

export type MockResolutionEvent = {
  id: string;
  resolutionId: string;
  action: string;
  actorId: string | null;
  balanceBefore: number | null;
  balanceAfter: number | null;
  details: Record<string, unknown>;
  occurredAt: string;
};

/** Monthly recovery amount, 2 decimals (D-1). The last month absorbs rounding (TASK-034). */
export function monthlyDeduction(recoveryDays: number, months: number): number {
  return Math.round((recoveryDays / months) * 100) / 100;
}

export type ResolutionGroup = "awaiting" | "declined" | "history";
export const RESOLUTION_GROUP_STATUSES: Record<ResolutionGroup, ResolutionStatus[]> = {
  awaiting: ["proposed"],
  declined: ["declined"],
  history: ["accepted", "expired", "withdrawn", "superseded", "finalized"],
};
