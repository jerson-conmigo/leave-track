import {
  auditLog,
  leaveBalances,
  leavePolicies,
  leaveRequests,
  leaveTypes,
  users,
} from "@/lib/data/mock/fixtures";

function createMockDb() {
  return {
    leaveTypes: structuredClone(leaveTypes),
    users: structuredClone(users),
    leaveBalances: structuredClone(leaveBalances),
    leavePolicies: structuredClone(leavePolicies),
    leaveRequests: structuredClone(leaveRequests),
    auditLog: structuredClone(auditLog),
  };
}

type MockDb = ReturnType<typeof createMockDb>;
const globalForMock = globalThis as unknown as { __leaveTrackMockDb?: MockDb };

/**
 * Mutable in-memory database for local dev without DATABASE_URL.
 * A deep copy of the fixtures, so writes (e.g. a submitted request) show up in
 * mock reads while `fixtures.ts` stays the immutable seed mirror that the
 * schema drift tests compare against. Per-process only — never production data.
 *
 * Held on globalThis: Next bundles route handlers and pages into SEPARATE module
 * graphs, so a plain module-level object would exist once per bundle and an
 * API write would be invisible to pages.
 */
export const mockDb: MockDb = (globalForMock.__leaveTrackMockDb ??= createMockDb());
