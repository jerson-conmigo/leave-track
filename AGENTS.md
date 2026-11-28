# AGENTS.md — LeaveTrack

Cross-tool project rules for every contributor, human or AI. Read this before writing code.
Detailed standards: `knowledge/rules/coding-standards.md` · Design system: `knowledge/design-system.md`.

> ## Sign-in: Supabase Auth when deployed, mock locally
>
> Deployed environments must use `AUTH_PROVIDER=supabase` (email + password, **invite only**;
> TASK-024). The default `AUTH_PROVIDER=mock` lets you pick any seeded user with no
> credentials — **dev/test only**; a deployed environment refuses to start with it
> (ADR-LeaveTrack-E004). Either way the session is a **signed** cookie (TASK-023).

## Project

LeaveTrack replaces email-and-spreadsheet leave tracking: employees submit requests and see
balances, managers approve **only their direct reports**, HR gets an auditable, never-deleted
decision record (Q3 compliance audit).

Traceability: `docs/brd/BRD-LeaveTrack-v1.0.md` → `docs/prd/PRD-LeaveTrack-v1.0.md` →
`docs/arch-docs/ARCH-LeaveTrack-v1.0.md` (+ `ADR-LeaveTrack-E001` – `E007`) → `docs/dev-tasks/*.csv`.
EPIC 1 (US-01 – US-08) is Done; EPIC 2 (US-09 – US-24, TASK-019 – TASK-053) is defined in each
document's "Revision v1.1" section and `docs/dev-tasks/epic-2-hardening-and-resolution-tasks.csv`.

## Stack

| Layer   | Choice                                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------------------------- |
| App     | Next.js 16 App Router, React 19, TypeScript (strict)                                                                |
| UI      | Tailwind CSS v4 (hsl tokens), shadcn/ui (new-york, Radix), lucide-react icons                                       |
| Forms   | react-hook-form + zod                                                                                               |
| Data    | Supabase Postgres via **pooled** connection; migrations in `supabase/`                                              |
| Auth    | Supabase Auth (`@supabase/ssr`) + signed session cookie `lt-session` via `lib/auth/provider.ts`; mock dev/test only |
| Logging | pino (JSON) — `lib/logger.ts`                                                                                       |
| Tests   | vitest (`tests/`)                                                                                                   |
| Deploy  | Vercel (app + Cron) · Supabase (Postgres)                                                                           |

## Where things go

- `app/(public)/` unauthenticated routes · `app/(app)/` authenticated routes · `app/api/` route handlers
- `components/ui/` shadcn primitives (generated; edit sparingly) · `components/<domain>/` feature components
- `lib/data/repositories.ts` — the **only** data-access contract pages may use for **reads**
- `lib/<domain>/` (e.g. `lib/leave-requests/`) — mutation services: business rules + a store port;
  route handlers and server actions are thin transports over them (pattern: TASK-011)
- `lib/db/` — `SqlClient` port + postgres.js adapter (pooled URL); stores use the port, never a
  driver (ADR-LeaveTrack-E003). Process-wide state lives on `globalThis` (see coding-standards)
- `lib/auth/roles.ts` — the **only** route→role matrix (proxy, `requireRole`, and nav all read it)
- `lib/api/` — response envelope, `AppError`, `withErrorHandler`
- `lib/validation/` — zod schemas shared by client and server
- `supabase/migrations/` — schema changes (never edit an applied migration; add a new one)

## Backend standards

1. **Error envelope everywhere.** Non-2xx responses are exactly
   `{ success: false, error: { code, message } }`; 2xx are `{ success: true, data }`.
   Use `ok()` / `fail()` from `lib/api/response.ts` and codes from `lib/api/errors.ts`.
   The one exception is `GET /api/openapi.json` (TASK-057), which returns the raw OpenAPI
   document for tools; its errors still use the envelope.
2. **Wrap every route handler** in `withErrorHandler`. Throw `AppError` for expected failures.
   Never return stack traces, SQL, or raw provider errors.
   Database constraint violations reach clients through `toAppError` (`lib/db/errors.ts`):
   name every constraint/trigger error and map it there — match SQLSTATE + constraint
   name, never message text.
3. **Validate every boundary with zod** — request bodies, query params, server action input,
   env vars. Client-side validation is UX only; the server always re-validates.
