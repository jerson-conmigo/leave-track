import type { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LEAVE_TYPE_IDS, USER_IDS } from "@/lib/data/mock/fixtures";
import { mockRepository } from "@/lib/data/mock/repository";
import { mockDb, resetMockDb } from "@/lib/data/mock/store";
import { createPostgresRepository } from "@/lib/data/postgres-repository";
import type { LeaveRepository } from "@/lib/data/repositories";
import { toAppError } from "@/lib/db/errors";
import type { SqlClient } from "@/lib/db/sql";
import { toNumber } from "@/lib/db/sql";
import { cancelLeaveRequest } from "@/lib/leave-requests/cancel";
import { decideLeaveRequest } from "@/lib/leave-requests/decide";
import {
  memoryCancelStore,
  memoryDecideStore,
  memorySubmitStore,
} from "@/lib/leave-requests/memory-store";
import type { Notifier } from "@/lib/leave-requests/notifier";
import {
  createPostgresCancelStore,
  createPostgresDecideStore,
  createPostgresSubmitStore,
} from "@/lib/leave-requests/postgres-store";
import type { CancelStore, DecideStore, SubmitStore } from "@/lib/leave-requests/store";
import { submitLeaveRequest } from "@/lib/leave-requests/submit";
import { closeAfterEachTest, createTestDb } from "../db/helpers";
import { daysFromToday as d } from "../support/dates";

/**
 * TASK-028 (US-16 AC3–AC4, BR-13) — withdraw a pending request / cancel approved leave, on BOTH
 * stores with one case table. Only the requester; approved leave only before its first day (UTC);
 * the debit comes back exactly (reversing the approval's ledger row); status, balance, ledger,
 * audit row and the approvers' notification in one transaction. Dates are relative to today.
 */
const { ana, jordan, ben, carla } = USER_IDS;
const { Vacation, Sick, Unpaid } = LEAVE_TYPE_IDS;
const ROLE = {
  [ana]: "employee",
  [jordan]: "employee",
  [ben]: "manager",
  [carla]: "hr_admin",
} as const;

type Backend = {
  submitStore: SubmitStore;
  decideStore: DecideStore;
  cancelStore: CancelStore;
  repo: LeaveRepository;
  balance(userId: string, typeId: string): Promise<number>;
  ledger(requestId: string): Promise<{ source: string; delta: number; balanceAfter: number }[]>;
  audit(requestId: string): Promise<string[]>;
  status(requestId: string): Promise<string | undefined>;
  ledgerSum(userId: string, typeId: string): Promise<number>;
  /** An approved request from BEFORE the balance ledger (debited, but no approval:<id> row). */
  legacyApproved(
    userId: string,
    typeId: string,
    start: string,
    end: string,
    days: number,
  ): Promise<string>;
};

let db: PGlite;
let sql: SqlClient;
const track = closeAfterEachTest(); // B30

async function postgres(): Promise<Backend> {
  ({ db, sql } = await createTestDb());
  track(db);
  const q = async <T>(text: string, params: unknown[] = []) =>
    (await db.query<T>(text, params)).rows;
  return {
    submitStore: createPostgresSubmitStore(sql),
    decideStore: createPostgresDecideStore(sql),
    cancelStore: createPostgresCancelStore(sql),
    repo: createPostgresRepository(sql),
    async balance(u, t) {
      const [r] = await q<{ b: string }>(
        `select balance b from leave_balances where user_id = $1 and leave_type_id = $2`,
        [u, t],
      );
      return r ? toNumber(r.b) : 0;
    },
    async ledger(id) {
      return (
        await q<{ source: string; delta: string; balance_after: string }>(
          `select source, delta, balance_after from balance_ledger where leave_request_id = $1 order by occurred_at, source`,
          [id],
        )
      ).map((r) => ({
        source: r.source,
        delta: toNumber(r.delta),
        balanceAfter: toNumber(r.balance_after),
      }));
    },
    async audit(id) {
      return (
        await q<{ a: string }>(
          `select action::text a from audit_log where leave_request_id = $1 order by occurred_at, id`,
          [id],
        )
      ).map((r) => r.a);
    },
    async status(id) {
      return (
        await q<{ s: string }>(`select status::text s from leave_requests where id = $1`, [id])
      )[0]?.s;
    },
    async legacyApproved(u, t, start, end, days) {
      const [r] = await q<{ id: string }>(
        `insert into leave_requests (user_id, leave_type_id, start_date, end_date, reason, status, decided_by, decided_at)
         values ($1, $2, $3, $4, 'legacy', 'approved', $5, now()) returning id`,
        [u, t, start, end, ben],
      );
      await db.query(
        `update leave_balances set balance = balance - $3 where user_id = $1 and leave_type_id = $2`,
        [u, t, days],
      );
      return r!.id;
    },
    async ledgerSum(u, t) {
      const [r] = await q<{ s: string }>(
        `select coalesce(sum(delta), 0) s from balance_ledger where user_id = $1 and leave_type_id = $2`,
        [u, t],
      );
      return toNumber(r!.s);
    },
  };
}

