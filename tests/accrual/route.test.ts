import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/api/errors";
import { isPublicPath } from "@/lib/auth/roles";
import { logger } from "@/lib/logger";

/**
 * TASK-017 — /api/jobs/accrual: Bearer auth BEFORE any data access (service spy),
 * trigger derived from the HTTP method (User-Agent ignored), envelope and codes.
 */
const runMonthlyAccrual = vi.fn();
vi.mock("@/lib/accrual", () => ({
  getAccrualDeps: () => ({ store: {} }),
  runMonthlyAccrual: (...a: unknown[]) => runMonthlyAccrual(...a),
}));
const { GET, POST } = await import("@/app/api/jobs/accrual/route");

const SECRET = "s3cret-value-for-tests";
const call = (method: "GET" | "POST", headers: Record<string, string> = {}) =>
  (method === "GET" ? GET : POST)(
    new NextRequest("http://localhost/api/jobs/accrual", { method, headers }),
    undefined,
  );
const OK = { accrued: [], upToDate: true, catchUp: false };

beforeEach(() => {
  vi.stubEnv("CRON_SECRET", SECRET);
  runMonthlyAccrual.mockReset();
  runMonthlyAccrual.mockResolvedValue(OK);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("/api/jobs/accrual", () => {
  it("GET (Vercel Cron) with the right Bearer → 200, trigger 'cron'", async () => {
    const res = await call("GET", { authorization: `Bearer ${SECRET}` });
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ success: true, data: OK });
    expect(runMonthlyAccrual).toHaveBeenCalledWith(expect.anything(), { trigger: "cron" });
  });

  it("POST (manual) → trigger 'manual', even with a vercel-cron User-Agent (UA is ignored)", async () => {
    await call("POST", { authorization: `Bearer ${SECRET}`, "user-agent": "vercel-cron/1.0" });
    expect(runMonthlyAccrual).toHaveBeenCalledWith(expect.anything(), { trigger: "manual" });
  });

  it.each([
    ["missing header", {}],
    ["wrong secret", { authorization: "Bearer nope" }],
    ["prefix of the secret", { authorization: `Bearer ${SECRET.slice(0, -1)}` }],
    ["secret with extra char", { authorization: `Bearer ${SECRET}x` }],
    ["wrong scheme", { authorization: `Basic ${SECRET}` }],
    ["bare secret", { authorization: SECRET }],
  ])("401 for %s — the job never runs", async (_l, headers) => {
    for (const m of ["GET", "POST"] as const) {
      const res = await call(m, headers);
      expect(res.status).toBe(401);
      expect((await res.json()).error.code).toBe("UNAUTHENTICATED");
    }
    expect(runMonthlyAccrual).not.toHaveBeenCalled();
  });

  it("fails CLOSED when CRON_SECRET is not configured: 401, error logged, job never runs", async () => {
    vi.stubEnv("CRON_SECRET", "");
    const error = vi.spyOn(logger, "error");
    const res = await call("GET", { authorization: "Bearer " });
    expect(res.status).toBe(401);
    expect(runMonthlyAccrual).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ event: "accrual.misconfigured" }),
      expect.any(String),
    );
  });

  it("409 when the job refuses a too-large gap", async () => {
    runMonthlyAccrual.mockRejectedValue(
      new AppError("CONFLICT", "Accrual is 14 months behind (max 12)."),
    );
    const res = await call("GET", { authorization: `Bearer ${SECRET}` });
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("CONFLICT");
  });

  it("is public in the proxy only at its exact path (cron has no session cookie)", () => {
    expect(isPublicPath("/api/jobs/accrual")).toBe(true);
    expect(isPublicPath("/api/jobs")).toBe(false);
    expect(isPublicPath("/api/jobs/other")).toBe(false);
  });
});
