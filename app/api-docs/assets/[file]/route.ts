import { readFile } from "node:fs/promises";
import path from "node:path";
import { fail } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { isDeployedEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * GET /api-docs/assets/{file} — Swagger UI's static files (TASK-057). Serves an EXACT allowlist:
 * two files from the pinned swagger-ui-dist package and the generated initializer. Any other
 * name is a 404 — the name is never joined into a path unless it is a key of this map.
 * Development only: 404 in every deployed stage.
 */
const ASSETS: Readonly<Record<string, { type: string; dist?: string; body?: string }>> = {
  "swagger-ui.css": { type: "text/css; charset=utf-8", dist: "swagger-ui.css" },
  "swagger-ui-bundle.js": { type: "text/javascript; charset=utf-8", dist: "swagger-ui-bundle.js" },
  "init.js": {
    type: "text/javascript; charset=utf-8",
    body: 'window.ui = SwaggerUIBundle({ url: "/api/openapi.json", dom_id: "#swagger-ui" });\n',
  },
};

export const GET = withErrorHandler(
  async (_req: Request, ctx: { params: Promise<{ file: string }> }) => {
    if (isDeployedEnv(process.env)) return fail("NOT_FOUND", "Not found.");
    const { file } = await ctx.params;
    const asset = Object.hasOwn(ASSETS, file) ? ASSETS[file] : undefined;
    if (!asset) return fail("NOT_FOUND", "Not found.");
    const body =
      asset.body ??
      (await readFile(path.join(process.cwd(), "node_modules", "swagger-ui-dist", asset.dist!)));
    return new Response(body, {
      headers: { "Content-Type": asset.type, "Cache-Control": "no-store" },
    });
  },
);
