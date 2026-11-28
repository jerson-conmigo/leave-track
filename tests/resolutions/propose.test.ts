import type { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LEAVE_TYPE_IDS, USER_IDS } from "@/lib/data/mock/fixtures";
import { mockRepository } from "@/lib/data/mock/repository";
import { mockDb, resetMockDb } from "@/lib/data/mock/store";
import { createPostgresRepository } from "@/lib/data/postgres-repository";
import type { LeaveRepository } from "@/lib/data/repositories";
import type { SqlClient } from "@/lib/db/sql";
import { decideLeaveRequest } from "@/lib/leave-requests/decide";
import { memoryDecideStore } from "@/lib/leave-requests/memory-store";
import type { Notifier } from "@/lib/leave-requests/notifier";
import { createPostgresDecideStore } from "@/lib/leave-requests/postgres-store";
import type { DecideStore } from "@/lib/leave-requests/store";
import { memoryResolutionStore } from "@/lib/resolutions/memory-store";
import { createPostgresResolutionStore } from "@/lib/resolutions/postgres-store";
import { proposeResolution } from "@/lib/resolutions/propose";
import type { ResolutionStore } from "@/lib/resolutions/store";
import { earliestRecoveryStart } from "@/lib/resolutions/validation";
import { closeAfterEachTest, createTestDb } from "../db/helpers";

/**
 * TASK-032 (US-09) — HR proposes a resolution, on BOTH stores. Sam's Vacation goes to −1.25 by
 * approving his 5-day request (3.75 available); HR (Carla) proposes how to resolve it.
 */
const { sam, maya, carla, ana } = USER_IDS;
const { Vacation } = LEAVE_TYPE_IDS;
const SAM_VACATION = "20000000-0000-4000-8000-000000000007";
type Actor = { userId: string; role: "employee" | "manager" | "hr_admin"; name: string };
const HR: Actor = { userId: carla, role: "hr_admin", name: "Carla Diaz" };
const start = earliestRecoveryStart(new Date());

type Backend = {
  store: ResolutionStore;
  decide: DecideStore;
  repo: LeaveRepository;
  setAccrual(v: number): Promise<void>;
  setBalance(v: number): Promise<void>;
  events(): Promise<number>;
};
let db: PGlite;
let sql: SqlClient;
const track = closeAfterEachTest(); // B30

async function postgres(): Promise<Backend> {
  ({ db, sql } = await createTestDb());
  track(db);
  return {
    store: createPostgresResolutionStore(sql),
    decide: createPostgresDecideStore(sql),
    repo: createPostgresRepository(sql),
    async setAccrual(v) {
      await db.query(
        `update leave_policies set accrual_per_month = $3 where user_id = $1 and leave_type_id = $2`,
        [sam, Vacation, v],
      );
    },
    async setBalance(v) {
      await db.query(
        `update leave_balances set balance = $3 where user_id = $1 and leave_type_id = $2`,
        [sam, Vacation, v],
      );
    },
    async events() {
      return (
        await db.query<{ n: number }>(`select count(*)::int n from balance_resolution_events`)
      ).rows[0]!.n;
    },
  };
}
async function memory(): Promise<Backend> {
  resetMockDb();
  return {
    store: memoryResolutionStore,
    decide: memoryDecideStore,
    repo: mockRepository,
    async setAccrual(v) {
      mockDb.leavePolicies.find(
        (p) => p.userId === sam && p.leaveTypeId === Vacation,
      )!.accrualPerMonth = v;
    },
    async setBalance(v) {
      mockDb.leaveBalances.find((b) => b.userId === sam && b.leaveTypeId === Vacation)!.balance = v;
    },
    async events() {
      return mockDb.balanceResolutionEvents.length;
    },
  };
}

const notifier: Notifier = {
  leaveRequestSubmitted: vi.fn().mockResolvedValue(undefined),
  leaveRequestDecided: vi.fn().mockResolvedValue(undefined),
};
afterEach(() => resetMockDb());

/** Assert an AppError's code AND message (toMatchObject doesn't check an Error's message). */
async function rejectsWith(promise: Promise<unknown>, code: string, message?: RegExp) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e as { code?: string; message?: string },
  );
  expect(error, "expected a rejection").not.toBeNull();
  expect(error!.code).toBe(code);
  if (message) expect(error!.message).toMatch(message);
}

