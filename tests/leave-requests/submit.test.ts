import type { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/api/errors";
import { LEAVE_TYPE_IDS, USER_IDS } from "@/lib/data/mock/fixtures";
import type { SqlClient } from "@/lib/db/sql";
import type { Notifier } from "@/lib/leave-requests/notifier";
import { createPostgresSubmitStore } from "@/lib/leave-requests/postgres-store";
import { submitLeaveRequest } from "@/lib/leave-requests/submit";
import { closeAfterEachTest, createTestDb } from "../db/helpers";

/**
 * TASK-011 / US-01 — the submit service against real Postgres (PGlite) with the
 * production SQL store, real constraints, and real transactions.
 * Each test gets a fresh database, so tests are order-independent.
 */

const ANA = { userId: USER_IDS.ana }; // employee, manager Ben, Vacation 11.25 confirmed / 11 pending
const CARLA = { userId: USER_IDS.carla }; // hr_admin, no manager
const { Vacation, Sick, Unpaid } = LEAVE_TYPE_IDS;

const valid = (overrides: Record<string, unknown> = {}) => ({
  leaveTypeId: Sick,
  startDate: "2027-03-01",
  endDate: "2027-03-02",
  reason: "Recovering from surgery",
  ...overrides,
});

let db: PGlite;
let sql: SqlClient;
let notifier: Notifier & { leaveRequestSubmitted: ReturnType<typeof vi.fn> };
const track = closeAfterEachTest(); // B30: each test's database closes after that test

beforeEach(async () => {
  ({ db, sql } = await createTestDb());
  track(db);
  notifier = {
    leaveRequestSubmitted: vi.fn().mockResolvedValue(undefined),
    leaveRequestDecided: vi.fn().mockResolvedValue(undefined),
  };
});

const submit = (session: { userId: string }, input: unknown, client: SqlClient = sql) =>
  submitLeaveRequest(session, input, { store: createPostgresSubmitStore(client), notifier });

async function counts() {
  const [r] = (
    await db.query<{ requests: number; audit: number }>(
      `select (select count(*)::int from leave_requests) requests,
              (select count(*)::int from audit_log) audit`,
    )
  ).rows;
  return r!;
}

describe("AC1 — a valid submission creates a pending request and notifies the manager", () => {
  it("creates exactly one pending row owned by the session user", async () => {
    const before = await counts();
    const { request, warnings } = await submit(ANA, valid());

    const rows = (
      await db.query<{
        user_id: string;
        status: string;
        leave_type_id: string;
        start_date: string;
      }>(
        `select user_id, status::text, leave_type_id, start_date::text from leave_requests where id = $1`,
        [request.id],
      )
    ).rows;
    expect(rows).toEqual([
      { user_id: USER_IDS.ana, status: "pending", leave_type_id: Sick, start_date: "2027-03-01" },
    ]);
    expect((await counts()).requests).toBe(before.requests + 1);
    expect(request).toMatchObject({ status: "pending", leaveType: "Sick", days: 2 });
    expect(warnings).toEqual([]);
  });

  it("writes a `submitted` audit row by the requester for the new request", async () => {
    const { request } = await submit(ANA, valid());
    const audit = (
      await db.query<{ actor_id: string; action: string }>(
        `select actor_id, action::text from audit_log where leave_request_id = $1`,
        [request.id],
      )
    ).rows;
    expect(audit).toEqual([{ actor_id: USER_IDS.ana, action: "submitted" }]);
  });

  it("notifies the requester's manager once, after the row exists", async () => {
    const { request } = await submit(ANA, valid());
    expect(notifier.leaveRequestSubmitted).toHaveBeenCalledTimes(1);
    expect(notifier.leaveRequestSubmitted).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: request.id,
        employee: { id: USER_IDS.ana, name: "Ana Reyes" },
        approver: {
          kind: "manager",
          id: USER_IDS.ben,
          name: "Ben Ortiz",
          email: "ben.ortiz@leavetrack.test",
        },
        leaveType: "Sick",
        days: 2,
      }),
    );
  });
});

