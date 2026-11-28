import type { Page } from '@playwright/test';
import {
  enlargeText,
  expect,
  expectTapTargets,
  seriousA11yViolations,
  signInAs,
  test,
  USERS,
} from './helpers';

/**
 * TASK-025 — idle warning and session limits, in a real browser against the production build.
 * The browser's clock is FAKE (page.clock), so 30 minutes pass instantly; the server's limits are
 * tested with backdated session cookies. The idle timeout is the server's default (30 min).
 */
const IDLE_MIN = 30;
const dialog = (page: Page) => page.getByRole('alertdialog');
const min = (minutes: number) => minutes * 60_000;

/** The guard has hydrated and started its timers — only then can the fake clock drive it. */
const guardReady = (page: Page) =>
  page.locator('html[data-idle-guard="ready"]').waitFor({ state: 'attached' });

/** The dialog is inside the viewport horizontally and nothing in it scrolls sideways. */
async function expectDialogFits(page: Page) {
  const r = await dialog(page).evaluate(el => {
    const b = el.getBoundingClientRect();
    const wide = [el, ...el.querySelectorAll('*')].filter(
      n =>
        !n.closest('.sr-only') && // the live region is visually hidden (1px, clipped) on purpose
        n.scrollWidth > n.clientWidth + 1 &&
        getComputedStyle(n).overflowX !== 'visible'
    ).length;
    return { left: b.left, right: b.right, vw: document.documentElement.clientWidth, wide };
  });
  expect(r.left).toBeGreaterThanOrEqual(0);
  expect(r.right).toBeLessThanOrEqual(r.vw);
  expect(r.wide, 'content scrolls sideways inside the dialog').toBe(0);
}

/** Count heartbeats (they still reach the server). */
async function countHeartbeats(page: Page) {
  const calls: number[] = [];
  await page.route('**/api/session/heartbeat', async route => {
    calls.push(Date.now());
    await route.continue();
  });
  return calls;
}

async function openSignedIn(page: Page, path = '/dashboard') {
  await page.clock.install();
  await signInAs(page.context(), 'employee', USERS.ana);
  await page.goto(path);
  await expect(page.getByRole('main')).toBeVisible();
  await guardReady(page);
}

test.describe('idle warning (client UX)', () => {
  test('appears 60 s before the timeout with a live countdown; no heartbeat while idle', async ({
    page,
  }) => {
    const beats = await countHeartbeats(page);
    await openSignedIn(page);

    await page.clock.fastForward(min(IDLE_MIN - 2));
    await expect(dialog(page)).toBeHidden();

    await page.clock.fastForward(60000); // 60 s before the timeout
    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page)).toContainText('Are you still there?');
    await expect(dialog(page)).toContainText(/[01]:\d\d/);

    await page.clock.fastForward(15000);
    await expect(dialog(page).getByText(/^0:4\d$/)).toBeVisible();
    expect(beats, 'an idle page must not keep the session alive').toHaveLength(0);
  });

  test('Stay signed in closes it and renews the server session (one heartbeat)', async ({
    page,
  }) => {
    const beats = await countHeartbeats(page);
    await openSignedIn(page);
    await page.clock.fastForward(min(IDLE_MIN - 1));
    await expect(dialog(page)).toBeVisible();

    const renewed = page.waitForResponse('**/api/session/heartbeat');
    await dialog(page).getByRole('button', { name: 'Stay signed in' }).click();
    expect((await renewed).status()).toBe(200);
    await expect(dialog(page)).toBeHidden();
    expect(beats).toHaveLength(1);

    // The timer restarted: no warning until another full timeout has nearly passed.
    await page.clock.fastForward(min(IDLE_MIN - 2));
    await expect(dialog(page)).toBeHidden();
  });

  test('resumed activity on the page (outside the dialog) or Esc dismisses it', async ({
    page,
  }) => {
    await countHeartbeats(page);
    await openSignedIn(page);
    await page.clock.fastForward(min(IDLE_MIN - 1));
    await expect(dialog(page)).toBeVisible();
    const beat = page.waitForResponse('**/api/session/heartbeat');
    await page.mouse.click(5, 5); // on the dimmed page behind the dialog
    await beat;
    await expect(dialog(page)).toBeHidden();

    await page.clock.fastForward(min(IDLE_MIN - 1));
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
  });

  test('activity sends at most one heartbeat per 30 s', async ({ page }) => {
    const beats = await countHeartbeats(page);
    await openSignedIn(page);
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 50);
      await page.clock.fastForward(2_000); // 10 bursts over 20 s
    }
    await expect.poll(() => beats.length).toBe(1);
    await page.clock.fastForward(15000);
    await page.mouse.wheel(0, 50);
    await expect.poll(() => beats.length).toBe(2);
  });

  test('when the time runs out: signed out, on /login with the reason, session gone on the server', async ({
    page,
  }) => {
    await openSignedIn(page);
    await page.clock.fastForward(min(IDLE_MIN - 1));
    await expect(dialog(page)).toBeVisible();
    await page.clock.fastForward(61000);
    await page.waitForURL(/\/login\?reason=idle$/);
    await expect(page.getByRole('status')).toContainText(
      `signed out after ${IDLE_MIN} minutes without activity`
    );
    // The server ended the session too: a protected page sends us back to sign-in.
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
  });

  test('Log out signs this tab AND the other open tabs out', async ({ page, context }) => {
    await openSignedIn(page);
    const other = await context.newPage();
    await other.goto('/requests');
    await expect(other.getByRole('main')).toBeVisible();

    await page.clock.fastForward(min(IDLE_MIN - 1));
    await dialog(page).getByRole('button', { name: 'Log out' }).click();
    await page.waitForURL(/\/login$/);
    await other.waitForURL(/\/login/);
  });

  test('signing out from the header also sends the other tabs to /login', async ({
    page,
    context,
  }) => {
    await signInAs(context, 'employee', USERS.ana);
    await page.goto('/dashboard');
    const other = await context.newPage();
    await other.goto('/requests');
    await expect(other.getByRole('main')).toBeVisible();

    await page.goto('/login?next=/dashboard'); // B16: signed in → back to a safe next
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.getByRole('button', { name: /account menu/ }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await page.waitForURL(/\/login/);
    await other.waitForURL(/\/login/);
  });

  test('a warning closed in one tab closes in the other (cross-tab message)', async ({
    page,
    context,
  }) => {
    // Deterministic: each tab's own warning is opened with its own fake clock, then the
    // cross-tab contract is checked both ways — "Stay signed in" broadcasts { type: "active" },
    // and a tab receiving it closes its warning. (Racing two fake clocks through the library's
    // timer sync is a test artefact; real tabs share one clock.)
    await page.clock.install();
    await signInAs(context, 'employee', USERS.ana);
    await page.goto('/dashboard');
    await guardReady(page);
    const sent = page.evaluate(
      () =>
        new Promise<unknown>(resolve => {
          const bc = new BroadcastChannel('leavetrack-session');
          bc.onmessage = e => resolve(e.data);
        })
    );
    await page.clock.fastForward(min(IDLE_MIN - 1));
    await expect(dialog(page)).toBeVisible();
    await dialog(page).getByRole('button', { name: 'Stay signed in' }).click();
    expect(await sent).toEqual({ type: 'active' });

    const other = await context.newPage();
    await other.clock.install();
    await other.goto('/requests');
    await guardReady(other);
    await other.clock.fastForward(min(IDLE_MIN - 1));
    await expect(dialog(other)).toBeVisible();
    await page.evaluate(() =>
      new BroadcastChannel('leavetrack-session').postMessage({ type: 'active' })
    );
    await expect(dialog(other)).toBeHidden();
  });
});

