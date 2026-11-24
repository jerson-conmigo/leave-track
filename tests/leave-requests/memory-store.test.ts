import { describe, expect, it, vi } from "vitest";
import { LEAVE_TYPE_IDS, USER_IDS } from "@/lib/data/mock/fixtures";
import { mockRepository } from "@/lib/data/mock/repository";
import { mockDb } from "@/lib/data/mock/store";
import { memorySubmitStore } from "@/lib/leave-requests/memory-store";
import { submitLeaveRequest } from "@/lib/leave-requests/submit";

/** Local dev without DATABASE_URL: submissions must show up in mock reads. */
describe("in-memory submit store", () => {
  const notifier = { leaveRequestSubmitted: vi.fn().mockResolvedValue(undefined) };

  it("makes a submitted request visible in My requests, the pending balance, and the manager queue", async () => {
    const { request } = await submitLeaveRequest(
      { userId: USER_IDS.jordan },
      {
        leaveTypeId: LEAVE_TYPE_IDS.Sick,
        startDate: "2027-03-01",
        endDate: "2027-03-03",
        reason: "Flu",
      },
      { store: memorySubmitStore, notifier },
    );

    const mine = await mockRepository.listMyRequests(USER_IDS.jordan);
    expect(mine[0]).toMatchObject({ id: request.id, status: "pending", days: 3 });

    const sick = (await mockRepository.getBalances(USER_IDS.jordan)).find(
      (b) => b.leaveType.name === "Sick",
    );
    expect(sick?.pending).toBe(3);

    const queue = await mockRepository.listTeamRequests(USER_IDS.ben, { status: "pending" });
    expect(queue.map((r) => r.id)).toContain(request.id);

    expect(mockDb.auditLog.at(-1)).toMatchObject({
      leaveRequestId: request.id,
      actorId: USER_IDS.jordan,
      action: "submitted",
    });
  });
});
