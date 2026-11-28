import { AppError } from "@/lib/api/errors";
import type { Session } from "@/lib/auth/session";
import { toAppError } from "@/lib/db/errors";
import { logger } from "@/lib/logger";
import type { ResolutionStore } from "@/lib/resolutions/store";
import { monthlyDeduction, type ResolutionView } from "@/lib/resolutions/types";
import { earliestRecoveryStart, ProposeResolutionSchema } from "@/lib/resolutions/validation";

export type ProposeDeps = { store: ResolutionStore; now?: Date };

/**
 * TASK-032 (US-09) — HR proposes how a negative balance is resolved. HR Admins only, never on
 * their own balance; amounts are re-checked against the CURRENT deficit inside the store's
 * transaction; the deadline is fixed at proposal. Errors are AppErrors (400/403/404/409).
 */
export async function proposeResolution(
  session: Pick<Session, "userId" | "role" | "name">,
  rawInput: unknown,
  { store, now = new Date() }: ProposeDeps,
): Promise<{ resolution: ResolutionView }> {
  if (session.role !== "hr_admin") {
    throw new AppError("FORBIDDEN", "Only HR Admins can propose resolutions.");
  }
  const parsed = ProposeResolutionSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid proposal.");
  }
  const input = parsed.data;
  if (input.userId === session.userId) {
    throw new AppError("FORBIDDEN", "You can't resolve your own balance.");
  }
  const recovering = input.recoveryDays > 0;
  if (recovering && input.recoveryStartPeriod! < earliestRecoveryStart(now)) {
    throw new AppError("VALIDATION_ERROR", "A recovery can start next month at the earliest.");
  }

  let outcome;
  try {
    outcome = await store.proposeWithAudit({
      userId: input.userId,
      leaveTypeId: input.leaveTypeId,
      unpaidDays: input.unpaidDays,
      recoveryDays: input.recoveryDays,
      recoveryStartPeriod: recovering ? input.recoveryStartPeriod! : null,
      recoveryMonths: recovering ? input.recoveryMonths! : null,
      actorId: session.userId,
    });
  } catch (error) {
    const known = toAppError(error);
    if (known) throw known;
    throw error;
  }

  if (!outcome.ok) {
    switch (outcome.reason) {
      case "not_found":
        throw new AppError("NOT_FOUND", "Employee or leave type not found.");
      case "untracked":
        throw new AppError("VALIDATION_ERROR", "This leave type has no balance to resolve.");
      case "not_in_deficit":
        throw new AppError("CONFLICT", "This balance is no longer below zero.");
      case "split_mismatch":
        throw new AppError(
          "VALIDATION_ERROR",
          `Unpaid and recovery days must add up to the deficit (${outcome.deficit} days).`,
        );
      default:
        throw new AppError(
          "VALIDATION_ERROR",
          `The monthly deduction can't exceed the accrual rate (${outcome.accrualPerMonth ?? 0} days a month).`,
        );
    }
  }

  logger.info(
    {
      event: "resolution.proposed",
      resolutionId: outcome.id,
      userId: input.userId,
      by: session.userId,
    },
    "resolution proposed",
  );
  return {
    resolution: {
      id: outcome.id,
      userId: input.userId,
      userName: outcome.userName,
      leaveType: outcome.leaveType,
      status: "proposed",
      deficit: outcome.deficit,
      unpaidDays: input.unpaidDays,
      recoveryDays: input.recoveryDays,
      monthlyDeduction: recovering
        ? monthlyDeduction(input.recoveryDays, input.recoveryMonths!)
        : null,
      recoveryStartPeriod: recovering ? input.recoveryStartPeriod! : null,
      recoveryMonths: recovering ? input.recoveryMonths! : null,
      respondBy: outcome.respondBy,
      proposedByName: session.name,
      proposedAt: outcome.proposedAt,
    },
  };
}
