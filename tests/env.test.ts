import { describe, expect, it } from "vitest";
import { isDeployedEnv, parseEnv, REQUIRED_WHEN_DEPLOYED } from "@/lib/env";

/**
 * TASK-019 — deployed environments fail closed on missing configuration; local
 * development, tests, CI builds and local e2e (NODE_ENV=production, no deployment
 * variables) keep working with no configuration at all.
 */
const DB = "postgres://user:s3cret-db-pass@db.example.com:6543/postgres";
const CRON = "cron-s3cret-value";
const SESSION = "s".repeat(32) + "-session-s3cret";
const full = { DATABASE_URL: DB, CRON_SECRET: CRON, SESSION_SECRET: SESSION };

describe("not deployed: everything optional (AC4)", () => {
  it.each([
    ["an empty environment (local dev)", {}],
    ["NODE_ENV=test", { NODE_ENV: "test" }],
    ["NODE_ENV=production alone (next build, CI, local e2e)", { NODE_ENV: "production" }],
    ["APP_ENV=development", { APP_ENV: "development" }],
    ["VERCEL_ENV=development (vercel dev)", { VERCEL_ENV: "development" }],
    ["local e2e with a reset token", { NODE_ENV: "production", E2E_RESET_TOKEN: "tok" }],
    ["empty strings are treated as unset", { APP_ENV: "", VERCEL_ENV: "", DATABASE_URL: "" }],
  ])("%s → starts", (_l, raw) => {
    expect(() => parseEnv(raw)).not.toThrow();
  });
});

describe("deployed: required configuration (AC1, AC2)", () => {
  const DEPLOYED: [string, Record<string, string>][] = [
    ["APP_ENV=production", { APP_ENV: "production" }],
    ["APP_ENV=staging", { APP_ENV: "staging" }],
    ["VERCEL_ENV=production", { VERCEL_ENV: "production" }],
    ["VERCEL_ENV=preview", { VERCEL_ENV: "preview" }],
    [
      "APP_ENV=development but VERCEL_ENV=production (strictest wins)",
      { APP_ENV: "development", VERCEL_ENV: "production" },
    ],
  ];

  it.each(DEPLOYED)("%s without DATABASE_URL → refuses, naming the variable", (_l, stage) => {
    expect(() => parseEnv({ ...stage, CRON_SECRET: CRON })).toThrow(
      /deployed environment.*missing DATABASE_URL/,
    );
  });

  it.each(DEPLOYED)("%s without CRON_SECRET → refuses", (_l, stage) => {
    expect(() => parseEnv({ ...stage, DATABASE_URL: DB })).toThrow(/missing CRON_SECRET/);
  });

  it.each(DEPLOYED)("%s without SESSION_SECRET → refuses (TASK-023)", (_l, stage) => {
    expect(() => parseEnv({ ...stage, DATABASE_URL: DB, CRON_SECRET: CRON })).toThrow(
      /missing SESSION_SECRET/,
    );
  });

  // Until TASK-024 adds a real provider, AUTH_PROVIDER can only be "mock" — which a
  // deployed environment refuses (ADR-LeaveTrack-E004). So with every required variable
  // present, the ONLY remaining problem is the mock sign-in.
  it.each(DEPLOYED)(
    "%s with everything required → refuses only the mock sign-in (AC2)",
    (_l, stage) => {
      let message = "";
      try {
        parseEnv({ ...stage, ...full });
      } catch (e) {
        message = (e as Error).message;
      }
      expect(message).toMatch(/mock sign-in \(AUTH_PROVIDER=mock\) is not allowed/);
      expect(message).not.toMatch(/missing/);
    },
  );

  it("refuses an explicit AUTH_PROVIDER=mock when deployed", () => {
    expect(() => parseEnv({ APP_ENV: "production", ...full, AUTH_PROVIDER: "mock" })).toThrow(
      /mock sign-in/,
    );
  });

  it("allows the mock sign-in when not deployed (local, CI, e2e)", () => {
    expect(parseEnv({ NODE_ENV: "production", AUTH_PROVIDER: "mock" }).AUTH_PROVIDER).toBe("mock");
    expect(parseEnv({}).AUTH_PROVIDER).toBe("mock");
  });

  it("rejects a SESSION_SECRET shorter than 32 characters, without echoing it", () => {
    let message = "";
    try {
      parseEnv({ SESSION_SECRET: "short-s3cret" });
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toMatch(/SESSION_SECRET must be at least 32 characters/);
    expect(message).not.toContain("short-s3cret");
  });

  it("lists every missing variable at once", () => {
    expect(() => parseEnv({ APP_ENV: "production" })).toThrow(
      /missing DATABASE_URL, CRON_SECRET, SESSION_SECRET/,
    );
  });

  it("an empty-string DATABASE_URL counts as missing", () => {
    expect(() => parseEnv({ APP_ENV: "production", DATABASE_URL: "", CRON_SECRET: CRON })).toThrow(
      /missing DATABASE_URL/,
    );
  });

  it("E2E_RESET_TOKEN set in a deployed environment → refuses (AC3, AGENTS.md rule)", () => {
    expect(() => parseEnv({ APP_ENV: "production", ...full, E2E_RESET_TOKEN: "tok" })).toThrow(
      /E2E_RESET_TOKEN must not be set/,
    );
  });
});

describe("error messages never leak values", () => {
  it.each([
    ["missing CRON_SECRET", { APP_ENV: "production", DATABASE_URL: DB }],
    ["reset token present", { APP_ENV: "production", ...full, E2E_RESET_TOKEN: "tok-s3cret" }],
    ["malformed DATABASE_URL", { DATABASE_URL: "mysql://user:s3cret-db-pass@host/db" }],
  ])("%s", (_l, raw) => {
    let message = "";
    try {
      parseEnv(raw);
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).not.toBe("");
    for (const secret of ["s3cret-db-pass", CRON, "tok-s3cret"])
      expect(message).not.toContain(secret);
  });
});

describe("structure", () => {
  it("REQUIRED_WHEN_DEPLOYED is exactly this list (TASK-023/024 add auth secrets on purpose)", () => {
    expect([...REQUIRED_WHEN_DEPLOYED]).toEqual(["DATABASE_URL", "CRON_SECRET", "SESSION_SECRET"]);
  });

  it("isDeployedEnv recognises only deployment stages", () => {
    expect(isDeployedEnv({ NODE_ENV: "production" })).toBe(false);
    expect(isDeployedEnv({ APP_ENV: "staging" })).toBe(true);
    expect(isDeployedEnv({ VERCEL_ENV: "preview" })).toBe(true);
    expect(isDeployedEnv({ VERCEL_ENV: "development" })).toBe(false);
  });
});
