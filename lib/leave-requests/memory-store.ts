import { daysBefore, todayUtc } from "@/lib/data/dates";
import { mockDb } from "@/lib/data/mock/store";
import { countDays } from "@/lib/format";
import { MAX_REQUEST_DAYS } from "@/lib/validation/leave-request";
import type { LeaveRequest } from "@/lib/data/types";
import { canDecide, hasApprover } from "@/lib/leave-requests/approver";
import type { DecideStore, SubmitStore } from "@/lib/leave-requests/store";

/** Pending/approved, not deleted, any type, overlapping [start, end] (inclusive) — as SQL `&&`. */
function overlaps(userId: string, startDate: string, endDate: string): boolean {
  return mockDb.leaveRequests.some(
    (r) =>
      r.userId === userId &&
      (r.status === "pending" || r.status === "approved") &&
      !r.isDeleted &&
      r.startDate <= endDate &&
      startDate <= r.endDate,
  );
}

/** An error shaped like a Postgres constraint violation (code + constraint name). */
function dbError(code: string, constraint: string): Error {
  return Object.assign(new Error(`${constraint} violated`), { code, constraint });
}

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
    // TASK-026: the same rule as SQL can_decide / has_approver (approver.ts, parity-tested).
    const manager = user.managerId ? mockDb.users.find((u) => u.id === user.managerId) : undefined;
    const managerDecides = !!manager && canDecide(mockDb.users, manager.id, user.id);
    return {
      id: user.id,
      name: user.name,
      approver:
        manager && managerDecides
          ? { kind: "manager", id: manager.id, name: manager.name, email: manager.email }
          : hasApprover(mockDb.users, user.id)
            ? { kind: "hr" }
            : null,
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

  async hasOverlap(userId, startDate, endDate) {
    return overlaps(userId, startDate, endDate);
  },

  async insertRequestWithAudit(input) {
    // TASK-026 AC3: nothing is written when nobody may decide the request (mirrors SQL).
    if (!hasApprover(mockDb.users, input.userId)) return null;
    // TASK-027: the database's backstops, mirrored (same SQLSTATE + constraint name, so
    // lib/db/errors.ts toAppError maps them exactly like Postgres errors).
    if (countDays(input.startDate, input.endDate) > MAX_REQUEST_DAYS) {
      throw dbError("23514", "leave_requests_max_length");
    }
    const type = mockDb.leaveTypes.find((t) => t.id === input.leaveTypeId);
    if (input.startDate < daysBefore(todayUtc(), type?.maxBackdateDays ?? 0)) {
      throw dbError("23514", "leave_requests_backdate_window");
    }
    if (overlaps(input.userId, input.startDate, input.endDate)) {
      throw dbError("23P01", "leave_requests_no_overlap");
    }
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
  async decideWithAudit({ requestId, actorId, decision, reason, daysFor }) {
    const request = mockDb.leaveRequests.find((r) => r.id === requestId);
    if (!request || request.isDeleted) return { ok: false, reason: "not_found" };
    if (request.userId === actorId) return { ok: false, reason: "own_request" };
    const employee = mockDb.users.find((u) => u.id === request.userId);
    if (!employee || !canDecide(mockDb.users, actorId, employee.id)) {
      return { ok: false, reason: "not_report" };
    }
    if (request.status !== "pending") return { ok: false, reason: "already_decided" };
    // Mirrors the DB backstop (audit_log_one_decision_per_request).
    if (mockDb.auditLog.some((a) => a.leaveRequestId === requestId && a.action !== "submitted")) {
      throw new Error("duplicate decision for request (audit_log_one_decision_per_request)");
    }
    const leaveType = mockDb.leaveTypes.find((t) => t.id === request.leaveTypeId)!;
    const actor = mockDb.users.find((u) => u.id === actorId)!;
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
      decidedBy: actorId,
      decidedAt: now,
      decisionReason: reason ?? null,
    });
    mockDb.auditLog.push({
      id: crypto.randomUUID(),
      leaveRequestId: request.id,
      actorId,
      action: status,
      occurredAt: now,
    });

    return {
      ok: true,
      request: { ...request },
      leaveType,
      employee: { id: employee.id, name: employee.name, email: employee.email },
      decidedBy: { id: actor.id, name: actor.name },
      days,
      balanceAfter,
    };
  },
};
