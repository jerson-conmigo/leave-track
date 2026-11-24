import { describe, expect, it } from "vitest";
import { LeaveRequestSchema, RejectReasonSchema } from "@/lib/validation/leave-request";

const valid = {
  leaveTypeId: "10000000-0000-4000-8000-000000000001",
  startDate: "2026-12-21",
  endDate: "2026-12-31",
  reason: "Family trip",
};

describe("LeaveRequestSchema (US-01)", () => {
  it("accepts a valid request", () => {
    expect(LeaveRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a single-day request", () => {
    expect(LeaveRequestSchema.safeParse({ ...valid, endDate: valid.startDate }).success).toBe(true);
  });

  it("rejects an end date before the start date on the endDate field (AC2)", () => {
    const result = LeaveRequestSchema.safeParse({ ...valid, endDate: "2026-12-20" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["endDate"]);
  });

  it("requires a leave type, valid dates, and a reason", () => {
    const result = LeaveRequestSchema.safeParse({
      leaveTypeId: "",
      startDate: "",
      endDate: "x",
      reason: " ",
    });
    const fields = result.error?.issues.map((i) => i.path[0]);
    expect(fields).toEqual(
      expect.arrayContaining(["leaveTypeId", "startDate", "endDate", "reason"]),
    );
  });
});

describe("RejectReasonSchema (US-03 AC2)", () => {
  it("requires a non-blank reason", () => {
    expect(RejectReasonSchema.safeParse("   ").success).toBe(false);
    expect(RejectReasonSchema.safeParse("Overlaps release freeze").success).toBe(true);
  });
});
