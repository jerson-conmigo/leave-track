import { z } from "zod";
import { AppError } from "@/lib/api/errors";
import type { Session } from "@/lib/auth/session";
import type { DecideLeaveRequestResult, DecideWarning } from "@/lib/data/types";
import { toRequestView } from "@/lib/data/views";
import { countDays, formatDayNumber } from "@/lib/format";
import type { Notifier } from "@/lib/leave-requests/notifier";
import type { DecideStore } from "@/lib/leave-requests/store";
import { logger } from "@/lib/logger";
import { DecisionSchema } from "@/lib/validation/leave-request";

export type DecideDeps = { store: DecideStore; notifier: Notifier };

const RequestIdSchema = z.uuid({ error: "Invalid leave request id." });

/**
 * Approve or reject a leave request (US-03, TASK-014). Shared by
 * POST /api/leave-requests/:id/decision and the approvals server action.
 *  - Managers only; the manager is ALWAYS the session user.
 *  - Scope (direct reports) and the pending guard are enforced in the store's SQL.
 *  - Outcomes: 404 unknown/soft-deleted · 403 not your report (AC3) · 409 already decided.
 *  - Approve decrements that request's own leave type (tracked types only); a
 *    negative result is ALLOWED and returned as a NEGATIVE_BALANCE warning.
 *  - The employee is notified after commit; a notification failure is logged and
 *    never affects the decision.
 */
export async function decideLeaveRequest(
  session: Pick<Session, "userId" | "role">,
  requestId: string,
  rawBody: unknown,
  { store, notifier }: DecideDeps,
): Promise<DecideLeaveRequestResult> {
  // TASK-026: managers and HR Admins may decide; WHICH requests is decided in SQL (can_decide).
  if (session.role !== "manager" && session.role !== "hr_admin") {
    throw new AppError(
      "FORBIDDEN",
      "Only managers and HR Admins can approve or reject leave requests.",
    );
  }
  const id = RequestIdSchema.safeParse(requestId);
  if (!id.success) throw new AppError("VALIDATION_ERROR", "Invalid leave request id.");
  const body = DecisionSchema.safeParse(rawBody);
  if (!body.success) {
    throw new AppError("VALIDATION_ERROR", body.error.issues[0]?.message ?? "Invalid decision.");
  }
  const { decision, reason } = body.data;

  const outcome = await store.decideWithAudit({
    requestId: id.data,
    actorId: session.userId,
    decision,
    reason,
    daysFor: countDays,
  });

  if (!outcome.ok) {
    if (outcome.reason === "not_found") throw new AppError("NOT_FOUND", "Leave request not found.");
    if (outcome.reason === "own_request") {
      throw new AppError("FORBIDDEN", "You can't decide your own leave request.");
    }
    if (outcome.reason === "not_report") {
      throw new AppError("FORBIDDEN", "You can only decide requests that are waiting for you.");
    }
    throw new AppError("CONFLICT", "This request has already been decided.");
  }

  const { request, leaveType, employee, decidedBy, days, balanceAfter } = outcome;
  const warnings: DecideWarning[] = [];
  if (balanceAfter !== null && balanceAfter < 0) {
    warnings.push({
      code: "NEGATIVE_BALANCE",
      message: `${employee.name}'s ${leaveType.name} balance is now ${formatDayNumber(balanceAfter)} days (HR override).`,
      leaveType: leaveType.name,
      balanceAfter,
    });
    logger.warn(
      { requestId: request.id, employeeId: employee.id, leaveType: leaveType.name, balanceAfter },
      "approval left a negative balance",
    );
  }

  logger.info(
    { requestId: request.id, actorId: session.userId, decision: request.status, days },
    "leave request decided",
  );

  // After commit. A failure here must never affect the (already committed) decision.
  try {
    await notifier.leaveRequestDecided({
      requestId: request.id,
      decision: request.status === "approved" ? "approved" : "rejected",
      employee,
      decidedBy,
      leaveType: leaveType.name,
      startDate: request.startDate,
      endDate: request.endDate,
      days,
      reason: request.decisionReason,
    });
  } catch (error) {
    logger.error(
      { err: error, requestId: request.id, event: "leave_request.decided" },
      "employee notification failed",
    );
  }

  return { request: toRequestView(request, leaveType.name, decidedBy.name, null), warnings };
}
