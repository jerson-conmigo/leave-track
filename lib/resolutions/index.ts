import "server-only";
import { getSql } from "@/lib/db/postgres";
import { memoryResolutionStore } from "@/lib/resolutions/memory-store";
import { createPostgresResolutionStore } from "@/lib/resolutions/postgres-store";
import type { ResolutionDeps } from "@/lib/resolutions/propose";

export { finalizeResolution, reproposeResolution } from "@/lib/resolutions/hr-review";
export { runResolutionExpiry } from "@/lib/resolutions/expire";
export { proposeResolution } from "@/lib/resolutions/propose";
export { acceptResolution, declineResolution } from "@/lib/resolutions/respond";

/** Postgres whenever DATABASE_URL is set (always, when deployed); memory otherwise. */
export function getResolutionDeps(): ResolutionDeps {
  const sql = getSql();
  return { store: sql ? createPostgresResolutionStore(sql) : memoryResolutionStore };
}
