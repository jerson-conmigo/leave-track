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

### Browser e2e recipe (from TASK-016)

- **Isolate shared state:** the e2e server's in-memory store is shared, so an auto fixture resets
  it before every test via a gated test-only route (404 unless `E2E_RESET_TOKEN` + header match,
  never with `DATABASE_URL`). Reset arrays **in place** — holders keep references from import.
  Prove isolation with `--repeat-each=2` over the whole suite.
- **Wait for state, never for time:** assert the highlighted option before pressing Enter; wait
  for a listbox to be hidden and focus to return before the next Tab. Every race we hit was a
  test pressing a key before the previous one was processed.
- **Don't assume one Tab per field:** Chromium makes each date segment a Tab stop — use a bounded
  `tabUntil(target, max)` (a trap still fails).
- **Externally-opened dialogs need explicit focus return:** Radix returns focus to its
  `DialogTrigger`; without one, focus drops to `<body>`. Pass the opener and handle
  `onCloseAutoFocus` (fallback to `#main` if the opener left the DOM).
- **Label in Name (WCAG 2.5.3):** don't put an `aria-label` on a control whose visible text
  differs (initials, abbreviations) — use name-from-content with `sr-only` text instead.
- **Flaky = real until proven otherwise:** the 1-in-12 overflow at 320px/200% text was a real
  header that only tipped over once the web font loaded; fixed with `min-w-0`/`truncate`.
- Locally use the installed Chrome (`channel: "chrome"`); CI uses cached Playwright Chromium.
- **A focus check must detect a visible CHANGE, not mere presence** (TASK-016 VALIDATE caught
  two false greens): a resting `shadow-xs` looked like a focus ring, and later a zero-width
  ring-colour change looked like one. Compare focused vs. blurred, counting only drawn shadow
  layers (non-transparent, non-zero size), outlines, or a border-colour change; finish CSS
  transitions (`el.getAnimations().forEach(a => a.finish())`) before each read. Probe with
  "remove ring AND border change" — removing only the ring is not a no-indicator state.
- **Probe the thing, not a neighbour:** deleting `event.preventDefault()` left our own
  `target.focus()` in place, so the "focus return removed" probe was invalid. A green probe means
  "check the probe" before "the test is weak".

### Precision tests need inputs that really drift (from TASK-017)

Two "float addition" probes stayed green because the chosen values happened to be exact in
binary (11.25 + 1.33, 1.33 × 3, and even 0.1 + 0.2 × 3 = 0.7 by error cancellation). Before
writing a precision test, **verify in node that the float result differs** — e.g.
`0.1 + 0.2 = 0.30000000000000004` (one month) and `0.1 + 0.2×4 = 0.8999999999999999` — and
assert the test input itself drifts (`expect(0.1 + 0.2).not.toBe(0.3)`) so it can't silently
become a non-test. Same lesson as focus checks: a green probe means "check the inputs/probe"
before "the code is right".

### Security properties that behaviour can't show need structural tests

Constant-time comparison is invisible to functional tests (both `===` and `timingSafeEqual`
return the same answers). Enforce it structurally: `tests/security-conventions.test.ts` finds
every file reading a request-authenticating secret, asserts `timingSafeEqual` is used and no
`===`/`!==` compares a secret — and asserts the expected file list so it can't pass vacuously.

### Cross-cutting invariants: matrix + writer registry (from TASK-018)

For a rule that every writer must obey ("only the request's own leave type changes"):

1. **Invariant matrix** — every writer × every case × both stores
   (`tests/leave-types/independence.test.ts`), including a _new_ case invented in the
   test (an extra untracked type) to prove the logic is generic, not name-based.
2. **Writer registry** — a structural test lists every file that writes the table and
   asserts the exact set (`balance-writers.test.ts`). The detector normalises source
   (comments, case, whitespace) and catches SQL variants (quoted/schema-qualified, CTE,
   MERGE, COPY), query builders, and mock-store mutations including computed keys.
   **Test the detector itself** with a positive/negative corpus — ours initially missed
   `(mockDb as T)[key] = …`, caught only by the corpus.
