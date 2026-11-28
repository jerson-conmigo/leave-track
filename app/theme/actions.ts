"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/data/types";
import { isProduction } from "@/lib/env";
import { THEME_COOKIE, THEME_COOKIE_MAX_AGE, ThemeSchema } from "@/lib/theme";

/**
 * TASK-047 — remember the visitor's colour theme (light, dark or system). Validated with zod; the
 * cookie is httpOnly because only the server reads it (app/layout.tsx). Not an auth cookie.
 */
export async function setThemeAction(theme: unknown): Promise<ActionResult> {
  const parsed = ThemeSchema.safeParse(theme);
  if (!parsed.success) {
    return { success: false, error: { code: "VALIDATION_ERROR", message: "Unknown theme." } };
  }
  (await cookies()).set(THEME_COOKIE, parsed.data, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: THEME_COOKIE_MAX_AGE,
  });
  revalidatePath("/", "layout");
  return { success: true };
}
