import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { LEAVE_TYPE_IDS, USER_IDS } from "@/lib/data/mock/fixtures";
import { mockDb } from "@/lib/data/mock/store";
import { future } from "../support/dates";

/** TASK-018 AC2 through the real HTTP routes (memory mode): Unpaid is never blocked. */
const getSession = vi.fn();
vi.mock("@/lib/auth/session", () => ({ getSession: () => getSession() }));
const { POST: submit } = await import("@/app/api/leave-requests/route");
const { POST: decide } = await import("@/app/api/leave-requests/[id]/decision/route");

const session = (userId: string, role: string) => ({
  userId,
  role,
  name: "x",
  email: "x@y.z",
  managerId: null,
});
const json = (body: unknown) => ({
  method: "POST",
  body: JSON.stringify(body),
  headers: { "content-type": "application/json" },
});

describe("Unpaid over HTTP", () => {
  it("POST /api/leave-requests: 90 days of Unpaid (the maximum) → 201 with no warnings; approval → 200, no balance change", async () => {
    const balancesBefore = structuredClone(mockDb.leaveBalances);
    getSession.mockResolvedValue(session(USER_IDS.ana, "employee"));
    const res = await submit(
      new NextRequest(
        "http://localhost/api/leave-requests",
        json({
          leaveTypeId: LEAVE_TYPE_IDS.Unpaid,
          startDate: future("2027-05-01"),
          endDate: future("2027-07-29"),
          reason: "Sabbatical",
        }),
      ),
      undefined,
    );
    expect(res.status).toBe(201);
    const { data } = await res.json();
    expect(data.request).toMatchObject({ leaveType: "Unpaid", days: 90, status: "pending" });
    expect(data.warnings).toEqual([]);

    getSession.mockResolvedValue(session(USER_IDS.ben, "manager"));
    const id = data.request.id as string;
    const dec = await decide(
      new NextRequest(
        `http://localhost/api/leave-requests/${id}/decision`,
        json({ decision: "approve" }),
      ),
      { params: Promise.resolve({ id }) },
    );
    expect(dec.status).toBe(200);
    expect((await dec.json()).data.warnings).toEqual([]);
    expect(mockDb.leaveBalances).toEqual(balancesBefore);
  });
});
