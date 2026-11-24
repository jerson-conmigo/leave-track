#!/usr/bin/env node
/**
 * Update the `status` of one task in docs/dev-tasks/*.csv — surgically.
 *
 *   npm run task:status -- TASK-010 Done
 *   npm run task:status -- TASK-011 "In Progress" docs/dev-tasks/epic-1-leave-request-tasks.csv
 *
 * Only the status field of the matching row is rewritten. The rest of the file
 * (quoting, line endings, other rows) is left byte-for-byte intact — a CSV
 * library round-trip would re-quote unrelated rows and pollute the diff.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const STATUSES = ["Open", "In Progress", "Blocked", "Done"];
const TASKS_DIR = "docs/dev-tasks";

const fail = (msg) => {
  process.stderr.write(`set-task-status: ${msg}\n`);
  process.exit(1);
};

const [taskId, status, csvArg] = process.argv.slice(2);
if (!taskId || !status)
  fail('usage: npm run task:status -- <TASK-ID> <"Open"|"In Progress"|"Blocked"|"Done"> [csv]');
if (!STATUSES.includes(status)) fail(`status must be one of: ${STATUSES.join(", ")}`);

/** Character spans [start, end) of each field in one CSV line (RFC 4180 quoting). */
function fieldSpans(line) {
  const spans = [];
  let i = 0;
  while (i <= line.length) {
    const start = i;
    if (line[i] === '"') {
      i++;
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') i += 2;
        else if (line[i] === '"') {
          i++;
          break;
        } else i++;
      }
    }
    while (i < line.length && line[i] !== ",") i++;
    spans.push([start, i]);
    i++;
  }
  return spans;
}

const unquote = (s) => (s.startsWith('"') ? s.slice(1, -1).replaceAll('""', '"') : s);

const candidates = csvArg
  ? [csvArg]
  : readdirSync(TASKS_DIR)
      .filter((f) => f.endsWith(".csv"))
      .map((f) => path.join(TASKS_DIR, f));

const matches = [];
for (const file of candidates) {
  const text = readFileSync(file, "utf8");
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(eol);
  const header = fieldSpans(lines[0]).map(([s, e]) => unquote(lines[0].slice(s, e)).trim());
  const statusIdx = header.indexOf("status");
  const idIdx = header.indexOf("task_id");
  if (statusIdx < 0 || idIdx < 0) continue;
  lines.forEach((line, n) => {
    if (n === 0 || !line) return;
    const spans = fieldSpans(line);
    if (unquote(line.slice(...spans[idIdx])) === taskId) {
      matches.push({ file, text, eol, lines, n, span: spans[statusIdx] });
    }
  });
}

if (matches.length === 0) fail(`${taskId} not found in ${candidates.join(", ")}`);
if (matches.length > 1)
  fail(`${taskId} found ${matches.length} times — pass the CSV path explicitly`);

const { file, eol, lines, n, span } = matches[0];
const line = lines[n];
const previous = unquote(line.slice(...span));
const value = /[",\r\n]/.test(status) ? `"${status.replaceAll('"', '""')}"` : status;
lines[n] = line.slice(0, span[0]) + value + line.slice(span[1]);
writeFileSync(file, lines.join(eol));
process.stdout.write(`${file}: ${taskId} ${previous} → ${status}\n`);