describe("AC2 — end date before start date is rejected, no row created", () => {
  it("throws VALIDATION_ERROR and writes nothing", async () => {
    const before = await counts();
    const err = await submit(ANA, valid({ startDate: "2027-03-10", endDate: "2027-03-01" })).catch(
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ code: "VALIDATION_ERROR", status: 400 });
    expect((err as AppError).message).toMatch(/End date can't be before the start date/);
    expect(await counts()).toEqual(before);
    expect(notifier.leaveRequestSubmitted).not.toHaveBeenCalled();
  });

  it.each([
    ["missing leave type", { leaveTypeId: undefined }],
    ["non-uuid leave type", { leaveTypeId: "vacation" }],
    ["unknown leave type", { leaveTypeId: "10000000-0000-4000-8000-000000000099" }],
    ["invalid date", { startDate: "2027-02-30" }],
    ["blank reason", { reason: "   " }],
    ["over-long reason", { reason: "x".repeat(501) }],
  ])("rejects %s with VALIDATION_ERROR and writes nothing", async (_label, overrides) => {
    const before = await counts();
    await expect(submit(ANA, valid(overrides))).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(await counts()).toEqual(before);
  });
});

describe("AC3 — over-balance submission warns but is still created", () => {
  it("creates the request and returns an EXCEEDS_BALANCE warning with the numbers", async () => {
    // Ana: Vacation 11.25 confirmed − 11 already pending = 0.25 available.
    const { request, warnings } = await submit(
      ANA,
      valid({ leaveTypeId: Vacation, startDate: "2027-04-05", endDate: "2027-04-09" }),
    );
    expect(request.status).toBe("pending");
    expect(warnings).toEqual([
      expect.objectContaining({ code: "EXCEEDS_BALANCE", requestedDays: 5, availableDays: 0.25 }),
    ]);
    expect(
      (await db.query(`select 1 from leave_requests where id = $1`, [request.id])).rows,
    ).toHaveLength(1);
  });

  it("does not warn when the request fits the available balance", async () => {
    // Ana: Sick 5 confirmed, nothing pending; 2 days fits.
    expect((await submit(ANA, valid())).warnings).toEqual([]);
  });

  it("never balance-checks Unpaid leave (US-08 AC2)", async () => {
    const { warnings } = await submit(
      ANA,
      valid({ leaveTypeId: Unpaid, startDate: "2027-05-01", endDate: "2027-07-31" }),
    );
    expect(warnings).toEqual([]);
  });
});

describe("security and robustness", () => {
  it("ignores a userId in the body — the requester is always the session user", async () => {
    const { request } = await submit(ANA, { ...valid(), userId: USER_IDS.jordan });
    const [row] = (
      await db.query<{ user_id: string }>(`select user_id from leave_requests where id = $1`, [
        request.id,
      ])
    ).rows;
    expect(row?.user_id).toBe(USER_IDS.ana);
  });

  it("rejects a session user that doesn't exist", async () => {
    await expect(
      submit({ userId: "00000000-0000-4000-8000-000000000999" }, valid()),
    ).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("TASK-026 AC3 (B2 closed): the only HR Admin has no approver → 409, nothing created, nobody notified", async () => {
    const before = await counts();
    await expect(submit(CARLA, valid())).rejects.toMatchObject({ code: "CONFLICT", status: 409 });
    expect(await counts()).toEqual(before);
    expect(notifier.leaveRequestSubmitted).not.toHaveBeenCalled();
  });

  it("keeps the request when the notifier fails", async () => {
    notifier.leaveRequestSubmitted.mockRejectedValueOnce(new Error("smtp down"));
    const before = await counts();
    const { request } = await submit(ANA, valid());
    expect(request.status).toBe("pending");
    expect((await counts()).requests).toBe(before.requests + 1);
  });

  it("rolls back the request if the audit insert fails (atomic)", async () => {
    const failingAudit: SqlClient = {
      query: (text, params) => sql.query(text, params),
      transaction: (fn) =>
        sql.transaction((tx) =>
          fn({
            query: (text, params) => {
              if (/insert into audit_log/i.test(text)) throw new Error("audit insert failed");
              return tx.query(text, params);
            },
            transaction: tx.transaction,
          }),
        ),
    };
    const before = await counts();
    await expect(submit(ANA, valid(), failingAudit)).rejects.toThrow("audit insert failed");
    expect(await counts()).toEqual(before);
    expect(notifier.leaveRequestSubmitted).not.toHaveBeenCalled();
  });
});
