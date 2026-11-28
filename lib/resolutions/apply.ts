/**
 * TASK-033 (ADR-LeaveTrack-E006 §3/§4) — pure arithmetic shared by both stores. All values are
 * days with at most 2 decimals; the arithmetic runs in hundredths so no float drift reaches the DB.
 */
const toCents = (n: number) => Math.round(n * 100);
const fromCents = (c: number) => c / 100;

/**
 * Clamp a proposal to the CURRENT deficit (D-1): the applied total is min(proposed total,
 * deficit), and recovery shrinks first (conversion is the deficit's natural fallback).
 */
export function clampAmounts(
  proposedUnpaid: number,
  proposedRecovery: number,
  currentDeficit: number,
): { unpaid: number; recovery: number } {
  const deficit = Math.max(0, toCents(currentDeficit));
  const unpaid = toCents(proposedUnpaid);
  const recovery = toCents(proposedRecovery);
  const excess = Math.max(0, unpaid + recovery - deficit);
  const recoveryCut = Math.min(recovery, excess);
  const unpaidCut = excess - recoveryCut;
  return { unpaid: fromCents(unpaid - unpaidCut), recovery: fromCents(recovery - recoveryCut) };
}

/**
 * The monthly recovery schedule (D-2): `months` rows from `startPeriod` (YYYY-MM-01), each the
 * 2-decimal monthly amount, the last absorbing the remainder so the rows sum exactly to
 * `recovery`. A recovery smaller than 0.01 a month uses fewer months, so no row is ever 0.
 */
export function recoverySchedule(
  recovery: number,
  months: number,
  startPeriod: string,
): { period: string; amount: number }[] {
  const total = toCents(recovery);
  if (total <= 0 || months < 1) return [];
  const n = Math.min(months, total); // never a row below 0.01
  const monthly = Math.round(total / n);
  const [y, m] = startPeriod.split("-").map(Number) as [number, number];
  const rows: { period: string; amount: number }[] = [];
  let left = total;
  for (let i = 0; i < n && left > 0; i++) {
    const amount = i === n - 1 ? left : Math.min(monthly, left);
    rows.push({
      period: new Date(Date.UTC(y, m - 1 + i, 1)).toISOString().slice(0, 10),
      amount: fromCents(amount),
    });
    left -= amount;
  }
  return rows;
}
