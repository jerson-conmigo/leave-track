import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isPublicPath } from "@/lib/auth/roles";
import { mockDb } from "@/lib/data/mock/store";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
const { POST } = await import("@/app/api/test/reset/route");

/** TASK-016 — the e2e reset hook must be inert unless every gate is satisfied. */
const call = (token?: string) =>
  POST(
    new NextRequest("http://localhost/api/test/reset", {
      method: "POST",
      headers: token ? { "x-e2e-reset-token": token } : {},
    }),
  );

afterEach(() => vi.unstubAllEnvs());

describe("POST /api/test/reset", () => {
  it("404 when E2E_RESET_TOKEN is not set (production default)", async () => {
    vi.stubEnv("E2E_RESET_TOKEN", "");
    expect((await call("anything")).status).toBe(404);
  });

  it.each([
    ["missing", undefined],
    ["wrong", "nope"],
    ["prefix of the real one", "secret-tok"],
  ])("404 with a %s token header", async (_l, token) => {
    vi.stubEnv("E2E_RESET_TOKEN", "secret-token");
    expect((await call(token)).status).toBe(404);
  });

  it("404 when DATABASE_URL is set — never touches Postgres", async () => {
    vi.stubEnv("E2E_RESET_TOKEN", "secret-token");
    vi.stubEnv("DATABASE_URL", "postgres://u:p@localhost:5432/db");
    expect((await call("secret-token")).status).toBe(404);
  });

  it("200 resets the in-memory data when every gate passes", async () => {
    vi.stubEnv("E2E_RESET_TOKEN", "secret-token");
    vi.stubEnv("DATABASE_URL", "");
    const before = mockDb.leaveRequests.length;
    mockDb.leaveRequests.push({ ...mockDb.leaveRequests[0]!, id: "leak" });
    const res = await call("secret-token");
    expect(res.status).toBe(200);
    expect(mockDb.leaveRequests).toHaveLength(before);
  });
});

describe("public paths", () => {
  it("only the exact reset path is public — not every /api/test/* route", () => {
    expect(isPublicPath("/api/test/reset")).toBe(true);
    expect(isPublicPath("/api/test")).toBe(false);
    expect(isPublicPath("/api/test/other")).toBe(false);
    expect(isPublicPath("/api/testing/reset")).toBe(false);
  });
});
