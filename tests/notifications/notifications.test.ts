import { readFileSync } from "node:fs";
import path from "node:path";
import type { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LEAVE_TYPE_IDS, USER_IDS } from "@/lib/data/mock/fixtures";
import { mockRepository } from "@/lib/data/mock/repository";
import { mockDb, resetMockDb } from "@/lib/data/mock/store";
import { createPostgresRepository } from "@/lib/data/postgres-repository";
import type { LeaveRepository } from "@/lib/data/repositories";
import type { SqlClient } from "@/lib/db/sql";
import { decideLeaveRequest } from "@/lib/leave-requests/decide";
import { memoryDecideStore, memorySubmitStore } from "@/lib/leave-requests/memory-store";
import type { Notifier } from "@/lib/leave-requests/notifier";
import {
  createPostgresDecideStore,
  createPostgresSubmitStore,
} from "@/lib/leave-requests/postgres-store";
import type { DecideStore, SubmitStore } from "@/lib/leave-requests/store";
import { submitLeaveRequest } from "@/lib/leave-requests/submit";
import { bellBadge, bellLabel, notificationText } from "@/lib/notifications/format";
import {
  createPostgresNotificationReadStore,
  markNotificationsRead,
  memoryNotificationReadStore,
  type NotificationReadStore,
} from "@/lib/notifications/read";
import type { Notification } from "@/lib/notifications/types";
import { closeAfterEachTest, createTestDb } from "../db/helpers";
import { daysFromToday } from "../support/dates";

/**
 * TASK-030 (US-17 AC1, ADR-LeaveTrack-E007) — notifications and the outbox on BOTH stores:
 *   AC1 submit and decide write an in-app notification + an outbox row in their transaction;
 *   AC2 a rolled-back action leaves no notification;
 *   AC3 users see (and can mark) only their own.
 */