test.describe('server-enforced limits (backdated sessions)', () => {
  test('idle on the server: last activity 31 minutes ago → sign in again', async ({
    page,
    context,
  }) => {
    await signInAs(context, 'employee', USERS.ana, { idleSecondsAgo: 31 * 60 });
    await page.goto('/requests');
    await expect(page).toHaveURL(/\/login\?next=%2Frequests$/);
    const api = await page.request.post('/api/session/heartbeat');
    expect(api.status()).toBe(401);
  });

  test('absolute: signed in 8 hours ago and active just now → still signed out', async ({
    page,
    context,
  }) => {
    await signInAs(context, 'employee', USERS.ana, {
      signedInSecondsAgo: 8 * 3600,
      idleSecondsAgo: 1,
    });
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  });

  test("near the 8-hour limit the dialog can't extend the session", async ({ page, context }) => {
    await page.clock.install();
    await signInAs(context, 'employee', USERS.ana, { signedInSecondsAgo: 8 * 3600 - 45 });
    await page.goto('/dashboard');
    await guardReady(page);
    await expect(dialog(page)).toContainText('Your session is ending');
    await expect(dialog(page).getByRole('button', { name: 'Stay signed in' })).toHaveCount(0);
    await expect(dialog(page).getByRole('button', { name: 'Sign in again' })).toBeVisible();
    // A heartbeat (activity) doesn't move the limit: the server still answers with the same exp.
    const res = await page.request.post('/api/session/heartbeat');
    const before = (await res.json()).data.absoluteExpiresAt;
    const again = await (await page.request.post('/api/session/heartbeat')).json();
    expect(again.data.absoluteExpiresAt).toBe(before);
    await page.clock.fastForward(46000);
    await page.waitForURL(/\/login\?reason=expired$/);
  });
});

test.describe('warning dialog accessibility', () => {
  test('focus, keyboard, labels, axe, reduced motion, 320 px and 200 % text', async ({ page }) => {
    // /requests/new reflows at 320 px / 200 % (TASK-055). On a page that overflows, mobile
    // browsers widen the layout viewport and every fixed element with it.
    await openSignedIn(page, '/requests/new');
    await page.clock.fastForward(min(IDLE_MIN - 1));
    const d = dialog(page);
    await expect(d).toBeVisible();

    // Labelled alertdialog; focus starts on the safe choice and stays inside.
    await expect(d).toHaveAccessibleName(/Are you still there\?/);
    await expect(d).toHaveAccessibleDescription(/signed out soon/);
    const stay = d.getByRole('button', { name: 'Stay signed in' });
    await expect(stay).toBeFocused();
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
      expect(await d.evaluate(el => el.contains(document.activeElement))).toBe(true);
    }
    // Screen readers hear the countdown at set points only (a polite live region).
    await expect(d.locator('[aria-live="polite"]')).toHaveCount(1);
    // Reduced motion (playwright.config): no open animation.
    expect(await d.evaluate(el => getComputedStyle(el).animationName)).toBe('none');

    expect(await seriousA11yViolations(page)).toEqual([]);
    await expectTapTargets(page, '[role="alertdialog"]');

    // The dialog itself fits 320 px, also at 200 % text (the page behind it is out of scope).
    await page.setViewportSize({ width: 320, height: 568 });
    await expectDialogFits(page);
    await enlargeText(page);
    await expectDialogFits(page);
    await expect(stay).toBeVisible();

    // Keyboard: Enter on "Log out" logs out (keys on the dialog's buttons go to the buttons).
    await d.getByRole('button', { name: 'Log out' }).focus();
    await page.keyboard.press('Enter');
    await page.waitForURL(/\/login$/);
  });
});
