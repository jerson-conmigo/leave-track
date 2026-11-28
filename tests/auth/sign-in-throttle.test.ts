import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_COOKIE } from '@/lib/auth/cookies';
import {
  clientIp,
  isSignInThrottled,
  MAX_FAILURES_PER_EMAIL,
  MAX_FAILURES_PER_IP,
  recordSignInFailure,
  SIGN_IN_WINDOW_SECONDS,
  signInKeys,
  THROTTLED_MESSAGE,
  UNAVAILABLE_MESSAGE,
} from '@/lib/auth/sign-in-throttle';
import { USER_IDS } from '@/lib/data/mock/fixtures';
import { mockDb, resetMockDb } from '@/lib/data/mock/store';
import { logger } from '@/lib/logger';
import { createMemoryRateLimitStore, memoryRateLimitStore } from '@/lib/rate-limit/memory-store';
import { fakeJar, fakeSupabaseProvider, type FakeProvider } from './fake-provider';

/**
 * TASK-025 AC3 — failed password sign-ins are throttled per account (5 / 15 min) and per IP
 * (20 / 15 min), checked BEFORE the provider is contacted, with one generic message whether or
 * not the account exists. No raw email or IP is stored or logged. Fails closed.
 */
const state = vi.hoisted(() => ({
  provider: null as unknown,
  jar: null as unknown,
  headers: new Headers(),
}));
vi.mock('@/lib/auth/provider', async orig => ({
  ...(await orig<typeof import('@/lib/auth/provider')>()),
  getAuthProvider: () => state.provider,
}));
vi.mock('next/headers', () => ({
  cookies: async () => state.jar,
  headers: async () => state.headers,
}));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));
const failStore = vi.hoisted(() => ({ on: false }));
vi.mock('@/lib/rate-limit', async orig => {
  const real = await orig<typeof import('@/lib/rate-limit')>();
  return {
    ...real,
    getRateLimitStore: () => {
      const store = real.getRateLimitStore();
      if (!failStore.on) return store;
      const boom = async () => {
        throw new Error('database unavailable');
      };
      return { hit: boom, count: boom, reset: boom };
    },
  };
});

const { passwordLoginAction } = await import('@/app/(public)/login/actions');

const ANA_AUTH = '30000000-0000-4000-8000-000000000101';
const SECRET = 's'.repeat(64);
let provider: FakeProvider;

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
};
const attempt = (email: string, password = 'wrong') =>
  passwordLoginAction({}, form({ email, password })).catch((e: Error) => ({
    redirect: e.message,
  }));

