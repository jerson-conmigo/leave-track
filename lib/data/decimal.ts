/**
 * Exact arithmetic for day amounts in TypeScript. Day values have at most two
 * decimals (numeric(·,2) in Postgres), so we compute in integer HUNDREDTHS and
 * convert back once — never adding binary floats directly (0.1 + 0.2 = 0.30000000000000004;
 * 0.1 + 0.2×4 = 0.8999999999999999). SQL code uses `numeric` arithmetic instead.
 */
const toHundredths = (n: number): number => Math.round(n * 100);
const fromHundredths = (h: number): number => h / 100;

export function addDays(a: number, b: number): number {
  return fromHundredths(toHundredths(a) + toHundredths(b));
}

export function sumDays(values: readonly number[]): number {
  return fromHundredths(values.reduce((sum, v) => sum + toHundredths(v), 0));
}