4. **Approver scoping is enforced in SQL** — `WHERE public.can_decide(:current_user_id, <requester>)`
   inside the query itself, never by filtering results in application code (BR-02, BR-10, US-03 AC3,
   US-04, US-15; TASK-026). The rule (one SQL function, `supabase/migrations/20261202000000_approval_routing.sql`):
   a manager decides their direct reports; an HR Admin decides the managers who report to them and
   other HR Admins without a manager; **nobody decides their own request** (also a CHECK constraint,
   `leave_requests_no_self_decision`). Acting on a request that isn't waiting for you returns **403**;
   submitting when nobody may approve returns **409** and creates nothing (`has_approver`). The
   in-memory store mirrors the rule in `lib/leave-requests/approver.ts`, parity-tested against SQL.
5. **Soft delete only.** `leave_requests.is_deleted = true`; every read filters it out. There is
   no hard-delete path — the database rejects `DELETE` on `leave_requests` and `audit_log` (BR-04).
6. **Every decision writes an `audit_log` row** in the same transaction as the status change.
7. **Balances are per leave type.** A request only ever touches its own `leave_type_id`.
   Unpaid (`tracks_balance = false`) is never balance-checked (US-08). Key logic on
   `tracksBalance`, never on a type's name. Enforced by DB triggers (untracked types can't
   hold balances or policies) and `tests/leave-types/balance-writers.test.ts` — a new
   writer of `leave_balances` must be reviewed and added to that registry.
   Every `leave_balances` writer also writes ONE `balance_ledger` row in the same statement
   (TASK-029, ADR-E006 §1): delta, balance after, source and a unique `source_key`
   (`approval:<request>`, `accrual:<period>:<user>:<type>`, …). The ledger is append-only
   (UPDATE/DELETE/TRUNCATE refused) and reconciles: per (user, type) the deltas sum to the
   balance. The registry test fails a balance writer that doesn't write the ledger.
   The same goes for the past-start allowance (TASK-027): it is the
   `leave_types.max_backdate_days` attribute (Sick 30, others 0), never the name "Sick".

8. **Accrual is idempotent** — insert the month into `accrual_runs` first in the transaction;
   a unique violation means it already ran (US-07).
9. **Pooled DB URL only** (`DATABASE_URL`, port 6543). `DIRECT_URL` is for migrations.
10. **Log with pino** (`logger.info({ ...context }, "message")`). `console.*` fails lint.
11. **Document every API route** (TASK-057). A new or changed route updates
    `lib/api/openapi.ts` (operation, per-operation security, the statuses it really returns)
    and `lib/api/schemas.ts` (response zod schemas). Query/params schemas live in
    `lib/validation/`. `tests/api/openapi.test.ts` fails on any undocumented route or method,
    and `tests/api/contract.test.ts` checks real responses against the schemas. The docs
    (`/api-docs`, `/api/openapi.json`) are development only: 404 when deployed.
12. **Request integrity is enforced in the database** (TASK-027, BR-13, ARCH D10): no overlapping
    pending/approved requests per person (`leave_requests_no_overlap`, an exclusion constraint),
    at most 90 days (`leave_requests_max_length`, `MAX_REQUEST_DAYS`), no start before today (UTC)
    minus the type's allowance (`leave_requests_backdate_window` trigger). The submit service
    checks first for friendly 400s; the constraints are the backstop for races, mapped by
    `toAppError`. Only `supabase/seed.sql` and test fixtures (`asHistorical`) may load historical
    rows through `leavetrack.allow_backdated`; application code never sets it. Tests write request
    dates with `future()` / `daysFromToday()` so they never go stale.
13. **Notifications are written in the business transaction** (TASK-030, ADR-E007): the
    leave-request stores call `lib/notifications` (`writeRequestSubmitted` /
    `writeRequestDecided`, memory mirror inside `atomically`) after their own rows, so a
    rolled-back action leaves no notification. Each notification has one `notification_outbox`
    row (unique `idempotency_key`), delivered by TASK-037. Recipients of "submitted" come from
    `public.can_decide` (the approval rule). Every read and mark-read is scoped
    `WHERE recipient_id = :session_user` in SQL. The `Notifier` port is the post-commit log
    channel only.
14. **Withdraw / cancel** (TASK-028, US-16): only the requester (`user_id = :session_user` in the
    UPDATE itself); pending → withdrawn, approved → cancellable only while `start_date > today`
    (UTC). Approved leave of a tracked type gets back exactly the approval's ledger delta
    (`cancellation:<request>` row, same statement as the balance credit). Status, balance,
    ledger, the `cancelled` audit row and the approvers' notification are one transaction.
    `cancelled_by` / `cancelled_at` record it; the approval's `decided_*` stay. A cancelled
    request is final (trigger). "Not yours" (403) is checked before "started" (409).

## Frontend standards

