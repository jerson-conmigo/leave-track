import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * TASK-025 / B16 — /login with an active session goes to a SAFE `next` (never another origin,
 * /login or /api), defaulting to /dashboard. Signed-out notices come from a fixed list.
 */
const getSession = vi.fn();
vi.mock('@/lib/auth/session', () => ({ getSession: () => getSession() }));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));
const { default: LoginPage } = await import('@/app/(public)/login/page');

const render = (searchParams: Record<string, string>) =>
  LoginPage({ searchParams: Promise.resolve(searchParams), params: Promise.resolve({}) } as never);
const redirectOf = (p: Promise<unknown>) =>
  p.then(
    () => null,
    (e: Error) => e.message.replace(/^REDIRECT /, '')
  );

beforeEach(() => getSession.mockReset());

describe('signed-in user on /login (B16)', () => {
  beforeEach(() => getSession.mockResolvedValue({ userId: 'u', role: 'employee' }));

  it.each([
    [{}, '/dashboard'],
    [{ next: '/requests?tab=mine' }, '/requests?tab=mine'],
    [{ next: '/approvals#top' }, '/approvals#top'],
    [{ next: 'https://evil.example/x' }, '/dashboard'],
    [{ next: '//evil.example' }, '/dashboard'],
    [{ next: '/\\evil.example' }, '/dashboard'],
    [{ next: '/login?next=/x' }, '/dashboard'],
    [{ next: '/api/leave-requests' }, '/dashboard'],
    [{ next: 'javascript:alert(1)' }, '/dashboard'],
  ])('%j → %s', async (params, target) => {
    expect(await redirectOf(render(params))).toBe(target);
  });
});

describe('signed-out user on /login', () => {
  beforeEach(() => getSession.mockResolvedValue(null));

  it('renders the page (no redirect)', async () => {
    expect(await redirectOf(render({ next: '/requests' }))).toBeNull();
  });

  it('shows the idle notice with the configured timeout, and ignores unknown reasons', async () => {
    vi.stubEnv('SESSION_IDLE_TIMEOUT_MINUTES', '20');
    const text = (node: unknown) => JSON.stringify(node);
    expect(text(await render({ reason: 'idle' }))).toContain(
      'You were signed out after 20 minutes without activity.'
    );
    expect(text(await render({ reason: 'expired' }))).toContain('Your session has ended.');
    const unknown = text(await render({ reason: '<script>alert(1)</script>' }));
    expect(unknown).not.toContain('script>alert');
    expect(unknown).not.toContain('signed out after');
    vi.unstubAllEnvs();
  });
});
