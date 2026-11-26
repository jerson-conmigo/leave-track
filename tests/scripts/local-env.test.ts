import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
// @ts-expect-error — plain ESM script without type declarations
import { planEnvFile } from "../../scripts/local-env.mjs";
import { LOCAL_STATUS, makeStub } from "./stub-cli";

/**
 * TASK-054 AC2 — npm run env:local fills .env.local from the running LOCAL stack, keeps
 * everything else, never overwrites hosted values silently, and never prints secrets.
 * Runs the real CLI against a stub `supabase` and a temp file — never the real .env.local.
 */
const stub = makeStub();
afterAll(() => stub.cleanup());
let dir: string;
let file: string;
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "env-local-"));
  file = path.join(dir, ".env.local");
  stub.setStatus(LOCAL_STATUS);
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const run = (...args: string[]) => stub.run("scripts/local-env.mjs", ["--target", file, ...args]);
const read = () => readFileSync(file, "utf8");
const value = (text: string, key: string) => text.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1];
const SECRET_VALUES = [
  LOCAL_STATUS.ANON_KEY,
  LOCAL_STATUS.SERVICE_ROLE_KEY,
  LOCAL_STATUS.JWT_SECRET,
  "postgres:postgres",
];
const noSecretsIn = (out: string, extra: string[] = []) => {
  for (const s of [...SECRET_VALUES, ...extra]) expect(out).not.toContain(s);
};

describe("refusals (nothing is written)", () => {
  it("the local stack is not running → a beginner-friendly message", () => {
    stub.setStatus(null);
    writeFileSync(file, "KEEP=1\n");
    const res = run();
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/not running.*Docker Desktop.*npm run local:start/);
    expect(read()).toBe("KEEP=1\n");
  });

  it.each([
    ["API_URL", { API_URL: "https://abc.supabase.co" }],
    ["DB_URL", { DB_URL: "postgresql://u:p@db.abc.supabase.co:5432/postgres" }],
  ])("supabase status reports a non-local %s → refuses", (name, override) => {
    stub.setStatus({ ...LOCAL_STATUS, ...override });
    const res = run();
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(
      new RegExp(`${name} \\(from supabase status\\) is not a local address`),
    );
  });

  it.each(["NEXT_PUBLIC_SUPABASE_URL", "DATABASE_URL", "DIRECT_URL"])(
    "an existing hosted %s → refuses, names it, file byte-identical",
    (key) => {
      const original = `# my settings\n${key}=https://hosted.example.supabase.co\nOTHER=1\n`;
      writeFileSync(file, original);
      const res = run();
      expect(res.status).toBe(1);
      expect(res.stderr).toMatch(new RegExp(`points ${key} at a NON-local`));
      expect(res.stderr).toMatch(/--replace-remote/);
      expect(res.stderr).not.toContain("hosted.example");
      expect(read()).toBe(original);
    },
  );

  it("an unknown option → refuses", () => {
    expect(run("--force").status).toBe(1);
  });
});

describe("writing .env.local", () => {
  it("a new file: every local value set, secrets generated, mode 0600, nothing secret printed", () => {
    const res = run();
    expect(res.status, res.stderr).toBe(0);
    const text = read();
    expect(value(text, "AUTH_PROVIDER")).toBe("supabase");
    expect(value(text, "NEXT_PUBLIC_SUPABASE_URL")).toBe(LOCAL_STATUS.API_URL);
    expect(value(text, "NEXT_PUBLIC_SUPABASE_ANON_KEY")).toBe(LOCAL_STATUS.ANON_KEY);
    expect(value(text, "SUPABASE_SERVICE_ROLE_KEY")).toBe(LOCAL_STATUS.SERVICE_ROLE_KEY);
    expect(value(text, "DATABASE_URL")).toBe(LOCAL_STATUS.DB_URL);
    expect(value(text, "DIRECT_URL")).toBe(LOCAL_STATUS.DB_URL);
    expect(value(text, "SESSION_SECRET")).toMatch(/^[0-9a-f]{64}$/);
    expect(value(text, "CRON_SECRET")).toMatch(/^[0-9a-f]{64}$/);
    expect(value(text, "SESSION_SECRET")).not.toBe(value(text, "CRON_SECRET"));
    expect(statSync(file).mode & 0o777).toBe(0o600);
    expect(res.stdout).toMatch(/SESSION_SECRET\s+generated/);
    noSecretsIn(res.stdout + res.stderr, [
      value(text, "SESSION_SECRET")!,
      value(text, "CRON_SECRET")!,
    ]);
  });

  it("keeps comments, order, unrelated variables and existing secrets; empty values are filled", () => {
    const secret = "s".repeat(40);
    writeFileSync(
      file,
      [
        "# my local notes",
        "MY_FEATURE_FLAG=on",
        "AUTH_PROVIDER=mock",
        "DATABASE_URL=",
        `SESSION_SECRET=${secret}`,
        "CRON_SECRET=my-cron",
        "",
        "LOG_LEVEL=debug",
        "",
      ].join("\n"),
    );
    const res = run();
    expect(res.status, res.stderr).toBe(0);
    const lines = read().split("\n");
    expect(lines.slice(0, 3)).toEqual([
      "# my local notes",
      "MY_FEATURE_FLAG=on",
      "AUTH_PROVIDER=supabase",
    ]);
    expect(lines[3]).toBe(`DATABASE_URL=${LOCAL_STATUS.DB_URL}`); // filled in place
    expect(lines[4]).toBe(`SESSION_SECRET=${secret}`);
    expect(lines[5]).toBe("CRON_SECRET=my-cron");
    expect(lines).toContain("LOG_LEVEL=debug");
    expect(res.stdout).toMatch(/SESSION_SECRET\s+kept/);
    expect(res.stdout).toMatch(/CRON_SECRET\s+kept/);
    noSecretsIn(res.stdout, [secret, "my-cron"]);
  });

  it("running it again changes nothing (byte-identical)", () => {
    expect(run().status).toBe(0);
    const first = read();
    const res = run();
    expect(res.status).toBe(0);
    expect(read()).toBe(first);
    expect(res.stdout).toMatch(/DATABASE_URL\s+unchanged/);
  });

  it("--replace-remote: backs up the file first, then switches it to local", () => {
    const original = "DATABASE_URL=postgresql://u:p@db.abc.supabase.co:6543/postgres\nOTHER=1\n";
    writeFileSync(file, original);
    const res = run("--replace-remote");
    expect(res.status, res.stderr).toBe(0);
    const backups = readdirSync(dir).filter((f) => /^\.env\.\d{8}T\d{6}\.backup\.local$/.test(f));
    expect(backups).toHaveLength(1);
    expect(readFileSync(path.join(dir, backups[0]!), "utf8")).toBe(original);
    expect(value(read(), "DATABASE_URL")).toBe(LOCAL_STATUS.DB_URL);
    expect(value(read(), "OTHER")).toBe("1");
  });
});

describe("planEnvFile (pure)", () => {
  it("keeps CRLF line endings", () => {
    const plan = planEnvFile("A=1\r\nB=2\r\n", LOCAL_STATUS, { makeSecret: () => "x".repeat(64) });
    expect(plan.text.startsWith("A=1\r\nB=2\r\n")).toBe(true);
    expect(plan.text).not.toMatch(/[^\r]\n/);
  });

  it("the backup name is git-ignored (never committed)", () => {
    const res = spawnSync("git", ["check-ignore", "-q", ".env.20261126T120000.backup.local"], {
      cwd: path.resolve(import.meta.dirname, "../.."),
    });
    expect(res.status).toBe(0);
  });
});
