import { mockDb } from "@/lib/data/mock/store";
import { countDays } from "@/lib/format";
import { canDecide } from "@/lib/leave-requests/approver";
import {
  cancelledKey,
  decidedKey,
  submittedKey,
  type Notification,
  type OutboxEntry,
} from "@/lib/notifications/types";

/**
 * Notification writers over the in-memory mock DB — the same rows as lib/notifications/postgres.ts
 * (parity-tested). Called from inside the memory stores' synchronous sections, so they land with
 * the business change or not at all. Duplicate idempotency keys are refused like the database
 * does (23505 + notification_outbox_idempotency_key_key).
 */
function append(notification: Notification, key: string): void {
  if (mockDb.notificationOutbox.some((o) => o.idempotencyKey === key)) {
    throw Object.assign(new Error("notification_outbox_idempotency_key_key violated"), {
      code: "23505",
      constraint: "notification_outbox_idempotency_key_key",
    });
  }
  const outbox: OutboxEntry = {
    id: crypto.randomUUID(),
    notificationId: notification.id,
    recipientId: notification.recipientId,
    channel: "email",
    idempotencyKey: key,
    payload: notification.payload,
    status: "pending",
    attempts: 0,
    nextAttemptAt: notification.createdAt,
    sentAt: null,
    createdAt: notification.createdAt,
  };
  mockDb.notifications.push(notification);
  mockDb.notificationOutbox.push(outbox);
}

/** Every user who may decide it (approver.ts canDecide = SQL can_decide). */
export function writeRequestSubmittedMemory(requestId: string, now: string): number {
  const r = mockDb.leaveRequests.find((x) => x.id === requestId)!;
  const requester = mockDb.users.find((u) => u.id === r.userId)!;
  const type = mockDb.leaveTypes.find((t) => t.id === r.leaveTypeId)!;
  const recipients = mockDb.users.filter((a) => canDecide(mockDb.users, a.id, r.userId));
  for (const a of recipients) {
    append(
      {
        id: crypto.randomUUID(),
        recipientId: a.id,
        type: "request.submitted",
        payload: {
          requestId: r.id,
          requesterId: requester.id,
          requesterName: requester.name,
          leaveType: type.name,
          startDate: r.startDate,
          endDate: r.endDate,
          days: countDays(r.startDate, r.endDate),
        },
        readAt: null,
        createdAt: now,
      },
      submittedKey(r.id, a.id),
    );
  }
  return recipients.length;
}

/** The requester. */
export function writeRequestDecidedMemory(requestId: string, now: string): number {
  const r = mockDb.leaveRequests.find((x) => x.id === requestId)!;
  if (r.status !== "approved" && r.status !== "rejected") return 0;
  const type = mockDb.leaveTypes.find((t) => t.id === r.leaveTypeId)!;
  const decider = mockDb.users.find((u) => u.id === r.decidedBy)!;
  append(
    {
      id: crypto.randomUUID(),
      recipientId: r.userId,
      type: "request.decided",
      payload: {
        requestId: r.id,
        decision: r.status,
        leaveType: type.name,
        startDate: r.startDate,
        endDate: r.endDate,
        days: countDays(r.startDate, r.endDate),
        decidedByName: decider.name,
        reason: r.decisionReason,
      },
      readAt: null,
      createdAt: now,
    },
    decidedKey(r.id),
  );
  return 1;
}

/** TASK-028 — every user who may decide the requester's leave (approver.ts = SQL can_decide). */
export function writeRequestCancelledMemory(
  requestId: string,
  wasApproved: boolean,
  now: string,
): number {
  const r = mockDb.leaveRequests.find((x) => x.id === requestId)!;
  const requester = mockDb.users.find((u) => u.id === r.userId)!;
  const type = mockDb.leaveTypes.find((t) => t.id === r.leaveTypeId)!;
  const recipients = mockDb.users.filter((a) => canDecide(mockDb.users, a.id, r.userId));
  for (const a of recipients) {
    append(
      {
        id: crypto.randomUUID(),
        recipientId: a.id,
        type: "request.cancelled",
        payload: {
          requestId: r.id,
          requesterId: requester.id,
          requesterName: requester.name,
          leaveType: type.name,
          startDate: r.startDate,
          endDate: r.endDate,
          days: countDays(r.startDate, r.endDate),
          wasApproved,
        },
        readAt: null,
        createdAt: now,
      },
      cancelledKey(r.id, a.id),
    );
  }
  return recipients.length;
}
