import { randomBytes } from "node:crypto";
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
 * The app's alert (components/ui/alert.tsx renders role="alert" + data-slot="alert").
 * A bare getByRole("alert") also matches Next.js's empty route announcer
 * (#__next-route-announcer__, also role="alert"), which makes the locator ambiguous.
 */
const appAlert = (page: Page) => page.getByRole("alert").and(page.locator('[data-slot="alert"]'));

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
