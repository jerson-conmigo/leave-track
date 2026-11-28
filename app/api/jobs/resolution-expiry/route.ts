import type { NextRequest } from "next/server";
import { AppError } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { isCronAuthorized } from "@/lib/jobs/cron-auth";
import { getResolutionDeps, runResolutionExpiry } from "@/lib/resolutions";

/**
 * /api/jobs/resolution-expiry — converts proposals nobody answered by their deadline to Unpaid
 * (TASK-034, US-11, ADR-LeaveTrack-E006 §5). Daily via Vercel Cron (GET); POST for manual runs.
 * Bearer CRON_SECRET is checked FIRST, before any database access, and fails closed. Public in
 * proxy.ts (cron has no session cookie). Idempotent.
 *
 * 200 { success: true, data: { expired, convertedDays, skipped } } · 401 UNAUTHENTICATED
 */
const handler = withErrorHandler(async (req: NextRequest) => {
  if (!isCronAuthorized(req, "resolution-expiry")) {
    throw new AppError("UNAUTHENTICATED", "Unauthorized.");
  }
  const result = await runResolutionExpiry(getResolutionDeps());
  return ok(result, { headers: { "Cache-Control": "no-store" } });
});

export const GET = handler;
export const POST = handler;
