"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { LEGACY_SESSION_COOKIES, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/cookies";
import { getAuthProvider } from "@/lib/auth/provider";
import { MAX_REDIRECT_LENGTH, safeRedirectPath } from "@/lib/auth/roles";
import { repository } from "@/lib/data/repositories";
import { isProduction } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * ⚠️ MOCK SIGN-IN (dev/test only; refused in deployed environments by lib/env.ts) —
 * accepts ANY email/password; no credentials are checked. Picks a seeded user and sets
 * a SIGNED session cookie through the auth port (TASK-023, ADR-LeaveTrack-E004).
 * TASK-024 replaces the sign-in step with a real provider.
 */

export type LoginState = { error?: string };

const LoginSchema = z.object({
  userId: z.uuid({ error: "Choose who to sign in as." }),
  // Over-long values are dropped (not an error) so sign-in never fails because of `next`.
  next: z
    .string()
    .optional()
    .transform((v) => (v && v.length <= MAX_REDIRECT_LENGTH ? v : undefined)),
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
  // A new signed token on every sign-in (TASK-023); drop any Day 0 unsigned cookies.
  jar.set(SESSION_COOKIE, getAuthProvider().createSessionToken(user), opts);
  for (const legacy of LEGACY_SESSION_COOKIES) jar.delete(legacy);
  logger.info({ userId: user.id, role: user.role }, "mock sign-in");

  redirect(safeRedirectPath(parsed.data.next));
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  for (const legacy of LEGACY_SESSION_COOKIES) jar.delete(legacy);
  redirect("/login");
}
