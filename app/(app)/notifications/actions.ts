"use server";

import { revalidatePath } from "next/cache";
import { isAppError } from "@/lib/api/errors";
import { getSession } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/data/types";
import { getMarkReadDeps, markNotificationsRead } from "@/lib/notifications";
import { logger } from "@/lib/logger";

/**
 * TASK-030 — form transport for the same service behind POST /api/notifications/read. Only the
 * session user's own notifications can be marked (the store scopes it in SQL). No ids = all.
 */
export async function markNotificationsReadAction(ids?: string[]): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return {
      success: false,
      error: { code: "UNAUTHENTICATED", message: "Your session has expired. Sign in again." },
    };
  }
  try {
    await markNotificationsRead(session, ids ? { ids } : {}, getMarkReadDeps());
    revalidatePath("/", "layout"); // the header bell's unread count
    return { success: true };
  } catch (error) {
    if (isAppError(error)) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
    logger.error({ err: error }, "marking notifications as read failed");
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
    };
  }
}
