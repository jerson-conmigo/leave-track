import { mockDb } from "@/lib/data/mock/store";
import type { LeaveRequest } from "@/lib/data/types";
import type { SubmitStore } from "@/lib/leave-requests/store";

/**
 * SubmitStore over the in-memory mock DB — used when DATABASE_URL is unset so
 * local dev works end to end. Writes are visible to the mock repository's reads.
 * Per-process and non-durable by design.
 */
export const memorySubmitStore: SubmitStore = {
  async getLeaveType(id) {
    return mockDb.leaveTypes.find((t) => t.id === id) ?? null;
  },

  async getRequester(userId) {
    const user = mockDb.users.find((u) => u.id === userId);
    if (!user) return null;
    const manager = user.managerId ? mockDb.users.find((u) => u.id === user.managerId) : undefined;
    return {
      id: user.id,
      name: user.name,
      manager: manager ? { id: manager.id, name: manager.name, email: manager.email } : null,
    };
  },

  async getBalanceContext(userId, leaveTypeId) {
    const balance = mockDb.leaveBalances.find(
      (b) => b.userId === userId && b.leaveTypeId === leaveTypeId,
    );
    return {
      confirmed: balance?.balance ?? 0,
      pending: mockDb.leaveRequests
        .filter(
          (r) =>
            r.userId === userId &&
            r.leaveTypeId === leaveTypeId &&
            r.status === "pending" &&
            !r.isDeleted,
        )
        .map((r) => ({ startDate: r.startDate, endDate: r.endDate })),
    };
  },

  async insertRequestWithAudit(input) {
    const now = new Date().toISOString();
    const request: LeaveRequest = {
      id: crypto.randomUUID(),
      ...input,
      status: "pending",
      decidedBy: null,
      decidedAt: null,
      decisionReason: null,
      isDeleted: false,
      createdAt: now,
    };
    // Single synchronous section — both rows land together or not at all.
    mockDb.leaveRequests.push(request);
    mockDb.auditLog.push({
      id: crypto.randomUUID(),
      leaveRequestId: request.id,
      actorId: input.userId,
      action: "submitted",
      occurredAt: now,
    });
    return request;
  },
};
