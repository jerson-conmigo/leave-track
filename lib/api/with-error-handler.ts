import "server-only";
import type { NextRequest } from "next/server";
import { isAppError } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";
import { toAppError } from "@/lib/db/errors";
import { logger } from "@/lib/logger";

type RouteHandler<Ctx> = (req: NextRequest, ctx: Ctx) => Promise<Response>;

/**
 * Wrap every route handler with this. Known `AppError`s map to their status
 * code; anything else is logged and returned as a generic 500 so internals
 * (stack traces, SQL) never leak to the client.
 */
export function withErrorHandler<Ctx = unknown>(handler: RouteHandler<Ctx>): RouteHandler<Ctx> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      if (isAppError(error)) {
        if (error.status >= 500)
          logger.error({ err: error, path: req.nextUrl.pathname }, error.message);
        return fail(error);
      }
      // Known database constraint violations → consistent 4xx envelope (lib/db/errors.ts).
      const mapped = toAppError(error);
      if (mapped) {
        logger.warn(
          { err: error, path: req.nextUrl.pathname, code: mapped.code },
          "database constraint violation",
        );
        return fail(mapped);
      }
      logger.error({ err: error, path: req.nextUrl.pathname }, "Unhandled route error");
      return fail("INTERNAL_ERROR", "Something went wrong. Please try again.");
    }
  };
}
