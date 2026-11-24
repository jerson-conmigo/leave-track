"use server";

import { revalidatePath } from "next/cache";
import { isAppError } from "@/lib/api/errors";
import { getSession } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/data/types";
import { getSubmitDeps, submitLeaveRequest } from "@/lib/leave-requests";
import { logger } from "@/lib/logger";
import type { LeaveRequestInput } from "@/lib/validation/leave-request";

/**
 * Form transport for the same service behind POST /api/leave-requests.
 * Input is untrusted (server actions are public endpoints) — the service
 * re-validates it, and the requester comes from the session only.
 */
export async function submitLeaveRequestAction(values: LeaveRequestInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return {
      success: false,
      error: { code: "UNAUTHENTICATED", message: "Your session has expired. Sign in again." },
    };
  }

  try {
    const { warnings } = await submitLeaveRequest(session, values, getSubmitDeps());
    for (const path of ["/requests", "/dashboard", "/balance", "/approvals"]) revalidatePath(path);
    return { success: true, warnings };
  } catch (error) {
    if (isAppError(error) && error.status < 500) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
    logger.error({ err: error, userId: session.userId }, "submit leave request action failed");
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
    };
  }
}
