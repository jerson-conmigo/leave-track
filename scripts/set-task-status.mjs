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
 *
 * TASK-022: the file is scanned as whole RFC 4180 records (a quoted field may contain
 * commas, "" escapes and line breaks), so a line inside a quoted field is never mistaken
 * for a row. Each record keeps its own line ending (mixed CRLF/LF files work), a leading
 * BOM is preserved, malformed files are refused before anything is written, and the
 * result is written to a temp file and renamed over the original.
 */
import { readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const STATUSES = ["Open", "In Progress", "Blocked", "Done"];
const TASKS_DIR = "docs/dev-tasks";
const BOM = "﻿";

const fail = (msg) => {
  process.stderr.write(`set-task-status: ${msg}\n`);
  process.exit(1);
};

const [taskId, status, csvArg] = process.argv.slice(2);
if (!taskId || !status)
  fail('usage: npm run task:status -- <TASK-ID> <"Open"|"In Progress"|"Blocked"|"Done"> [csv]');
if (!STATUSES.includes(status)) fail(`status must be one of: ${STATUSES.join(", ")}`);

/**
 * Scan `text` into records. Each record is a list of field ranges [start, end) into
 * `text`; a record ends at an unquoted CRLF, LF or CR. Throws on an unterminated quote.
 */
function scanRecords(text, start) {
  const records = [];
  let i = start;
  while (i < text.length) {
    const fields = [];
    for (;;) {
      const fieldStart = i;
      if (text[i] === '"') {
        i++;
        for (;;) {
          if (i >= text.length) {
            throw new Error(`unterminated quoted field in record ${records.length + 1}`);
          }
          if (text[i] === '"' && text[i + 1] === '"') i += 2;
          else if (text[i] === '"') {
            i++;
            break;
          } else i++;
        }
      }
      while (i < text.length && text[i] !== "," && text[i] !== "\r" && text[i] !== "\n") i++;
      fields.push([fieldStart, i]);
      if (text[i] === ",") {
        i++;
        continue;
      }
      break;
    }
    if (text[i] === "\r" && text[i + 1] === "\n") i += 2;
    else if (text[i] === "\r" || text[i] === "\n") i++;
    records.push(fields);
  }
  return records;
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
  const offset = text.startsWith(BOM) ? BOM.length : 0;
  let records;
  try {
    records = scanRecords(text, offset);
  } catch (error) {
    fail(`${file}: ${error.message} — nothing was changed`);
  }
  if (records.length === 0) continue;
  const field = (range) => unquote(text.slice(...range));
  const header = records[0].map((range) => field(range).trim());
  const statusIdx = header.indexOf("status");
  const idIdx = header.indexOf("task_id");
  if (statusIdx < 0 || idIdx < 0) continue;

  records.forEach((fields, n) => {
    if (n === 0) return;
    if (fields.length === 1 && fields[0][0] === fields[0][1]) return; // blank line
    if (fields.length !== header.length) {
      fail(
        `${file}: record ${n + 1} has ${fields.length} fields but the header has ${header.length} — nothing was changed`,
      );
    }
    if (field(fields[idIdx]) === taskId) {
      matches.push({ file, text, span: fields[statusIdx] });
    }
  });
}

if (matches.length === 0) fail(`${taskId} not found in ${candidates.join(", ")}`);
if (matches.length > 1)
  fail(`${taskId} found ${matches.length} times — pass the CSV path explicitly`);

const { file, text, span } = matches[0];
const previous = unquote(text.slice(...span));
const value = /[",\r\n]/.test(status) ? `"${status.replaceAll('"', '""')}"` : status;
const updated = text.slice(0, span[0]) + value + text.slice(span[1]);

// Atomic replace: a crash can never leave a half-written CSV.
const temp = path.join(path.dirname(file), `.${path.basename(file)}.${process.pid}.tmp`);
try {
  writeFileSync(temp, updated);
  renameSync(temp, file);
} catch (error) {
  rmSync(temp, { force: true });
  fail(`could not write ${file}: ${error.message}`);
}
process.stdout.write(`${file}: ${taskId} ${previous} → ${status}\n`);
