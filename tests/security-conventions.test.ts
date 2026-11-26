import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Secrets that authenticate requests (CRON_SECRET for /api/jobs/*, E2E_RESET_TOKEN
 * for the test hook) must be compared in constant time. A plain `===` leaks how
 * many leading characters matched via response timing. (TASK-017 VALIDATE.)
 */
const root = path.resolve(import.meta.dirname, "..");
const SECRET_READ = /process\.env\.(CRON_SECRET|E2E_RESET_TOKEN)/;
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

  it("finds the secret-guarded routes (guards against a vacuous pass)", () => {
    expect(secretFiles.map((f) => path.relative(root, f)).sort()).toEqual([
      "app/api/jobs/accrual/route.ts",
      "app/api/test/reset/route.ts",
    ]);
  });

  it.each(["app/api/jobs/accrual/route.ts", "app/api/test/reset/route.ts"])(
    "%s compares its secret with timingSafeEqual, never === / !==",
    (rel) => {
      const code = readFileSync(path.join(root, rel), "utf8")
        .split("\n")
        .filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l)) // ignore comments
        .join("\n");
      expect(code).toMatch(/import \{ timingSafeEqual \} from "node:crypto"/);
      expect(code).toMatch(/timingSafeEqual\(/);
      for (const pattern of UNSAFE_COMPARE)
        expect(code, `unsafe compare: ${pattern}`).not.toMatch(pattern);
    },
  );
});
