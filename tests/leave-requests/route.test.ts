import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LEAVE_TYPE_IDS, USER_IDS } from "@/lib/data/mock/fixtures";
import { mockDb } from "@/lib/data/mock/store";

/**
 * TASK-011 — POST /api/leave-requests: HTTP contract and envelope (ARCH).
 * The session is mocked; with no DATABASE_URL the route uses the in-memory store,
 * which also proves the store selection.
 */
const getSession = vi.fn();
vi.mock("@/lib/auth/session", () => ({ getSession: () => getSession() }));

const { POST } = await import("@/app/api/leave-requests/route");

const ANA_SESSION = {
  userId: USER_IDS.ana,
  role: "employee",
  name: "Ana Reyes",
  email: "ana.reyes@leavetrack.test",
  managerId: USER_IDS.ben,
};

const post = (body: string) =>
  POST(
    new NextRequest("http://localhost/api/leave-requests", {
      method: "POST",
      body,
      headers: { "content-type": "application/json" },
    }),
    undefined,
  );

const validBody = JSON.stringify({
  leaveTypeId: LEAVE_TYPE_IDS.Sick,
  startDate: "2027-03-01",
  endDate: "2027-03-02",
  reason: "Recovering from surgery",
});

beforeEach(() => {
  getSession.mockReset();
  getSession.mockResolvedValue(ANA_SESSION);
});

describe("POST /api/leave-requests", () => {
  it("201 with { success: true, data: { request, warnings } } and persists to the active store", async () => {
    const before = mockDb.leaveRequests.length;
    const res = await post(validBody);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toMatchObject({
      success: true,
      data: { request: { status: "pending", leaveType: "Sick", days: 2 }, warnings: [] },
    });
    expect(mockDb.leaveRequests).toHaveLength(before + 1);
    expect(mockDb.leaveRequests.at(-1)).toMatchObject({
      id: json.data.request.id,
      userId: USER_IDS.ana,
    });
  });

  it("401 UNAUTHENTICATED envelope without a session, and writes nothing", async () => {
    getSession.mockResolvedValue(null);
    const before = mockDb.leaveRequests.length;
    const res = await post(validBody);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      success: false,
      error: { code: "UNAUTHENTICATED", message: "Sign in to continue." },
    });
    expect(mockDb.leaveRequests).toHaveLength(before);
  });

  it("400 VALIDATION_ERROR on a malformed JSON body", async () => {
    const res = await post("{not json");
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("400 VALIDATION_ERROR envelope when end date is before start date (AC2), nothing written", async () => {
    const before = mockDb.leaveRequests.length;
    const res = await post(
      JSON.stringify({ ...JSON.parse(validBody), startDate: "2027-03-10", endDate: "2027-03-01" }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "End date can't be before the start date." },
    });
    expect(mockDb.leaveRequests).toHaveLength(before);
  });

  it("201 with an EXCEEDS_BALANCE warning when over balance (AC3)", async () => {
    const res = await post(
      JSON.stringify({
        leaveTypeId: LEAVE_TYPE_IDS.Vacation,
        startDate: "2027-04-05",
        endDate: "2027-04-09",
        reason: "Trip",
      }),
    );
    expect(res.status).toBe(201);
    expect((await res.json()).data.warnings[0]).toMatchObject({ code: "EXCEEDS_BALANCE" });
  });
});
