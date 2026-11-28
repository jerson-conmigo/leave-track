# Graph Report - leave-track  (2026-11-28)

## Corpus Check
- 303 files · ~142,810 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 6, .csv 2, .example 1)

## Summary
- 1825 nodes · 4707 edges · 109 communities (95 shown, 14 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 120 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eb036264`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Business Requirements Document — LeaveTrack v1.0
- session-renewal.test.ts
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
- login/actions.ts
- .prettierrc.json
- pr-verifier.md
- Steps
- Steps
- nexus
- extends
- postcss.config.mjs
- mobile-nav.tsx
- password-login-form.tsx
- cn
- app/layout.tsx
- login/page.tsx
- proxy.ts
- vitest
- schema.test.ts
- approval-queue.tsx
- local-scripts.test.ts
- Prove the test can fail (from TASK-010)
- db/helpers.ts
- decision-dialog.tsx
- concurrency.test.ts
- Database
- implement-api-route.md
- implement-ui-component.md
- write-migration.md
- request-form.tsx
- idle-session-guard.tsx
- independence.test.ts
- balance-card.tsx
- /scaffold
- decide-memory.test.ts
- Steps
- isDeployedEnv
- Button
- openapi.ts
- /dev-tasks-planner
- vercel.json
- Revision v1.1 — EPIC 2 (2026-11-26)
- LeaveTrack UI — Design System
- provider.ts
- schemas.ts
- login-redirect.test.ts
- openapi.test.ts
- store.test.ts
- ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering
- Steps
- next
- ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR
- ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions
- set-task-status.mjs
- instrumentation.ts
- ref_node_path
- roles.ts
- withErrorHandler
- local-env.test.ts
- env.ts
- repository.ts
- balance-writers.test.ts
- ADR-LeaveTrack-E004 — Real Authentication: Supabase Auth with signed sessions
- invite-user.mjs
- contract.test.ts
- with-error-handler.ts
- ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox
- decide.test.ts
- Retro — Day 0 scaffold (2026-11-24)
- AppError
- ref_node_child_process
- Role
- leave-request.ts
- zod
- local-env.mjs
- set-task-status.test.ts
- types.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 102 edges
2. `vitest` - 72 edges
3. `next` - 51 edges
4. `Button()` - 37 edges
5. `lucide-react` - 33 edges
6. `AppError` - 28 edges
7. `scripts` - 28 edges
8. `USER_IDS` - 27 edges
9. `react` - 27 edges
10. `RequestForm()` - 26 edges

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

## Communities (109 total, 14 thin omitted)

### Community 0 - "Business Requirements Document — LeaveTrack v1.0"
Cohesion: 0.09
Nodes (21): Additional Functional Requirements, Additional Risks, Additional Stakeholder Concerns, Additional Success Criteria, Assumptions, Business Context, Business Requirements Document — LeaveTrack v1.0, Constraints (+13 more)

### Community 1 - "session-renewal.test.ts"
Cohesion: 0.09
Nodes (28): ErrorEnvelopeSchema, SessionTimingSchema, getSessionSecret(), globalForSession, isClaims(), MAX_TOKEN_LENGTH, newSessionId(), renewClaims() (+20 more)

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

### Community 11 - "approval-routing.test.ts"
Cohesion: 0.07
Nodes (42): Time-shift probe: find tests that depend on today's date (from TASK-027), Session, daysBefore(), todayUtc(), SubmitLeaveRequestResult, SubmitWarning, Approver, approverLabel() (+34 more)

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
Cohesion: 0.07
Nodes (48): OPERATIONS, daysFromToday(), enlargeText(), expectNoHorizontalOverflow(), expectNotUnderHeader(), expectSelectsNotClipped(), expectTapTargets(), expectVisibleFocus() (+40 more)

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
Cohesion: 0.14
Nodes (14): LEGACY_SESSION_COOKIES, SESSION_COOKIE, sessionCookieOptions(), mockAuthProvider, renewSessionToken(), NOT_LINKED_MESSAGE, renewSession(), WritableJar (+6 more)

### Community 26 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Orient with your knowledge graph (if one exists), 2 — Load context in priority order, 3 — Output this summary, nothing else, 4 — Stop, Arguments, /evaluate, Steps

### Community 27 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Blast radius check, 2 — Write the implementation blueprint, 3 — State constraints, 4 — Stop and wait, /plan, Prerequisite, Steps

### Community 28 - "login/actions.ts"
Cohesion: 0.11
Nodes (33): GET, setPasswordAction(), SetPasswordState, dynamic, metadata, SetPasswordPage(), endSessionAction(), loginAction() (+25 more)

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

### Community 36 - "mobile-nav.tsx"
Cohesion: 0.17
Nodes (17): AuthenticatedLayout(), dynamic, ForgotPasswordPage(), metadata, AppShell(), AppShellProps, Brand(), MobileNav() (+9 more)

### Community 37 - "password-login-form.tsx"
Cohesion: 0.16
Nodes (33): AuditPage(), metadata, one(), forgotPasswordAction(), LoginState, ALL_EMPLOYEES, AuditFilters(), AuditFiltersProps (+25 more)

### Community 38 - "cn"
Cohesion: 0.10
Nodes (30): UserMenu(), UserMenuProps, Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage() (+22 more)

### Community 39 - "app/layout.tsx"
Cohesion: 0.22
Nodes (6): metadata, RootLayout(), viewport, Toaster(), geist, sonner

### Community 40 - "login/page.tsx"
Cohesion: 0.18
Nodes (16): HIGHLIGHTS, LoginPage(), metadata, NOTICES, signedOutNotice(), SignedOutBroadcast(), DEV_LOGIN_HOSTS, DevAccount (+8 more)

### Community 41 - "proxy.ts"
Cohesion: 0.23
Nodes (12): proxyCookieIO(), SESSION_MAX_AGE_SECONDS, HEARTBEAT_INTERVAL_SECONDS, HEARTBEAT_PATH, sessionPolicy, shouldRenew(), TOUCH_INTERVAL_SECONDS, WARNING_SECONDS (+4 more)

### Community 42 - "vitest"
Cohesion: 0.08
Nodes (31): accrualRuns, auditLog, BALANCE_ROWS, LAST_ACCRUAL_AT, LEAVE_TYPE_IDS, leaveBalances, leavePolicies, leaveRequests (+23 more)

### Community 43 - "schema.test.ts"
Cohesion: 0.10
Nodes (19): AUDIT_ACTIONS, LEAVE_TYPE_NAMES, REQUEST_STATUSES, ROLES, createPostgresSubmitStore(), ARCH_TABLES, attempt(), EXPECTED_COLUMNS (+11 more)

### Community 44 - "approval-queue.tsx"
Cohesion: 0.20
Nodes (29): ApprovalQueue(), ApprovalQueueProps, BalanceHint(), ActionBadge(), AuditTable(), EmptyState(), EmptyStateProps, LeaveTypeBadge() (+21 more)

### Community 45 - "local-scripts.test.ts"
Cohesion: 0.18
Nodes (21): listAllAuthUsers(), LOCAL_DEV_PASSWORD, main(), planSeed(), pushArgs(), assertLocal(), exitWith(), LOCAL_HOSTS (+13 more)

### Community 46 - "Prove the test can fail (from TASK-010)"
Cohesion: 0.08
Nodes (24): DialogTrigger(), "Authorize before any database access" — prove it with a repository spy (from TASK-015), Browser e2e recipe (from TASK-016), Changing tooling versions: diff the resolved config, measure before thresholding (from TASK-021), Cross-cutting invariants: matrix + writer registry (from TASK-018), Defense in depth for "exactly once" writes (from TASK-014), Fail-closed configuration: test build time and runtime separately (from TASK-019), Headless browser tests with Radix overlays (+16 more)

### Community 48 - "db/helpers.ts"
Cohesion: 0.11
Nodes (25): B30 — PGlite lifecycle and CI memory (2026-11-26), AUDIT_LOG_LIMIT, SqlClient, @electric-sql/pglite, insertOldRequest(), track, insertPending(), MIA_REPORTS (+17 more)

### Community 50 - "decision-dialog.tsx"
Cohesion: 0.21
Nodes (15): DecisionDialog(), confirm(), handleOpenChange(), DecisionDialogProps, Dialog(), DialogContent(), DialogDescription(), DialogFooter() (+7 more)

### Community 52 - "concurrency.test.ts"
Cohesion: 0.06
Nodes (47): ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port, Consequences, Context, Decision, Options considered, API route handlers, Coding Standards — LeaveTrack, Database (+39 more)

### Community 53 - "Database"
Cohesion: 0.10
Nodes (19): Accrual job (TASK-017), API documentation (TASK-057), Approvals (TASK-026), Database, Day 1 hand-off notes, Environment, HR audit (TASK-015), Known limitations (+11 more)

### Community 57 - "request-form.tsx"
Cohesion: 0.15
Nodes (20): LEAVE_TYPE_META, EMPTY, localToday(), RequestForm(), RequestFormProps, shiftLocalDate(), FormControl(), FormDescription() (+12 more)

### Community 58 - "idle-session-guard.tsx"
Cohesion: 0.17
Nodes (26): ACTIVITY_EVENTS, IdleSessionGuard(), IdleSessionGuardProps, AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription() (+18 more)

### Community 59 - "independence.test.ts"
Cohesion: 0.14
Nodes (15): createMockDb(), resetMockDb(), memoryBackend(), memory(), ANA, BEN, Harness, HARNESSES (+7 more)

### Community 60 - "balance-card.tsx"
Cohesion: 0.19
Nodes (22): BalancePage(), metadata, DashboardPage(), metadata, StatCard(), Loading(), metadata, NewRequestPage() (+14 more)

### Community 61 - "/scaffold"
Cohesion: 0.25
Nodes (7): APPLY — Generate the Complete Boilerplate, Ecosystem reference, EVALUATE — Understand the Architecture and Design, PLAN — Boilerplate + UI Shell + Project Rules, Prerequisites, /scaffold, VALIDATE — Validate Infrastructure + Design Fidelity

### Community 62 - "decide-memory.test.ts"
Cohesion: 0.22
Nodes (8): decideLeaveRequest(), BEN, ManagerSession, MAYA, notifier, run(), SCRIPT, decide()

### Community 63 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Inspect changes, 2 — Stage deliberately, 3 — Write the commit message, 4 — Confirm, /commit, Steps, When to use

### Community 64 - "isDeployedEnv"
Cohesion: 0.16
Nodes (13): ASSETS, dynamic, GET, dynamic, GET, dynamic, GET, notFound() (+5 more)

### Community 65 - "Button"
Cohesion: 0.37
Nodes (8): AppError(), ForbiddenPage(), metadata, NotFound(), StatusScreen(), StatusScreenProps, Button(), lucide-react

### Community 66 - "openapi.ts"
Cohesion: 0.21
Nodes (15): buildOpenApiDocument(), ComponentName, COMPONENTS, COOKIE, errors(), input(), JsonSchema, parameters() (+7 more)

### Community 67 - "/dev-tasks-planner"
Cohesion: 0.12
Nodes (17): APPLY — Generate the CSV(s) programmatically, Arguments, /dev-tasks-planner, EVALUATE — Read the source material and the real repo state, Every `Blocked` row cites the exact reason and states the fallback, Every `Done` row states its own Day-1 forward path, Every task cites the project's own established patterns by name, not generic prose, File structure and exact schema (+9 more)

### Community 69 - "Revision v1.1 — EPIC 2 (2026-11-26)"
Cohesion: 0.12
Nodes (15): API Design (selected), Architecture Document — LeaveTrack v1.0, Considered and not adopted, Data Model, Data model additions (planned), Deployment changes, Deployment Topology, EPIC 2 decisions (adopted 2026-11-26) (+7 more)

### Community 70 - "LeaveTrack UI — Design System"
Cohesion: 0.13
Nodes (14): Backlog, Color tokens, Components, Core, Iconography, Layout & breakpoints, Leave types, LeaveTrack UI — Design System (+6 more)

### Community 71 - "provider.ts"
Cohesion: 0.10
Nodes (17): CookieIO, CookieJar, CookieToSet, AuthProvider, EmailLinkType, NO_PROVIDER_SESSION, ProviderResult, sessionTokens (+9 more)

### Community 72 - "schemas.ts"
Cohesion: 0.13
Nodes (14): AccrualResultSchema, AuditEventSchema, AuditRequestRecordSchema, BalanceSummarySchema, DecideWarningSchema, epochSeconds, ErrorCodeSchema, HealthSchema (+6 more)

### Community 75 - "openapi.test.ts"
Cohesion: 0.13
Nodes (12): SubmitLeaveRequestResultSchema, SessionTiming, AccrualResult, MyLeaveContext, TeamQueue, @seriousme/openapi-schema-validator, Doc, EXCLUDED (+4 more)

### Community 76 - "store.test.ts"
Cohesion: 0.26
Nodes (11): getRateLimitStore(), createMemoryRateLimitStore(), globalForRateLimit, memoryRateLimitStore, createPostgresRateLimitStore(), BUCKET_SECONDS, bucketStart(), RateLimitStore (+3 more)

### Community 77 - "ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering"
Cohesion: 0.29
Nodes (6): ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering, Consequences, Context, Decision, Options considered, Policy changes vs catch-up

### Community 79 - "Steps"
Cohesion: 0.22
Nodes (8): 0 — Run code review first, 1 — Gather context, 2 — Draft the PR, 3 — Push and open the PR, 4 — Output, /create-pr, Steps, When to use

### Community 80 - "next"
Cohesion: 0.11
Nodes (19): AGENTS.md — LeaveTrack, Frontend standards, Git conventions, Project, Quality gates (must pass before merge), Security rules, Stack, Task tracking (+11 more)

### Community 81 - "ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR, Consequences, Context, Decision, Implementation note (TASK-026)

### Community 82 - "ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions, Consequences, Context, Decision

### Community 83 - "set-task-status.mjs"
Cohesion: 0.20
Nodes (6): RFC-4180, matches, previous, STATUSES, [taskId, status, csvArg], temp

### Community 84 - "instrumentation.ts"
Cohesion: 0.38
Nodes (3): register(), assertEnvOrExit(), register()

### Community 85 - "ref_node_path"
Cohesion: 0.11
Nodes (13): METRICS, rows, files(), root, appFiles, files(), rel(), root (+5 more)

### Community 87 - "roles.ts"
Cohesion: 0.17
Nodes (14): isPublicPath(), isRole(), matches(), MAX_REDIRECT_LENGTH, NEVER_REDIRECT_TO, PUBLIC_PATHS, REDIRECT_BASES, REDIRECT_GUARDS (+6 more)

### Community 88 - "withErrorHandler"
Cohesion: 0.12
Nodes (20): Backend standards, decideLeaveRequestAction(), submitLeaveRequestAction(), API additions (planned), Example — TASK-014 (approve/reject), isAppError(), withErrorHandler(), ActionResult (+12 more)

### Community 89 - "local-env.test.ts"
Cohesion: 0.14
Nodes (8): dir, script, run(), SECRET_VALUES, stub, LOCAL_STATUS, makeStub(), root

### Community 90 - "env.ts"
Cohesion: 0.11
Nodes (19): dynamic, GET, DEPLOYED_APP_ENVS, DEPLOYED_VERCEL_ENVS, env, EnvSchema, IdleTimeoutMinutesSchema, isLocalUrl() (+11 more)

### Community 91 - "repository.ts"
Cohesion: 0.11
Nodes (26): availableForRequest(), buildBalanceSummaries(), PendingRange, utcDay(), utcMonthBounds(), withinUtcDays(), byId(), toView() (+18 more)

### Community 92 - "balance-writers.test.ts"
Cohesion: 0.31
Nodes (8): appFiles, files(), MOCK_FIELD, normalise(), root, Table, writersOf(), writesTable()

### Community 93 - "ADR-LeaveTrack-E004 — Real Authentication: Supabase Auth with signed sessions"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E004 — Real Authentication: Supabase Auth with signed sessions, Consequences, Context, Decision, Options considered

### Community 94 - "invite-user.mjs"
Cohesion: 0.21
Nodes (8): postgres, @supabase/supabase-js, Email, inviteUser(), main(), MESSAGES, hostOf(), USER

### Community 95 - "contract.test.ts"
Cohesion: 0.18
Nodes (12): DecideLeaveRequestResultSchema, EmployeeAuditHistorySchema, MyLeaveContextSchema, successEnvelope(), TeamQueueSchema, ANA, BEN, CARLA (+4 more)

### Community 96 - "with-error-handler.ts"
Cohesion: 0.19
Nodes (10): authorized(), GET, handler(), POST, RouteHandler, Logger, server-only, OK (+2 more)

### Community 97 - "ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox"
Cohesion: 0.29
Nodes (4): ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox, Consequences, Context, Decision

### Community 98 - "decide.test.ts"
Cohesion: 0.21
Nodes (10): ANA, audit(), balance(), BEN, CARLA, MAYA, R, requestRow() (+2 more)

### Community 99 - "Retro — Day 0 scaffold (2026-11-24)"
Cohesion: 0.33
Nodes (5): Coverage baseline (TASK-021, 2026-11-26), EPIC 2 planning (2026-11-26), Fixed in VALIDATE, Retro — Day 0 scaffold (2026-11-24), What went well

### Community 100 - "AppError"
Cohesion: 0.20
Nodes (17): GET, POST, GET, NO_STORE, POST, dynamic, POST, ConfirmQuery (+9 more)

### Community 102 - "ref_node_child_process"
Cohesion: 0.24
Nodes (6): assertPortFree(), probePort(), local, git(), ignored(), root

### Community 103 - "Role"
Cohesion: 0.31
Nodes (9): activeHref(), NAV_ITEMS, NavItem, navItemsFor(), GROUP_LABEL, SidebarNav(), SidebarNavProps, canAccess() (+1 more)

### Community 104 - "leave-request.ts"
Cohesion: 0.27
Nodes (8): DecisionInput, DecisionSchema, LeaveRequestInput, LeaveRequestSchema, MAX_LENGTH_MESSAGE, RejectReasonSchema, spanDays(), valid

### Community 105 - "zod"
Cohesion: 0.29
Nodes (6): ForgotPasswordState, ForgotPasswordSchema, PASSWORD_MAX, PASSWORD_MIN, SetPasswordSchema, zod

### Community 106 - "local-env.mjs"
Cohesion: 0.39
Nodes (6): isLocalUrl(), main(), managedValues(), planEnvFile(), unquote(), URL_KEYS

### Community 107 - "set-task-status.test.ts"
Cohesion: 0.29
Nodes (3): dir, root, script

### Community 109 - "types.ts"
Cohesion: 0.09
Nodes (24): Backlog (deferred, owner = Day 1 team), LeaveRepository, selectRepository(), AccrualRun, AuditAction, AuditEntryView, AuditEvent, AuditFilter (+16 more)

## Knowledge Gaps
- **677 isolated node(s):** `@commitlint/config-conventional`, `uvx`, `nexus-mcp`, `semi`, `singleQuote` (+672 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 822 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `session-renewal.test.ts`, `package.json`, `approval-routing.test.ts`, `e2e/helpers.ts`, `account-actions.test.ts`, `login/actions.ts`, `login/page.tsx`, `schema.test.ts`, `approval-queue.tsx`, `local-scripts.test.ts`, `db/helpers.ts`, `concurrency.test.ts`, `idle-session-guard.tsx`, `independence.test.ts`, `decide-memory.test.ts`, `isDeployedEnv`, `provider.ts`, `login-redirect.test.ts`, `openapi.test.ts`, `store.test.ts`, `instrumentation.ts`, `ref_node_path`, `roles.ts`, `withErrorHandler`, `local-env.test.ts`, `env.ts`, `repository.ts`, `balance-writers.test.ts`, `invite-user.mjs`, `contract.test.ts`, `with-error-handler.ts`, `decide.test.ts`, `AppError`, `ref_node_child_process`, `leave-request.ts`, `set-task-status.test.ts`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `session-renewal.test.ts`, `package.json`, `account-actions.test.ts`, `login/actions.ts`, `mobile-nav.tsx`, `password-login-form.tsx`, `app/layout.tsx`, `login/page.tsx`, `proxy.ts`, `vitest`, `approval-queue.tsx`, `balance-card.tsx`, `isDeployedEnv`, `Button`, `provider.ts`, `roles.ts`, `withErrorHandler`, `contract.test.ts`, `with-error-handler.ts`, `AppError`, `Role`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `Button`, `mobile-nav.tsx`, `password-login-form.tsx`, `Role`, `approval-queue.tsx`, `decision-dialog.tsx`, `concurrency.test.ts`, `request-form.tsx`, `idle-session-guard.tsx`, `balance-card.tsx`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `uvx`, `nexus-mcp` to the rest of the system?**
  _677 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Business Requirements Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `session-renewal.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08788159111933395 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._