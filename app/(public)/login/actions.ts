"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/cookies";
import { safeRedirectPath } from "@/lib/auth/roles";
import { repository } from "@/lib/data/repositories";
import { isProduction } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * ⚠️ MOCK AUTH (ADR-LeaveTrack-E001) — accepts ANY email/password; no
 * credentials are checked. Picks a seeded user and sets the session cookies.
 * Day 1 replaces only the body of loginAction with a real provider.
 */

export type LoginState = { error?: string };

const LoginSchema = z.object({
  userId: z.uuid({ error: "Choose who to sign in as." }),
  next: z.string().optional(),
});

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    userId: formData.get("userId"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid sign-in." };

  const user = await repository.getUserById(parsed.data.userId);
  if (!user) return { error: "That account doesn't exist." };

  const jar = await cookies();
  const opts = sessionCookieOptions(isProduction);
  jar.set(SESSION_COOKIE.role, user.role, opts);
  jar.set(SESSION_COOKIE.userId, user.id, opts);
  logger.info({ userId: user.id, role: user.role }, "mock sign-in");

  redirect(safeRedirectPath(parsed.data.next));
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE.role);
  jar.delete(SESSION_COOKIE.userId);
  redirect("/login");
}
