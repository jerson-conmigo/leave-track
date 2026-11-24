/**
 * Mock session cookies (ADR-LeaveTrack-E001).
 * ⚠️ Day 0 only — login accepts any input. Day 1 replaces HOW these get set
 * (real auth provider); the names, shape, and guard logic stay the same.
 */
export const SESSION_COOKIE = {
  role: "mock-role",
  userId: "mock-user-id",
} as const;

/** 8 hours, per ARCH › Security. */
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
