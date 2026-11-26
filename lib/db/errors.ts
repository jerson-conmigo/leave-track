import { AppError, type ErrorCode } from "@/lib/api/errors";

/**
 * Translate known database constraint violations into the app's error envelope,
 * so a client sees e.g. 409 CONFLICT instead of a generic 500. Matching is by
 * SQLSTATE + constraint NAME only — never by message text. Works with both drivers:
 * PGlite exposes `constraint`, postgres.js exposes `constraint_name`.
 * Returns null for anything unknown (it stays a logged 500).
 */
type DbError = { code?: unknown; constraint?: unknown; constraint_name?: unknown };

const BY_CONSTRAINT: Record<string, { sqlstate: string; code: ErrorCode; message: string }> = {
  leave_type_must_track_balance: {
    sqlstate: "23514",
    code: "VALIDATION_ERROR",
    message: "This leave type doesn't track a balance.",
  },
  leave_type_has_balances: {
    sqlstate: "23514",
    code: "CONFLICT",
    message: "This leave type still has balances or policies.",
  },
  leave_requests_date_range: {
    sqlstate: "23514",
    code: "VALIDATION_ERROR",
    message: "End date can't be before the start date.",
  },
  audit_log_one_decision_per_request: {
    sqlstate: "23505",
    code: "CONFLICT",
    message: "This request has already been decided.",
  },
  accrual_runs_period_key: {
    sqlstate: "23505",
    code: "CONFLICT",
    message: "This month has already been accrued.",
  },
};

/** SQLSTATE-only mappings (no constraint name involved). */
const BY_SQLSTATE: Record<string, { code: ErrorCode; message: string }> = {
  // restrict_violation: the no-hard-delete triggers and ON DELETE RESTRICT foreign keys.
  "23001": { code: "CONFLICT", message: "Records are never deleted (retention policy)." },
};

export function toAppError(error: unknown): AppError | null {
  if (!error || typeof error !== "object") return null;
  const e = error as DbError;
  const sqlstate = typeof e.code === "string" ? e.code : null;
  if (!sqlstate) return null;
  const name =
    typeof e.constraint === "string"
      ? e.constraint
      : typeof e.constraint_name === "string"
        ? e.constraint_name
        : null;
  const known = name ? BY_CONSTRAINT[name] : undefined;
  if (known && known.sqlstate === sqlstate) return new AppError(known.code, known.message);
  const bySqlstate = BY_SQLSTATE[sqlstate];
  return bySqlstate ? new AppError(bySqlstate.code, bySqlstate.message) : null;
}
