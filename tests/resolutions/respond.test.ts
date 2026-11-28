import type { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LEAVE_TYPE_IDS, USER_IDS } from "@/lib/data/mock/fixtures";
import { mockRepository } from "@/lib/data/mock/repository";
import { mockDb, resetMockDb } from "@/lib/data/mock/store";
import { createPostgresRepository } from "@/lib/data/postgres-repository";
import type { LeaveRepository } from "@/lib/data/repositories";
import { decideLeaveRequest } from "@/lib/leave-requests/decide";
import { memoryDecideStore } from "@/lib/leave-requests/memory-store";
import type { Notifier } from "@/lib/leave-requests/notifier";
import { createPostgresDecideStore } from "@/lib/leave-requests/postgres-store";
import type { DecideStore } from "@/lib/leave-requests/store";
import { finalizeResolution, reproposeResolution } from "@/lib/resolutions/hr-review";
import { memoryResolutionStore } from "@/lib/resolutions/memory-store";
import { createPostgresResolutionStore } from "@/lib/resolutions/postgres-store";
import { proposeResolution } from "@/lib/resolutions/propose";
import { acceptResolution, declineResolution } from "@/lib/resolutions/respond";
import type { ResolutionStore } from "@/lib/resolutions/store";
import { earliestRecoveryStart } from "@/lib/resolutions/validation";
import { closeAfterEachTest, createTestDb } from "../db/helpers";

/**
 * TASK-033 (US-10) — the employee responds; HR re-proposes once or decides (D6). On BOTH stores.
 * Sam's Vacation goes to −1.25 when Maya approves his 5-day request (3.75 available).
 */
const { sam, maya, carla, ana } = USER_IDS;
const { Vacation } = LEAVE_TYPE_IDS;
const SAM_VACATION = "20000000-0000-4000-8000-000000000007";
type Actor = { userId: string; role: "employee" | "manager" | "hr_admin"; name: string };
const HR: Actor = { userId: carla, role: "hr_admin", name: "Carla Diaz" };
const SAM: Actor = { userId: sam, role: "employee", name: "Sam" };
const start = earliestRecoveryStart(new Date());

type Ledger = { source: string; delta: number; balanceAfter: number };
type Backend = {
  store: ResolutionStore;
  decide: DecideStore;
  repo: LeaveRepository;
  setBalance(v: number): Promise<void>;
  balance(): Promise<number>;
  ledger(id: string): Promise<Ledger[]>;
  schedule(id: string): Promise<{ period: string; amount: number }[]>;
  events(): Promise<number>;
  expire(id: string): Promise<void>;
  status(id: string): Promise<string>;
};
let db: PGlite;
const track = closeAfterEachTest(); // B30

async function postgres(): Promise<Backend> {
  const made = await createTestDb();
  db = made.db;
  track(db);
  const one = async <T>(q: string, p: unknown[] = []) => (await db.query<T>(q, p)).rows;
  return {
    store: createPostgresResolutionStore(made.sql),
    decide: createPostgresDecideStore(made.sql),
    repo: createPostgresRepository(made.sql),
    async setBalance(v) {
      await db.query(
        `update leave_balances set balance = $3 where user_id = $1 and leave_type_id = $2`,
        [sam, Vacation, v],
      );
    },
    async balance() {
      return Number(
        (
          await one<{ b: string }>(
            `select balance::text b from leave_balances where user_id = $1 and leave_type_id = $2`,
            [sam, Vacation],
          )
        )[0]!.b,
      );
    },
    async ledger(id) {
      return (
        await one<{ source: string; delta: string; after: string }>(
          `select source, delta::text delta, balance_after::text after from balance_ledger
            where source_key like 'resolution:' || $1 || ':%' order by occurred_at, source`,
          [id],
        )
      ).map((r) => ({ source: r.source, delta: Number(r.delta), balanceAfter: Number(r.after) }));
    },
    async schedule(id) {
      return (
        await one<{ period: string; amount: string }>(
          `select period::text period, amount::text amount from balance_recoveries where resolution_id = $1 order by period`,
          [id],
        )
      ).map((r) => ({ period: r.period, amount: Number(r.amount) }));
    },
    async events() {
      return (await one<{ n: number }>(`select count(*)::int n from balance_resolution_events`))[0]!
        .n;
    },
    async expire(id) {
      await db.query(
        `update balance_resolutions set respond_by = now() - interval '1 minute' where id = $1`,
        [id],
      );
    },
    async status(id) {
      return (
        await one<{ s: string }>(`select status s from balance_resolutions where id = $1`, [id])
      )[0]!.s;
    },
  };
}

