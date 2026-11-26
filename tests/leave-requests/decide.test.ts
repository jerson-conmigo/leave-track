import type { PGlite } from "@electric-sql/pglite";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/api/errors";
import { LEAVE_TYPE_IDS, USER_IDS } from "@/lib/data/mock/fixtures";
import { mockRepository } from "@/lib/data/mock/repository";
import { createPostgresRepository } from "@/lib/data/postgres-repository";
import type { SqlClient } from "@/lib/db/sql";
import { decideLeaveRequest } from "@/lib/leave-requests/decide";
import type { Notifier } from "@/lib/leave-requests/notifier";
import {
  createPostgresDecideStore,
  createPostgresSubmitStore,
} from "@/lib/leave-requests/postgres-store";
import type { DecideStore } from "@/lib/leave-requests/store";
import { submitLeaveRequest } from "@/lib/leave-requests/submit";
import { logger } from "@/lib/logger";
import { createTestDb } from "../db/helpers";

/**
 * TASK-014 / US-03 — decisions against real Postgres (PGlite) with the production
 * SQL store. Fresh DB per test → order-independent.
 */
const req = (n: number) => `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const R = {
  anaVacation: req(1), // Ana, Vacation Dec 21–31 (11 days), pending — Ben's report
  jordanVacation: req(4), // Jordan, Vacation Dec 1–5 (5 days), pending — Ben's report
  jordanUnpaid: req(5), // Jordan, Unpaid 1 day, pending — Ben's report
  samVacation: req(7), // Sam, Vacation 5 days, pending — Maya's report (3.75 balance)
  diegoVacation: req(9), // Diego, Vacation 3 days, pending — Maya's report
  anaApproved: req(2), // already approved
};
const BEN = { userId: USER_IDS.ben, role: "manager" as const };
const MAYA = { userId: USER_IDS.maya, role: "manager" as const };
const ANA = { userId: USER_IDS.ana, role: "employee" as const };
const CARLA = { userId: USER_IDS.carla, role: "hr_admin" as const };
const { Vacation, Sick } = LEAVE_TYPE_IDS;

let db: PGlite;
let sql: SqlClient;
let notifier: Notifier & {
  leaveRequestSubmitted: ReturnType<typeof vi.fn>;
  leaveRequestDecided: ReturnType<typeof vi.fn>;
};
const dbs: PGlite[] = [];

beforeEach(async () => {
  ({ db, sql } = await createTestDb());
  dbs.push(db);
  notifier = {
    leaveRequestSubmitted: vi.fn().mockResolvedValue(undefined),
    leaveRequestDecided: vi.fn().mockResolvedValue(undefined),
  };
});
afterEach(() => vi.restoreAllMocks());
afterAll(async () => Promise.all(dbs.map((d) => d.close())));

const decide = (
  session: { userId: string; role: "employee" | "manager" | "hr_admin" },
  id: string,
  body: unknown,
  store: DecideStore = createPostgresDecideStore(sql),
) => decideLeaveRequest(session, id, body, { store, notifier });

const requestRow = async (id: string) =>
  (
    await db.query<{
      status: string;
      decided_by: string | null;
      decision_reason: string | null;
      decided: boolean;
    }>(
      `select status::text, decided_by, decision_reason, decided_at is not null decided
       from leave_requests where id = $1`,
      [id],
    )
  ).rows[0]!;
const balance = async (userId: string, typeId: string) => {
  const [r] = (
    await db.query<{ balance: string }>(
      `select balance::text from leave_balances where user_id = $1 and leave_type_id = $2`,
      [userId, typeId],
    )
  ).rows;
  return r ? Number(r.balance) : undefined;
};
const audit = async (id: string) =>
  (
    await db.query<{ action: string; actor_id: string }>(
      `select action::text, actor_id from audit_log where leave_request_id = $1 order by occurred_at, action`,
      [id],
    )
  ).rows;
const snapshot = async (id: string, userId: string) => ({
  request: await requestRow(id),
  vacation: await balance(userId, Vacation),
  sick: await balance(userId, Sick),
  audit: await audit(id),
});

describe("AC1 — approving a direct report's pending request", () => {
  it("sets approved, decrements only that leave type, writes an audit row, notifies the employee", async () => {
    const { request, warnings } = await decide(BEN, R.jordanVacation, { decision: "approve" });

    expect(await requestRow(R.jordanVacation)).toMatchObject({
      status: "approved",
      decided_by: USER_IDS.ben,
      decided: true,
      decision_reason: null,
    });
    expect(await balance(USER_IDS.jordan, Vacation)).toBe(1.5); // 6.5 − 5
    expect(await balance(USER_IDS.jordan, Sick)).toBe(3); // untouched (US-08 / TASK-018)
    expect(await audit(R.jordanVacation)).toEqual([
      { action: "submitted", actor_id: USER_IDS.jordan },
      { action: "approved", actor_id: USER_IDS.ben },
    ]);
    expect(request).toMatchObject({ status: "approved", decidedByName: "Ben Ortiz", days: 5 });
    expect(warnings).toEqual([]);
    expect(notifier.leaveRequestDecided).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: R.jordanVacation,
        decision: "approved",
        employee: expect.objectContaining({ id: USER_IDS.jordan, name: "Jordan Lee" }),
        manager: { id: USER_IDS.ben, name: "Ben Ortiz" },
      }),
    );
  });

  it("stores an optional approval note", async () => {
    await decide(BEN, R.jordanVacation, { decision: "approve", reason: "Enjoy!" });
    expect((await requestRow(R.jordanVacation)).decision_reason).toBe("Enjoy!");
  });

  it("approving Unpaid changes no balance (US-08)", async () => {
    const before = (await db.query(`select * from leave_balances order by id`)).rows;
    await decide(BEN, R.jordanUnpaid, { decision: "approve" });
    expect((await db.query(`select * from leave_balances order by id`)).rows).toEqual(before);
    expect((await requestRow(R.jordanUnpaid)).status).toBe("approved");
  });

  it("decision audit occurred_at equals decided_at exactly (DB time, review TASK-011 #1)", async () => {
    await decide(BEN, R.jordanVacation, { decision: "approve" });
    const [r] = (
      await db.query<{ same: boolean }>(
        `select a.occurred_at = r.decided_at same from audit_log a
         join leave_requests r on r.id = a.leave_request_id
         where r.id = $1 and a.action = 'approved'`,
        [R.jordanVacation],
      )
    ).rows;
    expect(r?.same).toBe(true);
  });
});

describe("AC2 — rejecting with a reason", () => {
  it("sets rejected, stores the reason, leaves the balance unchanged, writes an audit row", async () => {
    const { warnings } = await decide(BEN, R.anaVacation, {
      decision: "reject",
      reason: "Release freeze",
    });
    expect(await requestRow(R.anaVacation)).toMatchObject({
      status: "rejected",
      decided_by: USER_IDS.ben,
      decision_reason: "Release freeze",
    });
    expect(await balance(USER_IDS.ana, Vacation)).toBe(11.25);
    expect((await audit(R.anaVacation)).at(-1)).toEqual({
      action: "rejected",
      actor_id: USER_IDS.ben,
    });
    expect(warnings).toEqual([]);
  });

  it.each([
    ["no reason", { decision: "reject" }],
    ["blank reason", { decision: "reject", reason: "  \n " }],
    ["unknown decision", { decision: "maybe" }],
  ])("%s → VALIDATION_ERROR and nothing changes", async (_l, body) => {
    const before = await snapshot(R.anaVacation, USER_IDS.ana);
    await expect(decide(BEN, R.anaVacation, body)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
    expect(await snapshot(R.anaVacation, USER_IDS.ana)).toEqual(before);
  });
});

describe("AC3 — acting on a non-direct-report's request", () => {
  it("returns 403 and changes nothing", async () => {
    const before = await snapshot(R.jordanVacation, USER_IDS.jordan);
    const err = await decide(MAYA, R.jordanVacation, { decision: "approve" }).catch((e) => e);
    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ code: "FORBIDDEN", status: 403 });
    expect(await snapshot(R.jordanVacation, USER_IDS.jordan)).toEqual(before);
    expect(notifier.leaveRequestDecided).not.toHaveBeenCalled();
  });

  it("…and that request never appeared in the acting manager's queue", async () => {
    const queue = await createPostgresRepository(sql, mockRepository).listTeamRequests(
      USER_IDS.maya,
    );
    expect(queue.map((r) => r.id)).not.toContain(R.jordanVacation);
  });

  it.each([
    ["an employee", ANA],
    ["an HR admin", CARLA],
  ])("rejects %s before touching the database", async (_l, session) => {
    const store: DecideStore = { decideWithAudit: vi.fn() };
    await expect(
      decide(session, R.jordanVacation, { decision: "approve" }, store),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(store.decideWithAudit).not.toHaveBeenCalled();
  });
});

describe("outcomes: 404 / 409 / 400", () => {
  it("404 for an unknown id and for a soft-deleted request", async () => {
    await expect(
      decide(BEN, "20000000-0000-4000-8000-000000000999", { decision: "approve" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await db.query(`update leave_requests set is_deleted = true where id = $1`, [R.diegoVacation]);
    await expect(decide(MAYA, R.diegoVacation, { decision: "approve" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("400 for a non-uuid id", async () => {
    await expect(decide(BEN, "abc", { decision: "approve" })).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("409 for an already-decided request (approved in the seed)", async () => {
    await expect(
      decide(BEN, R.anaApproved, { decision: "reject", reason: "late" }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});

describe("duplicate-deduction safeguards", () => {
  it("approve twice → second is 409 and the balance is decremented exactly once", async () => {
    await decide(BEN, R.jordanVacation, { decision: "approve" });
    await expect(decide(BEN, R.jordanVacation, { decision: "approve" })).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(await balance(USER_IDS.jordan, Vacation)).toBe(1.5);
    expect((await audit(R.jordanVacation)).filter((a) => a.action === "approved")).toHaveLength(1);
  });

  it("approve then reject → 409, status and balance keep the first decision", async () => {
    await decide(BEN, R.jordanVacation, { decision: "approve" });
    await expect(
      decide(BEN, R.jordanVacation, { decision: "reject", reason: "changed my mind" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await requestRow(R.jordanVacation)).status).toBe("approved");
    expect(await balance(USER_IDS.jordan, Vacation)).toBe(1.5);
  });

  it("two concurrent approvals → exactly one succeeds, one conflicts, one decrement", async () => {
    const results = await Promise.allSettled([
      decide(BEN, R.jordanVacation, { decision: "approve" }),
      decide(BEN, R.jordanVacation, { decision: "approve" }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    expect(rejected).toHaveLength(1);
    expect(rejected[0]!.reason).toMatchObject({ code: "CONFLICT" });
    expect(await balance(USER_IDS.jordan, Vacation)).toBe(1.5);
  });

  it("DB backstop: an existing decision audit row aborts the whole decision (no decrement)", async () => {
    // Simulate a bug elsewhere that wrote a decision row while the request stayed pending.
    await db.query(
      `insert into audit_log (leave_request_id, actor_id, action) values ($1, $2, 'approved')`,
      [R.jordanVacation, USER_IDS.ben],
    );
    await expect(decide(BEN, R.jordanVacation, { decision: "approve" })).rejects.toThrow(
      /audit_log_one_decision_per_request/,
    );
    expect((await requestRow(R.jordanVacation)).status).toBe("pending");
    expect(await balance(USER_IDS.jordan, Vacation)).toBe(6.5);
  });
});

describe("negative balances — allowed, but warned", () => {
  it("over-balance approval succeeds with a NEGATIVE_BALANCE warning (Sam: 3.75 − 5)", async () => {
    const warn = vi.spyOn(logger, "warn");
    const { warnings } = await decide(MAYA, R.samVacation, { decision: "approve" });
    expect(await balance(USER_IDS.sam, Vacation)).toBe(-1.25);
    expect(warnings).toEqual([
      {
        code: "NEGATIVE_BALANCE",
        message: "Sam Okafor's Vacation balance is now -1.25 days (HR override).",
        leaveType: "Vacation",
        balanceAfter: -1.25,
      },
    ]);
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: R.samVacation, balanceAfter: -1.25 }),
      "approval left a negative balance",
    );
  });

  it("a missing balance row is created at −days (upsert) and warned", async () => {
    await db.query(`delete from leave_balances where user_id = $1 and leave_type_id = $2`, [
      USER_IDS.jordan,
      Vacation,
    ]);
    const { warnings } = await decide(BEN, R.jordanVacation, { decision: "approve" });
    expect(await balance(USER_IDS.jordan, Vacation)).toBe(-5);
    expect(warnings[0]).toMatchObject({ code: "NEGATIVE_BALANCE", balanceAfter: -5 });
  });

  it.each([
    ["in-balance approval", BEN, R.jordanVacation, { decision: "approve" }],
    ["rejection", BEN, R.anaVacation, { decision: "reject", reason: "Not this week" }],
    ["Unpaid approval", BEN, R.jordanUnpaid, { decision: "approve" }],
  ])("no warning for %s", async (_l, session, id, body) => {
    expect((await decide(session, id, body)).warnings).toEqual([]);
  });
});

describe("notification failures are logged and never affect the decision", () => {
  it.each([
    ["approval", R.jordanVacation, { decision: "approve" }, "approved"],
    ["rejection", R.anaVacation, { decision: "reject", reason: "Not this week" }, "rejected"],
  ])("%s still commits and returns success", async (_l, id, body, status) => {
    notifier.leaveRequestDecided.mockRejectedValueOnce(new Error("smtp down"));
    const error = vi.spyOn(logger, "error");
    const result = await decide(BEN, id, body);
    expect(result.request.status).toBe(status);
    expect((await requestRow(id)).status).toBe(status);
    expect((await audit(id)).at(-1)?.action).toBe(status);
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: id, event: "leave_request.decided" }),
      "employee notification failed",
    );
  });
});

describe("atomicity and SQL scoping", () => {
  it("a failing audit insert rolls back the status change and the decrement", async () => {
    const failing: SqlClient = {
      query: (t, p) => sql.query(t, p),
      transaction: (fn) =>
        sql.transaction((tx) =>
          fn({
            query: (t, p) => {
              if (/insert into audit_log/i.test(t)) throw new Error("audit insert failed");
              return tx.query(t, p);
            },
            transaction: tx.transaction,
          }),
        ),
    };
    const before = await snapshot(R.jordanVacation, USER_IDS.jordan);
    await expect(
      decide(BEN, R.jordanVacation, { decision: "approve" }, createPostgresDecideStore(failing)),
    ).rejects.toThrow("audit insert failed");
    expect(await snapshot(R.jordanVacation, USER_IDS.jordan)).toEqual(before);
  });

  it("the decision UPDATE carries the manager scope and the pending guard (BR-02)", async () => {
    const seen: { text: string; params: readonly unknown[] }[] = [];
    const recording: SqlClient = {
      query: (t, p = []) => sql.query(t, p),
      transaction: (fn) =>
        sql.transaction((tx) =>
          fn({
            query: (t, p = []) => {
              seen.push({ text: t, params: p });
              return tx.query(t, p);
            },
            transaction: tx.transaction,
          }),
        ),
    };
    await decide(
      BEN,
      R.jordanVacation,
      { decision: "approve" },
      createPostgresDecideStore(recording),
    );
    const update = seen.find((q) => /^\s*update leave_requests/i.test(q.text));
    expect(update?.text).toMatch(/u\.manager_id\s*=\s*\$2/);
    expect(update?.text).toMatch(/r\.status\s*=\s*'pending'/);
    expect(update?.params[1]).toBe(USER_IDS.ben);
  });
});

describe("review TASK-011 #1 — submit audit timestamp is exact", () => {
  it("submitted audit occurred_at equals the request's created_at (microseconds)", async () => {
    const { request } = await submitLeaveRequest(
      { userId: USER_IDS.ana },
      { leaveTypeId: Sick, startDate: "2027-03-01", endDate: "2027-03-02", reason: "Checkup" },
      { store: createPostgresSubmitStore(sql), notifier },
    );
    const [r] = (
      await db.query<{ same: boolean }>(
        `select a.occurred_at = r.created_at same from audit_log a
         join leave_requests r on r.id = a.leave_request_id
         where r.id = $1 and a.action = 'submitted'`,
        [request.id],
      )
    ).rows;
    expect(r?.same).toBe(true);
  });
});
