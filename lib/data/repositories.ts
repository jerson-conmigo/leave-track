import "server-only";
import { getSql } from "@/lib/db/postgres";
import { logger } from "@/lib/logger";
import { mockRepository } from "@/lib/data/mock/repository";
import { createPostgresRepository } from "@/lib/data/postgres-repository";
import type {
  AuditEntryView,
  AuditFilter,
  AuditHistoryFilter,
  BalanceSummary,
  EmployeeAuditHistory,
  LeaveRequestView,
  LeaveType,
  OrgStats,
  PolicyView,
  TeamRequestView,
  User,
} from "@/lib/data/types";

/**
 * Data-access contract for the whole app. Pages depend ONLY on this interface.
 *
 * Source is chosen by the SAME switch as the write path (lib/db/postgres.ts →
 * getSql()), so reads and writes can never point at different stores:
 *   DATABASE_URL set   → Postgres for every method (createPostgresRepository;
 *                        migration completed in TASK-015 — backlog B13 closed)
 *   DATABASE_URL unset → in-memory mock (`mockRepository`)
 * Rules for the Postgres implementation:
 *   - `listTeamRequests` MUST filter `WHERE public.can_decide(:approverId, <requester>)` in SQL
 *     (BR-02/BR-10, TASK-026) — tests/data/postgres-repository.test.ts asserts it structurally.
 *   - Every leave_requests read MUST exclude `is_deleted = true`; never hard-delete.
 */
export interface LeaveRepository {
  getUserById(id: string): Promise<User | null>;
  /**
   * The user linked to a Supabase Auth identity (users.auth_user_id, set only when an
   * administrator invites them — TASK-024). Never matches by email. Null if unlinked.
   */
  getUserByAuthUserId(authUserId: string): Promise<User | null>;
  listUsers(): Promise<User[]>;
  listLeaveTypes(): Promise<LeaveType[]>;
  getBalances(userId: string): Promise<BalanceSummary[]>;
  listMyRequests(userId: string): Promise<LeaveRequestView[]>;
  listTeamRequests(approverId: string, opts?: { status?: "pending" }): Promise<TeamRequestView[]>;
  /** All-employees event log, newest first, capped at AUDIT_LOG_LIMIT. */
  listAudit(filter: AuditFilter): Promise<AuditEntryView[]>;
  /** One employee's non-deleted requests with decisions and events; null if no such user. */
  getEmployeeAuditHistory(
    userId: string,
    filter?: AuditHistoryFilter,
  ): Promise<EmployeeAuditHistory | null>;
  listPolicies(): Promise<PolicyView[]>;
  /** `now` defines "this month" (UTC); injectable for tests. */
  getOrgStats(now?: Date): Promise<OrgStats>;
}

function selectRepository(): LeaveRepository {
  const sql = getSql();
  logger.info({ reads: sql ? "postgres" : "memory" }, "repository source selected");
  return sql ? createPostgresRepository(sql) : mockRepository;
}

export const repository: LeaveRepository = selectRepository();
