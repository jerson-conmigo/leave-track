import { logger } from "@/lib/logger";
import type { ResolutionDeps } from "@/lib/resolutions/propose";
import { sumDays } from "@/lib/data/decimal";

export type ResolutionExpiryResult = {
  /** Proposals converted and closed in this run. */
  expired: number;
  /** Total days converted to Unpaid in this run. */
  convertedDays: number;
  /** Proposals left for the next run (locked by a response, or failed — see the logs). */
  skipped: number;
};

/**
 * TASK-034 (US-11, ADR-LeaveTrack-E006 §5) — the daily expiry: every proposal past its
 * respond_by is converted to Unpaid (clamped to the current deficit) and closed, and the
 * employee and HR are told. Idempotent: a second run finds nothing to do. Called only after the
 * route's cron auth. Logs counts only (no names).
 */
export async function runResolutionExpiry(
  { store }: ResolutionDeps,
  { limit = 500 }: { limit?: number } = {},
): Promise<ResolutionExpiryResult> {
  const { expired, skipped } = await store.expireDue({ limit });
  const result = {
    expired: expired.length,
    convertedDays: sumDays(expired.map((e) => e.unpaid)),
    skipped,
  };
  logger.info({ event: "resolution.expiry", ...result }, "resolution expiry run");
  return result;
}
