import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LEAVE_TYPE_IDS, USER_IDS } from "@/lib/data/mock/fixtures";
import { mockDb, resetMockDb } from "@/lib/data/mock/store";
import { toAppError } from "@/lib/db/errors";
import type { SqlClient } from "@/lib/db/sql";
import { decideLeaveRequest } from "@/lib/leave-requests/decide";
import { memoryDecideStore, memorySubmitStore } from "@/lib/leave-requests/memory-store";
import type { Notifier } from "@/lib/leave-requests/notifier";
import {
  createPostgresDecideStore,
  createPostgresSubmitStore,
} from "@/lib/leave-requests/postgres-store";
import type { DecideStore, NewLeaveRequest, SubmitStore } from "@/lib/leave-requests/store";
import { submitLeaveRequest } from "@/lib/leave-requests/submit";
import {
  LeaveRequestSchema,
  MAX_LENGTH_MESSAGE,
  MAX_REQUEST_DAYS,
  OVERLAP_MESSAGE,
} from "@/lib/validation/leave-request";
import { asHistorical, closeAfterEachTest, createTestDb } from "../db/helpers";
import { daysFromToday } from "../support/dates";

/**
 * TASK-027 (US-16 AC1–AC2, BR-13, ARCH D10) — request integrity on BOTH stores with one case
 * table: no overlapping pending/approved requests per person, at most 90 days, no past start
 * except the type's max_backdate_days (Sick 30). The service gives friendly 400s; the database
 * (and its memory mirror) is the backstop, mapped to the same 400 by toAppError. All dates are
 * relative to today (UTC), so nothing here goes stale.
 */
const { Vacation, Sick, Unpaid } = LEAVE_TYPE_IDS;
const { ana, jordan, ben } = USER_IDS;
const d = daysFromToday;

type Backend = {
  submitStore: SubmitStore;
  decideStore: DecideStore;
  count(userId: string): Promise<number>;
  softDelete(requestId: string): Promise<void>;
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
    async count(userId) {
      return (
        await db.query<{ n: number }>(
          `select count(*)::int n from leave_requests where user_id = $1`,
          [userId],
        )
      ).rows[0]!.n;
    },
    async softDelete(id) {
      await db.query(`update leave_requests set is_deleted = true where id = $1`, [id]);
    },
  };
}

async function memory(): Promise<Backend> {
  resetMockDb();
  return {
    submitStore: memorySubmitStore,
    decideStore: memoryDecideStore,
    async count(userId) {
      return mockDb.leaveRequests.filter((r) => r.userId === userId).length;
    },
    async softDelete(id) {
      mockDb.leaveRequests.find((r) => r.id === id)!.isDeleted = true;
    },
  };
}

let notifier: Notifier & {
  leaveRequestSubmitted: ReturnType<typeof vi.fn>;
  leaveRequestDecided: ReturnType<typeof vi.fn>;
};
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

/** A store error, as a client sees it (toAppError, as the route handler / server action do). */
const asClient = (e: unknown) => toAppError(e) ?? e;

