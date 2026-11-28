import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { isLocalUrl as envIsLocalUrl, LOCAL_HOSTS as ENV_LOCAL_HOSTS } from "@/lib/env";
// @ts-expect-error — plain ESM scripts without type declarations
import { LOCAL_DEV_PASSWORD, planSeed } from "../../scripts/dev-auth-seed.mjs";
// @ts-expect-error — plain ESM scripts without type declarations
import { pushArgs } from "../../scripts/hosted-db-push.mjs";
// @ts-expect-error — plain ESM scripts without type declarations
import { isLocalUrl, LOCAL_HOSTS } from "../../scripts/lib/local-only.mjs";
// @ts-expect-error — plain ESM scripts without type declarations
import { commandArgs, EXCLUDED_SERVICES } from "../../scripts/local-db.mjs";
// @ts-expect-error — plain ESM scripts without type declarations
import { statusLines } from "../../scripts/local-status.mjs";
import { LOCAL_STATUS, makeStub, root } from "./stub-cli";

/** TASK-054 — local development scripts: local-only, data-preserving, explicit when hosted. */
const stub = makeStub();
afterAll(() => stub.cleanup());
beforeEach(() => stub.setStatus(LOCAL_STATUS));

describe("local-only guard", () => {
  it.each([
    ["http://127.0.0.1:54321", true],
    ["postgresql://postgres:postgres@127.0.0.1:54322/postgres", true],
    ["http://localhost:3000", true],
    ["postgresql://u:p@[::1]:54322/postgres", true],
    ["https://abc.supabase.co", false],
    ["postgresql://u:p@db.abc.supabase.co:6543/postgres", false],
    ["http://127.0.0.1.nip.io:54321", false],
    ["http://192.168.1.10:54321", false],
    ["not a url", false],
    ["", false],
    [undefined, false],
  ])("isLocalUrl(%s) → %s, identically in lib/env.ts", (url, expected) => {
    expect(isLocalUrl(url)).toBe(expected);
    expect(envIsLocalUrl(url)).toBe(expected);
  });

  it("the script guard and lib/env.ts use the same loopback host list", () => {
    expect(LOCAL_HOSTS).toEqual(ENV_LOCAL_HOSTS);
  });
});

describe("db:seed:auth planner (pure) — local-only exception to invite-only (C1)", () => {
  const u = (id: string, email: string, auth_user_id: string | null = null) => ({
    id,
    email,
    role: "employee",
    auth_user_id,
  });

  it("creates for unlinked rows, leaves linked rows, links an existing UNLINKED auth user", () => {
    const plan = planSeed(
      [
        u("1", "a@leavetrack.test"),
        u("2", "b@leavetrack.test", "auth-b"),
        u("3", "c@leavetrack.test"),
      ],
      [
        { id: "auth-b", email: "b@leavetrack.test" },
        { id: "auth-c", email: "C@LeaveTrack.test" },
      ],
    );
    expect(plan.map((p: { action: string }) => p.action)).toEqual([
      "create",
      "linked",
      "link-existing",
    ]);
    expect(plan[2].authUserId).toBe("auth-c");
  });

  it("never relinks: an auth user already linked to another row is skipped", () => {
    const plan = planSeed(
      [u("1", "a@leavetrack.test", "auth-x"), u("2", "x@leavetrack.test")],
      [{ id: "auth-x", email: "x@leavetrack.test" }],
    );
    expect(plan[1]).toMatchObject({ action: "skip" });
  });

  it("never seeds the real-Supabase e2e identities", () => {
    expect(planSeed([u("1", "t-1@e2e-auth.leavetrack.test")], [])[0].action).toBe("skip");
  });

  it("the documented local password meets the 12-character minimum", () => {
    expect(LOCAL_DEV_PASSWORD.length).toBeGreaterThanOrEqual(12);
    const toml = readFileSync(path.join(root, "supabase/config.toml"), "utf8");
    expect(Number(toml.match(/^minimum_password_length = (\d+)$/m)?.[1])).toBeLessThanOrEqual(
      LOCAL_DEV_PASSWORD.length,
    );
  });

  it("refuses when the local stack is not running (credentials come only from supabase status)", () => {
    stub.setStatus(null);
    const res = stub.run("scripts/dev-auth-seed.mjs");
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/not running/);
  });

  it("refuses a non-local stack", () => {
    stub.setStatus({ ...LOCAL_STATUS, API_URL: "https://abc.supabase.co" });
    expect(stub.run("scripts/dev-auth-seed.mjs").stderr).toMatch(/not a local address/);
  });
});

