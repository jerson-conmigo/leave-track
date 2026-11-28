"use server";

import { revalidatePath } from "next/cache";
import { isAppError } from "@/lib/api/errors";
import { getSession } from "@/lib/auth/session";
import { toAppError } from "@/lib/db/errors";
import type { ActionResult } from "@/lib/data/types";
import { logger } from "@/lib/logger";
import {
  acceptResolution,
  declineResolution,
  finalizeResolution,
  getResolutionDeps,
  proposeResolution,
  reproposeResolution,
} from "@/lib/resolutions";

/**
 * TASK-032 — form transport for the same service behind POST /api/resolutions. The HR actor
 * comes from the session only; the service re-validates everything.
 */
export async function proposeResolutionAction(input: unknown): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return {
      success: false,
      error: { code: "UNAUTHENTICATED", message: "Your session has expired. Sign in again." },
    };
  }
  try {
    await proposeResolution(session, input, getResolutionDeps());
    revalidatePath("/resolutions");
    revalidatePath("/", "layout"); // the employee's notification bell
    return { success: true };
  } catch (error) {
    const known = isAppError(error) ? error : toAppError(error);
    if (known && known.status < 500) {
      return { success: false, error: { code: known.code, message: known.message } };
    }
    logger.error({ err: error, userId: session.userId }, "propose resolution action failed");
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
    };
  }
}

type Transition = "accept" | "decline" | "repropose" | "finalize";

/**
 * TASK-033 — form transport for the same services behind POST /api/resolutions/:id/<action>.
 * The actor comes from the session only; each service re-validates everything.
 */
export async function resolutionTransitionAction(
  action: Transition,
  id: string,
  input?: unknown,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return {
      success: false,
      error: { code: "UNAUTHENTICATED", message: "Your session has expired. Sign in again." },
    };
  }
  try {
    const deps = getResolutionDeps();
    if (action === "accept") await acceptResolution(session, id, deps);
    else if (action === "decline") await declineResolution(session, id, input, deps);
    else if (action === "repropose") await reproposeResolution(session, id, input, deps);
    else await finalizeResolution(session, id, input, deps);
    for (const path of ["/resolutions", "/balance", "/dashboard"]) revalidatePath(path);
    revalidatePath("/", "layout"); // notification bells
    return { success: true };
  } catch (error) {
    const known = isAppError(error) ? error : toAppError(error);
    if (known && known.status < 500) {
      return { success: false, error: { code: known.code, message: known.message } };
    }
    logger.error(
      { err: error, action, resolutionId: id, userId: session.userId },
      "resolution action failed",
    );
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
    };
  }
}
