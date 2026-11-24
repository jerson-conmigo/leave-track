/**
 * Minimal SQL port shared by production (postgres.js → Supabase pooler) and
 * tests (PGlite, in-process Postgres 17). Stores depend on this, never on a
 * driver, so the exact same SQL runs in both. See ADR-LeaveTrack-E003.
 *
 * Rules: parameterised `$1…$n` text only — never interpolate values.
 */
export type SqlRow = Record<string, unknown>;

export interface SqlClient {
  query<T extends SqlRow = SqlRow>(text: string, params?: readonly unknown[]): Promise<T[]>;
  /** Runs `fn` in a transaction; any throw rolls everything back. */
  transaction<R>(fn: (tx: SqlClient) => Promise<R>): Promise<R>;
}

/** Drivers return timestamps as Date (or string); normalise to ISO strings. */
export function toIso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

/** Drivers return `numeric` as string to avoid precision loss; days fit in a double. */
export function toNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}
