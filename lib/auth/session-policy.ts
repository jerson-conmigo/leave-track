import { SESSION_MAX_AGE_SECONDS } from '@/lib/auth/cookies';
import { IdleTimeoutMinutesSchema } from '@/lib/env';

/**
 * Session timing policy (TASK-025, US-13 AC3) — the ONLY source of these numbers. The server
 * checks (readSessionToken), the proxy's sliding renewal and the client idle warning all read
 * it, so the warning can never disagree with what the server enforces.
 *
 * The idle timeout comes from SESSION_IDLE_TIMEOUT_MINUTES (default 30, 5–480); TASK-040 will
 * move it to the HR settings page by changing this function only. The absolute limit (8 h
 * since sign-in) is fixed.
 */
export type SessionPolicy = {
  /** Sign out after this long without activity. */
  idleSeconds: number;
  /** Sign out this long after sign-in, whatever the activity. */
  absoluteSeconds: number;
  /** The client warning appears this long before the session ends. */
  warningSeconds: number;
  /** proxy.ts renews `lat` on an ordinary request at most this often (heartbeats always). */
  touchIntervalSeconds: number;
  /** The client sends at most one heartbeat per this long, and only on real activity. */
  heartbeatIntervalSeconds: number;
};

export const WARNING_SECONDS = 60;
export const TOUCH_INTERVAL_SECONDS = 60;
/** Half the warning: the server's `lat` lags the client's last activity by less than this, so
 *  the server can't expire a session before the client has shown its warning. */
export const HEARTBEAT_INTERVAL_SECONDS = 30;

export function sessionPolicy(
  raw: Record<string, string | undefined> = process.env
): SessionPolicy {
  const value = raw.SESSION_IDLE_TIMEOUT_MINUTES;
  const minutes = IdleTimeoutMinutesSchema.parse(value === '' ? undefined : value);
  return {
    idleSeconds: minutes * 60,
    absoluteSeconds: SESSION_MAX_AGE_SECONDS,
    warningSeconds: WARNING_SECONDS,
    touchIntervalSeconds: TOUCH_INTERVAL_SECONDS,
    heartbeatIntervalSeconds: HEARTBEAT_INTERVAL_SECONDS,
  };
}

/** POST here is the client's activity heartbeat: proxy.ts always renews it. */
export const HEARTBEAT_PATH = '/api/session/heartbeat';

/**
 * Does this authenticated request renew the idle window? Pure (proxy.ts supplies the facts).
 * - Prefetches (Next's router or the browser) are not user activity: never.
 * - The heartbeat: always.
 * - Anything else: when `lat` is at least touchIntervalSeconds old (limits Set-Cookie churn).
 */
export function shouldRenew(
  facts: { nowSeconds: number; lat: number; isHeartbeat: boolean; isPrefetch: boolean },
  policy: Pick<SessionPolicy, 'touchIntervalSeconds'>
): boolean {
  if (facts.isPrefetch) return false;
  if (facts.isHeartbeat) return true;
  return facts.nowSeconds - facts.lat >= policy.touchIntervalSeconds;
}
