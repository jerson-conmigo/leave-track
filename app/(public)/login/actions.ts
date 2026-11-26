"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fromCookieJar } from "@/lib/auth/cookie-io";
import { getAuthProvider } from "@/lib/auth/provider";
import { MAX_REDIRECT_LENGTH, safeRedirectPath } from "@/lib/auth/roles";
import { clearSessionCookies, completeSignIn, NOT_LINKED_MESSAGE } from "@/lib/auth/sign-in";
import { repository } from "@/lib/data/repositories";
import { logger } from "@/lib/logger";

export type LoginState = { error?: string };

const BAD_CREDENTIALS_MESSAGE = "Email or password is incorrect.";

// Over-long values are dropped (not an error) so sign-in never fails because of `next`.
const next = z
  .string()
  .optional()
  .transform((v) => (v && v.length <= MAX_REDIRECT_LENGTH ? v : undefined));

/**
 * ⚠️ MOCK SIGN-IN (dev/test only; refused in deployed environments by lib/env.ts) —
 * accepts ANY email/password; no credentials are checked. Picks a seeded user and sets
 * a SIGNED session cookie through the auth port (TASK-023, ADR-LeaveTrack-E004).
 * Refused outright unless AUTH_PROVIDER=mock, so it can never bypass Supabase Auth.
 */
const MockLoginSchema = z.object({
  userId: z.uuid({ error: "Choose who to sign in as." }),
  next,
});

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (getAuthProvider().name !== "mock") return { error: "Sign in with your email and password." };

  const parsed = MockLoginSchema.safeParse({
    userId: formData.get("userId"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid sign-in." };

  const user = await repository.getUserById(parsed.data.userId);
  if (!user) return { error: "That account doesn't exist." };

  completeSignIn(await cookies(), user);
  logger.info({ userId: user.id, role: user.role }, "mock sign-in");
  redirect(safeRedirectPath(parsed.data.next));
}

/**
 * Supabase Auth sign-in (TASK-024). The provider checks the password; the users row is
 * found ONLY by users.auth_user_id (set when HR invited the person) — never by email.
 */
const PasswordLoginSchema = z.object({
  email: z.email({ error: "Enter your work email." }).max(320),
  password: z.string().min(1, { error: "Enter your password." }).max(1024),
  next,
});

export async function passwordLoginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const provider = getAuthProvider();
  if (provider.name !== "supabase") return { error: "Password sign-in isn't enabled." };

  const parsed = PasswordLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid sign-in." };

  const jar = await cookies();
  const io = fromCookieJar(jar);
  const result = await provider.signInWithPassword(io, parsed.data.email, parsed.data.password);
  if (!result.ok) return { error: BAD_CREDENTIALS_MESSAGE };

  const user = await repository.getUserByAuthUserId(result.authUserId);
  if (!user) {
    // Valid credentials, but no LeaveTrack user is linked: never leave a session behind.
    await provider.signOut(io);
    clearSessionCookies(jar);
    logger.warn({ authUserId: result.authUserId }, "sign-in refused: provider user not linked");
    return { error: NOT_LINKED_MESSAGE };
  }

  completeSignIn(jar, user);
  logger.info({ userId: user.id, role: user.role }, "sign-in");
  redirect(safeRedirectPath(parsed.data.next));
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  // Revoke the provider session on the Auth server (AC3), then drop our cookies.
  await getAuthProvider().signOut(fromCookieJar(jar));
  clearSessionCookies(jar);
  redirect("/login");
}
