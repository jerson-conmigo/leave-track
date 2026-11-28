import { AppError } from "@/lib/api/errors";
import type { Session } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { settle } from "@/lib/resolutions/outcome";
import type { ResolutionStore, SplitInput } from "@/lib/resolutions/store";
import type { ResolutionView } from "@/lib/resolutions/types";
import { earliestRecoveryStart, ProposeResolutionSchema } from "@/lib/resolutions/validation";

export type ResolutionDeps = { store: ResolutionStore; now?: Date };

export function requireHr(session: Pick<Session, "role">, what: string) {
  if (session.role !== "hr_admin") throw new AppError("FORBIDDEN", `Only HR Admins can ${what}.`);
}

/** A validated split → the store's shape (no recovery fields when nothing is recovered). */
export function toSplit(
  input: {
    unpaidDays: number;
    recoveryDays: number;
    recoveryStartPeriod?: string;
    recoveryMonths?: number;
  },
  now: Date,
): SplitInput {
  const recovering = input.recoveryDays > 0;
  if (recovering && input.recoveryStartPeriod! < earliestRecoveryStart(now)) {
    throw new AppError("VALIDATION_ERROR", "A recovery can start next month at the earliest.");
  }
  return {
    unpaidDays: input.unpaidDays,
    recoveryDays: input.recoveryDays,
    recoveryStartPeriod: recovering ? input.recoveryStartPeriod! : null,
    recoveryMonths: recovering ? input.recoveryMonths! : null,
  };
}

/**
 * TASK-032 (US-09) — HR proposes how a negative balance is resolved. HR Admins only, never on
 * their own balance; amounts are re-checked against the CURRENT deficit inside the store's
 * transaction; the deadline is fixed at proposal. Errors are AppErrors (400/403/404/409).
 */
export async function proposeResolution(
  session: Pick<Session, "userId" | "role" | "name">,
  rawInput: unknown,
  { store, now = new Date() }: ResolutionDeps,
): Promise<{ resolution: ResolutionView }> {
  requireHr(session, "propose resolutions");
  const parsed = ProposeResolutionSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid proposal.");
  }
  const input = parsed.data;
  if (input.userId === session.userId) {
    throw new AppError("FORBIDDEN", "You can't resolve your own balance.");
  }
  const resolution = await settle(() =>
    store.proposeWithAudit({
      ...toSplit(input, now),
      userId: input.userId,
      leaveTypeId: input.leaveTypeId,
      actorId: session.userId,
    }),
  );
  logger.info(
    {
      event: "resolution.proposed",
      resolutionId: resolution.id,
      userId: input.userId,
      by: session.userId,
    },
    "resolution proposed",
  );
  return { resolution };
}
