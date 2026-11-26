import { currentPeriod, monthsToAccrue } from "@/lib/accrual/periods";
import type { AccrualStore, AccruedPeriod } from "@/lib/accrual/store";
import { type SqlClient, toNumber } from "@/lib/db/sql";

/**
 * AccrualStore over Postgres. Everything runs in ONE transaction and all day
 * arithmetic is `numeric` in SQL (exact). Concurrent or duplicate invocations are
 * safe: the unique accrual_runs.period makes a second claim of the same month wait
 * for the first transaction, then `do nothing` → that month is skipped.
 */
export function createPostgresAccrualStore(sql: SqlClient): AccrualStore {
  return {
    runAccrual({ now, trigger, maxCatchUpMonths }) {
      return sql.transaction(async (tx) => {
        const [last] = await tx.query<{ last: string | null }>(
          `select max(period)::text last from accrual_runs`,
        );
        const plan = monthsToAccrue(last?.last ?? null, currentPeriod(now), maxCatchUpMonths);
        if ("tooFarBehind" in plan) {
          return { status: "too_far_behind", monthsMissing: plan.tooFarBehind } as const;
        }

        const accrued: AccruedPeriod[] = [];
        for (const period of plan.periods) {
          // Claim the month (idempotency key). No row back → already accrued elsewhere.
          const [claim] = await tx.query<{ id: string }>(
            `insert into accrual_runs (period, trigger) values ($1::date, $2::text)
             on conflict (period) do nothing
             returning id`,
            [period, trigger],
          );
          if (!claim) continue;

          await tx.query(
            `insert into leave_balances (user_id, leave_type_id, balance, updated_at)
             select p.user_id, p.leave_type_id, p.accrual_per_month, now()
               from leave_policies p
               join leave_types t on t.id = p.leave_type_id
              where t.tracks_balance and p.accrual_per_month > 0
             on conflict (user_id, leave_type_id)
             do update set balance = leave_balances.balance + excluded.balance, updated_at = now()`,
          );

          // Audit fields computed in SQL (numeric sum; exact rate snapshot).
          const [stats] = await tx.query<{ users_accrued: number; days_accrued: string }>(
            `update accrual_runs r
                set users_accrued = s.users, days_accrued = s.days, rates = s.rates
               from (
                 select count(distinct p.user_id)::int users,
                        coalesce(sum(p.accrual_per_month), 0) days,
                        coalesce(jsonb_agg(jsonb_build_object(
                          'userId', p.user_id,
                          'leaveTypeId', p.leave_type_id,
                          'accrualPerMonth', p.accrual_per_month
                        ) order by p.user_id, p.leave_type_id), '[]'::jsonb) rates
                   from leave_policies p
                   join leave_types t on t.id = p.leave_type_id
                  where t.tracks_balance and p.accrual_per_month > 0
               ) s
              where r.id = $1
             returning r.users_accrued, r.days_accrued::text`,
            [claim.id],
          );
          accrued.push({
            period,
            usersAccrued: stats?.users_accrued ?? 0,
            daysAccrued: toNumber(stats?.days_accrued ?? "0"),
          });
        }
        return { status: "accrued", accrued } as const;
      });
    },
  };
}
