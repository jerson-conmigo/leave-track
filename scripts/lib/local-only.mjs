/**
 * Local-only guard for developer scripts (TASK-054). Local development scripts may only
 * touch the LOCAL Supabase stack started by `npm run local:start`; anything else — a hosted
 * project, a lookalike host, a missing value — is refused. Errors name variables, never values.
 *
 * Keep LOCAL_HOSTS identical to lib/env.ts (tests/scripts/local-only.test.ts checks this).
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

export const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1", "[::1]"];

export class LocalOnlyError extends Error {}

/** True only for a parseable URL whose host is exactly a loopback name. */
export function isLocalUrl(value) {
  if (typeof value !== "string" || value === "") return false;
  try {
    return LOCAL_HOSTS.includes(new URL(value).hostname.toLowerCase());
  } catch {
    return false;
  }
}

/** The host of a URL for messages (no credentials, no path), or "(not a URL)". */
export function hostOf(value) {
  try {
    return new URL(value).hostname || "(no host)";
  } catch {
    return "(not a URL)";
  }
}

export function assertLocal(name, value) {
  if (!isLocalUrl(value)) {
    throw new LocalOnlyError(
      `${name} is not a local address — this script only works with the local Supabase stack.`,
    );
  }
}

/** The Supabase CLI: SUPABASE_BIN (tests), else the project's pinned CLI, else PATH. */
export function supabaseBin(cwd = process.cwd()) {
  if (process.env.SUPABASE_BIN) return process.env.SUPABASE_BIN;
  const local = path.join(cwd, "node_modules", ".bin", "supabase");
  return existsSync(local) ? local : "supabase";
}

/** Run the Supabase CLI, streaming its output; returns the exit code. */
export function runSupabase(args, { cwd = process.cwd() } = {}) {
  const res = spawnSync(supabaseBin(cwd), args, { cwd, stdio: "inherit" });
  if (res.error) throw new LocalOnlyError(`could not run the Supabase CLI (${res.error.code})`);
  return res.status ?? 1;
}

export function parseEnvOutput(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
  return out;
}

/**
 * `supabase status -o env` of the RUNNING local stack. Refuses (beginner-friendly message)
 * when the stack is not running, keys are missing, or the API/DB URLs are not local.
 */
export function readLocalStatus({ cwd = process.cwd() } = {}) {
  const res = spawnSync(supabaseBin(cwd), ["status", "-o", "env"], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const status = res.status === 0 ? parseEnvOutput(res.stdout ?? "") : {};
  const missing = ["API_URL", "DB_URL", "ANON_KEY", "SERVICE_ROLE_KEY"].filter((k) => !status[k]);
  if (res.status !== 0 || missing.length > 0) {
    throw new LocalOnlyError(
      "The local Supabase stack is not running (or `supabase status` is incomplete). " +
        "Start Docker Desktop, then run: npm run local:start",
    );
  }
  assertLocal("API_URL (from supabase status)", status.API_URL);
  assertLocal("DB_URL (from supabase status)", status.DB_URL);
  return status;
}

/** Print a LocalOnlyError (or any error) for a CLI and exit 1. */
export function exitWith(prefix, error) {
  const msg = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${prefix}: ${msg}\n`);
  process.exit(1);
}
