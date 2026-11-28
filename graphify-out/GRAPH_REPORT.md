# Graph Report - leave-track  (2026-11-28)

## Corpus Check
- 335 files · ~162,822 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 6, .csv 2, .example 1)

## Summary
- 1976 nodes · 5383 edges · 114 communities (99 shown, 15 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 128 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `95051a53`
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
- vitest
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
- sign-in-throttle.test.ts
- Steps
- Steps
- independence.test.ts
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
- leave-request.ts
- login/page.tsx
- cn
- local-only.mjs
- Prove the test can fail (from TASK-010)
- notifications.test.ts
- Button
- balance-ledger.test.ts
- Database
- implement-api-route.md
- implement-ui-component.md
- write-migration.md
- leave-requests/index.ts
- LeaveTrack UI — Design System
- read.ts
- approval-queue.tsx
- session.ts
- AppError
- Steps
- isDeployedEnv
- schemas.ts
- store.test.ts
- idle-session-guard.tsx
- vercel.json
- Revision v1.1 — EPIC 2 (2026-11-26)
- tokens.test.ts
- provider.ts
- auth.spec.ts
- with-error-handler.ts
- LeaveRepository
- ref_node_child_process
- decide.test.ts
- Steps
- set-task-status.mjs
- ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR
- ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions
- repository.ts
- db/helpers.ts
- lib/format.ts
- login/actions.ts
- openapi.ts
- ref_node_fs
- data/types.ts
- forgot-password/actions.ts
- balance-writers.test.ts
- openapi.test.ts
- invite-user.mjs
- approval-routing.test.ts
- Role
- decision-dialog.tsx
- ref_node_path
- ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering
- ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox
- instrumentation.ts
- app-shell.tsx
- Backlog (deferred, owner = Day 1 team)
- set-task-status.test.ts
- session-renewal.test.ts
- Brand
- next
- Coding Standards — LeaveTrack
- ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port
- CLAUDE.md
- decimal.ts
- login-redirect.test.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 112 edges
2. `vitest` - 78 edges
3. `next` - 60 edges
4. `Button()` - 41 edges
5. `AppError` - 36 edges
6. `lucide-react` - 35 edges
7. `USER_IDS` - 31 edges
8. `createTestDb()` - 31 edges
9. `react` - 30 edges
10. `scripts` - 28 edges

## Surprising Connections (you probably didn't know these)
- `Decision` --references--> `POST()`  [INFERRED]
  docs/arch-docs/ADR-LeaveTrack-E002-Accrual-Idempotency.md → app/api/test/reset/route.ts
- `Measure layout only after it settles (from TASK-055)` --references--> `FormControl()`  [INFERRED]
  knowledge/patterns/implement-and-test.md → components/ui/form.tsx
- `Layout & breakpoints` --references--> `Sheet()`  [INFERRED]
  knowledge/design-system.md → components/ui/sheet.tsx
- `API route handlers` --references--> `withErrorHandler()`  [INFERRED]
  knowledge/rules/coding-standards.md → lib/api/with-error-handler.ts
- `Security changes` --references--> `safeRedirectPath()`  [INFERRED]
  docs/arch-docs/ARCH-LeaveTrack-v1.0.md → lib/auth/roles.ts

## Import Cycles
- None detected.

## Communities (114 total, 15 thin omitted)

### Community 0 - "Business Requirements Document — LeaveTrack v1.0"
Cohesion: 0.09
Nodes (21): Additional Functional Requirements, Additional Risks, Additional Stakeholder Concerns, Additional Success Criteria, Assumptions, Business Context, Business Requirements Document — LeaveTrack v1.0, Constraints (+13 more)

### Community 1 - "theme.ts"
Cohesion: 0.17
Nodes (13): metadata, RootLayout(), viewport, Toaster(), htmlClassFor(), parseTheme(), Theme, THEME_COOKIE (+5 more)

### Community 2 - "ADR-LeaveTrack-E001 — Auth & Session Strategy"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E001 — Auth & Session Strategy, Consequences, Context, Decision, Options Considered

### Community 3 - "Product Requirements Document — LeaveTrack v1.0"
Cohesion: 0.17
Nodes (11): Business Rules (EPIC 2), Non-Functional Requirements, Non-Functional Requirements (additions), Out of Scope, Out of Scope (additions), Product Requirements Document — LeaveTrack v1.0, Revision v1.1 — EPIC 2 (2026-11-26), User Roles (+3 more)

### Community 4 - "package.json"
Cohesion: 0.06
Nodes (31): description, engines, node, @commitlint/config-conventional, name, private, version, @axe-core/playwright (+23 more)

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

### Community 11 - "vitest"
Cohesion: 0.05
Nodes (56): accrualRuns, auditLog, BALANCE_ROWS, LAST_ACCRUAL_AT, LEAVE_TYPE_IDS, leaveBalances, leavePolicies, leaveRequests (+48 more)

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
Nodes (48): OPERATIONS, create(), daysFromToday(), enlargeText(), expectNoHorizontalOverflow(), expectNotUnderHeader(), expectSelectsNotClipped(), expectTapTargets() (+40 more)

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

### Community 25 - "sign-in-throttle.test.ts"
Cohesion: 0.14
Nodes (14): SESSION_COOKIE, mockAuthProvider, memoryRateLimitStore, state, fakeJar(), FakeProvider, fakeSupabaseProvider(), state (+6 more)

### Community 26 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Orient with your knowledge graph (if one exists), 2 — Load context in priority order, 3 — Output this summary, nothing else, 4 — Stop, Arguments, /evaluate, Steps

### Community 27 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Blast radius check, 2 — Write the implementation blueprint, 3 — State constraints, 4 — Stop and wait, /plan, Prerequisite, Steps

### Community 28 - "independence.test.ts"
Cohesion: 0.10
Nodes (20): decideLeaveRequest(), memoryDecideStore, DecideStore, BEN, ManagerSession, MAYA, notifier, run() (+12 more)

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
Cohesion: 0.10
Nodes (20): dynamic, GET, DEPLOYED_APP_ENVS, DEPLOYED_VERCEL_ENVS, env, EnvSchema, IdleTimeoutMinutesSchema, isLocalUrl() (+12 more)

### Community 37 - "password-login-form.tsx"
Cohesion: 0.18
Nodes (29): forgotPasswordAction(), LoginState, AuditFilters(), AuditFiltersProps, ForgotPasswordForm(), LoginForm(), LoginFormProps, MockUserOption (+21 more)

### Community 38 - "roles.ts"
Cohesion: 0.21
Nodes (13): isPublicPath(), isRole(), matches(), MAX_REDIRECT_LENGTH, NEVER_REDIRECT_TO, PUBLIC_PATHS, REDIRECT_BASES, REDIRECT_GUARDS (+5 more)

### Community 39 - "leave-requests/memory-store.ts"
Cohesion: 0.16
Nodes (20): approverLabel(), canDecide(), hasApprover(), Person, append(), writeRequestCancelledMemory(), writeRequestDecidedMemory(), writeRequestSubmittedMemory() (+12 more)

### Community 40 - "request-form.tsx"
Cohesion: 0.14
Nodes (21): LEAVE_TYPE_META, EMPTY, localToday(), RequestForm(), RequestFormProps, shiftLocalDate(), FormControl(), FormDescription() (+13 more)

### Community 41 - "/scaffold"
Cohesion: 0.25
Nodes (7): APPLY — Generate the Complete Boilerplate, Ecosystem reference, EVALUATE — Understand the Architecture and Design, PLAN — Boilerplate + UI Shell + Project Rules, Prerequisites, /scaffold, VALIDATE — Validate Infrastructure + Design Fidelity

### Community 42 - "leave-request.ts"
Cohesion: 0.24
Nodes (9): DecisionInput, DecisionSchema, LeaveRequestInput, LeaveRequestSchema, MAX_LENGTH_MESSAGE, OVERLAP_MESSAGE, RejectReasonSchema, spanDays() (+1 more)

### Community 43 - "login/page.tsx"
Cohesion: 0.18
Nodes (16): HIGHLIGHTS, LoginPage(), metadata, NOTICES, signedOutNotice(), SignedOutBroadcast(), DEV_LOGIN_HOSTS, DevAccount (+8 more)

### Community 44 - "cn"
Cohesion: 0.12
Nodes (29): setThemeAction(), THEME_LABEL, UserMenu(), UserMenuProps, Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup() (+21 more)

### Community 45 - "local-only.mjs"
Cohesion: 0.15
Nodes (24): listAllAuthUsers(), LOCAL_DEV_PASSWORD, main(), planSeed(), pushArgs(), assertLocal(), exitWith(), isLocalUrl() (+16 more)

### Community 46 - "Prove the test can fail (from TASK-010)"
Cohesion: 0.08
Nodes (25): DialogTrigger(), "Authorize before any database access" — prove it with a repository spy (from TASK-015), Browser e2e recipe (from TASK-016), Changing tooling versions: diff the resolved config, measure before thresholding (from TASK-021), Cross-cutting invariants: matrix + writer registry (from TASK-018), Defense in depth for "exactly once" writes (from TASK-014), Fail-closed configuration: test build time and runtime separately (from TASK-019), Headless browser tests with Radix overlays (+17 more)

### Community 48 - "notifications.test.ts"
Cohesion: 0.06
Nodes (41): Backend standards, Implementation note (TASK-030), atomically(), LeaveRequest, LeaveTypeName, SqlClient, SqlRow, toNumber() (+33 more)

### Community 50 - "Button"
Cohesion: 0.37
Nodes (8): AppError(), ForbiddenPage(), metadata, NotFound(), StatusScreen(), StatusScreenProps, Button(), lucide-react

### Community 52 - "balance-ledger.test.ts"
Cohesion: 0.10
Nodes (28): memoryAccrualStore, currentPeriod(), monthsToAccrue(), nextPeriod(), createPostgresAccrualStore(), AccrualDeps, MAX_CATCH_UP_MONTHS, runMonthlyAccrual() (+20 more)

### Community 53 - "Database"
Cohesion: 0.08
Nodes (23): Accrual job (TASK-017), API documentation (TASK-057), Approvals (TASK-026), Balance history (TASK-029), Database, Day 1 hand-off notes, Environment, HR audit (TASK-015) (+15 more)

### Community 57 - "leave-requests/index.ts"
Cohesion: 0.11
Nodes (21): authorized(), GET, handler(), POST, getAccrualDeps(), Session, Driver, getSql() (+13 more)

### Community 58 - "LeaveTrack UI — Design System"
Cohesion: 0.12
Nodes (15): Backlog, Color tokens, Components, Core, Dark theme (TASK-047), Iconography, Layout & breakpoints, Leave types (+7 more)

### Community 59 - "read.ts"
Cohesion: 0.33
Nodes (8): POST, markNotificationsReadAction(), getMarkReadDeps(), createPostgresNotificationReadStore(), markNotificationsRead(), MarkReadDeps, memoryNotificationReadStore, NotificationReadStore

### Community 60 - "approval-queue.tsx"
Cohesion: 0.22
Nodes (26): ApprovalQueue(), ApprovalQueueProps, BalanceHint(), ActionBadge(), AuditTable(), EmptyState(), EmptyStateProps, LeaveTypeBadge() (+18 more)

### Community 61 - "session.ts"
Cohesion: 0.07
Nodes (55): AGENTS.md — LeaveTrack, Frontend standards, Git conventions, Project, Quality gates (must pass before merge), Security rules, Stack, Task tracking (+47 more)

### Community 62 - "AppError"
Cohesion: 0.21
Nodes (17): GET, POST, GET, NO_STORE, POST, dynamic, POST, Example — TASK-014 (approve/reject) (+9 more)

### Community 63 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Inspect changes, 2 — Stage deliberately, 3 — Write the commit message, 4 — Confirm, /commit, Steps, When to use

### Community 64 - "isDeployedEnv"
Cohesion: 0.16
Nodes (13): ASSETS, dynamic, GET, dynamic, GET, dynamic, GET, notFound() (+5 more)

### Community 65 - "schemas.ts"
Cohesion: 0.08
Nodes (30): AccrualResultSchema, AuditEventSchema, AuditRequestRecordSchema, BalanceSummarySchema, CancelLeaveRequestResultSchema, DecideLeaveRequestResultSchema, DecideWarningSchema, EmployeeAuditHistorySchema (+22 more)

### Community 66 - "store.test.ts"
Cohesion: 0.23
Nodes (10): getRateLimitStore(), createMemoryRateLimitStore(), globalForRateLimit, createPostgresRateLimitStore(), BUCKET_SECONDS, bucketStart(), RateLimitStore, RETAIN_SECONDS (+2 more)

### Community 67 - "idle-session-guard.tsx"
Cohesion: 0.08
Nodes (47): APPLY — Generate the CSV(s) programmatically, Arguments, /dev-tasks-planner, EVALUATE — Read the source material and the real repo state, Every `Blocked` row cites the exact reason and states the fallback, Every `Done` row states its own Day-1 forward path, Every task cites the project's own established patterns by name, not generic prose, File structure and exact schema (+39 more)

### Community 69 - "Revision v1.1 — EPIC 2 (2026-11-26)"
Cohesion: 0.12
Nodes (15): API Design (selected), Architecture Document — LeaveTrack v1.0, Considered and not adopted, Data Model, Data model additions (planned), Deployment changes, Deployment Topology, EPIC 2 decisions (adopted 2026-11-26) (+7 more)

### Community 70 - "tokens.test.ts"
Cohesion: 0.25
Nodes (7): contrast(), css, dark, light, luminance(), PAIRS, systemDark

### Community 71 - "provider.ts"
Cohesion: 0.09
Nodes (18): CookieIO, CookieJar, CookieToSet, SESSION_MAX_AGE_SECONDS, AuthProvider, EmailLinkType, NO_PROVIDER_SESSION, ProviderResult (+10 more)

### Community 72 - "auth.spec.ts"
Cohesion: 0.11
Nodes (25): acceptInvite(), admin, anon, DEV_NOTICE_TEXT, env, noSession, sql, assertTestEmail() (+17 more)

### Community 74 - "with-error-handler.ts"
Cohesion: 0.12
Nodes (20): decideLeaveRequestAction(), submitLeaveRequestAction(), ConfirmQuery, API additions (planned), isAppError(), RouteHandler, withErrorHandler(), ActionResult (+12 more)

### Community 75 - "LeaveRepository"
Cohesion: 0.13
Nodes (9): LeaveRepository, BalanceSummary, LeaveRequestView, OrgStats, PolicyView, TeamRequestView, User, balancesFor() (+1 more)

### Community 76 - "ref_node_child_process"
Cohesion: 0.18
Nodes (5): assertPortFree(), probePort(), local, dir, script

### Community 77 - "decide.test.ts"
Cohesion: 0.21
Nodes (10): ANA, audit(), balance(), BEN, CARLA, MAYA, R, requestRow() (+2 more)

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
Cohesion: 0.10
Nodes (29): Time-shift probe: find tests that depend on today's date (from TASK-027), Database, availableForRequest(), buildBalanceSummaries(), PendingRange, daysBefore(), todayUtc(), utcDay() (+21 more)

### Community 84 - "db/helpers.ts"
Cohesion: 0.13
Nodes (23): B30 — PGlite lifecycle and CI memory (2026-11-26), @electric-sql/pglite, built(), closeAfterEachTest(), closeAll(), createTestDb(), migratedDb(), MIGRATION_FILES (+15 more)

### Community 85 - "lib/format.ts"
Cohesion: 0.20
Nodes (15): NotificationBell(), NotificationList(), Props, dateFmt, dateTimeFmt, formatDate(), formatDateRange(), formatDateTime() (+7 more)

### Community 87 - "login/actions.ts"
Cohesion: 0.14
Nodes (28): GET, setPasswordAction(), SetPasswordState, dynamic, metadata, SetPasswordPage(), endSessionAction(), loginAction() (+20 more)

### Community 88 - "openapi.ts"
Cohesion: 0.17
Nodes (17): buildOpenApiDocument(), ComponentName, COMPONENTS, COOKIE, errors(), input(), JsonSchema, parameters() (+9 more)

### Community 89 - "ref_node_fs"
Cohesion: 0.14
Nodes (11): METRICS, rows, LOCAL_HOSTS, statusLines(), run(), SECRET_VALUES, stub, stub (+3 more)

### Community 90 - "data/types.ts"
Cohesion: 0.10
Nodes (19): AccrualResult, AccrualRun, AUDIT_ACTIONS, AuditAction, AuditEvent, AuditHistoryFilter, AuditLogEntry, AuditRequestRecord (+11 more)

### Community 91 - "forgot-password/actions.ts"
Cohesion: 0.33
Nodes (5): ForgotPasswordState, ForgotPasswordSchema, PASSWORD_MAX, PASSWORD_MIN, SetPasswordSchema

### Community 92 - "balance-writers.test.ts"
Cohesion: 0.31
Nodes (8): appFiles, files(), MOCK_FIELD, normalise(), root, Table, writersOf(), writesTable()

### Community 93 - "openapi.test.ts"
Cohesion: 0.16
Nodes (11): SessionTiming, AuditParamsSchema, AuditQuerySchema, ListQuerySchema, @seriousme/openapi-schema-validator, Doc, EXCLUDED, Inferred (+3 more)

### Community 94 - "invite-user.mjs"
Cohesion: 0.27
Nodes (7): @supabase/supabase-js, Email, inviteUser(), main(), MESSAGES, hostOf(), USER

### Community 95 - "approval-routing.test.ts"
Cohesion: 0.15
Nodes (13): resetMockDb(), memory(), Backend, HANA, input(), memoryBackend(), postgresBackend(), ROLE (+5 more)

### Community 96 - "Role"
Cohesion: 0.31
Nodes (8): activeHref(), NAV_ITEMS, NavItem, navItemsFor(), GROUP_LABEL, SidebarNavProps, canAccess(), Role

### Community 97 - "decision-dialog.tsx"
Cohesion: 0.23
Nodes (14): DecisionDialog(), confirm(), handleOpenChange(), DecisionDialogProps, AlertTitle(), Dialog(), DialogContent(), DialogDescription() (+6 more)

### Community 98 - "ref_node_path"
Cohesion: 0.13
Nodes (12): files(), root, appFiles, files(), rel(), root, git(), ignored() (+4 more)

### Community 99 - "ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering"
Cohesion: 0.29
Nodes (6): ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering, Consequences, Context, Decision, Options considered, Policy changes vs catch-up

### Community 100 - "ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox"
Cohesion: 0.29
Nodes (4): ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox, Consequences, Context, Decision

### Community 102 - "instrumentation.ts"
Cohesion: 0.38
Nodes (3): register(), assertEnvOrExit(), register()

### Community 103 - "app-shell.tsx"
Cohesion: 0.26
Nodes (13): AppShell(), AppShellProps, MobileNav(), SidebarNav(), Sheet(), SheetContent(), SheetDescription(), SheetFooter() (+5 more)

### Community 104 - "Backlog (deferred, owner = Day 1 team)"
Cohesion: 0.29
Nodes (6): Backlog (deferred, owner = Day 1 team), Coverage baseline (TASK-021, 2026-11-26), EPIC 2 planning (2026-11-26), Fixed in VALIDATE, Retro — Day 0 scaffold (2026-11-24), What went well

### Community 105 - "set-task-status.test.ts"
Cohesion: 0.29
Nodes (3): dir, root, script

### Community 106 - "session-renewal.test.ts"
Cohesion: 0.15
Nodes (19): proxyCookieIO(), LEGACY_SESSION_COOKIES, sessionCookieOptions(), renewSessionToken(), HEARTBEAT_INTERVAL_SECONDS, HEARTBEAT_PATH, sessionPolicy, shouldRenew() (+11 more)

### Community 107 - "Brand"
Cohesion: 0.47
Nodes (4): dynamic, ForgotPasswordPage(), metadata, Brand()

### Community 108 - "next"
Cohesion: 0.23
Nodes (8): POST, cancelLeaveRequestAction(), cancelLeaveRequest(), getCancelDeps(), csp, nextConfig, securityHeaders, next

### Community 109 - "Coding Standards — LeaveTrack"
Cohesion: 0.18
Nodes (10): API route handlers, Coding Standards — LeaveTrack, Dependencies, Hard-won rules (from Day 0 VALIDATE), Logging, Next.js 16, Testing, TypeScript (+2 more)

### Community 110 - "ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port, Consequences, Context, Decision, Options considered

### Community 112 - "decimal.ts"
Cohesion: 0.73
Nodes (4): addDays(), fromHundredths(), sumDays(), toHundredths()

## Knowledge Gaps
- **719 isolated node(s):** `@commitlint/config-conventional`, `uvx`, `nexus-mcp`, `semi`, `singleQuote` (+714 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 877 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `theme.ts`, `package.json`, `e2e/helpers.ts`, `sign-in-throttle.test.ts`, `independence.test.ts`, `env.ts`, `roles.ts`, `leave-request.ts`, `login/page.tsx`, `notifications.test.ts`, `balance-ledger.test.ts`, `leave-requests/index.ts`, `AppError`, `isDeployedEnv`, `schemas.ts`, `store.test.ts`, `idle-session-guard.tsx`, `tokens.test.ts`, `provider.ts`, `auth.spec.ts`, `with-error-handler.ts`, `ref_node_child_process`, `decide.test.ts`, `repository.ts`, `db/helpers.ts`, `lib/format.ts`, `ref_node_fs`, `balance-writers.test.ts`, `openapi.test.ts`, `invite-user.mjs`, `approval-routing.test.ts`, `ref_node_path`, `instrumentation.ts`, `set-task-status.test.ts`, `session-renewal.test.ts`, `decimal.ts`, `login-redirect.test.ts`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `theme.ts`, `package.json`, `vitest`, `e2e/helpers.ts`, `sign-in-throttle.test.ts`, `password-login-form.tsx`, `login/page.tsx`, `Button`, `leave-requests/index.ts`, `read.ts`, `approval-queue.tsx`, `session.ts`, `AppError`, `isDeployedEnv`, `schemas.ts`, `provider.ts`, `with-error-handler.ts`, `lib/format.ts`, `login/actions.ts`, `Role`, `session-renewal.test.ts`, `Brand`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `Role`, `decision-dialog.tsx`, `idle-session-guard.tsx`, `password-login-form.tsx`, `app-shell.tsx`, `request-form.tsx`, `Brand`, `Coding Standards — LeaveTrack`, `Button`, `lib/format.ts`, `approval-queue.tsx`, `session.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `uvx`, `nexus-mcp` to the rest of the system?**
  _719 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Business Requirements Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `Architecture Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._