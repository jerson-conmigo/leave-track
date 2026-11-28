import { afterEach, describe, expect, it, vi } from "vitest";

/** TASK-023 — which key signs sessions. */
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  delete (globalThis as { __leaveTrackDevSessionSecret?: string }).__leaveTrackDevSessionSecret;
});
const load = async () => (await import("@/lib/auth/session-secret")).getSessionSecret;

describe("getSessionSecret", () => {
  it("uses SESSION_SECRET when set", async () => {
    vi.stubEnv("SESSION_SECRET", "x".repeat(40));
    expect((await load())()).toBe("x".repeat(40));
  });

  it("locally, without SESSION_SECRET, uses one random ≥32-byte key for the whole process", async () => {
    vi.stubEnv("SESSION_SECRET", "");
    const get = await load();
    const first = get();
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(get()).toBe(first);
    vi.resetModules(); // a separate module graph (proxy vs pages) still shares it
    expect((await load())()).toBe(first);
  });

  it.each([
    ["APP_ENV", "production"],
    ["VERCEL_ENV", "preview"],
  ])("throws when deployed (%s=%s) without SESSION_SECRET", async (key, value) => {
    vi.stubEnv("SESSION_SECRET", "");
    const get = await load();
    vi.stubEnv(key, value);
    expect(() => get()).toThrow(/SESSION_SECRET is required/);
  });
});
