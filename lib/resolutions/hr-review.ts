import { AppError } from "@/lib/api/errors";
import type { Session } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { settle } from "@/lib/resolutions/outcome";
import { requireHr, type ResolutionDeps, toSplit } from "@/lib/resolutions/propose";
import { resolutionId } from "@/lib/resolutions/respond";
import type { ResolutionView } from "@/lib/resolutions/types";
import { FinalizeResolutionSchema, ReproposeResolutionSchema } from "@/lib/resolutions/validation";

/**
 * TASK-033 (US-10 AC2/AC3, ADR-E006 D6) — HR's review of a declined resolution: re-propose ONCE
 * (proposal 2 supersedes proposal 1), and after a second decline record a binding final decision
 * with a reason. HR Admins only, never on their own balance.
 */
export async function reproposeResolution(
  session: Pick<Session, "userId" | "role">,
  id: string,
  rawInput: unknown,
  { store, now = new Date() }: ResolutionDeps,
): Promise<{ resolution: ResolutionView }> {
  requireHr(session, "re-propose resolutions");
  const parsed = ReproposeResolutionSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid proposal.");
  }
  const resolution = await settle(() =>
    store.reproposeWithAudit({
      ...toSplit(parsed.data, now),
      resolutionId: resolutionId(id),
      actorId: session.userId,
    }),
  );
  logger.info(
    {
      event: "resolution.reproposed",
      supersedes: id,
      resolutionId: resolution.id,
      by: session.userId,
    },
    "resolution re-proposed",
  );
  return { resolution };
}

export async function finalizeResolution(
  session: Pick<Session, "userId" | "role">,
  id: string,
  rawInput: unknown,
  { store, now = new Date() }: ResolutionDeps,
): Promise<{ resolution: ResolutionView }> {
  requireHr(session, "make final decisions");
  const parsed = FinalizeResolutionSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid decision.");
  }
  const resolution = await settle(() =>
    store.finalizeWithAudit({
      ...toSplit(parsed.data, now),
      reason: parsed.data.reason,
      resolutionId: resolutionId(id),
      actorId: session.userId,
    }),
  );
  logger.info(
    { event: "resolution.finalized", resolutionId: id, by: session.userId },
    "resolution finalized",
  );
  return { resolution };
}
