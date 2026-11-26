# Coding Standards — LeaveTrack

Expands `AGENTS.md`. When the two disagree, fix whichever is wrong in the same PR.

## TypeScript

- `strict` + `noUncheckedIndexedAccess`. No `any`; use `unknown` and narrow.
- Domain types live in `lib/data/types.ts` and mirror the SQL schema 1:1 (camelCase in TS,
  snake_case in SQL). View models (`…View`, `…Summary`) are what components consume.
- Prefer `type` aliases; export prop types for every component (`XxxProps`).
- Path alias `@/` for everything outside the current folder.
- Server-only modules start with `import "server-only"` (env, logger, session, repositories).

## Next.js 16

- Route guard is `proxy.ts` exporting `proxy` (not `middleware`).
- `params` / `searchParams` / `cookies()` are async — always `await` them. Use the generated
  `PageProps<"/route">` helper for page props.
- Server components by default; `"use client"` only at the leaf that needs interactivity.
- Mutations from the UI are **server actions** (Day 1) passed in as props; route handlers in
  `app/api/` are for external callers (cron, integrations) and the documented REST surface.
- Every page exports `metadata` with a `title`.

## API route handlers

```ts
export const POST = withErrorHandler(async (req) => {
  const session = await requireApiSession(); // Day 1 helper → AppError("UNAUTHENTICATED")
  const input = LeaveRequestSchema.safeParse(await req.json());
  if (!input.success) throw new AppError("VALIDATION_ERROR", input.error.issues[0]!.message);
  const created = await repository.createRequest(session.userId, input.data);
  return ok(created, { status: 201 });
});
```

- Always `withErrorHandler`; always zod; always the envelope.
- Status codes: 200/201 success · 400 validation · 401 no session · 403 wrong role or not a direct
  report · 404 missing (or soft-deleted) · 409 conflict (e.g. accrual already ran) · 500 unknown.
- Authorize **before** reading the resource; for manager actions the ownership check is part of
  the SQL `WHERE` clause.

## Database

- One migration per change: `supabase/migrations/<UTC timestamp>_<snake_name>.sql`. Never edit an
  applied migration.
- Every FK is indexed; every FK is `on delete restrict` (retention).
- A trigger that validates against ANOTHER table must lock the row it reads (`for share`)
  when a concurrent change to that row could break the invariant (TASK-018: balance/policy
  inserts vs flipping `leave_types.tracks_balance`). Raise with `errcode` + a named
  `constraint` so `lib/db/errors.ts` can map it.
- A migration that adds an invariant over existing data starts with a pre-check that
  raises (and rolls back) on violations — never silently delete or rewrite production rows.
  Ship a read-only diagnosis script in `supabase/checks/`.
- Business invariants that can be constraints **are** constraints (`end_date >= start_date`,
  decision consistency, unique balance per user+type).
- Soft delete: filter `is_deleted = false` in every read. `DELETE` is blocked by trigger.
- Money-like quantities (days) are `numeric`, never `float`.
- Keep `supabase/seed.sql` idempotent (`on conflict do nothing`) and in sync with
  `lib/data/mock/fixtures.ts`.
- Write the decision + balance change + audit row in **one transaction**.
- **Every migration keeps `tests/db/schema.test.ts` green.** A new table, column, FK, enum value,
  or invariant gets an assertion there in the same PR (migration files are auto-discovered).
  The suite runs real Postgres 17 in-process (PGlite) under `npm test` — no Docker needed.
- Pool size comes from `DATABASE_POOL_MAX` (default 5). On Vercel serverless with the Supavisor
  transaction pooler use 1–2 — every function instance opens its own pool.
- Read paths may run independent queries in parallel (`Promise.all`); with a pool of 1 they
  serialise. Measure p95 against the 500 ms NFR on real Supabase before adding more round trips.
- PGlite has no Supabase `auth` schema or `anon`/`authenticated` roles. A migration that uses
  them (e.g. RLS policies with `auth.uid()`) needs a shim in the test's `beforeAll`.
- Decisions: `decision_reason` is required when `status = 'rejected'`, optional on approve, and
  must be NULL while pending (DB-enforced).
- **Date filters are UTC calendar dates, everywhere.** In TS use `lib/data/dates.ts`
  (`utcDay`, `withinUtcDays`, `utcMonthBounds`); in SQL use `(ts at time zone 'UTC')::date` —
  never `ts::date`, which follows the session timezone. Compute month/period bounds in TS and
  pass them as parameters so mock and Postgres share one definition (TASK-015, parity-tested
  with a 23:30 UTC boundary under a non-UTC session).
