import { availableForRequest, buildBalanceSummaries } from "@/lib/data/balance";
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
 * LeaveRepository over Postgres (ADR-LeaveTrack-E003). TASK-012 moved the
 * employee-facing reads, TASK-013 the manager queue; the rest still delegate to
 * `fallback` (the mock repository) until their task lands — backlog B13:
 *   listAudit / listPolicies / getOrgStats → TASK-015
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

    /**
     * Manager queue (US-04, BR-02). EVERY statement is scoped in SQL by
     * `u.manager_id = $1` with the session manager's id — never filtered in app
     * code. Scope is read from users.manager_id at query time, so an org-chart
     * change moves pending requests to the new manager's queue (AC2). Three
     * round trips regardless of team size (no query per row).
     */
    async listTeamRequests(managerId, opts) {
      const status = opts?.status ?? null;
      const [rows, balances, pending] = await Promise.all([
        sql.query<{
          id: string;
          user_id: string;
          leave_type_id: string;
          type_name: LeaveTypeName;
          tracks_balance: boolean;
          start_date: string;
          end_date: string;
          reason: string;
          status: RequestStatus;
          created_at: unknown;
          decided_at: unknown;
          decided_by_name: string | null;
          employee_name: string;
          employee_email: string;
        }>(
          `select r.id, r.user_id, r.leave_type_id, t.name type_name, t.tracks_balance,
                  r.start_date::text, r.end_date::text, r.reason, r.status::text,
                  r.created_at, r.decided_at, d.name decided_by_name,
                  u.name employee_name, u.email employee_email
           from leave_requests r
           join users u on u.id = r.user_id
           join leave_types t on t.id = r.leave_type_id
           left join users d on d.id = r.decided_by
           where u.manager_id = $1 and not r.is_deleted
             and ($2::text is null or r.status::text = $2::text)
           order by r.created_at desc`,
          [managerId, status],
        ),
        sql.query<{ user_id: string; leave_type_id: string; balance: unknown }>(
          `select b.user_id, b.leave_type_id, b.balance
           from leave_balances b
           join users u on u.id = b.user_id
           where u.manager_id = $1`,
          [managerId],
        ),
        sql.query<{
          id: string;
          user_id: string;
          leave_type_id: string;
          start_date: string;
          end_date: string;
        }>(
          `select r.id, r.user_id, r.leave_type_id, r.start_date::text, r.end_date::text
           from leave_requests r
           join users u on u.id = r.user_id
           where u.manager_id = $1 and r.status = 'pending' and not r.is_deleted`,
          [managerId],
        ),
      ]);
      return rows.map((r) => ({
        ...toRequestView(
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
        employee: { id: r.user_id, name: r.employee_name, email: r.employee_email },
        balanceAvailable: availableForRequest({
          tracksBalance: r.tracks_balance,
          confirmed: (() => {
            const b = balances.find(
              (x) => x.user_id === r.user_id && x.leave_type_id === r.leave_type_id,
            );
            return b ? toNumber(b.balance) : undefined;
          })(),
          pendingRanges: pending
            .filter((p) => p.user_id === r.user_id)
            .map((p) => ({
              id: p.id,
              leaveTypeId: p.leave_type_id,
              startDate: p.start_date,
              endDate: p.end_date,
            })),
          request: { id: r.id, leaveTypeId: r.leave_type_id },
        }),
      }));
    },

    // ── Still mock until TASK-015 (backlog B13) ──────────────────────────────
    listAudit: (filter) => fallback.listAudit(filter), // TASK-015
    listPolicies: () => fallback.listPolicies(), // TASK-015
    getOrgStats: () => fallback.getOrgStats(), // TASK-015
  };
}
