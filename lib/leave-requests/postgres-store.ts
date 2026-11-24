import type { LeaveRequest, LeaveTypeName, RequestStatus } from "@/lib/data/types";
import { type SqlClient, toIso, toNumber } from "@/lib/db/sql";
import type { SubmitStore } from "@/lib/leave-requests/store";

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
          `insert into audit_log (leave_request_id, actor_id, action, occurred_at)
           values ($1, $2, 'submitted', $3)`,
          [row.id, input.userId, row.created_at],
        );
        return toLeaveRequest(row);
      });
    },
  };
}
