import type { LeaveRequest, LeaveTypeName, RequestStatus } from "@/lib/data/types";
import { type SqlClient, toIso, toNumber } from "@/lib/db/sql";
import type { CancelStore, DecideStore, SubmitStore } from "@/lib/leave-requests/store";
import {
  writeRequestCancelled,
  writeRequestDecided,
  writeRequestSubmitted,
} from "@/lib/notifications/postgres";

type RequestRow = {
  id: string;
  user_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: RequestStatus;
  decided_by: string | null;
  decided_at: unknown;
  decision_reason: string | null;
  is_deleted: boolean;
  created_at: unknown;
};

const REQUEST_COLUMNS = `id, user_id, leave_type_id, start_date::text, end_date::text, reason,
  status::text, decided_by, decided_at, decision_reason, is_deleted, created_at`;

function toLeaveRequest(r: RequestRow): LeaveRequest {
  return {
    id: r.id,
    userId: r.user_id,
    leaveTypeId: r.leave_type_id,
    startDate: r.start_date,
    endDate: r.end_date,
    reason: r.reason,
    status: r.status,
    decidedBy: r.decided_by,
    decidedAt: r.decided_at == null ? null : toIso(r.decided_at),
    decisionReason: r.decision_reason,
    isDeleted: r.is_deleted,
    createdAt: toIso(r.created_at),
  };
}

/** SubmitStore over Postgres. All SQL is parameterised. */
export function createPostgresSubmitStore(sql: SqlClient): SubmitStore {
  return {
    async getLeaveType(id) {
      const [row] = await sql.query<{
        id: string;
        name: LeaveTypeName;
        tracks_balance: boolean;
        max_backdate_days: number;
      }>(`select id, name, tracks_balance, max_backdate_days from leave_types where id = $1`, [id]);
      return row
        ? {
            id: row.id,
            name: row.name,
            tracksBalance: row.tracks_balance,
            maxBackdateDays: row.max_backdate_days,
          }
        : null;
    },

    async getRequester(userId) {
      // TASK-026: the approver comes from the SQL rule (can_decide / has_approver), never from
      // application logic: the manager when they may decide, otherwise "HR" peers, otherwise none.
      const [row] = await sql.query<{
        id: string;
        name: string;
        manager_decides: boolean;
        manager_id: string | null;
        manager_name: string | null;
        manager_email: string | null;
        has_approver: boolean;
      }>(
        `select u.id, u.name,
                (m.id is not null and public.can_decide(m.id, u.id)) manager_decides,
                m.id manager_id, m.name manager_name, m.email manager_email,
                public.has_approver(u.id) has_approver
         from users u left join users m on m.id = u.manager_id
         where u.id = $1`,
        [userId],
      );
      if (!row) return null;
      return {
        id: row.id,
        name: row.name,
        approver:
          row.manager_decides && row.manager_id && row.manager_name && row.manager_email
            ? {
                kind: "manager",
                id: row.manager_id,
                name: row.manager_name,
                email: row.manager_email,
              }
            : row.has_approver
              ? { kind: "hr" }
              : null,
      };
    },

    async getBalanceContext(userId, leaveTypeId) {
      const [balance] = await sql.query<{ balance: unknown }>(
        `select balance from leave_balances where user_id = $1 and leave_type_id = $2`,
        [userId, leaveTypeId],
      );
      const pending = await sql.query<{ start_date: string; end_date: string }>(
        `select start_date::text, end_date::text from leave_requests
         where user_id = $1 and leave_type_id = $2 and status = 'pending' and not is_deleted`,
        [userId, leaveTypeId],
      );
      return {
        confirmed: balance ? toNumber(balance.balance) : 0,
        pending: pending.map((p) => ({ startDate: p.start_date, endDate: p.end_date })),
      };
    },

    async hasOverlap(userId, startDate, endDate) {
      const [row] = await sql.query<{ overlap: boolean }>(
        `select exists (
           select 1 from leave_requests
            where user_id = $1 and status in ('pending', 'approved') and not is_deleted
              and daterange(start_date, end_date, '[]') && daterange($2::date, $3::date, '[]')
         ) overlap`,
        [userId, startDate, endDate],
      );
      return row?.overlap ?? false;
    },

    insertRequestWithAudit(input) {
      return sql.transaction(async (tx) => {
        // TASK-026 AC3: inserted only while the requester has an eligible approver — checked in
        // this statement, so a concurrent org-chart change can't leave an orphan request.
        const [row] = await tx.query<RequestRow>(
          `insert into leave_requests (user_id, leave_type_id, start_date, end_date, reason, status)
           select $1, $2, $3, $4, $5, 'pending'
            where public.has_approver($1)
           returning ${REQUEST_COLUMNS}`,
          [input.userId, input.leaveTypeId, input.startDate, input.endDate, input.reason],
        );
        if (!row) return null; // no approver: nothing written
        await tx.query(
          // occurred_at is taken from the row server-side (microsecond-exact) —
          // never round-tripped through a JS Date (ms precision). Review TASK-011 #1.
          `insert into audit_log (leave_request_id, actor_id, action, occurred_at)
           select id, user_id, 'submitted', created_at from leave_requests where id = $1`,
          [row.id],
        );
        // TASK-030: the approvers' notifications + outbox rows, in this same transaction.
        await writeRequestSubmitted(tx, row.id);
        return toLeaveRequest(row);
      });
    },
  };
}

