import "server-only";
import type { LeaveTypeName } from "@/lib/data/types";
import { logger } from "@/lib/logger";
import type { Requester } from "@/lib/leave-requests/store";

export type LeaveRequestSubmittedNotice = {
  requestId: string;
  employee: Pick<Requester, "id" | "name">;
  manager: Requester["manager"];
  leaveType: LeaveTypeName;
  startDate: string;
  endDate: string;
  days: number;
};

export type LeaveRequestDecidedNotice = {
  requestId: string;
  decision: "approved" | "rejected";
  employee: { id: string; name: string; email: string };
  manager: { id: string; name: string };
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
 * Log-only channel until a real one is chosen (backlog B6). Emits a structured
 * event an alerting/email worker can consume. Employees without a manager
 * (e.g. HR admins, backlog B2) are logged as a warning — nobody to notify.
 */
export const logNotifier: Notifier = {
  async leaveRequestSubmitted(notice) {
    const context = {
      event: "leave_request.submitted",
      requestId: notice.requestId,
      employeeId: notice.employee.id,
      managerId: notice.manager?.id ?? null,
      leaveType: notice.leaveType,
      startDate: notice.startDate,
      endDate: notice.endDate,
      days: notice.days,
    };
    if (!notice.manager) {
      logger.warn(context, "leave request submitted by a user with no manager — nobody notified");
      return;
    }
    logger.info(context, "manager notified of new leave request");
  },

  async leaveRequestDecided(notice) {
    logger.info(
      {
        event: "leave_request.decided",
        requestId: notice.requestId,
        decision: notice.decision,
        employeeId: notice.employee.id,
        managerId: notice.manager.id,
        leaveType: notice.leaveType,
        days: notice.days,
      },
      "employee notified of leave decision",
    );
  },
};
