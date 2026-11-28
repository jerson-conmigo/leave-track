import type { NextRequest } from "next/server";
import { AppError } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { getSession } from "@/lib/auth/session";
import { getResolutionDeps, proposeResolution } from "@/lib/resolutions";

/**
 * POST /api/resolutions — an HR Admin proposes how an employee's negative balance is resolved
 * (TASK-032, US-09). Body: ProposeResolutionInput.
 *
 * 201 { success: true, data: { resolution } } · 400 VALIDATION_ERROR · 401 UNAUTHENTICATED ·
 * 403 FORBIDDEN (not HR, or your own balance) · 404 NOT_FOUND · 409 CONFLICT (an open
 * resolution exists, or the balance is no longer below zero)
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getSession();
  if (!session) throw new AppError("UNAUTHENTICATED", "Sign in to continue.");
  const body = await req.json().catch(() => {
    throw new AppError("VALIDATION_ERROR", "The request body must be JSON.");
  });
  const result = await proposeResolution(session, body, getResolutionDeps());
  return ok(result, { status: 201, headers: { "Cache-Control": "private, no-store" } });
});
