#!/usr/bin/env node
/**
 * npm run local:status — the local Supabase stack at a glance (TASK-054): service URLs and
 * the pgAdmin connection settings. Keys and secrets are HIDDEN (plain `supabase status`
 * prints them; use `npx supabase status` if you ever need one).
 */
import { pathToFileURL } from "node:url";
import { exitWith, readLocalStatus } from "./lib/local-only.mjs";

const HIDDEN = /KEY|SECRET|TOKEN|PASSWORD/;

/** Pure: the lines to print for a `supabase status -o env` map. */
export function statusLines(status) {
  const lines = ["Local Supabase is running:"];
  const show = [
    ["API (Auth, REST)", status.API_URL],
    ["Mailpit (emails)", status.MAILPIT_URL ?? status.INBUCKET_URL],
    ["Studio", status.STUDIO_URL],
  ];
  for (const [label, url] of show) if (url) lines.push(`  ${label.padEnd(18)} ${url}`);

  const db = new URL(status.DB_URL);
  lines.push(
    "",
    "Database (connect pgAdmin with these):",
    `  Host               ${db.hostname}`,
    `  Port               ${db.port || "5432"}`,
    `  Maintenance DB     ${db.pathname.replace(/^\//, "") || "postgres"}`,
    `  Username           ${decodeURIComponent(db.username)}`,
    `  Password           ${decodeURIComponent(db.password)}   (local default)`,
    "  SSL mode           disable",
    "",
    `Hidden: ${Object.keys(status)
      .filter((k) => HIDDEN.test(k))
      .sort()
      .join(", ")}`,
  );
  return lines;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.stdout.write(`${statusLines(readLocalStatus()).join("\n")}\n`);
  } catch (error) {
    exitWith("local:status", error);
  }
}
