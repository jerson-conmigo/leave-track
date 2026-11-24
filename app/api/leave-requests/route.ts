import type { NextRequest } from "next/server";
import { AppError } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { getSession } from "@/lib/auth/session";
import { getSubmitDeps, submitLeaveRequest } from "@/lib/leave-requests";

/**
 * POST /api/leave-requests — submit a leave request (US-01, TASK-011).
 * Any authenticated role may submit. The requester is ALWAYS the session user;
 * a `userId` in the body is ignored.
 *
 * 201 { success: true, data: { request, warnings } }
 * 400 VALIDATION_ERROR · 401 UNAUTHENTICATED · 500 INTERNAL_ERROR
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getSession();
  if (!session) throw new AppError("UNAUTHENTICATED", "Sign in to continue.");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new AppError("VALIDATION_ERROR", "Request body must be valid JSON.");
  }

  const result = await submitLeaveRequest(session, body, getSubmitDeps());
  return ok(result, { status: 201 });
});
