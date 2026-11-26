#!/usr/bin/env node
/**
 * Invite an existing LeaveTrack user to sign in with Supabase Auth (TASK-024).
 *
 *   npm run user:invite -- ana@example.com
 *
 * Operator CLI until the admin UI (TASK-043). It:
 *   1. finds the users row by email (case-insensitive) and refuses if there is none or
 *      it is already linked;
 *   2. sends a Supabase invite (the email links to /auth/confirm → /auth/set-password);
 *   3. stores the new identity in users.auth_user_id — the ONLY way an identity is ever
 *      linked. Sign-in never matches by email (ADR-LeaveTrack-E004).
 *
 * Needs: DIRECT_URL or DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * (server-only; this script is the only code that reads it), NEXT_PUBLIC_APP_URL.
 */
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { z } from "zod";

const Email = z.email().max(320);

/**
 * The invite steps over injected ports, so they can be tested without a network.
 *   findUser(email) → { id, auth_user_id } | null
 *   invite(email)   → authUserId (throws on provider errors)
 *   link(userId, authUserId) → true if THIS call linked it (only while still unlinked)
 */
export async function inviteUser(rawEmail, { findUser, invite, link }) {
  const parsed = Email.safeParse(typeof rawEmail === "string" ? rawEmail.trim() : rawEmail);
  if (!parsed.success) return { ok: false, reason: "invalid-email" };
  const email = parsed.data;

  const user = await findUser(email);
  if (!user) return { ok: false, reason: "no-such-user" };
  if (user.auth_user_id) return { ok: false, reason: "already-linked" };

  const authUserId = await invite(email);
  if (!(await link(user.id, authUserId))) return { ok: false, reason: "linked-concurrently" };
  return { ok: true, userId: user.id, authUserId };
}

const MESSAGES = {
  "invalid-email": "That is not a valid email address.",
  "no-such-user": "No LeaveTrack user has that email. Add the user first.",
  "already-linked": "That user is already linked to a sign-in. Use password reset instead.",
  "linked-concurrently":
    "Another invite linked this user at the same time; the new identity was NOT linked.",
};

async function main() {
  const [email] = process.argv.slice(2);
  const fail = (msg) => {
    process.stderr.write(`invite-user: ${msg}\n`);
    process.exit(1);
  };
  if (!email) fail("usage: npm run user:invite -- <email>");

  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const missing = Object.entries({
    "DIRECT_URL or DATABASE_URL": dbUrl,
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  })
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) fail(`missing ${missing.join(", ")}`);

  const sql = postgres(dbUrl, { max: 1, prepare: false });
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  try {
    const result = await inviteUser(email, {
      async findUser(e) {
        const rows = await sql`select id, auth_user_id from users where lower(email) = lower(${e})`;
        return rows[0] ?? null;
      },
      async invite(e) {
        const { data, error } = await admin.auth.admin.inviteUserByEmail(e, {
          redirectTo: new URL("/auth/set-password", appUrl).toString(),
        });
        if (error || !data.user) throw new Error(`invite refused (${error?.code ?? "no user"})`);
        return data.user.id;
      },
      async link(userId, authUserId) {
        const rows = await sql`
          update users set auth_user_id = ${authUserId}
           where id = ${userId} and auth_user_id is null
          returning id`;
        return rows.length === 1;
      },
    });
    if (!result.ok) fail(MESSAGES[result.reason]);
    process.stdout.write(`invite-user: invited and linked user ${result.userId}\n`);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  } finally {
    await sql.end({ timeout: 5 });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
