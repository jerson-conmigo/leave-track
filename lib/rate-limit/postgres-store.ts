import type { SqlClient } from "@/lib/db/sql";
import {
  bucketStart,
  RETAIN_SECONDS,
  windowStart,
  type RateLimitStore,
} from "@/lib/rate-limit/store";

/**
 * Postgres adapter (public.rate_limits): the count is shared by every server instance. Each
 * hit is one atomic upsert-and-sum, so concurrent hits are never lost.
 */
export function createPostgresRateLimitStore(sql: SqlClient): RateLimitStore {
  const sum = async (db: SqlClient, key: string, windowSeconds: number, now: Date) => {
    const [row] = await db.query<{ total: number | string | null }>(
      "select coalesce(sum(count), 0)::int as total from public.rate_limits where key = $1 and bucket >= $2",
      [key, windowStart(now, windowSeconds).toISOString()],
    );
    return Number(row?.total ?? 0);
  };

  return {
    async hit(key, windowSeconds, now) {
      return sql.transaction(async (tx) => {
        await tx.query("delete from public.rate_limits where bucket < $1", [
          new Date(now.getTime() - RETAIN_SECONDS * 1000).toISOString(),
        ]);
        await tx.query(
          `insert into public.rate_limits (key, bucket, count) values ($1, $2, 1)
           on conflict (key, bucket) do update set count = public.rate_limits.count + 1`,
          [key, bucketStart(now).toISOString()],
        );
        return sum(tx, key, windowSeconds, now);
      });
    },
    async count(key, windowSeconds, now) {
      return sum(sql, key, windowSeconds, now);
    },
    async reset(key) {
      await sql.query("delete from public.rate_limits where key = $1", [key]);
    },
  };
}
