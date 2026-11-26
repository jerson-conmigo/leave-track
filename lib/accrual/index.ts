import "server-only";
import { memoryAccrualStore } from "@/lib/accrual/memory-store";
import { createPostgresAccrualStore } from "@/lib/accrual/postgres-store";
import type { AccrualDeps } from "@/lib/accrual/run";
import { getSql } from "@/lib/db/postgres";

export { runMonthlyAccrual } from "@/lib/accrual/run";

/** Same switch as every other store: Postgres when DATABASE_URL is set. */
export function getAccrualDeps(): AccrualDeps {
  const sql = getSql();
  return { store: sql ? createPostgresAccrualStore(sql) : memoryAccrualStore };
}
