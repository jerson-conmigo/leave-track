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

/** A fresh in-process Postgres with all migrations applied (no seed). */
export async function migratedDb(): Promise<PGlite> {
  const db = new PGlite();
  for (const sql of MIGRATIONS) await db.exec(sql);
  return db;
}

/** A fresh database with migrations + seed, exposed through the app's SqlClient port. */
export async function createTestDb(): Promise<{ db: PGlite; sql: SqlClient }> {
  const db = await migratedDb();
  await db.exec(SEED);
  return { db, sql: pgliteClient(db) };
}

/** PGlite adapter for the SqlClient port (mirrors lib/db/postgres.ts). */
export function pgliteClient(db: PGlite | Transaction): SqlClient {
  return {
    async query(text, params = []) {
      return (await db.query(text, [...params])).rows as never[];
    },
    transaction(fn) {
      // PGlite has no nested transactions; inside one, run inline.
      if (!("transaction" in db)) return fn(pgliteClient(db));
      return db.transaction((tx) => fn(pgliteClient(tx)));
    },
  };
}
