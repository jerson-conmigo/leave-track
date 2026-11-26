# Pattern — Implement-and-test chain

The golden path for any Day 1+ feature task. Each step is small, verifiable, and committed.

```
1. Contract   → zod schema in lib/validation/        (+ unit tests for edge cases)
2. Types      → lib/data/types.ts view/row types     (mirror SQL)
3. Schema     → new migration if needed               (constraints > app logic)
4. Repository → LeaveRepository method + Supabase impl (scoping & is_deleted in SQL)
5. Endpoint   → route handler / server action         (withErrorHandler, envelope, authz first)
6. Tests      → one test per acceptance criterion     (incl. 403 / validation / idempotency)
7. UI wiring  → pass the server action into the existing component prop
8. Gate       → lint · format:check · typecheck · test · build
9. Commit     → conventional commit referencing TASK-ID
```

## Rules of the chain

- **Don't skip ahead.** UI wiring comes after the endpoint passes its tests.
- **Acceptance criteria are the test list.** Copy each AC from the task CSV into a `it(...)` title.
- **Security criteria are tested negatively** — prove the manager _can't_ see/act on another
  team's request, prove `DELETE` fails, prove a second accrual run is a no-op.
- **Components don't change shape on Day 1.** If wiring a component needs a prop change, the
  Day 0 interface was wrong — fix the interface deliberately and note it in the PR.

## Example — TASK-014 (approve/reject)

1. `DecisionSchema = z.discriminatedUnion("decision", [...])` — reject requires `reason`.
2. Repository `decide(managerId, requestId, decision, reason?)` — single transaction:
   `UPDATE leave_requests … FROM users u WHERE r.id = $1 AND u.id = r.user_id AND u.manager_id = $2
AND r.status = 'pending' AND NOT r.is_deleted` → 0 rows ⇒ 403/404; then balance decrement
   (approve, tracked types only) and `audit_log` insert.
3. `POST /api/leave-requests/:id/decision` → `withErrorHandler`, `ok()`.
4. Tests: AC1 approve decrements + audits · AC2 reject keeps balance + audits · AC3 non-report → 403.
5. Pass the server action as `ApprovalQueue`'s `onDecide`.

## Prove the test can fail (from TASK-010)

A suite that passes on the first run proves nothing until you've seen it go red. Before calling a
task done, make one deliberate, targeted break per critical assertion and confirm **exactly
that test** fails with a non-zero exit — then restore the original byte-for-byte (`cmp`).

- Break the thing, not the syntax: a malformed edit fails `beforeAll` and _skips_ everything,
  which looks red but proves nothing about the assertion.
- Typical probes: neutralise a CHECK (`… check (true)`), drop an index, rename a fixture value,
  add a stray migration file.
- Tests must be **order-independent**: shared setup (migrate, seed) goes in `beforeAll`, never
  inside one `it`. Verify with `vitest --sequence.shuffle` and a single `-t` filtered run.
- Never hand-list inputs the suite must cover (e.g. migration files) — discover them, or a new
  file is silently skipped while the suite stays green.

### Running mutation probes safely (from TASK-011)

- Drive probes from a **script with guaranteed restore** — back up each file, apply one change,
  run, restore in `finally`, then assert the file hash matches the original. Never chain shell
  `cp`/`sed` loops: in zsh, an unquoted `$FILES` is _not_ word-split, so backups silently fail and
  mutations accumulate across probes (happened in TASK-011 VALIDATE; caught and reverted).
- Anchor every probe on a string that occurs exactly once, and fail the probe if it doesn't.

### Verifying the real DB driver without Docker

`@electric-sql/pglite-socket` serves PGlite over the Postgres wire protocol, so the production
postgres.js adapter (`lib/db/postgres.ts`) can be exercised for real: start
`new PGLiteSocketServer({ db, port, maxConnections: 10 })`, set `DATABASE_URL` to it **before**
importing `lib/db/postgres`, and run the store against it (done one-off for TASK-011).

**Use `DATABASE_POOL_MAX=1` against pglite-socket.** It multiplexes every client connection
onto ONE PGlite session, so concurrent parameterised queries from different connections
clobber each other's _unnamed_ prepared statement — sometimes an error ("unnamed prepared
statement does not exist"), sometimes a silently **wrong result** (TASK-012: pending showed 0).
Real Postgres/Supavisor give each connection its own session, so this is a harness limit, not
an app bug — but any parallel-query path must be verified with a single connection there.
Full-app recipe (TASK-012): serve a seeded PGlite on a port, then
`DATABASE_URL=postgres://postgres:postgres@127.0.0.1:<port>/postgres DATABASE_POOL_MAX=1 npx next start`,
and prove reads hit Postgres by writing to the DB directly and watching the page change.

### Headless browser tests with Radix overlays

Headless Chrome never fires the exit-animation end for Radix Select/Dialog, so `<body>` keeps
`pointer-events: none` and every later click silently misses. Emulate
`prefers-reduced-motion: reduce` (puppeteer `emulateMediaFeatures`) — real browsers are unaffected.
Also assert on the _toast_ element, not page text: pre-submit alerts can contain the same words.

### Security-scoped queries: assert the scope structurally (from TASK-013)

Functional tests ("Ben sees only his team") pass just as well if the filter is applied in app
code after an unscoped query — which ARCH/BR-02 forbids. Add a **structural** test: wrap the
`SqlClient` in a recorder, call the repository method, and assert that _every_ statement
contains the scope predicate (e.g. `where u.manager_id = $1`) and receives the session id as
its parameter. Prove it with a probe that removes the SQL filter **and** re-adds it in
TypeScript: all functional tests stay green and only the structural test must go red
(TASK-013: 1 failed / 60 passed — exactly the intended signal).

### Defense in depth for "exactly once" writes (from TASK-014)

For money-like effects (balance decrements), stack independent guards and test each alone:

1. a guarded, scoped statement (`update … where status = 'pending' and u.manager_id = $n`) → 409;
2. a **DB backstop** that makes the duplicate impossible (partial unique index on the audit
   row written in the same transaction as the effect);
3. relative updates (`balance = balance - $days`), never read-modify-write.
   Prove the backstop _independently_: remove guard (1) and assert the data is still correct
   (one decrement, one decision row) — a red test alone doesn't show the data survived.

### When a real-driver run hangs, suspect the harness before the app — then fix the app anyway

TASK-014's browser run hung because an enum-typed bind parameter triggered a postgres.js
type lookup that pglite-socket can't multiplex. Isolate with tiny single-statement probes
(one variant per fresh server), find the minimal trigger, then prefer an app-side fix that is
correct everywhere (text-typed params) plus a static convention test — not a harness tweak.

### "Authorize before any database access" — prove it with a repository spy (from TASK-015)

A 403 response doesn't show the data wasn't read first. For role-gated endpoints, mock the
repository module with a `vi.fn` wrapper and assert it was **never called** for 401/403 (and
for 400s rejected by validation). Probe: move the role check below the read — the response
tests may still pass on some paths, the "never called" assertions must fail.