describe.each<[string, () => Promise<Backend>]>([
  ["postgres", postgres],
  ["memory", memory],
])("%s store — HR proposes a resolution", (_name, make) => {
  let b: Backend;
  beforeEach(async () => {
    b = await make();
    await decideLeaveRequest(
      { userId: maya, role: "manager" },
      SAM_VACATION,
      { decision: "approve" },
      {
        store: b.decide,
        notifier,
      },
    ); // Sam's Vacation: 3.75 − 5 = −1.25
    await b.setAccrual(1.25);
  });
  const propose = (input: Record<string, unknown>, session: Actor = HR) =>
    proposeResolution(
      session,
      { userId: sam, leaveTypeId: Vacation, ...input },
      { store: b.store },
    );

  it("AC1: the queue lists only tracked balances below 0 with no open resolution", async () => {
    const queue = await b.repo.listResolutionQueue();
    expect(queue.map((q) => [q.userId, q.leaveType, q.deficit])).toContainEqual([
      sam,
      "Vacation",
      1.25,
    ]);
    expect(queue.every((q) => q.balance < 0 && q.leaveType !== "Unpaid")).toBe(true);
    await propose({ unpaidDays: 1.25, recoveryDays: 0 });
    expect((await b.repo.listResolutionQueue()).some((q) => q.userId === sam)).toBe(false);
  });

  it("AC2: an invalid split, a deduction above the accrual rate, 0 accrual or an early start → 400", async () => {
    await rejectsWith(propose({ unpaidDays: 1, recoveryDays: 0 }), "VALIDATION_ERROR");
    await b.setAccrual(0.5);
    await rejectsWith(
      propose({ unpaidDays: 0.25, recoveryDays: 1, recoveryStartPeriod: start, recoveryMonths: 1 }),
      "VALIDATION_ERROR",
      /accrual rate/,
    );
    await b.setAccrual(0);
    await rejectsWith(
      propose({ unpaidDays: 0, recoveryDays: 1.25, recoveryStartPeriod: start, recoveryMonths: 5 }),
      "VALIDATION_ERROR",
    );
    await b.setAccrual(1.25); // isolate the start-month rule from the accrual cap
    const thisMonth = `${new Date().toISOString().slice(0, 7)}-01`;
    await rejectsWith(
      propose({
        unpaidDays: 0,
        recoveryDays: 1.25,
        recoveryStartPeriod: thisMonth,
        recoveryMonths: 1,
      }),
      "VALIDATION_ERROR",
      /next month/,
    );
  });

  it("AC3: one transaction — resolution, event, notification; respond_by fixed at +3 days; second → 409", async () => {
    const { resolution } = await propose({
      unpaidDays: 0.25,
      recoveryDays: 1,
      recoveryStartPeriod: start,
      recoveryMonths: 1,
    });
    expect(resolution).toMatchObject({ status: "proposed", deficit: 1.25, monthlyDeduction: 1 });
    const days =
      (Date.parse(resolution.respondBy) - Date.parse(resolution.proposedAt)) / 86_400_000;
    expect(Math.round(days)).toBe(3);
    expect(await b.events()).toBe(1);
    const inbox = await b.repo.listNotifications(sam);
    expect(inbox.find((n) => n.type === "resolution.proposed")?.payload).toMatchObject({
      resolutionId: resolution.id,
      deficit: 1.25,
    });
    expect((await b.repo.listResolutions("awaiting")).map((r) => r.id)).toEqual([resolution.id]);
    await rejectsWith(propose({ unpaidDays: 1.25, recoveryDays: 0 }), "CONFLICT");
  });

  it("AC3: a balance that is no longer negative is refused (re-read in the transaction)", async () => {
    await b.setBalance(0);
    await expect(propose({ unpaidDays: 1.25, recoveryDays: 0 })).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(await b.events()).toBe(0);
  });

  it("AC4: non-HR users and HR on their own balance get 403", async () => {
    await expect(
      propose(
        { unpaidDays: 1.25, recoveryDays: 0 },
        { userId: maya, role: "manager", name: "Maya" },
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      propose(
        { unpaidDays: 1.25, recoveryDays: 0 },
        { userId: ana, role: "employee", name: "Ana" },
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await rejectsWith(
      proposeResolution(
        HR,
        { userId: carla, leaveTypeId: Vacation, unpaidDays: 1, recoveryDays: 0 },
        { store: b.store },
      ),
      "FORBIDDEN",
      /your own balance/,
    );
  });
});
