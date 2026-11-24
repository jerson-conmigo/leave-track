import type { NextRequest } from "next/server";
import { z } from "zod";
import { AppError } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { getSession } from "@/lib/auth/session";
import { repository } from "@/lib/data/repositories";
import type { MyLeaveContext } from "@/lib/data/types";
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

/** `scope=team` joins this enum in TASK-013 (manager-only, scoped in SQL). */
const ListQuerySchema = z.object({
  scope: z.enum(["mine"], { error: "Unsupported scope." }),
});

/**
 * GET /api/leave-requests?scope=mine — the session user's balance context
 * (US-02): per-type balances (confirmed, pending shown separately, as of the
 * last accrual run) and their own requests. Always the SESSION user — any
 * `userId` in the query is ignored.
 *
 * 200 { success: true, data: { balances, requests } }
 * 400 VALIDATION_ERROR (missing/unsupported scope) · 401 UNAUTHENTICATED
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await getSession();
  if (!session) throw new AppError("UNAUTHENTICATED", "Sign in to continue.");

  const query = ListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!query.success) {
    throw new AppError("VALIDATION_ERROR", query.error.issues[0]?.message ?? "Invalid query.");
  }

  const [balances, requests] = await Promise.all([
    repository.getBalances(session.userId),
    repository.listMyRequests(session.userId),
  ]);
  const data: MyLeaveContext = { balances, requests };
  return ok(data, { headers: { "Cache-Control": "private, no-store" } });
});
