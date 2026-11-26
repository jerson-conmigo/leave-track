import type { NextRequest } from "next/server";
import { z } from "zod";
import { AppError } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { getSession } from "@/lib/auth/session";
import { repository } from "@/lib/data/repositories";

const ParamsSchema = z.object({ userId: z.uuid({ error: "Invalid employee id." }) });
const QuerySchema = z
  .object({
    from: z.iso.date({ error: "`from` must be a date (YYYY-MM-DD)." }).optional(),
    to: z.iso.date({ error: "`to` must be a date (YYYY-MM-DD)." }).optional(),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    error: "`from` must be on or before `to`.",
  });

/**
 * GET /api/audit/:userId — an employee's full decision history (US-05, BR-04):
 * every non-deleted request with status, decision-maker, decision time, reason,
 * and its audit events. No default date cap (3+ years). Optional `from` / `to`
 * filter on the request's creation date (UTC, inclusive).
 *
 * HR Admin only. The role is checked BEFORE any database access; proxy.ts's
 * route→role matrix covers pages (/audit), not /api/audit, so this is the gate.
 *
 * 200 { success: true, data: { employee, requests } }
 * 400 VALIDATION_ERROR · 401 UNAUTHENTICATED · 403 FORBIDDEN · 404 NOT_FOUND
 */
export const GET = withErrorHandler(
  async (req: NextRequest, ctx: RouteContext<"/api/audit/[userId]">) => {
    const session = await getSession();
    if (!session) throw new AppError("UNAUTHENTICATED", "Sign in to continue.");
    if (session.role !== "hr_admin") {
      throw new AppError("FORBIDDEN", "Only HR admins can view audit history.");
    }

    const params = ParamsSchema.safeParse(await ctx.params);
    if (!params.success) throw new AppError("VALIDATION_ERROR", "Invalid employee id.");
    const query = QuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!query.success) {
      throw new AppError("VALIDATION_ERROR", query.error.issues[0]?.message ?? "Invalid query.");
    }

    const history = await repository.getEmployeeAuditHistory(params.data.userId, query.data);
    if (!history) throw new AppError("NOT_FOUND", "Employee not found.");
    return ok(history, { headers: { "Cache-Control": "private, no-store" } });
  },
);
