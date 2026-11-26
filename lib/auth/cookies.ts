/**
 * Session cookie (TASK-023, ADR-LeaveTrack-E004): ONE httpOnly cookie holding a signed
 * token (lib/auth/session-token.ts). The Day 0 cookies below were unsigned — anyone
 * could set them — and are now ignored everywhere and only ever deleted.
 */
export const SESSION_COOKIE = "lt-session";

/** Day 0 unsigned cookies (ADR-LeaveTrack-E001). Never read; cleared on sign-in/out. */
export const LEGACY_SESSION_COOKIES = ["mock-role", "mock-user-id"] as const;

/** 8 hours, per ARCH › Security — also the token lifetime (exp − iat). */
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
