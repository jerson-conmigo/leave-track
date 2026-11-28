import 'server-only';
import { z } from 'zod';

/**
 * Environment configuration, validated once at module load AND at server start
 * (instrumentation.ts → register()).
 *
 * Strictness keys on the DEPLOYMENT environment, never on NODE_ENV: `next build`,
 * CI and the local e2e suite all run with NODE_ENV=production and no database.
 * A deployment is APP_ENV=production|staging or VERCEL_ENV=production|preview —
 * if either says "deployed", the strict rules apply (TASK-019):
 *   - every variable in REQUIRED_WHEN_DEPLOYED must be set (no silent in-memory store),
 *   - E2E_RESET_TOKEN must NOT be set, nor DEV_LOGIN_ACCOUNTS=true (TASK-056),
 *   - AUTH_PROVIDER must not be "mock" (ADR-LeaveTrack-E004; TASK-023).
 * AUTH_PROVIDER=supabase needs its project URL, anon key and DATABASE_URL in ANY
 * environment (TASK-024; TASK-054: no silent in-memory store behind real sign-in).
 * Not deployed (local development, CI, local e2e): DATABASE_URL, DIRECT_URL and
 * NEXT_PUBLIC_SUPABASE_URL must be LOCAL addresses unless ALLOW_REMOTE_DATABASE=true
 * (TASK-054) — so pasted hosted values can't be used or modified by accident.
 * Everything else stays optional for local development, tests, CI and local e2e.
 */
const optionalUrl = z.url().optional();
const optionalSecret = z.string().min(1).optional();

/**
 * Variables a deployed environment refuses to start without. TASK-023/024 appended
 * their auth settings here (tests/env.test.ts pins this list on purpose).
 */
export const REQUIRED_WHEN_DEPLOYED = [
  'DATABASE_URL',
  'CRON_SECRET',
  'SESSION_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

/** What the Supabase sign-in adapter needs wherever it runs (TASK-024, TASK-054). */
export const REQUIRED_FOR_SUPABASE_AUTH = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'DATABASE_URL',
] as const;

/** Must point at the local stack when not deployed, unless ALLOW_REMOTE_DATABASE=true. */
export const LOCAL_ONLY_WHEN_NOT_DEPLOYED = [
  'DATABASE_URL',
  'DIRECT_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
] as const;

/** Loopback host names (keep identical to scripts/lib/local-only.mjs). */
export const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', '[::1]'];

/** True only for a parseable URL whose host is exactly a loopback name. */
export function isLocalUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    return LOCAL_HOSTS.includes(new URL(value).hostname.toLowerCase());
  } catch {
    return false;
  }
}

const DEPLOYED_APP_ENVS = ['production', 'staging'];
const DEPLOYED_VERCEL_ENVS = ['production', 'preview'];

type RawEnv = Record<string, string | undefined>;

/** True when APP_ENV or VERCEL_ENV marks this as a deployed environment (strictest wins). */
export function isDeployedEnv(raw: RawEnv): boolean {
  return (
    DEPLOYED_APP_ENVS.includes(raw.APP_ENV ?? '') ||
    DEPLOYED_VERCEL_ENVS.includes(raw.VERCEL_ENV ?? '')
  );
}

