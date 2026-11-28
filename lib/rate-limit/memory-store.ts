import {
  bucketStart,
  RETAIN_SECONDS,
  windowStart,
  type RateLimitStore,
} from "@/lib/rate-limit/store";

/** In-process adapter: tests and local runs without DATABASE_URL. Never used when deployed
 *  (a deployment requires DATABASE_URL, which selects the Postgres adapter). */
export function createMemoryRateLimitStore(): RateLimitStore & { clear(): void } {
  const buckets = new Map<string, Map<number, number>>();

  const sum = (key: string, windowSeconds: number, now: Date) => {
    const from = windowStart(now, windowSeconds).getTime();
    let total = 0;
    for (const [start, n] of buckets.get(key) ?? []) if (start >= from) total += n;
    return total;
  };

  return {
    async hit(key, windowSeconds, now) {
      const oldest = now.getTime() - RETAIN_SECONDS * 1000;
      for (const [k, m] of buckets) {
        for (const start of m.keys()) if (start < oldest) m.delete(start);
        if (m.size === 0) buckets.delete(k);
      }
      const m = buckets.get(key) ?? new Map<number, number>();
      const start = bucketStart(now).getTime();
      m.set(start, (m.get(start) ?? 0) + 1);
      buckets.set(key, m);
      return sum(key, windowSeconds, now);
    },
    async count(key, windowSeconds, now) {
      return sum(key, windowSeconds, now);
    },
    async reset(key) {
      buckets.delete(key);
    },
    clear() {
      buckets.clear();
    },
  };
}

const globalForRateLimit = globalThis as unknown as {
  __leaveTrackRateLimitStore?: ReturnType<typeof createMemoryRateLimitStore>;
};

/** Process-wide memory store (globalThis, so dev hot reloads keep the counts). */
export const memoryRateLimitStore = (globalForRateLimit.__leaveTrackRateLimitStore ??=
  createMemoryRateLimitStore());
