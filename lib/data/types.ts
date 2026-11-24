/**
 * Domain types — mirror supabase/migrations/20261124000000_init.sql 1:1.
 * View types (…View, …Summary) are the shapes UI components consume; Day 1
 * repositories must return exactly these so components never change.
 */

export const ROLES = ["employee", "manager", "hr_admin"] as const;
export type Role = (typeof ROLES)[number];

export const REQUEST_STATUSES = ["pending", "approved", "rejected"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const AUDIT_ACTIONS = ["submitted", "approved", "rejected"] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const LEAVE_TYPE_NAMES = ["Vacation", "Sick", "Unpaid"] as const;
export type LeaveTypeName = (typeof LEAVE_TYPE_NAMES)[number];

/* ── Table rows ─────────────────────────────────────────────────────────── */

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  managerId: string | null;
};

export type LeaveType = {
  id: string;
  name: LeaveTypeName;
  tracksBalance: boolean;
};

export type LeavePolicy = {
  id: string;
  userId: string;
  leaveTypeId: string;
  accrualPerMonth: number;
};

export type LeaveBalance = {
  id: string;
  userId: string;
  leaveTypeId: string;
  balance: number;
  updatedAt: string; // ISO timestamp
};

export type LeaveRequest = {
  id: string;
  userId: string;
  leaveTypeId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  status: RequestStatus;
  decidedBy: string | null;
  decidedAt: string | null;
  /** Manager's reason for the decision — required when rejected (US-03 AC2), null while pending. */
  decisionReason: string | null;
  isDeleted: boolean;
  createdAt: string;
};

export type AuditLogEntry = {
  id: string;
  leaveRequestId: string;
  actorId: string;
  action: AuditAction;
  occurredAt: string;
};

/* ── View models consumed by components ─────────────────────────────────── */

export type BalanceSummary = {
  leaveType: LeaveType;
  /** Confirmed balance after the last completed accrual; null when the type is not tracked. */
  confirmed: number | null;
  /** Days in pending requests — shown separately, NOT yet deducted (US-02 AC2). */
  pending: number;
  /** confirmed − pending; null when not tracked. */
  available: number | null;
  accrualPerMonth: number | null;
  asOf: string | null;
};

export type LeaveRequestView = {
  id: string;
  leaveType: LeaveTypeName;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: RequestStatus;
  createdAt: string;
  decidedAt: string | null;
  decidedByName: string | null;
};

export type TeamRequestView = LeaveRequestView & {
  employee: Pick<User, "id" | "name" | "email">;
  /**
   * Requester's balance available for THIS request: confirmed minus their OTHER
   * pending requests of the same type. null when the type is not tracked.
   */
  balanceAvailable: number | null;
};

export type AuditEntryView = {
  id: string;
  requestId: string;
  employeeName: string;
  leaveType: LeaveTypeName;
  startDate: string;
  endDate: string;
  days: number;
  action: AuditAction;
  actorName: string;
  occurredAt: string;
};

export type AuditFilter = {
  employeeId?: string;
  from?: string; // YYYY-MM-DD, inclusive
  to?: string; // YYYY-MM-DD, inclusive
};

export type PolicyView = {
  id: string;
  userId: string;
  userName: string;
  role: Role;
  leaveType: LeaveTypeName;
  accrualPerMonth: number;
};

export type OrgStats = {
  pendingCount: number;
  approvedThisMonth: number;
  employeeCount: number;
};

/** Result shape for mutations invoked from the UI (server actions on Day 1). */
export type ActionResult =
  { success: true } | { success: false; error: { code: string; message: string } };
