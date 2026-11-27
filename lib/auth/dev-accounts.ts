import "server-only";
import type { Role, User } from "@/lib/data/types";
import { isDeployedEnv } from "@/lib/env";

/**
 * Local development account dropdown (TASK-056). On the Supabase sign-in form, picking an
 * account only FILLS the email and this documented local password; the user still presses
 * Sign in, which goes through passwordLoginAction and real Supabase Auth — the role comes from
 * the users row. Nothing here authenticates anyone.
 *
 * Shown only when devLoginAccountsEnabled() — evaluated on the server per request — is true;
 * otherwise neither the password nor the account list reaches the page.
 */

/** The local development password (README › Local Supabase). Pinned equal to
 *  scripts/dev-auth-seed.mjs by tests/auth/dev-accounts.test.ts. */
export const LOCAL_DEV_PASSWORD = "leavetrack-local-dev";

/** Stricter than lib/env.ts isLocalUrl on purpose: exactly these two hosts, nothing else. */
export const DEV_LOGIN_HOSTS = ["localhost", "127.0.0.1"] as const;

export function isDevLoginHost(value: string | undefined): boolean {
  if (!value) return false;
  try {
    return (DEV_LOGIN_HOSTS as readonly string[]).includes(new URL(value).hostname.toLowerCase());
  } catch {
    return false;
  }
}

type RawEnv = Record<string, string | undefined>;

/** Pure. True only when ALL guards hold; any missing or failing guard → false. */
export function devLoginAccountsEnabled(raw: RawEnv): boolean {
  return (
    raw.DEV_LOGIN_ACCOUNTS === "true" &&
    !isDeployedEnv(raw) &&
    raw.AUTH_PROVIDER === "supabase" &&
    isDevLoginHost(raw.NEXT_PUBLIC_SUPABASE_URL) &&
    isDevLoginHost(raw.DATABASE_URL)
  );
}

/** Exactly what the dropdown may show: name, email and role. */
export type DevAccount = { name: string; email: string; role: Role };

const ROLE_ORDER: Role[] = ["employee", "manager", "hr_admin"];

export function toDevAccounts(users: readonly User[]): DevAccount[] {
  return users
    .map(({ name, email, role }) => ({ name, email, role }))
    .sort(
      (a, b) =>
        ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.name.localeCompare(b.name),
    );
}
