/**
 * Formatting helpers. All date math is done in UTC on YYYY-MM-DD strings so
 * server and client render identically (no hydration mismatch).
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtc(isoDate: string): number {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/**
 * Inclusive calendar-day count between two YYYY-MM-DD dates.
 * NOTE: business-day vs calendar-day counting is an open Day 1 decision
 * (TASK-011); this helper is the single place to change it.
 */
export function countDays(startDate: string, endDate: string): number {
  const diff = Math.round((toUtc(endDate) - toUtc(startDate)) / DAY_MS);
  return diff < 0 ? 0 : diff + 1;
}

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

/**
 * Node's ICU and browser ICU disagree on Unicode spaces (e.g. Node emits
 * U+2009 around the range dash and U+202F before AM/PM; Chrome emits U+0020).
 * Client components render on both sides, so a mismatch is a React hydration
 * error (#418). Normalise every Unicode space to a plain space.
 */
const unicodeSpaces = /[  -   　]/g;
const plain = (s: string) => s.replace(unicodeSpaces, " ");

export function formatDate(iso: string): string {
  return plain(dateFmt.format(new Date(toUtc(iso))));
}

export function formatDateTime(iso: string): string {
  return plain(dateTimeFmt.format(new Date(iso)));
}

export function formatDateRange(startDate: string, endDate: string): string {
  if (startDate === endDate) return formatDate(startDate);
  return plain(dateFmt.formatRange(new Date(toUtc(startDate)), new Date(toUtc(endDate))));
}

/** Day count without unit: 11 · 1.5 · 0.25 (max two decimals, no trailing zero). */
export function formatDayNumber(days: number): string {
  return Number.isInteger(days) ? String(days) : days.toFixed(2).replace(/0$/, "");
}

export function formatDays(days: number): string {
  const n = formatDayNumber(days);
  return `${n} ${days === 1 ? "day" : "days"}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const monthFmt = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "2027-01-01" → "January 2027" (TASK-032 recovery periods; UTC, so no off-by-one month). */
export function formatMonth(period: string): string {
  return plain(monthFmt.format(new Date(toUtc(period))));
}
