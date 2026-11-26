import type { NextRequest } from "next/server";
import { AppError } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { getSession } from "@/lib/auth/session";
import { decideLeaveRequest, getDecideDeps } from "@/lib/leave-requests";

/**
 * POST /api/leave-requests/:id/decision — approve or reject (US-03, TASK-014).
 * Body: { decision: "approve", reason? } | { decision: "reject", reason }.
 * The deciding manager is ALWAYS the session user; ids in the body are ignored.
 *
 * 200 { success: true, data: { request, warnings } }
 * 400 VALIDATION_ERROR · 401 UNAUTHENTICATED · 403 FORBIDDEN (not a manager / not
 * your direct report) · 404 NOT_FOUND · 409 CONFLICT (already decided)
 */
export const POST = withErrorHandler(
  async (req: NextRequest, ctx: RouteContext<"/api/leave-requests/[id]/decision">) => {
    const session = await getSession();
    if (!session) throw new AppError("UNAUTHENTICATED", "Sign in to continue.");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new AppError("VALIDATION_ERROR", "Request body must be valid JSON.");
    }

    const { id } = await ctx.params;
    const result = await decideLeaveRequest(session, id, body, getDecideDeps());
    return ok(result, { headers: { "Cache-Control": "private, no-store" } });
  },
);
