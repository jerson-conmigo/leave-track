# LeaveTrack

Self-service leave management: employees request time off and check balances, managers approve
their own team's requests, and HR gets an auditable, never-deleted decision record.

> Sign-in is **Supabase Auth** (email + password, invite only) in every deployed environment.
> Locally it defaults to a **mock** sign-in (pick any seeded user) with in-memory data, so no
> service is needed to try it — see `docs/dev-tasks/` for progress.

## Quick start

Requirements: Node 24 (`.nvmrc`), npm 11.

```bash
npm install
npm run dev
```

Open http://localhost:3000. No `.env` file or external service is needed.

### Trying each role

On the sign-in page, enter anything for email and password, then pick a person (mock sign-in —
local and test only; a deployed environment refuses it). Your session is a signed `lt-session`
cookie; without `SESSION_SECRET` a random key is used, so restarting the dev server signs you out.

| Person     | Role     | What you can see                                            |
| ---------- | -------- | ----------------------------------------------------------- |
| Ana Reyes  | Employee | Dashboard, new request, my requests, balance                |
| Ben Ortiz  | Manager  | Everything above + approvals for Ana, Jordan, Priya         |
| Maya Chen  | Manager  | Approvals for Sam, Lena, Diego only (scoping demo)          |
| Carla Diaz | HR Admin | Everything an employee sees + audit report + leave policies |

The session lasts 8 hours; sign out from the account menu (top right).

### Local Supabase development (Docker, TASK-054)

Run the app against a real local Postgres and real Supabase Auth instead of mock data.
Everything runs on your machine in Docker; nothing touches the hosted project.

