/**
 * UTC calendar-date helpers for audit filters and stats. The Postgres
 * repository applies the SAME semantics in SQL via `(ts at time zone 'UTC')::date`,
 * so results never depend on the server's or session's timezone. Parity-tested.
 */

/** UTC calendar date (YYYY-MM-DD) of an ISO timestamp, whatever its offset. */
export function utcDay(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

/** Inclusive UTC-date range check; missing bounds are open. */
export function withinUtcDays(iso: string, from?: string, to?: string): boolean {
  const day = utcDay(iso);
  return (!from || day >= from) && (!to || day <= to);
}

/** [start, end) of the UTC calendar month containing `now`, as ISO strings. */
export function utcMonthBounds(now: Date): [string, string] {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return [start.toISOString(), end.toISOString()];
}

/** TASK-027: today's date in UTC (YYYY-MM-DD) — the "today" of the past-start rule, matching the
 *  database trigger's `(now() at time zone 'utc')::date`. */
export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** YYYY-MM-DD `days` calendar days before `date` (UTC arithmetic). */
export function daysBefore(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10);
}
