import type { LeaveRequest, LeaveType } from "@/lib/data/types";

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
  manager: { id: string; name: string; email: string } | null;
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
  insertRequestWithAudit(input: NewLeaveRequest): Promise<LeaveRequest>;
}

export type DecideInput = {
  requestId: string;
  /** Always the session manager — never from the request body. */
  managerId: string;
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
      manager: { id: string; name: string };
      days: number;
      /** Balance after the decrement; null when no balance changed (reject / untracked). */
      balanceAfter: number | null;
    }
  | { ok: false; reason: "not_found" | "not_report" | "already_decided" };

/** Persistence port for manager decisions (TASK-014). */
export interface DecideStore {
  /**
   * In ONE transaction: scoped + status-guarded update, balance decrement on
   * approve (tracked types only, that request's own leave type), and the
   * decision audit row. Nothing is written when the outcome is not ok.
   */
  decideWithAudit(input: DecideInput): Promise<DecideOutcome>;
}
