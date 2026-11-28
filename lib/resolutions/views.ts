import { mockDb } from "@/lib/data/mock/store";
import type { LeaveTypeName } from "@/lib/data/types";
import { type SqlClient, toIso, toNumber } from "@/lib/db/sql";
import {
  type MockResolution,
  monthlyDeduction,
  type ResolutionView,
} from "@/lib/resolutions/types";

/**
 * TASK-033 — ONE mapping from a resolution row to ResolutionView, shared by the repositories
 * (reads) and the stores (what a transition returns), for Postgres and memory alike.
 */
export const RESOLUTION_VIEW_SQL = `
  select r.id, r.user_id, u.name user_name, t.name type_name, r.status,
         r.deficit_at_proposal deficit, r.unpaid_days_proposed unpaid,
         r.recovery_days_proposed recovery, r.recovery_start_period::text start,
         r.recovery_months months, r.respond_by, p.name proposed_by_name, r.proposed_at,
         r.proposal_number, r.unpaid_days_applied unpaid_applied,
         r.recovery_days_applied recovery_applied, r.response_reason, r.final_reason,
         (r.status = 'proposed' and r.respond_by <= now()) expired
    from balance_resolutions r
    join users u on u.id = r.user_id
    join leave_types t on t.id = r.leave_type_id
    join users p on p.id = r.proposed_by`;

export type ResolutionViewRow = {
  id: string;
  user_id: string;
  user_name: string;
  type_name: LeaveTypeName;
  status: ResolutionView["status"];
  deficit: unknown;
  unpaid: unknown;
  recovery: unknown;
  start: string | null;
  months: number | null;
  respond_by: unknown;
  proposed_by_name: string;
  proposed_at: unknown;
  proposal_number: number;
  unpaid_applied: unknown;
  recovery_applied: unknown;
  response_reason: string | null;
  final_reason: string | null;
  expired: boolean;
};

const nullableNumber = (v: unknown) => (v === null || v === undefined ? null : toNumber(v));

export function toResolutionView(r: ResolutionViewRow): ResolutionView {
  const recovery = toNumber(r.recovery);
  return {
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    leaveType: r.type_name,
    status: r.status,
    deficit: toNumber(r.deficit),
    unpaidDays: toNumber(r.unpaid),
    recoveryDays: recovery,
    monthlyDeduction: recovery > 0 && r.months ? monthlyDeduction(recovery, r.months) : null,
    recoveryStartPeriod: r.start,
    recoveryMonths: r.months,
    respondBy: toIso(r.respond_by),
    proposedByName: r.proposed_by_name,
    proposedAt: toIso(r.proposed_at),
    proposalNumber: r.proposal_number,
    unpaidApplied: nullableNumber(r.unpaid_applied),
    recoveryApplied: nullableNumber(r.recovery_applied),
    responseReason: r.response_reason,
    finalReason: r.final_reason,
    expired: r.expired,
  };
}

export async function selectResolutionView(sql: SqlClient, id: string): Promise<ResolutionView> {
  const [row] = await sql.query<ResolutionViewRow>(`${RESOLUTION_VIEW_SQL} where r.id = $1`, [id]);
  return toResolutionView(row!);
}

const userName = (id: string) => mockDb.users.find((u) => u.id === id)?.name ?? "Unknown";

export function toMemoryResolutionView(r: MockResolution, now = new Date()): ResolutionView {
  return {
    id: r.id,
    userId: r.userId,
    userName: userName(r.userId),
    leaveType: mockDb.leaveTypes.find((t) => t.id === r.leaveTypeId)!.name,
    status: r.status,
    deficit: r.deficitAtProposal,
    unpaidDays: r.unpaidDaysProposed,
    recoveryDays: r.recoveryDaysProposed,
    monthlyDeduction:
      r.recoveryDaysProposed > 0 && r.recoveryMonths
        ? monthlyDeduction(r.recoveryDaysProposed, r.recoveryMonths)
        : null,
    recoveryStartPeriod: r.recoveryStartPeriod,
    recoveryMonths: r.recoveryMonths,
    respondBy: r.respondBy,
    proposedByName: userName(r.proposedBy),
    proposedAt: r.proposedAt,
    proposalNumber: r.proposalNumber,
    unpaidApplied: r.unpaidDaysApplied,
    recoveryApplied: r.recoveryDaysApplied,
    responseReason: r.responseReason,
    finalReason: r.finalReason,
    expired: r.status === "proposed" && Date.parse(r.respondBy) <= now.getTime(),
  };
}
