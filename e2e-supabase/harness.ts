import { execFileSync } from "node:child_process";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Sql } from "postgres";
import { isTestEmail, TEST_EMAIL_DOMAIN } from "./identities";

/**
 * Side-effecting helpers for the real-Supabase e2e (TASK-024). Everything they create
 * or delete is inside TEST_EMAIL_DOMAIN; every delete re-checks isTestEmail first.
 * Seeded users, dev logins, their auth_user_id links and other mail are never touched.
 */
type Role = "employee" | "manager" | "hr_admin";
export type Env = { apiUrl: string; dbUrl: string; serviceKey: string; mailUrl: string };

const assertTestEmail = (email: string | null | undefined, what: string) => {
  if (!isTestEmail(email)) {
    throw new Error(`refusing to ${what} a non-test identity: ${String(email)}`);
  }
};

/** A users row for a test identity (no manager, no requests: nothing depends on it). */
export async function createAppUser(
  sql: Sql,
  { email, name, role }: { email: string; name: string; role: Role },
): Promise<string> {
  assertTestEmail(email, "create");
  const [row] = await sql<{ id: string }[]>`
    insert into users (name, email, role) values (${name}, ${email}, ${role}::user_role)
    returning id`;
  return row!.id;
}

/**
 * A test user who can sign in with a password: users row + confirmed provider user,
 * linked by users.auth_user_id exactly like the admin invite does (by id, only while
 * unlinked). Used where the invite email itself is not what the test is about.
 */
export async function createLinkedUser(
  sql: Sql,
  admin: SupabaseClient,
  user: { email: string; name: string; role: Role; password: string },
): Promise<{ userId: string; authUserId: string }> {
  const userId = await createAppUser(sql, user);
  const { data, error } = await admin.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser failed: ${error?.code ?? "no user"}`);
  const linked = await sql`
    update users set auth_user_id = ${data.user.id}
     where id = ${userId} and auth_user_id is null
    returning id`;
  if (linked.length !== 1) throw new Error("could not link the test user");
  return { userId, authUserId: data.user.id };
}

/** The real operator invite (scripts/invite-user.mjs) — AC1 exercises it end to end. */
export function invite(env: Env, email: string): void {
  assertTestEmail(email, "invite");
  execFileSync(process.execPath, ["scripts/invite-user.mjs", email], {
    env: {
      ...process.env,
      DATABASE_URL: env.dbUrl,
      NEXT_PUBLIC_SUPABASE_URL: env.apiUrl,
      SUPABASE_SERVICE_ROLE_KEY: env.serviceKey,
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    },
    stdio: "pipe",
  });
}

type MailSummary = { ID: string; To?: { Address?: string }[] };

/** Mailpit messages addressed ONLY to test identities. */
async function testMessages(mailUrl: string): Promise<MailSummary[]> {
  const found: MailSummary[] = [];
  for (let start = 0; ; start += 200) {
    const query = encodeURIComponent(`to:@${TEST_EMAIL_DOMAIN}`);
    const res = await fetch(`${mailUrl}/api/v1/search?query=${query}&start=${start}&limit=200`);
    const { messages = [] } = (await res.json()) as { messages?: MailSummary[] };
    found.push(...messages);
    if (messages.length < 200) break;
  }
  // The search is a filter, not a guarantee: keep only mail whose every recipient is a test address.
  return found.filter((m) => (m.To ?? []).length > 0 && m.To!.every((t) => isTestEmail(t.Address)));
}

/** The /auth/confirm link from the newest email to `email` (local Mailpit). */
export async function emailedLink(mailUrl: string, email: string): Promise<string> {
  assertTestEmail(email, "read mail for");
  for (let attempt = 0; attempt < 20; attempt++) {
    const res = await fetch(`${mailUrl}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
    const { messages = [] } = (await res.json()) as { messages?: { ID: string }[] };
    if (messages[0]) {
      const msg = (await (await fetch(`${mailUrl}/api/v1/message/${messages[0].ID}`)).json()) as {
        HTML: string;
      };
      const href = msg.HTML.match(/href="([^"]*\/auth\/confirm[^"]*)"/)?.[1];
      if (href) return href.replaceAll("&amp;", "&");
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no invite email for ${email}`);
}

/**
 * Delete every test identity — and nothing else:
 *   1. provider users whose email is in the test domain (all pages of listUsers),
 *   2. users rows in the test domain (selected, re-checked, then deleted by id),
 *   3. Mailpit messages addressed only to test identities (by ID — never "delete all").
 */
export async function cleanupTestIdentities(
  env: Env,
  sql: Sql,
  admin: SupabaseClient,
): Promise<{ authUsers: number; appUsers: number; messages: number }> {
  let authUsers = 0;
  const perPage = 1000;
  const doomed: { id: string; email?: string }[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers failed: ${error.code ?? error.message}`);
    doomed.push(...data.users.filter((u) => isTestEmail(u.email)));
    if (data.users.length < perPage) break;
  }
  for (const u of doomed) {
    assertTestEmail(u.email, "delete");
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) throw new Error(`deleteUser failed: ${error.code ?? error.message}`);
    authUsers++;
  }

  const rows = await sql<{ id: string; email: string }[]>`
    select id, email from users where lower(email) like ${`%@${TEST_EMAIL_DOMAIN}`}`;
  const ids = rows.filter((r) => isTestEmail(r.email)).map((r) => r.id);
  if (ids.length > 0) await sql`delete from users where id = any(${ids}::uuid[])`;

  const mail = await testMessages(env.mailUrl);
  if (mail.length > 0) {
    // Mailpit deletes EVERYTHING when IDs is empty — hence the length guard above.
    await fetch(`${env.mailUrl}/api/v1/messages`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ IDs: mail.map((m) => m.ID) }),
    });
  }
  return { authUsers, appUsers: ids.length, messages: mail.length };
}
