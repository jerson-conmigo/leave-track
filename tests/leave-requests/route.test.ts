import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LEAVE_TYPE_IDS, USER_IDS } from "@/lib/data/mock/fixtures";
import { mockDb } from "@/lib/data/mock/store";

/**
 * TASK-011 / TASK-012 — POST and GET /api/leave-requests: HTTP contract and envelope (ARCH).
 * The session is mocked; with no DATABASE_URL the route uses the in-memory store,
 * which also proves the store selection.
 */
const getSession = vi.fn();
vi.mock("@/lib/auth/session", () => ({ getSession: () => getSession() }));

const { GET, POST } = await import("@/app/api/leave-requests/route");

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

const get = (query: string) =>
  GET(new NextRequest(`http://localhost/api/leave-requests${query}`), undefined);

describe("GET /api/leave-requests?scope=mine (TASK-012)", () => {
  it("200 with the session user's balances and own requests", async () => {
    const res = await get("?scope=mine");
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(
      json.data.balances.map((b: { leaveType: { name: string } }) => b.leaveType.name),
    ).toEqual(["Vacation", "Sick", "Unpaid"]);
    // AC1/AC2 shape: confirmed and pending reported separately, dated by the accrual run.
    expect(json.data.balances[0]).toMatchObject({
      confirmed: 11.25,
      asOf: "2026-11-01T02:00:00.000Z",
    });
    expect(json.data.balances[0].pending).toBeGreaterThanOrEqual(11);
    const anasIds = new Set(
      mockDb.leaveRequests.filter((r) => r.userId === USER_IDS.ana).map((r) => r.id),
    );
    expect(json.data.requests.length).toBeGreaterThan(0);
    expect(json.data.requests.every((r: { id: string }) => anasIds.has(r.id))).toBe(true);
  });

  it("ignores a userId in the query — always the session user", async () => {
    const own = await (await get("?scope=mine")).json();
    const spoofed = await (await get(`?scope=mine&userId=${USER_IDS.jordan}`)).json();
    expect(spoofed.data).toEqual(own.data);
  });

  it("401 UNAUTHENTICATED without a session", async () => {
    getSession.mockResolvedValue(null);
    const res = await get("?scope=mine");
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("UNAUTHENTICATED");
  });

  it.each([
    ["missing scope", ""],
    ["unknown scope", "?scope=everyone"],
    ["team (TASK-013)", "?scope=team"],
  ])("400 VALIDATION_ERROR for %s", async (_label, query) => {
    const res = await get(query);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Unsupported scope." },
    });
  });
});
