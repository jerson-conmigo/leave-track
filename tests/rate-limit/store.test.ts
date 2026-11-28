import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { SqlClient } from '@/lib/db/sql';
import { createMemoryRateLimitStore } from '@/lib/rate-limit/memory-store';
import { createPostgresRateLimitStore } from '@/lib/rate-limit/postgres-store';
import { bucketStart, windowStart, type RateLimitStore } from '@/lib/rate-limit/store';
import { migratedDb, pgliteClient } from '../db/helpers';

/**
 * TASK-025 (first slice of TASK-041) — the rate-limit store: hits per key in 1-minute buckets,
 * summed over a window. Both adapters run the SAME contract; the Postgres one on PGlite with the
 * real migration (so the limit holds across server instances in production).
 */
const T = new Date('2027-01-10T09:00:30Z');
const plus = (seconds: number) => new Date(T.getTime() + seconds * 1000);
const WINDOW = 15 * 60;

let db: PGlite;
let sql: SqlClient;
beforeAll(async () => {
  db = await migratedDb(); // one database for the file (B30: keep memory low)
  sql = pgliteClient(db);
});
afterAll(() => db.close());

/** A key no other test uses (one shared database per file — B30 — so no clearing between tests). */
let seq = 0;
const k = (name: string) => `test:${++seq}:${name}`;

describe('bucket arithmetic', () => {
  it('1-minute buckets; a 15-minute window spans the current bucket and the 14 before it', () => {
    expect(bucketStart(T).toISOString()).toBe('2027-01-10T09:00:00.000Z');
    expect(windowStart(T, WINDOW).toISOString()).toBe('2027-01-10T08:46:00.000Z');
  });
});

describe.each<[string, () => RateLimitStore]>([
  ['memory', () => createMemoryRateLimitStore()],
  ['postgres', () => createPostgresRateLimitStore(sql)],
])('%s store', (_name, store) => {
  it('counts hits per key within the window', async () => {
    const [kk, kother] = [k('k'), k('other')];
    const s = store();
    expect(await s.count(kk, WINDOW, T)).toBe(0);
    expect(await s.hit(kk, WINDOW, T)).toBe(1);
    expect(await s.hit(kk, WINDOW, plus(10))).toBe(2);
    expect(await s.hit(kk, WINDOW, plus(5 * 60))).toBe(3);
    expect(await s.count(kk, WINDOW, plus(5 * 60))).toBe(3);
    expect(await s.count(kother, WINDOW, plus(5 * 60))).toBe(0);
  });

  it('hits age out of the window (sliding by minute — no doubled burst at an edge)', async () => {
    const kk = k('k');
    const s = store();
    for (let i = 0; i < 5; i++) await s.hit(kk, WINDOW, plus(i * 60)); // minutes 0–4
    expect(await s.count(kk, WINDOW, plus(14 * 60))).toBe(5); // all still inside
    expect(await s.count(kk, WINDOW, plus(15 * 60))).toBe(4); // minute 0 dropped out
    expect(await s.count(kk, WINDOW, plus(19 * 60))).toBe(0);
  });

  it('reset forgets one key only', async () => {
    const [ka, kb] = [k('a'), k('b')];
    const s = store();
    await s.hit(ka, WINDOW, T);
    await s.hit(kb, WINDOW, T);
    await s.reset(ka);
    expect(await s.count(ka, WINDOW, T)).toBe(0);
    expect(await s.count(kb, WINDOW, T)).toBe(1);
  });

  it('concurrent hits are never lost', async () => {
    const kk = k('k');
    const s = store();
    await Promise.all(Array.from({ length: 12 }, () => s.hit(kk, WINDOW, T)));
    expect(await s.count(kk, WINDOW, T)).toBe(12);
  });
});

describe('postgres store', () => {
  it('prunes buckets older than an hour on write, for every key', async () => {
    const [kold, knew] = [k('old'), k('new')];
    const s = createPostgresRateLimitStore(sql);
    await s.hit(kold, WINDOW, T);
    await s.hit(knew, WINDOW, plus(61 * 60));
    const keys = await sql.query<{ key: string }>('select key from public.rate_limits order by 1');
    expect(keys.map(r => r.key)).toContain(knew);
    expect(keys.map(r => r.key)).not.toContain(kold);
    // Every remaining bucket is within the hour before the last write.
    const [row] = await sql.query<{ oldest: string }>(
      'select min(bucket)::text as oldest from public.rate_limits'
    );
    expect(new Date(row!.oldest).getTime()).toBeGreaterThanOrEqual(plus(60).getTime());
  });

  it('the table refuses empty keys and non-positive counts (named constraints)', async () => {
    await expect(
      sql.query("insert into public.rate_limits (key, bucket) values ('', now())")
    ).rejects.toThrow(/rate_limits_key_length/);
    await expect(
      sql.query("insert into public.rate_limits (key, bucket, count) values ('k', now(), 0)")
    ).rejects.toThrow(/rate_limits_count_positive/);
  });
});
