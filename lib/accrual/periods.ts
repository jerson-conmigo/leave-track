import { utcMonthBounds } from "@/lib/data/dates";

/** First day (YYYY-MM-01) of the UTC month containing `now`. */
export function currentPeriod(now: Date): string {
  return utcMonthBounds(now)[0].slice(0, 10);
}

function nextPeriod(period: string): string {
  const [y, m] = period.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10); // m is 1-based → next month
}

/**
 * Months still to accrue, oldest first (catch-up for missed cron runs — Vercel
 * delivery is best-effort and never retried). No run yet → only the current
 * month. Never returns a future month. A gap larger than `max` is refused so a
 * human can look (misconfiguration, long outage).
 */
export function monthsToAccrue(
  lastPeriod: string | null,
  current: string,
  max: number,
): { periods: string[] } | { tooFarBehind: number } {
  if (lastPeriod === null) return { periods: [current] };
  if (lastPeriod >= current) return { periods: [] };
  const periods: string[] = [];
  for (let p = nextPeriod(lastPeriod); p <= current; p = nextPeriod(p)) {
    periods.push(p);
    if (periods.length > max) {
      let missing = periods.length;
      for (let q = nextPeriod(p); q <= current; q = nextPeriod(q)) missing++;
      return { tooFarBehind: missing };
    }
  }
  return { periods };
}
