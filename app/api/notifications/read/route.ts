import type { NextRequest } from "next/server";
import { AppError } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { getSession } from "@/lib/auth/session";
import { getMarkReadDeps, markNotificationsRead } from "@/lib/notifications";

/**
 * POST /api/notifications/read — mark the session user's OWN notifications as read (TASK-030).
 * Body `{ ids?: uuid[] }`; no ids = all unread. Ids that aren't the user's are not touched.
 *
 * 200 { success: true, data: { updated } } · 400 VALIDATION_ERROR · 401 UNAUTHENTICATED
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getSession();
  if (!session) throw new AppError("UNAUTHENTICATED", "Sign in to continue.");
  let body: unknown = {};
  const text = await req.text();
  if (text.trim() !== "") {
    try {
      body = JSON.parse(text);
    } catch {
      throw new AppError("VALIDATION_ERROR", "Request body must be valid JSON.");
    }
  }
  const result = await markNotificationsRead(session, body, getMarkReadDeps());
  return ok(result, { headers: { "Cache-Control": "private, no-store" } });
});
