import "server-only";
import { getSql } from "@/lib/db/postgres";
import { memoryResolutionStore } from "@/lib/resolutions/memory-store";
import { createPostgresResolutionStore } from "@/lib/resolutions/postgres-store";
import type { ProposeDeps } from "@/lib/resolutions/propose";

export { proposeResolution } from "@/lib/resolutions/propose";

/** Postgres whenever DATABASE_URL is set (always, when deployed); memory otherwise. */
export function getResolutionDeps(): ProposeDeps {
  const sql = getSql();
  return { store: sql ? createPostgresResolutionStore(sql) : memoryResolutionStore };
}
