# ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port

**Status:** Proposed (TASK-011, 2026-11-24) — needs architect sign-off

## Context

TASK-011 is the first real write. ARCH-LeaveTrack-v1.0 mandates Supabase Postgres through the
**pooled** connection (Supavisor, transaction mode, port 6543). Constraints at the time:

- No Supabase project/credentials yet, and Docker unavailable for `supabase start`.
- RLS is enabled on every table with **no policies** (deny-all) until real auth (backlog B7).
- Business rules that must be atomic: request insert + `submitted` audit row (BR-04);
  later, decision + balance change + audit row (TASK-014).
- Tests must exercise the real SQL and constraints without external services.

## Options considered

1. **@supabase/supabase-js (PostgREST).** Familiar, RLS-aware.
   Cons: deny-all RLS forces the service-role key for every call; no multi-statement
   transactions from the client (would need RPC functions for every atomic operation);
   doesn't use the pooled URL the arch doc prescribes.
2. **An ORM (Prisma/Drizzle).** Typed queries, migrations.
   Cons: a second schema source alongside `supabase/migrations`; heavier dependency; ORM
   transaction-mode pooler caveats; not needed for a handful of queries.
3. **postgres.js over the pooled URL, behind a minimal `SqlClient` port** (chosen).
   Plain parameterised SQL; real transactions (`sql.begin`); `prepare: false` for the
   transaction pooler. Tests run the *same* SQL through a PGlite adapter (in-process
   Postgres 17).

## Decision

Option 3.

- `lib/db/sql.ts` — `SqlClient { query(text, params), transaction(fn) }`. Stores depend on
  this, never on a driver.
- `lib/db/postgres.ts` — postgres.js adapter, `prepare: false`, small pool, cached on
  `globalThis`; `getSql()` returns `null` when `DATABASE_URL` is unset.
- `tests/db/helpers.ts` — PGlite adapter + `createTestDb()` (all migrations + seed).
- Domain services (e.g. `lib/leave-requests/submit.ts`) take a store port; wiring chooses
  the Postgres store when `DATABASE_URL` is set, otherwise an in-memory store for local dev.

## Consequences

- Positive: one SQL source of truth (migrations); atomic multi-statement operations; tests
  hit real constraints and transactions with zero infrastructure.
- Negative: hand-written SQL and row mapping (mitigated by schema drift tests); the app
  connects as a privileged role, so **authorization is enforced in application SQL**
  (e.g. `manager_id` scoping in the query) until RLS policies exist — consistent with ARCH ›
  Security.
- Transitional (backlog B13): `createPostgresRepository(sql, fallback)` implements reads
  incrementally and delegates the rest to the mock repository, each delegation marked with
  its task. TASK-012 moved users, leave types, balances and my-requests; TASK-013 moved the
  manager queue (every statement scoped by `u.manager_id = $1`, asserted structurally);
  audit/policies/stats (TASK-015) remain. A parity test asserts the Postgres
  and mock implementations agree on the seed.
