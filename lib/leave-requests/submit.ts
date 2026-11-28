import { AppError } from "@/lib/api/errors";
import type { Session } from "@/lib/auth/session";
import type { SubmitLeaveRequestResult, SubmitWarning } from "@/lib/data/types";
import { daysBefore, todayUtc } from "@/lib/data/dates";
import { toRequestView } from "@/lib/data/views";
import { countDays, formatDays } from "@/lib/format";
import type { Notifier } from "@/lib/leave-requests/notifier";
import type { SubmitStore } from "@/lib/leave-requests/store";
import { logger } from "@/lib/logger";
import { LeaveRequestSchema, OVERLAP_MESSAGE } from "@/lib/validation/leave-request";

export type SubmitDeps = {
  store: SubmitStore;
  notifier: Notifier;
  /** TASK-027: the clock for the past-start rule (tests inject one; default: now). */
  now?: Date;
};

export const NO_APPROVER_MESSAGE =
  "There's no one to approve your request yet. Contact HR to have an approver assigned.";

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
  { store, notifier, now = new Date() }: SubmitDeps,
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
  // TASK-026 AC3 (BR-10): never create a request nobody can decide.
  const { approver } = requester;
  if (!approver) throw new AppError("CONFLICT", NO_APPROVER_MESSAGE);

  // TASK-027 (BR-13, ARCH D10): no start before today (UTC) minus the type's allowance — keyed on
  // the attribute, never the type's name. The database trigger enforces the same window.
  const earliest = daysBefore(todayUtc(now), leaveType.maxBackdateDays);
  if (input.startDate < earliest) {
    throw new AppError(
      "VALIDATION_ERROR",
      leaveType.maxBackdateDays === 0
        ? "Start date can't be in the past."
        : `${leaveType.name} leave can start at most ${leaveType.maxBackdateDays} days ago.`,
    );
  }
  // No overlap with your own pending/approved requests (any type). A racing duplicate is still
  // refused by the database's exclusion constraint (mapped to the same 400 by toAppError).
  if (await store.hasOverlap(session.userId, input.startDate, input.endDate)) {
    throw new AppError("VALIDATION_ERROR", OVERLAP_MESSAGE);
  }

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
  // The approver vanished between the check and the insert (org-chart change): nothing written.
  if (!request) throw new AppError("CONFLICT", NO_APPROVER_MESSAGE);

  try {
    await notifier.leaveRequestSubmitted({
      requestId: request.id,
      employee: { id: requester.id, name: requester.name },
      approver,
      leaveType: leaveType.name,
      startDate: request.startDate,
      endDate: request.endDate,
      days,
    });
  } catch (error) {
    logger.error({ err: error, requestId: request.id }, "approver notification failed");
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

  const awaiting = approver.kind === "manager" ? approver.name : "HR";
  return { request: toRequestView(request, leaveType.name, null, awaiting), warnings };
}
