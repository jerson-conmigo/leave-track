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
  /** TASK-027: how many days before today a request of this type may start (Sick 30, others 0). */
  maxBackdateDays: number;
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
  /** TASK-026 (US-15 AC4): pending → the approver's name or "HR"; null once decided (or if
   *  nobody can decide it). Read from the current org chart, so it follows manager changes. */
  awaiting: string | null;
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
  from?: string; // YYYY-MM-DD, inclusive — compared to the UTC date of occurredAt
  to?: string; // YYYY-MM-DD, inclusive — compared to the UTC date of occurredAt
};

/** Newest-first cap for the all-employees /audit event log (cursor paging: backlog B21). */
export const AUDIT_LOG_LIMIT = 500;

/** Date range for one employee's history — UTC date of the request's createdAt, inclusive. */
export type AuditHistoryFilter = {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
};

export type AuditEvent = {
  action: AuditAction;
  actorId: string;
  actorName: string;
  occurredAt: string;
};

/** One request in an employee's audit history (US-05 AC1). */
export type AuditRequestRecord = LeaveRequestView & {
  decidedBy: { id: string; name: string } | null;
  decisionReason: string | null;
  events: AuditEvent[];
};

/** `data` of GET /api/audit/:userId — full, non-deleted decision history (BR-04). */
export type EmployeeAuditHistory = {
  employee: Pick<User, "id" | "name" | "email" | "role"> & { managerName: string | null };
  requests: AuditRequestRecord[];
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

/** Non-blocking issue returned with a successful submission (US-01 AC3). */
export type SubmitWarning = {
  code: "EXCEEDS_BALANCE";
  message: string;
  requestedDays: number;
  availableDays: number;
};

/** `data` of a successful POST /api/leave-requests (201). */
export type SubmitLeaveRequestResult = {
  request: LeaveRequestView;
  warnings: SubmitWarning[];
};

/** `data` of GET /api/leave-requests?scope=mine — US-02 balance context. */
export type MyLeaveContext = {
  balances: BalanceSummary[];
  requests: LeaveRequestView[];
};

/** `data` of GET /api/leave-requests?scope=team — US-04 manager queue. */
export type TeamQueue = {
  requests: TeamRequestView[];
};

export type Decision = "approve" | "reject";

/** Non-blocking issue returned with a successful approval (warn, don't block). */
export type DecideWarning = {
  code: "NEGATIVE_BALANCE";
  message: string;
  leaveType: LeaveTypeName;
  balanceAfter: number;
};

/** `data` of a successful POST /api/leave-requests/:id/decision (200). */
export type DecideLeaveRequestResult = {
  request: LeaveRequestView;
  warnings: DecideWarning[];
};

/** Result shape for mutations invoked from the UI (server actions). */
/** One accrued month — the accrual_runs ledger row (TASK-017, ADR-LeaveTrack-E002). */
export type AccrualRun = {
  period: string; // YYYY-MM-01 (UTC month)
  ranAt: string; // ISO timestamp
  trigger: "cron" | "manual";
  usersAccrued: number;
  daysAccrued: number;
  /** Policy rates applied in this run (snapshot), for audit after policy changes. */
  rates: { userId: string; leaveTypeId: string; accrualPerMonth: number }[];
};

/** Result of one accrual job invocation. */
export type AccrualResult = {
  accrued: { period: string; usersAccrued: number; daysAccrued: number }[];
  upToDate: boolean;
  catchUp: boolean;
};

export type ActionResult =
  | { success: true; warnings?: (SubmitWarning | DecideWarning)[] }
  | { success: false; error: { code: string; message: string } };
