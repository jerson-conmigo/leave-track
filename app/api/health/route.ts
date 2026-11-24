import { ok } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Liveness probe. Deliberately touches no external service so it works with
 * zero credentials. Add a DB readiness probe separately on Day 1.
 */
export const GET = withErrorHandler(async () =>
  ok(
    {
      status: "ok" as const,
      env: env.APP_ENV,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  ),
);
