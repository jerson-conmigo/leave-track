/**
 * Client idle-warning timing (TASK-025). Pure — no timers, no DOM — so the rules are unit
 * tested without waiting. The numbers come from the server (getSessionTiming → props), never
 * from constants here. The warning is UX only: the server enforces both limits on its own.
 */

/** Which limit the warning is about. "absolute" = the 8-hour limit, which can't be extended. */
export type WarningMode = 'idle' | 'absolute';

/** Countdown text: "1:00", "0:45", "0:05". Never negative. */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Seconds at which the countdown is announced to screen readers (not every second). */
export const ANNOUNCE_AT = [60, 30, 10, 5] as const;

export function shouldAnnounce(seconds: number): boolean {
  return (ANNOUNCE_AT as readonly number[]).includes(Math.ceil(seconds));
}

/** Words for the announcement, e.g. "30 seconds left" / "1 minute left". */
export function announcement(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  if (s === 60) return '1 minute left before you are signed out.';
  return `${s} ${s === 1 ? 'second' : 'seconds'} left before you are signed out.`;
}

/** When the absolute (8-hour) warning opens, in ms epoch: warningSeconds before the limit. */
export function absoluteWarningAt(absoluteExpiresAtMs: number, warningSeconds: number): number {
  return absoluteExpiresAtMs - warningSeconds * 1000;
}

/**
 * Is the idle deadline (from the client's last activity) at or after the absolute limit?
 * Then the session ends at the absolute limit and only the absolute warning applies — the
 * idle prompt would offer "Stay signed in", which can't help.
 */
export function absoluteComesFirst(
  nowMs: number,
  idleTimeoutSeconds: number,
  absoluteExpiresAtMs: number
): boolean {
  return nowMs + idleTimeoutSeconds * 1000 >= absoluteExpiresAtMs;
}

/**
 * Send a heartbeat now? Only after real activity (the caller only asks then) and at most once
 * per interval, so the server's idle window trails the client by less than the interval.
 */
export function heartbeatDue(
  lastSentMs: number | null,
  nowMs: number,
  intervalSeconds: number
): boolean {
  return lastSentMs === null || nowMs - lastSentMs >= intervalSeconds * 1000;
}

/** Login URL after the session ended on this client. Fixed reasons only. */
export function loginUrlFor(reason: 'idle' | 'expired'): string {
  return `/login?reason=${reason}`;
}

/** Cross-tab messages (BroadcastChannel "leavetrack-session"). */
export type SessionMessage =
  | { type: 'active' } // someone stayed signed in / was active: close any open warning
  | { type: 'signed-out'; reason?: 'idle' | 'expired' }; // the browser has no session now

export const SESSION_CHANNEL = 'leavetrack-session';

export function isSessionMessage(value: unknown): value is SessionMessage {
  if (!value || typeof value !== 'object') return false;
  const m = value as Record<string, unknown>;
  if (m.type === 'active') return true;
  return (
    m.type === 'signed-out' &&
    (m.reason === undefined || m.reason === 'idle' || m.reason === 'expired')
  );
}
