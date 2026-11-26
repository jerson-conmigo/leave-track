import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Secrets that authenticate requests (CRON_SECRET for /api/jobs/*, E2E_RESET_TOKEN
 * for the test hook, SESSION_SECRET for session-cookie signatures) must be compared in
 * constant time. A plain `===` leaks how many leading characters matched via response
 * timing. (TASK-017 VALIDATE; session signatures added in TASK-023.)
 */
const root = path.resolve(import.meta.dirname, "..");
const SECRET_READ = /process\.env\.(CRON_SECRET|E2E_RESET_TOKEN|SESSION_SECRET)/;
const UNSAFE_COMPARE = [
  /(===|!==)\s*`Bearer/, // header === `Bearer ${secret}`
  /`Bearer \$\{[^}]+\}`\s*(===|!==)/,
  /\b(secret|expected|token)\b\s*(===|!==)\s*[a-z]/i,
  /[a-z)\]]\s*(===|!==)\s*\b(secret|expected|token)\b/i,
];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
  });
}

describe("security conventions", () => {
  const secretFiles = ["app", "lib"]
    .flatMap((d) => files(path.join(root, d)))
    .filter((f) => SECRET_READ.test(readFileSync(f, "utf8")));

  it("finds every file that reads an authenticating secret (guards against a vacuous pass)", () => {
    expect(secretFiles.map((f) => path.relative(root, f)).sort()).toEqual([
      "app/api/jobs/accrual/route.ts",
      "app/api/test/reset/route.ts",
      "lib/auth/session-secret.ts", // only RESOLVES the key; session-token.ts compares
    ]);
  });

  // Every file that COMPARES a secret-derived value against request input.
  it.each([
    "app/api/jobs/accrual/route.ts",
    "app/api/test/reset/route.ts",
    "lib/auth/session-token.ts",
  ])("%s compares its secret with timingSafeEqual, never === / !==", (rel) => {
    const code = readFileSync(path.join(root, rel), "utf8")
      .split("\n")
      .filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l)) // ignore comments
      .join("\n");
    expect(code).toMatch(/import \{[^}]*\btimingSafeEqual\b[^}]*\} from "node:crypto"/);
    expect(code).toMatch(/timingSafeEqual\(/);
    for (const pattern of UNSAFE_COMPARE)
      expect(code, `unsafe compare: ${pattern}`).not.toMatch(pattern);
  });

  it("SUPABASE_SERVICE_ROLE_KEY is read only by the operator invite script (TASK-024)", () => {
    const all = ["app", "lib", "components", "scripts"].flatMap((d) =>
      readdirSync(path.join(root, d), { recursive: true })
        .map((f) => path.join(root, d, String(f)))
        .filter((f) => /\.(ts|tsx|mjs|js)$/.test(f)),
    );
    const readers = [...all, path.join(root, "proxy.ts")]
      .filter((f) => /SUPABASE_SERVICE_ROLE_KEY/.test(readFileSync(f, "utf8")))
      .map((f) => path.relative(root, f));
    // lib/env.ts only declares it as optional; it never hands it to a client.
    expect(readers.sort()).toEqual(["lib/env.ts", "scripts/invite-user.mjs"]);
    expect(readFileSync(path.join(root, "lib/env.ts"), "utf8")).not.toMatch(
      /createClient|createServerClient/,
    );
  });

  it("session signatures are compared with timingSafeEqual after a length check, never ===", () => {
    const code = readFileSync(path.join(root, "lib/auth/session-token.ts"), "utf8");
    expect(code).toMatch(
      /given\.length !== SIGNATURE_BYTES \|\| !timingSafeEqual\(given, expected\)/,
    );
    expect(code).not.toMatch(/\b(signature|sig|given|expected)\b\s*(===|!==)\s*[a-z]/i);
  });
});
