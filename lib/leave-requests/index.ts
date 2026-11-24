import "server-only";
import { getSql } from "@/lib/db/postgres";
import { memorySubmitStore } from "@/lib/leave-requests/memory-store";
import { logNotifier } from "@/lib/leave-requests/notifier";
import { createPostgresSubmitStore } from "@/lib/leave-requests/postgres-store";
import type { SubmitDeps } from "@/lib/leave-requests/submit";
import { logger } from "@/lib/logger";

export { submitLeaveRequest } from "@/lib/leave-requests/submit";

let announced = false;

/**
 * Wire the submit service: Postgres when DATABASE_URL is set, otherwise the
 * in-memory store (local dev). NOTE backlog B13: list reads are still mock until
 * TASK-012/013/015, so with DATABASE_URL set, new rows won't appear in lists yet.
 */
export function getSubmitDeps(): SubmitDeps {
  const sql = getSql();
  if (!announced) {
    logger.info({ store: sql ? "postgres" : "memory" }, "leave request store selected");
    announced = true;
  }
  return { store: sql ? createPostgresSubmitStore(sql) : memorySubmitStore, notifier: logNotifier };
}
