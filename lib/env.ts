import "server-only";
import { z } from "zod";

/**
 * Environment configuration, validated once at module load.
 *
 * Day 0: every external-service variable is OPTIONAL so the app builds and runs
 * with no .env at all. Day 1 tasks that wire Supabase / cron must tighten the
 * relevant fields (see .env.example for which task needs what).
 */
const optionalUrl = z.url().optional();
const optionalSecret = z.string().min(1).optional();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),

  // Supabase Postgres — DATABASE_URL must be the POOLED (pgbouncer, port 6543) URL.
  DATABASE_URL: optionalUrl,
  // Direct connection — migrations only, never used by the running app.
  DIRECT_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalSecret,
  SUPABASE_SERVICE_ROLE_KEY: optionalSecret,

  // Bearer token Vercel Cron sends to /api/jobs/accrual (TASK-017).
  CRON_SECRET: optionalSecret,
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  // Treat empty strings (common in copied .env files) as unset.
  const raw = Object.fromEntries(
    Object.entries(process.env).filter(([, value]) => value !== undefined && value !== ""),
  );
  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration — ${issues}`);
  }
  return parsed.data;
}

export const env = loadEnv();
export const isProduction = env.NODE_ENV === "production";
