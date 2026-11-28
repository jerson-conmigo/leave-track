import type { NextRequest } from "next/server";
import { AppError } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { getSession } from "@/lib/auth/session";
import { acceptResolution, getResolutionDeps } from "@/lib/resolutions";

/**
 * POST /api/resolutions/:id/accept — The employee accepts their own proposal before its deadline (TASK-033, US-10 AC1/AC4/AC5). No body.
 *
 * 200 { success: true, data: { resolution } } · 400 VALIDATION_ERROR · 401 UNAUTHENTICATED ·
 * 403 FORBIDDEN · 404 NOT_FOUND · 409 CONFLICT (deadline passed, already answered, or the wrong round)
 */
export const POST = withErrorHandler(
  async (_req: NextRequest, ctx: RouteContext<"/api/resolutions/[id]/accept">) => {
    const session = await getSession();
    if (!session) throw new AppError("UNAUTHENTICATED", "Sign in to continue.");
    const { id } = await ctx.params;
    const result = await acceptResolution(session, id, getResolutionDeps());
    return ok(result, { headers: { "Cache-Control": "private, no-store" } });
  },
);
