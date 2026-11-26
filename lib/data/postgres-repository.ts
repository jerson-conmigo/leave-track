import { availableForRequest, buildBalanceSummaries } from "@/lib/data/balance";
import { utcMonthBounds } from "@/lib/data/dates";
import type { LeaveRepository } from "@/lib/data/repositories";
import {
  AUDIT_LOG_LIMIT,
  type AuditAction,
  type LeaveType,
  type LeaveTypeName,
  type RequestStatus,
  type Role,
  type User,
} from "@/lib/data/types";
import { toRequestView } from "@/lib/data/views";
import { type SqlClient, toIso, toNumber } from "@/lib/db/sql";
import { countDays } from "@/lib/format";

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
 * LeaveRepository over Postgres (ADR-LeaveTrack-E003). Every method reads
 * Postgres (migration completed in TASK-015 — backlog B13 closed).
 * All SQL is parameterised; enums are sent and read as text; soft-deleted
 * requests are excluded from every read (rows themselves are never deleted).
 * Date filters use `(ts at time zone 'UTC')::date` — identical to lib/data/dates.ts.
 */
export function createPostgresRepository(sql: SqlClient): LeaveRepository {
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

    /** All-employees event log (/audit), newest first, capped (cursor paging: backlog B21). */
    async listAudit(filter) {
      const rows = await sql.query<{
        id: string;
        request_id: string;
        employee_name: string;
        type_name: LeaveTypeName;
        start_date: string;
        end_date: string;
        action: AuditAction;
        actor_name: string;
        occurred_at: unknown;
      }>(
        `select a.id, r.id request_id, e.name employee_name, t.name type_name,
                r.start_date::text, r.end_date::text, a.action::text, act.name actor_name,
                a.occurred_at
           from audit_log a
           join leave_requests r on r.id = a.leave_request_id
           join users e on e.id = r.user_id
           join leave_types t on t.id = r.leave_type_id
           join users act on act.id = a.actor_id
          where not r.is_deleted
            and ($1::uuid is null or r.user_id = $1::uuid)
            and ($2::date is null or (a.occurred_at at time zone 'UTC')::date >= $2::date)
            and ($3::date is null or (a.occurred_at at time zone 'UTC')::date <= $3::date)
          order by a.occurred_at desc, a.id
          limit $4`,
        [filter.employeeId ?? null, filter.from ?? null, filter.to ?? null, AUDIT_LOG_LIMIT],
      );
      return rows.map((r) => ({
        id: r.id,
        requestId: r.request_id,
        employeeName: r.employee_name,
        leaveType: r.type_name,
        startDate: r.start_date,
        endDate: r.end_date,
        days: countDays(r.start_date, r.end_date),
        action: r.action,
        actorName: r.actor_name,
        occurredAt: toIso(r.occurred_at),
      }));
    },

    /** One employee's full, non-deleted history (US-05, BR-04) — no default date cap. */
    async getEmployeeAuditHistory(userId, filter = {}) {
      const [user] = await sql.query<UserRow & { manager_name: string | null }>(
        `select u.id, u.name, u.email, u.role::text, u.manager_id, m.name manager_name
           from users u left join users m on m.id = u.manager_id
          where u.id = $1`,
        [userId],
      );
      if (!user) return null;

      const requests = await sql.query<{
        id: string;
        type_name: LeaveTypeName;
        start_date: string;
        end_date: string;
        reason: string;
        status: RequestStatus;
        created_at: unknown;
        decided_at: unknown;
        decided_by: string | null;
        decided_by_name: string | null;
        decision_reason: string | null;
      }>(
        `select r.id, t.name type_name, r.start_date::text, r.end_date::text, r.reason,
                r.status::text, r.created_at, r.decided_at, r.decided_by,
                d.name decided_by_name, r.decision_reason
           from leave_requests r
           join leave_types t on t.id = r.leave_type_id
           left join users d on d.id = r.decided_by
          where r.user_id = $1 and not r.is_deleted
            and ($2::date is null or (r.created_at at time zone 'UTC')::date >= $2::date)
            and ($3::date is null or (r.created_at at time zone 'UTC')::date <= $3::date)
          order by r.created_at desc, r.id`,
        [userId, filter.from ?? null, filter.to ?? null],
      );

      const events = requests.length
        ? await sql.query<{
            leave_request_id: string;
            action: AuditAction;
            actor_id: string;
            actor_name: string;
            occurred_at: unknown;
          }>(
            `select a.leave_request_id, a.action::text, a.actor_id, act.name actor_name, a.occurred_at
               from audit_log a join users act on act.id = a.actor_id
              where a.leave_request_id = any($1::uuid[])
              order by a.occurred_at, a.id`,
            [requests.map((r) => r.id)],
          )
        : [];

      return {
        employee: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          managerName: user.manager_name,
        },
        requests: requests.map((r) => ({
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
          decidedBy:
            r.decided_by && r.decided_by_name
              ? { id: r.decided_by, name: r.decided_by_name }
              : null,
          decisionReason: r.decision_reason,
          events: events
            .filter((e) => e.leave_request_id === r.id)
            .map((e) => ({
              action: e.action,
              actorId: e.actor_id,
              actorName: e.actor_name,
              occurredAt: toIso(e.occurred_at),
            })),
        })),
      };
    },

    async listPolicies() {
      const rows = await sql.query<{
        id: string;
        user_id: string;
        user_name: string;
        role: Role;
        type_name: LeaveTypeName;
        accrual_per_month: unknown;
      }>(
        `select p.id, u.id user_id, u.name user_name, u.role::text, t.name type_name,
                p.accrual_per_month
           from leave_policies p
           join users u on u.id = p.user_id
           join leave_types t on t.id = p.leave_type_id`,
      );
      // Sorted in TS with the same comparator as the mock (locale-aware, parity-tested).
      return rows
        .map((r) => ({
          id: r.id,
          userId: r.user_id,
          userName: r.user_name,
          role: r.role,
          leaveType: r.type_name,
          accrualPerMonth: toNumber(r.accrual_per_month),
        }))
        .sort(
          (a, b) => a.userName.localeCompare(b.userName) || a.leaveType.localeCompare(b.leaveType),
        );
    },

    async getOrgStats(now = new Date()) {
      const [monthStart, nextMonth] = utcMonthBounds(now);
      const [row] = await sql.query<{ pending: number; approved: number; with_policy: number }>(
        `select
           (select count(*)::int from leave_requests where status = 'pending' and not is_deleted) pending,
           (select count(*)::int from leave_requests
             where status = 'approved' and not is_deleted
               and decided_at >= $1::timestamptz and decided_at < $2::timestamptz) approved,
           (select count(distinct user_id)::int from leave_policies) with_policy`,
        [monthStart, nextMonth],
      );
      return {
        pendingCount: row?.pending ?? 0,
        approvedThisMonth: row?.approved ?? 0,
        employeeCount: row?.with_policy ?? 0,
      };
    },
  };
}
