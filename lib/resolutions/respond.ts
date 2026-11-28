import { z } from "zod";
import { AppError } from "@/lib/api/errors";
import type { Session } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { settle } from "@/lib/resolutions/outcome";
import type { ResolutionDeps } from "@/lib/resolutions/propose";
import type { ResolutionView } from "@/lib/resolutions/types";
import { DeclineResolutionSchema } from "@/lib/resolutions/validation";

/** A malformed id is simply "not found" (never a database error). */
export function resolutionId(id: string): string {
  if (!z.uuid().safeParse(id).success) throw new AppError("NOT_FOUND", "Resolution not found.");
  return id;
}

/**
 * TASK-033 (US-10 AC1/AC4/AC5) — the employee accepts their own proposal before its deadline.
 * Amounts are clamped to the current deficit and applied in one transaction; HR is notified.
 * Someone else's resolution is 404 (its existence isn't revealed).
 */
export async function acceptResolution(
  session: Pick<Session, "userId">,
  id: string,
  { store }: ResolutionDeps,
): Promise<{ resolution: ResolutionView }> {
  const resolution = await settle(() =>
    store.acceptWithApply({ resolutionId: resolutionId(id), actorId: session.userId }),
  );
  logger.info(
    { event: "resolution.accepted", resolutionId: id, by: session.userId },
    "resolution accepted",
  );
  return { resolution };
}

/** TASK-033 (US-10 AC2) — the employee declines with a 3–500 character reason; HR reviews. */
export async function declineResolution(
  session: Pick<Session, "userId">,
  id: string,
  rawInput: unknown,
  { store }: ResolutionDeps,
): Promise<{ resolution: ResolutionView }> {
  const parsed = DeclineResolutionSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Enter a reason.");
  }
  const resolution = await settle(() =>
    store.declineWithReason({
      resolutionId: resolutionId(id),
      actorId: session.userId,
      reason: parsed.data.reason,
    }),
  );
  logger.info(
    { event: "resolution.declined", resolutionId: id, by: session.userId },
    "resolution declined",
  );
  return { resolution };
}
