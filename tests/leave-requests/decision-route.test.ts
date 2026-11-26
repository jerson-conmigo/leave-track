import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LEAVE_TYPE_IDS, USER_IDS } from "@/lib/data/mock/fixtures";
import { mockDb } from "@/lib/data/mock/store";

/**
 * TASK-014 — POST /api/leave-requests/:id/decision: HTTP contract and envelope.
 * Session mocked; no DATABASE_URL → in-memory store (also proves the wiring).
 */
const getSession = vi.fn();
vi.mock("@/lib/auth/session", () => ({ getSession: () => getSession() }));
const { POST } = await import("@/app/api/leave-requests/[id]/decision/route");

const req = (n: number) => `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const session = (userId: string, role: string) => ({
  userId,
  role,
  name: "x",
  email: "x@y.z",
  managerId: null,
});
const BEN = session(USER_IDS.ben, "manager");
const MAYA = session(USER_IDS.maya, "manager");

const post = (id: string, body: unknown) =>
  POST(
    new NextRequest(`http://localhost/api/leave-requests/${id}/decision`, {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
      headers: { "content-type": "application/json" },
    }),
    { params: Promise.resolve({ id }) },
  );

beforeEach(() => {
  getSession.mockReset();
  getSession.mockResolvedValue(BEN);
});

describe("POST /api/leave-requests/:id/decision", () => {
  it("200 approve: envelope with the decided request; persisted to the active store", async () => {
    const res = await post(req(4), { decision: "approve" });
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    const json = await res.json();
    expect(json).toMatchObject({
      success: true,
      data: {
        request: { id: req(4), status: "approved", decidedByName: "Ben Ortiz" },
        warnings: [],
      },
    });
    expect(mockDb.leaveRequests.find((r) => r.id === req(4))?.status).toBe("approved");
    const bal = mockDb.leaveBalances.find(
      (b) => b.userId === USER_IDS.jordan && b.leaveTypeId === LEAVE_TYPE_IDS.Vacation,
    );
    expect(bal?.balance).toBe(1.5);
  });

  it("409 when deciding the same request again", async () => {
    const res = await post(req(4), { decision: "reject", reason: "Too late now" });
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("CONFLICT");
  });

  it("200 reject with reason; ignores ids smuggled in the body", async () => {
    const res = await post(req(1), {
      decision: "reject",
      reason: "Release freeze",
      managerId: USER_IDS.maya,
      userId: USER_IDS.maya,
    });
    expect(res.status).toBe(200);
    const r = mockDb.leaveRequests.find((x) => x.id === req(1));
    expect(r).toMatchObject({
      status: "rejected",
      decidedBy: USER_IDS.ben,
      decisionReason: "Release freeze",
    });
  });

  it("200 with a NEGATIVE_BALANCE warning when an approval overdraws (Maya → Sam)", async () => {
    getSession.mockResolvedValue(MAYA);
    const json = await (await post(req(7), { decision: "approve" })).json();
    expect(json.data.warnings).toEqual([
      expect.objectContaining({ code: "NEGATIVE_BALANCE", balanceAfter: -1.25 }),
    ]);
  });

  it("403 FORBIDDEN for a manager acting on another team's request (AC3), nothing changes", async () => {
    getSession.mockResolvedValue(MAYA);
    const res = await post(req(5), { decision: "approve" });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "You can only decide requests from your direct reports.",
      },
    });
    expect(mockDb.leaveRequests.find((r) => r.id === req(5))?.status).toBe("pending");
  });

  it.each([
    ["an employee", session(USER_IDS.ana, "employee")],
    ["an HR admin", session(USER_IDS.carla, "hr_admin")],
  ])("403 FORBIDDEN for %s", async (_l, s) => {
    getSession.mockResolvedValue(s);
    expect((await post(req(9), { decision: "approve" })).status).toBe(403);
  });

  it("401 without a session", async () => {
    getSession.mockResolvedValue(null);
    expect((await post(req(9), { decision: "approve" })).status).toBe(401);
  });

  it("404 for an unknown request", async () => {
    expect((await post(req(999), { decision: "approve" })).status).toBe(404);
  });

  it.each([
    ["non-uuid id", "abc", { decision: "approve" }],
    ["reject without reason", req(9), { decision: "reject" }],
    ["bad decision", req(9), { decision: "maybe" }],
    ["malformed JSON", req(9), "{nope"],
  ])("400 VALIDATION_ERROR for %s", async (_l, id, body) => {
    getSession.mockResolvedValue(MAYA);
    const res = await post(id, body);
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
  });
});
