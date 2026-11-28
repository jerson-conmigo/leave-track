import type { NextRequest } from "next/server";
import { AppError } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { getSession } from "@/lib/auth/session";
import { repository } from "@/lib/data/repositories";
import type { MyLeaveContext, TeamQueue } from "@/lib/data/types";
import { getSubmitDeps, submitLeaveRequest } from "@/lib/leave-requests";
import { ListQuerySchema } from "@/lib/validation/api";

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

const NO_STORE = { headers: { "Cache-Control": "private, no-store" } };

/**
 * GET /api/leave-requests — list leave requests for the session user.
 *
 * scope=mine (US-02): the session user's balance context — per-type balances
 *   (confirmed, pending shown separately, as of the last accrual run) and their
 *   own requests.  200 { success: true, data: { balances, requests } }
 *
 * scope=team (US-04, US-15, BR-02, BR-10): the approvals queue of a MANAGER or HR ADMIN —
 *   the requests they may decide, scoped in SQL by public.can_decide(<session user>, …). `status=pending` (default)
 *   or `all`. The role check lives here because proxy.ts's route→role matrix only
 *   covers pages.  200 { success: true, data: { requests } } · 403 FORBIDDEN
 *
 * The subject is ALWAYS the session user — `userId` / `managerId` query params
 * are ignored. 400 VALIDATION_ERROR (bad scope/status) · 401 UNAUTHENTICATED
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await getSession();
  if (!session) throw new AppError("UNAUTHENTICATED", "Sign in to continue.");

  const query = ListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!query.success) {
    throw new AppError("VALIDATION_ERROR", query.error.issues[0]?.message ?? "Invalid query.");
  }

  if (query.data.scope === "team") {
    // TASK-026: managers and HR Admins have a queue; its contents are scoped in SQL (can_decide).
    if (session.role !== "manager" && session.role !== "hr_admin") {
      throw new AppError("FORBIDDEN", "Only managers and HR Admins can view an approvals queue.");
    }
    const requests = await repository.listTeamRequests(
      session.userId,
      query.data.status === "pending" ? { status: "pending" } : undefined,
    );
    const data: TeamQueue = { requests };
    return ok(data, NO_STORE);
  }

  const [balances, requests] = await Promise.all([
    repository.getBalances(session.userId),
    repository.listMyRequests(session.userId),
  ]);
  const data: MyLeaveContext = { balances, requests };
  return ok(data, NO_STORE);
});
