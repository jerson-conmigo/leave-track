import { type SqlClient, toIso, toNumber } from "@/lib/db/sql";
import type { LeaveTypeName } from "@/lib/data/types";
import { writeResolutionProposed } from "@/lib/notifications/postgres";
import { cents, type ResolutionStore } from "@/lib/resolutions/store";
import { monthlyDeduction } from "@/lib/resolutions/types";

/**
 * TASK-032 — proposals over Postgres, in ONE transaction: the balance row is locked and re-read
 * (a deficit that changed since the page loaded is caught), the split and the accrual cap are
 * checked against it, respond_by = now() + app_settings days is fixed in the row, and the
 * resolution, its 'proposed' event and the employee's notification are written together. A second
 * open resolution trips balance_resolutions_one_open (409 via toAppError).
 */
export function createPostgresResolutionStore(sql: SqlClient): ResolutionStore {
  return {
    proposeWithAudit(input) {
      return sql.transaction(async (tx) => {
        const [info] = await tx.query<{
          user_name: string;
          type_name: LeaveTypeName;
          tracks_balance: boolean;
          accrual: unknown;
        }>(
          `select u.name user_name, t.name type_name, t.tracks_balance,
                  coalesce((select accrual_per_month from leave_policies
                             where user_id = u.id and leave_type_id = t.id), 0) accrual
             from users u, leave_types t where u.id = $1 and t.id = $2`,
          [input.userId, input.leaveTypeId],
        );
        if (!info) return { ok: false, reason: "not_found" } as const;
        if (!info.tracks_balance) return { ok: false, reason: "untracked" } as const;
        const [bal] = await tx.query<{ balance: unknown }>(
          `select balance from leave_balances where user_id = $1 and leave_type_id = $2 for update`,
          [input.userId, input.leaveTypeId],
        );
        const balance = bal ? toNumber(bal.balance) : 0;
        if (balance >= 0) return { ok: false, reason: "not_in_deficit" } as const;
        const deficit = -balance;
        if (cents(input.unpaidDays) + cents(input.recoveryDays) !== cents(deficit)) {
          return { ok: false, reason: "split_mismatch", deficit } as const;
        }
        const accrualPerMonth = toNumber(info.accrual);
        if (
          input.recoveryDays > 0 &&
          (accrualPerMonth <= 0 ||
            monthlyDeduction(input.recoveryDays, input.recoveryMonths!) > accrualPerMonth)
        ) {
          return { ok: false, reason: "recovery_too_high", accrualPerMonth } as const;
        }
        const [row] = await tx.query<{ id: string; respond_by: unknown; proposed_at: unknown }>(
          `insert into balance_resolutions
             (user_id, leave_type_id, deficit_at_proposal, unpaid_days_proposed,
              recovery_days_proposed, recovery_start_period, recovery_months, respond_by, proposed_by)
           select $1, $2, $3, $4, $5, $6::date, $7, now() + make_interval(days => (value)::int), $8
             from app_settings where key = 'resolution_response_days'
           returning id, respond_by, proposed_at`,
          [
            input.userId,
            input.leaveTypeId,
            deficit,
            input.unpaidDays,
            input.recoveryDays,
            input.recoveryStartPeriod,
            input.recoveryMonths,
            input.actorId,
          ],
        );
        await tx.query(
          `insert into balance_resolution_events
             (resolution_id, action, actor_id, balance_before, balance_after, details)
           values ($1, 'proposed', $2, $3, $3, $4::jsonb)`,
          [
            row!.id,
            input.actorId,
            balance,
            JSON.stringify({
              unpaidDays: input.unpaidDays,
              recoveryDays: input.recoveryDays,
              recoveryStartPeriod: input.recoveryStartPeriod,
              recoveryMonths: input.recoveryMonths,
            }),
          ],
        );
        await writeResolutionProposed(tx, row!.id);
        return {
          ok: true,
          id: row!.id,
          userName: info.user_name,
          leaveType: info.type_name,
          deficit,
          respondBy: toIso(row!.respond_by),
          proposedAt: toIso(row!.proposed_at),
        } as const;
      });
    },
  };
}
