"use server";

import { revalidatePath } from "next/cache";
import { isAppError } from "@/lib/api/errors";
import { getSession } from "@/lib/auth/session";
import { toAppError } from "@/lib/db/errors";
import type { ActionResult } from "@/lib/data/types";
import { cancelLeaveRequest, getCancelDeps } from "@/lib/leave-requests";
import { logger } from "@/lib/logger";

/**
 * TASK-028 — form transport for the same service behind POST /api/leave-requests/:id/cancel.
 * The requester comes from the session only; the service re-validates everything.
 */
export async function cancelLeaveRequestAction(requestId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return {
      success: false,
      error: { code: "UNAUTHENTICATED", message: "Your session has expired. Sign in again." },
    };
  }
  try {
    await cancelLeaveRequest(session, requestId, getCancelDeps());
    for (const path of ["/requests", "/dashboard", "/balance", "/approvals"]) revalidatePath(path);
    revalidatePath("/", "layout"); // approvers' notification bells
    return { success: true };
  } catch (error) {
    const known = isAppError(error) ? error : toAppError(error);
    if (known && known.status < 500) {
      return { success: false, error: { code: known.code, message: known.message } };
    }
    logger.error({ err: error, requestId, userId: session.userId }, "cancel action failed");
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
    };
  }
}