describe.each<[string, () => Promise<Backend>]>([
  ["postgres", postgres],
  ["memory", memory],
])("%s store — request integrity", (_name, make) => {
  let b: Backend;
  beforeEach(async () => {
    b = await make();
  });
  const submit = (userId: string, leaveTypeId: string, start: string, end: string) =>
    submitLeaveRequest(
      { userId },
      { leaveTypeId, startDate: start, endDate: end, reason: "Family visit" },
      { store: b.submitStore, notifier },
    );
  const insert = (input: Partial<NewLeaveRequest>) =>
    b.submitStore.insertRequestWithAudit({
      userId: ana,
      leaveTypeId: Vacation,
      startDate: d(70),
      endDate: d(71),
      reason: "direct insert",
      ...input,
    });

  describe("AC1 — overlapping pending/approved requests by the same person are refused (400)", () => {
    it.each([
      ["the same days", 70, 72],
      ["a partial overlap at the start", 68, 70],
      ["a partial overlap at the end", 72, 75],
      ["a range inside it", 71, 71],
      ["a range around it", 65, 80],
    ])("%s", async (_l, start, end) => {
      await submit(ana, Vacation, d(70), d(72));
      const before = await b.count(ana);
      await expect(submit(ana, Vacation, d(start), d(end))).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        status: 400,
        message: OVERLAP_MESSAGE,
      });
      expect(await b.count(ana)).toBe(before);
    });

    it("across leave types too (Sick over a pending Vacation)", async () => {
      await submit(ana, Vacation, d(70), d(72));
      await expect(submit(ana, Sick, d(71), d(71))).rejects.toMatchObject({
        message: OVERLAP_MESSAGE,
      });
    });

    it("adjacent days are fine; another person's request is fine", async () => {
      await submit(ana, Vacation, d(70), d(72));
      await expect(submit(ana, Vacation, d(73), d(74))).resolves.toBeTruthy();
      await expect(submit(ana, Vacation, d(68), d(69))).resolves.toBeTruthy();
      await expect(submit(jordan, Vacation, d(70), d(72))).resolves.toBeTruthy();
    });

    it("an APPROVED request blocks; a REJECTED or soft-deleted one does not", async () => {
      const { request: approved } = await submit(ana, Vacation, d(70), d(72));
      await decideLeaveRequest(
        { userId: ben, role: "manager" },
        approved.id,
        { decision: "approve" },
        { store: b.decideStore, notifier },
      );
      await expect(submit(ana, Vacation, d(71), d(71))).rejects.toMatchObject({
        message: OVERLAP_MESSAGE,
      });

      const { request: rejected } = await submit(ana, Vacation, d(80), d(82));
      await decideLeaveRequest(
        { userId: ben, role: "manager" },
        rejected.id,
        { decision: "reject", reason: "Busy week" },
        { store: b.decideStore, notifier },
      );
      await expect(submit(ana, Vacation, d(80), d(82))).resolves.toBeTruthy();

      const { request: gone } = await submit(ana, Vacation, d(90), d(91));
      await b.softDelete(gone.id);
      await expect(submit(ana, Vacation, d(90), d(91))).resolves.toBeTruthy();
    });

    it("the backstop: a direct overlapping insert (no service pre-check) is refused and maps to 400", async () => {
      await insert({ startDate: d(70), endDate: d(72) });
      const err = await insert({ startDate: d(71), endDate: d(73) }).then(
        () => null,
        (e: unknown) => e,
      );
      expect(err).toMatchObject({ code: "23P01", constraint: "leave_requests_no_overlap" });
      expect(asClient(err)).toMatchObject({ code: "VALIDATION_ERROR", message: OVERLAP_MESSAGE });
    });
  });

  describe("AC2 — two simultaneous overlapping submissions create exactly one request", () => {
    it("through the service", async () => {
      const before = await b.count(ana);
      const results = await Promise.allSettled([
        submit(ana, Vacation, d(70), d(72)),
        submit(ana, Vacation, d(71), d(73)),
      ]);
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      const failed = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
      expect(asClient(failed.reason)).toMatchObject({ code: "VALIDATION_ERROR" });
      expect(await b.count(ana)).toBe(before + 1);
    });

    it("straight at the store (no pre-check at all): the database decides", async () => {
      const before = await b.count(ana);
      const results = await Promise.allSettled([
        insert({ startDate: d(70), endDate: d(72) }),
        insert({ startDate: d(70), endDate: d(72) }),
      ]);
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect(await b.count(ana)).toBe(before + 1);
    });
  });

  describe(`AC3 — more than ${MAX_REQUEST_DAYS} days is refused`, () => {
    it("90 days is accepted, 91 refused (service)", async () => {
      await expect(submit(ana, Unpaid, d(70), d(70 + 89))).resolves.toBeTruthy();
      await expect(submit(jordan, Unpaid, d(70), d(70 + 90))).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        message: MAX_LENGTH_MESSAGE,
      });
    });

    it("the backstop refuses 91 days on a direct insert, mapped to 400", async () => {
      const err = await insert({ startDate: d(70), endDate: d(160) }).then(
        () => null,
        (e: unknown) => e,
      );
      expect(err).toMatchObject({ constraint: "leave_requests_max_length" });
      expect(asClient(err)).toMatchObject({
        code: "VALIDATION_ERROR",
        message: MAX_LENGTH_MESSAGE,
      });
    });
  });

  describe("AC3/AC4 — past start dates: none, except up to the type's allowance (Sick 30)", () => {
    it("today is fine for every type", async () => {
      await expect(submit(ana, Vacation, d(0), d(0))).resolves.toBeTruthy();
    });

    it.each([
      ["Vacation, yesterday", Vacation, -1, "Start date can't be in the past."],
      ["Unpaid, yesterday", Unpaid, -1, "Start date can't be in the past."],
      ["Sick, 31 days ago", Sick, -31, "Sick leave can start at most 30 days ago."],
    ])("%s → 400", async (_l, type, offset, message) => {
      await expect(submit(ana, type, d(offset), d(offset))).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        message,
      });
    });

    it("Sick 30 days back is accepted (AC4)", async () => {
      const { request } = await submit(ana, Sick, d(-30), d(-29));
      expect(request).toMatchObject({ status: "pending", leaveType: "Sick" });
    });

    it("the backstop refuses a past start on a direct insert, mapped to 400", async () => {
      const err = await insert({ startDate: d(-1), endDate: d(0) }).then(
        () => null,
        (e: unknown) => e,
      );
      expect(err).toMatchObject({ constraint: "leave_requests_backdate_window" });
      expect(asClient(err)).toMatchObject({ code: "VALIDATION_ERROR" });
      await expect(
        insert({ leaveTypeId: Sick, startDate: d(-30), endDate: d(-30) }),
      ).resolves.toBeTruthy();
    });
  });
});