1. **Server components by default.** Add `"use client"` only for interactivity; read the session
   with `getSession()` / `requireRole()` on the server — no auth Context provider.
2. **Pages depend on `repository`, never on fixtures or a DB client directly.** Mutations are
   props (`onSubmit`, `onDecide`) so Day 1 can pass server actions without touching components.
3. **Tokens only.** Use semantic Tailwind classes (`bg-primary`, `text-status-pending-foreground`,
   `text-leave-sick`…). No raw hex/rgb/oklch, no arbitrary color values. New colors go into
   `app/globals.css` as `hsl()` tokens and into the design-system doc.
4. **Every hand-written selector in `globals.css` lives in `@layer base`** — unlayered rules beat
   Tailwind utilities app-wide.
5. **Every component covers its states:** default, hover, focus-visible, disabled, loading,
   empty, error.
6. **Mobile first.** Must work at 320–375px with no horizontal scroll (US-06): tables become
   stacked cards below `md`, touch targets ≥ 44px on mobile.
7. **Accessibility.** Semantic HTML, labelled controls, `aria-current` on nav, visible focus
   rings, status conveyed by icon + text (never color alone), WCAG AA contrast.
8. **Icons** come from `lucide-react` only; decorative icons get `aria-hidden`. Centered icons use
   flex or `mx-auto` (Tailwind preflight makes `svg` block-level).

9. **The notification bell** (`components/layout/notification-bell.tsx`) carries the unread
   count in its accessible name ("Notifications, 3 unread") and as badge text — never colour
   alone; it keeps a fixed 44px target so the 320px header still fits at 200% text.

## Security rules

- Session cookies: httpOnly, `SameSite=Lax`, `Secure` in production, 8h max age. The session
  is one **signed** cookie (`lt-session`, HMAC-SHA256 with `SESSION_SECRET`, verified in
  constant time). Authorization always comes from the `users` row (`getSession`), never from
  token claims; the role in the token only routes `proxy.ts`. Tokens are created and verified only
  through `lib/auth/provider.ts`; only `lib/auth/sign-in.ts` writes the `lt-session` cookie
  (`completeSignIn` at sign-in, and `renewSession` for the sliding idle window, which only
  `proxy.ts` calls), only `proxy.ts` and `lib/auth/session.ts` read it, no client component
  imports the session modules, and only `lib/auth/supabase/*` touches Supabase clients or their
  `sb-*` cookies (all pinned by `tests/auth/session-boundary.test.ts`).
- Session limits (TASK-025): token v2 carries `sid` (new on every sign-in), `iat`, `lat` (last
  activity) and `exp` (sign-in + 8 h). The server rejects a session idle for
  `SESSION_IDLE_TIMEOUT_MINUTES` (default 30, 5–480; `lib/auth/session-policy.ts` is the only
  source) or past `exp`. Activity renews `lat` only: `exp` is copied, never recomputed, and a
  renewed cookie's max age is `exp − now`. Prefetches don't count as activity. The client idle
  warning (`components/session/idle-session-guard.tsx`) is UX only, reads its timing from the
  server, and never enforces anything; v1 tokens are rejected.
- Sign-in throttling (TASK-025; TASK-041 extends the same `lib/rate-limit/` store): failed
  password sign-ins are limited to 5 per email and 20 per IP in 15 minutes, checked before the
  provider is called, with one message whether or not the account exists. Keys are HMACs (no
  raw email or IP stored or logged); the client IP is trusted only on Vercel; the limiter
  fails closed. Counters live in Postgres (`rate_limits`), so limits hold across instances.
- Supabase Auth (TASK-024): a provider identity maps to a user **only** through
  `users.auth_user_id`, set by an administrator's invite (`npm run user:invite`) — never by
  matching emails at sign-in. No self-registration. `proxy.ts` refreshes the provider session
  and `getSession()` re-checks it with the Auth server (signed-out sessions are rejected);
  every provider failure fails closed. The mock picker refuses to run unless
  `AUTH_PROVIDER=mock`. `SUPABASE_SERVICE_ROLE_KEY` is read from the environment only by the
  invite script. **Local-only exception (TASK-054):** `npm run db:seed:auth` creates sign-ins
  for seeded people on the LOCAL stack (credentials from `supabase status`, never `.env.local`),
  linking by id only while unlinked; it has no remote mode.
