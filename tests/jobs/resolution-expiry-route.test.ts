import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isPublicPath } from "@/lib/auth/roles";
import { logger } from "@/lib/logger";

/**
 * TASK-034 AC4 — /api/jobs/resolution-expiry refuses unauthorized calls with 401 BEFORE any
 * database access (the deps are never even built), and fails closed without CRON_SECRET.
 */
const getResolutionDeps = vi.fn(() => ({ store: {} }));
const runResolutionExpiry = vi.fn(async () => ({ expired: 2, convertedDays: 3.5, skipped: 0 }));
vi.mock("@/lib/resolutions", () => ({ getResolutionDeps, runResolutionExpiry }));
const { GET, POST } = await import("@/app/api/jobs/resolution-expiry/route");

const call = (method: "GET" | "POST", authorization?: string) =>
  (method === "GET" ? GET : POST)(
    new NextRequest("http://localhost/api/jobs/resolution-expiry", {
      method,
      headers: authorization === undefined ? {} : { authorization },
    }),
    undefined,
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("CRON_SECRET", "expiry-test-secret");
});
afterEach(() => vi.unstubAllEnvs());

describe("AC4 — auth first, fail closed", () => {
  it.each([
    ["no header", undefined],
    ["wrong token", "Bearer nope"],
    ["the secret without Bearer", "expiry-test-secret"],
    ["a longer token", "Bearer expiry-test-secret-and-more"],
  ])("%s → 401 and no database access", async (_l, header) => {
    for (const method of ["GET", "POST"] as const) {
      const res = await call(method, header);
      expect(res.status).toBe(401);
    }
    expect(getResolutionDeps).not.toHaveBeenCalled();
    expect(runResolutionExpiry).not.toHaveBeenCalled();
  });

  it("CRON_SECRET unset → 401, error logged, job never runs", async () => {
    vi.stubEnv("CRON_SECRET", "");
    const error = vi.spyOn(logger, "error");
    expect((await call("GET", "Bearer ")).status).toBe(401);
    expect(getResolutionDeps).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ event: "resolution-expiry.misconfigured" }),
      expect.any(String),
    );
  });

  it("the right token runs the job (GET for cron, POST for manual) and returns its counts", async () => {
    for (const method of ["GET", "POST"] as const) {
      const res = await call(method, "Bearer expiry-test-secret");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        success: true,
        data: { expired: 2, convertedDays: 3.5, skipped: 0 },
      });
      expect(res.headers.get("cache-control")).toBe("no-store");
    }
    expect(runResolutionExpiry).toHaveBeenCalledTimes(2);
  });

  it("is public in the proxy (cron has no session cookie)", () => {
    expect(isPublicPath("/api/jobs/resolution-expiry")).toBe(true);
  });
});
