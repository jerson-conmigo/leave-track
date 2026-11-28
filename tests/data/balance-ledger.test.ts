import type { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPostgresAccrualStore } from "@/lib/accrual/postgres-store";
import { memoryAccrualStore } from "@/lib/accrual/memory-store";
import { runMonthlyAccrual } from "@/lib/accrual/run";
import type { AccrualStore } from "@/lib/accrual/store";
import { LEAVE_TYPE_IDS, USER_IDS } from "@/lib/data/mock/fixtures";
import { appendLedger, mockDb, resetMockDb } from "@/lib/data/mock/store";
import type { LedgerEntry } from "@/lib/data/types";
import { toAppError } from "@/lib/db/errors";
import type { SqlClient } from "@/lib/db/sql";
import { toNumber } from "@/lib/db/sql";
import { decideLeaveRequest } from "@/lib/leave-requests/decide";
import { memoryDecideStore } from "@/lib/leave-requests/memory-store";
import type { Notifier } from "@/lib/leave-requests/notifier";
import { createPostgresDecideStore } from "@/lib/leave-requests/postgres-store";
import type { DecideStore } from "@/lib/leave-requests/store";
import { closeAfterEachTest, createTestDb } from "../db/helpers";

/**
 * TASK-029 (ADR-LeaveTrack-E006 §1) — the balance ledger, on BOTH stores with one case table:
 *   AC1 every balance change has exactly one ledger row (delta + balance_after match), and the
 *       ledger reconciles: per (user, type) sum(delta) = balance, latest balance_after = balance;
 *   AC2 a source_key can't be recorded twice;
 *   AC3 rows can't be updated or deleted;
 *   AC4 memory and Postgres produce identical ledgers for the same sequence.
 */
