import { AppError } from "@/lib/api/errors";
import type { Session } from "@/lib/auth/session";
import type { SubmitLeaveRequestResult, SubmitWarning } from "@/lib/data/types";
import { countDays, formatDays } from "@/lib/format";
import type { Notifier } from "@/lib/leave-requests/notifier";
import type { SubmitStore } from "@/lib/leave-requests/store";
import { logger } from "@/lib/logger";
import { LeaveRequestSchema } from "@/lib/validation/leave-request";

export type SubmitDeps = { store: SubmitStore; notifier: Notifier };

/**
 * Submit a leave request (US-01). Shared by POST /api/leave-requests and the
 * form's server action.
 *  - Validates with the same schema as the form; nothing is written on failure (AC2).
 *  - Over-balance is a WARNING, never a block (AC3); untracked types (Unpaid)
 *    are never balance-checked (US-08 AC2).
 *  - The request and its `submitted` audit row are written atomically.
 *  - The manager is notified after commit (AC1); a notification failure never
 *    undoes a submitted request.
 */
export async function submitLeaveRequest(
  session: Pick<Session, "userId">,
  rawInput: unknown,
  { store, notifier }: SubmitDeps,
): Promise<SubmitLeaveRequestResult> {
  const parsed = LeaveRequestSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid request.");
  }
  const input = parsed.data;

  const leaveType = await store.getLeaveType(input.leaveTypeId);
  if (!leaveType) throw new AppError("VALIDATION_ERROR", "Choose a valid leave type.");

  const requester = await store.getRequester(session.userId);
  if (!requester) throw new AppError("UNAUTHENTICATED", "Your session is no longer valid.");

  const days = countDays(input.startDate, input.endDate);
  const warnings: SubmitWarning[] = [];
  if (leaveType.tracksBalance) {
    const { confirmed, pending } = await store.getBalanceContext(session.userId, leaveType.id);
    const available =
      confirmed - pending.reduce((sum, p) => sum + countDays(p.startDate, p.endDate), 0);
    if (days > available) {
      warnings.push({
        code: "EXCEEDS_BALANCE",
        message: `You're requesting ${formatDays(days)} but have ${formatDays(Math.max(available, 0))} of ${leaveType.name} available. HR will review it for an override.`,
        requestedDays: days,
        availableDays: available,
      });
    }
  }

  const request = await store.insertRequestWithAudit({
    userId: session.userId, // never from the request body
    leaveTypeId: leaveType.id,
    startDate: input.startDate,
    endDate: input.endDate,
    reason: input.reason,
  });

  try {
    await notifier.leaveRequestSubmitted({
      requestId: request.id,
      employee: { id: requester.id, name: requester.name },
      manager: requester.manager,
      leaveType: leaveType.name,
      startDate: request.startDate,
      endDate: request.endDate,
      days,
    });
  } catch (error) {
    logger.error({ err: error, requestId: request.id }, "manager notification failed");
  }

  logger.info(
    {
      requestId: request.id,
      userId: session.userId,
      leaveType: leaveType.name,
      days,
      warnings: warnings.length,
    },
    "leave request submitted",
  );

  return {
    request: {
      id: request.id,
      leaveType: leaveType.name,
      startDate: request.startDate,
      endDate: request.endDate,
      days,
      reason: request.reason,
      status: request.status,
      createdAt: request.createdAt,
      decidedAt: null,
      decidedByName: null,
    },
    warnings,
  };
}
