import type { NextRequest } from "next/server";
import { AppError } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { getSession } from "@/lib/auth/session";
import { reproposeResolution, getResolutionDeps } from "@/lib/resolutions";

/**
 * POST /api/resolutions/:id/repropose — HR re-proposes once after a first decline (TASK-033, D6). Body: a split.
 *
 * 201 { success: true, data: { resolution } } · 400 VALIDATION_ERROR · 401 UNAUTHENTICATED ·
 * 403 FORBIDDEN · 404 NOT_FOUND · 409 CONFLICT (deadline passed, already answered, or the wrong round)
 */
export const POST = withErrorHandler(
  async (req: NextRequest, ctx: RouteContext<"/api/resolutions/[id]/repropose">) => {
    const session = await getSession();
    if (!session) throw new AppError("UNAUTHENTICATED", "Sign in to continue.");
    const { id } = await ctx.params;
    const body = await req.json().catch(() => {
      throw new AppError("VALIDATION_ERROR", "The request body must be JSON.");
    });
    const result = await reproposeResolution(session, id, body, getResolutionDeps());
    return ok(result, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  },
);
