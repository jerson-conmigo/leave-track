import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

/**
 * TASK-019 — register() (instrumentation.ts) validates the environment once at
 * server start, so a misconfigured deployment never serves a request.
 */
let exit: MockInstance;
let stderr: MockInstance;
beforeEach(() => {
  exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
  stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.restoreAllMocks();
});
const stderrText = () => stderr.mock.calls.map((c) => String(c[0])).join("");

const register = async () => (await import("@/instrumentation")).register();

describe("instrumentation register()", () => {
  it("exits(1) on the Node runtime when a deployed environment lacks DATABASE_URL", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("CRON_SECRET", "x");
    await register();
    expect(exit).toHaveBeenCalledWith(1);
    expect(stderrText()).toMatch(/refusing to start: .*missing DATABASE_URL/);
  });

  it("exits(1) when a deployed environment has E2E_RESET_TOKEN set", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgres://u:p@h:6543/db");
    vi.stubEnv("CRON_SECRET", "x");
    vi.stubEnv("E2E_RESET_TOKEN", "tok");
    await register();
    expect(exit).toHaveBeenCalledWith(1);
    expect(stderrText()).toMatch(/E2E_RESET_TOKEN must not be set/);
    expect(stderrText()).not.toContain("tok\n"); // names only
  });

  it("exits(1) for a deployed environment with all variables but the mock sign-in (TASK-023)", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgres://u:p@h:6543/db");
    vi.stubEnv("CRON_SECRET", "x");
    vi.stubEnv("SESSION_SECRET", "s".repeat(40));
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-public-key");
    await register();
    expect(exit).toHaveBeenCalledWith(1);
    expect(stderrText()).toMatch(/mock sign-in/);
    expect(stderrText()).not.toMatch(/missing/);
  });

  it("resolves for a deployed environment fully configured with Supabase Auth (TASK-024)", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgres://u:p@h:6543/db");
    vi.stubEnv("CRON_SECRET", "x");
    vi.stubEnv("SESSION_SECRET", "s".repeat(40));
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-public-key");
    vi.stubEnv("AUTH_PROVIDER", "supabase");
    await expect(register()).resolves.toBeUndefined();
    expect(exit).not.toHaveBeenCalled();
  });

  it("resolves for local development with no configuration", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    await expect(register()).resolves.toBeUndefined();
    expect(exit).not.toHaveBeenCalled();
  });

  it("does nothing on the edge runtime", async () => {
    vi.stubEnv("NEXT_RUNTIME", "edge");
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("DATABASE_URL", "");
    await expect(register()).resolves.toBeUndefined();
    expect(exit).not.toHaveBeenCalled();
  });
});
