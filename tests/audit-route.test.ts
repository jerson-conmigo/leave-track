import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { USER_IDS } from "@/lib/data/mock/fixtures";
import { mockRepository } from "@/lib/data/mock/repository";

/**
 * TASK-015 — GET /api/audit/:userId: HTTP contract, and HR-admin authorization
 * BEFORE any database access (the repository spy must never be called for
 * non-HR callers).
 */
const getSession = vi.fn();
vi.mock("@/lib/auth/session", () => ({ getSession: () => getSession() }));
const getEmployeeAuditHistory = vi.fn(mockRepository.getEmployeeAuditHistory);
vi.mock("@/lib/data/repositories", () => ({
  repository: {
    getEmployeeAuditHistory: (...a: unknown[]) => getEmployeeAuditHistory(...(a as [string])),
  },
}));
const { GET } = await import("@/app/api/audit/[userId]/route");

const session = (userId: string, role: string) => ({
  userId,
  role,
  name: "x",
  email: "x@y.z",
  managerId: null,
});
const HR = session(USER_IDS.carla, "hr_admin");

const get = (userId: string, query = "") =>
  GET(new NextRequest(`http://localhost/api/audit/${userId}${query}`), {
    params: Promise.resolve({ userId }),
  });

beforeEach(() => {
  getSession.mockReset();
  getSession.mockResolvedValue(HR);
  getEmployeeAuditHistory.mockClear();
});

describe("GET /api/audit/:userId", () => {
  it("200 for HR: the employee's requests with decision fields and events", async () => {
    const res = await get(USER_IDS.ana);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    const { success, data } = await res.json();
    expect(success).toBe(true);
    expect(data.employee).toMatchObject({
      id: USER_IDS.ana,
      name: "Ana Reyes",
      managerName: "Ben Ortiz",
    });
    expect(data.requests).toHaveLength(3);
    const decided = data.requests.find((r: { status: string }) => r.status === "approved");
    expect(decided).toMatchObject({ decidedBy: { id: USER_IDS.ben, name: "Ben Ortiz" } });
    expect(decided.decidedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(decided.events.map((e: { action: string }) => e.action)).toEqual([
      "submitted",
      "approved",
    ]);
  });

  it("passes from/to through (UTC dates, inclusive)", async () => {
    const res = await get(USER_IDS.ana, "?from=2026-10-01&to=2026-10-31");
    expect(res.status).toBe(200);
    expect(getEmployeeAuditHistory).toHaveBeenCalledWith(USER_IDS.ana, {
      from: "2026-10-01",
      to: "2026-10-31",
    });
    expect((await res.json()).data.requests.map((r: { reason: string }) => r.reason)).toEqual([
      "Flu",
    ]);
  });

  it("404 for an unknown employee", async () => {
    const res = await get("00000000-0000-4000-8000-000000000999");
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("NOT_FOUND");
  });

  it.each([
    ["non-uuid id", "abc", ""],
    ["bad from", USER_IDS.ana, "?from=2026-13-01"],
    ["from after to", USER_IDS.ana, "?from=2026-11-30&to=2026-11-01"],
  ])("400 VALIDATION_ERROR for %s — and no database access", async (_l, id, q) => {
    const res = await get(id, q);
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
    expect(getEmployeeAuditHistory).not.toHaveBeenCalled();
  });

  it.each([
    ["an employee (even for their own id)", session(USER_IDS.ana, "employee"), USER_IDS.ana],
    ["a manager (even for a direct report)", session(USER_IDS.ben, "manager"), USER_IDS.ana],
  ])("403 FORBIDDEN for %s — the repository is never called", async (_l, s, target) => {
    getSession.mockResolvedValue(s);
    const res = await get(target);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      success: false,
      error: { code: "FORBIDDEN", message: "Only HR admins can view audit history." },
    });
    expect(getEmployeeAuditHistory).not.toHaveBeenCalled();
  });

  it("401 without a session — the repository is never called", async () => {
    getSession.mockResolvedValue(null);
    expect((await get(USER_IDS.ana)).status).toBe(401);
    expect(getEmployeeAuditHistory).not.toHaveBeenCalled();
  });
});
