import { describe, expect, it } from "vitest";
import { auditLog, USER_IDS } from "@/lib/data/mock/fixtures";
import { mockRepository } from "@/lib/data/mock/repository";
import { mockDb, resetMockDb } from "@/lib/data/mock/store";
import { memorySubmitStore } from "@/lib/leave-requests/memory-store";

/** TASK-016 — e2e isolation relies on resetMockDb restoring state for EVERY holder. */
describe("resetMockDb", () => {
  it("restores the seed in place, so the repository and stores see it (no stale references)", async () => {
    const arrayRef = mockDb.leaveRequests;
    const fresh = await mockRepository.listMyRequests(USER_IDS.ana);

    await memorySubmitStore.insertRequestWithAudit({
      userId: USER_IDS.ana,
      leaveTypeId: "10000000-0000-4000-8000-000000000002",
      startDate: "2027-03-01",
      endDate: "2027-03-02",
      reason: "Leak?",
    });
    mockDb.leaveBalances[0]!.balance = -99;
    expect(await mockRepository.listMyRequests(USER_IDS.ana)).toHaveLength(fresh.length + 1);

    resetMockDb();

    expect(mockDb.leaveRequests).toBe(arrayRef); // same array instance (in place)
    expect(await mockRepository.listMyRequests(USER_IDS.ana)).toEqual(fresh);
    expect(mockDb.leaveBalances[0]!.balance).not.toBe(-99);
    expect(mockDb.auditLog).toHaveLength(auditLog.length); // the leaked `submitted` row is gone
  });
});