**Once:** install and start [Docker Desktop](https://www.docker.com/products/docker-desktop/)
(the Supabase CLI comes with `npm install`, pinned to 3.3.0).

```bash
npm run local:start     # start local Postgres, Auth, email (Mailpit) and the API
npm run env:local       # write the local settings into .env.local (secrets generated, never shown)
npm run db:seed:auth    # first time: create sign-ins for the seeded people
npm run dev             # http://localhost:3000
```

Sign in as any seeded person (e.g. `carla.diaz@leavetrack.test` — HR Admin, or
`ana.reyes@leavetrack.test` — Employee) with the local development password
**`leavetrack-local-dev`**, and let your browser remember it. Sign-in goes through the real
Supabase Auth; your role comes from the `users` table. Emails (invites, password resets)
appear in Mailpit at http://localhost:54324.

**Optional — account menu (TASK-056):** add `DEV_LOGIN_ACCOUNTS=true` to `.env.local` and restart
`npm run dev`. The sign-in page then shows _Fill in a local account_: picking someone fills in
their email and the local password; you still press **Sign in**, which goes through Supabase.
It only appears with a local stack (`localhost` / `127.0.0.1` URLs) and is refused in any
deployed environment.

| Command                           | What it does                                                         |
| --------------------------------- | -------------------------------------------------------------------- |
| `npm run local:start`             | Start the local stack (skips services the app doesn't use)           |
| `npm run local:status`            | URLs and the pgAdmin connection settings (keys hidden)               |
| `npm run local:stop`              | Stop the stack — **your data is kept**                               |
| `npm run env:local`               | Fill `.env.local` from the running stack (keeps your other settings) |
| `npm run db:seed:auth`            | Create/link local sign-ins for seeded people (safe to re-run)        |
| `npm run db:migrate:local`        | Apply new migrations, **keeping data**                               |
| `npm run db:check:local`          | Row counts of the app tables                                         |
| `npm run db:reset:local -- --yes` | **Destructive:** rebuild the database, re-seed, recreate sign-ins    |

**pgAdmin:** _Register → Server_, then on the _Connection_ tab: Host `127.0.0.1`, Port
`54322`, Maintenance database `postgres`, Username `postgres`, Password `postgres` (the
local default), and on the _Parameters_ tab SSL mode `disable`. Check it works: run
`select count(*) from public.users;` — it should match `npm run db:check:local` (9 users
after the seed). App tables are in the `public` schema; treat `auth.*` as read-only.
Changes made in pgAdmin skip the app's rules (the database triggers, e.g. "never delete",
still apply).

**Protection against the hosted project:** the local scripts only work with the local stack
(they read `supabase status` and refuse non-local URLs); in development the app refuses a
non-local `DATABASE_URL`, `DIRECT_URL` or `NEXT_PUBLIC_SUPABASE_URL` unless
`ALLOW_REMOTE_DATABASE=true`; `env:local` won't overwrite hosted values in `.env.local`
(`-- --replace-remote` backs the file up first); `npm run user:invite` refuses a non-local
target unless you add `--remote`; migrations reach the hosted project only via CI or
`npm run db:push:hosted -- --hosted`.

**Back to mock data:** set `AUTH_PROVIDER=mock` and clear `DATABASE_URL` in `.env.local`.

**Troubleshooting:** _"local Supabase stack is not running"_ → start Docker Desktop, then
`npm run local:start`. _Port 3000 in use_ → stop the other `npm run dev`. _Changed
`.env.local` but nothing changed_ → restart `npm run dev` (`NEXT_PUBLIC_*` values are read at
start-up). _Sign-in fails after `db:reset:local`_ → it recreates sign-ins; run
`npm run db:seed:auth` if you reset another way.

How sign-in fits together: the Supabase session proves who you are; the app then finds your
`users` row by `users.auth_user_id` (set by an invite, or locally by `db:seed:auth` — never
matched at sign-in) and issues its signed `lt-session` cookie. Every request re-checks both,
and signing out revokes the Supabase session. To invite someone locally:
`npm run user:invite -- <email>` (reads `.env.local`), then open the email in Mailpit.

## Scripts

| Command                                      | What it does                                                     |
| -------------------------------------------- | ---------------------------------------------------------------- |
| `npm run dev`                                | Start the dev server                                             |
| `npm run build`                              | Production build (the CI/merge gate)                             |
| `npm start`                                  | Serve the production build                                       |
| `npm run lint`                               | ESLint (includes `no-console`)                                   |
| `npm run format`                             | Prettier write (`format:check` to verify)                        |
| `npm run typecheck`                          | Generate route types and run `tsc --noEmit`                      |
| `npm test`                                   | vitest unit tests                                                |
| `npm run test:coverage`                      | Unit tests + V8 coverage and thresholds (CI)                     |
| `npm run test:e2e`                           | Playwright mobile e2e (builds + runs the app)                    |
| `npm run test:e2e:install`                   | Download Playwright Chromium (CI / no Chrome)                    |
| `npm run test:e2e:supabase`                  | Real sign-in e2e against local Supabase (Docker)                 |
| `npm run user:invite -- <email>`             | Invite a user (local stack; `--remote` for hosted)               |
| `npm run db:push:hosted -- --hosted`         | Push migrations to the **hosted** project (CI does this on main) |
| `npm run db:reset`                           | Same as `db:reset:local` (destructive, needs `-- --yes`)         |
| `npm run local:*`, `env:local`, `db:*:local` | Local Supabase workflow — see above                              |
| `npm run task:status -- TASK-010 Done`       | Set a dev task's status in `docs/dev-tasks/*.csv`                |

## Environment

Copy `.env.example` to `.env.local`. Every variable is documented there and optional for
local development, tests, CI and local e2e. Environments are selected with `APP_ENV`
(`development` / `staging` / `production`).

**Deploying (TASK-019):** a deployed environment — `APP_ENV=production|staging` or Vercel's
`VERCEL_ENV=production|preview` — must set `DATABASE_URL`, `CRON_SECRET`, `SESSION_SECRET`,
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `AUTH_PROVIDER=supabase`, and
must not set `E2E_RESET_TOKEN`. Otherwise `next build` fails, or `next start` exits with code 1 before
serving any request, naming the missing variables (never their values). Preview deployments
need a database too; there is no silent in-memory fallback once deployed.

**Local development (TASK-054):** `AUTH_PROVIDER=supabase` needs `DATABASE_URL`, and a
non-deployed run refuses non-local database/Supabase URLs unless `ALLOW_REMOTE_DATABASE=true`.
`npm run env:local` writes the local values for you.

## Database

- Schema: `supabase/migrations/20261124000000_init.sql` (6 arch-doc tables + `accrual_runs`).
- Seed: `supabase/seed.sql` — idempotent; IDs match `lib/data/mock/fixtures.ts`.
- Local DB (needs Docker): `npm run local:start` — see _Local Supabase development_ above.
- `npm test` includes schema tests (`tests/db/`) that apply the migration + seed to an
  in-process Postgres 17 (PGlite) — no Docker or credentials needed.
- Hard deletes on `leave_requests` / `audit_log` are blocked by triggers (3-year retention).
- The app connects with the **pooled** `DATABASE_URL` (port 6543); `DIRECT_URL` is for migrations.

### Where data goes

One switch (`getSql()` in `lib/db/postgres.ts`) picks the store for reads **and** writes.

| `DATABASE_URL` | Every read and write (requests, balances, queue, decisions, audit, policies, stats) |
| -------------- | ----------------------------------------------------------------------------------- |
| unset          | In-memory mock DB (per process, local dev only)                                     |
| set            | Postgres via postgres.js (`lib/db/`) — migration completed in TASK-015              |

Design: ADR-LeaveTrack-E003.

### Accrual job (TASK-017)

- **What:** adds each tracked policy's `accrual_per_month` to the employee's balance, once per
  UTC month. Unpaid (untracked) and zero-rate policies are skipped; a missing balance row is
  created. Design and trade-offs: ADR-LeaveTrack-E002.
- **When:** Vercel Cron calls `GET /api/jobs/accrual` **daily at 02:00 UTC** (`vercel.json`).
  The first successful run of a month accrues it; later runs that month are no-ops. Vercel
  never retries and may skip or duplicate runs — the job is idempotent and **catches up**
  every missed month (oldest first) on the next run. A gap over 12 months is refused (409)
  for manual review. Cron runs only on production deployments.
- **Manual run:**
  `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/jobs/accrual`
  → `{ accrued: [{ period, usersAccrued, daysAccrued }], upToDate, catchUp }`.
- **Audit:** each accrued month is a row in `accrual_runs` with `trigger` (`cron` for GET,
  `manual` for POST), `users_accrued`, exact `days_accrued` and a `rates` snapshot.
- **Policy changes and catch-up:** there is no policy history yet (backlog B24), so catch-up
  applies the **current** rate to every missed month. If a rate changed during a gap, compare
  the run's `rates` snapshot with the rate that was in effect and post a manual adjustment
  for the difference. Catch-up runs log a warning naming the periods.
- **Security:** `CRON_SECRET` is required; the Bearer check (constant-time) runs before any
  database access and fails closed if the secret is unset.

### Withdraw and cancel (TASK-028)

- On **My requests**, a pending request has **Withdraw**, and approved leave that hasn't started
  yet has **Cancel leave** (both ask you to confirm). Only you can cancel your own requests.
- Cancelling approved leave puts exactly its days back on that leave type's balance; Unpaid
  has no balance to restore. Leave that has started (today, UTC, or earlier) can't be cancelled.
- The request shows as **Cancelled**, leaves your approver's queue, and your approver gets a
  notification. A cancelled request can't be reopened.

### Notifications (TASK-030)

- When you submit a request, whoever can approve it gets a notification (your manager, or every
  other HR Admin for an HR Admin's request). When it's decided, you get one.
- The bell in the header shows how many are unread; **Notifications** lists them, newest first,
  with "Mark as read" and "Mark all as read". You only ever see your own.
- Each notification is saved in the same transaction as the request or decision, with an
  outbox entry for email. Email delivery comes with TASK-037; until then outbox entries wait.

### Balance history (TASK-029)

Every change to a leave balance — an approval or a monthly accrual — writes one row to an
append-only ledger (`balance_ledger`) in the same database statement: how much changed, the
balance after it, why, and a unique key so the same change can never be recorded twice.
Balances that existed before the ledger start with one "opening" row, so each person's ledger
always adds up to their balance. Ledger rows can't be edited or deleted.

### Request rules (TASK-027)

- You can't request days that overlap one of your own pending or approved requests (any leave
  type). Rejected and withdrawn requests don't count.
- A request can be at most **90 days**.
- Requests can't start in the past — except **Sick** leave, up to 30 days back. "Today" is the
  UTC date; the date pickers hint the allowed window.
- The database enforces all three (so two simultaneous submissions can't both get through); the
  app shows a clear message. The seed loads historical rows through a seed-only setting.

### Approvals (TASK-026)

- **Employees** are approved by their manager; **managers** by the HR Admin they report to; an
  **HR Admin without a manager** by any other HR Admin. Nobody approves their own request.
- HR Admins see **Approvals** in the menu with the requests waiting for them.
- A pending request shows who it's waiting for ("Awaiting Ben Ortiz", or "Awaiting HR").
- If nobody can approve a person's leave (for example the only HR Admin, or someone with no
  manager), submitting is refused with a clear message and nothing is created.
- Moving someone to a new manager moves their pending requests to that manager straight away.

### HR audit (TASK-015)

- `/audit` — all-employees event log (newest first, capped at 500; narrow the filters for older
  records — cursor paging is backlog B21).
- `GET /api/audit/:userId` (HR admin only) — one employee's full history: every non-deleted
  request with status, decision-maker, decision time, reason and its events. No default date
  cap (3+ year retention, BR-04); optional `from` / `to` (UTC dates, inclusive) on the request's
  creation date. Soft-deleted requests are excluded from both views but never removed from the
  database — hard deletes are blocked by triggers.

### Leave types are independent (TASK-018 / US-08)

A request only ever changes its own leave type's balance; untracked types (Unpaid) are
never balance-checked and can't hold balances or policies — enforced by triggers in
`20261129000000_untracked_types_guard.sql`.

**Before deploying that migration** to an existing database, run the read-only check:

```bash
psql "$DIRECT_URL" -f supabase/checks/untracked_type_rows.sql
```

If it returns rows, fix them with HR first — the migration refuses to run on bad data and
changes nothing. Constraint violations surface to clients as 400/409 envelopes
(`lib/db/errors.ts`), never as 500s.

### API documentation (TASK-057)

With the app running locally (`npm run dev`), open <http://localhost:3000/api-docs> for Swagger
UI, or fetch the raw OpenAPI 3.1 document from `/api/openapi.json` (for Postman or other tools).
Both are **development only**: they return 404 in every deployed environment.

- Documented: `GET /api/health`, `GET`/`POST /api/leave-requests`,
  `POST /api/leave-requests/{id}/decision`, `GET /api/audit/{userId}` and
  `GET`/`POST /api/jobs/accrual`. The test-only reset hook and server actions (sign-in,
  forms) are not APIs and aren't listed.
- Authentication per operation: the `lt-session` cookie from signing in on the site (Swagger
  UI's "Try it out" sends your own cookie), a Bearer `CRON_SECRET` for the accrual job, or
  none for the health check.
- The document is generated from the zod schemas (`lib/api/openapi.ts`, `lib/api/schemas.ts`)
  and checked against the OpenAPI 3.1 schema and the real handlers by `tests/api/`.

### Sessions and sign-in protection (TASK-025)

- You're signed out after **30 minutes without activity** (`SESSION_IDLE_TIMEOUT_MINUTES`,
  5–480) and always **8 hours after signing in**, however active you are. The server enforces
  both on every request.
- A minute before the idle limit, a warning shows a countdown. Pressing a key, clicking or
  scrolling the page, **Stay signed in** or Esc keeps you signed in; **Log out** signs out every
  open tab. Near the 8-hour limit the warning can't extend the session.
- Every sign-in starts a new session. Signed in and opening `/login?next=…` takes you to that
  page (same-site paths only).
- After **5 failed sign-ins for one email** (or 20 from one IP) within 15 minutes, sign-in is
  refused for that email or IP until the window passes, even with the right password. The
  counters are kept in the `rate_limits` table (migration `20261201000000_rate_limits.sql`).

### Known limitations

- **Notifications are log-only** (backlog B6): `leave_request.submitted` / `leave_request.decided`
  events are logged; a delivery failure is logged and never undoes a submission or decision.

## Testing

- **Unit / integration** — `npm test` (vitest, `tests/`): domain services and repositories run
  against in-process Postgres (PGlite); no Docker needed.
- **Coverage** — `npm run test:coverage` (CI runs this instead of `npm test`): V8 coverage of
  the code unit tests are meant to cover (`lib/`, `app/api/`, server actions, `proxy.ts`,
  `instrumentation.ts`); UI is covered by e2e and excluded. CI fails below the thresholds in
  `vitest.config.mts` (baseline 2026-11-26: statements 86.28%, branches 80.24%, functions
  91.77%, lines 87.2%), writes a table to the job summary and uploads `coverage-report`.
- **Mobile e2e** — `npm run test:e2e` (Playwright, `e2e/`): builds the app, starts it in memory
  mode on port 3100 and tests the submit form and balance page at 375×667, 320×568 and
  667×375 landscape (US-06), plus an overflow / tap-target / focus sweep of every page and
  role, keyboard navigation, reduced motion and axe (WCAG 2.1 A/AA) scans.
  - Locally it drives your installed **Google Chrome** (`channel: "chrome"`) — no download.
    Without Chrome, run `npm run test:e2e:install` once. CI uses Playwright's Chromium,
    cached per Playwright version.
  - **Isolation:** every test starts from the seed. An auto fixture calls
    `POST /api/test/reset`, a test-only hook that is a **404 unless `E2E_RESET_TOKEN` is set**
    (only `playwright.config.ts` sets it, with a random token per run) and never acts when
    `DATABASE_URL` is set. **Never set `E2E_RESET_TOKEN` in a deployed environment.**
- **Real sign-in e2e** — `npm run test:e2e:supabase` (`e2e-supabase/`, TASK-024): with local
  Supabase running, invites users, reads the email from Mailpit, sets a password, signs in,
  checks the database role, refuses an unlinked provider user, and after sign-out checks that
  Supabase rejects the old token and replayed cookies fail. Not part of the default CI job (that
  stays mock-only with no services). It creates and deletes only identities under
  `@e2e-auth.leavetrack.test` (your local users and dev logins are untouched) and needs port
  3000 free (the email links use `site_url`); it stops with a clear message if 3000 is busy.

## Project layout

```
app/            routes — (public)/login, (app)/… authenticated pages, api/health
components/     ui/ (shadcn primitives) + feature components by domain
lib/            auth, api envelope, data repository + mocks, validation, env, logger
proxy.ts        route guard (Next.js 16 proxy): auth redirect + role gating
supabase/       config, migrations, seed
tests/          vitest
knowledge/      coding standards, design system, prompt templates, patterns
```

## Day 1 hand-off notes

- **Auth:** done in TASK-023/024 — the auth port (`lib/auth/provider.ts`) has a Supabase
  adapter and a dev/test mock; `proxy.ts` and `getSession()` depend only on the port.
- **Data:** implement `LeaveRepository` (`lib/data/repositories.ts`) against Supabase and swap the
  exported `repository`. Components and pages don't change.
- **Cron (TASK-017):** add `vercel.json` with
  `{ "crons": [{ "path": "/api/jobs/accrual", "schedule": "0 2 1 * *" }] }` once the route exists,
  and set `CRON_SECRET`.
- **CI db push:** add `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF`
  repository secrets.

See `AGENTS.md` for the rules every change must follow.
