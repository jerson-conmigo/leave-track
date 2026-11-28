import { timingSafeEqual } from "node:crypto";
import { logger } from "@/lib/logger";

/**
 * Bearer auth for the scheduled jobs (TASK-017 accrual, TASK-034 resolution expiry). Vercel Cron
 * sends `Authorization: Bearer $CRON_SECRET`. Call this FIRST, before any database access.
 * Fails closed when CRON_SECRET is not configured; compares in constant time.
 */
export function isCronAuthorized(req: Request, job: string): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logger.error(
      { event: `${job}.misconfigured` },
      `CRON_SECRET is not configured — ${job} refused`,
    );
    return false;
  }
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  return expected.length === given.length && timingSafeEqual(expected, given);
}
