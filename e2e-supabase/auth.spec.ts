import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import {
  cleanupTestIdentities,
  createAppUser,
  createLinkedUser,
  emailedLink,
  type Env,
  invite,
} from "./harness";
import { enlargeText, expectNoHorizontalOverflow, expectSelectsNotClipped } from "../e2e/helpers";
import { accessTokenFromCookies, testEmail } from "./identities";

/**
 * TASK-024 AC1–AC4 against local Supabase (see playwright.supabase.config.ts).
 *
 * Every identity here is created by the test itself under @e2e-auth.leavetrack.test and
 * deleted after each test (plus a sweep for crashed earlier runs). Seeded users, dev
 * logins, their auth_user_id links and other mail are never touched. Each test is
 * independent and can run alone (--grep).
 */
const env: Env = {
  apiUrl: process.env.SUPABASE_E2E_API_URL!,
  dbUrl: process.env.SUPABASE_E2E_DB_URL!,
  serviceKey: process.env.SUPABASE_E2E_SERVICE_ROLE_KEY!,
  mailUrl: process.env.SUPABASE_E2E_MAIL_URL!,
};
const ANON_KEY = process.env.SUPABASE_E2E_ANON_KEY!;
const PASSWORD = "a-strong-local-test-password";
const RUN = `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;
// TASK-056: the documented local password, read from its single source (server-only module).
const DEV_PASSWORD = readFileSync(
  path.resolve(__dirname, "../lib/auth/dev-accounts.ts"),
  "utf8",
).match(/export const LOCAL_DEV_PASSWORD = "([^"]+)"/)![1]!;

const noSession = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(env.apiUrl, env.serviceKey, noSession);
const anon = createClient(env.apiUrl, ANON_KEY, noSession);
const sql = postgres(env.dbUrl, { max: 1 });

test.beforeAll(async () => {
  await cleanupTestIdentities(env, sql, admin); // leftovers of a crashed earlier run only
});
test.afterEach(async () => {
  await cleanupTestIdentities(env, sql, admin);
});
test.afterAll(async () => sql.end({ timeout: 5 }));

/**
 * The app's ERROR alert (components/ui/alert.tsx renders role="alert" + data-slot="alert").
 * A bare getByRole("alert") also matches Next.js's empty route announcer
 * (#__next-route-announcer__, also role="alert"), which makes the locator ambiguous.
 * TASK-056: with DEV_LOGIN_ACCOUNTS=true the sign-in page also shows the informational
 * "Local development only" notice (the same Alert component), so it is excluded by its text.
 * Strict mode still fails if any OTHER second alert appears, and if the notice's wording ever
 * changes this stops excluding it and the tests fail loudly (pinned by the harness test).
 */
export const DEV_NOTICE_TEXT = "Local development only";
const appAlert = (page: Page) =>
  page
    .getByRole("alert")
    .and(page.locator('[data-slot="alert"]'))
    .filter({ hasNotText: DEV_NOTICE_TEXT });

async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function signOut(page: Page) {
  await page.getByRole("button", { name: /account menu/ }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
}

async function acceptInvite(page: Page, email: string) {
  invite(env, email);
  await page.goto(await emailedLink(env.mailUrl, email));
  await expect(page).toHaveURL(/\/auth\/set-password$/);
  await page.getByLabel("New password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Repeat new password").fill(PASSWORD);
  await page.getByRole("button", { name: "Set password and sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("AC1: an invited HR Admin signs in with their own password and gets their DATABASE role", async ({
  page,
}) => {
  const hr = testEmail("ac1-hr", RUN);
  await createAppUser(sql, { email: hr, name: "E2E HR Admin", role: "hr_admin" });
  await acceptInvite(page, hr);
  await signOut(page);

  await signIn(page, hr, "wrong-password-entirely");
  await expect(appAlert(page)).toHaveText("Email or password is incorrect.");

  await signIn(page, hr);
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/audit");
  await expect(page).toHaveURL(/\/audit$/); // hr_admin from the users row
});

test("AC1: an invited employee gets the employee role (no HR pages)", async ({ page }) => {
  const employee = testEmail("ac1-employee", RUN);
  await createAppUser(sql, { email: employee, name: "E2E Employee", role: "employee" });
  await acceptInvite(page, employee);
  await page.goto("/audit");
  await expect(page).toHaveURL(/\/forbidden$/);
});

test("AC2: a provider user with no linked users row cannot use the app", async ({ page }) => {
  const stranger = testEmail("ac2-stranger", RUN);
  await admin.auth.admin.createUser({ email: stranger, password: PASSWORD, email_confirm: true });
  await signIn(page, stranger);
  await expect(appAlert(page)).toHaveText(/isn't set up for LeaveTrack/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
});

test("TASK-056: the local account menu fills the form — sign-in still goes through Supabase", async ({
  page,
}) => {
  const email = testEmail("dev-menu-hr", RUN);
  await createLinkedUser(sql, admin, {
    email,
    name: "E2E Dev Menu",
    role: "hr_admin",
    password: DEV_PASSWORD,
  });

  await page.goto("/login");
  await page.getByLabel("Fill in a local account").click();
  await page.getByRole("option", { name: new RegExp(email.replace(/[.]/g, "\\.")) }).click();
  // Filled, NOT submitted: still on /login until Sign in is pressed.
  await expect(page.getByLabel("Work email")).toHaveValue(email);
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue(DEV_PASSWORD);
  await expect(page).toHaveURL(/\/login$/);

  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/audit");
  await expect(page).toHaveURL(/\/audit$/); // role from the users row
});

test("TASK-056: the menu cannot bypass the password — an edited password is refused", async ({
  page,
}) => {
  const email = testEmail("dev-menu-employee", RUN);
  await createLinkedUser(sql, admin, {
    email,
    name: "E2E Dev Menu Two",
    role: "employee",
    password: DEV_PASSWORD,
  });

  await page.goto("/login");
  await page.getByLabel("Fill in a local account").click();
  await page.getByRole("option", { name: new RegExp(email.replace(/[.]/g, "\\.")) }).click();
  await page.getByLabel("Password", { exact: true }).fill("not-the-right-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(appAlert(page)).toHaveText("Email or password is incorrect.");
  await expect(page).toHaveURL(/\/login/);
});

test("TASK-056: picking an account with the KEYBOARD fills the form and submits nothing", async ({
  page,
}) => {
  const email = testEmail("dev-menu-keys", RUN);
  await createLinkedUser(sql, admin, {
    email,
    name: "E2E Dev Keys",
    role: "employee",
    password: DEV_PASSWORD,
  });
  const posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET") posts.push(`${r.method()} ${new URL(r.url()).pathname}`);
  });

  await page.goto("/login");
  const trigger = page.getByLabel("Fill in a local account");
  await trigger.focus();
  await page.keyboard.press("Enter");
  const option = page.getByRole("option", { name: new RegExp(email.replace(/[.]/g, "\\.")) });
  await option.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500); // room for a wrong submit to fire

  expect(posts, "choosing an account must not submit").toEqual([]);
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel("Work email")).toHaveValue(email);
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue(DEV_PASSWORD);
  await expect(trigger).toBeFocused(); // focus stays on the menu, not on Sign in
});

for (const [width, height] of [
  [375, 667],
  [320, 568],
] as const) {
  test.describe(`TASK-056 at 200% text (${width}px)`, () => {
    test.use({ viewport: { width, height }, isMobile: true, hasTouch: true });

    test("the notice, the menu, a long chosen email and the password row wrap — no overflow, nothing clipped", async ({
      page,
    }) => {
      const email = testEmail(`dev-menu-a-rather-long-local-part-${width}`, RUN);
      await createLinkedUser(sql, admin, {
        email,
        name: "E2E Dev Wide",
        role: "employee",
        password: DEV_PASSWORD,
      });
      await page.goto("/login");
      await enlargeText(page);
      await expectNoHorizontalOverflow(page); // before choosing: notice + password row
      await page.getByLabel("Fill in a local account").click();
      await page.getByRole("option", { name: new RegExp(email.replace(/[.]/g, "\\.")) }).click();
      await enlargeText(page);
      await expectNoHorizontalOverflow(page); // after choosing: the long email in the field
      await expectSelectsNotClipped(page);
    });
  });
}

/**
 * TASK-025 — sign-in throttling against real Supabase Auth and the real rate_limits table.
 * Only this test's rows are removed afterwards (buckets written since it started, sign-in keys
 * only), so the per-IP count doesn't leak into the next run.
 */
test("TASK-025: after 5 failed sign-ins even the correct password is refused, before Supabase", async ({
  page,
}) => {
  const [row] = await sql<{ started: Date }[]>`select now() - interval '1 minute' as started`;
  const started = row!.started;
  try {
    const email = testEmail("throttle", RUN);
    await createLinkedUser(sql, admin, {
      email,
      name: "E2E Throttle",
      role: "employee",
      password: PASSWORD,
    });

    for (let i = 0; i < 5; i++) {
      await signIn(page, email, `wrong-password-${i}`);
      await expect(appAlert(page)).toHaveText("Email or password is incorrect.");
    }
    // The 6th attempt uses the RIGHT password: refused all the same, so the throttle ran
    // before Supabase was asked (a Supabase call would have signed in).
    await signIn(page, email, PASSWORD);
    await expect(appAlert(page)).toContainText("Too many sign-in attempts");
    await expect(page).toHaveURL(/\/login/);

    // Stored keys are HMACs: no email (or any part of it) in the table.
    const keys = await sql<{ key: string }[]>`
      select key from public.rate_limits where bucket >= ${started} and key like 'signin:%'`;
    expect(keys.length).toBeGreaterThanOrEqual(2);
    for (const { key } of keys) {
      expect(key).toMatch(/^signin:(email|ip):[0-9a-f]{64}$/);
      expect(key).not.toContain(email.split("@")[0]!);
    }
  } finally {
    await sql`delete from public.rate_limits where bucket >= ${started} and key like 'signin:%'`;
  }
});

test("TASK-025: a real Supabase session goes idle → signed out everywhere, provider token revoked", async ({
  page,
}) => {
  const email = testEmail("idle", RUN);
  await createLinkedUser(sql, admin, {
    email,
    name: "E2E Idle",
    role: "employee",
    password: PASSWORD,
  });
  await page.clock.install();
  await signIn(page, email);
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.locator('html[data-idle-guard="ready"]').waitFor({ state: "attached" });
  const token = await accessTokenFromCookies(await page.context().cookies());

  await page.clock.fastForward(29 * 60_000);
  await expect(page.getByRole("alertdialog")).toContainText("Are you still there?");
  await page.clock.fastForward(61_000);
  await expect(page).toHaveURL(/\/login\?reason=idle$/);

  const after = await anon.auth.getUser(token);
  expect(after.error).not.toBeNull(); // the idle sign-out revoked the provider session
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("AC3: sign-out revokes the session — Supabase rejects the old token and replayed cookies fail", async ({
  page,
  browser,
}) => {
  // Independent of AC1: its own linked user.
  const email = testEmail("ac3-hr", RUN);
  const { authUserId } = await createLinkedUser(sql, admin, {
    email,
    name: "E2E Revocation",
    role: "hr_admin",
    password: PASSWORD,
  });

  await signIn(page, email);
  await expect(page).toHaveURL(/\/dashboard$/);
  const stolen = await page.context().cookies();
  const token = await accessTokenFromCookies(stolen);

  // Positive control: the captured token IS valid before sign-out.
  const before = await anon.auth.getUser(token);
  expect(before.error).toBeNull();
  expect(before.data.user?.id).toBe(authUserId);

  await signOut(page);

  // Direct evidence: Supabase itself now rejects the previously issued access token.
  const after = await anon.auth.getUser(token);
  test.info().annotations.push({
    type: "revoked-token",
    description: `${after.error?.status ?? "-"} ${after.error?.code ?? after.error?.message ?? "no error"}`,
  });
  expect(after.error).not.toBeNull();
  expect(after.data.user).toBeNull();

  // And the app refuses the replayed cookies.
  const replay = await browser.newContext();
  await replay.addCookies(stolen);
  const other = await replay.newPage();
  await other.goto("/dashboard");
  await expect(other).toHaveURL(/\/login/);
  const api = await replay.request.get("/api/leave-requests");
  expect(api.status()).toBe(401);
  await replay.close();
});
