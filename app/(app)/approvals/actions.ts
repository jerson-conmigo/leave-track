"use server";

import { revalidatePath } from "next/cache";
import { isAppError } from "@/lib/api/errors";
import { getSession } from "@/lib/auth/session";
import type { ActionResult, Decision } from "@/lib/data/types";
import { decideLeaveRequest, getDecideDeps } from "@/lib/leave-requests";
import { logger } from "@/lib/logger";

/**
 * Form transport for the same service behind POST /api/leave-requests/:id/decision.
 * Server actions are public endpoints — the service re-validates everything and
 * the deciding manager comes from the session only.
 */
export async function decideLeaveRequestAction(
  requestId: string,
  decision: Decision,
  reason?: string,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return {
      success: false,
      error: { code: "UNAUTHENTICATED", message: "Your session has expired. Sign in again." },
    };
  }

  try {
    const { warnings } = await decideLeaveRequest(
      session,
      requestId,
      { decision, reason },
      getDecideDeps(),
    );
    for (const path of ["/approvals", "/dashboard", "/balance", "/requests"]) revalidatePath(path);
    return { success: true, warnings };
  } catch (error) {
    if (isAppError(error) && error.status < 500) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
    logger.error({ err: error, requestId, managerId: session.userId }, "decide action failed");
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
    };
  }
}