type DecidedRow = RequestRow & {
  type_name: LeaveTypeName;
  tracks_balance: boolean;
  max_backdate_days: number;
  employee_name: string;
  employee_email: string;
  manager_name: string;
};

/**
 * DecideStore over Postgres (TASK-014). One transaction:
 *  (a) UPDATE scoped by `public.can_decide($2, r.user_id)` (TASK-026: managers decide their
 *      reports, HR Admins their managers and HR peers, never their own) AND guarded by
 *      `r.status = 'pending'` — BR-02/BR-10 + no double decision, in the same statement;
 *  (b) on 0 rows, a diagnostic SELECT classifies the outcome (nothing is written);
 *  (c) approve on a tracked type: relative upsert-decrement of that request's own
 *      leave type (`balance - $days`, row-locked — no read-modify-write);
 *  (d) decision audit row with occurred_at = now() (= decided_at; transaction time).
 * The unique index audit_log_one_decision_per_request backstops (a).
 */
export function createPostgresDecideStore(sql: SqlClient): DecideStore {
  return {
    decideWithAudit({ requestId, actorId, decision, reason, daysFor }) {
      const status = decision === "approve" ? "approved" : "rejected";
      return sql.transaction(async (tx) => {
        const [row] = await tx.query<DecidedRow>(
          `update leave_requests r
              set status = ($3::text)::public.request_status, decided_by = $2, decided_at = now(),
                  decision_reason = $4::text
             from users u, leave_types t, users m
            where r.id = $1 and u.id = r.user_id and public.can_decide($2, r.user_id)
              and t.id = r.leave_type_id and m.id = $2
              and r.status = 'pending' and not r.is_deleted
           returning r.id, r.user_id, r.leave_type_id, r.start_date::text, r.end_date::text,
                     r.reason, r.status::text, r.decided_by, r.decided_at, r.decision_reason,
                     r.is_deleted, r.created_at, t.name type_name, t.tracks_balance, t.max_backdate_days,
                     u.name employee_name, u.email employee_email, m.name manager_name`,
          [requestId, actorId, status, reason ?? null],
        );

        if (!row) {
          const [found] = await tx.query<{
            status: string;
            is_deleted: boolean;
            user_id: string;
            eligible: boolean;
          }>(
            `select r.status::text, r.is_deleted, r.user_id, public.can_decide($2, r.user_id) eligible
               from leave_requests r
              where r.id = $1`,
            [requestId, actorId],
          );
          if (!found || found.is_deleted) return { ok: false, reason: "not_found" } as const;
          if (found.user_id === actorId) return { ok: false, reason: "own_request" } as const;
          // Not-eligible wins over already-decided: never reveal another team's state.
          if (!found.eligible) return { ok: false, reason: "not_report" } as const;
          return { ok: false, reason: "already_decided" } as const;
        }

        const days = daysFor(row.start_date, row.end_date);
        let balanceAfter: number | null = null;
        if (decision === "approve" && row.tracks_balance) {
          // TASK-029: the decrement and its ledger row in ONE statement — the ledger's
          // balance_after is exactly the balance this upsert produced.
          const [bal] = await tx.query<{ balance: unknown }>(
            `with upserted as (
               insert into leave_balances (user_id, leave_type_id, balance, updated_at)
               values ($1, $2, 0 - $3::numeric, now())
               on conflict (user_id, leave_type_id)
               do update set balance = leave_balances.balance - $3::numeric, updated_at = now()
               returning user_id, leave_type_id, balance
             )
             insert into balance_ledger
               (user_id, leave_type_id, delta, balance_after, source, source_key, leave_request_id, actor_id)
             select user_id, leave_type_id, 0 - $3::numeric, balance, 'approval',
                    'approval:' || $4::text, $4::uuid, $5::uuid
               from upserted
             returning balance_after balance`,
            [row.user_id, row.leave_type_id, days, row.id, actorId],
          );
          balanceAfter = bal ? toNumber(bal.balance) : null;
        }

        await tx.query(
          `insert into audit_log (leave_request_id, actor_id, action, occurred_at)
           values ($1, $2, ($3::text)::public.audit_action, now())`,
          [row.id, actorId, status],
        );
        // TASK-030: the requester's notification + outbox row, in this same transaction.
        await writeRequestDecided(tx, row.id);

        return {
          ok: true,
          request: toLeaveRequest(row),
          leaveType: {
            id: row.leave_type_id,
            name: row.type_name,
            tracksBalance: row.tracks_balance,
            maxBackdateDays: row.max_backdate_days,
          },
          employee: { id: row.user_id, name: row.employee_name, email: row.employee_email },
          decidedBy: { id: actorId, name: row.manager_name },
          days,
          balanceAfter,
        } as const;
      });
    },
  };
}

