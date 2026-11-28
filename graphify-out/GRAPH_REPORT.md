# Graph Report - leave-track  (2026-11-28)

## Corpus Check
- 333 files · ~161,240 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 6, .csv 2, .example 1)

## Summary
- 1972 nodes · 5367 edges · 101 communities (86 shown, 15 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 128 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4b599a41`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Business Requirements Document — LeaveTrack v1.0
- theme.ts
- ADR-LeaveTrack-E001 — Auth & Session Strategy
- Product Requirements Document — LeaveTrack v1.0
- package.json
- Architecture Document — LeaveTrack v1.0
- compilerOptions
- devDependencies
- dependencies
- scripts
- components.json
- approval-routing.test.ts
- Step 3: Review
- /epav
- Steps
- Review Checklist
- Review Checklist
- Review Checklist
- Review Checklist
- e2e/helpers.ts
- Review Checklist
- Review Checklist
- Review Checklist
- Review Checklist
- Steps
- account-actions.test.ts
- Steps
- Steps
- notifications.test.ts
- .prettierrc.json
- pr-verifier.md
- Steps
- Steps
- nexus
- extends
- postcss.config.mjs
- env.ts
- password-login-form.tsx
- roles.ts
- leave-requests/memory-store.ts
- request-form.tsx
- /scaffold
- api/errors.ts
- login/page.tsx
- cn
- local-only.mjs
- Prove the test can fail (from TASK-010)
- cancel.test.ts
- Button
- balance-ledger.test.ts
- Database
- implement-api-route.md
- implement-ui-component.md
- write-migration.md
- accrual/route.ts
- LeaveTrack UI — Design System
- read.ts
- /dev-tasks-planner
- approval-queue.tsx
- AppError
- Steps
- with-error-handler.ts
- openapi.test.ts
- store.test.ts
- idle-session-guard.tsx
- vercel.json
- Revision v1.1 — EPIC 2 (2026-11-26)
- tokens.test.ts
- provider.ts
- next
- errors.test.ts
- data/types.ts
- coverage-summary.test.ts
- decide.test.ts
- Steps
- set-task-status.mjs
- ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR
- ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions
- repository.ts
- db/helpers.ts
- login/actions.ts
- local-scripts.test.ts
- leave-requests/index.ts
- getAuthProvider
- balance-writers.test.ts
- local-env.mjs
- decision-dialog.tsx
- vitest
- instrumentation.ts
- app-shell.tsx
- session-renewal.test.ts
- next.config.ts
- Coding Standards — LeaveTrack
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `cn()` - 112 edges
2. `vitest` - 77 edges
3. `next` - 60 edges
4. `Button()` - 41 edges
5. `AppError` - 36 edges
6. `lucide-react` - 35 edges
7. `USER_IDS` - 30 edges
8. `react` - 30 edges
9. `createTestDb()` - 30 edges
10. `scripts` - 28 edges

## Surprising Connections (you probably didn't know these)
- `Measure layout only after it settles (from TASK-055)` --references--> `FormControl()`  [INFERRED]
  knowledge/patterns/implement-and-test.md → components/ui/form.tsx
- `Layout & breakpoints` --references--> `Sheet()`  [INFERRED]
  knowledge/design-system.md → components/ui/sheet.tsx
- `API route handlers` --references--> `withErrorHandler()`  [INFERRED]
  knowledge/rules/coding-standards.md → lib/api/with-error-handler.ts
- `Security changes` --references--> `safeRedirectPath()`  [INFERRED]
  docs/arch-docs/ARCH-LeaveTrack-v1.0.md → lib/auth/roles.ts
- `Day 1 hand-off notes` --references--> `LeaveRepository`  [INFERRED]
  README.md → lib/data/repositories.ts

## Import Cycles
- None detected.

## Communities (101 total, 15 thin omitted)

### Community 0 - "Business Requirements Document — LeaveTrack v1.0"
Cohesion: 0.09
Nodes (21): Additional Functional Requirements, Additional Risks, Additional Stakeholder Concerns, Additional Success Criteria, Assumptions, Business Context, Business Requirements Document — LeaveTrack v1.0, Constraints (+13 more)

### Community 1 - "theme.ts"
Cohesion: 0.17
Nodes (13): metadata, RootLayout(), viewport, Toaster(), isProduction, htmlClassFor(), parseTheme(), THEME_COOKIE (+5 more)

### Community 2 - "ADR-LeaveTrack-E001 — Auth & Session Strategy"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E001 — Auth & Session Strategy, Consequences, Context, Decision, Options Considered

### Community 3 - "Product Requirements Document — LeaveTrack v1.0"
Cohesion: 0.17
Nodes (11): Business Rules (EPIC 2), Non-Functional Requirements, Non-Functional Requirements (additions), Out of Scope, Out of Scope (additions), Product Requirements Document — LeaveTrack v1.0, Revision v1.1 — EPIC 2 (2026-11-26), User Roles (+3 more)

### Community 4 - "package.json"
Cohesion: 0.06
Nodes (32): description, engines, node, @commitlint/config-conventional, name, private, version, @axe-core/playwright (+24 more)

### Community 5 - "Architecture Document — LeaveTrack v1.0"
Cohesion: 0.10
Nodes (19): Adr-Leavetrack-E001 — Auth & Session Strategy, ADR-LeaveTrack-E001 — Auth & Session Strategy, Api Design (Selected), API Design (selected), Architecture Document — LeaveTrack v1.0, Architecture Summary, Consequences, Context (+11 more)

### Community 6 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 7 - "devDependencies"
Cohesion: 0.09
Nodes (23): devDependencies, @axe-core/playwright, @commitlint/cli, @commitlint/config-conventional, @electric-sql/pglite, eslint, eslint-config-next, husky (+15 more)

### Community 8 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, class-variance-authority, clsx, geist, @hookform/resolvers, lucide-react, next, pino (+13 more)

### Community 9 - "scripts"
Cohesion: 0.07
Nodes (28): scripts, build, db:check:local, db:migrate:local, db:push:hosted, db:reset, db:reset:local, db:seed:auth (+20 more)

### Community 10 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 11 - "approval-routing.test.ts"
Cohesion: 0.06
Nodes (32): LEAVE_TYPE_IDS, USER_IDS, mockRepository, mockDb, memorySubmitStore, getEmployeeAuditHistory, getSession, HR (+24 more)

### Community 12 - "Step 3: Review"
Cohesion: 0.18
Nodes (10): Code Quality, Correctness, Maintainability, Performance, Security, Step 1: Determine scope, Step 2: Discover Repo Context (MANDATORY — do this before reviewing), Step 3: Review (+2 more)

### Community 13 - "/epav"
Cohesion: 0.18
Nodes (10): Abort at any step, Cycle, /epav, Scope discipline, Step 1 — EVALUATE, Step 2 — PLAN, Step 3 — APPLY (only after approval), Step 4 — VALIDATE (+2 more)

### Community 14 - "Steps"
Cohesion: 0.18
Nodes (10): 1 — Knowledge graph blast radius check, 2 — Check against acceptance criteria, 3 — Classify all issues found, 4 — Fix all BLOCKERs and FIX NOWs before continuing, 5 — If a pattern was discovered, contribute it back, 6 — Mark the dev task Done, 7 — When clean, Prerequisite (+2 more)

### Community 15 - "Review Checklist"
Cohesion: 0.22
Nodes (8): Migrations, Performance, Queries, Required Output Format (follow this every run), Review Checklist, Schema Design, Step 1: Discover Repo Database Context (MANDATORY — do this before anything else), Transactions

### Community 16 - "Review Checklist"
Cohesion: 0.22
Nodes (8): CI/CD Pipeline, Container & Infrastructure, Deployment Safety, Environment Parity, Required Output Format (follow this every run), Review Checklist, Secrets & Configuration, Step 1: Discover Repo Deployment Context (MANDATORY — do this before anything else)

### Community 17 - "Review Checklist"
Cohesion: 0.22
Nodes (8): Alerting, Error Tracking, Logging, Metrics, Required Output Format (follow this every run), Review Checklist, Step 1: Discover Repo Observability Context (MANDATORY — do this before anything else), Tracing

### Community 18 - "Review Checklist"
Cohesion: 0.22
Nodes (8): Application Code, Caching, Database & I/O, Frontend / API (if applicable), Infrastructure, Required Output Format (follow this every run), Review Checklist, Step 1: Discover Repo Performance Context (MANDATORY — do this before anything else)

### Community 19 - "e2e/helpers.ts"
Cohesion: 0.06
Nodes (52): OPERATIONS, create(), daysFromToday(), enlargeText(), expectNoHorizontalOverflow(), expectNotUnderHeader(), expectSelectsNotClipped(), expectTapTargets() (+44 more)

### Community 20 - "Review Checklist"
Cohesion: 0.22
Nodes (8): Migrations, Performance, Queries, Required Output Format (follow this every run), Review Checklist, Schema Design, Step 1: Discover Repo Database Context (MANDATORY — do this before anything else), Transactions

### Community 21 - "Review Checklist"
Cohesion: 0.22
Nodes (8): CI/CD Pipeline, Container & Infrastructure, Deployment Safety, Environment Parity, Required Output Format (follow this every run), Review Checklist, Secrets & Configuration, Step 1: Discover Repo Deployment Context (MANDATORY — do this before anything else)

### Community 22 - "Review Checklist"
Cohesion: 0.22
Nodes (8): Alerting, Error Tracking, Logging, Metrics, Required Output Format (follow this every run), Review Checklist, Step 1: Discover Repo Observability Context (MANDATORY — do this before anything else), Tracing

### Community 23 - "Review Checklist"
Cohesion: 0.22
Nodes (8): API & Network, Application Code, Caching, Database & I/O, Infrastructure, Required Output Format (follow this every run), Review Checklist, Step 1: Discover Repo Performance Context (MANDATORY — do this before anything else)

### Community 24 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Implement exactly what the plan says, 2 — The knowledge graph stays current automatically, 3 — Stay in scope, 4 — When done, /apply, Prerequisite, Steps

### Community 25 - "account-actions.test.ts"
Cohesion: 0.17
Nodes (9): SESSION_COOKIE, mockAuthProvider, NOT_LINKED_MESSAGE, state, fakeJar(), FakeProvider, fakeSupabaseProvider(), state (+1 more)

### Community 26 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Orient with your knowledge graph (if one exists), 2 — Load context in priority order, 3 — Output this summary, nothing else, 4 — Stop, Arguments, /evaluate, Steps

### Community 27 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Blast radius check, 2 — Write the implementation blueprint, 3 — State constraints, 4 — Stop and wait, /plan, Prerequisite, Steps

### Community 28 - "notifications.test.ts"
Cohesion: 0.05
Nodes (44): resetMockDb(), DecideLeaveRequestResult, DecideWarning, DecideDeps, decideLeaveRequest(), RequestIdSchema, memoryDecideStore, LeaveRequestDecidedNotice (+36 more)

### Community 29 - ".prettierrc.json"
Cohesion: 0.25
Nodes (7): plugins, printWidth, semi, singleQuote, tailwindFunctions, tailwindStylesheet, trailingComma

### Community 30 - "pr-verifier.md"
Cohesion: 0.29
Nodes (6): Ground rule: verify, don't trust, Step 1: Understand what this commit is supposed to do — and against what, Step 2: Read every changed file's actual diff, Step 3: Build and test for real, in an isolated worktree, Step 4: Adversarial pass on the highest-risk claims, Step 5: Report

### Community 31 - "Steps"
Cohesion: 0.33
Nodes (5): 1 — Scope the review, 2 — Delegate to the code-reviewer agent, 3 — Output, Steps, When to use

### Community 32 - "Steps"
Cohesion: 0.33
Nodes (5): 1 — Resolve the target, 2 — Delegate to the pr-verifier agent, 3 — Output, Steps, When to use

### Community 33 - "nexus"
Cohesion: 0.50
Nodes (3): uvx, nexus, nexus-mcp

### Community 36 - "env.ts"
Cohesion: 0.08
Nodes (25): notFound(), POST(), tokenMatches(), ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering, Consequences, Context, Decision, Options considered (+17 more)

### Community 37 - "password-login-form.tsx"
Cohesion: 0.14
Nodes (37): AuditPage(), metadata, one(), forgotPasswordAction(), loginAction(), LoginState, ALL_EMPLOYEES, AuditFilters() (+29 more)

### Community 38 - "roles.ts"
Cohesion: 0.10
Nodes (30): Security rules, Coverage baseline (TASK-021, 2026-11-26), EPIC 2 planning (2026-11-26), TypeScript, proxyCookieIO(), canAccess(), isPublicPath(), isRole() (+22 more)

### Community 39 - "leave-requests/memory-store.ts"
Cohesion: 0.12
Nodes (25): addDays(), fromHundredths(), sumDays(), toHundredths(), countDays(), Approver, approverLabel(), canDecide() (+17 more)

### Community 40 - "request-form.tsx"
Cohesion: 0.17
Nodes (18): EMPTY, localToday(), RequestForm(), RequestFormProps, shiftLocalDate(), FormControl(), FormDescription(), FormField() (+10 more)

### Community 41 - "/scaffold"
Cohesion: 0.25
Nodes (7): APPLY — Generate the Complete Boilerplate, Ecosystem reference, EVALUATE — Understand the Architecture and Design, PLAN — Boilerplate + UI Shell + Project Rules, Prerequisites, /scaffold, VALIDATE — Validate Infrastructure + Design Fidelity

### Community 42 - "api/errors.ts"
Cohesion: 0.20
Nodes (10): ERROR_STATUS, ErrorCode, ApiFailure, ApiResponse, ApiSuccess, BY_CONSTRAINT, BY_SQLSTATE, DbError (+2 more)

### Community 43 - "login/page.tsx"
Cohesion: 0.18
Nodes (16): HIGHLIGHTS, LoginPage(), metadata, NOTICES, signedOutNotice(), SignedOutBroadcast(), DEV_LOGIN_HOSTS, DevAccount (+8 more)

### Community 44 - "cn"
Cohesion: 0.14
Nodes (26): setThemeAction(), THEME_LABEL, UserMenu(), UserMenuProps, Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup() (+18 more)

### Community 45 - "local-only.mjs"
Cohesion: 0.17
Nodes (20): listAllAuthUsers(), LOCAL_DEV_PASSWORD, main(), planSeed(), pushArgs(), assertLocal(), exitWith(), LOCAL_HOSTS (+12 more)

### Community 46 - "Prove the test can fail (from TASK-010)"
Cohesion: 0.08
Nodes (24): DialogTrigger(), "Authorize before any database access" — prove it with a repository spy (from TASK-015), Browser e2e recipe (from TASK-016), Changing tooling versions: diff the resolved config, measure before thresholding (from TASK-021), Cross-cutting invariants: matrix + writer registry (from TASK-018), Defense in depth for "exactly once" writes (from TASK-014), Fail-closed configuration: test build time and runtime separately (from TASK-019), Headless browser tests with Radix overlays (+16 more)

### Community 48 - "cancel.test.ts"
Cohesion: 0.10
Nodes (35): Backend standards, ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port, Consequences, Context, Decision, Options considered, createPostgresRepository(), SqlClient (+27 more)

### Community 50 - "Button"
Cohesion: 0.19
Nodes (16): AppError(), ForbiddenPage(), metadata, NotFound(), NotificationBell(), StatusScreen(), StatusScreenProps, NotificationList() (+8 more)

### Community 52 - "balance-ledger.test.ts"
Cohesion: 0.09
Nodes (32): getAccrualDeps(), memoryAccrualStore, currentPeriod(), monthsToAccrue(), nextPeriod(), createPostgresAccrualStore(), AccrualDeps, MAX_CATCH_UP_MONTHS (+24 more)

### Community 53 - "Database"
Cohesion: 0.08
Nodes (23): Accrual job (TASK-017), API documentation (TASK-057), Approvals (TASK-026), Balance history (TASK-029), Database, Day 1 hand-off notes, Environment, HR audit (TASK-015) (+15 more)

### Community 57 - "accrual/route.ts"
Cohesion: 0.25
Nodes (6): authorized(), GET, handler(), POST, OK, runMonthlyAccrual

### Community 58 - "LeaveTrack UI — Design System"
Cohesion: 0.12
Nodes (15): Backlog, Color tokens, Components, Core, Dark theme (TASK-047), Iconography, Layout & breakpoints, Leave types (+7 more)

### Community 59 - "read.ts"
Cohesion: 0.19
Nodes (14): POST, markNotificationsReadAction(), selectRepository(), Driver, getSql(), globalForDb, wrap(), getMarkReadDeps() (+6 more)

### Community 60 - "/dev-tasks-planner"
Cohesion: 0.12
Nodes (17): APPLY — Generate the CSV(s) programmatically, Arguments, /dev-tasks-planner, EVALUATE — Read the source material and the real repo state, Every `Blocked` row cites the exact reason and states the fallback, Every `Done` row states its own Day-1 forward path, Every task cites the project's own established patterns by name, not generic prose, File structure and exact schema (+9 more)

### Community 61 - "approval-queue.tsx"
Cohesion: 0.06
Nodes (80): AGENTS.md — LeaveTrack, Frontend standards, Git conventions, Project, Quality gates (must pass before merge), Stack, Task tracking, Where things go (+72 more)

### Community 62 - "AppError"
Cohesion: 0.25
Nodes (15): GET, POST, POST, GET, POST, dynamic, POST, cancelLeaveRequestAction() (+7 more)

### Community 63 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Inspect changes, 2 — Stage deliberately, 3 — Write the commit message, 4 — Confirm, /commit, Steps, When to use

### Community 64 - "with-error-handler.ts"
Cohesion: 0.14
Nodes (15): ASSETS, dynamic, GET, dynamic, GET, dynamic, GET, dynamic (+7 more)

### Community 65 - "openapi.test.ts"
Cohesion: 0.05
Nodes (64): buildOpenApiDocument(), ComponentName, COMPONENTS, COOKIE, errors(), input(), JsonSchema, parameters() (+56 more)

### Community 66 - "store.test.ts"
Cohesion: 0.22
Nodes (11): getRateLimitStore(), createMemoryRateLimitStore(), globalForRateLimit, memoryRateLimitStore, createPostgresRateLimitStore(), BUCKET_SECONDS, bucketStart(), RateLimitStore (+3 more)

### Community 67 - "idle-session-guard.tsx"
Cohesion: 0.18
Nodes (27): CancelRequestButton(), ACTIVITY_EVENTS, IdleSessionGuard(), IdleSessionGuardProps, AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent() (+19 more)

### Community 69 - "Revision v1.1 — EPIC 2 (2026-11-26)"
Cohesion: 0.12
Nodes (16): API additions (planned), API Design (selected), Architecture Document — LeaveTrack v1.0, Considered and not adopted, Data Model, Data model additions (planned), Deployment changes, Deployment Topology (+8 more)

### Community 70 - "tokens.test.ts"
Cohesion: 0.25
Nodes (7): contrast(), css, dark, light, luminance(), PAIRS, systemDark

### Community 71 - "provider.ts"
Cohesion: 0.09
Nodes (18): CookieIO, CookieJar, CookieToSet, LEGACY_SESSION_COOKIES, SESSION_MAX_AGE_SECONDS, AuthProvider, EmailLinkType, NO_PROVIDER_SESSION (+10 more)

### Community 72 - "next"
Cohesion: 0.25
Nodes (8): NO_STORE, metadata, AuthenticatedLayout(), metadata, AppShell(), repository, next, server-only

### Community 74 - "errors.test.ts"
Cohesion: 0.22
Nodes (5): getSession, input, service, CASES, code()

### Community 75 - "data/types.ts"
Cohesion: 0.04
Nodes (56): Backlog (deferred, owner = Day 1 team), Fixed in VALIDATE, Retro — Day 0 scaffold (2026-11-24), What went well, availableForRequest(), buildBalanceSummaries(), PendingRange, accrualRuns (+48 more)

### Community 77 - "decide.test.ts"
Cohesion: 0.11
Nodes (17): ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox, Consequences, Context, Decision, Implementation note (TASK-030), atomically(), Notifier, ANA (+9 more)

### Community 79 - "Steps"
Cohesion: 0.22
Nodes (8): 0 — Run code review first, 1 — Gather context, 2 — Draft the PR, 3 — Push and open the PR, 4 — Output, /create-pr, Steps, When to use

### Community 80 - "set-task-status.mjs"
Cohesion: 0.20
Nodes (6): RFC-4180, matches, previous, STATUSES, [taskId, status, csvArg], temp

### Community 81 - "ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR, Consequences, Context, Decision, Implementation note (TASK-026)

### Community 82 - "ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions, Consequences, Context, Decision, Implementation note (TASK-029)

### Community 83 - "repository.ts"
Cohesion: 0.14
Nodes (20): Database, daysBefore(), todayUtc(), utcDay(), utcMonthBounds(), withinUtcDays(), byId(), toView() (+12 more)

### Community 84 - "db/helpers.ts"
Cohesion: 0.12
Nodes (22): PGlite: close per test, not per file (from B30), Time-shift probe: find tests that depend on today's date (from TASK-027), B30 — PGlite lifecycle and CI memory (2026-11-26), overlaps(), insertPending(), MIA_REPORTS, seedMiasTeam(), track (+14 more)

### Community 87 - "login/actions.ts"
Cohesion: 0.18
Nodes (20): MockLoginSchema, next, passwordLoginAction(), PasswordLoginSchema, clientIp(), digest(), isSignInThrottled(), MAX_FAILURES_PER_EMAIL (+12 more)

### Community 89 - "local-scripts.test.ts"
Cohesion: 0.14
Nodes (10): run(), SECRET_VALUES, stub, stub, LOCAL_STATUS, makeStub(), root, dir (+2 more)

### Community 90 - "leave-requests/index.ts"
Cohesion: 0.22
Nodes (14): decideLeaveRequestAction(), submitLeaveRequestAction(), isAppError(), ActionResult, Decision, toAppError(), CancelDeps, RequestIdSchema (+6 more)

### Community 91 - "getAuthProvider"
Cohesion: 0.14
Nodes (22): GET, setPasswordAction(), SetPasswordState, dynamic, metadata, SetPasswordPage(), ForgotPasswordState, endSessionAction() (+14 more)

### Community 92 - "balance-writers.test.ts"
Cohesion: 0.31
Nodes (8): appFiles, files(), MOCK_FIELD, normalise(), root, Table, writersOf(), writesTable()

### Community 94 - "local-env.mjs"
Cohesion: 0.15
Nodes (14): postgres, @supabase/supabase-js, Email, inviteUser(), main(), MESSAGES, hostOf(), isLocalUrl() (+6 more)

### Community 97 - "decision-dialog.tsx"
Cohesion: 0.24
Nodes (13): DecisionDialog(), confirm(), handleOpenChange(), DecisionDialogProps, Dialog(), DialogContent(), DialogDescription(), DialogFooter() (+5 more)

### Community 98 - "vitest"
Cohesion: 0.09
Nodes (18): vitest, METRICS, rows, getSession, files(), root, appFiles, files() (+10 more)

### Community 102 - "instrumentation.ts"
Cohesion: 0.38
Nodes (3): register(), assertEnvOrExit(), register()

### Community 103 - "app-shell.tsx"
Cohesion: 0.12
Nodes (26): dynamic, ForgotPasswordPage(), metadata, AppShellProps, Brand(), MobileNav(), activeHref(), NAV_ITEMS (+18 more)

### Community 106 - "session-renewal.test.ts"
Cohesion: 0.09
Nodes (28): ErrorEnvelopeSchema, SessionTimingSchema, getSessionSecret(), globalForSession, isClaims(), MAX_TOKEN_LENGTH, newSessionId(), renewClaims() (+20 more)

### Community 108 - "next.config.ts"
Cohesion: 0.50
Nodes (3): csp, nextConfig, securityHeaders

### Community 109 - "Coding Standards — LeaveTrack"
Cohesion: 0.20
Nodes (9): API route handlers, Coding Standards — LeaveTrack, Dependencies, Hard-won rules (from Day 0 VALIDATE), Logging, Next.js 16, Testing, UI (+1 more)

## Knowledge Gaps
- **718 isolated node(s):** `@commitlint/config-conventional`, `uvx`, `nexus-mcp`, `semi`, `singleQuote` (+713 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 876 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `theme.ts`, `package.json`, `approval-routing.test.ts`, `e2e/helpers.ts`, `account-actions.test.ts`, `notifications.test.ts`, `env.ts`, `roles.ts`, `leave-requests/memory-store.ts`, `api/errors.ts`, `login/page.tsx`, `cancel.test.ts`, `balance-ledger.test.ts`, `accrual/route.ts`, `approval-queue.tsx`, `with-error-handler.ts`, `openapi.test.ts`, `store.test.ts`, `idle-session-guard.tsx`, `tokens.test.ts`, `provider.ts`, `errors.test.ts`, `data/types.ts`, `coverage-summary.test.ts`, `decide.test.ts`, `repository.ts`, `db/helpers.ts`, `login/actions.ts`, `local-scripts.test.ts`, `leave-requests/index.ts`, `balance-writers.test.ts`, `local-env.mjs`, `instrumentation.ts`, `session-renewal.test.ts`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `theme.ts`, `package.json`, `approval-routing.test.ts`, `account-actions.test.ts`, `env.ts`, `password-login-form.tsx`, `roles.ts`, `api/errors.ts`, `login/page.tsx`, `Button`, `accrual/route.ts`, `read.ts`, `approval-queue.tsx`, `AppError`, `with-error-handler.ts`, `openapi.test.ts`, `provider.ts`, `errors.test.ts`, `login/actions.ts`, `leave-requests/index.ts`, `getAuthProvider`, `app-shell.tsx`, `session-renewal.test.ts`, `next.config.ts`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `find()` connect `/dev-tasks-planner` to `vitest`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `uvx`, `nexus-mcp` to the rest of the system?**
  _718 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Business Requirements Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `Architecture Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._