async function memory(): Promise<Backend> {
  resetMockDb();
  const bal = () =>
    mockDb.leaveBalances.find((b) => b.userId === sam && b.leaveTypeId === Vacation)!;
  return {
    store: memoryResolutionStore,
    decide: memoryDecideStore,
    repo: mockRepository,
    async setBalance(v) {
      bal().balance = v;
    },
    async balance() {
      return bal().balance;
    },
    async ledger(id) {
      return mockDb.balanceLedger
        .filter((e) => e.sourceKey.startsWith(`resolution:${id}:`))
        .map((e) => ({ source: e.source, delta: e.delta, balanceAfter: e.balanceAfter }))
        .sort((a, b) => a.source.localeCompare(b.source));
    },
    async schedule(id) {
      return mockDb.balanceRecoveries
        .filter((r) => r.resolutionId === id)
        .map((r) => ({ period: r.period, amount: r.amount }))
        .sort((a, b) => a.period.localeCompare(b.period));
    },
    async events() {
      return mockDb.balanceResolutionEvents.length;
    },
    async expire(id) {
      mockDb.balanceResolutions.find((r) => r.id === id)!.respondBy = new Date(
        Date.now() - 60_000,
      ).toISOString();
    },
    async status(id) {
      return mockDb.balanceResolutions.find((r) => r.id === id)!.status;
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
])("%s store — responding to a resolution", (_name, make) => {
  let b: Backend;
  let deps: { store: ResolutionStore };
  beforeEach(async () => {
    b = await make();
    deps = { store: b.store };
    await decideLeaveRequest(
      { userId: maya, role: "manager" },
      SAM_VACATION,
      { decision: "approve" },
      {
        store: b.decide,
        notifier,
      },
    ); // Sam's Vacation: −1.25 (accrual 1.25 a month)
  });
  const propose = async (
    split: Record<string, unknown> = {
      unpaidDays: 0.25,
      recoveryDays: 1,
      recoveryStartPeriod: start,
      recoveryMonths: 1,
    },
  ) =>
    (await proposeResolution(HR, { userId: sam, leaveTypeId: Vacation, ...split }, deps))
      .resolution;
  const accept = (id: string, who: Actor = SAM) => acceptResolution(who, id, deps);
  const decline = (id: string, reason: unknown = "I'd rather recover it all") =>
    declineResolution(SAM, id, { reason }, deps);
  const repropose = (id: string, who: Actor = HR) =>
    reproposeResolution(who, id, { unpaidDays: 1.25, recoveryDays: 0 }, deps);
  const finalize = (id: string) =>
    finalizeResolution(
      HR,
      id,
      { unpaidDays: 1.25, recoveryDays: 0, reason: "Binding decision after two declines" },
      deps,
    );

  it("AC1: accepting applies the amounts (balance, ledger, schedule) and notifies HR", async () => {
    const r = await propose();
    const { resolution } = await accept(r.id);
    expect(resolution).toMatchObject({
      status: "accepted",
      unpaidApplied: 0.25,
      recoveryApplied: 1,
    });
    expect(await b.balance()).toBe(0);
    expect(await b.ledger(r.id)).toEqual([
      { source: "conversion", delta: 0.25, balanceAfter: -1 },
      { source: "recovery", delta: 1, balanceAfter: 0 },
    ]);
    expect(await b.schedule(r.id)).toEqual([{ period: start, amount: 1 }]);
    expect(await b.events()).toBe(2);
    const hr = await b.repo.listNotifications(carla);
    expect(hr.find((n) => n.type === "resolution.accepted")?.payload).toMatchObject({
      resolutionId: r.id,
      unpaidApplied: 0.25,
    });
    expect(
      (await b.repo.listNotifications(sam)).some((n) => n.type === "resolution.accepted"),
    ).toBe(false);
  });

  it("AC1: a multi-month recovery is scheduled so the months sum exactly (the last takes the remainder)", async () => {
    const r = await propose({
      unpaidDays: 0,
      recoveryDays: 1.25,
      recoveryStartPeriod: start,
      recoveryMonths: 3,
    });
    await accept(r.id);
    const rows = await b.schedule(r.id);
    expect(rows.map((x) => x.amount)).toEqual([0.42, 0.42, 0.41]);
  });

  it("AC1: amounts are clamped to the CURRENT deficit (recovery first); both amounts are kept", async () => {
    const r = await propose();
    await b.setBalance(-0.5);
    const { resolution } = await accept(r.id);
    expect(resolution).toMatchObject({
      unpaidDays: 0.25,
      recoveryDays: 1,
      unpaidApplied: 0.25,
      recoveryApplied: 0.25,
    });
    expect(await b.balance()).toBe(0);
    const again = await propose().catch((e) => e); // the deficit is gone
    expect(again).toMatchObject({ code: "CONFLICT" });
  });

  it("AC1: when the deficit is already gone, accepting closes it with nothing applied", async () => {
    const r = await propose();
    await b.setBalance(0);
    const { resolution } = await accept(r.id);
    expect(resolution).toMatchObject({ status: "finalized", unpaidApplied: 0, recoveryApplied: 0 });
    expect(await b.ledger(r.id)).toEqual([]);
  });

  it("AC2: a decline needs a 3–500 character reason, then goes to HR's Declined tab", async () => {
    const r = await propose();
    for (const reason of [null, 42, "", "ab", "  ab  ", "x".repeat(501)]) {
      await rejectsWith(decline(r.id, reason), "VALIDATION_ERROR");
    }
    const { resolution } = await decline(r.id);
    expect(resolution).toMatchObject({
      status: "declined",
      responseReason: "I'd rather recover it all",
    });
    expect((await b.repo.listResolutions("declined")).map((x) => x.id)).toEqual([r.id]);
    expect(
      (await b.repo.listNotifications(carla)).find((n) => n.type === "resolution.declined")
        ?.payload,
    ).toMatchObject({
      reason: "I'd rather recover it all",
      proposalNumber: 1,
    });
  });

  it("AC3: one re-proposal; after a second decline only a final decision is possible", async () => {
    const first = await propose();
    await expect(finalize(first.id)).rejects.toMatchObject({ code: "CONFLICT" }); // not declined yet
    await decline(first.id);
    await rejectsWith(finalize(first.id), "CONFLICT", /re-propose first/);
    const { resolution: second } = await repropose(first.id);
    expect(second).toMatchObject({ proposalNumber: 2, status: "proposed" });
    expect(await b.status(first.id)).toBe("superseded");
    expect(
      (await b.repo.listNotifications(sam)).filter((n) => n.type === "resolution.proposed"),
    ).toHaveLength(2);
    await decline(second.id);
    await rejectsWith(repropose(second.id), "CONFLICT", /final decision/);
    await b.setBalance(-0.5); // the deficit shrank since: the final decision is clamped too
    const { resolution: final } = await finalize(second.id);
    expect(final).toMatchObject({
      status: "finalized",
      unpaidApplied: 0.5,
      recoveryApplied: 0,
      finalReason: /Binding/,
    });
    expect(await b.balance()).toBe(0);
    expect(
      (await b.repo.listNotifications(sam)).some((n) => n.type === "resolution.finalized"),
    ).toBe(true);
    await rejectsWith(finalize(second.id), "CONFLICT");
  });

  it("AC4: responses after respond_by are 409 and change nothing", async () => {
    const r = await propose();
    await b.expire(r.id);
    const events = await b.events();
    await rejectsWith(accept(r.id), "CONFLICT", /deadline/);
    await rejectsWith(decline(r.id), "CONFLICT", /deadline/);
    expect(await b.balance()).toBe(-1.25);
    expect(await b.events()).toBe(events);
    expect(await b.repo.getMyResolution(sam)).toMatchObject({ id: r.id, expired: true });
  });

  it("AC5: an already-answered resolution can't be accepted or declined again (nothing changes)", async () => {
    const r = await propose();
    await decline(r.id);
    const events = await b.events();
    await rejectsWith(accept(r.id), "CONFLICT", /already been answered/);
    await rejectsWith(decline(r.id), "CONFLICT", /already been answered/);
    expect(await b.balance()).toBe(-1.25);
    expect(await b.ledger(r.id)).toEqual([]);
    expect(await b.events()).toBe(events);
  });

  it("AC5: an accepted resolution can't be declined afterwards", async () => {
    const r = await propose();
    await accept(r.id);
    await rejectsWith(decline(r.id), "CONFLICT", /already been answered/);
    expect(await b.status(r.id)).toBe("accepted");
  });

  it("AC5: two simultaneous accepts apply exactly once", async () => {
    const r = await propose();
    const results = await Promise.allSettled([accept(r.id), accept(r.id)]);
    expect(results.filter((x) => x.status === "fulfilled")).toHaveLength(1);
    expect(results.find((x) => x.status === "rejected")).toMatchObject({
      reason: { code: "CONFLICT" },
    });
    expect(await b.ledger(r.id)).toHaveLength(2);
    expect(await b.schedule(r.id)).toHaveLength(1);
    expect(await b.balance()).toBe(0);
  });

  it("ownership: someone else's resolution is 404; non-HR review is 403; HR on their own balance is 403", async () => {
    const r = await propose();
    await expect(
      accept(r.id, { userId: ana, role: "employee", name: "Ana" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(accept("not-a-uuid")).rejects.toMatchObject({ code: "NOT_FOUND" });
    await decline(r.id);
    await expect(
      repropose(r.id, { userId: maya, role: "manager", name: "Maya" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await rejectsWith(
      repropose(r.id, { userId: sam, role: "hr_admin", name: "Sam" }),
      "FORBIDDEN",
      /your own balance/,
    );
    expect(await b.repo.getMyResolution(sam)).toMatchObject({ id: r.id, status: "declined" });
    expect(await b.repo.getMyResolution(ana)).toBeNull();
  });
});