- **Day amounts use exact decimal arithmetic.** `numeric` in SQL (compute sums/totals in SQL);
  integer hundredths in TS via `lib/data/decimal.ts` (`addDays`, `sumDays`). Never add day
  amounts as binary floats (0.1 + 0.2 = 0.30000000000000004). Tests must use inputs **verified**
  to drift (check in node first) — some "obvious" ones like 1.33 × 3 are exact in floats (TASK-017).
- **Scheduled jobs:** write the idempotency ledger row and the effect in ONE transaction; assume
  duplicate, overlapping and missed invocations (Vercel Cron is best-effort, never retried);
  catch up missed periods with a sanity cap; record an audit snapshot of the inputs used.
- **Never bind a parameter as a custom enum.** Send enums as text and cast inside SQL —
  `($3::text)::public.request_status` — and read them back as `::text`. A `$n::public.<enum>`
  parameter makes postgres.js issue a type-lookup query mid-statement (extra round trips; on a
  single-session server it destroyed the connection inside a transaction — TASK-014). Enforced
  by `tests/db/sql-conventions.test.ts`.
- **CHECK constraints pass on NULL.** `check (x ~ '\S')` accepts `x IS NULL` — wrap nullable
  inputs in `coalesce(...)` (or add `NOT NULL`) when NULL must fail.
- **Postgres `trim()` strips spaces only**, not tabs/newlines. For "non-blank" use
  `coalesce(col, '') ~ '\S'`, which matches zod's `.trim().min(1)` semantics.

## Logging

- `logger` from `lib/logger.ts`. Structured: `logger.info({ requestId, userId }, "request approved")`.
- Levels: `error` (needs action), `warn` (unexpected but handled), `info` (business events),
  `debug` (dev detail). Never log cookies, tokens, passwords, or full request bodies.

## UI

- Compose shadcn primitives; don't restyle them per-page. Variants go in the primitive via `cva`.
- Colors only via tokens (see `knowledge/design-system.md`). Never `text-[#…]` or inline styles.
- Each component handles: default, hover, focus-visible, disabled, loading, empty, error.
- Lists of records: cards below `md`, `Table` from `md`.
- Forms: react-hook-form + `zodResolver(schema)`; the same schema is re-used server-side.
- Accessibility checklist: label every control; `aria-invalid` + described error; icon-only
  buttons have `aria-label`; dialogs have title + description; status = icon + text.

## Testing

- vitest, files in `tests/**/*.test.ts`.
- Test pure logic directly (validation, role matrix, formatting, repository contracts).
- Every security rule gets a test: scoping (manager sees only reports), 403 on non-reports,
  no hard delete, accrual idempotency.
- A bug fix lands with the test that would have caught it.

## Dependencies

- Exact versions only (no `^`/`~`/`latest`); resolve from the registry, never from memory.
- No beta/RC/canary, no deprecated packages. Justify every new dependency in the PR.

## Hard-won rules (from Day 0 VALIDATE)

These each caused a real defect during the scaffold. Keep them.

- **Format dates hydration-safely.** Node's ICU emits U+2009/U+202F where browsers emit U+0020
  (`formatRange`, AM/PM). Any date string rendered by a client component must go through
  `lib/format.ts`, which normalises Unicode spaces. Never call `Intl.DateTimeFormat` directly in
  a component. Symptom when violated: React error #418 in production only.
- **`dark:` is class-scoped.** Tailwind v4 defaults `dark:` to `prefers-color-scheme`; the app
  is light-only, so `globals.css` declares `@custom-variant dark (&:where(.dark, .dark *))`.
  Don't remove it, or OS dark mode half-themes the UI (shadcn primitives ship `dark:` classes).
- **After `npx shadcn add`, re-check `package.json`.** The CLI writes `^` ranges and may add
  dependencies (it added `next-themes`, and once rewrote imports to a bogus `cn` npm package).
  Restore exact pins, remove unused deps, and grep for `from "cn"`.
- **Type literals in `UNION ALL` seeds.** Untyped literals resolve to `text` across a union;
  cast explicitly (`'…'::timestamptz`). Validate migrations + seed (run twice) before committing.
- **"Available for this request" excludes the request itself.** Pending deductions must not
  count the request being evaluated, or every in-balance request is flagged as over.
- **Process-wide state goes on `globalThis`.** Next bundles route handlers and pages into separate
  module graphs, so a module-level singleton (in-memory store, DB pool) exists once _per bundle_.
  TASK-011: an API write was invisible to pages until the mock store moved to `globalThis`. Unit
  tests can't catch this (one module graph) — verify cross-transport flows on a real build.
- **Measure, don't eyeball, responsiveness.** Check `scrollWidth === clientWidth` and target
  heights ≥ 44px at 320/375px for every page and role; inline text links need
  `min-h-11 md:min-h-0` to meet the touch-target rule.
