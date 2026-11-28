import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_COOKIE } from '@/lib/auth/cookies';
import {
  HEARTBEAT_INTERVAL_SECONDS,
  sessionPolicy,
  shouldRenew,
  TOUCH_INTERVAL_SECONDS,
  WARNING_SECONDS,
} from '@/lib/auth/session-policy';
import { getSessionSecret } from '@/lib/auth/session-secret';
import {
  newSessionId,
  signSessionToken,
  verifySessionToken,
  type SessionClaims,
} from '@/lib/auth/session-token';
import { proxy } from '@/proxy';

/**
 * TASK-025 — idle timeout + absolute limit, enforced by the server on every request, and the
 * sliding renewal in proxy.ts. Time is controlled with fake timers: nothing waits.
 */
const ANA = '00000000-0000-4000-8000-000000000101';
const T0 = 1_900_000_000; // seconds
const IDLE = 30 * 60;
const EIGHT_HOURS = 8 * 3600;

const claimsAt = (c: Partial<SessionClaims> = {}): SessionClaims => ({
  uid: ANA,
  role: 'employee',
  sid: newSessionId(),
  iat: T0,
  lat: T0,
  exp: T0 + EIGHT_HOURS,
  ...c,
});
const tokenFor = (c: SessionClaims) => signSessionToken(c, getSessionSecret());
const at = (seconds: number) => vi.setSystemTime(new Date(seconds * 1000));

const request = (
  path: string,
  token: string,
  { method = 'GET', headers = {} }: { method?: string; headers?: Record<string, string> } = {}
) =>
  new NextRequest(`http://localhost${path}`, {
    method,
    headers: { cookie: `${SESSION_COOKIE}=${token}`, ...headers },
  });

/** The renewed session cookie on a response, decoded — or null if none was set. */
function renewed(res: Response): { claims: SessionClaims; maxAge: number } | null {
  const header = res.headers.getSetCookie().find(c => c.startsWith(`${SESSION_COOKIE}=`));
  if (!header) return null;
  const value = header.slice(SESSION_COOKIE.length + 1).split(';')[0]!;
  if (!value) return null;
  const result = verifySessionToken(
    decodeURIComponent(value),
    getSessionSecret(),
    Math.floor(Date.now() / 1000)
  );
  if (!result.ok) throw new Error(`renewed cookie does not verify: ${result.reason}`);
  return { claims: result.claims, maxAge: Number(/Max-Age=(\d+)/i.exec(header)?.[1]) };
}
const cleared = (res: Response) =>
  res.headers
    .getSetCookie()
    .some(c => c.startsWith(`${SESSION_COOKIE}=;`) || /lt-session=;?.*Max-Age=0/i.test(c));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.stubEnv('SESSION_IDLE_TIMEOUT_MINUTES', '30');
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('sessionPolicy — one source for every timer', () => {
  it('defaults to a 30-minute idle timeout, 8-hour absolute limit and 60 s warning', () => {
    expect(sessionPolicy({})).toEqual({
      idleSeconds: 1800,
      absoluteSeconds: EIGHT_HOURS,
      warningSeconds: 60,
      touchIntervalSeconds: 60,
      heartbeatIntervalSeconds: 30,
    });
  });

  it.each([
    ['5', 300],
    ['45', 2700],
    ['480', 28800],
    ['', 1800],
  ])('SESSION_IDLE_TIMEOUT_MINUTES=%j → %i s', (value, seconds) => {
    expect(sessionPolicy({ SESSION_IDLE_TIMEOUT_MINUTES: value }).idleSeconds).toBe(seconds);
  });

  it.each(['4', '481', '0', '-5', '12.5', 'thirty'])('refuses %j', value => {
    expect(() => sessionPolicy({ SESSION_IDLE_TIMEOUT_MINUTES: value })).toThrow(
      /SESSION_IDLE_TIMEOUT_MINUTES/
    );
  });

  it("the client heartbeat interval is shorter than the warning (server can't expire first)", () => {
    expect(HEARTBEAT_INTERVAL_SECONDS).toBeLessThan(WARNING_SECONDS);
    expect(TOUCH_INTERVAL_SECONDS).toBeLessThanOrEqual(WARNING_SECONDS);
  });
});

describe('shouldRenew', () => {
  const policy = { touchIntervalSeconds: 60 };
  it.each([
    ['prefetch, even a stale one', { lat: T0 - 600, isHeartbeat: false, isPrefetch: true }, false],
    [
      'prefetch of the heartbeat path',
      { lat: T0 - 600, isHeartbeat: true, isPrefetch: true },
      false,
    ],
    ['heartbeat, even a fresh one', { lat: T0, isHeartbeat: true, isPrefetch: false }, true],
    [
      'request 59 s after the last renewal',
      { lat: T0 - 59, isHeartbeat: false, isPrefetch: false },
      false,
    ],
    [
      'request 60 s after the last renewal',
      { lat: T0 - 60, isHeartbeat: false, isPrefetch: false },
      true,
    ],
  ])('%s → %s', (_l, facts, expected) => {
    expect(shouldRenew({ nowSeconds: T0, ...facts }, policy)).toBe(expected);
  });
});

