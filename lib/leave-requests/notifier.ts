import "server-only";
import type { LeaveTypeName } from "@/lib/data/types";
import { logger } from "@/lib/logger";
import type { Requester } from "@/lib/leave-requests/store";

export type LeaveRequestSubmittedNotice = {
  requestId: string;
  employee: Pick<Requester, "id" | "name">;
  /** TASK-026: the manager, or every OTHER HR Admin (kind "hr") for an HR Admin's request. */
  approver: NonNullable<Requester["approver"]>;
  leaveType: LeaveTypeName;
  startDate: string;
  endDate: string;
  days: number;
};

export type LeaveRequestDecidedNotice = {
  requestId: string;
  decision: "approved" | "rejected";
  employee: { id: string; name: string; email: string };
  decidedBy: { id: string; name: string };
  leaveType: LeaveTypeName;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
};

/** Delivery channels: "needs your review" (US-01 AC1) and "your request was decided" (US-03). */
export interface Notifier {
  leaveRequestSubmitted(notice: LeaveRequestSubmittedNotice): Promise<void>;
  leaveRequestDecided(notice: LeaveRequestDecidedNotice): Promise<void>;
}

/**
 * Log-only channel until a real one is chosen (backlog B6; delivery is TASK-030). Emits a
 * structured event an alerting/email worker can consume. TASK-026: an HR Admin's request is
 * logged ONCE with recipients "hr_admins" (every other HR Admin may decide it).
 */
export const logNotifier: Notifier = {
  async leaveRequestSubmitted(notice) {
    const context = {
      event: "leave_request.submitted",
      requestId: notice.requestId,
      employeeId: notice.employee.id,
      recipients: notice.approver.kind === "hr" ? "hr_admins" : "manager",
      managerId: notice.approver.kind === "manager" ? notice.approver.id : null,
      leaveType: notice.leaveType,
      startDate: notice.startDate,
      endDate: notice.endDate,
      days: notice.days,
    };
    logger.info(
      context,
      notice.approver.kind === "hr"
        ? "HR Admins notified of new leave request"
        : "manager notified of new leave request",
    );
  },

  async leaveRequestDecided(notice) {
    logger.info(
      {
        event: "leave_request.decided",
        requestId: notice.requestId,
        decision: notice.decision,
        employeeId: notice.employee.id,
        decidedById: notice.decidedBy.id,
        leaveType: notice.leaveType,
        days: notice.days,
      },
      "employee notified of leave decision",
    );
  },
};
