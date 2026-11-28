import { z } from "zod";
import { AppError } from "@/lib/api/errors";
import type { Session } from "@/lib/auth/session";
import { todayUtc } from "@/lib/data/dates";
import type { CancelLeaveRequestResult } from "@/lib/data/types";
import { toRequestView } from "@/lib/data/views";
import { countDays } from "@/lib/format";
import type { CancelStore } from "@/lib/leave-requests/store";
import { logger } from "@/lib/logger";

/**
 * TASK-028 (US-16 AC3–AC4, BR-13) — the requester withdraws a PENDING request or cancels APPROVED
 * leave before its first day (UTC). Only the requester (the session user — never the body); the
 * store enforces it in SQL together with the state, so races and double cancels just fail.
 * Approved leave of a tracked type gets exactly its debit back (the approval's ledger delta),
 * all in one transaction with the audit row and the approvers' notifications.
 */
const RequestIdSchema = z.uuid({ error: "Invalid leave request id." });

export type CancelDeps = { store: CancelStore; now?: Date };

export async function cancelLeaveRequest(
  session: Pick<Session, "userId">,
  requestId: string,
  { store, now = new Date() }: CancelDeps,
): Promise<CancelLeaveRequestResult> {
  const id = RequestIdSchema.safeParse(requestId);
  if (!id.success) throw new AppError("VALIDATION_ERROR", "Invalid leave request id.");

  const outcome = await store.cancelWithAudit({
    requestId: id.data,
    actorId: session.userId,
    today: todayUtc(now),
    daysFor: countDays,
  });

  if (!outcome.ok) {
    if (outcome.reason === "not_found") throw new AppError("NOT_FOUND", "Leave request not found.");
    if (outcome.reason === "not_yours") {
      throw new AppError("FORBIDDEN", "You can only cancel your own requests.");
    }
    if (outcome.reason === "started") {
      throw new AppError("CONFLICT", "Leave that has already started can't be cancelled.");
    }
    throw new AppError("CONFLICT", "Only pending or upcoming approved requests can be cancelled.");
  }

  const { request, leaveType, wasApproved, restoredDays } = outcome;
  logger.info(
    {
      event: "leave_request.cancelled",
      requestId: request.id,
      userId: session.userId,
      wasApproved,
      restoredDays,
    },
    wasApproved ? "approved leave cancelled" : "pending request withdrawn",
  );
  return { request: toRequestView(request, leaveType.name, null, null), restoredDays };
}
