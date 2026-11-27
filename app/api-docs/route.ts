import { fail } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { isDeployedEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * GET /api-docs — Swagger UI for /api/openapi.json (TASK-057). Self-hosted (swagger-ui-dist via
 * /api-docs/assets/*) with NO inline script, so the app's CSP (`script-src 'self'`) is unchanged.
 * Development only: 404 in every deployed stage.
 */
const PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>LeaveTrack API documentation</title>
    <link rel="icon" href="/icon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="/api-docs/assets/swagger-ui.css" />
  </head>
  <body>
    <main id="swagger-ui"></main>
    <script src="/api-docs/assets/swagger-ui-bundle.js"></script>
    <script src="/api-docs/assets/init.js"></script>
  </body>
</html>
`;

export const GET = withErrorHandler(async () => {
  if (isDeployedEnv(process.env)) return fail("NOT_FOUND", "Not found.");
  return new Response(PAGE, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
});
