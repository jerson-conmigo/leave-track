import { afterEach, describe, expect, it, vi } from "vitest";
import { logNotifier } from "@/lib/leave-requests/notifier";
import { logger } from "@/lib/logger";

const notice = {
  requestId: "20000000-0000-4000-8000-000000000099",
  employee: { id: "e1", name: "Ana Reyes" },
  leaveType: "Sick" as const,
  startDate: "2027-03-01",
  endDate: "2027-03-02",
  days: 2,
};

afterEach(() => vi.restoreAllMocks());

describe("logNotifier (interim channel, backlog B6)", () => {
  it("emits a structured info event naming the manager", async () => {
    const info = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    await logNotifier.leaveRequestSubmitted({
      ...notice,
      manager: { id: "m1", name: "Ben Ortiz", email: "ben.ortiz@leavetrack.test" },
    });
    expect(info).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "leave_request.submitted",
        managerId: "m1",
        requestId: notice.requestId,
      }),
      expect.any(String),
    );
  });

  it("warns when the employee has no manager (nobody to notify, backlog B2)", async () => {
    const warn = vi.spyOn(logger, "warn").mockImplementation(() => undefined);
    await logNotifier.leaveRequestSubmitted({ ...notice, manager: null });
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ event: "leave_request.submitted", managerId: null }),
      expect.stringMatching(/no manager/),
    );
  });
});
