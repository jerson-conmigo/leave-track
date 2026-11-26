#!/usr/bin/env node
/**
 * npm run db:seed:auth — local sign-ins for the seeded people (TASK-054, LOCAL ONLY).
 *
 * Creates a confirmed Supabase Auth user for each seeded users row that has none, with the
 * documented local development password (README › Local Supabase), and links it through
 * users.auth_user_id — by id, only while the row is still unlinked (the same rule as the
 * operator invite). Sign-in then goes through the REAL Supabase Auth provider.
 *
 * Safety: credentials come only from `supabase status` of the running LOCAL stack (never
 * from .env.local), and every URL is checked to be local; there is no remote mode. It never
 * relinks, never changes an existing password and never deletes anything. Idempotent.
 *
 * ADR-LeaveTrack-E004 provisions people by invite; this is the documented local-only
 * exception (AGENTS.md › Security rules).
 */
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { assertLocal, exitWith, readLocalStatus } from "./lib/local-only.mjs";

/** Local development only — documented in the README; meets the 12-character minimum. */
export const LOCAL_DEV_PASSWORD = "leavetrack-local-dev";
/** Identities of the real-Supabase e2e (e2e-supabase/identities.ts) are never seeded. */
const TEST_DOMAIN = "@e2e-auth.leavetrack.test";

/**
 * Pure: what to do for each users row, given the auth users that already exist.
 *   linked        — row already has auth_user_id (left alone)
 *   link-existing — an UNLINKED auth user with exactly this email exists (link it)
 *   create        — create a confirmed auth user, then link it
 *   skip          — the matching auth user is already linked to another row, or test identity
 */
export function planSeed(users, authUsers) {
  const linkedIds = new Set(users.map((u) => u.auth_user_id).filter(Boolean));
  const authByEmail = new Map(authUsers.map((a) => [(a.email ?? "").toLowerCase(), a]));
  return users.map((u) => {
    const email = u.email.toLowerCase();
    if (email.endsWith(TEST_DOMAIN)) return { user: u, action: "skip", why: "e2e test identity" };
    if (u.auth_user_id) return { user: u, action: "linked" };
    const existing = authByEmail.get(email);
    if (!existing) return { user: u, action: "create" };
    if (linkedIds.has(existing.id)) {
      return { user: u, action: "skip", why: "that sign-in is linked to another user" };
    }
    return { user: u, action: "link-existing", authUserId: existing.id };
  });
}

async function listAllAuthUsers(admin) {
  const all = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers failed (${error.code ?? error.message})`);
    all.push(...data.users);
    if (data.users.length < 1000) return all;
  }
}

async function main() {
  const status = readLocalStatus();
  assertLocal("API_URL", status.API_URL);
  assertLocal("DB_URL", status.DB_URL);

  const sql = postgres(status.DB_URL, { max: 1, prepare: false, onnotice: () => {} });
  const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  try {
    const users = await sql`select id, name, email, role::text as role, auth_user_id
                              from users order by role, name`;
    const plan = planSeed(users, await listAllAuthUsers(admin));
    const done = [];
    for (const step of plan) {
      let authUserId = step.authUserId;
      if (step.action === "create") {
        const { data, error } = await admin.auth.admin.createUser({
          email: step.user.email,
          password: LOCAL_DEV_PASSWORD,
          email_confirm: true,
        });
        if (error || !data.user) throw new Error(`createUser failed (${error?.code ?? "no user"})`);
        authUserId = data.user.id;
      }
      if (step.action === "create" || step.action === "link-existing") {
        const linked = await sql`update users set auth_user_id = ${authUserId}
                                  where id = ${step.user.id} and auth_user_id is null
                                  returning id`;
        if (linked.length !== 1) throw new Error(`could not link ${step.user.email}`);
      }
      done.push(step);
    }

    process.stdout.write("db:seed:auth: local sign-ins (local Supabase only)\n");
    for (const s of done) {
      const what = {
        create: "created",
        "link-existing": "linked (existing password kept)",
        linked: "already set up",
        skip: `skipped — ${s.why}`,
      }[s.action];
      process.stdout.write(`  ${s.user.email.padEnd(32)} ${s.user.role.padEnd(9)} ${what}\n`);
    }
    process.stdout.write(
      `\nNew sign-ins use the local development password: ${LOCAL_DEV_PASSWORD}\n` +
        "Sign in at http://localhost:3000/login (let your browser remember it).\n",
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => exitWith("db:seed:auth", error));
}
