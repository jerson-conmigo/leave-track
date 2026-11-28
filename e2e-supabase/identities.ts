import { combineChunks, stringFromBase64URL } from "@supabase/ssr";

/**
 * Test identities for the real-Supabase e2e (TASK-024). Pure: no network, no database.
 *
 * Every identity the suite creates lives under one reserved, test-only email domain
 * (`.test` is a reserved TLD, so it can never be a real mailbox). Cleanup deletes ONLY
 * this domain — never seeded people, dev logins or anyone else in local Supabase.
 */
export const TEST_EMAIL_DOMAIN = "e2e-auth.leavetrack.test";

/** A unique test address: `<label>-<runId>@e2e-auth.leavetrack.test`. */
export function testEmail(label: string, runId: string): string {
  const safe = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return `${safe(label)}-${safe(runId)}@${TEST_EMAIL_DOMAIN}`;
}

/**
 * True only for an address whose domain is EXACTLY the test domain (case-insensitive).
 * Seeded addresses (`x@leavetrack.test`), subdomains (`x@sub.e2e-auth.leavetrack.test`),
 * lookalikes (`x@e2e-auth.leavetrack.test.evil`) and missing values are all false.
 */
export function isTestEmail(email: string | null | undefined): boolean {
  if (typeof email !== "string") return false;
  const at = email.lastIndexOf("@");
  return at > 0 && email.slice(at + 1).toLowerCase() === TEST_EMAIL_DOMAIN;
}

const BASE64_PREFIX = "base64-";
const AUTH_COOKIE = /^sb-(.+)-auth-token(\.\d+)?$/;

/**
 * The Supabase access token from browser cookies written by @supabase/ssr (0.12.x):
 * `sb-<ref>-auth-token`, possibly split into `.0`, `.1`, … chunks, holding
 * `base64-` + base64url(JSON session). Reassembled and decoded with the library's own
 * exported helpers, so this follows its format rather than re-implementing it.
 */
export async function accessTokenFromCookies(
  cookies: readonly { name: string; value: string }[],
): Promise<string> {
  const refs = new Set(cookies.map((c) => c.name.match(AUTH_COOKIE)?.[1]).filter(Boolean));
  if (refs.size !== 1) {
    throw new Error(`expected exactly one Supabase auth cookie set, found ${refs.size}`);
  }
  const key = `sb-${[...refs][0]}-auth-token`;
  const byName = new Map(cookies.map((c) => [c.name, c.value]));
  const raw = await combineChunks(key, (name) => byName.get(name));
  if (!raw) throw new Error(`Supabase auth cookie ${key} is empty`);

  let session: unknown;
  try {
    const json = raw.startsWith(BASE64_PREFIX)
      ? stringFromBase64URL(raw.slice(BASE64_PREFIX.length))
      : raw;
    session = JSON.parse(json);
  } catch {
    throw new Error(`Supabase auth cookie ${key} is not a readable session`);
  }
  const token = (session as { access_token?: unknown } | null)?.access_token;
  if (typeof token !== "string" || token.length === 0) {
    throw new Error(`Supabase auth cookie ${key} has no access_token`);
  }
  return token;
}
