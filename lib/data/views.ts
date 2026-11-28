import type { LeaveRequest, LeaveRequestView, LeaveTypeName } from "@/lib/data/types";
import { countDays } from "@/lib/format";

/** Row → view model shared by every repository and the submit service. */
export function toRequestView(
  r: Pick<
    LeaveRequest,
    "id" | "startDate" | "endDate" | "reason" | "status" | "createdAt" | "decidedAt"
  >,
  leaveType: LeaveTypeName,
  decidedByName: string | null,
  /** TASK-026: who a PENDING request is waiting for (approver_label); ignored once decided. */
  awaiting: string | null,
): LeaveRequestView {
  return {
    id: r.id,
    leaveType,
    startDate: r.startDate,
    endDate: r.endDate,
    days: countDays(r.startDate, r.endDate),
    reason: r.reason,
    status: r.status,
    createdAt: r.createdAt,
    decidedAt: r.decidedAt,
    decidedByName,
    awaiting: r.status === "pending" ? awaiting : null,
  };
}
