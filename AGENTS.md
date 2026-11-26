# AGENTS.md — LeaveTrack

Cross-tool project rules for every contributor, human or AI. Read this before writing code.
Detailed standards: `knowledge/rules/coding-standards.md` · Design system: `knowledge/design-system.md`.

> ## ⚠️ MOCK AUTH — DO NOT SHIP
>
> Sign-in currently **accepts any email and password** and lets you pick any seeded user
> (ADR-LeaveTrack-E001). It exists only so role-gating works from commit one. It must be
> replaced by a real provider (Day 1) before any deployment that real staff can reach.

## Project

LeaveTrack replaces email-and-spreadsheet leave tracking: employees submit requests and see
balances, managers approve **only their direct reports**, HR gets an auditable, never-deleted
decision record (Q3 compliance audit).

Traceability: `docs/brd/BRD-LeaveTrack-v1.0.md` → `docs/prd/PRD-LeaveTrack-v1.0.md` →
`docs/arch-docs/ARCH-LeaveTrack-v1.0.md` (+ `ADR-LeaveTrack-E001` – `E007`) → `docs/dev-tasks/*.csv`.
EPIC 1 (US-01 – US-08) is Done; EPIC 2 (US-09 – US-24, TASK-019 – TASK-053) is defined in each
document's "Revision v1.1" section and `docs/dev-tasks/epic-2-hardening-and-resolution-tasks.csv`.

## Stack

| Layer   | Choice                                                                        |
| ------- | ----------------------------------------------------------------------------- |
| App     | Next.js 16 App Router, React 19, TypeScript (strict)                          |
| UI      | Tailwind CSS v4 (hsl tokens), shadcn/ui (new-york, Radix), lucide-react icons |
| Forms   | react-hook-form + zod                                                         |
| Data    | Supabase Postgres via **pooled** connection; migrations in `supabase/`        |
| Auth    | Day 0 mock cookie session (`mock-role` + `mock-user-id`, httpOnly, 8h)        |
| Logging | pino (JSON) — `lib/logger.ts`                                                 |
| Tests   | vitest (`tests/`)                                                             |
| Deploy  | Vercel (app + Cron) · Supabase (Postgres)                                     |

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
2. **Wrap every route handler** in `withErrorHandler`. Throw `AppError` for expected failures.
   Never return stack traces, SQL, or raw provider errors.
   Database constraint violations reach clients through `toAppError` (`lib/db/errors.ts`):
   name every constraint/trigger error and map it there — match SQLSTATE + constraint
   name, never message text.
3. **Validate every boundary with zod** — request bodies, query params, server action input,
   env vars. Client-side validation is UX only; the server always re-validates.
4. **Manager scoping is enforced in SQL** — `WHERE u.manager_id = :current_user_id` inside the
   query itself, never by filtering results in application code (BR-02, US-03 AC3, US-04).
   Acting on a non-direct-report's request returns **403**.
5. **Soft delete only.** `leave_requests.is_deleted = true`; every read filters it out. There is
   no hard-delete path — the database rejects `DELETE` on `leave_requests` and `audit_log` (BR-04).
6. **Every decision writes an `audit_log` row** in the same transaction as the status change.
7. **Balances are per leave type.** A request only ever touches its own `leave_type_id`.
   Unpaid (`tracks_balance = false`) is never balance-checked (US-08). Key logic on
   `tracksBalance`, never on a type's name. Enforced by DB triggers (untracked types can't
   hold balances or policies) and `tests/leave-types/balance-writers.test.ts` — a new
   writer of `leave_balances` must be reviewed and added to that registry.
8. **Accrual is idempotent** — insert the month into `accrual_runs` first in the transaction;
   a unique violation means it already ran (US-07).
9. **Pooled DB URL only** (`DATABASE_URL`, port 6543). `DIRECT_URL` is for migrations.
10. **Log with pino** (`logger.info({ ...context }, "message")`). `console.*` fails lint.

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

## Security rules

- Session cookies: httpOnly, `SameSite=Lax`, `Secure` in production, 8h max age.
- `proxy.ts` guards every non-public route; role-gated pages **also** call `requireRole()`.
- Redirect targets go through `safeRedirectPath()` (no open redirects).
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
