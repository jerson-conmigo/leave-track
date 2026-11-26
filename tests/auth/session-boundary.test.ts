import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * TASK-023 — the session cookie and its signing stay behind the auth boundary:
 * only these files touch the cookie, and only the auth port creates or verifies tokens.
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
  it("only proxy.ts, getSession and the login/logout actions touch the session cookie", () => {
    expect(using(/\bSESSION_COOKIE\b|["'`]lt-session["'`]/)).toEqual([
      "app/(public)/login/actions.ts",
      "lib/auth/cookies.ts",
      "lib/auth/session.ts",
      "proxy.ts",
    ]);
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