describe("local:start / local:stop / migrate / reset (local-db.mjs)", () => {
  it("start excludes only services the app does not need", () => {
    expect(commandArgs("start", [])).toEqual(["start", "-x", EXCLUDED_SERVICES.join(",")]);
    for (const needed of ["gotrue", "kong", "mailpit", "postgrest", "postgres-meta"]) {
      expect(EXCLUDED_SERVICES).not.toContain(needed);
    }
  });

  it("every excluded name is a container the pinned CLI (3.3.0) accepts for -x", () => {
    const help = spawnSync(path.join(root, "node_modules/.bin/supabase"), ["start", "--help"], {
      encoding: "utf8",
    });
    const names = help.stdout
      .match(/Names of containers to not start\. \[([^\]]+)\]/)?.[1]
      ?.split(",");
    expect(names, help.stdout.slice(0, 300)).toBeDefined();
    for (const s of EXCLUDED_SERVICES) expect(names).toContain(s);
  });

  it.each([["--no-backup"], ["--all"]])(
    "stop refuses %s (it would delete data / stop other stacks)",
    (flag) => {
      expect(() => commandArgs("stop", [flag])).toThrow(/not allowed here/);
      const before = stub.calls().length;
      const res = stub.run("scripts/local-db.mjs", ["stop", flag]);
      expect(res.status).toBe(1);
      expect(stub.calls().length).toBe(before); // the CLI was never called
    },
  );

  it("stop runs a plain `supabase stop` (data kept) after confirming the LOCAL stack", () => {
    const res = stub.run("scripts/local-db.mjs", ["stop"]);
    expect(res.status, res.stderr).toBe(0);
    expect(stub.calls().slice(-2)).toEqual([["status", "-o", "env"], ["stop"]]);
    expect(res.stdout).toMatch(/data is kept/);
  });

  it.each([["--remote"], ["--remote=abcd"], ["--linked"], ["--db-url"]])(
    "migrate and reset refuse %s (local only)",
    (flag) => {
      expect(() => commandArgs("migrate", [flag])).toThrow(/only migrates the LOCAL database/);
      expect(() => commandArgs("reset", [flag, "--yes"])).toThrow(/only resets the LOCAL database/);
    },
  );

  it("migrate = `supabase migration up` (non-destructive, local by default in CLI 3.3.0)", () => {
    expect(commandArgs("migrate", [])).toEqual(["migration", "up"]);
  });

  it("reset is destructive: refused without --yes, explaining what it deletes", () => {
    expect(() => commandArgs("reset", [])).toThrow(/DELETES all local data.*--yes/);
    const before = stub.calls().length;
    expect(stub.run("scripts/local-db.mjs", ["reset"]).status).toBe(1);
    expect(stub.calls().length).toBe(before);
    expect(commandArgs("reset", ["--yes"])).toEqual(["db", "reset"]);
  });

  it("stop/migrate refuse when the stack is not running", () => {
    stub.setStatus(null);
    expect(stub.run("scripts/local-db.mjs", ["migrate"]).stderr).toMatch(/not running/);
  });
});

describe("local:status hides secrets and shows the pgAdmin settings", () => {
  it("prints URLs and connection settings, never key or secret values", () => {
    const text = statusLines(LOCAL_STATUS).join("\n");
    expect(text).toMatch(/Host\s+127\.0\.0\.1/);
    expect(text).toMatch(/Port\s+54322/);
    expect(text).toMatch(/Maintenance DB\s+postgres/);
    expect(text).toMatch(/Username\s+postgres/);
    expect(text).toMatch(/SSL mode\s+disable/);
    expect(text).toMatch(/Hidden: ANON_KEY, JWT_SECRET, SERVICE_ROLE_KEY/);
    for (const v of [
      LOCAL_STATUS.ANON_KEY,
      LOCAL_STATUS.SERVICE_ROLE_KEY,
      LOCAL_STATUS.JWT_SECRET,
    ]) {
      expect(text).not.toContain(v);
    }
  });
});

