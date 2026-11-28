import { availableForRequest, buildBalanceSummaries } from "@/lib/data/balance";
import { utcMonthBounds, withinUtcDays } from "@/lib/data/dates";
import { mockDb } from "@/lib/data/mock/store";
import type { LeaveRepository } from "@/lib/data/repositories";
import {
  AUDIT_LOG_LIMIT,
  type LeaveRequest,
  type LeaveRequestView,
  type LeaveType,
  type User,
} from "@/lib/data/types";
import { toRequestView } from "@/lib/data/views";
import { approverLabel, canDecide } from "@/lib/leave-requests/approver";
import { OPEN_RESOLUTION_STATUSES, RESOLUTION_GROUP_STATUSES } from "@/lib/resolutions/types";
import { toMemoryResolutionView } from "@/lib/resolutions/views";
import { countDays } from "@/lib/format";

// Same array instances as mockDb, so in-memory writes are visible to every read.
const { auditLog, leaveBalances, leavePolicies, leaveRequests, leaveTypes, users } = mockDb;

const byId = <T extends { id: string }>(rows: T[], id: string) => rows.find((r) => r.id === id);

function latestAccrualAt(): string | null {
  return mockDb.accrualRuns.reduce<string | null>(
    (max, r) => (max === null || r.ranAt > max ? r.ranAt : max),
    null,
  );
}
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
  // TASK-026: "Awaiting …" from the CURRENT org chart (mirrors SQL approver_label).
  return toRequestView(
    r,
    typeOf(r.leaveTypeId).name,
    userName(r.decidedBy),
    approverLabel(users, r.userId),
  );
}

const newestFirst = (a: { createdAt: string }, b: { createdAt: string }) =>
  b.createdAt.localeCompare(a.createdAt);

