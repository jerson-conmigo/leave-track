import "server-only";
import pino from "pino";
import { env } from "@/lib/env";

/**
 * Structured JSON logger. The only sanctioned way to log in server code —
 * `console.*` is blocked by ESLint. Sensitive fields are redacted.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  base: { app: "leave-track", env: env.APP_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "req.headers.cookie",
      "req.headers.authorization",
      "headers.cookie",
      "headers.authorization",
      "*.password",
      "password",
    ],
    censor: "[redacted]",
  },
});

export type Logger = typeof logger;