3. **DB guard** last, with a data pre-check and a lock where it reads another table.

**Probe every layer, not just the outermost one (TASK-018).** With a DB guard in place, a
break in the app-level filter is invisible on Postgres (the trigger catches it). Probe 10
(memory accrual crediting untracked types) stayed green until a memory-only test injected
the "impossible" row. Every layer of defence-in-depth needs its own test, or it is
untested code. Likewise, a mapping applied at two transports (routes AND server actions)
needs a test at each.

### Fail-closed configuration: test build time and runtime separately (from TASK-019)

- `lib/env.ts` validates at **module load**, which Next.js runs during `next build`
  ("collecting configuration"), not only at server start. A strict rule keyed on `NODE_ENV`
  would break every build, CI run and local e2e (all `NODE_ENV=production`); key it on the
  deployment stage (`APP_ENV` / `VERCEL_ENV`) instead.
- A throw in `instrumentation.ts` `register()` does **not** stop `next start`: Next.js keeps
  the process alive and answers every route (static ones included) with 500. Exit explicitly
  (`process.exit(1)`) from a Node-only module (`lib/env-startup.ts`), imported only when
  `NEXT_RUNTIME === "nodejs"`, or the Edge bundle warns about Node APIs.
- Prove it with real processes: build and start under each configuration (CI, deployed-valid,
  deployed-missing, deployed-with-test-token), and assert exit codes, `/api/health` and that
  no secret value is ever printed.

### Overlapping guards: name them and test each one directly (from TASK-020)

A layered check (control characters → root-relative → same origin → reserved paths) passed
a 46-case corpus, yet removing the backslash rule, the `//` rule or the whole origin check
left every test green — each was covered by another layer, and the origin check was
unreachable by any string the earlier layers let through. Fix: express the layers as an
exported, ordered list of named guards (`REDIRECT_GUARDS`), unit-test each guard **in
isolation** (the only way to reach the later ones), and pin the list structurally. Testing
the origin guard alone then exposed a real subtlety: `new URL("http:evil.com", "http://base")`
is a _relative_ path, so same-origin checks must try both `http` and `https` bases.
Prove the bug end-to-end before fixing it, with off-site navigation blocked
(`context.route(url => url.host !== app, abort)`) before the form is submitted.

### Changing tooling versions: diff the resolved config, measure before thresholding (from TASK-021)

- When the lint engine changes (ESLint 10 → 9 here), "lint still passes" is not enough: save
  `eslint --print-config <file>` for one file of each kind before and after and diff the rule
  sets (names, severities, options). Here the only difference was cosmetic (ESLint 10 prints
  default options for the disabled core `no-unused-vars`).
- Coverage thresholds come from a measured baseline: run coverage twice, confirm identical
  covered/total counts, then set thresholds (baseline rounded down − 2). Prove they bite with
  a threshold above the baseline and a narrowed `include`.
- CI helper scripts that guard a gate get their own tests, including "fails loudly"
  cases — a report step that silently passes on a missing file hides a broken gate.

### Never split a CSV on line breaks (from TASK-022)

A quoted CSV field may contain line breaks, so `text.split("\n")` is not a list of rows.
The old `set-task-status` did exactly that: a multi-line field crashed it, mixed line endings
hid rows, and — worst — a line _inside_ a quoted field that looked like a row
(`T-9,fake,Open,…`) was "updated", silently corrupting another row's text while reporting
success. Scan the whole file as RFC 4180 records with exact field ranges, keep each record's
own line ending, refuse malformed input (unterminated quote, wrong field count) before
writing, and replace through a temp file + rename. Prove "only one field changed" with golden
tests on copies of the real files.
Guard repository-hygiene rules with a test that asks git itself
(`git check-ignore --no-index`, `git ls-files --cached --ignored --exclude-standard`), so a
deleted `.gitignore` line or a re-tracked cache file fails CI instead of resurfacing as noise.
Check that a mutation probe really changes behaviour: a no-op mutation (`if (false) i++;`)
stays green and proves nothing.

