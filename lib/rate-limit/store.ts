/**
 * Rate-limit store port (TASK-025; extended by TASK-041). Counts hits per key in 1-minute
 * buckets; a limit is "N hits within the last W seconds", summed over the buckets in W.
 * Adapters: Postgres (every deployment — limits hold across instances) and memory (tests and
 * local runs without a database).
 */
export interface RateLimitStore {
  /** Record one hit for `key` at `now`; returns the hits within the window, this one included. */
  hit(key: string, windowSeconds: number, now: Date): Promise<number>;
  /** Hits within the window, without recording one. */
  count(key: string, windowSeconds: number, now: Date): Promise<number>;
  /** Forget `key` (e.g. after a successful sign-in). */
  reset(key: string): Promise<void>;
}

export const BUCKET_SECONDS = 60;
/** Buckets older than this are pruned on write (longest window in use, with margin). */
export const RETAIN_SECONDS = 60 * 60;

/** Start of the 1-minute bucket containing `at`. */
export function bucketStart(at: Date): Date {
  const ms = BUCKET_SECONDS * 1000;
  return new Date(Math.floor(at.getTime() / ms) * ms);
}

/** Oldest bucket start that still counts for a window ending at `now`. */
export function windowStart(now: Date, windowSeconds: number): Date {
  return new Date(bucketStart(now).getTime() - (windowSeconds - BUCKET_SECONDS) * 1000);
}
