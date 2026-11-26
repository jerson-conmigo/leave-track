import { describe, expect, it } from "vitest";
import { isDeployedEnv, parseEnv, REQUIRED_WHEN_DEPLOYED } from "@/lib/env";

/**
 * TASK-019 — deployed environments fail closed on missing configuration; local
 * development, tests, CI builds and local e2e (NODE_ENV=production, no deployment
 * variables) keep working with no configuration at all.
 */
const DB = "postgres://user:s3cret-db-pass@db.example.com:6543/postgres";
const CRON = "cron-s3cret-value";
const full = { DATABASE_URL: DB, CRON_SECRET: CRON };

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

  it.each(DEPLOYED)("%s with everything required → starts", (_l, stage) => {
    expect(parseEnv({ ...stage, ...full }).DATABASE_URL).toBe(DB);
  });

  it("lists every missing variable at once", () => {
    expect(() => parseEnv({ APP_ENV: "production" })).toThrow(/missing DATABASE_URL, CRON_SECRET/);
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
    expect([...REQUIRED_WHEN_DEPLOYED]).toEqual(["DATABASE_URL", "CRON_SECRET"]);
  });

  it("isDeployedEnv recognises only deployment stages", () => {
    expect(isDeployedEnv({ NODE_ENV: "production" })).toBe(false);
    expect(isDeployedEnv({ APP_ENV: "staging" })).toBe(true);
    expect(isDeployedEnv({ VERCEL_ENV: "preview" })).toBe(true);
    expect(isDeployedEnv({ VERCEL_ENV: "development" })).toBe(false);
  });
});
