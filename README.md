# LeaveTrack

Self-service leave management: employees request time off and check balances, managers approve
their own team's requests, and HR gets an auditable, never-deleted decision record.

> **Day 0 scaffold.** The UI shell, design system, schema, and guardrails are in place. Auth is a
> **mock** (any email/password works) and all data comes from in-memory fixtures. Real auth, the
> database, and the APIs are wired in Day 1 — see `docs/dev-tasks/`.

## Quick start

Requirements: Node 24 (`.nvmrc`), npm 11.

```bash
npm install
npm run dev
```

Open http://localhost:3000. No `.env` file or external service is needed.

### Trying each role

On the sign-in page, enter anything for email and password, then pick a person:

| Person     | Role     | What you can see                                            |
| ---------- | -------- | ----------------------------------------------------------- |
| Ana Reyes  | Employee | Dashboard, new request, my requests, balance                |
| Ben Ortiz  | Manager  | Everything above + approvals for Ana, Jordan, Priya         |
| Maya Chen  | Manager  | Approvals for Sam, Lena, Diego only (scoping demo)          |
| Carla Diaz | HR Admin | Everything an employee sees + audit report + leave policies |

The session lasts 8 hours; sign out from the account menu (top right).

## Scripts

| Command                                | What it does                                      |
| -------------------------------------- | ------------------------------------------------- |
| `npm run dev`                          | Start the dev server                              |
| `npm run build`                        | Production build (the CI/merge gate)              |
| `npm start`                            | Serve the production build                        |
| `npm run lint`                         | ESLint (includes `no-console`)                    |
| `npm run format`                       | Prettier write (`format:check` to verify)         |
| `npm run typecheck`                    | Generate route types and run `tsc --noEmit`       |
| `npm test`                             | vitest unit tests                                 |
| `npm run db:push`                      | Apply `supabase/migrations` to the linked project |
| `npm run db:reset`                     | Reset a **local** Supabase DB and run `seed.sql`  |
| `npm run task:status -- TASK-010 Done` | Set a dev task's status in `docs/dev-tasks/*.csv` |

## Environment

Copy `.env.example` to `.env.local`. Every variable is documented there and optional on Day 0.
Environments are selected with `APP_ENV` (`development` / `staging` / `production`).

## Database

- Schema: `supabase/migrations/20261124000000_init.sql` (6 arch-doc tables + `accrual_runs`).
- Seed: `supabase/seed.sql` — idempotent; IDs match `lib/data/mock/fixtures.ts`.
- Local DB (needs Docker): `npx supabase start && npm run db:reset`.
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

### HR audit (TASK-015)

- `/audit` — all-employees event log (newest first, capped at 500; narrow the filters for older
  records — cursor paging is backlog B21).
- `GET /api/audit/:userId` (HR admin only) — one employee's full history: every non-deleted
  request with status, decision-maker, decision time, reason and its events. No default date
  cap (3+ year retention, BR-04); optional `from` / `to` (UTC dates, inclusive) on the request's
  creation date. Soft-deleted requests are excluded from both views but never removed from the
  database — hard deletes are blocked by triggers.

### Known limitations

- **Notifications are log-only** (backlog B6): `leave_request.submitted` / `leave_request.decided`
  events are logged; a delivery failure is logged and never undoes a submission or decision.

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

- **Auth:** replace the body of `loginAction` (`app/(public)/login/actions.ts`) with a real
  provider; keep the cookie names/shape so `proxy.ts` and `getSession()` stay unchanged.
- **Data:** implement `LeaveRepository` (`lib/data/repositories.ts`) against Supabase and swap the
  exported `repository`. Components and pages don't change.
- **Cron (TASK-017):** add `vercel.json` with
  `{ "crons": [{ "path": "/api/jobs/accrual", "schedule": "0 2 1 * *" }] }` once the route exists,
  and set `CRON_SECRET`.
- **CI db push:** add `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF`
  repository secrets.

See `AGENTS.md` for the rules every change must follow.