async function memory(): Promise<Backend> {
  resetMockDb();
  return {
    submitStore: memorySubmitStore,
    decideStore: memoryDecideStore,
    cancelStore: memoryCancelStore,
    repo: mockRepository,
    async balance(u, t) {
      return mockDb.leaveBalances.find((b) => b.userId === u && b.leaveTypeId === t)?.balance ?? 0;
    },
    async ledger(id) {
      return mockDb.balanceLedger
        .filter((e) => e.leaveRequestId === id)
        .map((e) => ({ source: e.source, delta: e.delta, balanceAfter: e.balanceAfter }));
    },
    async audit(id) {
      return mockDb.auditLog.filter((a) => a.leaveRequestId === id).map((a) => a.action);
    },
    async status(id) {
      return mockDb.leaveRequests.find((r) => r.id === id)?.status;
    },
    async legacyApproved(u, t, start, end, days) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      mockDb.leaveRequests.push({
        id,
        userId: u,
        leaveTypeId: t,
        startDate: start,
        endDate: end,
        reason: "legacy",
        status: "approved",
        decidedBy: ben,
        decidedAt: now,
        decisionReason: null,
        isDeleted: false,
        createdAt: now,
      });
      const bal = mockDb.leaveBalances.find((x) => x.userId === u && x.leaveTypeId === t)!;
      bal.balance -= days;
      return id;
    },
    async ledgerSum(u, t) {
      return mockDb.balanceLedger
        .filter((e) => e.userId === u && e.leaveTypeId === t)
        .reduce((s, e) => s + e.delta, 0);
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
const round = (n: number) => Math.round(n * 100) / 100;

describe.each<[string, () => Promise<Backend>]>([
  ["postgres", postgres],
  ["memory", memory],
])("%s store — withdraw / cancel", (_name, make) => {
  let b: Backend;
  beforeEach(async () => {
    b = await make();
  });
  const submit = (userId: string, type: string, start: number, end: number) =>
    submitLeaveRequest(
      { userId },
      { leaveTypeId: type, startDate: d(start), endDate: d(end), reason: "Family visit" },
      { store: b.submitStore, notifier },
    );
  const approve = (id: string, actor = ben) =>
    decideLeaveRequest(
      { userId: actor, role: ROLE[actor] },
      id,
      { decision: "approve" },
      {
        store: b.decideStore,
        notifier,
      },
    );
  const cancel = (id: string, actor: string = ana) =>
    cancelLeaveRequest({ userId: actor }, id, { store: b.cancelStore });

  it("AC1: withdrawing a pending request → cancelled, one audit row, out of the queue, dates freed, approver notified", async () => {
    const { request } = await submit(ana, Vacation, 70, 72);
    expect((await b.repo.listTeamRequests(ben, { status: "pending" })).map((r) => r.id)).toContain(
      request.id,
    );
    const { request: view, restoredDays } = await cancel(request.id);
    expect(view).toMatchObject({ status: "cancelled", cancellable: false, awaiting: null });
    expect(restoredDays).toBeNull();
    expect(await b.audit(request.id)).toEqual(["submitted", "cancelled"]);
    expect(
      (await b.repo.listTeamRequests(ben, { status: "pending" })).map((r) => r.id),
    ).not.toContain(request.id);
    expect((await b.repo.listMyRequests(ana)).find((r) => r.id === request.id)?.status).toBe(
      "cancelled",
    );
    await expect(submit(ana, Vacation, 71, 71)).resolves.toBeTruthy(); // dates freed
    const note = (await b.repo.listNotifications(ben)).find((n) => n.type === "request.cancelled");
    expect(note?.payload).toMatchObject({
      requestId: request.id,
      wasApproved: false,
      requesterName: "Ana Reyes",
    });
    expect(await b.ledger(request.id)).toEqual([]);
  });

  it("AC2: cancelling approved future Vacation restores exactly its days — ledger reversed, reconciled, Sick untouched", async () => {
    const before = await b.balance(ana, Vacation);
    const sickBefore = await b.balance(ana, Sick);
    const { request } = await submit(ana, Vacation, 70, 72);
    await approve(request.id);
    expect(round(await b.balance(ana, Vacation))).toBe(round(before - 3));
    expect((await b.repo.listMyRequests(ana)).find((r) => r.id === request.id)?.cancellable).toBe(
      true,
    );
    const { restoredDays } = await cancel(request.id);
    expect(restoredDays).toBe(3);
    expect(round(await b.balance(ana, Vacation))).toBe(round(before));
    expect(await b.balance(ana, Sick)).toBe(sickBefore);
    expect(await b.ledger(request.id)).toEqual([
      { source: "approval", delta: -3, balanceAfter: round(before - 3) },
      { source: "cancellation", delta: 3, balanceAfter: round(before) },
    ]);
    expect(round(await b.ledgerSum(ana, Vacation))).toBe(round(await b.balance(ana, Vacation)));
    expect(await b.audit(request.id)).toEqual(["submitted", "approved", "cancelled"]);
    const note = (await b.repo.listNotifications(ben)).find((n) => n.type === "request.cancelled");
    expect(note?.payload).toMatchObject({ wasApproved: true });
  });

  it("AC2: an approval from before the ledger (no approval row) gets back exactly its days", async () => {
    const before = await b.balance(jordan, Vacation);
    const id = await b.legacyApproved(jordan, Vacation, d(70), d(73), 4);
    const { restoredDays } = await cancel(id, jordan);
    expect(restoredDays).toBe(4);
    expect(round(await b.balance(jordan, Vacation))).toBe(round(before));
  });

  it("AC2: an untracked type (Unpaid) is cancelled with no balance or ledger change", async () => {
    const { request } = await submit(ana, Unpaid, 70, 70);
    await approve(request.id);
    const { restoredDays } = await cancel(request.id);
    expect(restoredDays).toBeNull();
    expect(await b.ledger(request.id)).toEqual([]);
    expect(await b.status(request.id)).toBe("cancelled");
  });

  it("AC3: started (today) or past approved leave can't be cancelled (409); rejected or cancelled neither", async () => {
    const { request: today } = await submit(ana, Vacation, 0, 0);
    await approve(today.id);
    const views = await b.repo.listMyRequests(ana);
    expect(views.find((r) => r.id === today.id)?.cancellable).toBe(false); // started: no button
    await expect(cancel(today.id)).rejects.toMatchObject({
      code: "CONFLICT",
      status: 409,
      message: "Leave that has already started can't be cancelled.",
    });
    const { request: past } = await submit(ana, Sick, -5, -5);
    await approve(past.id);
    await expect(cancel(past.id)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(await b.status(today.id)).toBe("approved");

    const { request: rej } = await submit(ana, Vacation, 80, 80);
    await decideLeaveRequest(
      { userId: ben, role: "manager" },
      rej.id,
      { decision: "reject", reason: "Busy week" },
      { store: b.decideStore, notifier },
    );
    await expect(cancel(rej.id)).rejects.toMatchObject({ code: "CONFLICT" });

    const { request: twice } = await submit(ana, Vacation, 90, 90);
    await cancel(twice.id);
    await expect(cancel(twice.id)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(await b.audit(twice.id)).toEqual(["submitted", "cancelled"]);
  });

  it("AC4: only the requester — another employee, the manager or HR get 403 and nothing changes", async () => {
    const { request } = await submit(ana, Vacation, 70, 70);
    for (const actor of [jordan, ben, carla]) {
      await expect(cancel(request.id, actor)).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
    }
    expect(await b.status(request.id)).toBe("pending");
    expect(await b.audit(request.id)).toEqual(["submitted"]);
  });

  it("AC4: 'not yours' wins over 'started' (never reveal another person's request state)", async () => {
    const { request } = await submit(ana, Vacation, 0, 0);
    await approve(request.id);
    await expect(cancel(request.id, jordan)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("404 for an unknown request, 400 for a malformed id", async () => {
    await expect(cancel("20000000-0000-4000-8000-00000000ffff")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(cancel("nope")).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("withdraw racing an approval: one consistent outcome (never both a refund and a debit lost)", async () => {
    const before = await b.balance(ana, Vacation);
    const { request } = await submit(ana, Vacation, 70, 71);
    await Promise.allSettled([cancel(request.id), approve(request.id)]);
    const status = await b.status(request.id);
    expect(["approved", "cancelled"]).toContain(status);
    const audit = await b.audit(request.id);
    expect(audit.filter((a) => a === "cancelled").length).toBeLessThanOrEqual(1);
    expect(audit.filter((a) => a === "approved" || a === "rejected").length).toBeLessThanOrEqual(1);
    expect(round(await b.balance(ana, Vacation))).toBe(
      round(status === "approved" ? before - 2 : before),
    );
    expect(round(await b.ledgerSum(ana, Vacation))).toBe(round(await b.balance(ana, Vacation)));
  });
});

describe("postgres only — database backstops", () => {
  it("a cancelled request is final; a second cancellation row and an inconsistent cancel are refused", async () => {
    await postgres();
    const notifierLocal = notifier;
    const { request } = await submitLeaveRequest(
      { userId: ana },
      { leaveTypeId: Vacation, startDate: d(70), endDate: d(70), reason: "Family visit" },
      { store: createPostgresSubmitStore(sql), notifier: notifierLocal },
    );
    await cancelLeaveRequest({ userId: ana }, request.id, {
      store: createPostgresCancelStore(sql),
    });
    const attempt = (text: string, params: unknown[] = []) =>
      db.query(text, params).then(
        () => null,
        (e: unknown) => e,
      );

    const reopen = await attempt(
      `update leave_requests set status = 'pending', cancelled_at = null, cancelled_by = null where id = $1`,
      [request.id],
    );
    expect(reopen).toMatchObject({ constraint: "leave_requests_cancel_final" });
    expect(toAppError(reopen)).toMatchObject({ code: "CONFLICT" });

    const dup = await attempt(
      `insert into audit_log (leave_request_id, actor_id, action) values ($1, $2, 'cancelled')`,
      [request.id, ana],
    );
    expect(dup).toMatchObject({ constraint: "audit_log_one_cancellation_per_request" });
    expect(toAppError(dup)).toMatchObject({ code: "CONFLICT" });

    const { request: other } = await submitLeaveRequest(
      { userId: ana },
      { leaveTypeId: Vacation, startDate: d(80), endDate: d(80), reason: "Family visit" },
      { store: createPostgresSubmitStore(sql), notifier: notifierLocal },
    );
    const bySomeoneElse = await attempt(
      `update leave_requests set status = 'cancelled', cancelled_at = now(), cancelled_by = $2 where id = $1`,
      [other.id, ben],
    );
    expect(bySomeoneElse).toMatchObject({ constraint: "leave_requests_decision_consistent" });
  });
});