describe('proxy.ts — the server enforces idle and absolute expiry', () => {
  it('idle: allowed 1 s before the idle timeout; from the timeout on, pages → /login, APIs → 401', async () => {
    const token = tokenFor(claimsAt());
    at(T0 + IDLE - 1);
    expect((await proxy(request('/dashboard', token))).headers.get('x-middleware-next')).toBe('1');

    at(T0 + IDLE);
    const page = await proxy(request('/dashboard', token));
    expect(page.status).toBe(307);
    expect(page.headers.get('location')).toBe('http://localhost/login?next=%2Fdashboard');
    expect(cleared(page)).toBe(true);
    const api = await proxy(request('/api/leave-requests?scope=mine', token));
    expect(api.status).toBe(401);
    expect(await api.json()).toEqual({
      success: false,
      error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.' },
    });
  });

  it('the idle timeout follows SESSION_IDLE_TIMEOUT_MINUTES', async () => {
    vi.stubEnv('SESSION_IDLE_TIMEOUT_MINUTES', '10');
    const token = tokenFor(claimsAt());
    at(T0 + 10 * 60);
    expect((await proxy(request('/dashboard', token))).status).toBe(307);
  });

  it('absolute: a session active a second ago is still refused at 8 hours', async () => {
    const token = tokenFor(claimsAt({ lat: T0 + EIGHT_HOURS - 1 }));
    at(T0 + EIGHT_HOURS);
    expect((await proxy(request('/dashboard', token))).status).toBe(307);
    expect((await proxy(request('/api/session/heartbeat', token, { method: 'POST' }))).status).toBe(
      401
    );
  });

  it('a pre-TASK-025 v1 cookie is refused (one sign-out on deploy)', async () => {
    const v1 = 'v1.eyJ1aWQiOiJ4In0.c2ln';
    at(T0);
    expect((await proxy(request('/dashboard', v1))).status).toBe(307);
  });
});

describe('proxy.ts — sliding renewal (activity extends idle, never the absolute limit)', () => {
  it('an ordinary request 60 s+ after the last renewal re-issues the SAME session with lat = now', async () => {
    const original = claimsAt();
    at(T0 + 90);
    const out = renewed(await proxy(request('/dashboard', tokenFor(original))));
    expect(out).not.toBeNull();
    expect(out!.claims).toEqual({ ...original, lat: T0 + 90 });
    expect(out!.maxAge).toBe(original.exp - (T0 + 90)); // counts down — never a fresh 8 h
  });

  it("a request within 60 s of the last renewal doesn't re-issue (no Set-Cookie churn)", async () => {
    at(T0 + 59);
    expect(renewed(await proxy(request('/dashboard', tokenFor(claimsAt()))))).toBeNull();
  });

  it('the heartbeat always renews', async () => {
    at(T0 + 5);
    const res = await proxy(
      request('/api/session/heartbeat', tokenFor(claimsAt()), { method: 'POST' })
    );
    expect(renewed(res)?.claims.lat).toBe(T0 + 5);
  });

  it.each([
    ['next-router-prefetch', '1'],
    ['purpose', 'prefetch'],
    ['sec-purpose', 'prefetch;prerender'],
  ])('a prefetch (%s) is not activity: no renewal', async (name, value) => {
    at(T0 + 600);
    const res = await proxy(
      request('/requests', tokenFor(claimsAt()), { headers: { [name]: value } })
    );
    expect(res.headers.get('x-middleware-next')).toBe('1');
    expect(renewed(res)).toBeNull();
  });

  it('renewals keep extending idle across the day but the session still ends at exactly 8 h', async () => {
    let token = tokenFor(claimsAt());
    // Active every 25 minutes for 8 hours: never idle, renewed each time…
    for (let t = T0 + 25 * 60; t < T0 + EIGHT_HOURS; t += 25 * 60) {
      at(t);
      const res = await proxy(request('/dashboard', token));
      expect(res.headers.get('x-middleware-next'), `refused at +${t - T0}s`).toBe('1');
      const out = renewed(res)!;
      expect(out.claims.exp).toBe(T0 + EIGHT_HOURS);
      expect(out.maxAge).toBe(T0 + EIGHT_HOURS - t);
      token = tokenFor(out.claims);
    }
    // …and refused at the absolute limit regardless.
    at(T0 + EIGHT_HOURS);
    expect((await proxy(request('/dashboard', token))).status).toBe(307);
  });

  it('an expired or idle request never gets a renewed cookie', async () => {
    at(T0 + IDLE + 5);
    const res = await proxy(
      request('/api/session/heartbeat', tokenFor(claimsAt()), { method: 'POST' })
    );
    expect(res.status).toBe(401);
    expect(renewed(res)).toBeNull();
  });
});