describe("zod (shared by the form and the server)", () => {
  const base = { leaveTypeId: Vacation, reason: "Family visit" };
  it("90 days parse, 91 don't — with the same message as the server", () => {
    expect(
      LeaveRequestSchema.safeParse({ ...base, startDate: "2030-01-01", endDate: "2030-03-31" })
        .success,
    ).toBe(true); // 90 days
    const r = LeaveRequestSchema.safeParse({
      ...base,
      startDate: "2030-01-01",
      endDate: "2030-04-01",
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.message)).toContain(MAX_LENGTH_MESSAGE);
  });
});

describe("postgres only — the trigger and its seed-only escape hatch", () => {
  it("the escape hatch is honoured only inside the transaction that sets it", async () => {
    await postgres();
    const pastInsert = (q: { query: PGlite["query"] }) =>
      q.query(
        `insert into leave_requests (user_id, leave_type_id, start_date, end_date, reason)
         values ($1, $2, current_date - 400, current_date - 399, 'history')`,
        [jordan, Vacation],
      );
    await expect(asHistorical(db, (tx) => pastInsert(tx))).resolves.toBeTruthy();
    await expect(pastInsert(db)).rejects.toMatchObject({
      constraint: "leave_requests_backdate_window",
    });
  });

  it("the window is keyed on max_backdate_days, not on the type's name", async () => {
    await postgres();
    await db.query(`update leave_types set max_backdate_days = 10 where id = $1`, [Vacation]);
    // Dates from the shared helper (UTC today), like every other request date in the tests.
    const insertAt = (offset: number) =>
      db.query(
        `insert into leave_requests (user_id, leave_type_id, start_date, end_date, reason)
         values ($1, $2, $3::date, $3::date, 'x')`,
        [jordan, Vacation, d(offset)],
      );
    await expect(insertAt(-10)).resolves.toBeTruthy();
    await expect(insertAt(-11)).rejects.toMatchObject({
      constraint: "leave_requests_backdate_window",
    });
  });

  it("leave_types.max_backdate_days: Sick 30, others 0", async () => {
    await postgres();
    const rows = (
      await db.query<{ name: string; days: number }>(
        `select name, max_backdate_days days from leave_types order by name`,
      )
    ).rows;
    expect(rows).toEqual([
      { name: "Sick", days: 30 },
      { name: "Unpaid", days: 0 },
      { name: "Vacation", days: 0 },
    ]);
  });
});

describe("structure", () => {
  const root = path.resolve(import.meta.dirname, "../..");
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = path.join(dir, f);
      return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
    });

  it("application code never uses the seed-only escape hatch", () => {
    const users = ["app", "lib", "components", "scripts"]
      .flatMap((d) => files(path.join(root, d)))
      .filter((f) => readFileSync(f, "utf8").includes("allow_backdated"));
    expect(users.map((f) => path.relative(root, f))).toEqual([]);
  });

  it("the seed switches it on for its historical rows and off again at the end", () => {
    const seed = readFileSync(path.join(root, "supabase/seed.sql"), "utf8");
    const on = seed.indexOf("set_config('leavetrack.allow_backdated', 'on', false)");
    const off = seed.lastIndexOf("set_config('leavetrack.allow_backdated', 'off', false)");
    expect(on).toBeGreaterThan(-1);
    expect(off).toBeGreaterThan(on);
    expect(seed.slice(off).match(/insert into/gi)).toBeNull(); // nothing inserted after "off"
  });

  it("the past-start rule keys on the attribute, never on the name 'Sick'", () => {
    const sources = [
      "lib/leave-requests/submit.ts",
      "lib/leave-requests/memory-store.ts",
      "supabase/migrations/20261203000000_request_integrity.sql",
    ].map((f) => readFileSync(path.join(root, f), "utf8"));
    for (const src of sources) {
      expect(src).toMatch(/max_?[Bb]ackdate_?[Dd]ays/);
      expect(src).not.toMatch(/name\s*(===|=)\s*['"]Sick['"]/);
    }
  });
});
