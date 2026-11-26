import { mockDb } from "@/lib/data/mock/store";
import type { LeaveRequest } from "@/lib/data/types";
import type { DecideStore, SubmitStore } from "@/lib/leave-requests/store";

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

/**
 * DecideStore over the in-memory mock DB — same rules and outcomes as the
 * Postgres store (parity-tested). Everything below runs synchronously after the
 * checks, so the update, decrement and audit row land together or not at all.
 */
export const memoryDecideStore: DecideStore = {
  async decideWithAudit({ requestId, managerId, decision, reason, daysFor }) {
    const request = mockDb.leaveRequests.find((r) => r.id === requestId);
    if (!request || request.isDeleted) return { ok: false, reason: "not_found" };
    const employee = mockDb.users.find((u) => u.id === request.userId);
    if (!employee || employee.managerId !== managerId) return { ok: false, reason: "not_report" };
    if (request.status !== "pending") return { ok: false, reason: "already_decided" };
    // Mirrors the DB backstop (audit_log_one_decision_per_request).
    if (mockDb.auditLog.some((a) => a.leaveRequestId === requestId && a.action !== "submitted")) {
      throw new Error("duplicate decision for request (audit_log_one_decision_per_request)");
    }
    const leaveType = mockDb.leaveTypes.find((t) => t.id === request.leaveTypeId)!;
    const manager = mockDb.users.find((u) => u.id === managerId)!;
    const status = decision === "approve" ? "approved" : "rejected";
    const now = new Date().toISOString();
    const days = daysFor(request.startDate, request.endDate);

    let balanceAfter: number | null = null;
    if (decision === "approve" && leaveType.tracksBalance) {
      let bal = mockDb.leaveBalances.find(
        (b) => b.userId === request.userId && b.leaveTypeId === request.leaveTypeId,
      );
      if (!bal) {
        bal = {
          id: crypto.randomUUID(),
          userId: request.userId,
          leaveTypeId: request.leaveTypeId,
          balance: 0,
          updatedAt: now,
        };
        mockDb.leaveBalances.push(bal);
      }
      bal.balance -= days;
      bal.updatedAt = now;
      balanceAfter = bal.balance;
    }

    Object.assign(request, {
      status,
      decidedBy: managerId,
      decidedAt: now,
      decisionReason: reason ?? null,
    });
    mockDb.auditLog.push({
      id: crypto.randomUUID(),
      leaveRequestId: request.id,
      actorId: managerId,
      action: status,
      occurredAt: now,
    });

    return {
      ok: true,
      request: { ...request },
      leaveType,
      employee: { id: employee.id, name: employee.name, email: employee.email },
      manager: { id: manager.id, name: manager.name },
      days,
      balanceAfter,
    };
  },
};