/**
 * CancelStore over Postgres (TASK-028). One transaction:
 *  (a) UPDATE scoped to the requester (`user_id = $actor`) AND guarded by the state:
 *      pending, or approved with start_date > today (UTC) — so a race with a decision, a second
 *      cancel or started leave simply updates nothing;
 *  (b) approved leave of a tracked type: the balance credit and its ledger row in ONE statement.
 *      The credit REVERSES the approval's own ledger delta (approval:<id>), so exactly what was
 *      debited comes back; only approvals that predate the ledger fall back to the day count;
 *  (c) the 'cancelled' audit row; (d) the approvers' notifications (TASK-030);
 *  on 0 rows, a diagnostic SELECT classifies the outcome (not yours before started).
 */
export function createPostgresCancelStore(sql: SqlClient): CancelStore {
  return {
    cancelWithAudit({ requestId, actorId, today, daysFor }) {
      return sql.transaction(async (tx) => {
        const [row] = await tx.query<RequestRow & { was_approved: boolean }>(
          `update leave_requests r
              set status = 'cancelled', cancelled_at = now(), cancelled_by = $2
            where r.id = $1 and r.user_id = $2 and not r.is_deleted
              and (r.status = 'pending' or (r.status = 'approved' and r.start_date > $3::date))
           returning r.id, r.user_id, r.leave_type_id, r.start_date::text, r.end_date::text,
                     r.reason, r.status::text, r.decided_by, r.decided_at, r.decision_reason,
                     r.is_deleted, r.created_at, (r.decided_by is not null) was_approved`,
          [requestId, actorId, today],
        );

        if (!row) {
          const [found] = await tx.query<{
            user_id: string;
            status: string;
            is_deleted: boolean;
            start_date: string;
          }>(
            `select user_id, status::text, is_deleted, start_date::text
               from leave_requests where id = $1`,
            [requestId],
          );
          if (!found || found.is_deleted) return { ok: false, reason: "not_found" } as const;
          // Not-yours wins over everything else: never reveal another person's request state.
          if (found.user_id !== actorId) return { ok: false, reason: "not_yours" } as const;
          if (found.status === "approved" && found.start_date <= today) {
            return { ok: false, reason: "started" } as const;
          }
          return { ok: false, reason: "not_cancellable" } as const;
        }

        const [type] = await tx.query<{
          name: LeaveTypeName;
          tracks_balance: boolean;
          max_backdate_days: number;
        }>(`select name, tracks_balance, max_backdate_days from leave_types where id = $1`, [
          row.leave_type_id,
        ]);

        let restoredDays: number | null = null;
        if (row.was_approved && type?.tracks_balance) {
          const [credit] = await tx.query<{ delta: unknown }>(
            `with approval as (
               select coalesce(
                 (select 0 - delta from balance_ledger where source_key = 'approval:' || $1::text),
                 $4::numeric) credit
             ), upserted as (
               insert into leave_balances (user_id, leave_type_id, balance, updated_at)
               select $2::uuid, $3::uuid, a.credit, now() from approval a
               on conflict (user_id, leave_type_id)
               do update set balance = leave_balances.balance + excluded.balance, updated_at = now()
               returning user_id, leave_type_id, balance
             )
             insert into balance_ledger
               (user_id, leave_type_id, delta, balance_after, source, source_key, leave_request_id, actor_id)
             select u.user_id, u.leave_type_id, a.credit, u.balance, 'cancellation',
                    'cancellation:' || $1::text, $1::uuid, $2::uuid
               from upserted u cross join approval a
             returning delta`,
            [row.id, row.user_id, row.leave_type_id, daysFor(row.start_date, row.end_date)],
          );
          restoredDays = credit ? toNumber(credit.delta) : null;
        }

        await tx.query(
          `insert into audit_log (leave_request_id, actor_id, action, occurred_at)
           values ($1, $2, 'cancelled', now())`,
          [row.id, actorId],
        );
        await writeRequestCancelled(tx, row.id, row.was_approved);

        return {
          ok: true,
          request: toLeaveRequest(row),
          leaveType: {
            id: row.leave_type_id,
            name: type!.name,
            tracksBalance: type!.tracks_balance,
            maxBackdateDays: type!.max_backdate_days,
          },
          wasApproved: row.was_approved,
          restoredDays,
        } as const;
      });
    },
  };
}
