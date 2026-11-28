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
const SUPABASE = {
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-public-key",
};
const full = { DATABASE_URL: DB, CRON_SECRET: CRON, SESSION_SECRET: SESSION, ...SUPABASE };

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

  // AUTH_PROVIDER defaults to "mock", which a deployed environment refuses
  // (ADR-LeaveTrack-E004). So with every required variable present, the ONLY remaining
  // problem is the mock sign-in.
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

  it.each(DEPLOYED)(
    "%s with everything required and AUTH_PROVIDER=supabase → starts (TASK-024)",
    (_l, stage) => {
      expect(parseEnv({ ...stage, ...full, AUTH_PROVIDER: "supabase" }).AUTH_PROVIDER).toBe(
        "supabase",
      );
    },
  );

  it.each(DEPLOYED)(
    "%s without the Supabase URL and anon key → refuses (TASK-024)",
    (_l, stage) => {
      expect(() =>
        parseEnv({ ...stage, DATABASE_URL: DB, CRON_SECRET: CRON, SESSION_SECRET: SESSION }),
      ).toThrow(/missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY/);
    },
  );

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
      /missing DATABASE_URL, CRON_SECRET, SESSION_SECRET, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY/,
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

// The local Supabase stack's values (npm run env:local writes these).
const LOCAL = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-key",
  DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
};

describe("AUTH_PROVIDER=supabase needs its project settings in any environment (TASK-024/054)", () => {
  it.each([
    ["nothing", {}, /needs NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL/],
    [
      "no key and no database",
      { NEXT_PUBLIC_SUPABASE_URL: LOCAL.NEXT_PUBLIC_SUPABASE_URL },
      /needs NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL$/,
    ],
    [
      "no database (no silent in-memory store behind real sign-in)",
      {
        NEXT_PUBLIC_SUPABASE_URL: LOCAL.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "k",
      },
      /needs DATABASE_URL$/,
    ],
  ])("locally with %s → refuses", (_l, extra, message) => {
    expect(() => parseEnv({ AUTH_PROVIDER: "supabase", ...extra })).toThrow(message);
  });

  it("locally with the local stack's URL, key and database → starts", () => {
    expect(parseEnv({ AUTH_PROVIDER: "supabase", ...LOCAL }).AUTH_PROVIDER).toBe("supabase");
  });

  it("mock sign-in still needs nothing (zero-config npm run dev, CI, mock e2e)", () => {
    expect(parseEnv({}).AUTH_PROVIDER).toBe("mock");
    expect(parseEnv({ AUTH_PROVIDER: "mock", DATABASE_URL: LOCAL.DATABASE_URL }).DATABASE_URL).toBe(
      LOCAL.DATABASE_URL,
    );
  });

  it("rejects an unknown provider", () => {
    expect(() => parseEnv({ AUTH_PROVIDER: "firebase" })).toThrow(/AUTH_PROVIDER/);
  });
});

describe("local development refuses remote database/Supabase URLs (TASK-054, C2)", () => {
  const REMOTE = {
    DATABASE_URL: "postgresql://user:s3cret-remote@db.abc.supabase.co:6543/postgres",
    DIRECT_URL: "postgresql://user:s3cret-remote@db.abc.supabase.co:5432/postgres",
    NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
  };

  it.each(Object.entries(REMOTE))(
    "%s pointing to a hosted project → refuses, naming it",
    (name, value) => {
      let message = "";
      try {
        parseEnv({ [name]: value });
      } catch (e) {
        message = (e as Error).message;
      }
      expect(message).toMatch(
        new RegExp(`local development — ${name} points? to a non-local host`),
      );
      expect(message).toMatch(/ALLOW_REMOTE_DATABASE=true/);
      expect(message).not.toContain("s3cret-remote");
      expect(message).not.toContain("abc.supabase.co");
    },
  );

  it.each([
    ["127.0.0.1", "postgresql://postgres:postgres@127.0.0.1:54322/postgres"],
    ["localhost", "postgresql://postgres:postgres@localhost:54322/postgres"],
    ["[::1]", "postgresql://postgres:postgres@[::1]:54322/postgres"],
  ])("a local %s database → starts", (_l, url) => {
    expect(parseEnv({ DATABASE_URL: url }).DATABASE_URL).toBe(url);
  });

  it.each([
    ["a lookalike host", "postgresql://u:p@127.0.0.1.nip.io:5432/postgres"],
    ["a private network host", "postgresql://u:p@192.168.1.10:5432/postgres"],
  ])("%s is not local → refuses", (_l, url) => {
    expect(() => parseEnv({ DATABASE_URL: url })).toThrow(
      /DATABASE_URL points? to a non-local host/,
    );
  });

  it("ALLOW_REMOTE_DATABASE=true is an explicit opt-in", () => {
    expect(parseEnv({ ...REMOTE, ALLOW_REMOTE_DATABASE: "true" }).DATABASE_URL).toBe(
      REMOTE.DATABASE_URL,
    );
    expect(() => parseEnv({ ...REMOTE, ALLOW_REMOTE_DATABASE: "false" })).toThrow(/non-local host/);
  });

  it("deployed environments are unaffected (they must use the hosted project)", () => {
    expect(() =>
      parseEnv({ APP_ENV: "production", ...full, AUTH_PROVIDER: "supabase" }),
    ).not.toThrow();
  });
});

describe("DEV_LOGIN_ACCOUNTS (TASK-056): local only", () => {
  it.each([
    ["APP_ENV=production", { APP_ENV: "production" }],
    ["APP_ENV=staging", { APP_ENV: "staging" }],
    ["VERCEL_ENV=production", { VERCEL_ENV: "production" }],
    ["VERCEL_ENV=preview", { VERCEL_ENV: "preview" }],
  ])("%s with DEV_LOGIN_ACCOUNTS=true → refuses, naming it", (_l, stage) => {
    expect(() =>
      parseEnv({ ...stage, ...full, AUTH_PROVIDER: "supabase", DEV_LOGIN_ACCOUNTS: "true" }),
    ).toThrow(/DEV_LOGIN_ACCOUNTS must not be set/);
  });

  it("deployed with DEV_LOGIN_ACCOUNTS=false or unset → fine", () => {
    for (const v of ["false", undefined]) {
      expect(() =>
        parseEnv({
          APP_ENV: "production",
          ...full,
          AUTH_PROVIDER: "supabase",
          DEV_LOGIN_ACCOUNTS: v,
        }),
      ).not.toThrow();
    }
  });

  it("allowed locally, and only true/false are valid", () => {
    expect(parseEnv({ DEV_LOGIN_ACCOUNTS: "true" }).DEV_LOGIN_ACCOUNTS).toBe("true");
    expect(() => parseEnv({ DEV_LOGIN_ACCOUNTS: "yes" })).toThrow(/DEV_LOGIN_ACCOUNTS/);
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
    expect([...REQUIRED_WHEN_DEPLOYED]).toEqual([
      "DATABASE_URL",
      "CRON_SECRET",
      "SESSION_SECRET",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]);
  });

  it("isDeployedEnv recognises only deployment stages", () => {
    expect(isDeployedEnv({ NODE_ENV: "production" })).toBe(false);
    expect(isDeployedEnv({ APP_ENV: "staging" })).toBe(true);
    expect(isDeployedEnv({ VERCEL_ENV: "preview" })).toBe(true);
    expect(isDeployedEnv({ VERCEL_ENV: "development" })).toBe(false);
  });
});
