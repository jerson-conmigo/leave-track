import "server-only";
import postgres from "postgres";
import type { SqlClient } from "@/lib/db/sql";
import { env } from "@/lib/env";

type Driver = postgres.Sql | postgres.TransactionSql;

function wrap(sql: Driver): SqlClient {
  return {
    async query(text, params = []) {
      const rows = await sql.unsafe(text, params as postgres.ParameterOrJSON<never>[]);
      return rows as unknown as never[];
    },
    transaction(fn) {
      // On a TransactionSql, begin() opens a savepoint (postgres.js v4).
      return sql.begin((tx) => fn(wrap(tx))) as Promise<Awaited<ReturnType<typeof fn>>>;
    },
  };
}

const globalForDb = globalThis as unknown as { __leaveTrackSql?: postgres.Sql };

/**
 * Shared client over the POOLED `DATABASE_URL` (Supavisor transaction mode,
 * port 6543). Returns null when DATABASE_URL is unset — callers fall back to
 * the in-memory store. Cached on globalThis so dev HMR doesn't leak pools.
 */
export function getSql(): SqlClient | null {
  if (!env.DATABASE_URL) return null;
  globalForDb.__leaveTrackSql ??= postgres(env.DATABASE_URL, {
    prepare: false, // transaction-mode poolers can't hold prepared statements
    max: env.DATABASE_POOL_MAX,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return wrap(globalForDb.__leaveTrackSql);
}
