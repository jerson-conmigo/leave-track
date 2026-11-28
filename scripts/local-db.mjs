#!/usr/bin/env node
/**
 * Local Supabase stack commands (TASK-054). All of them work on the LOCAL stack only.
 *
 *   npm run local:start       start Postgres, Auth, Mailpit and the API (unused services skipped)
 *   npm run local:stop        stop it — your data is KEPT (never --no-backup)
 *   npm run db:migrate:local  apply new migrations, keep data (non-destructive)
 *   npm run db:reset:local -- --yes   DESTRUCTIVE: rebuild the database, re-seed, recreate sign-ins
 *   npm run db:check:local    row counts of the app tables (the pgAdmin check)
 *
 * Status (with secrets hidden) is scripts/local-status.mjs (npm run local:status).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import postgres from "postgres";
import { exitWith, LocalOnlyError, readLocalStatus, runSupabase } from "./lib/local-only.mjs";

/**
 * Containers `local:start` does not need (Supabase CLI 3.3.0 names; checked against
 * `supabase start --help` by tests/scripts/local-db.test.ts). Kept running: Postgres,
 * gotrue (Auth), kong (API gateway), mailpit, postgrest, postgres-meta. pgAdmin replaces
 * Studio; to get Studio anyway, remove "studio" here.
 */
export const EXCLUDED_SERVICES = [
  "realtime",
  "storage-api",
  "imgproxy",
  "studio",
  "edge-runtime",
  "logflare",
  "vector",
];

/** The app tables, in the order db:check:local prints them. */
export const APP_TABLES = [
  "users",
  "leave_types",
  "leave_policies",
  "leave_balances",
  "leave_requests",
  "audit_log",
  "accrual_runs",
];

const FORBIDDEN = {
  stop: ["--no-backup", "--all"],
  migrate: ["--remote", "--linked", "--db-url"],
  reset: ["--remote", "--linked", "--db-url"],
};

/** Pure: refuse dangerous flags; returns the Supabase CLI arguments to run. */
export function commandArgs(command, args) {
  const bad = (FORBIDDEN[command] ?? []).find((f) =>
    args.some((a) => a === f || a.startsWith(`${f}=`)),
  );
  if (bad) {
    const why = {
      stop: "it would delete or stop more than this project's local stack",
      migrate: "this command only migrates the LOCAL database",
      reset: "this command only resets the LOCAL database",
    }[command];
    throw new LocalOnlyError(`${bad} is not allowed here — ${why}.`);
  }
  switch (command) {
    case "start":
      return ["start", "-x", EXCLUDED_SERVICES.join(",")];
    case "stop":
      return ["stop"];
    case "migrate":
      return ["migration", "up"];
    case "reset":
      if (!args.includes("--yes")) {
        throw new LocalOnlyError(
          "db:reset:local DELETES all local data — every leave request, every change and every " +
            "local sign-in — and rebuilds the database from the migrations and seed. " +
            "To go ahead, run: npm run db:reset:local -- --yes",
        );
      }
      return ["db", "reset"];
    default:
      throw new LocalOnlyError(`unknown command ${command}`);
  }
}

async function check() {
  const status = readLocalStatus();
  const sql = postgres(status.DB_URL, { max: 1, prepare: false, onnotice: () => {} });
  try {
    process.stdout.write("db:check:local: app tables in the local database\n");
    for (const table of APP_TABLES) {
      const [row] = await sql`select count(*)::int as n from ${sql(table)}`;
      process.stdout.write(`  public.${table.padEnd(16)} ${row.n}\n`);
    }
    const [m] = await sql`select count(*)::int as n from supabase_migrations.schema_migrations`;
    process.stdout.write(`  migrations applied      ${m.n}\n`);
    process.stdout.write(
      "\npgAdmin should show the same numbers, e.g. select count(*) from public.users;\n",
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === "check") return check();

  const cliArgs = commandArgs(command, args);
  if (command !== "start") readLocalStatus(); // stop/migrate/reset: the LOCAL stack must be up
  const code = runSupabase(cliArgs);
  if (code !== 0) process.exit(code);

  if (command === "reset") {
    // Fresh database: no auth users, no links — recreate the local sign-ins.
    const seed = path.join(path.dirname(fileURLToPath(import.meta.url)), "dev-auth-seed.mjs");
    const res = spawnSync(process.execPath, [seed], { stdio: "inherit" });
    process.exit(res.status ?? 1);
  }
  if (command === "start") {
    process.stdout.write(
      "\nLocal Supabase is up. Next: npm run local:status (URLs, pgAdmin details),\n" +
        "npm run env:local (first time), then npm run dev.\n",
    );
  }
  if (command === "stop") process.stdout.write("\nStopped. Your local data is kept.\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => exitWith("local", error));
}
