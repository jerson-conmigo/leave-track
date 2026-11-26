import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * TASK-018 — the server-action transports map database constraint violations the
 * same way withErrorHandler does (4xx result, no DB internals), and unknown errors
 * stay a generic INTERNAL_ERROR.
 */
const getSession = vi.fn();
const service = { submit: vi.fn(), decide: vi.fn() };
vi.mock("@/lib/auth/session", () => ({ getSession: () => getSession() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/leave-requests", () => ({
  getSubmitDeps: () => ({}),
  getDecideDeps: () => ({}),
  submitLeaveRequest: (...a: unknown[]) => service.submit(...a),
  decideLeaveRequest: (...a: unknown[]) => service.decide(...a),
}));
const { submitLeaveRequestAction } = await import("@/app/(app)/requests/new/actions");
const { decideLeaveRequestAction } = await import("@/app/(app)/approvals/actions");

const pgError = (code: string, constraint: string) =>
  Object.assign(new Error(`violates ${constraint}`), { code, constraint_name: constraint });
const input = { leaveTypeId: "x", startDate: "2027-05-01", endDate: "2027-05-02", reason: "r" };

beforeEach(() => {
  getSession.mockResolvedValue({
    userId: "u",
    role: "manager",
    name: "n",
    email: "e@x.y",
    managerId: null,
  });
});

describe.each([
  ["submitLeaveRequestAction", () => submitLeaveRequestAction(input), service.submit],
  ["decideLeaveRequestAction", () => decideLeaveRequestAction("id", "approve"), service.decide],
])("%s", (_n, call, fn) => {
  it.each([
    ["23514", "leave_type_must_track_balance", "VALIDATION_ERROR"],
    ["23505", "audit_log_one_decision_per_request", "CONFLICT"],
  ])("constraint %s/%s → %s result", async (code, constraint, expected) => {
    fn.mockRejectedValueOnce(pgError(code, constraint));
    const res = await call();
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.code).toBe(expected);
      expect(res.error.message).not.toMatch(/violates|constraint/i);
    }
  });

  it("an unknown database error stays INTERNAL_ERROR", async () => {
    fn.mockRejectedValueOnce(Object.assign(new Error("x"), { code: "42P01" }));
    const res = await call();
    expect(res).toEqual({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
    });
  });
});
