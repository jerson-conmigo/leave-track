import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { defineConfig } from '@playwright/test';
import { assertPortFree } from './e2e-supabase/preflight';

/**
 * TASK-024 AC4 — the REAL sign-in flow against LOCAL Supabase (`npx supabase start`,
 * needs Docker): invite → email (Mailpit) → set password → sign in → database role,
 * an unlinked provider user, and sign-out revocation. It creates and deletes ONLY identities
 * under @e2e-auth.leavetrack.test (e2e-supabase/identities.ts); nothing else is touched.
 *
 *   npx supabase start && npx supabase db reset   # schema + seed
 *   npm run test:e2e:supabase
 *
 * Not part of the default CI e2e job (that one stays mock-only with no services). The
 * local URLs and keys are read from `supabase status`; nothing here is a real secret.
 */
function localSupabase(): Record<string, string> {
  let out = '';
  try {
    out = execSync('npx supabase status -o env', { encoding: 'utf8', stdio: 'pipe' });
  } catch {
    throw new Error('Local Supabase is not running. Start Docker, then: npx supabase start');
  }
  return Object.fromEntries(
    out
      .split('\n')
      .map(line => line.match(/^([A-Z_]+)="?(.*?)"?$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map(m => [m[1]!, m[2]!])
  );
}

const local = localSupabase();
const PORT = 3000; // must match supabase/config.toml [auth] site_url (email links)
// A4: a clear error instead of a confusing clash with a dev server. Main process only —
// workers re-load this config while OUR server is already listening on PORT.
if (!process.env.TEST_WORKER_INDEX) assertPortFree(PORT);
process.env.SUPABASE_E2E_API_URL = local.API_URL;
process.env.SUPABASE_E2E_DB_URL = local.DB_URL;
process.env.SUPABASE_E2E_SERVICE_ROLE_KEY = local.SERVICE_ROLE_KEY;
process.env.SUPABASE_E2E_ANON_KEY = local.ANON_KEY;
process.env.SUPABASE_E2E_MAIL_URL = local.MAILPIT_URL ?? local.INBUCKET_URL;
process.env.SESSION_SECRET ??= randomBytes(32).toString('hex');

export default defineConfig({
  testDir: 'e2e-supabase',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...(process.env.CI ? {} : { channel: 'chrome' }),
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 240_000,
    env: {
      AUTH_PROVIDER: 'supabase',
      // TASK-056: the local development account menu (local stack only).
      DEV_LOGIN_ACCOUNTS: 'true',
      NEXT_PUBLIC_SUPABASE_URL: local.API_URL ?? '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: local.ANON_KEY ?? '',
      NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}`,
      DATABASE_URL: local.DB_URL ?? '',
      DATABASE_POOL_MAX: '2',
      SESSION_SECRET: process.env.SESSION_SECRET,
      E2E_RESET_TOKEN: '',
      // TASK-025: the idle scenario assumes the default 30 minutes, whatever .env.local says.
      SESSION_IDLE_TIMEOUT_MINUTES: '30',
      LOG_LEVEL: 'warn',
    },
  },
});
