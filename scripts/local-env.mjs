#!/usr/bin/env node
/**
 * npm run env:local — fill .env.local with the LOCAL Supabase stack's settings (TASK-054).
 *
 *   npm run env:local                     # update .env.local
 *   npm run env:local -- --replace-remote # back up, then replace hosted values found in it
 *
 * - Reads `supabase status -o env` of the running local stack; refuses if it is not
 *   running or its URLs are not local.
 * - Keeps every unrelated line (comments, order, other variables) and existing secrets.
 * - Generates SESSION_SECRET / CRON_SECRET (32 random bytes, hex) only when missing.
 * - Refuses — writing nothing — if .env.local already points at a NON-local database or
 *   Supabase project, unless --replace-remote (then a backup is written first).
 * - Never prints keys or secrets: only variable names and what happened to them.
 */
import { randomBytes } from "node:crypto";
import { copyFileSync, existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { exitWith, isLocalUrl, LocalOnlyError, readLocalStatus } from "./lib/local-only.mjs";

const MARKER = "# ── Local Supabase (written by npm run env:local) ──";
const URL_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "DATABASE_URL", "DIRECT_URL"];
const secret = () => randomBytes(32).toString("hex");

/** Values this command manages, from `supabase status -o env`. */
export function managedValues(status) {
  return {
    APP_ENV: "development",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    AUTH_PROVIDER: "supabase",
    NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
    DATABASE_URL: status.DB_URL,
    DIRECT_URL: status.DB_URL,
    DATABASE_POOL_MAX: "2",
  };
}

const LINE = /^(\s*(?:export\s+)?)([A-Za-z_][A-Za-z0-9_]*)=(.*)$/;
const unquote = (v) => v.trim().replace(/^(['"])(.*)\1$/, "$2");

/**
 * Pure: the new file text and a per-key report, or { remote: [names] } when hosted values
 * are present and replaceRemote is false. Lines that are not managed stay byte-identical.
 */
export function planEnvFile(text, status, { replaceRemote = false, makeSecret = secret } = {}) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text === "" ? [] : text.split(/\r?\n/);
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();

  const current = {};
  lines.forEach((l, i) => {
    const m = l.match(LINE);
    if (m) current[m[2]] = { value: unquote(m[3]), index: i, prefix: m[1] };
  });

  const remote = URL_KEYS.filter((k) => current[k]?.value && !isLocalUrl(current[k].value));
  if (remote.length > 0 && !replaceRemote) return { remote };

  const wanted = managedValues(status);
  const report = {};
  for (const k of Object.keys(wanted)) {
    const was = current[k]?.value ?? "";
    report[k] = was === wanted[k] ? "unchanged" : was === "" ? "set" : "updated";
  }
  if ((current.SESSION_SECRET?.value ?? "").length >= 32) report.SESSION_SECRET = "kept";
  else {
    wanted.SESSION_SECRET = makeSecret();
    report.SESSION_SECRET = "generated";
  }
  if (current.CRON_SECRET?.value) report.CRON_SECRET = "kept";
  else {
    wanted.CRON_SECRET = makeSecret();
    report.CRON_SECRET = "generated";
  }

  const out = [...lines];
  const appended = [];
  for (const [k, v] of Object.entries(wanted)) {
    if (current[k]) {
      if (current[k].value !== v) out[current[k].index] = `${current[k].prefix}${k}=${v}`;
    } else appended.push(`${k}=${v}`);
  }
  if (appended.length > 0) {
    if (!out.includes(MARKER)) {
      if (out.length > 0 && out[out.length - 1].trim() !== "") out.push("");
      out.push(MARKER);
    }
    out.push(...appended);
  }
  return { text: out.join(eol) + eol, report, remote };
}

function main() {
  const args = process.argv.slice(2);
  const replaceRemote = args.includes("--replace-remote");
  // --target <file>: another file instead of .env.local (used by the tests). Not "--env-file":
  // Node 24 treats that as its own option even after the script name.
  const fileArg = args.indexOf("--target");
  const file = path.resolve(fileArg >= 0 ? args[fileArg + 1] : ".env.local");
  const unknown = args.filter(
    (a, i) => a !== "--replace-remote" && a !== "--target" && args[i - 1] !== "--target",
  );
  if (unknown.length > 0) throw new LocalOnlyError(`unknown option ${unknown[0]}`);

  const status = readLocalStatus();
  const before = existsSync(file) ? readFileSync(file, "utf8") : "";
  const plan = planEnvFile(before, status, { replaceRemote });

  if (!plan.text) {
    throw new LocalOnlyError(
      `${path.basename(file)} points ${plan.remote.join(", ")} at a NON-local (hosted?) project, ` +
        "so nothing was changed. If you really want to switch this file to the local stack, run: " +
        "npm run env:local -- --replace-remote (a backup is written first).",
    );
  }

  if (plan.remote.length > 0) {
    const stamp = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15);
    const backup = path.join(path.dirname(file), `.env.${stamp}.backup.local`);
    copyFileSync(file, backup);
    process.stdout.write(
      `env:local: backed up ${path.basename(file)} to ${path.basename(backup)}\n`,
    );
  }

  if (plan.text !== before) {
    const temp = `${file}.${process.pid}.tmp`;
    try {
      writeFileSync(temp, plan.text, { mode: 0o600 });
      renameSync(temp, file);
    } catch (error) {
      rmSync(temp, { force: true });
      throw error;
    }
  }

  const width = Math.max(...Object.keys(plan.report).map((k) => k.length));
  process.stdout.write(`env:local: ${path.basename(file)} → local Supabase (values not shown)\n`);
  for (const [k, what] of Object.entries(plan.report)) {
    process.stdout.write(`  ${k.padEnd(width)}  ${what}\n`);
  }
  process.stdout.write(
    "\nNext: restart `npm run dev` (NEXT_PUBLIC_* values are read at start-up), then run\n" +
      "`npm run db:seed:auth` once to create the local sign-ins (see README › Local Supabase).\n",
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    exitWith("env:local", error);
  }
}
