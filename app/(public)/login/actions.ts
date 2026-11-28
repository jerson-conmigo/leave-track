"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fromCookieJar } from "@/lib/auth/cookie-io";
import { getAuthProvider } from "@/lib/auth/provider";
import { MAX_REDIRECT_LENGTH, safeRedirectPath } from "@/lib/auth/roles";
import { getSessionSecret } from "@/lib/auth/session-secret";
import {
  clientIp,
  isSignInThrottled,
  recordSignInFailure,
  recordSignInSuccess,
  signInKeys,
  THROTTLED_MESSAGE,
  UNAVAILABLE_MESSAGE,
} from "@/lib/auth/sign-in-throttle";
import { clearSessionCookies, completeSignIn, NOT_LINKED_MESSAGE } from "@/lib/auth/sign-in";
import { repository } from "@/lib/data/repositories";
import { logger } from "@/lib/logger";
import { getRateLimitStore } from "@/lib/rate-limit";

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

  // TASK-025: throttle failed sign-ins per account and per IP, checked BEFORE the provider is
  // contacted. Same answer whether or not the account exists. Fails closed.
  const store = getRateLimitStore();
  const keys = signInKeys(
    parsed.data.email,
    clientIp(await headers(), process.env),
    getSessionSecret(),
  );
  try {
    if (await isSignInThrottled(store, keys, new Date())) {
      logger.warn({ event: "auth.signin_throttled" }, "sign-in refused: too many failures");
      return { error: THROTTLED_MESSAGE };
    }
  } catch (err) {
    logger.error({ event: "auth.signin_throttle_unavailable", err }, "rate limiter unavailable");
    return { error: UNAVAILABLE_MESSAGE };
  }

  const jar = await cookies();
  const io = fromCookieJar(jar);
  const result = await provider.signInWithPassword(io, parsed.data.email, parsed.data.password);
  if (!result.ok) {
    await recordSignInFailure(store, keys, new Date()).catch((err: unknown) =>
      logger.error({ event: "auth.signin_throttle_unavailable", err }, "failure not recorded"),
    );
    return { error: BAD_CREDENTIALS_MESSAGE };
  }

  const user = await repository.getUserByAuthUserId(result.authUserId);
  if (!user) {
    // Valid credentials, but no LeaveTrack user is linked: never leave a session behind.
    await provider.signOut(io);
    clearSessionCookies(jar);
    logger.warn({ authUserId: result.authUserId }, "sign-in refused: provider user not linked");
    return { error: NOT_LINKED_MESSAGE };
  }

  await recordSignInSuccess(store, keys).catch((err: unknown) =>
    logger.error({ event: "auth.signin_throttle_unavailable", err }, "failures not cleared"),
  );
  completeSignIn(jar, user);
  logger.info({ userId: user.id, role: user.role }, "sign-in");
  redirect(safeRedirectPath(parsed.data.next));
}

/**
 * TASK-025: the idle warning's sign-out (timer ran out, "Log out", or the 8-hour limit). Same
 * as logoutAction but WITHOUT a redirect: the client then goes to /login?reason=…, which also
 * works when the server already ended the session (proxy.ts refuses the request then).
 */
export async function endSessionAction(): Promise<void> {
  const jar = await cookies();
  await getAuthProvider().signOut(fromCookieJar(jar));
  clearSessionCookies(jar);
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  // Revoke the provider session on the Auth server (AC3), then drop our cookies.
  await getAuthProvider().signOut(fromCookieJar(jar));
  clearSessionCookies(jar);
  redirect("/login");
}
