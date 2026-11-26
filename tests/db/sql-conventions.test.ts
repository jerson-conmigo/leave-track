import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * SQL wire-boundary conventions for app code (lib/, app/). Found in TASK-014:
 * a parameter typed directly as a custom enum (`$3::public.request_status`) makes
 * postgres.js issue a type-lookup query mid-statement — wasted round trips on a
 * real server, and a broken connection on single-session servers (pglite-socket).
 * Rule: send enums as text and cast inside SQL — `($3::text)::public.request_status` —
 * and read them back as `::text`.
 */
const root = path.resolve(import.meta.dirname, "../..");
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
  });
}

describe("SQL conventions", () => {
  it("never types a bind parameter directly as a custom enum", () => {
    const offenders = ["lib", "app"]
      .flatMap((d) => files(path.join(root, d)))
      .flatMap((f) =>
        readFileSync(f, "utf8")
          .split("\n")
          .map((line, i) => ({ f: path.relative(root, f), i: i + 1, line }))
          .filter(({ line }) => /\$\d+::public\./.test(line)),
      )
      .map(({ f, i, line }) => `${f}:${i}: ${line.trim()}`);
    expect(offenders).toEqual([]);
  });
});
