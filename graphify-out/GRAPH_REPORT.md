# Graph Report - leave-track  (2026-11-28)

## Corpus Check
- 328 files · ~157,849 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 6, .csv 2, .example 1)

## Summary
- 1943 nodes · 5281 edges · 110 communities (95 shown, 15 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 127 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1b3bf6e5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Business Requirements Document — LeaveTrack v1.0
- vitest
- ADR-LeaveTrack-E001 — Auth & Session Strategy
- Product Requirements Document — LeaveTrack v1.0
- package.json
- Architecture Document — LeaveTrack v1.0
- compilerOptions
- devDependencies
- dependencies
- scripts
- components.json
- submit.test.ts
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
- mock/store.ts
- .prettierrc.json
- pr-verifier.md
- Steps
- Steps
- nexus
- extends
- postcss.config.mjs
- leave-requests/route.ts
- request-form.tsx
- heartbeat-route.test.ts
- app/layout.tsx
- approval-routing.test.ts
- session-renewal.test.ts
- dashboard/page.tsx
- schemas.ts
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
- ref_node_path
- LeaveTrack UI — Design System
- AppError
- getAuthProvider
- approval-queue.tsx
- set-task-status.mjs
- Steps
- /dev-tasks-planner
- openapi.ts
- Backlog (deferred, owner = Day 1 team)
- idle-session-guard.tsx
- vercel.json
- Revision v1.1 — EPIC 2 (2026-11-26)
- openapi.test.ts
- provider.ts
- roles.ts
- AGENTS.md — LeaveTrack
- submit.ts
- utils.ts
- decide.test.ts
- Steps
- getSql
- ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR
- ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions
- independence.test.ts
- /scaffold
- contract.test.ts
- login/actions.ts
- ADR-LeaveTrack-E004 — Real Authentication: Supabase Auth with signed sessions
- local-scripts.test.ts
- getSession
- leave-request.ts
- balance-writers.test.ts
- reset/route.ts
- invite-user.mjs
- next
- instrumentation.ts
- decision-dialog.tsx
- action-errors.test.ts
- ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port
- fixtures.ts
- next.config.ts
- data/types.ts
- env.ts
- local-env.mjs
- set-task-status.test.ts
- data/dates.ts
- CLAUDE.md
- coverage-summary.test.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 108 edges
2. `vitest` - 75 edges
3. `next` - 58 edges
4. `Button()` - 41 edges
5. `AppError` - 36 edges
6. `lucide-react` - 35 edges
7. `USER_IDS` - 30 edges
8. `createTestDb()` - 30 edges
9. `react` - 29 edges
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
- `Frontend standards` --references--> `requireRole()`  [INFERRED]
  AGENTS.md → lib/auth/session.ts

## Import Cycles
- None detected.

## Communities (110 total, 15 thin omitted)

### Community 0 - "Business Requirements Document — LeaveTrack v1.0"
Cohesion: 0.09
Nodes (21): Additional Functional Requirements, Additional Risks, Additional Stakeholder Concerns, Additional Success Criteria, Assumptions, Business Context, Business Requirements Document — LeaveTrack v1.0, Constraints (+13 more)

### Community 1 - "vitest"
Cohesion: 0.10
Nodes (26): B30 — PGlite lifecycle and CI memory (2026-11-26), accrualRuns, leaveTypes, @electric-sql/pglite, vitest, CASES, built(), closeAfterEachTest() (+18 more)

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

### Community 11 - "submit.test.ts"
Cohesion: 0.07
Nodes (24): LEAVE_TYPE_IDS, insertOldRequest(), insertPending(), MIA_REPORTS, seedMiasTeam(), track, asHistorical(), input() (+16 more)

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
Cohesion: 0.18
Nodes (8): SESSION_COOKIE, mockAuthProvider, state, fakeJar(), FakeProvider, fakeSupabaseProvider(), state, state

### Community 26 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Orient with your knowledge graph (if one exists), 2 — Load context in priority order, 3 — Output this summary, nothing else, 4 — Stop, Arguments, /evaluate, Steps

### Community 27 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Blast radius check, 2 — Write the implementation blueprint, 3 — State constraints, 4 — Stop and wait, /plan, Prerequisite, Steps

### Community 28 - "mock/store.ts"
Cohesion: 0.08
Nodes (39): auditLog, USER_IDS, appendLedger(), atomically(), createMockDb(), globalForMock, mockDb, openingLedger() (+31 more)

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

### Community 36 - "leave-requests/route.ts"
Cohesion: 0.08
Nodes (35): GET, ASSETS, dynamic, GET, dynamic, GET, dynamic, GET (+27 more)

### Community 37 - "request-form.tsx"
Cohesion: 0.06
Nodes (74): AuditPage(), metadata, one(), forgotPasswordAction(), dynamic, ForgotPasswordPage(), metadata, LoginState (+66 more)

### Community 38 - "heartbeat-route.test.ts"
Cohesion: 0.09
Nodes (27): ErrorEnvelopeSchema, SessionTimingSchema, getSessionSecret(), globalForSession, isClaims(), MAX_TOKEN_LENGTH, newSessionId(), renewClaims() (+19 more)

### Community 39 - "app/layout.tsx"
Cohesion: 0.24
Nodes (5): metadata, RootLayout(), viewport, Toaster(), geist

### Community 40 - "approval-routing.test.ts"
Cohesion: 0.11
Nodes (18): LeaveRequest, Approver, approverLabel(), canDecide(), hasApprover(), Person, BalanceContext, CancelInput (+10 more)

### Community 41 - "session-renewal.test.ts"
Cohesion: 0.21
Nodes (13): proxyCookieIO(), HEARTBEAT_INTERVAL_SECONDS, HEARTBEAT_PATH, sessionPolicy, shouldRenew(), TOUCH_INTERVAL_SECONDS, WARNING_SECONDS, config (+5 more)

### Community 42 - "dashboard/page.tsx"
Cohesion: 0.24
Nodes (17): DashboardPage(), metadata, StatCard(), Loading(), BalanceCard(), BalanceCardProps, BalanceCardSkeleton(), LEAVE_TYPE_META (+9 more)

### Community 43 - "schemas.ts"
Cohesion: 0.14
Nodes (13): AuditEventSchema, BalanceSummarySchema, DecideWarningSchema, epochSeconds, ErrorCodeSchema, isoDate, isoTimestamp, LeaveTypeSchema (+5 more)

### Community 44 - "cn"
Cohesion: 0.13
Nodes (25): UserMenu(), UserMenuProps, Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage() (+17 more)

### Community 45 - "local-only.mjs"
Cohesion: 0.17
Nodes (20): @supabase/supabase-js, listAllAuthUsers(), LOCAL_DEV_PASSWORD, main(), planSeed(), pushArgs(), assertLocal(), exitWith() (+12 more)

### Community 46 - "Prove the test can fail (from TASK-010)"
Cohesion: 0.07
Nodes (27): DialogTrigger(), "Authorize before any database access" — prove it with a repository spy (from TASK-015), Browser e2e recipe (from TASK-016), Changing tooling versions: diff the resolved config, measure before thresholding (from TASK-021), Cross-cutting invariants: matrix + writer registry (from TASK-018), Defense in depth for "exactly once" writes (from TASK-014), Example — TASK-014 (approve/reject), Fail-closed configuration: test build time and runtime separately (from TASK-019) (+19 more)

### Community 48 - "notifications.test.ts"
Cohesion: 0.10
Nodes (30): Backend standards, availableForRequest(), createPostgresRepository(), UserRow, LeaveTypeName, SqlClient, SqlRow, toIso() (+22 more)

### Community 50 - "Button"
Cohesion: 0.19
Nodes (17): AppError(), ForbiddenPage(), metadata, NotFound(), NotificationBell(), StatusScreen(), StatusScreenProps, NotificationList() (+9 more)

### Community 52 - "balance-ledger.test.ts"
Cohesion: 0.08
Nodes (34): memoryAccrualStore, currentPeriod(), monthsToAccrue(), nextPeriod(), createPostgresAccrualStore(), AccrualDeps, MAX_CATCH_UP_MONTHS, runMonthlyAccrual() (+26 more)

### Community 53 - "Database"
Cohesion: 0.09
Nodes (21): Accrual job (TASK-017), API documentation (TASK-057), Approvals (TASK-026), Balance history (TASK-029), Database, Day 1 hand-off notes, Environment, HR audit (TASK-015) (+13 more)

### Community 57 - "ref_node_path"
Cohesion: 0.09
Nodes (16): METRICS, rows, files(), root, appFiles, files(), rel(), root (+8 more)

### Community 58 - "LeaveTrack UI — Design System"
Cohesion: 0.13
Nodes (14): Backlog, Color tokens, Components, Core, Iconography, Layout & breakpoints, Leave types, LeaveTrack UI — Design System (+6 more)

### Community 59 - "AppError"
Cohesion: 0.19
Nodes (12): POST, markNotificationsReadAction(), AppError, ERROR_STATUS, getMarkReadDeps(), createPostgresNotificationReadStore(), markNotificationsRead(), MarkReadDeps (+4 more)

### Community 60 - "getAuthProvider"
Cohesion: 0.14
Nodes (21): ConfirmQuery, GET, setPasswordAction(), SetPasswordState, dynamic, metadata, SetPasswordPage(), ForgotPasswordState (+13 more)

### Community 61 - "approval-queue.tsx"
Cohesion: 0.21
Nodes (28): ApprovalQueue(), ApprovalQueueProps, BalanceHint(), ActionBadge(), AuditTable(), EmptyState(), EmptyStateProps, LeaveTypeBadge() (+20 more)

### Community 62 - "set-task-status.mjs"
Cohesion: 0.20
Nodes (6): RFC-4180, matches, previous, STATUSES, [taskId, status, csvArg], temp

### Community 63 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Inspect changes, 2 — Stage deliberately, 3 — Write the commit message, 4 — Confirm, /commit, Steps, When to use

### Community 64 - "/dev-tasks-planner"
Cohesion: 0.12
Nodes (17): APPLY — Generate the CSV(s) programmatically, Arguments, /dev-tasks-planner, EVALUATE — Read the source material and the real repo state, Every `Blocked` row cites the exact reason and states the fallback, Every `Done` row states its own Day-1 forward path, Every task cites the project's own established patterns by name, not generic prose, File structure and exact schema (+9 more)

### Community 65 - "openapi.ts"
Cohesion: 0.17
Nodes (17): buildOpenApiDocument(), ComponentName, COMPONENTS, COOKIE, errors(), input(), JsonSchema, parameters() (+9 more)

### Community 66 - "Backlog (deferred, owner = Day 1 team)"
Cohesion: 0.15
Nodes (8): Backlog (deferred, owner = Day 1 team), Coverage baseline (TASK-021, 2026-11-26), EPIC 2 planning (2026-11-26), Fixed in VALIDATE, Retro — Day 0 scaffold (2026-11-24), What went well, balancesFor(), reads()

### Community 67 - "idle-session-guard.tsx"
Cohesion: 0.18
Nodes (27): CancelRequestButton(), ACTIVITY_EVENTS, IdleSessionGuard(), IdleSessionGuardProps, AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent() (+19 more)

### Community 69 - "Revision v1.1 — EPIC 2 (2026-11-26)"
Cohesion: 0.12
Nodes (16): API additions (planned), API Design (selected), Architecture Document — LeaveTrack v1.0, Considered and not adopted, Data Model, Data model additions (planned), Deployment changes, Deployment Topology (+8 more)

### Community 70 - "openapi.test.ts"
Cohesion: 0.12
Nodes (13): LeaveRequestViewSchema, SessionTiming, AuditHistoryFilter, CancelLeaveRequestResult, EmployeeAuditHistory, SubmitLeaveRequestResult, @seriousme/openapi-schema-validator, Doc (+5 more)

### Community 71 - "provider.ts"
Cohesion: 0.08
Nodes (24): CookieIO, CookieJar, CookieToSet, LEGACY_SESSION_COOKIES, SESSION_MAX_AGE_SECONDS, sessionCookieOptions(), AuthProvider, EmailLinkType (+16 more)

### Community 72 - "roles.ts"
Cohesion: 0.18
Nodes (14): canAccess(), isPublicPath(), isRole(), matches(), MAX_REDIRECT_LENGTH, NEVER_REDIRECT_TO, PUBLIC_PATHS, REDIRECT_BASES (+6 more)

### Community 74 - "AGENTS.md — LeaveTrack"
Cohesion: 0.20
Nodes (9): AGENTS.md — LeaveTrack, Frontend standards, Git conventions, Project, Quality gates (must pass before merge), Security rules, Stack, Task tracking (+1 more)

### Community 75 - "submit.ts"
Cohesion: 0.15
Nodes (21): Session, todayUtc(), DecideLeaveRequestResult, DecideWarning, SubmitWarning, toRequestView(), CancelDeps, RequestIdSchema (+13 more)

### Community 76 - "utils.ts"
Cohesion: 0.43
Nodes (4): STATUS_META, Badge(), badgeVariants, class-variance-authority

### Community 77 - "decide.test.ts"
Cohesion: 0.11
Nodes (17): ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox, Consequences, Context, Decision, Implementation note (TASK-030), Notifier, ANA, audit() (+9 more)

### Community 79 - "Steps"
Cohesion: 0.22
Nodes (8): 0 — Run code review first, 1 — Gather context, 2 — Draft the PR, 3 — Push and open the PR, 4 — Output, /create-pr, Steps, When to use

### Community 80 - "getSql"
Cohesion: 0.29
Nodes (7): selectRepository(), Driver, getSql(), globalForDb, wrap(), Where data goes, postgres

### Community 81 - "ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR, Consequences, Context, Decision, Implementation note (TASK-026)

### Community 82 - "ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions, Consequences, Context, Decision, Implementation note (TASK-029)

### Community 83 - "independence.test.ts"
Cohesion: 0.10
Nodes (19): decideLeaveRequest(), memoryDecideStore, DecideStore, BEN, ManagerSession, MAYA, notifier, run() (+11 more)

### Community 84 - "/scaffold"
Cohesion: 0.25
Nodes (7): APPLY — Generate the Complete Boilerplate, Ecosystem reference, EVALUATE — Understand the Architecture and Design, PLAN — Boilerplate + UI Shell + Project Rules, Prerequisites, /scaffold, VALIDATE — Validate Infrastructure + Design Fidelity

### Community 85 - "contract.test.ts"
Cohesion: 0.15
Nodes (14): AccrualResultSchema, CancelLeaveRequestResultSchema, DecideLeaveRequestResultSchema, EmployeeAuditHistorySchema, MyLeaveContextSchema, SubmitLeaveRequestResultSchema, successEnvelope(), ANA (+6 more)

### Community 87 - "login/actions.ts"
Cohesion: 0.12
Nodes (30): MockLoginSchema, next, passwordLoginAction(), PasswordLoginSchema, clientIp(), digest(), isSignInThrottled(), MAX_FAILURES_PER_EMAIL (+22 more)

### Community 88 - "ADR-LeaveTrack-E004 — Real Authentication: Supabase Auth with signed sessions"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E004 — Real Authentication: Supabase Auth with signed sessions, Consequences, Context, Decision, Options considered

### Community 89 - "local-scripts.test.ts"
Cohesion: 0.22
Nodes (8): LOCAL_HOSTS, run(), SECRET_VALUES, stub, stub, LOCAL_STATUS, makeStub(), root

### Community 90 - "getSession"
Cohesion: 0.17
Nodes (19): POST, POST, decideLeaveRequestAction(), cancelLeaveRequestAction(), submitLeaveRequestAction(), ErrorCode, isAppError(), getSession (+11 more)

### Community 91 - "leave-request.ts"
Cohesion: 0.31
Nodes (7): DecisionInput, DecisionSchema, LeaveRequestInput, LeaveRequestSchema, RejectReasonSchema, spanDays(), valid

### Community 92 - "balance-writers.test.ts"
Cohesion: 0.31
Nodes (8): appFiles, files(), MOCK_FIELD, normalise(), root, Table, writersOf(), writesTable()

### Community 93 - "reset/route.ts"
Cohesion: 0.22
Nodes (9): notFound(), POST(), tokenMatches(), ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering, Consequences, Context, Decision, Options considered (+1 more)

### Community 94 - "invite-user.mjs"
Cohesion: 0.29
Nodes (7): Email, inviteUser(), main(), MESSAGES, hostOf(), isLocalUrl(), USER

### Community 95 - "next"
Cohesion: 0.14
Nodes (22): ApprovalsPage(), metadata, BalancePage(), metadata, AuthenticatedLayout(), metadata, NotificationsPage(), metadata (+14 more)

### Community 96 - "instrumentation.ts"
Cohesion: 0.38
Nodes (3): register(), assertEnvOrExit(), register()

### Community 97 - "decision-dialog.tsx"
Cohesion: 0.24
Nodes (13): DecisionDialog(), confirm(), handleOpenChange(), DecisionDialogProps, Dialog(), DialogContent(), DialogDescription(), DialogFooter() (+5 more)

### Community 98 - "action-errors.test.ts"
Cohesion: 0.33
Nodes (4): getSession, input, service, code()

### Community 99 - "ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port, Consequences, Context, Decision, Options considered

### Community 100 - "fixtures.ts"
Cohesion: 0.06
Nodes (26): buildBalanceSummaries(), PendingRange, BALANCE_ROWS, LAST_ACCRUAL_AT, leaveBalances, leavePolicies, leaveRequests, byId() (+18 more)

### Community 102 - "next.config.ts"
Cohesion: 0.50
Nodes (3): csp, nextConfig, securityHeaders

### Community 103 - "data/types.ts"
Cohesion: 0.09
Nodes (32): MobileNav(), activeHref(), NAV_ITEMS, NavItem, navItemsFor(), GROUP_LABEL, SidebarNav(), SidebarNavProps (+24 more)

### Community 106 - "env.ts"
Cohesion: 0.13
Nodes (16): DEPLOYED_APP_ENVS, DEPLOYED_VERCEL_ENVS, EnvSchema, IdleTimeoutMinutesSchema, isLocalUrl(), LOCAL_HOSTS, LOCAL_ONLY_WHEN_NOT_DEPLOYED, optionalSecret (+8 more)

### Community 107 - "local-env.mjs"
Cohesion: 0.43
Nodes (5): main(), managedValues(), planEnvFile(), unquote(), URL_KEYS

### Community 108 - "set-task-status.test.ts"
Cohesion: 0.29
Nodes (3): dir, root, script

### Community 109 - "data/dates.ts"
Cohesion: 0.13
Nodes (19): API route handlers, Coding Standards — LeaveTrack, Database, Dependencies, Hard-won rules (from Day 0 VALIDATE), Logging, Next.js 16, Testing (+11 more)

## Knowledge Gaps
- **707 isolated node(s):** `@commitlint/config-conventional`, `uvx`, `nexus-mcp`, `semi`, `singleQuote` (+702 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 863 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `package.json`, `submit.test.ts`, `e2e/helpers.ts`, `account-actions.test.ts`, `mock/store.ts`, `leave-requests/route.ts`, `request-form.tsx`, `heartbeat-route.test.ts`, `approval-routing.test.ts`, `session-renewal.test.ts`, `notifications.test.ts`, `balance-ledger.test.ts`, `ref_node_path`, `AppError`, `approval-queue.tsx`, `idle-session-guard.tsx`, `openapi.test.ts`, `provider.ts`, `roles.ts`, `submit.ts`, `decide.test.ts`, `independence.test.ts`, `contract.test.ts`, `login/actions.ts`, `local-scripts.test.ts`, `leave-request.ts`, `balance-writers.test.ts`, `invite-user.mjs`, `instrumentation.ts`, `action-errors.test.ts`, `fixtures.ts`, `env.ts`, `set-task-status.test.ts`, `data/dates.ts`, `coverage-summary.test.ts`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `vitest`, `package.json`, `submit.test.ts`, `account-actions.test.ts`, `mock/store.ts`, `leave-requests/route.ts`, `request-form.tsx`, `heartbeat-route.test.ts`, `app/layout.tsx`, `session-renewal.test.ts`, `dashboard/page.tsx`, `Button`, `AppError`, `getAuthProvider`, `approval-queue.tsx`, `provider.ts`, `roles.ts`, `contract.test.ts`, `login/actions.ts`, `getSession`, `reset/route.ts`, `fixtures.ts`, `next.config.ts`, `data/types.ts`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `LeaveRepository` connect `fixtures.ts` to `Backlog (deferred, owner = Day 1 team)`, `openapi.test.ts`, `approval-routing.test.ts`, `submit.test.ts`, `notifications.test.ts`, `independence.test.ts`, `balance-ledger.test.ts`, `Database`, `next`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `uvx`, `nexus-mcp` to the rest of the system?**
  _707 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Business Requirements Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `vitest` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._