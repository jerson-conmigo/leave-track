import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite, type Transaction } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { afterEach } from "vitest";
import type { SqlClient } from "@/lib/db/sql";

const root = path.resolve(import.meta.dirname, "../..");
const migrationsDir = path.join(root, "supabase/migrations");

/** Every migration, in filename (timestamp) order — new files are picked up automatically. */
export const MIGRATION_FILES = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();
export const MIGRATIONS = MIGRATION_FILES.map((f) =>
  readFileSync(path.join(migrationsDir, f), "utf8"),
);
export const SEED = readFileSync(path.join(root, "supabase/seed.sql"), "utf8");

/**
 * Test seams for the setup-failure tests (tests/db/pglite-lifecycle.test.ts): `create`
 * builds the PGlite (so a test can observe it), `migrations` / `seed` replace the real SQL.
 */
type SetupOptions = { create?: () => PGlite; migrations?: readonly string[]; seed?: string };

/** Run `setup` on a new database; if it throws, close the database before rethrowing. */
async function built(db: PGlite, setup: (db: PGlite) => Promise<void>): Promise<PGlite> {
  try {
    await setup(db);
    return db;
  } catch (error) {
    await db.close().catch(() => {}); // never leak a half-built database (B30)
    throw error;
  }
}

/**
 * A fresh in-process Postgres with migrations applied (no seed). By default all of
 * them; `upTo` (exclusive) stops before the named file — for testing a migration
 * against pre-existing data. A failed migration closes the database before rethrowing.
 */
/**
 * TASK-027: insert HISTORICAL fixture rows (start dates in the past) the way supabase/seed.sql
 * does — the leave_requests_backdate_guard trigger's escape hatch, scoped to ONE transaction.
 * Test fixtures only; application code never sets it (pinned by request-integrity.test.ts).
 */
export async function asHistorical<T>(db: PGlite, fn: (tx: Transaction) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('leavetrack.allow_backdated', 'on', true)`);
    return fn(tx);
  });
}

/** A PGlite with the extensions our migrations use (TASK-027: btree_gist for the overlap rule). */
export function newPGlite(): PGlite {
  return new PGlite({ extensions: { btree_gist } });
}

export async function migratedDb(opts: { upTo?: string } & SetupOptions = {}): Promise<PGlite> {
  const files = opts.migrations ? opts.migrations.map((_, i) => `injected-${i}`) : MIGRATION_FILES;
  const sql = opts.migrations ?? MIGRATIONS;
  return built(opts.create?.() ?? newPGlite(), async (db) => {
    for (const [i, file] of files.entries()) {
      if (opts.upTo && file >= opts.upTo) break;
      await db.exec(sql[i]!);
    }
  });
}

/** A fresh database with migrations + seed, exposed through the app's SqlClient port. */
export async function createTestDb(
  opts: SetupOptions = {},
): Promise<{ db: PGlite; sql: SqlClient }> {
  const db = await migratedDb(opts);
  await built(db, (d) => d.exec(opts.seed ?? SEED).then(() => {}));
  return { db, sql: pgliteClient(db) };
}

/**
 * Close every database opened during a test right after that test — pass, fail or
 * timeout (Vitest always runs afterEach). Call once at file (or describe) level:
 *
 *   const track = closeAfterEachTest();
 *   beforeEach(async () => { db = track((await createTestDb()).db); });
 *
 * Each test still gets its own fresh database; keeping them all until afterAll held
 * every one in memory for the whole file (B30). allSettled: one failing close never
 * leaves the others open; any close error is then reported, not swallowed.
 */
export function closeAfterEachTest(): <T extends PGlite>(db: T) => T {
  const open: PGlite[] = [];
  afterEach(() => closeAll(open.splice(0)));
  return (db) => {
    open.push(db);
    return db;
  };
}

/**
 * Close every database, waiting for all of them even if some fail, then report every
 * failure at once (AggregateError) — so one bad close never leaves the others open.
 */
export async function closeAll(dbs: readonly PGlite[]): Promise<void> {
  const results = await Promise.allSettled(dbs.map((db) => db.close()));
  const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
  if (failed.length > 0) {
    throw new AggregateError(
      failed.map((f) => f.reason),
      `${failed.length} test database(s) failed to close`,
    );
  }
}

let savepointSeq = 0;

/** PGlite adapter for the SqlClient port (mirrors lib/db/postgres.ts). */
export function pgliteClient(db: PGlite | Transaction): SqlClient {
  return {
    async query(text, params = []) {
      return (await db.query(text, [...params])).rows as never[];
    },
    async transaction(fn) {
      if ("transaction" in db) return db.transaction((tx) => fn(pgliteClient(tx)));
      // Nested: emulate a SAVEPOINT exactly like postgres.js v4's nested `begin()`,
      // so a caught inner failure rolls back only the inner work (review TASK-011 #4).
      const name = `sp_${++savepointSeq}`;
      await db.exec(`savepoint ${name}`);
      try {
        const result = await fn(pgliteClient(db));
        await db.exec(`release savepoint ${name}`);
        return result;
      } catch (error) {
        await db.exec(`rollback to savepoint ${name}`);
        throw error;
      }
    },
  };
}