/** Idle timeout in minutes (TASK-025; lib/auth/session-policy.ts). Shared with that module. */
export const IdleTimeoutMinutesSchema = z.coerce
  .number({ error: 'SESSION_IDLE_TIMEOUT_MINUTES must be a whole number of minutes' })
  .int({ error: 'SESSION_IDLE_TIMEOUT_MINUTES must be a whole number of minutes' })
  .min(5, { error: 'SESSION_IDLE_TIMEOUT_MINUTES must be at least 5' })
  .max(480, { error: 'SESSION_IDLE_TIMEOUT_MINUTES must be at most 480 (the 8-hour limit)' })
  .default(30);

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  // Set by Vercel on every deployment; a fallback signal that this is deployed.
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
  NEXT_PUBLIC_APP_URL: z.url().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  // Supabase Postgres — DATABASE_URL must be the POOLED (Supavisor, port 6543) URL.
  // When set, writes go to Postgres (lib/db/postgres.ts); unset → in-memory store
  // (local/CI only — a deployed environment refuses to start without it).
  DATABASE_URL: z
    .url()
    .refine(u => /^postgres(ql)?:\/\//.test(u), {
      error: 'DATABASE_URL must be a postgres:// URL',
    })
    .optional(),
  // Connections per server instance. Serverless + Supavisor transaction mode: keep
  // this low (1–2) — each function instance holds its own pool.
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(20).default(5),
  // Direct connection — migrations only, never used by the running app.
  DIRECT_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalSecret,
  SUPABASE_SERVICE_ROLE_KEY: optionalSecret,

  // Bearer token Vercel Cron sends to /api/jobs/accrual (TASK-017).
  CRON_SECRET: optionalSecret,
  // Sign-in adapter (ADR-LeaveTrack-E004). "supabase" = Supabase Auth (TASK-024), required
  // when deployed; "mock" = DEV/TEST ONLY (pick any seeded user), refused when deployed.
  AUTH_PROVIDER: z.enum(['mock', 'supabase']).default('mock'),
  // HMAC key for the session cookie (TASK-023). Generate: openssl rand -hex 32.
  // Optional locally (a random per-process key is used); required when deployed.
  SESSION_SECRET: z
    .string()
    .min(32, { error: 'SESSION_SECRET must be at least 32 characters' })
    .optional(),
  // Sign out after this many minutes without activity (TASK-025). Default 30, 5–480.
  // The 8-hour absolute limit is fixed. TASK-040 will move this to the HR settings page.
  SESSION_IDLE_TIMEOUT_MINUTES: IdleTimeoutMinutesSchema,
  // Test-only reset hook (playwright.config.ts). Refused in deployed environments.
  E2E_RESET_TOKEN: optionalSecret,
  // Local development only: allow a NON-local database / Supabase URL (TASK-054). Leave
  // unset: by default development refuses hosted URLs so they can't be used by accident.
  ALLOW_REMOTE_DATABASE: z.enum(['true', 'false']).optional(),
  // Local development only: show the "Fill in a local account" dropdown on the Supabase sign-in
  // form (TASK-056; lib/auth/dev-accounts.ts). Refused in deployed environments.
  DEV_LOGIN_ACCOUNTS: z.enum(['true', 'false']).optional(),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * Validate a raw environment. Pure (no process.env access) so it can be tested.
 * Error messages name variables only — never their values.
 */
export function parseEnv(input: RawEnv): Env {
  // Treat empty strings (common in copied .env files) as unset.
  const raw = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== '')
  );
  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration — ${issues}`);
  }

  if (parsed.data.AUTH_PROVIDER === 'supabase') {
    const missing = REQUIRED_FOR_SUPABASE_AUTH.filter(name => !raw[name]);
    if (missing.length > 0) {
      throw new Error(
        `Invalid environment configuration — AUTH_PROVIDER=supabase needs ${missing.join(', ')}`
      );
    }
  }

  if (!isDeployedEnv(raw) && raw.ALLOW_REMOTE_DATABASE !== 'true') {
    const remote = LOCAL_ONLY_WHEN_NOT_DEPLOYED.filter(name => raw[name] && !isLocalUrl(raw[name]));
    if (remote.length > 0) {
      throw new Error(
        `Invalid environment configuration for local development — ${remote.join(', ')} ` +
          `${remote.length === 1 ? 'points' : 'point'} to a non-local host. Use the local Supabase stack (npm run env:local), or set ` +
          `ALLOW_REMOTE_DATABASE=true if you really mean to use a hosted database.`
      );
    }
  }

  if (isDeployedEnv(raw)) {
    const problems: string[] = [];
    const missing = REQUIRED_WHEN_DEPLOYED.filter(name => !raw[name]);
    if (missing.length > 0) problems.push(`missing ${missing.join(', ')}`);
    if (raw.E2E_RESET_TOKEN) problems.push('E2E_RESET_TOKEN must not be set');
    if (raw.DEV_LOGIN_ACCOUNTS === 'true') problems.push('DEV_LOGIN_ACCOUNTS must not be set');
    if (parsed.data.AUTH_PROVIDER === 'mock') {
      problems.push('mock sign-in (AUTH_PROVIDER=mock) is not allowed (ADR-LeaveTrack-E004)');
    }
    if (problems.length > 0) {
      const stage = `APP_ENV=${raw.APP_ENV ?? 'unset'}, VERCEL_ENV=${raw.VERCEL_ENV ?? 'unset'}`;
      throw new Error(
        `Invalid environment configuration for a deployed environment (${stage}) — ${problems.join('; ')}`
      );
    }
  }
  return parsed.data;
}

export const env = parseEnv(process.env);
export const isProduction = env.NODE_ENV === 'production';
