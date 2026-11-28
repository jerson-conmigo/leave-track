#!/usr/bin/env node
/**
 * Print a Markdown coverage table from Vitest's json-summary report (TASK-021).
 * CI appends the output to $GITHUB_STEP_SUMMARY.
 *
 *   node scripts/coverage-summary.mjs coverage/coverage-summary.json
 *
 * A missing or invalid report is an error: the problem is printed (to stdout, so it
 * appears in the job summary, and to stderr for the log) and the exit code is 1 —
 * never a silent pass.
 */
import { readFileSync } from "node:fs";

const METRICS = ["statements", "branches", "functions", "lines"];
const file = process.argv[2] ?? "coverage/coverage-summary.json";

function fail(message) {
  process.stdout.write(`### Coverage\n\n:x: ${message}\n`);
  process.stderr.write(`coverage-summary: ${message}\n`);
  process.exit(1);
}

let raw;
try {
  raw = readFileSync(file, "utf8");
} catch {
  fail(`Coverage report not found at \`${file}\` — did \`npm run test:coverage\` run?`);
}

let total;
try {
  total = JSON.parse(raw).total;
} catch {
  fail(`Coverage report \`${file}\` is not valid JSON.`);
}

const valid =
  total &&
  METRICS.every(
    (m) =>
      typeof total[m]?.pct === "number" &&
      Number.isInteger(total[m]?.covered) &&
      Number.isInteger(total[m]?.total),
  );
if (!valid) fail(`Coverage report \`${file}\` has no valid \`total\` for ${METRICS.join(", ")}.`);

const rows = METRICS.map(
  (m) =>
    `| ${m[0].toUpperCase()}${m.slice(1)} | ${total[m].pct.toFixed(2)}% | ${total[m].covered} / ${total[m].total} |`,
);
process.stdout.write(
  [
    "### Coverage",
    "",
    "| Metric | Coverage | Covered / Total |",
    "| --- | ---: | ---: |",
    ...rows,
    "",
  ].join("\n"),
);
