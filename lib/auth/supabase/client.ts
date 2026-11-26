import { createServerClient } from "@supabase/ssr";
import type { CookieIO } from "@/lib/auth/cookie-io";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/auth/cookies";
import { env, isProduction } from "@/lib/env";

/**
 * Server-side Supabase client over the given cookies (TASK-024). Server-only: there is
 * no browser Supabase client, so the provider cookies can be httpOnly. lib/env.ts
 * guarantees the URL and anon key whenever AUTH_PROVIDER=supabase.
 */
export const PROVIDER_COOKIE_PREFIX = "sb-";

export function createSupabaseServerClient(io: CookieIO) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase Auth is not configured (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY)");
  }
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => io.getAll(),
      setAll: (cookies) => io.setAll(cookies),
    },
    // Same policy as lt-session (AGENTS.md › Security rules).
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    },
  });
}

/** Expire every provider cookie present (after sign-out or a dead session). */
export function clearProviderCookies(io: CookieIO): void {
  const stale = io.getAll().filter((c) => c.name.startsWith(PROVIDER_COOKIE_PREFIX));
  if (stale.length === 0) return;
  io.setAll(stale.map(({ name }) => ({ name, value: "", options: { path: "/", maxAge: 0 } })));
}