### Signed sessions: verify before parsing, authorize from the database (from TASK-023)

- Token = `v1.<payload>.<HMAC>` with a fixed algorithm; check the signature (constant time,
  against the fixed digest size) **before** `JSON.parse`, then validate the claims. Test
  invalid claims with a _valid_ signature (re-sign test payloads with the real key) —
  otherwise a "malformed" test only proves the signature check.
- Never authorize from claims: `getSession` re-reads the user and drops the session if the
  role changed. The role in the token only lets the proxy route without a DB call.
- Keep a pure token module (no `server-only`, relative imports) so the proxy, the server and
  the Playwright helper share one implementation; e2e signs cookies with a per-run secret.
- Pin the boundary structurally (which files touch the cookie / sign tokens) so a shortcut
  around the auth port fails CI.
- A constant-time convention test may flag a harmless length comparison; prefer changing
  the code to compare against a constant (digest size) over weakening the test.

### Real auth provider: prove identity with the provider, name the user yourself (from TASK-024)

- Two layers: the provider session proves _who_; the app's own signed token names _which
  user_, minted only after matching `users.auth_user_id` (set by an admin invite). Never link
  by email at sign-in.
- Check liveness with the provider's **server** (`getUser`), not a locally verified JWT, or
  sign-out isn't a revocation. Refresh in the proxy; fail closed on every provider error.
- A dev-only path (the mock picker) must refuse to run when the real provider is configured.
  Otherwise it can be used to skip real sign-in.
- Pages whose behaviour depends on runtime configuration (`AUTH_PROVIDER`) must be dynamic.
  `next build` prerendered them with the build-time value and baked in a 404.
- Emailed-link routes get a fixed destination. Don't take a `next` value from the email link.
- Probe overlapping guards one at a time: removing the liveness check went unnoticed because the
  link check also returned null. Fix: assert the guard returns _before_ the database lookup.
- Put the real-flow e2e against local Supabase in its own config, so the default CI e2e stays
  service-free.

### PGlite: close per test, not per file (from B30)

- One migrated and seeded PGlite costs ~1.2 GiB. Keeping a fresh one per test open until
  `afterAll` stacks them up: about 2.2–2.5 GiB for the heaviest files run alone, and approximately
  2.6–2.9 GiB for the whole suite in a single Vitest worker with coverage (the default worker count
  on 2-vCPU CI runners). Closing per test brought that run to about 1.7 GiB (37–44 % lower; measured
  in B30). The gain differs by file: users-auth-link (four databases, one in each of four of its five tests) showed
  no measurable improvement.
- Measure memory as before/after pairs under identical conditions, and more than once: peak
  memory with many open databases varies by run. Single samples overstated the B30 "before".
- Use `const track = closeAfterEachTest()` and `track(db)` for every per-test database.
  afterEach runs even when the test fails. `closeAll` uses `allSettled` and then reports every
  failure.
- Setup helpers close a half-built database before rethrowing.
- `tests/db/pglite-lifecycle.test.ts` pins every database-creating file into a reviewed
  category. Probe "helper set up but never tracked" too: a guard that only checks for the
  helper call misses it.
- "The operation was canceled." in Actions is the runner cancelling the job, not a test failure.
  Read the annotation (timeout vs. concurrency) before changing timeouts or concurrency.

### Local dev tooling: local-only by construction, hosted only by explicit flag (from TASK-054)

- Dev scripts take their credentials from `supabase status` of the running local stack, never
  from `.env.local`. A hosted value pasted into `.env.local` then can't reach a dev script at all.
- Any script that can reach the hosted project needs a flag (`--remote`, `--hosted`) and prints
  the target host first. Supabase CLI 3.x defaults `db push` / `db reset` / `migration up` to
  the LOCAL database, so pass `--remote` explicitly and never rely on the default.
