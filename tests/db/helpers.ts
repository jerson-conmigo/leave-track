import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite, type Transaction } from "@electric-sql/pglite";
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
 * A fresh in-process Postgres with migrations applied (no seed). By default all of
 * them; `upTo` (exclusive) stops before the named file — for testing a migration
 * against pre-existing data.
 */
export async function migratedDb(opts: { upTo?: string } = {}): Promise<PGlite> {
  const db = new PGlite();
  for (const [i, file] of MIGRATION_FILES.entries()) {
    if (opts.upTo && file >= opts.upTo) break;
    await db.exec(MIGRATIONS[i]!);
  }
  return db;
}

/** A fresh database with migrations + seed, exposed through the app's SqlClient port. */
export async function createTestDb(): Promise<{ db: PGlite; sql: SqlClient }> {
  const db = await migratedDb();
  await db.exec(SEED);
  return { db, sql: pgliteClient(db) };
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
