# Graph Report - leave-track  (2026-11-28)

## Corpus Check
- 352 files · ~169,538 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 6, .csv 2, .example 1)

## Summary
- 2052 nodes · 5791 edges · 115 communities (98 shown, 17 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 130 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2f4ec37d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Business Requirements Document — LeaveTrack v1.0
- lib/format.ts
- ADR-LeaveTrack-E001 — Auth & Session Strategy
- Product Requirements Document — LeaveTrack v1.0
- package.json
- Architecture Document — LeaveTrack v1.0
- compilerOptions
- devDependencies
- dependencies
- scripts
- components.json
- openapi.test.ts
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
- contract.test.ts
- Steps
- Steps
- openapi.ts
- .prettierrc.json
- pr-verifier.md
- Steps
- Steps
- nexus
- extends
- postcss.config.mjs
- login/actions.ts
- login/page.tsx
- auth.spec.ts
- countDays
- vitest
- data/types.ts
- env.ts
- login-redirect.test.ts
- cn
- local-only.mjs
- Prove the test can fail (from TASK-010)
- LeaveTrack UI — Design System
- account-actions.test.ts
- mock/store.ts
- Database
- implement-api-route.md
- implement-ui-component.md
- write-migration.md
- read.ts
- fixtures.ts
- Coding Standards — LeaveTrack
- approval-queue.tsx
- independence.test.ts
- AppError
- Steps
- dashboard/page.tsx
- session-renewal.test.ts
- toAppError
- idle-session-guard.tsx
- vercel.json
- Revision v1.1 — EPIC 2 (2026-11-26)
- tokens.test.ts
- provider.ts
- with-error-handler.ts
- Role
- coverage-summary.mjs
- repositories.ts
- approval-routing.test.ts
- Steps
- decide.test.ts
- ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR
- ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions
- cancel.test.ts
- leave-requests/index.ts
- /dev-tasks-planner
- rate-limit/index.ts
- dev-accounts.ts
- ref_node_path
- request-form.tsx
- e2e-supabase-harness.test.ts
- balance-writers.test.ts
- notifications.test.ts
- invite-user.mjs
- accrual/route.ts
- api/errors.ts
- Button
- resolutions/page.tsx
- reset/route.ts
- ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox
- instrumentation.ts
- zod
- /scaffold
- leave-request.ts
- roles.ts
- set-task-status.mjs
- repo-hygiene.test.ts
- notifier.test.ts
- ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port
- CLAUDE.md
- decimal.ts
- no-name-logic.test.ts
- next

## God Nodes (most connected - your core abstractions)
1. `cn()` - 114 edges
2. `vitest` - 79 edges
3. `next` - 64 edges
4. `Button()` - 45 edges
5. `AppError` - 40 edges
6. `lucide-react` - 38 edges
7. `createTestDb()` - 33 edges
8. `USER_IDS` - 32 edges
9. `react` - 32 edges
10. `getSession` - 31 edges

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

## Communities (115 total, 17 thin omitted)

### Community 0 - "Business Requirements Document — LeaveTrack v1.0"
Cohesion: 0.09
Nodes (21): Additional Functional Requirements, Additional Risks, Additional Stakeholder Concerns, Additional Success Criteria, Assumptions, Business Context, Business Requirements Document — LeaveTrack v1.0, Constraints (+13 more)

### Community 1 - "lib/format.ts"
Cohesion: 0.23
Nodes (14): NotificationList(), Props, dateFmt, dateTimeFmt, formatDate(), formatDateRange(), formatDateTime(), formatMonth() (+6 more)

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

### Community 11 - "openapi.test.ts"
Cohesion: 0.15
Nodes (12): AccrualResultSchema, BalanceSummarySchema, SessionTiming, AuditParamsSchema, AuditQuerySchema, ListQuerySchema, Doc, EXCLUDED (+4 more)

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
Cohesion: 0.09
Nodes (33): OPERATIONS, create(), daysFromToday(), enlargeText(), expectNoHorizontalOverflow(), expectNotUnderHeader(), expectSelectsNotClipped(), expectTapTargets() (+25 more)

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

### Community 25 - "contract.test.ts"
Cohesion: 0.09
Nodes (28): AuditEventSchema, AuditRequestRecordSchema, CancelLeaveRequestResultSchema, DecideLeaveRequestResultSchema, DecideWarningSchema, EmployeeAuditHistorySchema, epochSeconds, ErrorCodeSchema (+20 more)

### Community 26 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Orient with your knowledge graph (if one exists), 2 — Load context in priority order, 3 — Output this summary, nothing else, 4 — Stop, Arguments, /evaluate, Steps

### Community 27 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Blast radius check, 2 — Write the implementation blueprint, 3 — State constraints, 4 — Stop and wait, /plan, Prerequisite, Steps

### Community 28 - "openapi.ts"
Cohesion: 0.18
Nodes (16): buildOpenApiDocument(), ComponentName, COMPONENTS, COOKIE, errors(), input(), JsonSchema, parameters() (+8 more)

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

### Community 36 - "login/actions.ts"
Cohesion: 0.12
Nodes (33): GET, setPasswordAction(), SetPasswordState, dynamic, metadata, SetPasswordPage(), endSessionAction(), loginAction() (+25 more)

### Community 37 - "login/page.tsx"
Cohesion: 0.13
Nodes (41): AuditPage(), metadata, one(), forgotPasswordAction(), LoginState, HIGHLIGHTS, LoginPage(), metadata (+33 more)

### Community 38 - "auth.spec.ts"
Cohesion: 0.15
Nodes (18): acceptInvite(), admin, anon, DEV_NOTICE_TEXT, env, noSession, sql, assertTestEmail() (+10 more)

### Community 39 - "countDays"
Cohesion: 0.19
Nodes (17): countDays(), append(), writeRequestCancelledMemory(), writeRequestDecidedMemory(), writeRequestSubmittedMemory(), writeResolutionProposedMemory(), cancelledKey(), decidedKey() (+9 more)

### Community 40 - "vitest"
Cohesion: 0.13
Nodes (20): B30 — PGlite lifecycle and CI memory (2026-11-26), @electric-sql/pglite, vitest, built(), closeAfterEachTest(), closeAll(), migratedDb(), MIGRATION_FILES (+12 more)

### Community 41 - "data/types.ts"
Cohesion: 0.08
Nodes (23): AccrualResult, AccrualRun, AUDIT_ACTIONS, AuditAction, AuditEvent, AuditHistoryFilter, AuditLogEntry, AuditRequestRecord (+15 more)

### Community 42 - "env.ts"
Cohesion: 0.08
Nodes (25): ForgotPasswordState, Driver, globalForDb, wrap(), DEPLOYED_APP_ENVS, DEPLOYED_VERCEL_ENVS, env, EnvSchema (+17 more)

### Community 44 - "cn"
Cohesion: 0.08
Nodes (49): dynamic, ForgotPasswordPage(), metadata, setThemeAction(), AppShell(), AppShellProps, Brand(), MobileNav() (+41 more)

### Community 45 - "local-only.mjs"
Cohesion: 0.14
Nodes (25): listAllAuthUsers(), LOCAL_DEV_PASSWORD, main(), planSeed(), pushArgs(), assertLocal(), exitWith(), isLocalUrl() (+17 more)

### Community 46 - "Prove the test can fail (from TASK-010)"
Cohesion: 0.08
Nodes (25): DialogTrigger(), "Authorize before any database access" — prove it with a repository spy (from TASK-015), Browser e2e recipe (from TASK-016), Changing tooling versions: diff the resolved config, measure before thresholding (from TASK-021), Cross-cutting invariants: matrix + writer registry (from TASK-018), Defense in depth for "exactly once" writes (from TASK-014), Fail-closed configuration: test build time and runtime separately (from TASK-019), Headless browser tests with Radix overlays (+17 more)

### Community 48 - "LeaveTrack UI — Design System"
Cohesion: 0.12
Nodes (15): Backlog, Color tokens, Components, Core, Dark theme (TASK-047), Iconography, Layout & breakpoints, Leave types (+7 more)

### Community 50 - "account-actions.test.ts"
Cohesion: 0.13
Nodes (15): Security rules, LEGACY_SESSION_COOKIES, SESSION_COOKIE, sessionCookieOptions(), mockAuthProvider, NOT_LINKED_MESSAGE, renewSession(), WritableJar (+7 more)

### Community 52 - "mock/store.ts"
Cohesion: 0.07
Nodes (38): memoryAccrualStore, currentPeriod(), monthsToAccrue(), nextPeriod(), createPostgresAccrualStore(), AccrualDeps, MAX_CATCH_UP_MONTHS, runMonthlyAccrual() (+30 more)

### Community 53 - "Database"
Cohesion: 0.08
Nodes (24): Accrual job (TASK-017), API documentation (TASK-057), Approvals (TASK-026), Balance history (TASK-029), Database, Day 1 hand-off notes, Environment, HR audit (TASK-015) (+16 more)

### Community 57 - "read.ts"
Cohesion: 0.28
Nodes (10): POST, markNotificationsReadAction(), isAppError(), getMarkReadDeps(), createPostgresNotificationReadStore(), markNotificationsRead(), MarkReadDeps, memoryNotificationReadStore (+2 more)

### Community 58 - "fixtures.ts"
Cohesion: 0.05
Nodes (44): accrualRuns, auditLog, BALANCE_ROWS, LAST_ACCRUAL_AT, LEAVE_TYPE_IDS, leaveBalances, leavePolicies, leaveTypes (+36 more)

### Community 59 - "Coding Standards — LeaveTrack"
Cohesion: 0.18
Nodes (10): API route handlers, Coding Standards — LeaveTrack, Dependencies, Hard-won rules (from Day 0 VALIDATE), Logging, Next.js 16, Testing, TypeScript (+2 more)

### Community 60 - "approval-queue.tsx"
Cohesion: 0.20
Nodes (31): ApprovalQueue(), ApprovalQueueProps, BalanceHint(), ActionBadge(), AuditTable(), EmptyState(), EmptyStateProps, LeaveTypeBadge() (+23 more)

### Community 61 - "independence.test.ts"
Cohesion: 0.11
Nodes (18): decideLeaveRequest(), memoryDecideStore, BEN, ManagerSession, MAYA, notifier, run(), SCRIPT (+10 more)

### Community 62 - "AppError"
Cohesion: 0.21
Nodes (15): GET, dynamic, GET, POST, GET, NO_STORE, POST, dynamic (+7 more)

### Community 63 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Inspect changes, 2 — Stage deliberately, 3 — Write the commit message, 4 — Confirm, /commit, Steps, When to use

### Community 64 - "dashboard/page.tsx"
Cohesion: 0.08
Nodes (45): AGENTS.md — LeaveTrack, Frontend standards, Git conventions, Project, Quality gates (must pass before merge), Stack, Task tracking, Where things go (+37 more)

### Community 65 - "session-renewal.test.ts"
Cohesion: 0.10
Nodes (26): renewSessionToken(), getSessionSecret(), globalForSession, isClaims(), MAX_TOKEN_LENGTH, newSessionId(), renewClaims(), SessionClaims (+18 more)

### Community 66 - "toAppError"
Cohesion: 0.33
Nodes (9): POST, proposeResolutionAction(), API additions (planned), toAppError(), getResolutionDeps(), ProposeDeps, proposeResolution(), earliestRecoveryStart() (+1 more)

### Community 67 - "idle-session-guard.tsx"
Cohesion: 0.08
Nodes (43): AuthenticatedLayout(), metadata, RootLayout(), viewport, CancelRequestButton(), ACTIVITY_EVENTS, IdleSessionGuard(), IdleSessionGuardProps (+35 more)

### Community 69 - "Revision v1.1 — EPIC 2 (2026-11-26)"
Cohesion: 0.12
Nodes (15): API Design (selected), Architecture Document — LeaveTrack v1.0, Considered and not adopted, Data Model, Data model additions (planned), Deployment changes, Deployment Topology, EPIC 2 decisions (adopted 2026-11-26) (+7 more)

### Community 70 - "tokens.test.ts"
Cohesion: 0.25
Nodes (7): contrast(), css, dark, light, luminance(), PAIRS, systemDark

### Community 71 - "provider.ts"
Cohesion: 0.11
Nodes (16): CookieIO, CookieJar, CookieToSet, AuthProvider, EmailLinkType, NO_PROVIDER_SESSION, ProviderResult, sessionTokens (+8 more)

### Community 72 - "with-error-handler.ts"
Cohesion: 0.14
Nodes (14): ASSETS, dynamic, GET, dynamic, GET, dynamic, GET, ConfirmQuery (+6 more)

### Community 74 - "Role"
Cohesion: 0.33
Nodes (7): activeHref(), NAV_ITEMS, NavItem, navItemsFor(), GROUP_LABEL, SidebarNavProps, Role

### Community 76 - "repositories.ts"
Cohesion: 0.08
Nodes (25): availableForRequest(), buildBalanceSummaries(), PendingRange, leaveRequests, UserRow, LeaveRepository, selectRepository(), AUDIT_LOG_LIMIT (+17 more)

### Community 77 - "approval-routing.test.ts"
Cohesion: 0.06
Nodes (44): Backend standards, Implementation note (TASK-030), Time-shift probe: find tests that depend on today's date (from TASK-027), Database, daysBefore(), todayUtc(), utcDay(), utcMonthBounds() (+36 more)

### Community 79 - "Steps"
Cohesion: 0.22
Nodes (8): 0 — Run code review first, 1 — Gather context, 2 — Draft the PR, 3 — Push and open the PR, 4 — Output, /create-pr, Steps, When to use

### Community 80 - "decide.test.ts"
Cohesion: 0.12
Nodes (14): ANA, audit(), balance(), BEN, CARLA, MAYA, R, requestRow() (+6 more)

### Community 81 - "ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR, Consequences, Context, Decision, Implementation note (TASK-026)

### Community 82 - "ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions, Consequences, Context, Decision, Implementation note (TASK-029)

### Community 83 - "cancel.test.ts"
Cohesion: 0.09
Nodes (42): createPostgresRepository(), SqlClient, SqlRow, toIso(), toNumber(), createPostgresCancelStore(), createPostgresDecideStore(), createPostgresSubmitStore() (+34 more)

### Community 84 - "leave-requests/index.ts"
Cohesion: 0.17
Nodes (16): POST, cancelLeaveRequestAction(), submitLeaveRequestAction(), Session, ActionResult, getSql(), CancelDeps, cancelLeaveRequest() (+8 more)

### Community 85 - "/dev-tasks-planner"
Cohesion: 0.12
Nodes (17): APPLY — Generate the CSV(s) programmatically, Arguments, /dev-tasks-planner, EVALUATE — Read the source material and the real repo state, Every `Blocked` row cites the exact reason and states the fallback, Every `Done` row states its own Day-1 forward path, Every task cites the project's own established patterns by name, not generic prose, File structure and exact schema (+9 more)

### Community 87 - "rate-limit/index.ts"
Cohesion: 0.26
Nodes (10): getRateLimitStore(), createMemoryRateLimitStore(), globalForRateLimit, memoryRateLimitStore, createPostgresRateLimitStore(), BUCKET_SECONDS, bucketStart(), RateLimitStore (+2 more)

### Community 88 - "dev-accounts.ts"
Cohesion: 0.16
Nodes (11): DEV_LOGIN_HOSTS, DevAccount, devLoginAccountsEnabled(), isDevLoginHost(), LOCAL_DEV_PASSWORD, RawEnv, ROLE_ORDER, toDevAccounts() (+3 more)

### Community 89 - "ref_node_path"
Cohesion: 0.09
Nodes (15): LOCAL_HOSTS, dir, script, files(), root, run(), SECRET_VALUES, stub (+7 more)

### Community 90 - "request-form.tsx"
Cohesion: 0.15
Nodes (20): EMPTY, localToday(), RequestForm(), RequestFormProps, shiftLocalDate(), FormControl(), FormDescription(), FormField() (+12 more)

### Community 91 - "e2e-supabase-harness.test.ts"
Cohesion: 0.18
Nodes (10): accessTokenFromCookies(), TEST_EMAIL_DOMAIN, testEmail(), assertPortFree(), probePort(), local, @supabase/ssr, harnessDir (+2 more)

### Community 92 - "balance-writers.test.ts"
Cohesion: 0.31
Nodes (8): appFiles, files(), MOCK_FIELD, normalise(), root, Table, writersOf(), writesTable()

### Community 93 - "notifications.test.ts"
Cohesion: 0.14
Nodes (12): resetMockDb(), memory(), memoryBackend(), memory(), memory(), memoryHarness(), Backend, JORDAN_VACATION (+4 more)

### Community 94 - "invite-user.mjs"
Cohesion: 0.24
Nodes (8): postgres, @supabase/supabase-js, Email, inviteUser(), main(), MESSAGES, hostOf(), USER

### Community 95 - "accrual/route.ts"
Cohesion: 0.47
Nodes (5): authorized(), GET, handler(), POST, getAccrualDeps()

### Community 96 - "api/errors.ts"
Cohesion: 0.24
Nodes (8): ERROR_STATUS, ErrorCode, ApiFailure, ApiResponse, ApiSuccess, BY_CONSTRAINT, BY_SQLSTATE, DbError

### Community 97 - "Button"
Cohesion: 0.16
Nodes (25): AppError(), ForbiddenPage(), metadata, NotFound(), DecisionDialog(), confirm(), handleOpenChange(), DecisionDialogProps (+17 more)

### Community 98 - "resolutions/page.tsx"
Cohesion: 0.43
Nodes (6): metadata, ResolutionsPage(), parseResolutionTab(), RESOLUTION_TABS, ResolutionTab, ResolutionTabs()

### Community 99 - "reset/route.ts"
Cohesion: 0.22
Nodes (9): notFound(), POST(), tokenMatches(), ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering, Consequences, Context, Decision, Options considered (+1 more)

### Community 100 - "ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox"
Cohesion: 0.29
Nodes (4): ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox, Consequences, Context, Decision

### Community 102 - "instrumentation.ts"
Cohesion: 0.38
Nodes (3): register(), assertEnvOrExit(), register()

### Community 103 - "zod"
Cohesion: 0.40
Nodes (4): days, ProposeResolutionInput, ProposeResolutionSchema, zod

### Community 104 - "/scaffold"
Cohesion: 0.25
Nodes (7): APPLY — Generate the Complete Boilerplate, Ecosystem reference, EVALUATE — Understand the Architecture and Design, PLAN — Boilerplate + UI Shell + Project Rules, Prerequisites, /scaffold, VALIDATE — Validate Infrastructure + Design Fidelity

### Community 105 - "leave-request.ts"
Cohesion: 0.24
Nodes (9): DecisionInput, DecisionSchema, LeaveRequestInput, LeaveRequestSchema, MAX_LENGTH_MESSAGE, OVERLAP_MESSAGE, RejectReasonSchema, spanDays() (+1 more)

### Community 106 - "roles.ts"
Cohesion: 0.11
Nodes (28): proxyCookieIO(), SESSION_MAX_AGE_SECONDS, canAccess(), isPublicPath(), isRole(), matches(), MAX_REDIRECT_LENGTH, NEVER_REDIRECT_TO (+20 more)

### Community 107 - "set-task-status.mjs"
Cohesion: 0.20
Nodes (6): RFC-4180, matches, previous, STATUSES, [taskId, status, csvArg], temp

### Community 108 - "repo-hygiene.test.ts"
Cohesion: 0.67
Nodes (3): git(), ignored(), root

### Community 110 - "ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port, Consequences, Context, Decision, Options considered

### Community 112 - "decimal.ts"
Cohesion: 0.73
Nodes (4): addDays(), fromHundredths(), sumDays(), toHundredths()

### Community 113 - "no-name-logic.test.ts"
Cohesion: 0.22
Nodes (8): appFiles, code(), files(), rel(), root, files(), root, UNSAFE_COMPARE

### Community 115 - "next"
Cohesion: 0.15
Nodes (9): decideLeaveRequestAction(), metadata, csp, nextConfig, securityHeaders, next, getSession, input (+1 more)

## Knowledge Gaps
- **734 isolated node(s):** `@commitlint/config-conventional`, `uvx`, `nexus-mcp`, `semi`, `singleQuote` (+729 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 895 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `lib/format.ts`, `package.json`, `openapi.test.ts`, `contract.test.ts`, `login/actions.ts`, `env.ts`, `login-redirect.test.ts`, `account-actions.test.ts`, `mock/store.ts`, `fixtures.ts`, `independence.test.ts`, `session-renewal.test.ts`, `idle-session-guard.tsx`, `tokens.test.ts`, `provider.ts`, `with-error-handler.ts`, `repositories.ts`, `approval-routing.test.ts`, `decide.test.ts`, `cancel.test.ts`, `leave-requests/index.ts`, `dev-accounts.ts`, `ref_node_path`, `e2e-supabase-harness.test.ts`, `balance-writers.test.ts`, `notifications.test.ts`, `invite-user.mjs`, `api/errors.ts`, `instrumentation.ts`, `leave-request.ts`, `roles.ts`, `repo-hygiene.test.ts`, `notifier.test.ts`, `decimal.ts`, `no-name-logic.test.ts`, `next`?**
  _High betweenness centrality (0.152) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `lib/format.ts`, `package.json`, `contract.test.ts`, `login/actions.ts`, `login/page.tsx`, `cn`, `account-actions.test.ts`, `mock/store.ts`, `read.ts`, `fixtures.ts`, `approval-queue.tsx`, `AppError`, `dashboard/page.tsx`, `session-renewal.test.ts`, `toAppError`, `idle-session-guard.tsx`, `provider.ts`, `with-error-handler.ts`, `Role`, `decide.test.ts`, `leave-requests/index.ts`, `accrual/route.ts`, `api/errors.ts`, `Button`, `resolutions/page.tsx`, `reset/route.ts`, `roles.ts`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `find()` connect `/dev-tasks-planner` to `idle-session-guard.tsx`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `uvx`, `nexus-mcp` to the rest of the system?**
  _734 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Business Requirements Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `Architecture Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._