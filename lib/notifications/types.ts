import type { LeaveTypeName } from "@/lib/data/types";

/**
 * In-app notifications (TASK-030, ADR-LeaveTrack-E007). Written by the SAME transaction as the
 * business change (lib/notifications/postgres.ts, memory.ts); each has an outbox row that TASK-037
 * will deliver by email. Payloads carry names and dates only — rendered as escaped text.
 */
export const NOTIFICATION_TYPES = [
  "request.submitted",
  "request.decided",
  "request.cancelled",
  "resolution.proposed",
  "resolution.accepted",
  "resolution.declined",
  "resolution.finalized",
  "resolution.expired",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** To the approver(s): someone asked for leave that waits for them. */
export type RequestSubmittedPayload = {
  requestId: string;
  requesterId: string;
  requesterName: string;
  leaveType: LeaveTypeName;
  startDate: string;
  endDate: string;
  days: number;
};

/** To the requester: their request was decided. */
export type RequestDecidedPayload = {
  requestId: string;
  decision: "approved" | "rejected";
  leaveType: LeaveTypeName;
  startDate: string;
  endDate: string;
  days: number;
  decidedByName: string;
  reason: string | null;
};

/** TASK-028 — to the approver(s): a request was withdrawn, or approved leave cancelled. */
export type RequestCancelledPayload = {
  requestId: string;
  requesterId: string;
  requesterName: string;
  leaveType: LeaveTypeName;
  startDate: string;
  endDate: string;
  days: number;
  wasApproved: boolean;
};

export type Notification =
  | NotificationBase<"request.submitted", RequestSubmittedPayload>
  | NotificationBase<"request.decided", RequestDecidedPayload>
  | NotificationBase<"request.cancelled", RequestCancelledPayload>
  | NotificationBase<"resolution.proposed", ResolutionProposedPayload>
  | NotificationBase<"resolution.accepted", ResolutionAcceptedPayload>
  | NotificationBase<"resolution.declined", ResolutionDeclinedPayload>
  | NotificationBase<"resolution.finalized", ResolutionFinalizedPayload>
  | NotificationBase<"resolution.expired", ResolutionExpiredPayload>;

/** TASK-034 — to the employee AND HR: nobody answered by the deadline; converted to Unpaid. */
export type ResolutionExpiredPayload = {
  resolutionId: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveTypeName;
  unpaidApplied: number;
};

/** TASK-033 — to HR (every HR Admin but the employee): the employee accepted. */
export type ResolutionAcceptedPayload = {
  resolutionId: string;
  employeeName: string;
  leaveType: LeaveTypeName;
  unpaidApplied: number;
  recoveryApplied: number;
};

/** TASK-033 — to HR: the employee declined (with their reason); HR re-proposes or decides. */
export type ResolutionDeclinedPayload = {
  resolutionId: string;
  employeeName: string;
  leaveType: LeaveTypeName;
  reason: string;
  proposalNumber: number;
};

/** TASK-033 — to the employee: HR's binding final decision after a second decline (D6). */
export type ResolutionFinalizedPayload = {
  resolutionId: string;
  leaveType: LeaveTypeName;
  unpaidApplied: number;
  recoveryApplied: number;
  reason: string;
};

/** TASK-032 — to the employee: HR proposes how a negative balance is resolved. */
export type ResolutionProposedPayload = {
  resolutionId: string;
  leaveType: LeaveTypeName;
  deficit: number;
  unpaidDays: number;
  recoveryDays: number;
  monthlyDeduction: number | null;
  recoveryStartPeriod: string | null;
  recoveryMonths: number | null;
  respondBy: string;
};

type NotificationBase<T extends NotificationType, P> = {
  id: string;
  recipientId: string;
  type: T;
  payload: P;
  readAt: string | null;
  createdAt: string;
};

export type OutboxEntry = {
  id: string;
  notificationId: string;
  recipientId: string;
  channel: "email";
  idempotencyKey: string;
  payload: Notification["payload"];
  status: "pending" | "sent" | "failed";
  attempts: number;
  nextAttemptAt: string;
  sentAt: string | null;
  createdAt: string;
};

/** Idempotency keys: one per (event, recipient) — duplicates are refused by the database. */
export const submittedKey = (requestId: string, recipientId: string) =>
  `request.submitted:${requestId}:${recipientId}`;
export const decidedKey = (requestId: string) => `request.decided:${requestId}`;
export const cancelledKey = (requestId: string, recipientId: string) =>
  `request.cancelled:${requestId}:${recipientId}`;
