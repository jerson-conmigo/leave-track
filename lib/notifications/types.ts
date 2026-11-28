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
  | NotificationBase<"request.cancelled", RequestCancelledPayload>;

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
