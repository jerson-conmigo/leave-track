import { newSessionId, signSessionToken } from '../lib/auth/session-token';
import { expect, signInAs, test, USERS } from './helpers';

/**
 * TASK-023 AC1 — only a valid SIGNED session authenticates. Forged and tampered
 * cookies, and the Day 0 unsigned cookies, are treated as signed out.
 */
const now = () => Math.floor(Date.now() / 1000);

test.describe('session security', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    const app = new URL(baseURL!).host;
    await context.route(
      url => url.host !== app,
      route => route.abort('blockedbyclient')
    );
  });

  test('a cookie signed with another secret is rejected (forged)', async ({
    context,
    page,
    baseURL,
  }) => {
    await context.addCookies([
      {
        name: 'lt-session',
        value: signSessionToken(
          {
            uid: USERS.carla,
            role: 'hr_admin',
            sid: newSessionId(),
            iat: now(),
            lat: now(),
            exp: now() + 3600,
          },
          'f'.repeat(64)
        ),
        url: baseURL!,
      },
    ]);
    await page.goto('/audit');
    await expect(page).toHaveURL(/\/login\?next=%2Faudit$/);
  });

  test('an employee cookie with the role edited to hr_admin is rejected (tampered)', async ({
    context,
    page,
    baseURL,
  }) => {
    await signInAs(context, 'employee', USERS.ana);
    const [cookie] = await context.cookies();
    const [version, , signature] = cookie!.value.split('.');
    const escalated = Buffer.from(
      JSON.stringify({ uid: USERS.ana, role: 'hr_admin', iat: now(), exp: now() + 3600 })
    ).toString('base64url');
    await context.clearCookies();
    await context.addCookies([
      { name: 'lt-session', value: `${version}.${escalated}.${signature}`, url: baseURL! },
    ]);
    await page.goto('/audit');
    await expect(page).toHaveURL(/\/login/);
  });

  test('the Day 0 unsigned cookies no longer sign anyone in', async ({
    context,
    page,
    baseURL,
  }) => {
    await context.addCookies([
      { name: 'mock-role', value: 'hr_admin', url: baseURL! },
      { name: 'mock-user-id', value: USERS.carla, url: baseURL! },
    ]);
    await page.goto('/audit');
    await expect(page).toHaveURL(/\/login/);
  });

  test('an API call with a forged cookie gets a 401 envelope', async ({
    context,
    page,
    baseURL,
  }) => {
    await context.addCookies([
      {
        name: 'lt-session',
        value: signSessionToken(
          {
            uid: USERS.ben,
            role: 'manager',
            sid: newSessionId(),
            iat: now(),
            lat: now(),
            exp: now() + 3600,
          },
          'e'.repeat(64)
        ),
        url: baseURL!,
      },
    ]);
    const res = await page.request.get('/api/leave-requests?scope=team');
    expect(res.status()).toBe(401);
    expect(await res.json()).toEqual({
      success: false,
      error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.' },
    });
  });

  test('sign in through the form, then sign out: the cookie is cleared and pages need sign-in again', async ({
    context,
    page,
  }) => {
    await page.goto('/login');
    await page.locator('#userId').tap();
    await page.getByRole('option', { name: 'Jordan Lee' }).tap();
    await page.getByRole('button', { name: 'Sign in' }).tap();
    await expect(page).toHaveURL(/\/dashboard$/);
    const signedIn = (await context.cookies()).find(c => c.name === 'lt-session');
    expect(signedIn?.value).toMatch(/^v2\./); // TASK-025: token v2 (sid + last activity)
    expect(signedIn?.httpOnly).toBe(true);

    await page.getByRole('button', { name: /account menu/i }).tap();
    await page.getByRole('menuitem', { name: /sign out/i }).tap();
    await expect(page).toHaveURL(/\/login/);
    expect((await context.cookies()).find(c => c.name === 'lt-session')).toBeUndefined();
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  });
});
