import { z } from "zod";

/**
 * Query / path schemas of the API route handlers (TASK-057). Moved here unchanged from
 * app/api/leave-requests/route.ts and app/api/audit/[userId]/route.ts so the OpenAPI document
 * (lib/api/openapi.ts) is generated from the SAME schemas the routes validate with.
 */

/** GET /api/leave-requests query. */
export const ListQuerySchema = z.object({
  scope: z.enum(["mine", "team"], { error: "Unsupported scope." }),
  // Only meaningful for scope=team: the queue shows pending requests by default.
  status: z.enum(["pending", "all"], { error: "Unsupported status." }).default("pending"),
});

/** GET /api/audit/{userId} path. */
export const AuditParamsSchema = z.object({ userId: z.uuid({ error: "Invalid employee id." }) });

/** GET /api/audit/{userId} query. */
export const AuditQuerySchema = z
  .object({
    from: z.iso.date({ error: "`from` must be a date (YYYY-MM-DD)." }).optional(),
    to: z.iso.date({ error: "`to` must be a date (YYYY-MM-DD)." }).optional(),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    error: "`from` must be on or before `to`.",
  });
