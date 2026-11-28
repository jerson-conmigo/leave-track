import 'server-only';
import { getSql } from '@/lib/db/postgres';
import { memoryRateLimitStore } from '@/lib/rate-limit/memory-store';
import { createPostgresRateLimitStore } from '@/lib/rate-limit/postgres-store';
import type { RateLimitStore } from '@/lib/rate-limit/store';

export type { RateLimitStore } from '@/lib/rate-limit/store';

/** Postgres whenever DATABASE_URL is set (always, when deployed); memory otherwise. */
export function getRateLimitStore(): RateLimitStore {
  const sql = getSql();
  return sql ? createPostgresRateLimitStore(sql) : memoryRateLimitStore;
}
