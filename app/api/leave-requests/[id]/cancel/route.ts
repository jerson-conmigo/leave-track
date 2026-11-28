import type { NextRequest } from "next/server";
import { AppError } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { getSession } from "@/lib/auth/session";
import { cancelLeaveRequest, getCancelDeps } from "@/lib/leave-requests";

/**
 * POST /api/leave-requests/:id/cancel — the requester withdraws a pending request or cancels
 * approved leave before it starts (TASK-028, US-16). No body; only the requester may cancel.
 *
 * 200 { success: true, data: { request, restoredDays } } · 400 VALIDATION_ERROR ·
 * 401 UNAUTHENTICATED · 403 FORBIDDEN (not yours) · 404 NOT_FOUND · 409 CONFLICT (started,
 * already decided against, or already cancelled)
 */
export const POST = withErrorHandler(
  async (_req: NextRequest, ctx: RouteContext<"/api/leave-requests/[id]/cancel">) => {
    const session = await getSession();
    if (!session) throw new AppError("UNAUTHENTICATED", "Sign in to continue.");
    const { id } = await ctx.params;
    const result = await cancelLeaveRequest(session, id, getCancelDeps());
    return ok(result, { headers: { "Cache-Control": "private, no-store" } });
  },
);
