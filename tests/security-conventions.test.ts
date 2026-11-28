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
      "app/api/test/reset/route.ts",
      "lib/auth/session-secret.ts", // only RESOLVES the key; session-token.ts compares
      "lib/jobs/cron-auth.ts", // TASK-034: the ONE CRON_SECRET check, shared by every job
    ]);
  });

  // Every file that COMPARES a secret-derived value against request input.
  it.each(["lib/jobs/cron-auth.ts", "app/api/test/reset/route.ts", "lib/auth/session-token.ts"])(
    "%s compares its secret with timingSafeEqual, never === / !==",
    (rel) => {
      const code = readFileSync(path.join(root, rel), "utf8")
        .split("\n")
        .filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l)) // ignore comments
        .join("\n");
      expect(code).toMatch(/import \{[^}]*\btimingSafeEqual\b[^}]*\} from "node:crypto"/);
      expect(code).toMatch(/timingSafeEqual\(/);
      for (const pattern of UNSAFE_COMPARE)
        expect(code, `unsafe compare: ${pattern}`).not.toMatch(pattern);
    },
  );

  it("every scheduled-job route checks isCronAuthorized FIRST, before anything else runs", () => {
    const jobs = readdirSync(path.join(root, "app/api/jobs"));
    expect(jobs.sort()).toEqual(["accrual", "resolution-expiry"]);
    for (const job of jobs) {
      const code = readFileSync(path.join(root, "app/api/jobs", job, "route.ts"), "utf8");
      expect(code, job).toMatch(/import \{ isCronAuthorized \} from "@\/lib\/jobs\/cron-auth"/);
      // The first statement of the handler body is the auth check.
      expect(code, job).toMatch(
        /withErrorHandler\(async \(req: NextRequest\) => \{\s*if \(!isCronAuthorized\(req, "[\w-]+"\)\)/,
      );
    }
  });

  it("SUPABASE_SERVICE_ROLE_KEY is read from the environment only by the invite script (TASK-024/054)", () => {
    const all = ["app", "lib", "components", "scripts"].flatMap((d) =>
      readdirSync(path.join(root, d), { recursive: true })
        .map((f) => path.join(root, d, String(f)))
        .filter((f) => /\.(ts|tsx|mjs|js)$/.test(f)),
    );
    const files = [...all, path.join(root, "proxy.ts")];
    const rel = (f: string) => path.relative(root, f);
    // Reads of the env var: only the operator invite script.
    const readers = files
      .filter((f) => /process\.env\.SUPABASE_SERVICE_ROLE_KEY/.test(readFileSync(f, "utf8")))
      .map(rel);
    expect(readers.sort()).toEqual(["scripts/invite-user.mjs"]);
    // Any mention at all, reviewed: lib/env.ts declares it optional (never hands it to a
    // client); scripts/local-env.mjs WRITES the local stack's key into .env.local (TASK-054).
    const mentions = files
      .filter((f) => /SUPABASE_SERVICE_ROLE_KEY/.test(readFileSync(f, "utf8")))
      .map(rel);
    expect(mentions.sort()).toEqual([
      "lib/env.ts",
      "scripts/invite-user.mjs",
      "scripts/local-env.mjs",
    ]);
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
