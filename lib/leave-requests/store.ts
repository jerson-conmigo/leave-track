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
