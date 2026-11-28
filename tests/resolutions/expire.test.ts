import { readFileSync } from "node:fs";
import path from "node:path";
import type { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LEAVE_TYPE_IDS, USER_IDS } from "@/lib/data/mock/fixtures";
import { mockRepository } from "@/lib/data/mock/repository";
import { mockDb, resetMockDb } from "@/lib/data/mock/store";
import { createPostgresRepository } from "@/lib/data/postgres-repository";
import type { LeaveRepository } from "@/lib/data/repositories";
import { notificationHref, notificationText } from "@/lib/notifications/format";
import { runResolutionExpiry } from "@/lib/resolutions/expire";
import { memoryResolutionStore } from "@/lib/resolutions/memory-store";
import { createPostgresResolutionStore } from "@/lib/resolutions/postgres-store";
import { proposeResolution } from "@/lib/resolutions/propose";
import { acceptResolution } from "@/lib/resolutions/respond";
import type { ResolutionStore } from "@/lib/resolutions/store";
import { earliestRecoveryStart } from "@/lib/resolutions/validation";
import { closeAfterEachTest, createTestDb } from "../db/helpers";

/**
 * TASK-034 (US-11) — the expiry job converts unanswered proposals to Unpaid, on BOTH stores.
 * Deadlines are moved into the past directly (no clock shifting needed).
 */
const { sam, ana, carla } = USER_IDS;
const { Vacation } = LEAVE_TYPE_IDS;
const HR = { userId: carla, role: "hr_admin" as const, name: "Carla Diaz" };
const start = earliestRecoveryStart(new Date());

type Backend = {
  store: ResolutionStore;
  repo: LeaveRepository;
  setBalance(user: string, v: number): Promise<void>;
  balance(user: string): Promise<number>;
  ledger(id: string): Promise<{ source: string; delta: number; actor: string | null }[]>;
  events(): Promise<number>;
  expire(id: string): Promise<void>;
  status(id: string): Promise<string>;
  outbox(): Promise<number>;
};
let db: PGlite;
const track = closeAfterEachTest(); // B30

async function postgres(): Promise<Backend> {
  const made = await createTestDb();
  db = made.db;
  track(db);
  const rows = async <T>(q: string, p: unknown[] = []) => (await db.query<T>(q, p)).rows;
  return {
    store: createPostgresResolutionStore(made.sql),
    repo: createPostgresRepository(made.sql),
    async setBalance(user, v) {
      await db.query(
        `update leave_balances set balance = $3 where user_id = $1 and leave_type_id = $2`,
        [user, Vacation, v],
      );
    },
    async balance(user) {
      const [r] = await rows<{ b: string }>(
        `select balance::text b from leave_balances where user_id = $1 and leave_type_id = $2`,
        [user, Vacation],
      );
      return Number(r!.b);
    },
    async ledger(id) {
      return (
        await rows<{ source: string; delta: string; actor: string | null }>(
          `select source, delta::text delta, actor_id actor from balance_ledger where source_key like 'resolution:' || $1 || ':%'`,
          [id],
        )
      ).map((r) => ({ source: r.source, delta: Number(r.delta), actor: r.actor }));
    },
    async events() {
      return (
        await rows<{ n: number }>(`select count(*)::int n from balance_resolution_events`)
      )[0]!.n;
    },
    async expire(id) {
      await db.query(
        `update balance_resolutions set respond_by = now() - interval '1 minute' where id = $1`,
        [id],
      );
    },
    async status(id) {
      return (
        await rows<{ s: string }>(`select status s from balance_resolutions where id = $1`, [id])
      )[0]!.s;
    },
    async outbox() {
      return (await rows<{ n: number }>(`select count(*)::int n from notification_outbox`))[0]!.n;
    },
  };
}

