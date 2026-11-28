import type { CookieIO } from '@/lib/auth/cookie-io';
import { SESSION_MAX_AGE_SECONDS } from '@/lib/auth/cookies';
import { sessionPolicy } from '@/lib/auth/session-policy';
import { getSessionSecret } from '@/lib/auth/session-secret';
import {
  newSessionId,
  renewClaims,
  signSessionToken,
  verifySessionToken,
  type SessionClaims,
} from '@/lib/auth/session-token';
import { supabaseAccount } from '@/lib/auth/supabase/adapter';
import type { User } from '@/lib/data/types';
import { env } from '@/lib/env';

/**
 * Auth port (ADR-LeaveTrack-E004). Callers (login actions, the account pages, proxy.ts,
 * getSession) depend on this interface only.
 *
 * Two layers (TASK-024):
 *  - the PROVIDER session proves who someone is (Supabase Auth keeps it in its own cookies);
 *  - our SIGNED session token (the session cookie, TASK-023) says which LeaveTrack user they
 *    are. It is minted only after the provider identity was matched to a users row by
 *    `users.auth_user_id` — never by email.
 * Authorization always comes from the users row (getSession), never from either token.
 */
export type EmailLinkType = 'invite' | 'recovery';
export type ProviderResult = { ok: true; authUserId: string } | { ok: false };

/** Returned by `currentProviderUser` for an adapter without a provider session (mock). */
export const NO_PROVIDER_SESSION = 'no-provider-session';

export interface AuthProvider {
  readonly name: 'mock' | 'supabase';
  /** A new signed session token for `user`: a NEW session (new sid) on every sign-in. */
  createSessionToken(user: Pick<User, 'id' | 'role'>): string;
  /** Verified claims, or null for a missing, forged, tampered, expired or IDLE token. */
  readSessionToken(token: string | undefined): SessionClaims | null;
  /** proxy.ts: keep the provider session fresh. False = no live provider session. */
  refresh(io: CookieIO): Promise<boolean>;
  /**
   * getSession: the provider user id of a LIVE provider session (checked with the
   * provider, so a revoked session is null), or NO_PROVIDER_SESSION for the mock.
   */
  currentProviderUser(io: CookieIO): Promise<string | null | typeof NO_PROVIDER_SESSION>;
  signInWithPassword(io: CookieIO, email: string, password: string): Promise<ProviderResult>;
  /** Exchange an emailed invite / password-reset link for a provider session. */
  verifyEmailLink(io: CookieIO, tokenHash: string, type: EmailLinkType): Promise<boolean>;
  /** Set the password of the current provider session's user. */
  setPassword(io: CookieIO, password: string): Promise<ProviderResult>;
  /** Email a password-reset link. Never reveals whether the address exists. */
  requestPasswordReset(email: string, redirectTo: string): Promise<void>;
  /** Revoke the provider session (sign-out) and clear its cookies. */
  signOut(io: CookieIO): Promise<void>;
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

const sessionTokens = {
  createSessionToken(user: Pick<User, 'id' | 'role'>) {
    const iat = nowSeconds();
    return signSessionToken(
      {
        uid: user.id,
        role: user.role,
        sid: newSessionId(),
        iat,
        lat: iat,
        exp: iat + SESSION_MAX_AGE_SECONDS,
      },
      getSessionSecret()
    );
  },
  readSessionToken(token: string | undefined) {
    if (!token) return null;
    const result = verifySessionToken(
      token,
      getSessionSecret(),
      nowSeconds(),
      sessionPolicy().idleSeconds
    );
    return result.ok ? result.claims : null;
  },
};

/**
 * TASK-025 sliding idle window: the same session after activity at `now` — only `lat` moves;
 * `exp` (the 8-hour absolute limit) is copied, never recomputed. Written to the cookie only
 * by renewSession in lib/auth/sign-in.ts, which only proxy.ts calls.
 */
export function renewSessionToken(claims: SessionClaims, now: number = nowSeconds()): string {
  return signSessionToken(renewClaims(claims, now), getSessionSecret());
}

/**
 * Mock adapter — DEV/TEST ONLY: sign-in picks a seeded user without credentials, and
 * there is no provider session. lib/env.ts refuses to start a deployed environment
 * with AUTH_PROVIDER=mock.
 */
export const mockAuthProvider: AuthProvider = {
  name: 'mock',
  ...sessionTokens,
  refresh: async () => true,
  currentProviderUser: async () => NO_PROVIDER_SESSION,
  signInWithPassword: async () => ({ ok: false }),
  verifyEmailLink: async () => false,
  setPassword: async () => ({ ok: false }),
  requestPasswordReset: async () => {},
  signOut: async () => {},
};

/** Supabase Auth adapter (TASK-024) — every deployed environment. */
export const supabaseAuthProvider: AuthProvider = {
  name: 'supabase',
  ...sessionTokens,
  ...supabaseAccount,
};

export function getAuthProvider(): AuthProvider {
  return env.AUTH_PROVIDER === 'supabase' ? supabaseAuthProvider : mockAuthProvider;
}
