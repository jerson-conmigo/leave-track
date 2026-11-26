import type { LeaveRequest, LeaveTypeName, RequestStatus } from "@/lib/data/types";
import { type SqlClient, toIso, toNumber } from "@/lib/db/sql";
import type { DecideStore, SubmitStore } from "@/lib/leave-requests/store";

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
      const [row] = await sql.query<{ id: string; name: LeaveTypeName; tracks_balance: boolean }>(
        `select id, name, tracks_balance from leave_types where id = $1`,
        [id],
      );
      return row ? { id: row.id, name: row.name, tracksBalance: row.tracks_balance } : null;
    },

    async getRequester(userId) {
      const [row] = await sql.query<{
        id: string;
        name: string;
        manager_id: string | null;
        manager_name: string | null;
        manager_email: string | null;
      }>(
        `select u.id, u.name, m.id manager_id, m.name manager_name, m.email manager_email
         from users u left join users m on m.id = u.manager_id
         where u.id = $1`,
        [userId],
      );
      if (!row) return null;
      return {
        id: row.id,
        name: row.name,
        manager:
          row.manager_id && row.manager_name && row.manager_email
            ? { id: row.manager_id, name: row.manager_name, email: row.manager_email }
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

    insertRequestWithAudit(input) {
      return sql.transaction(async (tx) => {
        const [row] = await tx.query<RequestRow>(
          `insert into leave_requests (user_id, leave_type_id, start_date, end_date, reason, status)
           values ($1, $2, $3, $4, $5, 'pending')
           returning ${REQUEST_COLUMNS}`,
          [input.userId, input.leaveTypeId, input.startDate, input.endDate, input.reason],
        );
        if (!row) throw new Error("insert into leave_requests returned no row");
        await tx.query(
          // occurred_at is taken from the row server-side (microsecond-exact) —
          // never round-tripped through a JS Date (ms precision). Review TASK-011 #1.
          `insert into audit_log (leave_request_id, actor_id, action, occurred_at)
           select id, user_id, 'submitted', created_at from leave_requests where id = $1`,
          [row.id],
        );
        return toLeaveRequest(row);
      });
    },
  };
}

type DecidedRow = RequestRow & {
  type_name: LeaveTypeName;
  tracks_balance: boolean;
  employee_name: string;
  employee_email: string;
  manager_name: string;
};

/**
 * DecideStore over Postgres (TASK-014). One transaction:
 *  (a) UPDATE scoped by `u.manager_id = $2` AND guarded by `r.status = 'pending'` —
 *      BR-02 + no double decision, enforced in the same statement;
 *  (b) on 0 rows, a diagnostic SELECT classifies the outcome (nothing is written);
 *  (c) approve on a tracked type: relative upsert-decrement of that request's own
 *      leave type (`balance - $days`, row-locked — no read-modify-write);
 *  (d) decision audit row with occurred_at = now() (= decided_at; transaction time).
 * The unique index audit_log_one_decision_per_request backstops (a).
 */
export function createPostgresDecideStore(sql: SqlClient): DecideStore {
  return {
    decideWithAudit({ requestId, managerId, decision, reason, daysFor }) {
      const status = decision === "approve" ? "approved" : "rejected";
      return sql.transaction(async (tx) => {
        const [row] = await tx.query<DecidedRow>(
          `update leave_requests r
              set status = ($3::text)::public.request_status, decided_by = $2, decided_at = now(),
                  decision_reason = $4::text
             from users u, leave_types t, users m
            where r.id = $1 and u.id = r.user_id and u.manager_id = $2
              and t.id = r.leave_type_id and m.id = $2
              and r.status = 'pending' and not r.is_deleted
           returning r.id, r.user_id, r.leave_type_id, r.start_date::text, r.end_date::text,
                     r.reason, r.status::text, r.decided_by, r.decided_at, r.decision_reason,
                     r.is_deleted, r.created_at, t.name type_name, t.tracks_balance,
                     u.name employee_name, u.email employee_email, m.name manager_name`,
          [requestId, managerId, status, reason ?? null],
        );

        if (!row) {
          const [found] = await tx.query<{
            status: string;
            is_deleted: boolean;
            manager_id: string | null;
          }>(
            `select r.status::text, r.is_deleted, u.manager_id
               from leave_requests r join users u on u.id = r.user_id
              where r.id = $1`,
            [requestId],
          );
          if (!found || found.is_deleted) return { ok: false, reason: "not_found" } as const;
          // Not-your-report wins over already-decided: never reveal another team's state.
          if (found.manager_id !== managerId) return { ok: false, reason: "not_report" } as const;
          return { ok: false, reason: "already_decided" } as const;
        }

        const days = daysFor(row.start_date, row.end_date);
        let balanceAfter: number | null = null;
        if (decision === "approve" && row.tracks_balance) {
          const [bal] = await tx.query<{ balance: unknown }>(
            `insert into leave_balances (user_id, leave_type_id, balance, updated_at)
             values ($1, $2, 0 - $3::numeric, now())
             on conflict (user_id, leave_type_id)
             do update set balance = leave_balances.balance - $3::numeric, updated_at = now()
             returning balance`,
            [row.user_id, row.leave_type_id, days],
          );
          balanceAfter = bal ? toNumber(bal.balance) : null;
        }

        await tx.query(
          `insert into audit_log (leave_request_id, actor_id, action, occurred_at)
           values ($1, $2, ($3::text)::public.audit_action, now())`,
          [row.id, managerId, status],
        );

        return {
          ok: true,
          request: toLeaveRequest(row),
          leaveType: {
            id: row.leave_type_id,
            name: row.type_name,
            tracksBalance: row.tracks_balance,
          },
          employee: { id: row.user_id, name: row.employee_name, email: row.employee_email },
          manager: { id: managerId, name: row.manager_name },
          days,
          balanceAfter,
        } as const;
      });
    },
  };
}
