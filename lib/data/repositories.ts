import "server-only";
import { mockRepository } from "@/lib/data/mock/repository";
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
 * Day 0: backed by in-memory fixtures (`mockRepository`).
 * Day 1: replace with a Supabase-backed implementation. Rules for it:
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

export const repository: LeaveRepository = mockRepository;