beforeEach(() => {
  resetMockDb();
  memoryRateLimitStore.clear();
  failStore.on = false;
  mockDb.authLinks.push({ authUserId: ANA_AUTH, userId: USER_IDS.ana });
  provider = fakeSupabaseProvider();
  provider.signInWithPassword.mockResolvedValue({ ok: false });
  state.provider = provider;
  state.jar = fakeJar();
  state.headers = new Headers();
});
afterEach(() => {
  memoryRateLimitStore.clear();
  resetMockDb();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('keys and client IP', () => {
  it('keys are HMACs: no raw email or IP, case/space-insensitive email', () => {
    const keys = signInKeys('  Ana@Example.COM ', '203.0.113.9', SECRET);
    expect(keys).toEqual(signInKeys('ana@example.com', '203.0.113.9', SECRET));
    expect(keys.email).toMatch(/^signin:email:[0-9a-f]{64}$/);
    expect(keys.ip).toMatch(/^signin:ip:[0-9a-f]{64}$/);
    expect(JSON.stringify(keys)).not.toMatch(/ana|example|203\.0\.113/i);
    expect(signInKeys('ana@example.com', 'x', 't'.repeat(64)).email).not.toBe(keys.email);
  });

  it('trusts forwarded headers only on Vercel; elsewhere every request shares one key', () => {
    const h = new Headers({
      'x-forwarded-for': '198.51.100.7, 10.0.0.1',
      'x-real-ip': '198.51.100.7',
    });
    expect(clientIp(h, {})).toBe('local');
    expect(clientIp(h, { VERCEL: '1' })).toBe('198.51.100.7');
    expect(
      clientIp(new Headers({ 'x-forwarded-for': '198.51.100.8, 10.0.0.1' }), { VERCEL: '1' })
    ).toBe('198.51.100.8');
  });
});

describe('limits', () => {
  const now = new Date('2027-01-10T09:00:00Z');

  it('the agreed policy: 5 failures per email, 20 per IP, within 15 minutes', () => {
    expect([MAX_FAILURES_PER_EMAIL, MAX_FAILURES_PER_IP, SIGN_IN_WINDOW_SECONDS]).toEqual([
      5,
      20,
      15 * 60,
    ]);
  });

  it(`email: blocked after ${MAX_FAILURES_PER_EMAIL} failures within 15 minutes`, async () => {
    const store = createMemoryRateLimitStore();
    const keys = signInKeys('ana@example.com', 'local', SECRET);
    for (let i = 1; i < MAX_FAILURES_PER_EMAIL; i++) {
      await recordSignInFailure(store, keys, now);
      expect(await isSignInThrottled(store, keys, now)).toBe(false);
    }
    await recordSignInFailure(store, keys, now);
    expect(await isSignInThrottled(store, keys, now)).toBe(true);
    expect(await isSignInThrottled(store, keys, new Date(now.getTime() + 15 * 60_000))).toBe(false);
  });

  it(`IP: blocked after ${MAX_FAILURES_PER_IP} failures across different accounts`, async () => {
    const store = createMemoryRateLimitStore();
    for (let i = 0; i < MAX_FAILURES_PER_IP; i++) {
      await recordSignInFailure(
        store,
        signInKeys(`user${i}@example.com`, '203.0.113.9', SECRET),
        now
      );
    }
    const fresh = signInKeys('someone-new@example.com', '203.0.113.9', SECRET);
    expect(await isSignInThrottled(store, fresh, now)).toBe(true);
    const otherIp = signInKeys('someone-new@example.com', '203.0.113.10', SECRET);
    expect(await isSignInThrottled(store, otherIp, now)).toBe(false);
  });
});

describe('passwordLoginAction throttling', () => {
  it('the 6th attempt after 5 failures is refused WITHOUT contacting the provider', async () => {
    for (let i = 0; i < 5; i++) {
      expect(await attempt('ana@example.com')).toEqual({
        error: 'Email or password is incorrect.',
      });
    }
    expect(provider.signInWithPassword).toHaveBeenCalledTimes(5);
    expect(await attempt('ana@example.com')).toEqual({ error: THROTTLED_MESSAGE });
    expect(provider.signInWithPassword).toHaveBeenCalledTimes(5);
  });

  it('even the CORRECT password is refused while throttled (no session is created)', async () => {
    for (let i = 0; i < 5; i++) await attempt('ana@example.com');
    provider.signInWithPassword.mockResolvedValue({ ok: true, authUserId: ANA_AUTH });
    const jar = state.jar as ReturnType<typeof fakeJar>;
    expect(await attempt('ana@example.com', 'right')).toEqual({ error: THROTTLED_MESSAGE });
    expect(jar.store.has(SESSION_COOKIE)).toBe(false);
  });

  it('an unknown account gets exactly the same answers (no account enumeration)', async () => {
    const known: unknown[] = [];
    const unknown: unknown[] = [];
    for (let i = 0; i < 6; i++) known.push(await attempt('ana@example.com'));
    for (let i = 0; i < 6; i++) unknown.push(await attempt('nobody@example.com'));
    expect(unknown).toEqual(known);
  });

  it("valid credentials for an unlinked account don't count as failures", async () => {
    provider.signInWithPassword.mockResolvedValue({
      ok: true,
      authUserId: '30000000-0000-4000-8000-00000000dead',
    });
    for (let i = 0; i < 6; i++) await attempt('stranger@example.com', 'right');
    expect(provider.signInWithPassword).toHaveBeenCalledTimes(6);
  });

  it("a successful sign-in clears the account's failures", async () => {
    for (let i = 0; i < 4; i++) await attempt('ana@example.com');
    provider.signInWithPassword.mockResolvedValueOnce({ ok: true, authUserId: ANA_AUTH });
    expect(await attempt('ana@example.com', 'right')).toEqual({ redirect: 'REDIRECT /dashboard' });
    for (let i = 0; i < 4; i++) {
      expect(await attempt('ana@example.com')).toEqual({
        error: 'Email or password is incorrect.',
      });
    }
  });

  it("fails closed: if the limiter is unavailable, sign-in is refused and the provider isn't called", async () => {
    failStore.on = true;
    const errors = vi.spyOn(logger, 'error').mockImplementation(() => undefined as never);
    expect(await attempt('ana@example.com', 'right')).toEqual({ error: UNAVAILABLE_MESSAGE });
    expect(provider.signInWithPassword).not.toHaveBeenCalled();
    expect(errors).toHaveBeenCalled();
  });

  it('logs never contain the email or the IP', async () => {
    vi.stubEnv('VERCEL', '1');
    state.headers = new Headers({ 'x-real-ip': '203.0.113.77' });
    const lines: string[] = [];
    for (const level of ['info', 'warn', 'error'] as const) {
      vi.spyOn(logger, level).mockImplementation(((...args: unknown[]) => {
        lines.push(JSON.stringify(args));
      }) as never);
    }
    for (let i = 0; i < 7; i++) await attempt('Private.Person@example.com');
    expect(lines.some(l => l.includes('auth.signin_throttled'))).toBe(true);
    expect(lines.join('\n')).not.toMatch(/private\.person|example\.com|203\.0\.113\.77/i);
  });
});