const req = (n: number) => `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const R = {
  anaVacation: req(1), // Ana, Vacation 11 days, pending — Ben's report
  jordanVacation: req(4), // Jordan, Vacation 5 days, pending — Ben's report
  jordanUnpaid: req(5), // Jordan, Unpaid 1 day, pending — untracked type
  samVacation: req(7), // Sam, Vacation 5 days vs 3.75 balance, pending — Maya's report
};
const { Vacation, Unpaid } = LEAVE_TYPE_IDS;
const BEN = { userId: USER_IDS.ben, role: "manager" as const };
const MAYA = { userId: USER_IDS.maya, role: "manager" as const };
/** Two months after the seeded last accrual (2026-11) → catch-up of Dec + Jan. */
const IN_JANUARY = new Date("2027-01-15T10:00:00Z");

type Row = Omit<LedgerEntry, "id" | "occurredAt">;
type Backend = {
  decideStore: DecideStore;
  accrualStore: AccrualStore;
  ledger(): Promise<Row[]>;
  balances(): Promise<{ userId: string; leaveTypeId: string; balance: number }[]>;
};

let db: PGlite;
let sql: SqlClient;
const track = closeAfterEachTest(); // B30: each test's database closes after that test

async function postgres(): Promise<Backend> {
  ({ db, sql } = await createTestDb());
  track(db);
  return {
    decideStore: createPostgresDecideStore(sql),
    accrualStore: createPostgresAccrualStore(sql),
    async ledger() {
      const rows = (
        await db.query<{
          user_id: string;
          leave_type_id: string;
          delta: string;
          balance_after: string;
          source: LedgerEntry["source"];
          source_key: string;
          leave_request_id: string | null;
          actor_id: string | null;
        }>(`select * from balance_ledger order by occurred_at, source_key`)
      ).rows;
      return rows.map((r) => ({
        userId: r.user_id,
        leaveTypeId: r.leave_type_id,
        delta: toNumber(r.delta),
        balanceAfter: toNumber(r.balance_after),
        source: r.source,
        sourceKey: r.source_key,
        leaveRequestId: r.leave_request_id,
        actorId: r.actor_id,
      }));
    },
    async balances() {
      return (
        await db.query<{ user_id: string; leave_type_id: string; balance: string }>(
          `select user_id, leave_type_id, balance from leave_balances`,
        )
      ).rows.map((b) => ({
        userId: b.user_id,
        leaveTypeId: b.leave_type_id,
        balance: toNumber(b.balance),
      }));
    },
  };
}

async function memory(): Promise<Backend> {
  resetMockDb();
  return {
    decideStore: memoryDecideStore,
    accrualStore: memoryAccrualStore,
    async ledger() {
      return mockDb.balanceLedger.map(({ id: _id, occurredAt: _at, ...rest }) => rest);
    },
    async balances() {
      return mockDb.leaveBalances.map((b) => ({
        userId: b.userId,
        leaveTypeId: b.leaveTypeId,
        balance: b.balance,
      }));
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

/** The reconciliation invariant: per (user, type) sum(delta) = balance = latest balance_after. */
async function expectReconciled(b: Backend) {
  const ledger = await b.ledger();
  for (const bal of await b.balances()) {
    const rows = ledger.filter((e) => e.userId === bal.userId && e.leaveTypeId === bal.leaveTypeId);
    const where = `${bal.userId}/${bal.leaveTypeId}`;
    expect(rows.length, where).toBeGreaterThan(0);
    expect(round(rows.reduce((s, e) => s + e.delta, 0)), `sum(delta) ${where}`).toBe(
      round(bal.balance),
    );
    expect(round(rows.at(-1)!.balanceAfter), `latest balance_after ${where}`).toBe(
      round(bal.balance),
    );
  }
  // and no ledger row for a (user, type) without a balance
  const keys = new Set((await b.balances()).map((x) => `${x.userId}/${x.leaveTypeId}`));
  expect(ledger.filter((e) => !keys.has(`${e.userId}/${e.leaveTypeId}`))).toEqual([]);
}

describe.each<[string, () => Promise<Backend>]>([
  ["postgres", postgres],
  ["memory", memory],
])("%s store — balance ledger", (_name, make) => {
  let b: Backend;
  beforeEach(async () => {
    b = await make();
  });
  const decide = (id: string, decision: "approve" | "reject" = "approve") =>
    decideLeaveRequest(
      BEN,
      id,
      decision === "approve" ? { decision } : { decision, reason: "Busy week" },
      { store: b.decideStore, notifier },
    );
  const accrue = (now: Date) =>
    runMonthlyAccrual({ store: b.accrualStore }, { trigger: "manual", now });

  it("starts reconciled: exactly one opening row per existing balance", async () => {
    const ledger = await b.ledger();
    const balances = await b.balances();
    expect(ledger.every((e) => e.source === "opening")).toBe(true);
    expect(ledger).toHaveLength(balances.length);
    await expectReconciled(b);
  });

  it("AC1: an approval writes exactly one row — delta −days, balance_after = the new balance", async () => {
    const before = (await b.ledger()).length;
    const { request } = await decide(R.jordanVacation);
    const rows = (await b.ledger()).slice(before);
    expect(rows).toHaveLength(1);
    const bal = (await b.balances()).find(
      (x) => x.userId === USER_IDS.jordan && x.leaveTypeId === Vacation,
    )!;
    expect(rows[0]).toMatchObject({
      userId: USER_IDS.jordan,
      leaveTypeId: Vacation,
      delta: -request.days,
      balanceAfter: bal.balance,
      source: "approval",
      sourceKey: `approval:${R.jordanVacation}`,
      leaveRequestId: R.jordanVacation,
      actorId: USER_IDS.ben,
    });
    await expectReconciled(b);
  });

  it("AC1: a rejection, or an approval of an untracked type (Unpaid), writes no row", async () => {
    const before = (await b.ledger()).length;
    await decide(R.jordanVacation, "reject");
    await decide(R.jordanUnpaid);
    expect(await b.ledger()).toHaveLength(before);
    expect((await b.ledger()).some((e) => e.leaveTypeId === Unpaid)).toBe(false);
  });

  it("AC1: an approval beyond the balance records the negative balance_after", async () => {
    await decideLeaveRequest(
      MAYA,
      R.samVacation,
      { decision: "approve" },
      {
        store: b.decideStore,
        notifier,
      },
    ); // 5 days vs 3.75
    const row = (await b.ledger()).at(-1)!;
    expect(row).toMatchObject({ source: "approval", delta: -5, balanceAfter: -1.25 });
    await expectReconciled(b);
  });

  it("AC1: accrual catch-up writes one row per month per tracked policy; a re-run writes none (AC2)", async () => {
    const before = (await b.ledger()).length;
    const result = await accrue(IN_JANUARY);
    expect(result.accrued.map((a) => a.period)).toEqual(["2026-12-01", "2027-01-01"]);
    const rows = (await b.ledger()).slice(before);
    const perMonth = (period: string) =>
      rows.filter((e) => e.sourceKey.startsWith(`accrual:${period}:`));
    expect(perMonth("2026-12-01").length).toBeGreaterThan(0);
    expect(perMonth("2026-12-01").length).toBe(perMonth("2027-01-01").length);
    expect(rows.every((e) => e.source === "accrual" && e.actorId === null && e.delta > 0)).toBe(
      true,
    );
    expect(new Set(rows.map((e) => e.sourceKey)).size).toBe(rows.length);
    await expectReconciled(b);

    await accrue(IN_JANUARY); // already up to date
    expect((await b.ledger()).length).toBe(before + rows.length);
  });

  it("AC2: the same source_key can't be recorded twice (maps to CONFLICT)", async () => {
    await decide(R.jordanVacation);
    const err = await (async () => {
      if (_name === "memory") {
        try {
          appendLedger({
            userId: USER_IDS.jordan,
            leaveTypeId: Vacation,
            delta: -1,
            balanceAfter: 0,
            source: "approval",
            sourceKey: `approval:${R.jordanVacation}`,
            leaveRequestId: R.jordanVacation,
            actorId: USER_IDS.ben,
            occurredAt: new Date().toISOString(),
          });
          return null;
        } catch (e) {
          return e;
        }
      }
      return db
        .query(
          `insert into balance_ledger (user_id, leave_type_id, delta, balance_after, source, source_key)
           values ($1, $2, -1, 0, 'approval', $3)`,
          [USER_IDS.jordan, Vacation, `approval:${R.jordanVacation}`],
        )
        .then(
          () => null,
          (e: unknown) => e,
        );
    })();
    expect(err).toMatchObject({ code: "23505", constraint: "balance_ledger_source_key_key" });
    expect(toAppError(err)).toMatchObject({ code: "CONFLICT" });
  });

  it("AC4 (parity input): the scripted sequence reconciles", async () => {
    await decide(R.jordanVacation);
    await decide(R.anaVacation);
    await decide(R.jordanUnpaid);
    await accrue(IN_JANUARY);
    await expectReconciled(b);
  });
});

describe("AC4 — memory and Postgres produce the SAME ledger for the same sequence", () => {
  it("opening rows, approvals (incl. over balance), an untracked approval and a 2-month catch-up", async () => {
    const script = async (b: Backend) => {
      const decide = (id: string) =>
        decideLeaveRequest(BEN, id, { decision: "approve" }, { store: b.decideStore, notifier });
      await decide(R.jordanVacation);
      await decide(R.anaVacation);
      await decide(R.jordanUnpaid);
      await runMonthlyAccrual({ store: b.accrualStore }, { trigger: "manual", now: IN_JANUARY });
      const norm = (rows: Row[]) =>
        rows
          .map((e) => ({ ...e, delta: round(e.delta), balanceAfter: round(e.balanceAfter) }))
          .sort((x, y) => x.sourceKey.localeCompare(y.sourceKey));
      return norm(await b.ledger());
    };
    const pg = await script(await postgres());
    const mem = await script(await memory());
    expect(pg.length).toBeGreaterThan(20);
    expect(mem).toEqual(pg);
  });
});

describe("postgres only — database backstops", () => {
  it.each([
    ["UPDATE", `update balance_ledger set delta = 99`],
    ["DELETE", `delete from balance_ledger`],
    ["TRUNCATE", `truncate balance_ledger`],
  ])("AC3: %s is refused (append-only) and maps to CONFLICT", async (_l, statement) => {
    await postgres();
    const err = await db.query(statement).then(
      () => null,
      (e: unknown) => e,
    );
    expect(err).toMatchObject({ constraint: "balance_ledger_append_only" });
    expect(toAppError(err)).toMatchObject({
      code: "CONFLICT",
      message: "Balance history can't be changed.",
    });
  });

  it("an untracked type (Unpaid) can't have ledger rows (the TASK-018 guard)", async () => {
    await postgres();
    const err = await db
      .query(
        `insert into balance_ledger (user_id, leave_type_id, delta, balance_after, source, source_key)
         values ($1, $2, 1, 1, 'accrual', 'test:unpaid')`,
        [USER_IDS.ana, Unpaid],
      )
      .then(
        () => null,
        (e: unknown) => e,
      );
    expect(err).toMatchObject({ constraint: "leave_type_must_track_balance" });
  });

  it("the opening backfill is idempotent (re-running it adds nothing)", async () => {
    await postgres();
    const count = async () =>
      (await db.query<{ n: number }>(`select count(*)::int n from balance_ledger`)).rows[0]!.n;
    const before = await count();
    await db.query(
      `insert into balance_ledger (user_id, leave_type_id, delta, balance_after, source, source_key, occurred_at)
       select b.user_id, b.leave_type_id, b.balance, b.balance, 'opening',
              'opening:' || b.user_id || ':' || b.leave_type_id, b.updated_at
         from leave_balances b
       on conflict (source_key) do nothing`,
    );
    expect(await count()).toBe(before);
  });

  it("a zero delta is only allowed for opening rows", async () => {
    await postgres();
    const err = await db
      .query(
        `insert into balance_ledger (user_id, leave_type_id, delta, balance_after, source, source_key)
         values ($1, $2, 0, 0, 'accrual', 'test:zero')`,
        [USER_IDS.ana, Vacation],
      )
      .then(
        () => null,
        (e: unknown) => e,
      );
    expect(err).toMatchObject({ constraint: "balance_ledger_delta_nonzero" });
  });
});
