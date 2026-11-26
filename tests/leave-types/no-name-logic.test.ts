import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * TASK-018 — US-08 behaviour must key on `tracksBalance`, never on a leave type's
 * NAME or a specific type ID, so a future untracked type needs no code change.
 * Name literals / LEAVE_TYPE_IDS may appear only in this presentational/data
 * allow-list (asserted exactly, so the test can't pass vacuously or drift).
 */
const root = path.resolve(import.meta.dirname, "../..");
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
  });
const appFiles = ["lib", "app", "components"].flatMap((d) => files(path.join(root, d)));
const rel = (f: string) => path.relative(root, f);
const code = (f: string) =>
  readFileSync(f, "utf8")
    .split("\n")
    .filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l))
    .join("\n");

describe("no business logic keyed on leave-type names or specific type IDs", () => {
  it("quoted leave-type names appear only in the allow-listed data/presentation files", () => {
    const hits = appFiles
      .filter((f) => /["'`](Unpaid|Vacation|Sick)["'`]/.test(code(f)))
      .map(rel)
      .sort();
    expect(hits).toEqual([
      "lib/data/mock/fixtures.ts", // fixture rows (mirror of the seed)
      "lib/data/postgres-repository.ts", // display ordering in listLeaveTypes only
      "lib/data/types.ts", // LEAVE_TYPE_NAMES union (UI typing, backlog B25)
    ]);
  });

  it("no comparison against a leave-type name anywhere in app code", () => {
    const offenders = appFiles.flatMap((f) =>
      code(f)
        .split("\n")
        .filter((l) =>
          /(===|!==|==|!=)\s*["'`](Unpaid|Vacation|Sick)["'`]|case\s+["'`](Unpaid|Vacation|Sick)["'`]/.test(
            l,
          ),
        )
        .map((l) => `${rel(f)}: ${l.trim()}`),
    );
    expect(offenders).toEqual([]);
  });

  it("specific type IDs (LEAVE_TYPE_IDS) are not used by app logic outside the mock data layer", () => {
    const users = appFiles
      .filter((f) => !rel(f).startsWith("lib/data/mock/"))
      .filter((f) => /LEAVE_TYPE_IDS/.test(code(f)))
      .map(rel);
    expect(users).toEqual([]);
  });
});
