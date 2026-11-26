import type { PGlite } from "@electric-sql/pglite";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { toAppError } from "@/lib/db/errors";
import { createTestDb } from "./helpers";

/**
 * TASK-018 — database constraint violations become consistent application errors.
 * Uses REAL errors raised by Postgres (PGlite), plus postgres.js-shaped objects.
 */
const ANA = "00000000-0000-4000-8000-000000000101";
const BEN = "00000000-0000-4000-8000-000000000011";
const UNPAID = "10000000-0000-4000-8000-000000000003";
const VACATION = "10000000-0000-4000-8000-000000000001";

let db: PGlite;
beforeAll(async () => {
  ({ db } = await createTestDb());
});
afterAll(async () => db.close());

const raise = (sql: string, params: unknown[] = []) =>
  db.query(sql, params).then(
    () => {
      throw new Error(`expected a database error from: ${sql}`);
    },
    (e: unknown) => e,
  );

const CASES: [string, () => Promise<unknown>, string, number][] = [
  [
    "untracked type balance (US-08 trigger)",
    () =>
      raise(`insert into leave_balances (user_id, leave_type_id, balance) values ($1, $2, 1)`, [
        ANA,
        UNPAID,
      ]),
    "VALIDATION_ERROR",
    400,
  ],
  [
    "un-tracking a type with balances",
    () => raise(`update leave_types set tracks_balance = false where id = $1`, [VACATION]),
    "CONFLICT",
    409,
  ],
  [
    "end before start (CHECK)",
    () =>
      raise(
        `insert into leave_requests (user_id, leave_type_id, start_date, end_date, reason) values ($1, $2, '2027-02-10', '2027-02-01', 'x')`,
        [ANA, VACATION],
      ),
    "VALIDATION_ERROR",
    400,
  ],
  [
    "second decision audit row (unique backstop)",
    () =>
      raise(
        `insert into audit_log (leave_request_id, actor_id, action) values ('20000000-0000-4000-8000-000000000002', $1, 'rejected')`,
        [BEN],
      ),
    "CONFLICT",
    409,
  ],
  [
    "duplicate accrual month",
    () => raise(`insert into accrual_runs (period) values ('2026-11-01')`),
    "CONFLICT",
    409,
  ],
  [
    "a provider identity linked twice (TASK-024)",
    async () => {
      const id = "30000000-0000-4000-8000-000000000001";
      await db.query(`update users set auth_user_id = $1 where id = $2`, [id, ANA]);
      return raise(`update users set auth_user_id = $1 where id = $2`, [id, BEN]);
    },
    "CONFLICT",
    409,
  ],
  [
    "an email differing only in case (TASK-024)",
    () =>
      raise(
        `insert into users (name, email) select 'Twin', upper(email) from users where id = $1`,
        [ANA],
      ),
    "CONFLICT",
    409,
  ],
  ["hard delete (retention trigger)", () => raise(`delete from leave_requests`), "CONFLICT", 409],
];

describe("toAppError — real Postgres errors", () => {
  it.each(CASES)("%s → %s", async (_l, produce, code, status) => {
    const mapped = toAppError(await produce());
    expect(mapped).toMatchObject({ code, status });
  });
});

describe("toAppError — driver shapes and unknowns", () => {
  it("reads postgres.js `constraint_name` as well as PGlite `constraint`", () => {
    expect(
      toAppError({ code: "23505", constraint_name: "audit_log_one_decision_per_request" }),
    ).toMatchObject({
      code: "CONFLICT",
    });
    expect(
      toAppError({ code: "23514", constraint: "leave_type_must_track_balance" }),
    ).toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("requires the SQLSTATE to match the constraint (no cross-matching)", () => {
    expect(toAppError({ code: "23505", constraint: "leave_type_must_track_balance" })).toBeNull();
  });

  it("returns null for unknown errors, so they stay a logged 500", () => {
    expect(toAppError(new Error("boom"))).toBeNull();
    expect(toAppError({ code: "23505", constraint: "some_other_key" })).toBeNull();
    expect(toAppError({ code: "42P01" })).toBeNull(); // undefined_table
    expect(toAppError(null)).toBeNull();
    expect(toAppError("23505")).toBeNull();
  });

  it("never matches on message text", () => {
    expect(
      toAppError({ message: "duplicate key value violates audit_log_one_decision_per_request" }),
    ).toBeNull();
  });
});

describe("withErrorHandler — a real constraint violation reaches the client as a 4xx envelope", () => {
  const route = (produce: () => Promise<unknown>) =>
    withErrorHandler(async () => {
      throw await produce();
    })(new NextRequest("http://localhost/api/x", { method: "POST" }), undefined);

  it.each(CASES)("%s → HTTP %s envelope", async (_l, produce, code, status) => {
    const res = await route(produce);
    expect(res.status).toBe(status);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(code);
    expect(body.error.message).not.toMatch(/violates|constraint|sqlstate|relation/i); // no DB internals leak
  });

  it("an unknown database error is still a generic 500", async () => {
    const res = await route(() => raise(`select * from no_such_table`));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toEqual({
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    });
  });
});
