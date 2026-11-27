import { NextResponse } from "next/server";
import { buildOpenApiDocument } from "@/lib/api/openapi";
import { fail } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { isDeployedEnv } from "@/lib/env";

// Decided per request, never at build time (the deployed check reads the runtime env).
export const dynamic = "force-dynamic";

/**
 * GET /api/openapi.json — the OpenAPI 3.1 document (TASK-057), for Swagger UI (/api-docs) and
 * tools such as Postman. The ONE 2xx response that isn't `{ success: true, data }`: tools need
 * the raw document. Errors keep the envelope. Development only: 404 in every deployed stage.
 */
export const GET = withErrorHandler(async () => {
  if (isDeployedEnv(process.env)) return fail("NOT_FOUND", "Not found.");
  return NextResponse.json(buildOpenApiDocument(), {
    headers: { "Cache-Control": "no-store" },
  });
});