const { ana, jordan, ben, maya, carla } = USER_IDS;
const HANA = "00000000-0000-4000-8000-0000000000a1"; // a 2nd HR Admin, created in the test only
const req = (n: number) => `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const JORDAN_VACATION = req(4); // pending, Ben's report

type Backend = {
  submitStore: SubmitStore;
  decideStore: DecideStore;
  readStore: NotificationReadStore;
  repo: LeaveRepository;
  outbox(): Promise<{ recipientId: string; key: string; notificationId: string }[]>;
  addSecondHrAdmin(): Promise<void>;
  requestCount(): Promise<number>;
  requestStatus(id: string): Promise<string | undefined>;
};

let db: PGlite;
let sql: SqlClient;
const track = closeAfterEachTest(); // B30: each test's database closes after that test

async function postgres(): Promise<Backend> {
  ({ db, sql } = await createTestDb());
  track(db);
  return {
    submitStore: createPostgresSubmitStore(sql),
    decideStore: createPostgresDecideStore(sql),
    readStore: createPostgresNotificationReadStore(sql),
    repo: createPostgresRepository(sql),
    async outbox() {
      return (
        await db.query<{ recipient_id: string; idempotency_key: string; notification_id: string }>(
          `select recipient_id, idempotency_key, notification_id from notification_outbox order by idempotency_key`,
        )
      ).rows.map((r) => ({
        recipientId: r.recipient_id,
        key: r.idempotency_key,
        notificationId: r.notification_id,
      }));
    },
    async addSecondHrAdmin() {
      await db.query(
        `insert into users (id, name, email, role) values ($1, 'Hana Sato', 'hana.sato@leavetrack.test', 'hr_admin')`,
        [HANA],
      );
    },
    async requestCount() {
      return (await db.query<{ n: number }>(`select count(*)::int n from leave_requests`)).rows[0]!
        .n;
    },
    async requestStatus(id) {
      return (
        await db.query<{ s: string }>(`select status::text s from leave_requests where id = $1`, [
          id,
        ])
      ).rows[0]?.s;
    },
  };
}

async function memory(): Promise<Backend> {
  resetMockDb();
  return {
    submitStore: memorySubmitStore,
    decideStore: memoryDecideStore,
    readStore: memoryNotificationReadStore,
    repo: mockRepository,
    async outbox() {
      return mockDb.notificationOutbox
        .map((o) => ({
          recipientId: o.recipientId,
          key: o.idempotencyKey,
          notificationId: o.notificationId,
        }))
        .sort((a, b) => a.key.localeCompare(b.key));
    },
    async addSecondHrAdmin() {
      mockDb.users.push({
        id: HANA,
        name: "Hana Sato",
        email: "hana.sato@leavetrack.test",
        role: "hr_admin",
        managerId: null,
      });
    },
    async requestCount() {
      return mockDb.leaveRequests.length;
    },
    async requestStatus(id) {
      return mockDb.leaveRequests.find((r) => r.id === id)?.status;
    },
  };
}

let notifier: Notifier;
beforeEach(() => {
  notifier = {
    leaveRequestSubmitted: vi.fn().mockResolvedValue(undefined),
    leaveRequestDecided: vi.fn().mockResolvedValue(undefined),
  };
});
afterEach(() => {
  resetMockDb();
  vi.restoreAllMocks();
});

const ROLE = {
  [ana]: "employee",
  [jordan]: "employee",
  [ben]: "manager",
  [maya]: "manager",
  [carla]: "hr_admin",
  [HANA]: "hr_admin",
} as const;
const as = (userId: keyof typeof ROLE) => ({ userId, role: ROLE[userId] });

describe.each<[string, () => Promise<Backend>]>([
  ["postgres", postgres],
  ["memory", memory],
])("%s store — notifications", (_name, make) => {
  let b: Backend;
  beforeEach(async () => {
    b = await make();
  });
  const submit = (userId: string, offset = 70) =>
    submitLeaveRequest(
      { userId },
      {
        leaveTypeId: LEAVE_TYPE_IDS.Vacation,
        startDate: daysFromToday(offset),
        endDate: daysFromToday(offset + 2),
        reason: "Family visit",
      },
      { store: b.submitStore, notifier },
    );
  const decide = (actor: keyof typeof ROLE, id: string, decision: "approve" | "reject") =>
    decideLeaveRequest(
      as(actor),
      id,
      decision === "approve" ? { decision } : { decision, reason: "Busy week" },
      { store: b.decideStore, notifier },
    );
  const inbox = (userId: string) => b.repo.listNotifications(userId);

  it("AC1: a submit notifies the approver — one notification and one outbox row", async () => {
    const { request } = await submit(ana);
    const [n, ...rest] = await inbox(ben);
    expect(rest).toHaveLength(0);
    expect(n).toMatchObject({
      recipientId: ben,
      type: "request.submitted",
      readAt: null,
      payload: {
        requestId: request.id,
        requesterId: ana,
        requesterName: "Ana Reyes",
        leaveType: "Vacation",
        days: 3,
      },
    });
    expect(await b.outbox()).toEqual([
      { recipientId: ben, key: `request.submitted:${request.id}:${ben}`, notificationId: n!.id },
    ]);
    expect(await inbox(ana)).toEqual([]); // never the requester
  });

  it("AC1: an HR Admin's request notifies EACH other HR Admin, never themselves", async () => {
    await b.addSecondHrAdmin();
    const { request } = await submit(carla);
    expect(
      (await inbox(HANA)).map((n) => ("requestId" in n.payload ? n.payload.requestId : null)),
    ).toEqual([request.id]);
    expect(await inbox(carla)).toEqual([]);
    expect(await inbox(ben)).toEqual([]);
  });

  it("AC1: approve and reject each notify the requester (with decider and reason)", async () => {
    await decide(ben, JORDAN_VACATION, "approve");
    const [approved] = await inbox(jordan);
    expect(approved).toMatchObject({
      type: "request.decided",
      payload: { requestId: JORDAN_VACATION, decision: "approved", decidedByName: "Ben Ortiz" },
    });
    const { request } = await submit(ana);
    await decide(ben, request.id, "reject");
    const [rejected] = await inbox(ana);
    expect(rejected?.payload).toMatchObject({ decision: "rejected", reason: "Busy week" });
    expect((await b.outbox()).filter((o) => o.key.startsWith("request.decided:"))).toHaveLength(2);
  });

  it("AC2: a refused submit (overlap 400) or decide (403) writes no notification", async () => {
    await submit(ana);
    const before = (await b.outbox()).length;
    await expect(submit(ana)).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    await expect(decide(maya, JORDAN_VACATION, "approve")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect((await b.outbox()).length).toBe(before);
  });

  it("AC2: if the notification can't be written, the decision rolls back completely", async () => {
    // Force the notification write to fail: its idempotency key is already taken.
    if (_name === "memory") {
      mockDb.notificationOutbox.push({
        id: crypto.randomUUID(),
        notificationId: crypto.randomUUID(),
        recipientId: jordan,
        channel: "email",
        idempotencyKey: `request.decided:${JORDAN_VACATION}`,
        payload: {} as Notification["payload"],
        status: "pending",
        attempts: 0,
        nextAttemptAt: new Date().toISOString(),
        sentAt: null,
        createdAt: new Date().toISOString(),
      });
    } else {
      const [n] = (
        await db.query<{ id: string }>(
          `insert into notifications (recipient_id, type, payload) values ($1, 'request.decided', '{}') returning id`,
          [jordan],
        )
      ).rows;
      await db.query(
        `insert into notification_outbox (notification_id, recipient_id, idempotency_key, payload)
         values ($1, $2, $3, '{}')`,
        [n!.id, jordan, `request.decided:${JORDAN_VACATION}`],
      );
    }
    const inboxBefore = (await inbox(jordan)).length;
    const ledgerBefore =
      _name === "memory"
        ? mockDb.balanceLedger.length
        : (await db.query<{ n: number }>(`select count(*)::int n from balance_ledger`)).rows[0]!.n;
    await expect(decide(ben, JORDAN_VACATION, "approve")).rejects.toMatchObject({
      code: "23505",
    });
    expect(await b.requestStatus(JORDAN_VACATION)).toBe("pending"); // status rolled back
    const ledgerAfter =
      _name === "memory"
        ? mockDb.balanceLedger.length
        : (await db.query<{ n: number }>(`select count(*)::int n from balance_ledger`)).rows[0]!.n;
    expect(ledgerAfter).toBe(ledgerBefore); // no ledger row
    expect((await inbox(jordan)).length).toBe(inboxBefore); // no notification was added
  });

  it("AC3: each user lists and counts only their own notifications", async () => {
    await submit(ana); // → Ben
    await submit(jordan, 80); // → Ben
    await decide(ben, JORDAN_VACATION, "approve"); // → Jordan
    expect((await inbox(ben)).every((n) => n.recipientId === ben)).toBe(true);
    expect(await b.repo.countUnreadNotifications(ben)).toBe(2);
    expect(await b.repo.countUnreadNotifications(jordan)).toBe(1);
    expect(await b.repo.countUnreadNotifications(maya)).toBe(0);
    expect(await inbox(maya)).toEqual([]);
  });

  it("AC3: marking read only ever touches the session user's own rows", async () => {
    await submit(ana); // → Ben
    await decide(ben, JORDAN_VACATION, "approve"); // → Jordan
    const [jordans] = await inbox(jordan);
    // Ben tries to mark Jordan's notification: nothing changes.
    expect(
      await markNotificationsRead({ userId: ben }, { ids: [jordans!.id] }, { store: b.readStore }),
    ).toEqual({ updated: 0 });
    expect(await b.repo.countUnreadNotifications(jordan)).toBe(1);
    // Ben marks all of his own: only his.
    expect(await markNotificationsRead({ userId: ben }, {}, { store: b.readStore })).toEqual({
      updated: 1,
    });
    expect(await b.repo.countUnreadNotifications(ben)).toBe(0);
    expect(await b.repo.countUnreadNotifications(jordan)).toBe(1);
    // Jordan marks his one by id.
    expect(
      await markNotificationsRead(
        { userId: jordan },
        { ids: [jordans!.id] },
        { store: b.readStore },
      ),
    ).toEqual({ updated: 1 });
    expect((await inbox(jordan))[0]!.readAt).not.toBeNull();
  });

  it("mark-read input is validated (zod)", async () => {
    await expect(
      markNotificationsRead({ userId: ben }, { ids: ["not-a-uuid"] }, { store: b.readStore }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    await expect(
      markNotificationsRead({ userId: ben }, { ids: [] }, { store: b.readStore }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
});

describe("AC1 — memory and Postgres write the same notifications", () => {
  it("same sequence → same normalised rows (recipients, types, payloads, keys)", async () => {
    const run = async (b: Backend) => {
      const deps = { store: b.submitStore, notifier };
      const body = (offset: number) => ({
        leaveTypeId: LEAVE_TYPE_IDS.Vacation,
        startDate: daysFromToday(offset),
        endDate: daysFromToday(offset + 1),
        reason: "Family visit",
      });
      await submitLeaveRequest({ userId: ana }, body(70), deps);
      await decideLeaveRequest(
        as(ben),
        JORDAN_VACATION,
        { decision: "approve" },
        {
          store: b.decideStore,
          notifier,
        },
      );
      const users = [ana, jordan, ben, maya, carla];
      const rows = (await Promise.all(users.map((u) => b.repo.listNotifications(u)))).flat();
      return rows
        .map((n) => ({
          recipientId: n.recipientId,
          type: n.type,
          payload: { ...n.payload, requestId: "<id>" },
        }))
        .sort((x, y) => `${x.recipientId}${x.type}`.localeCompare(`${y.recipientId}${y.type}`));
    };
    const pg = await run(await postgres());
    const mem = await run(await memory());
    expect(pg).toHaveLength(2);
    expect(mem).toEqual(pg);
  });
});

describe("postgres only — AC2 for submit: a failure after the notification insert rolls back", () => {
  it("the request, its audit row and the notification are all absent", async () => {
    const b = await postgres();
    // A SqlClient whose transaction fails on the OUTBOX insert (after the notification insert).
    const failing: SqlClient = {
      query: (t, p) => sql.query(t, p),
      transaction: (fn) =>
        sql.transaction((tx) =>
          fn({
            query: (t, p) => {
              if (/insert into notification_outbox/i.test(t)) {
                return Promise.reject(new Error("simulated outbox failure"));
              }
              return tx.query(t, p);
            },
            transaction: tx.transaction,
          }),
        ),
    };
    const before = await b.requestCount();
    await expect(
      submitLeaveRequest(
        { userId: ana },
        {
          leaveTypeId: LEAVE_TYPE_IDS.Vacation,
          startDate: daysFromToday(70),
          endDate: daysFromToday(71),
          reason: "Family visit",
        },
        { store: createPostgresSubmitStore(failing), notifier },
      ),
    ).rejects.toThrow(/simulated outbox failure/);
    expect(await b.requestCount()).toBe(before);
    expect(await b.repo.listNotifications(ben)).toEqual([]);
  });
});

describe("text, labels and structure", () => {
  it("the bell's accessible name carries the count in words; the badge caps at 9+", () => {
    expect(bellLabel(0)).toBe("Notifications");
    expect(bellLabel(3)).toBe("Notifications, 3 unread");
    expect([bellBadge(0), bellBadge(3), bellBadge(12)]).toEqual([null, "3", "9+"]);
  });

  it("notification sentences", () => {
    const base = { id: "x", recipientId: ben, readAt: null, createdAt: "2027-01-01T00:00:00Z" };
    expect(
      notificationText({
        ...base,
        type: "request.submitted",
        payload: {
          requestId: "r",
          requesterId: ana,
          requesterName: "Ana Reyes",
          leaveType: "Vacation",
          startDate: "2027-03-01",
          endDate: "2027-03-03",
          days: 3,
        },
      }),
    ).toMatch(/^Ana Reyes requested 3 days of Vacation \(.+\)\.$/);
    expect(
      notificationText({
        ...base,
        type: "request.decided",
        payload: {
          requestId: "r",
          decision: "rejected",
          leaveType: "Sick",
          startDate: "2027-03-01",
          endDate: "2027-03-01",
          days: 1,
          decidedByName: "Ben Ortiz",
          reason: "Busy week",
        },
      }),
    ).toMatch(/was rejected by Ben Ortiz\. Reason: Busy week$/);
  });

  it("every notifications read and mark-read is scoped to the recipient in SQL", () => {
    const root = path.resolve(import.meta.dirname, "../..");
    const src = (f: string) => readFileSync(path.join(root, f), "utf8");
    const repo = src("lib/data/postgres-repository.ts");
    const reads = [...repo.matchAll(/from notifications\b[\s\S]{0,200}/g)].map((m) => m[0]);
    expect(reads.length).toBeGreaterThanOrEqual(2);
    for (const r of reads) expect(r).toMatch(/where recipient_id = \$1/);
    expect(src("lib/notifications/read.ts")).toMatch(
      /update notifications set read_at = \$3\s+where recipient_id = \$1/,
    );
  });

  it("notifications are written only inside the leave-request stores' transactions", () => {
    const root = path.resolve(import.meta.dirname, "../..");
    const pg = readFileSync(path.join(root, "lib/leave-requests/postgres-store.ts"), "utf8");
    expect(pg).toMatch(/await writeRequestSubmitted\(tx, row\.id\)/);
    expect(pg).toMatch(/await writeRequestDecided\(tx, row\.id\)/);
    const mem = readFileSync(path.join(root, "lib/leave-requests/memory-store.ts"), "utf8");
    expect(mem).toMatch(/atomically\([\s\S]{0,600}writeRequestSubmittedMemory/);
    expect(mem).toMatch(/atomically\([\s\S]{0,3000}writeRequestDecidedMemory/);
  });
});
