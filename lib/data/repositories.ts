import "server-only";
import { getSql } from "@/lib/db/postgres";
import { logger } from "@/lib/logger";
import { mockRepository } from "@/lib/data/mock/repository";
import { createPostgresRepository } from "@/lib/data/postgres-repository";
import type {
  AuditEntryView,
  AuditFilter,
  BalanceSummary,
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
 *   DATABASE_URL set   → Postgres (createPostgresRepository; some methods still
 *                        delegate to mock until TASK-013/015 — backlog B13)
 *   DATABASE_URL unset → in-memory mock (`mockRepository`)
 * Rules for the Postgres implementation:
 *   - `listTeamRequests` MUST filter `WHERE manager_id = :managerId` in SQL (BR-02).
 *   - Every leave_requests read MUST exclude `is_deleted = true`; never hard-delete.
 */
export interface LeaveRepository {
  getUserById(id: string): Promise<User | null>;
  listUsers(): Promise<User[]>;
  listLeaveTypes(): Promise<LeaveType[]>;
  getBalances(userId: string): Promise<BalanceSummary[]>;
  listMyRequests(userId: string): Promise<LeaveRequestView[]>;
  listTeamRequests(managerId: string, opts?: { status?: "pending" }): Promise<TeamRequestView[]>;
  listAudit(filter: AuditFilter): Promise<AuditEntryView[]>;
  listPolicies(): Promise<PolicyView[]>;
  getOrgStats(): Promise<OrgStats>;
}

function selectRepository(): LeaveRepository {
  const sql = getSql();
  logger.info({ reads: sql ? "postgres" : "memory" }, "repository source selected");
  return sql ? createPostgresRepository(sql, mockRepository) : mockRepository;
}

export const repository: LeaveRepository = selectRepository();
