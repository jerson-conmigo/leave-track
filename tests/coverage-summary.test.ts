import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

/**
 * TASK-021 — scripts/coverage-summary.mjs (the CI "Coverage summary" step) prints a
 * Markdown table for a valid report and FAILS LOUDLY (exit 1, message on stdout for the
 * job summary and on stderr for the log) for a missing, invalid or wrongly shaped one.
 */
const script = path.resolve(import.meta.dirname, "../scripts/coverage-summary.mjs");
const dir = mkdtempSync(path.join(tmpdir(), "cov-summary-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const write = (name: string, content: string) => {
  const file = path.join(dir, name);
  writeFileSync(file, content);
  return file;
};
const run = (file: string) => spawnSync(process.execPath, [script, file], { encoding: "utf8" });
const metric = (pct: number, covered: number, total: number) => ({ pct, covered, total });

describe("coverage-summary.mjs", () => {
  it("prints a table with every metric for a valid report", () => {
    const file = write(
      "ok.json",
      JSON.stringify({
        total: {
          statements: metric(86.28, 629, 729),
          branches: metric(80.24, 390, 486),
          functions: metric(91.77, 212, 231),
          lines: metric(87.2, 559, 641),
        },
      }),
    );
    const res = run(file);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("| Metric | Coverage | Covered / Total |");
    expect(res.stdout).toContain("| Statements | 86.28% | 629 / 729 |");
    expect(res.stdout).toContain("| Lines | 87.20% | 559 / 641 |");
    expect(res.stderr).toBe("");
  });

  it.each([
    ["a missing file", () => path.join(dir, "does-not-exist.json"), /not found/],
    ["invalid JSON", () => write("bad.json", "{oops"), /not valid JSON/],
    ["no total", () => write("empty.json", "{}"), /no valid `total`/],
    [
      "a non-numeric pct",
      () => write("shape.json", JSON.stringify({ total: { lines: { pct: "x" } } })),
      /no valid `total`/,
    ],
    [
      "a missing metric",
      () =>
        write(
          "partial.json",
          JSON.stringify({ total: { statements: metric(1, 1, 1), lines: metric(1, 1, 1) } }),
        ),
      /no valid `total`/,
    ],
  ])("fails loudly on %s", (_label, make, message) => {
    const res = run(make());
    expect(res.status).toBe(1);
    expect(res.stdout).toMatch(message); // visible in the CI job summary
    expect(res.stderr).toMatch(message); // visible in the CI log
  });
});
