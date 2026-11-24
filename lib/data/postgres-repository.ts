import { buildBalanceSummaries } from "@/lib/data/balance";
import type { LeaveRepository } from "@/lib/data/repositories";
import type { LeaveType, LeaveTypeName, RequestStatus, Role, User } from "@/lib/data/types";
import { toRequestView } from "@/lib/data/views";
import { type SqlClient, toIso, toNumber } from "@/lib/db/sql";

type UserRow = { id: string; name: string; email: string; role: Role; manager_id: string | null };
const USER_COLUMNS = `id, name, email, role::text, manager_id`;
const toUser = (r: UserRow): User => ({
  id: r.id,
  name: r.name,
  email: r.email,
  role: r.role,
  managerId: r.manager_id,
});

/**
 * LeaveRepository over Postgres (ADR-LeaveTrack-E003). TASK-012 moves the
 * employee-facing reads; the rest still delegate to `fallback` (the mock
 * repository) until their tasks land — backlog B13:
 *   listTeamRequests → TASK-013 · listAudit / listPolicies / getOrgStats → TASK-015
 * All SQL is parameterised; soft-deleted requests are excluded from every read.
 */
export function createPostgresRepository(
  sql: SqlClient,
  fallback: LeaveRepository,
): LeaveRepository {
  async function listLeaveTypes(): Promise<LeaveType[]> {
    const rows = await sql.query<{ id: string; name: LeaveTypeName; tracks_balance: boolean }>(
      `select id, name, tracks_balance from leave_types
       order by array_position(array['Vacation', 'Sick', 'Unpaid'], name), name`,
    );
    return rows.map((r) => ({ id: r.id, name: r.name, tracksBalance: r.tracks_balance }));
  }

  return {
    async getUserById(id) {
      const [row] = await sql.query<UserRow>(`select ${USER_COLUMNS} from users where id = $1`, [
        id,
      ]);
      return row ? toUser(row) : null;
    },

    async listUsers() {
      return (await sql.query<UserRow>(`select ${USER_COLUMNS} from users order by id`)).map(
        toUser,
      );
    },

    listLeaveTypes,

    async getBalances(userId) {
      const [leaveTypes, balances, policies, pending, [accrual]] = await Promise.all([
        listLeaveTypes(),
        sql.query<{ leave_type_id: string; balance: unknown }>(
          `select leave_type_id, balance from leave_balances where user_id = $1`,
          [userId],
        ),
        sql.query<{ leave_type_id: string; accrual_per_month: unknown }>(
          `select leave_type_id, accrual_per_month from leave_policies where user_id = $1`,
          [userId],
        ),
        sql.query<{ leave_type_id: string; start_date: string; end_date: string }>(
          `select leave_type_id, start_date::text, end_date::text from leave_requests
           where user_id = $1 and status = 'pending' and not is_deleted`,
          [userId],
        ),
        // AC1: "as of the last completed accrual run" — not balance.updated_at,
        // which approvals also change (TASK-014).
        sql.query<{ ran_at: unknown }>(`select max(ran_at) ran_at from accrual_runs`),
      ]);
      return buildBalanceSummaries({
        leaveTypes,
        balances: balances.map((b) => ({
          leaveTypeId: b.leave_type_id,
          balance: toNumber(b.balance),
        })),
        policies: policies.map((p) => ({
          leaveTypeId: p.leave_type_id,
          accrualPerMonth: toNumber(p.accrual_per_month),
        })),
        pendingRanges: pending.map((p) => ({
          leaveTypeId: p.leave_type_id,
          startDate: p.start_date,
          endDate: p.end_date,
        })),
        lastAccrualAt: accrual?.ran_at == null ? null : toIso(accrual.ran_at),
      });
    },

    async listMyRequests(userId) {
      // Served by leave_requests_user_created_idx (user_id, created_at desc).
      const rows = await sql.query<{
        id: string;
        type_name: LeaveTypeName;
        start_date: string;
        end_date: string;
        reason: string;
        status: RequestStatus;
        created_at: unknown;
        decided_at: unknown;
        decided_by_name: string | null;
      }>(
        `select r.id, t.name type_name, r.start_date::text, r.end_date::text, r.reason,
                r.status::text, r.created_at, r.decided_at, d.name decided_by_name
         from leave_requests r
         join leave_types t on t.id = r.leave_type_id
         left join users d on d.id = r.decided_by
         where r.user_id = $1 and not r.is_deleted
         order by r.created_at desc`,
        [userId],
      );
      return rows.map((r) =>
        toRequestView(
          {
            id: r.id,
            startDate: r.start_date,
            endDate: r.end_date,
            reason: r.reason,
            status: r.status,
            createdAt: toIso(r.created_at),
            decidedAt: r.decided_at == null ? null : toIso(r.decided_at),
          },
          r.type_name,
          r.decided_by_name,
        ),
      );
    },

    // ── Still mock until their tasks (backlog B13) ───────────────────────────
    listTeamRequests: (managerId, opts) => fallback.listTeamRequests(managerId, opts), // TASK-013
    listAudit: (filter) => fallback.listAudit(filter), // TASK-015
    listPolicies: () => fallback.listPolicies(), // TASK-015
    getOrgStats: () => fallback.getOrgStats(), // TASK-015
  };
}