- **Local development stays local (TASK-054):** scripts under `scripts/` that serve local
  development (`local:*`, `env:local`, `db:*:local`, `db:seed:auth`) go through
  `scripts/lib/local-only.mjs` and refuse non-local URLs. Anything that targets the hosted
  project needs an explicit flag (`user:invite -- --remote`, `db:push:hosted -- --hosted`,
  which always passes `--remote` — Supabase CLI 3.x defaults to the local database). In
  development `lib/env.ts` refuses non-local `DATABASE_URL` / `DIRECT_URL` /
  `NEXT_PUBLIC_SUPABASE_URL` unless `ALLOW_REMOTE_DATABASE=true`. Never pass `--no-backup` to
  `supabase stop`. The sign-in page's local account menu (TASK-056, `DEV_LOGIN_ACCOUNTS=true`)
  only FILLS the form, is decided on the server per request (`lib/auth/dev-accounts.ts`:
  opt-in, not deployed, Supabase provider, `localhost`/`127.0.0.1` URLs only) and is refused
  when deployed; it never reaches a page otherwise.
- `proxy.ts` guards every non-public route; role-gated pages **also** call `requireRole()`.
- Redirect targets go through `safeRedirectPath()` (no open redirects); emailed-link routes
  use a fixed destination and ignore any target in the URL.
- Security headers (CSP, HSTS, frame-ancestors none, nosniff…) live in `next.config.ts`.
- No CORS — the API is same-origin only.
- `/api/jobs/*` (e.g. the accrual job): accept **GET** (Vercel Cron can only GET) and **POST**
  (manual); check `Authorization: Bearer $CRON_SECRET` with a constant-time compare **before any
  database access**, failing closed if unset; be idempotent and assume duplicate, overlapping
  and missed invocations (ledger row + effect in one transaction). See ADR-LeaveTrack-E002.
- RLS is enabled on every table; Day 1 adds policies. The service-role key is server-only.
- **Deployed environments fail closed** (`APP_ENV` production/staging or `VERCEL_ENV`
  production/preview): `lib/env.ts` refuses to build or start without every
  `REQUIRED_WHEN_DEPLOYED` variable, or with `E2E_RESET_TOKEN` set. Never key strictness on
  `NODE_ENV` — `next build` and local e2e run with `NODE_ENV=production`. New required
  secrets go into `REQUIRED_WHEN_DEPLOYED` (and its pinned test).
- Never commit secrets. `.env.example` documents every variable; real values live in
  `.env.local` / Vercel / GitHub secrets.

## Git conventions

- Branch from `main`: `feat/TASK-011-submit-request`, `fix/…`, `chore/…`.
- **Conventional Commits** (enforced by commitlint): `feat(requests): add submit form validation`.
- Reference the task ID in the PR title or body. One task per PR where possible.
- Never commit directly to `main`; never bypass hooks (`--no-verify`).

Workflow for every task (one branch and one PR per task):

1. `git switch main && git pull`
2. `git switch -c <feat|fix|chore>/TASK-0NN-short-name`
3. Run EVALUATE → PLAN → APPLY → VALIDATE; commit with Conventional Commits (hooks run).
4. `git push -u origin <branch>`, then open a PR that references `TASK-0NN`.
5. Merge only when CI (quality + e2e) is green. Marking the task Done is part of VALIDATE.

`graphify-out/`: only the shared graph (`graph.json`, `GRAPH_REPORT.md`, `manifest.json`,
label files) is tracked; the cache, `graph.html` and dated snapshots are git-ignored.

## Task tracking

`docs/dev-tasks/*.csv` is the task board. When a task's acceptance criteria all pass (VALIDATE),
set its status with `npm run task:status -- <TASK-ID> Done` — the script edits only that field.
Never re-save the CSV through a CSV library or spreadsheet app (it re-quotes every row).

## Quality gates (must pass before merge)

```bash
npm run lint && npm run format:check && npm run typecheck && npm test && npm run build
npm run test:e2e   # mobile e2e (CI runs it on every PR)
```

- CI runs `npm run test:coverage` in place of `npm test` (same tests plus V8 coverage). It fails
  below the thresholds in `vitest.config.mts`; raise them as coverage improves, never lower
  them silently.

- UI changes must keep `e2e/` green: no horizontal overflow at 320/375, ≥44px tap targets,
  visible keyboard focus, no serious/critical axe violations. Use the helpers in `e2e/helpers.ts`.

- husky pre-commit runs lint-staged (eslint --fix + prettier on staged files).
- husky commit-msg runs commitlint.
- CI (`.github/workflows/ci.yml`) runs the full gate plus `npm audit`; it pushes migrations to
  Supabase on `main` once the Supabase secrets are configured.
- Dependencies are pinned to exact versions — no `^`, `~`, or `latest`. Resolve new versions from
  the registry, never from memory.
