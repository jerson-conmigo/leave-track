import type { LeaveRequest, LeaveType } from "@/lib/data/types";
import type { Approver } from "@/lib/leave-requests/approver";

/** Validated input for a new request. `userId` always comes from the session. */
export type NewLeaveRequest = {
  userId: string;
  leaveTypeId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
};

export type Requester = {
  id: string;
  name: string;
  /** Who may decide this person's requests (TASK-026, BR-10); null = nobody → submit is 409. */
  approver: Approver;
};

/**
 * Raw inputs for the balance check. Day counting stays in the service via
 * `countDays` (single source of truth, backlog B5) — stores return date ranges,
 * never pre-computed day totals.
 */
export type BalanceContext = {
  /** Confirmed balance (0 when no balance row exists). */
  confirmed: number;
  /** The user's other pending, non-deleted requests of this leave type. */
  pending: { startDate: string; endDate: string }[];
};

/** Persistence port for submitting a leave request (TASK-011). */
export interface SubmitStore {
  getLeaveType(id: string): Promise<LeaveType | null>;
  getRequester(userId: string): Promise<Requester | null>;
  getBalanceContext(userId: string, leaveTypeId: string): Promise<BalanceContext>;
  /** Inserts the pending request AND its `submitted` audit row atomically (BR-04). */
  /**
   * Insert the request and its `submitted` audit row in one transaction — ONLY if the requester
   * still has an eligible approver (checked in the same transaction). Null = no approver: nothing
   * was written (TASK-026 AC3).
   */
  insertRequestWithAudit(input: NewLeaveRequest): Promise<LeaveRequest | null>;
}

export type DecideInput = {
  requestId: string;
  /** Always the session manager — never from the request body. */
  /** The deciding user (manager or HR Admin); eligibility is checked by the store (can_decide). */
  actorId: string;
  decision: "approve" | "reject";
  reason: string | undefined;
  /** Day counting stays in the service (countDays, backlog B5). */
  daysFor: (startDate: string, endDate: string) => number;
};

export type DecideOutcome =
  | {
      ok: true;
      request: LeaveRequest;
      leaveType: LeaveType;
      employee: { id: string; name: string; email: string };
      /** Who decided (the actor). */
      decidedBy: { id: string; name: string };
      days: number;
      /** Balance after the decrement; null when no balance changed (reject / untracked). */
      balanceAfter: number | null;
    }
  | { ok: false; reason: "not_found" | "own_request" | "not_report" | "already_decided" };

/** Persistence port for manager decisions (TASK-014). */
export interface DecideStore {
  /**
   * In ONE transaction: scoped + status-guarded update, balance decrement on
   * approve (tracked types only, that request's own leave type), and the
   * decision audit row. Nothing is written when the outcome is not ok.
   */
  decideWithAudit(input: DecideInput): Promise<DecideOutcome>;
}
