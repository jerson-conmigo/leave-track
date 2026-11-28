import { AppError, type ErrorCode } from "@/lib/api/errors";
import { MAX_LENGTH_MESSAGE, OVERLAP_MESSAGE } from "@/lib/validation/leave-request";

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
  // TASK-026: nobody decides their own request (backstop behind can_decide; 403 like the app).
  leave_requests_no_self_decision: {
    sqlstate: "23514",
    code: "FORBIDDEN",
    message: "You can't decide your own leave request.",
  },
  // TASK-027 (US-16, BR-13): request integrity backstops — 400 like the app's own checks.
  leave_requests_no_overlap: {
    sqlstate: "23P01", // exclusion_violation
    code: "VALIDATION_ERROR",
    message: OVERLAP_MESSAGE,
  },
  leave_requests_max_length: {
    sqlstate: "23514",
    code: "VALIDATION_ERROR",
    message: MAX_LENGTH_MESSAGE,
  },
  leave_requests_backdate_window: {
    sqlstate: "23514",
    code: "VALIDATION_ERROR",
    message: "This start date is too far in the past for this leave type.",
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
  users_auth_user_id_key: {
    sqlstate: "23505",
    code: "CONFLICT",
    message: "This sign-in is already linked to another user.",
  },
  users_email_lower_key: {
    sqlstate: "23505",
    code: "CONFLICT",
    message: "A user with this email already exists.",
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