async function memory(): Promise<Backend> {
  resetMockDb();
  const bal = (user: string) =>
    mockDb.leaveBalances.find((b) => b.userId === user && b.leaveTypeId === Vacation)!;
  return {
    store: memoryResolutionStore,
    repo: mockRepository,
    async setBalance(user, v) {
      bal(user).balance = v;
    },
    async balance(user) {
      return bal(user).balance;
    },
    async ledger(id) {
      return mockDb.balanceLedger
        .filter((e) => e.sourceKey.startsWith(`resolution:${id}:`))
        .map((e) => ({ source: e.source, delta: e.delta, actor: e.actorId }));
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
    async outbox() {
      return mockDb.notificationOutbox.length;
    },
  };
}
afterEach(() => resetMockDb());

describe.each<[string, () => Promise<Backend>]>([
  ["postgres", postgres],
  ["memory", memory],
])("%s store — resolution expiry", (_name, make) => {
  let b: Backend;
  const deps = () => ({ store: b.store });
  beforeEach(async () => {
    b = await make();
    await b.setBalance(sam, -1.25);
  });
  const propose = async (
    user: string = sam,
    split: Record<string, unknown> = {
      unpaidDays: 0.25,
      recoveryDays: 1,
      recoveryStartPeriod: start,
      recoveryMonths: 1,
    },
  ) =>
    (await proposeResolution(HR, { userId: user, leaveTypeId: Vacation, ...split }, deps()))
      .resolution;
  const run = (limit?: number) => runResolutionExpiry(deps(), limit ? { limit } : {});

  it("AC1: a past-deadline proposal is converted to Unpaid (no recovery) and closed; employee + HR notified", async () => {
    const r = await propose();
    await b.expire(r.id);
    expect(await run()).toEqual({ expired: 1, convertedDays: 1.25, skipped: 0 });
    expect(await b.status(r.id)).toBe("expired");
    expect(await b.balance(sam)).toBe(0);
    expect(await b.ledger(r.id)).toEqual([{ source: "conversion", delta: 1.25, actor: null }]);
    expect(await b.events()).toBe(2);
    const mine = (await b.repo.listNotifications(sam)).find((n) => n.type === "resolution.expired");
    const hr = (await b.repo.listNotifications(carla)).find((n) => n.type === "resolution.expired");
    expect(mine && notificationText(mine)).toMatch(
      /^Your Vacation resolution wasn't answered by the deadline: 1\.25 days converted to Unpaid\.$/,
    );
    expect(mine && notificationHref(mine)).toBe("/balance");
    expect(hr && notificationText(hr)).toMatch(/^Sam .*'s Vacation resolution wasn't answered/);
    expect(hr && notificationHref(hr)).toBe("/resolutions?tab=history");
    expect(await b.repo.getMyResolution(sam)).toMatchObject({
      status: "expired",
      unpaidApplied: 1.25,
      recoveryApplied: 0,
      expired: false,
    });
  });

  it("AC1: a proposal before its deadline is untouched", async () => {
    const r = await propose();
    expect(await run()).toEqual({ expired: 0, convertedDays: 0, skipped: 0 });
    expect(await b.status(r.id)).toBe("proposed");
  });

  it("AC1: clamped to the current deficit; nothing left → closed with 0 and no ledger row", async () => {
    const r = await propose();
    await b.setBalance(sam, -0.5);
    await b.expire(r.id);
    expect(await run()).toMatchObject({ expired: 1, convertedDays: 0.5 });
    expect(await b.balance(sam)).toBe(0);
    const again = await propose(sam, { unpaidDays: 0.5, recoveryDays: 0 }).catch((e) => e);
    expect(again).toMatchObject({ code: "CONFLICT" }); // no deficit left to propose for
    await b.setBalance(sam, -1);
    const second = await propose(sam, { unpaidDays: 1, recoveryDays: 0 });
    await b.setBalance(sam, 0);
    await b.expire(second.id);
    expect(await run()).toMatchObject({ expired: 1, convertedDays: 0 });
    expect(await b.ledger(second.id)).toEqual([]);
    expect(await b.status(second.id)).toBe("expired");
  });

  it("AC2: re-running changes nothing", async () => {
    const r = await propose();
    await b.expire(r.id);
    await run();
    const state = [
      await b.balance(sam),
      await b.events(),
      await b.outbox(),
      (await b.ledger(r.id)).length,
    ];
    expect(await run()).toEqual({ expired: 0, convertedDays: 0, skipped: 0 });
    expect([
      await b.balance(sam),
      await b.events(),
      await b.outbox(),
      (await b.ledger(r.id)).length,
    ]).toEqual(state);
  });

  it("AC3: an accept that won first leaves nothing to expire", async () => {
    const r = await propose();
    await acceptResolution({ userId: sam }, r.id, deps());
    await b.expire(r.id);
    expect(await run()).toEqual({ expired: 0, convertedDays: 0, skipped: 0 });
    expect(await b.status(r.id)).toBe("accepted");
  });

  it("AC3: expiry and a late accept racing → exactly one outcome", async () => {
    const r = await propose();
    await b.expire(r.id);
    const [job, accept] = await Promise.allSettled([
      run(),
      acceptResolution({ userId: sam }, r.id, deps()),
    ]);
    expect(job).toMatchObject({ status: "fulfilled", value: { expired: 1 } });
    expect(accept).toMatchObject({ status: "rejected", reason: { code: "CONFLICT" } });
    expect(await b.status(r.id)).toBe("expired");
    expect(await b.ledger(r.id)).toHaveLength(1);
    expect(await b.balance(sam)).toBe(0);
  });

  it("works in batches: limit 1 with two due → one now, the other on the next run", async () => {
    const first = await propose();
    await b.setBalance(ana, -2);
    const second = await propose(ana, { unpaidDays: 2, recoveryDays: 0 });
    await b.expire(first.id);
    await b.expire(second.id);
    expect(await run(1)).toMatchObject({ expired: 1 });
    expect(await run(1)).toMatchObject({ expired: 1 });
    expect([await b.status(first.id), await b.status(second.id)]).toEqual(["expired", "expired"]);
  });
});

describe("the expiry claims rows with FOR UPDATE SKIP LOCKED (PGlite can't hold a second connection's lock)", () => {
  it("pins the claim, the re-check and the guarded UPDATE in the Postgres store", () => {
    const src = readFileSync(
      path.resolve(import.meta.dirname, "../../lib/resolutions/postgres-store.ts"),
      "utf8",
    ).replace(/\s+/g, " ");
    expect(src).toMatch(
      /async expireDue\(.{0,600}where status = 'proposed' and respond_by <= now\(\)/,
    );
    expect(src).toMatch(/from balance_resolutions where id = \$1 for update skip locked/);
    expect(src).toMatch(/if \(!r \|\| r\.status !== "proposed" \|\| r\.live\) return null;/);
    expect(src).toMatch(
      /set status = 'expired'.{0,200}where id = \$1 and status = 'proposed' and respond_by <= now\(\) returning id/,
    );
  });
});
