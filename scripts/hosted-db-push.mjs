#!/usr/bin/env node
/**
 * npm run db:push:hosted -- --hosted — push migrations to the HOSTED Supabase project
 * (TASK-054). Normally CI does this on main; this is the deliberate manual path.
 *
 * - Refuses without --hosted (explicit authorization).
 * - Requires a linked project (`npx supabase link --project-ref …`) and prints its ref.
 * - Always passes --remote: in Supabase CLI 3.3.0 `db push` targets the LOCAL database by
 *   default, so the target is never left to that default.
 * Other options are passed through (e.g. --dry-run, --password).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { exitWith, LocalOnlyError, runSupabase } from "./lib/local-only.mjs";

/** Pure: the CLI arguments, or an error when authorization or the link is missing. */
export function pushArgs(args, linkedRef) {
  if (!args.includes("--hosted")) {
    throw new LocalOnlyError(
      "this pushes migrations to the HOSTED project. Normally CI does it on main. " +
        "To do it yourself on purpose, run: npm run db:push:hosted -- --hosted",
    );
  }
  if (!linkedRef) {
    throw new LocalOnlyError(
      "no hosted project is linked. Link it first: npx supabase link --project-ref <ref>",
    );
  }
  const rest = args.filter(
    (a) => a !== "--hosted" && a !== "--remote" && !a.startsWith("--remote="),
  );
  return ["db", "push", "--remote", ...rest];
}

function linkedProjectRef(cwd = process.cwd()) {
  const file = path.join(cwd, "supabase", ".temp", "project-ref");
  return existsSync(file) ? readFileSync(file, "utf8").trim() || null : null;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const ref = linkedProjectRef();
    const cliArgs = pushArgs(process.argv.slice(2), ref);
    process.stdout.write(`db:push:hosted: pushing migrations to hosted project ${ref}\n`);
    process.exit(runSupabase(cliArgs));
  } catch (error) {
    exitWith("db:push:hosted", error);
  }
}
