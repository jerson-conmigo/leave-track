import type { NextRequest } from "next/server";
import { getAccrualDeps, runMonthlyAccrual } from "@/lib/accrual";
import type { AccrualTrigger } from "@/lib/accrual/store";
import { AppError } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { isCronAuthorized } from "@/lib/jobs/cron-auth";

/**
 * /api/jobs/accrual — monthly leave accrual (US-07, TASK-017, ADR-LeaveTrack-E002).
 *
 *   GET  — Vercel Cron (it only issues GET, with `Authorization: Bearer $CRON_SECRET`)
 *   POST — manual / ops run (the ARCH contract), same auth and behaviour
 *
 * The trigger recorded for audit comes from the HTTP METHOD (GET → cron, POST →
 * manual); it is never used for authorization and the User-Agent is ignored.
 * Auth happens FIRST (lib/jobs/cron-auth.ts), before any database access, and fails closed
 * when CRON_SECRET is not configured. Public in proxy.ts (cron has no session cookie).
 *
 * 200 { success: true, data: { accrued, upToDate, catchUp } }
 * 401 UNAUTHENTICATED · 409 CONFLICT (too many missed months — manual review)
 */
function handler(trigger: AccrualTrigger) {
  return withErrorHandler(async (req: NextRequest) => {
    if (!isCronAuthorized(req, "accrual")) throw new AppError("UNAUTHENTICATED", "Unauthorized.");
    const result = await runMonthlyAccrual(getAccrualDeps(), { trigger });
    return ok(result, { headers: { "Cache-Control": "no-store" } });
  });
}

export const GET = handler("cron");
export const POST = handler("manual");