/** In-memory implementation of LeaveRepository over fixtures.ts. Read-only. */
export const mockRepository: LeaveRepository = {
  async getUserById(id) {
    return byId(users, id) ?? null;
  },

  async getUserByAuthUserId(authUserId) {
    const link = mockDb.authLinks.find((l) => l.authUserId === authUserId);
    return link ? (byId(users, link.userId) ?? null) : null;
  },

  async listUsers() {
    return [...users];
  },

  async listLeaveTypes() {
    return [...leaveTypes];
  },

  async getBalances(userId) {
    return buildBalanceSummaries({
      leaveTypes,
      balances: leaveBalances.filter((b) => b.userId === userId),
      policies: leavePolicies.filter((p) => p.userId === userId),
      pendingRanges: active().filter((r) => r.userId === userId && r.status === "pending"),
      // Latest accrual run (= Postgres max(accrual_runs.ran_at)) — not
      // balance.updatedAt, which approvals also bump (TASK-014).
      lastAccrualAt: latestAccrualAt(),
    });
  },

  async listMyRequests(userId) {
    return active()
      .filter((r) => r.userId === userId)
      .sort(newestFirst)
      .map(toView);
  },

  async listTeamRequests(approverId, opts) {
    // Mirrors the SQL: WHERE public.can_decide(:approverId, r.user_id) (TASK-026 — a manager's
    // reports; for an HR Admin also the managers who report to them and HR peers without one).
    const reports = new Map<string, User>(
      users.filter((u) => canDecide(users, approverId, u.id)).map((u) => [u.id, u]),
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
          balanceAvailable: availableForRequest({
            tracksBalance: typeOf(r.leaveTypeId).tracksBalance,
            confirmed: leaveBalances.find(
              (b) => b.userId === r.userId && b.leaveTypeId === r.leaveTypeId,
            )?.balance,
            pendingRanges: active().filter((p) => p.userId === r.userId && p.status === "pending"),
            request: r,
          }),
        };
      });
  },

  async listAudit(filter) {
    const requests = new Map(leaveRequests.map((r) => [r.id, r]));
    return auditLog
      .map((entry) => ({ entry, request: requests.get(entry.leaveRequestId)! }))
      .filter(({ request }) => !request.isDeleted)
      .filter(({ request }) => !filter.employeeId || request.userId === filter.employeeId)
      .filter(({ entry }) => withinUtcDays(entry.occurredAt, filter.from, filter.to))
      .sort(
        (a, b) =>
          b.entry.occurredAt.localeCompare(a.entry.occurredAt) ||
          a.entry.id.localeCompare(b.entry.id),
      )
      .slice(0, AUDIT_LOG_LIMIT)
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

  async getEmployeeAuditHistory(userId, filter = {}) {
    const user = byId(users, userId);
    if (!user) return null;
    const requests = active()
      .filter((r) => r.userId === userId && withinUtcDays(r.createdAt, filter.from, filter.to))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
    return {
      employee: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        managerName: userName(user.managerId),
      },
      requests: requests.map((r) => ({
        ...toView(r),
        decidedBy: r.decidedBy
          ? { id: r.decidedBy, name: userName(r.decidedBy) ?? "Unknown" }
          : null,
        decisionReason: r.decisionReason,
        events: auditLog
          .filter((a) => a.leaveRequestId === r.id)
          .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id))
          .map((a) => ({
            action: a.action,
            actorId: a.actorId,
            actorName: userName(a.actorId) ?? "Unknown",
            occurredAt: a.occurredAt,
          })),
      })),
    };
  },

  // TASK-032: mirrors the SQL (tracked, balance < 0, no open resolution).
  async listResolutionQueue() {
    return mockDb.leaveBalances
      .filter((b) => b.balance < 0 && typeOf(b.leaveTypeId).tracksBalance)
      .filter(
        (b) =>
          !mockDb.balanceResolutions.some(
            (r) =>
              r.userId === b.userId &&
              r.leaveTypeId === b.leaveTypeId &&
              (OPEN_RESOLUTION_STATUSES as readonly string[]).includes(r.status),
          ),
      )
      .map((b) => ({
        userId: b.userId,
        userName: userName(b.userId) ?? "Unknown",
        leaveTypeId: b.leaveTypeId,
        leaveType: typeOf(b.leaveTypeId).name,
        balance: b.balance,
        deficit: -b.balance,
        accrualPerMonth:
          mockDb.leavePolicies.find((p) => p.userId === b.userId && p.leaveTypeId === b.leaveTypeId)
            ?.accrualPerMonth ?? 0,
      }))
      .sort((a, b) => a.balance - b.balance || a.userName.localeCompare(b.userName));
  },

  async listResolutions(group) {
    const wanted = RESOLUTION_GROUP_STATUSES[group] as string[];
    return mockDb.balanceResolutions
      .filter((r) => wanted.includes(r.status))
      .sort((a, b) => b.proposedAt.localeCompare(a.proposedAt) || a.id.localeCompare(b.id))
      .map((r) => toMemoryResolutionView(r));
  },

  async getMyResolution(userId) {
    const cutoff = Date.now() - 30 * 86_400_000;
    const mine = mockDb.balanceResolutions
      .filter(
        (r) =>
          r.userId === userId &&
          r.status !== "superseded" &&
          (r.status === "proposed" ||
            r.status === "declined" ||
            (r.closedAt !== null && Date.parse(r.closedAt) > cutoff)),
      )
      .sort((a, b) => b.proposedAt.localeCompare(a.proposedAt) || a.id.localeCompare(b.id));
    return mine[0] ? toMemoryResolutionView(mine[0]) : null;
  },

  // TASK-030: only the recipient's own rows (mirrors WHERE recipient_id = $1).
  async listNotifications(recipientId, opts) {
    const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 200);
    return mockDb.notifications
      .filter((n) => n.recipientId === recipientId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
      .slice(0, limit)
      .map((n) => structuredClone(n));
  },

  async countUnreadNotifications(recipientId) {
    return mockDb.notifications.filter((n) => n.recipientId === recipientId && n.readAt === null)
      .length;
  },

  async getOrgStats(now = new Date()) {
    const [monthStart, nextMonth] = utcMonthBounds(now);
    const rows = active();
    return {
      pendingCount: rows.filter((r) => r.status === "pending").length,
      approvedThisMonth: rows.filter(
        (r) =>
          r.status === "approved" &&
          r.decidedAt !== null &&
          r.decidedAt >= monthStart &&
          r.decidedAt < nextMonth,
      ).length,
      // Matches the dashboard label "People with a leave policy".
      employeeCount: new Set(leavePolicies.map((p) => p.userId)).size,
    };
  },
};
