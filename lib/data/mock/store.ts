import {
  accrualRuns,
  auditLog,
  leaveBalances,
  leavePolicies,
  leaveRequests,
  leaveTypes,
  users,
} from "@/lib/data/mock/fixtures";
import type { LeaveBalance, LedgerEntry } from "@/lib/data/types";
import type { Notification, OutboxEntry } from "@/lib/notifications/types";
import type { MockRecovery, MockResolution, MockResolutionEvent } from "@/lib/resolutions/types";

/** TASK-029: one opening ledger row per fixture balance (as the migration and seed backfill). */
function openingLedger(balances: readonly LeaveBalance[]): LedgerEntry[] {
  return balances.map((b, i) => ({
    id: `60000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    userId: b.userId,
    leaveTypeId: b.leaveTypeId,
    delta: b.balance,
    balanceAfter: b.balance,
    source: "opening",
    sourceKey: `opening:${b.userId}:${b.leaveTypeId}`,
    leaveRequestId: null,
    actorId: null,
    occurredAt: b.updatedAt,
  }));
}

function createMockDb() {
  return {
    leaveTypes: structuredClone(leaveTypes),
    users: structuredClone(users),
    leaveBalances: structuredClone(leaveBalances),
    leavePolicies: structuredClone(leavePolicies),
    leaveRequests: structuredClone(leaveRequests),
    auditLog: structuredClone(auditLog),
    accrualRuns: structuredClone(accrualRuns),
    // TASK-029: the append-only balance ledger, starting from the fixtures' opening balances.
    balanceLedger: openingLedger(leaveBalances),
    // TASK-030: in-app notifications and their outbox rows (start empty).
    notifications: [] as Notification[],
    notificationOutbox: [] as OutboxEntry[],
    // TASK-032: negative-balance resolutions (mirrors balance_resolutions / _events / app_settings).
    balanceResolutions: [] as MockResolution[],
    balanceResolutionEvents: [] as MockResolutionEvent[],
    balanceRecoveries: [] as MockRecovery[], // TASK-033
    appSettings: [{ key: "resolution_response_days", value: 3 }] as {
      key: string;
      value: number;
    }[],
    // users.auth_user_id links (TASK-024). Empty: the mock sign-in never uses them.
    authLinks: [] as { authUserId: string; userId: string }[],
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

/**
 * Restore every mockDb collection to the fixtures — IN PLACE. The mock
 * repository and memory stores hold references to these arrays from import
 * time, so reassigning (`mockDb.leaveRequests = …`) would leave them reading
 * stale data. Used only by tests and the gated e2e reset route.
 */
export function resetMockDb(): void {
  const fresh = createMockDb();
  for (const key of Object.keys(fresh) as (keyof MockDb)[]) {
    const target = mockDb[key] as unknown[];
    target.splice(0, target.length, ...(fresh[key] as unknown[]));
  }
}

/**
 * TASK-029: append one ledger row (memory mirror of balance_ledger). Like the database, a
 * duplicate source_key is refused with a Postgres-shaped error (23505 +
 * balance_ledger_source_key_key), so lib/db/errors.ts maps it identically. Entries are never
 * updated or removed (except resetMockDb, for test isolation).
 */
export function appendLedger(entry: Omit<LedgerEntry, "id">): LedgerEntry {
  if (mockDb.balanceLedger.some((e) => e.sourceKey === entry.sourceKey)) {
    throw Object.assign(new Error("balance_ledger_source_key_key violated"), {
      code: "23505",
      constraint: "balance_ledger_source_key_key",
    });
  }
  const row: LedgerEntry = { id: crypto.randomUUID(), ...entry };
  mockDb.balanceLedger.push(row);
  return row;
}

/**
 * TASK-030: run a memory store's write section all-or-nothing, like a database transaction —
 * if `fn` throws, every collection is restored IN PLACE (same arrays; see resetMockDb) to its
 * state before the call, and the error is rethrown. The mock DB is small, so a snapshot is cheap.
 */
export function atomically<T>(fn: () => T): T {
  const snapshot = structuredClone(mockDb);
  try {
    return fn();
  } catch (error) {
    for (const key of Object.keys(snapshot) as (keyof MockDb)[]) {
      const target = mockDb[key] as unknown[];
      target.splice(0, target.length, ...(snapshot[key] as unknown[]));
    }
    throw error;
  }
}
