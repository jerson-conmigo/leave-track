import "server-only";
import { LEGACY_SESSION_COOKIES, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/cookies";
import { getAuthProvider, renewSessionToken } from "@/lib/auth/provider";
import type { SessionClaims } from "@/lib/auth/session-token";
import type { User } from "@/lib/data/types";
import { isProduction } from "@/lib/env";

/** Shown when valid provider credentials belong to nobody in LeaveTrack (TASK-024 AC2). */
export const NOT_LINKED_MESSAGE = "This account isn't set up for LeaveTrack. Contact HR.";

type WritableJar = {
  set(name: string, value: string, options?: Record<string, unknown>): unknown;
  delete(name: string): unknown;
};

/**
 * The ONLY place that writes the signed session cookie (TASK-024; pinned by
 * tests/auth/session-boundary.test.ts). Callers must already have identified `user`:
 * the mock picker, or a provider identity matched by users.auth_user_id.
 * A fresh token on every sign-in; the Day 0 unsigned cookies are dropped.
 */
export function completeSignIn(jar: WritableJar, user: Pick<User, "id" | "role">): void {
  jar.set(
    SESSION_COOKIE,
    getAuthProvider().createSessionToken(user),
    sessionCookieOptions(isProduction),
  );
  for (const legacy of LEGACY_SESSION_COOKIES) jar.delete(legacy);
}

/** Drop the signed session and the Day 0 cookies (sign-out, failed sign-in). */
/**
 * TASK-025 sliding idle window — called ONLY by proxy.ts (pinned by
 * tests/auth/session-boundary.test.ts). Re-issues the SAME session with `lat` = now. The
 * cookie's max age is the time left until the session's absolute expiry, never a fresh 8 h:
 * activity can't extend the absolute limit.
 */
export function renewSession(
  jar: WritableJar,
  claims: SessionClaims,
  now: number = Math.floor(Date.now() / 1000),
): void {
  jar.set(SESSION_COOKIE, renewSessionToken(claims, now), {
    ...sessionCookieOptions(isProduction),
    maxAge: Math.max(1, claims.exp - now),
  });
}

export function clearSessionCookies(jar: WritableJar): void {
  jar.delete(SESSION_COOKIE);
  for (const legacy of LEGACY_SESSION_COOKIES) jar.delete(legacy);
}
