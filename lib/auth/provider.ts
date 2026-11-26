import { SESSION_MAX_AGE_SECONDS } from "@/lib/auth/cookies";
import { getSessionSecret } from "@/lib/auth/session-secret";
import { signSessionToken, verifySessionToken, type SessionClaims } from "@/lib/auth/session-token";
import type { User } from "@/lib/data/types";

/**
 * Auth port (ADR-LeaveTrack-E004). Callers (login action, proxy.ts, getSession) depend
 * on this interface only; TASK-024 adds a Supabase adapter without touching them.
 */
export interface AuthProvider {
  readonly name: "mock";
  /** A new signed session token for `user` (a fresh token on every sign-in). */
  createSessionToken(user: Pick<User, "id" | "role">): string;
  /** Verified claims, or null for a missing, forged, tampered or expired token. */
  readSessionToken(token: string | undefined): SessionClaims | null;
}

/**
 * Mock adapter — DEV/TEST ONLY: sign-in picks a seeded user without credentials.
 * lib/env.ts refuses to start a deployed environment with AUTH_PROVIDER=mock.
 */
export const mockAuthProvider: AuthProvider = {
  name: "mock",
  createSessionToken(user) {
    const iat = Math.floor(Date.now() / 1000);
    return signSessionToken(
      { uid: user.id, role: user.role, iat, exp: iat + SESSION_MAX_AGE_SECONDS },
      getSessionSecret(),
    );
  },
  readSessionToken(token) {
    if (!token) return null;
    const result = verifySessionToken(token, getSessionSecret());
    return result.ok ? result.claims : null;
  },
};

export function getAuthProvider(): AuthProvider {
  // Only "mock" exists until TASK-024; lib/env.ts validates AUTH_PROVIDER.
  return mockAuthProvider;
}
