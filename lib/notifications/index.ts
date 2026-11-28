import "server-only";
import { getSql } from "@/lib/db/postgres";
import {
  createPostgresNotificationReadStore,
  memoryNotificationReadStore,
  type MarkReadDeps,
} from "@/lib/notifications/read";

export { markNotificationsRead } from "@/lib/notifications/read";

/** Postgres whenever DATABASE_URL is set (always, when deployed); memory otherwise. */
export function getMarkReadDeps(): MarkReadDeps {
  const sql = getSql();
  return { store: sql ? createPostgresNotificationReadStore(sql) : memoryNotificationReadStore };
}