- A script that writes the user's `.env.local`:
  - preserves unrelated lines
  - refuses (writing nothing) when hosted values are present, unless an explicit override
    backs up first
  - keeps existing secrets, writes atomically with mode 0600, prints names only
  - is idempotent
- Node 24 treats `--env-file` as its OWN option even after the script name
  (`node x.mjs --env-file f` exits 9). Use another name for a script flag
  (`--target`); use `node --env-file-if-exists=.env.local` to load one.
- Test CLIs with a stub binary through an env override (`SUPABASE_BIN`). The stub records its
  arguments, so tests prove a refused command never reached the real tool.
- When `.env.local` can switch modes (mock ↔ Supabase), pin the mode in each test server's
  own environment. Process values beat `.env.local` in Next.

### Measure layout only after it settles (from TASK-055)

- A check that injects a style (for example 200% text) and measures straight away can pass
  falsely. Here the reduced-motion rule gave every element a one-frame transition, so the first
  frame still had the old geometry. A fast laptop measured in that frame and passed; slower CI
  measured later and failed.
- Wait until the page's size is unchanged for several consecutive frames. A fixed number of
  frames isn't enough (2 frames still passed falsely at 320 px). Then assert once. Never retry
  a layout assertion until it passes: that would accept the first-frame false pass.
- Prove the fix with the order "stricter test first (fails like CI), then the fix (passes)",
  and repeat the run to show it's deterministic.
- `FormControl` (Radix Slot) overrides a child's `data-slot`, so a form's Select trigger is
  `data-slot="form-control"`. Style it through the component's classes, not that attribute.
- `whitespace-nowrap` plus a fixed `h-*` on a grid item with `min-width: auto` can't shrink at
  large text. `whitespace-normal` plus `min-h-*` lets it wrap and grow: wrap, don't truncate
  (WCAG 1.4.4). Probes showed `min-w-0` and the value's `line-clamp` change made no difference
  (`display:flex` disables `line-clamp`). Swapping `h-*` for `min-h-*` can add height (padding
  - line height + border), so check the normal-size height too (here `py-2` → `py-1.5` kept
    36 px).

### Time-shift probe: find tests that depend on today's date (from TASK-027)

A rule that compares dates with "today" (here: no past start dates, in the service AND a DB
trigger) silently turns every test with a fixed future date into a time bomb: green today, red
the day that date passes. The normal suite can't show it. Probe it instead: temporarily move
**every** clock forward together (the DB expression `now()`, the app's `todayUtc()`, and the test
helper's notion of today), run the whole suite, restore and verify by hash. In TASK-027 the
first run found 56 failing tests in 12 files; shifting only the app clock gave a false picture
(the test helper still produced "future" dates relative to the real day). Fix the failures by
writing request dates relative to today (`future("2027-03-01")` keeps a readable reference date
and its spacing, anchored at today + 60 days), and keep historical fixture rows on an explicit,
transaction-scoped escape hatch (`asHistorical`) rather than real dates. Re-run the probe until
the shifted suite is fully green. Also: PL/pgSQL variables can collide with SQL operator keywords
— a variable named `overlaps` made `overlaps > 0` a syntax error.

### Theming with tokens: watch the cascade, scope by role on :root (from TASK-047)

- Token blocks are unlayered on purpose: a `.dark` inside `@layer base` silently loses to an
  unlayered `:root` on `<html>`, and a text-parsing test can't see the cascade — prove the theme in
  a browser with JavaScript disabled (only the server-rendered class can then apply it).
- "System" needs no script: no class + `@media (prefers-color-scheme: dark) { :root:not(.light) }`,
  plus a block-form `dark` custom variant so `dark:` utilities fire there too. Keep the two dark
  copies identical with a test.
- App-wide accents: remap only the INTERACTIVE tokens via `:root:has([data-role-accent=…])` (on
  `:root`, so Radix portals inherit), placed after the dark blocks (equal specificity → order).
  Pin the remapped token list, AA for every pairing per theme, and a hue distance from semantic
  colours; give the brand its own token so it doesn't follow the role.