describe("db:push:hosted — explicit, always --remote (C3)", () => {
  let cwd: string;
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), "push-"));
  });
  afterEach(() => rmSync(cwd, { recursive: true, force: true }));

  it("refuses without --hosted, and without a linked project", () => {
    expect(() => pushArgs([], "ref")).toThrow(/HOSTED project.*-- --hosted/);
    expect(() => pushArgs(["--hosted"], null)).toThrow(/no hosted project is linked/);
  });

  it("always targets --remote exactly once; other options pass through", () => {
    expect(pushArgs(["--hosted"], "ref")).toEqual(["db", "push", "--remote"]);
    expect(pushArgs(["--hosted", "--dry-run", "--remote=other"], "ref")).toEqual([
      "db",
      "push",
      "--remote",
      "--dry-run",
    ]);
  });

  it("CLI: no --hosted → refused, the Supabase CLI is never called", () => {
    const before = stub.calls().length;
    const res = stub.run("scripts/hosted-db-push.mjs", [], { cwd });
    expect(res.status).toBe(1);
    expect(stub.calls().length).toBe(before);
  });

  it("CLI: --hosted with a linked project → `db push --remote`, printing the project ref", () => {
    mkdirSync(path.join(cwd, "supabase", ".temp"), { recursive: true });
    writeFileSync(path.join(cwd, "supabase", ".temp", "project-ref"), "abcdefghij\n");
    const res = stub.run("scripts/hosted-db-push.mjs", ["--hosted", "--dry-run"], { cwd });
    expect(res.status, res.stderr).toBe(0);
    expect(res.stdout).toMatch(/hosted project abcdefghij/);
    expect(stub.calls().at(-1)).toEqual(["db", "push", "--remote", "--dry-run"]);
  });
});

describe("structure", () => {
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as {
    scripts: Record<string, string>;
  };
  const scriptsDir = path.join(root, "scripts");
  const src = (f: string) => readFileSync(path.join(scriptsDir, f), "utf8");

  it("the local commands exist and point at the guarded scripts", () => {
    expect(pkg.scripts).toMatchObject({
      "local:start": "node scripts/local-db.mjs start",
      "local:stop": "node scripts/local-db.mjs stop",
      "local:status": "node scripts/local-status.mjs",
      "env:local": "node scripts/local-env.mjs",
      "db:migrate:local": "node scripts/local-db.mjs migrate",
      "db:reset:local": "node scripts/local-db.mjs reset",
      "db:reset": "node scripts/local-db.mjs reset",
      "db:seed:auth": "node scripts/dev-auth-seed.mjs",
      "db:check:local": "node scripts/local-db.mjs check",
      "db:push:hosted": "node scripts/hosted-db-push.mjs",
    });
    expect(pkg.scripts["db:push"]).toBeUndefined();
  });

  it("no npm script runs `supabase db push` or `db reset` directly (no unguarded target)", () => {
    for (const [name, cmd] of Object.entries(pkg.scripts)) {
      expect(cmd, name).not.toMatch(/supabase\s+db\s+(push|reset)/);
    }
  });

  it("user:invite loads .env.local (the TASK-024 README flow now works)", () => {
    expect(pkg.scripts["user:invite"]).toBe(
      "node --env-file-if-exists=.env.local scripts/invite-user.mjs",
    );
  });

  it("every local dev script uses the local-only guard and has no remote mode", () => {
    for (const f of ["local-env.mjs", "dev-auth-seed.mjs", "local-db.mjs", "local-status.mjs"]) {
      expect(src(f), f).toMatch(/from "\.\/lib\/local-only\.mjs"/);
      expect(src(f), f).toMatch(/readLocalStatus\(/);
      expect(src(f), f).not.toMatch(
        /process\.env\.(DATABASE_URL|NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)/,
      );
    }
  });

  it("no script ever passes --no-backup, and the seed never deletes", () => {
    for (const f of readdirSync(scriptsDir).filter((x) => x.endsWith(".mjs"))) {
      const code = src(f)
        .split("\n")
        .filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l))
        .join("\n")
        // local-db.mjs lists it in FORBIDDEN — the refusal list is the one allowed mention.
        .replace(/const FORBIDDEN = \{[\s\S]*?\n\};/, "");
      expect(code, f).not.toMatch(/--no-backup/);
    }
    expect(src("dev-auth-seed.mjs")).not.toMatch(/deleteUser|delete from/i);
    expect(src("dev-auth-seed.mjs")).toMatch(
      /where id = \$\{step\.user\.id\} and auth_user_id is null/,
    );
  });
});
