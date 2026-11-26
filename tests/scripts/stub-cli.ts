import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * TASK-054 test helper: a fake Supabase CLI. Scripts find it through SUPABASE_BIN, so the
 * real local stack is never touched. It records every call and answers `status -o env`
 * with the configured text (or fails, like a stopped stack).
 */
export const root = path.resolve(import.meta.dirname, "../..");

export const LOCAL_STATUS = {
  API_URL: "http://127.0.0.1:54321",
  DB_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  ANON_KEY: "anon-key-VALUE-must-not-print",
  SERVICE_ROLE_KEY: "service-role-VALUE-must-not-print",
  JWT_SECRET: "jwt-secret-VALUE-must-not-print",
  MAILPIT_URL: "http://127.0.0.1:54324",
};

export function makeStub() {
  const dir = mkdtempSync(path.join(tmpdir(), "supabase-stub-"));
  const bin = path.join(dir, "supabase");
  const log = path.join(dir, "calls.log");
  const statusFile = path.join(dir, "status.env");
  writeFileSync(
    bin,
    `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify(args) + "\\n");
if (args[0] === "status") {
  if (!fs.existsSync(${JSON.stringify(statusFile)})) process.exit(1);
  process.stdout.write(fs.readFileSync(${JSON.stringify(statusFile)}, "utf8"));
}
process.exit(0);
`,
  );
  chmodSync(bin, 0o755);
  return {
    dir,
    bin,
    setStatus(status: Record<string, string> | null) {
      if (status === null) rmSync(statusFile, { force: true });
      else
        writeFileSync(
          statusFile,
          Object.entries(status)
            .map(([k, v]) => `${k}="${v}"`)
            .join("\n") + "\n",
        );
    },
    calls(): string[][] {
      return existsSync(log)
        ? readFileSync(log, "utf8")
            .trim()
            .split("\n")
            .filter(Boolean)
            .map((l) => JSON.parse(l) as string[])
        : [];
    },
    run(script: string, args: string[] = [], opts: { cwd?: string } = {}) {
      return spawnSync(process.execPath, [path.join(root, script), ...args], {
        cwd: opts.cwd ?? root,
        encoding: "utf8",
        env: { ...process.env, SUPABASE_BIN: bin },
      });
    },
    cleanup() {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
