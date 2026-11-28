/**
 * TASK-027 — request dates that never go stale. Since the past-start rule (US-16), a request
 * dated "2027-03-01" in a test becomes invalid once that day passes. Tests write REQUEST dates as
 * readable reference dates and wrap them: `future("2027-03-01")` moves the date to the same place
 * relative to (today + 60 days, UTC) as it has relative to 2027-01-01. Spacing between dates is
 * preserved exactly (day counts, overlaps), and the result always lies after the seed's fixed
 * rows (latest: 2027-01-08). Use for request start/end dates only — not timestamps, accrual months
 * or audit filters.
 */
export const REFERENCE_ANCHOR = "2027-01-01";
const DAY_MS = 86_400_000;

/** Today (UTC) plus `days`, as YYYY-MM-DD. */
export function daysFromToday(days: number, now: Date = new Date()): string {
  const today = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
  return new Date(today + days * DAY_MS).toISOString().slice(0, 10);
}

/** A reference date (as written in the test) mapped to a date safely in the future. */
export function future(reference: string, now: Date = new Date()): string {
  const offset = Math.round(
    (Date.parse(`${reference}T00:00:00Z`) - Date.parse(`${REFERENCE_ANCHOR}T00:00:00Z`)) / DAY_MS,
  );
  if (!Number.isFinite(offset)) throw new Error(`future(): not a date: ${reference}`);
  return daysFromToday(60 + offset, now);
}
