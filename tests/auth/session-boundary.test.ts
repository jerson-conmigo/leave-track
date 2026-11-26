import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * TASK-023/024 — the session cookies and their signing stay behind the auth boundary:
 * only these files touch our cookie, only the auth port creates or verifies tokens, and
 * only the Supabase adapter touches the provider's `sb-*` cookies or Supabase clients.
 * A new file reading `lt-session` or signing tokens directly fails here until reviewed.
 */
const root = path.resolve(import.meta.dirname, "../..");
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
  });
const appFiles = [
  ...["app", "lib", "components"].flatMap((d) => files(path.join(root, d))),
  path.join(root, "proxy.ts"),
];
const using = (pattern: RegExp) =>
  appFiles
    .filter((f) => pattern.test(readFileSync(f, "utf8")))
    .map((f) => path.relative(root, f))
    .sort();

describe("session boundary", () => {
  it("only completeSignIn writes the session cookie; only proxy.ts and getSession read it", () => {
    expect(using(/\bSESSION_COOKIE\b|["'`]lt-session["'`]/)).toEqual([
      "lib/auth/cookies.ts",
      "lib/auth/session.ts",
      "lib/auth/sign-in.ts",
      "proxy.ts",
    ]);
  });

  it("only lib/auth/sign-in.ts SETS the session cookie", () => {
    expect(using(/\.set\(\s*SESSION_COOKIE\b/)).toEqual(["lib/auth/sign-in.ts"]);
  });

  it("only the Supabase adapter creates Supabase clients or touches the sb-* cookies (TASK-024)", () => {
    expect(
      using(
        /@supabase\/|createServerClient|createSupabaseServerClient|PROVIDER_COOKIE_PREFIX|["'`]sb-/,
      ),
    ).toEqual(["lib/auth/supabase/adapter.ts", "lib/auth/supabase/client.ts"]);
  });

  it("the users row is found by auth_user_id, never by email, at sign-in (TASK-024)", () => {
    expect(using(/getUserByAuthUserId/)).toEqual([
      "app/(public)/auth/set-password/actions.ts",
      "app/(public)/login/actions.ts",
      "lib/auth/session.ts",
      "lib/data/mock/repository.ts",
      "lib/data/postgres-repository.ts",
      "lib/data/repositories.ts",
    ]);
    expect(using(/getUserByEmail|by_email|where\s+(lower\()?email/i)).toEqual([]);
  });

  it("only the auth port signs or verifies session tokens", () => {
    expect(using(/\b(signSessionToken|verifySessionToken)\b/)).toEqual([
      "lib/auth/provider.ts",
      "lib/auth/session-token.ts",
    ]);
  });

  it("nothing reads the Day 0 unsigned cookies", () => {
    expect(using(/\.get\(\s*["'`]mock-(role|user-id)["'`]/)).toEqual([]);
  });
});
