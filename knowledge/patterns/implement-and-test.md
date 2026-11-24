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

### Headless browser tests with Radix overlays

Headless Chrome never fires the exit-animation end for Radix Select/Dialog, so `<body>` keeps
`pointer-events: none` and every later click silently misses. Emulate
`prefers-reduced-motion: reduce` (puppeteer `emulateMediaFeatures`) — real browsers are unaffected.
Also assert on the _toast_ element, not page text: pre-submit alerts can contain the same words.
