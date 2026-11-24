import { countDays } from "@/lib/format";
import { LAST_ACCRUAL_AT } from "@/lib/data/mock/fixtures";
import { mockDb } from "@/lib/data/mock/store";
import type { LeaveRepository } from "@/lib/data/repositories";
import type { LeaveRequest, LeaveRequestView, LeaveType, User } from "@/lib/data/types";

// Same array instances as mockDb, so in-memory writes are visible to every read.
const { auditLog, leaveBalances, leavePolicies, leaveRequests, leaveTypes, users } = mockDb;

const byId = <T extends { id: string }>(rows: T[], id: string) => rows.find((r) => r.id === id);
const active = () => leaveRequests.filter((r) => !r.isDeleted);

function typeOf(id: string): LeaveType {
  const t = byId(leaveTypes, id);
  if (!t) throw new Error(`Unknown leave type ${id}`);
  return t;
}

function userName(id: string | null): string | null {
  return id ? (byId(users, id)?.name ?? null) : null;
}

function toView(r: LeaveRequest): LeaveRequestView {
  return {
    id: r.id,
    leaveType: typeOf(r.leaveTypeId).name,
    startDate: r.startDate,
    endDate: r.endDate,
    days: countDays(r.startDate, r.endDate),
    reason: r.reason,
    status: r.status,
    createdAt: r.createdAt,
    decidedAt: r.decidedAt,
    decidedByName: userName(r.decidedBy),
  };
}

function pendingDays(userId: string, leaveTypeId: string): number {
  return active()
    .filter((r) => r.userId === userId && r.leaveTypeId === leaveTypeId && r.status === "pending")
    .reduce((sum, r) => sum + countDays(r.startDate, r.endDate), 0);
}

function available(userId: string, leaveTypeId: string): number | null {
  if (!typeOf(leaveTypeId).tracksBalance) return null;
  const bal = leaveBalances.find((b) => b.userId === userId && b.leaveTypeId === leaveTypeId);
  return bal ? bal.balance - pendingDays(userId, leaveTypeId) : null;
}

const newestFirst = (a: { createdAt: string }, b: { createdAt: string }) =>
  b.createdAt.localeCompare(a.createdAt);

/** In-memory implementation of LeaveRepository over fixtures.ts. Read-only. */
export const mockRepository: LeaveRepository = {
  async getUserById(id) {
    return byId(users, id) ?? null;
  },

  async listUsers() {
    return [...users];
  },

  async listLeaveTypes() {
    return [...leaveTypes];
  },

  async getBalances(userId) {
    return leaveTypes.map((leaveType) => {
      const policy = leavePolicies.find(
        (p) => p.userId === userId && p.leaveTypeId === leaveType.id,
      );
      const bal = leaveBalances.find((b) => b.userId === userId && b.leaveTypeId === leaveType.id);
      const pending = pendingDays(userId, leaveType.id);
      const confirmed = leaveType.tracksBalance ? (bal?.balance ?? 0) : null;
      return {
        leaveType,
        confirmed,
        pending,
        available: confirmed === null ? null : confirmed - pending,
        accrualPerMonth: policy?.accrualPerMonth ?? null,
        asOf: leaveType.tracksBalance ? (bal?.updatedAt ?? LAST_ACCRUAL_AT) : null,
      };
    });
  },

  async listMyRequests(userId) {
    return active()
      .filter((r) => r.userId === userId)
      .sort(newestFirst)
      .map(toView);
  },

  async listTeamRequests(managerId, opts) {
    // Mirrors the Day 1 SQL: JOIN users u ON u.id = r.user_id WHERE u.manager_id = :managerId
    const reports = new Map<string, User>(
      users.filter((u) => u.managerId === managerId).map((u) => [u.id, u]),
    );
    return active()
      .filter((r) => reports.has(r.userId))
      .filter((r) => !opts?.status || r.status === opts.status)
      .sort(newestFirst)
      .map((r) => {
        const emp = reports.get(r.userId)!;
        return {
          ...toView(r),
          employee: { id: emp.id, name: emp.name, email: emp.email },
          // Exclude THIS request from the pending deduction, otherwise it is
          // counted twice and an in-balance request is flagged as over.
          balanceAvailable: (() => {
            const avail = available(r.userId, r.leaveTypeId);
            if (avail === null) return null;
            return r.status === "pending" ? avail + countDays(r.startDate, r.endDate) : avail;
          })(),
        };
      });
  },

  async listAudit(filter) {
    const requests = new Map(leaveRequests.map((r) => [r.id, r]));
    return auditLog
      .map((entry) => ({ entry, request: requests.get(entry.leaveRequestId)! }))
      .filter(({ request }) => !request.isDeleted)
      .filter(({ request }) => !filter.employeeId || request.userId === filter.employeeId)
      .filter(({ entry }) => !filter.from || entry.occurredAt.slice(0, 10) >= filter.from)
      .filter(({ entry }) => !filter.to || entry.occurredAt.slice(0, 10) <= filter.to)
      .sort((a, b) => b.entry.occurredAt.localeCompare(a.entry.occurredAt))
      .map(({ entry, request }) => ({
        id: entry.id,
        requestId: request.id,
        employeeName: userName(request.userId) ?? "Unknown",
        leaveType: typeOf(request.leaveTypeId).name,
        startDate: request.startDate,
        endDate: request.endDate,
        days: countDays(request.startDate, request.endDate),
        action: entry.action,
        actorName: userName(entry.actorId) ?? "Unknown",
        occurredAt: entry.occurredAt,
      }));
  },

  async listPolicies() {
    return leavePolicies
      .map((p) => {
        const user = byId(users, p.userId)!;
        return {
          id: p.id,
          userId: user.id,
          userName: user.name,
          role: user.role,
          leaveType: typeOf(p.leaveTypeId).name,
          accrualPerMonth: p.accrualPerMonth,
        };
      })
      .sort(
        (a, b) => a.userName.localeCompare(b.userName) || a.leaveType.localeCompare(b.leaveType),
      );
  },

  async getOrgStats() {
    const month = LAST_ACCRUAL_AT.slice(0, 7);
    const rows = active();
    return {
      pendingCount: rows.filter((r) => r.status === "pending").length,
      approvedThisMonth: rows.filter(
        (r) => r.status === "approved" && r.decidedAt?.startsWith(month),
      ).length,
      employeeCount: users.length,
    };
  },
};
