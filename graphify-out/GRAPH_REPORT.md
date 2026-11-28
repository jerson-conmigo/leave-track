# Graph Report - leave-track  (2026-11-28)

## Corpus Check
- 299 files · ~138,212 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 6, .csv 2, .example 1)

## Summary
- 1794 nodes · 4561 edges · 107 communities (93 shown, 14 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 115 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e3137250`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Business Requirements Document — LeaveTrack v1.0
- store.test.ts
- ADR-LeaveTrack-E001 — Auth & Session Strategy
- Product Requirements Document — LeaveTrack v1.0
- package.json
- Architecture Document — LeaveTrack v1.0
- compilerOptions
- devDependencies
- dependencies
- scripts
- components.json
- repositories.ts
- Step 3: Review
- /epav
- Steps
- Review Checklist
- Review Checklist
- Review Checklist
- Review Checklist
- auth.spec.ts
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
- postgres.ts
- login/page.tsx
- cn
- app/layout.tsx
- dev-accounts.ts
- session-renewal.test.ts
- fixtures.ts
- sign-in-throttle.test.ts
- approval-queue.tsx
- local-scripts.test.ts
- Prove the test can fail (from TASK-010)
- db/helpers.ts
- decision-dialog.tsx
- memory-parity.test.ts
- action-errors.test.ts
- implement-api-route.md
- implement-ui-component.md
- write-migration.md
- request-form.tsx
- idle-session-guard.tsx
- types.ts
- Notifier
- independence.test.ts
- heartbeat-route.test.ts
- roles.ts
- isDeployedEnv
- openapi.test.ts
- mobile-nav.tsx
- decide.test.ts
- vercel.json
- Button
- Coding Standards — LeaveTrack
- provider.ts
- Steps
- /scaffold
- /dev-tasks-planner
- Database
- instrumentation.ts
- Steps
- LeaveTrack UI — Design System
- ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR
- ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions
- vitest
- ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port
- repository.ts
- set-task-status.mjs
- schema.test.ts
- local-env.test.ts
- env.ts
- leave-requests/route.test.ts
- balance-writers.test.ts
- utils.ts
- local-env.mjs
- with-error-handler.ts
- openapi.ts
- buildOpenApiDocument
- reset/route.ts
- decide.ts
- AppError
- leave-request.ts
- decimal.ts
- next
- approval-routing.test.ts
- coverage-summary.mjs

## God Nodes (most connected - your core abstractions)
1. `cn()` - 102 edges
2. `vitest` - 71 edges
3. `next` - 51 edges
4. `Button()` - 37 edges
5. `lucide-react` - 33 edges
6. `AppError` - 28 edges
7. `scripts` - 28 edges
8. `react` - 27 edges
9. `USER_IDS` - 26 edges
10. `getAuthProvider()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `Measure layout only after it settles (from TASK-055)` --references--> `FormControl()`  [INFERRED]
  knowledge/patterns/implement-and-test.md → components/ui/form.tsx
- `Layout & breakpoints` --references--> `Sheet()`  [INFERRED]
  knowledge/design-system.md → components/ui/sheet.tsx
- `API route handlers` --references--> `withErrorHandler()`  [INFERRED]
  knowledge/rules/coding-standards.md → lib/api/with-error-handler.ts
- `Day 1 hand-off notes` --references--> `LeaveRepository`  [INFERRED]
  README.md → lib/data/repositories.ts
- `Where data goes` --references--> `getSql()`  [INFERRED]
  README.md → lib/db/postgres.ts

## Import Cycles
- None detected.

## Communities (107 total, 14 thin omitted)

### Community 0 - "Business Requirements Document — LeaveTrack v1.0"
Cohesion: 0.09
Nodes (21): Additional Functional Requirements, Additional Risks, Additional Stakeholder Concerns, Additional Success Criteria, Assumptions, Business Context, Business Requirements Document — LeaveTrack v1.0, Constraints (+13 more)

### Community 1 - "store.test.ts"
Cohesion: 0.30
Nodes (10): createMemoryRateLimitStore(), globalForRateLimit, memoryRateLimitStore, createPostgresRateLimitStore(), BUCKET_SECONDS, bucketStart(), RateLimitStore, RETAIN_SECONDS (+2 more)

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

### Community 11 - "repositories.ts"
Cohesion: 0.07
Nodes (49): AGENTS.md — LeaveTrack, Frontend standards, Git conventions, Project, Quality gates (must pass before merge), Security rules, Stack, Task tracking (+41 more)

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

### Community 19 - "auth.spec.ts"
Cohesion: 0.06
Nodes (50): OPERATIONS, enlargeText(), expectNoHorizontalOverflow(), expectNotUnderHeader(), expectSelectsNotClipped(), expectTapTargets(), expectVisibleFocus(), focusedLabel() (+42 more)

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
Cohesion: 0.15
Nodes (12): LEGACY_SESSION_COOKIES, SESSION_COOKIE, sessionCookieOptions(), mockAuthProvider, NOT_LINKED_MESSAGE, WritableJar, state, fakeJar() (+4 more)

### Community 26 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Orient with your knowledge graph (if one exists), 2 — Load context in priority order, 3 — Output this summary, nothing else, 4 — Stop, Arguments, /evaluate, Steps

### Community 27 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Blast radius check, 2 — Write the implementation blueprint, 3 — State constraints, 4 — Stop and wait, /plan, Prerequisite, Steps

### Community 28 - "login/actions.ts"
Cohesion: 0.12
Nodes (28): ConfirmQuery, GET, setPasswordAction(), SetPasswordState, dynamic, metadata, SetPasswordPage(), ForgotPasswordState (+20 more)

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

### Community 36 - "postgres.ts"
Cohesion: 0.22
Nodes (8): dynamic, GET, selectRepository(), Driver, getSql(), globalForDb, wrap(), env

### Community 37 - "login/page.tsx"
Cohesion: 0.11
Nodes (44): AuditPage(), metadata, one(), forgotPasswordAction(), dynamic, ForgotPasswordPage(), metadata, LoginState (+36 more)

### Community 38 - "cn"
Cohesion: 0.13
Nodes (25): UserMenu(), UserMenuProps, Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage() (+17 more)

### Community 39 - "app/layout.tsx"
Cohesion: 0.25
Nodes (5): metadata, RootLayout(), viewport, Toaster(), geist

### Community 40 - "dev-accounts.ts"
Cohesion: 0.24
Nodes (10): DEV_LOGIN_HOSTS, DevAccount, devLoginAccountsEnabled(), isDevLoginHost(), LOCAL_DEV_PASSWORD, RawEnv, ROLE_ORDER, toDevAccounts() (+2 more)

### Community 41 - "session-renewal.test.ts"
Cohesion: 0.20
Nodes (14): proxyCookieIO(), HEARTBEAT_INTERVAL_SECONDS, HEARTBEAT_PATH, sessionPolicy, shouldRenew(), TOUCH_INTERVAL_SECONDS, WARNING_SECONDS, renewSession() (+6 more)

### Community 42 - "fixtures.ts"
Cohesion: 0.08
Nodes (27): accrualRuns, auditLog, BALANCE_ROWS, LAST_ACCRUAL_AT, LEAVE_TYPE_IDS, leaveBalances, leavePolicies, leaveRequests (+19 more)

### Community 43 - "sign-in-throttle.test.ts"
Cohesion: 0.18
Nodes (14): digest(), isSignInThrottled(), MAX_FAILURES_PER_EMAIL, MAX_FAILURES_PER_IP, recordSignInFailure(), SIGN_IN_WINDOW_SECONDS, signInKeys, THROTTLED_MESSAGE (+6 more)

### Community 44 - "approval-queue.tsx"
Cohesion: 0.21
Nodes (29): ApprovalQueue(), ApprovalQueueProps, BalanceHint(), ActionBadge(), AuditTable(), EmptyState(), EmptyStateProps, LeaveTypeBadge() (+21 more)

### Community 45 - "local-scripts.test.ts"
Cohesion: 0.17
Nodes (21): listAllAuthUsers(), LOCAL_DEV_PASSWORD, main(), planSeed(), pushArgs(), assertLocal(), exitWith(), LOCAL_HOSTS (+13 more)

### Community 46 - "Prove the test can fail (from TASK-010)"
Cohesion: 0.08
Nodes (24): DialogTrigger(), "Authorize before any database access" — prove it with a repository spy (from TASK-015), Browser e2e recipe (from TASK-016), Changing tooling versions: diff the resolved config, measure before thresholding (from TASK-021), Cross-cutting invariants: matrix + writer registry (from TASK-018), Defense in depth for "exactly once" writes (from TASK-014), Fail-closed configuration: test build time and runtime separately (from TASK-019), Headless browser tests with Radix overlays (+16 more)

### Community 48 - "db/helpers.ts"
Cohesion: 0.11
Nodes (25): B30 — PGlite lifecycle and CI memory (2026-11-26), SqlClient, SqlRow, @electric-sql/pglite, balances(), DEC, track, insertPending() (+17 more)

### Community 50 - "decision-dialog.tsx"
Cohesion: 0.25
Nodes (13): DecisionDialog(), confirm(), handleOpenChange(), DecisionDialogProps, Dialog(), DialogContent(), DialogDescription(), DialogFooter() (+5 more)

### Community 52 - "memory-parity.test.ts"
Cohesion: 0.15
Nodes (22): getAccrualDeps(), memoryAccrualStore, currentPeriod(), monthsToAccrue(), nextPeriod(), createPostgresAccrualStore(), AccrualDeps, MAX_CATCH_UP_MONTHS (+14 more)

### Community 53 - "action-errors.test.ts"
Cohesion: 0.14
Nodes (11): getSession, input, service, appFiles, code(), files(), rel(), root (+3 more)

### Community 57 - "request-form.tsx"
Cohesion: 0.15
Nodes (19): EMPTY, RequestForm(), RequestFormProps, FormControl(), FormDescription(), FormField(), FormFieldContext, FormFieldContextValue (+11 more)

### Community 58 - "idle-session-guard.tsx"
Cohesion: 0.17
Nodes (26): ACTIVITY_EVENTS, IdleSessionGuard(), IdleSessionGuardProps, AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription() (+18 more)

### Community 59 - "types.ts"
Cohesion: 0.08
Nodes (27): availableForRequest(), buildBalanceSummaries(), PendingRange, UserRow, LeaveRepository, AccrualRun, AUDIT_LOG_LIMIT, AuditAction (+19 more)

### Community 60 - "Notifier"
Cohesion: 0.29
Nodes (5): ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox, Consequences, Context, Decision, Notifier

### Community 61 - "independence.test.ts"
Cohesion: 0.09
Nodes (26): createPostgresRepository(), LeaveTypeName, toIso(), toNumber(), createPostgresDecideStore(), createPostgresSubmitStore(), DecidedRow, RequestRow (+18 more)

### Community 62 - "heartbeat-route.test.ts"
Cohesion: 0.11
Nodes (26): renewSessionToken(), getSessionSecret(), globalForSession, isClaims(), MAX_TOKEN_LENGTH, newSessionId(), renewClaims(), SessionClaims (+18 more)

### Community 63 - "roles.ts"
Cohesion: 0.05
Nodes (41): activeHref(), NAV_ITEMS, NavItem, navItemsFor(), GROUP_LABEL, SidebarNavProps, API Design (selected), Architecture Document — LeaveTrack v1.0 (+33 more)

### Community 64 - "isDeployedEnv"
Cohesion: 0.19
Nodes (10): ASSETS, dynamic, GET, dynamic, GET, dynamic, GET, fail() (+2 more)

### Community 65 - "openapi.test.ts"
Cohesion: 0.12
Nodes (16): SessionTiming, AccrualResult, DecideLeaveRequestResult, MyLeaveContext, SubmitLeaveRequestResult, TeamQueue, AuditParamsSchema, AuditQuerySchema (+8 more)

### Community 66 - "mobile-nav.tsx"
Cohesion: 0.25
Nodes (14): AppShell(), AppShellProps, Brand(), MobileNav(), SidebarNav(), Sheet(), SheetContent(), SheetDescription() (+6 more)

### Community 67 - "decide.test.ts"
Cohesion: 0.19
Nodes (11): ANA, audit(), balance(), BEN, CARLA, decide(), MAYA, R (+3 more)

### Community 69 - "Button"
Cohesion: 0.30
Nodes (9): AppError(), ForbiddenPage(), metadata, NotFound(), StatusScreen(), StatusScreenProps, Button(), lucide-react (+1 more)

### Community 70 - "Coding Standards — LeaveTrack"
Cohesion: 0.18
Nodes (10): API route handlers, Coding Standards — LeaveTrack, Dependencies, Hard-won rules (from Day 0 VALIDATE), Logging, Next.js 16, Testing, TypeScript (+2 more)

### Community 71 - "provider.ts"
Cohesion: 0.09
Nodes (16): CookieIO, CookieToSet, SESSION_MAX_AGE_SECONDS, AuthProvider, EmailLinkType, ProviderResult, sessionTokens, supabaseAuthProvider (+8 more)

### Community 72 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Inspect changes, 2 — Stage deliberately, 3 — Write the commit message, 4 — Confirm, /commit, Steps, When to use

### Community 74 - "/scaffold"
Cohesion: 0.25
Nodes (7): APPLY — Generate the Complete Boilerplate, Ecosystem reference, EVALUATE — Understand the Architecture and Design, PLAN — Boilerplate + UI Shell + Project Rules, Prerequisites, /scaffold, VALIDATE — Validate Infrastructure + Design Fidelity

### Community 75 - "/dev-tasks-planner"
Cohesion: 0.11
Nodes (18): APPLY — Generate the CSV(s) programmatically, Arguments, /dev-tasks-planner, EVALUATE — Read the source material and the real repo state, Every `Blocked` row cites the exact reason and states the fallback, Every `Done` row states its own Day-1 forward path, Every task cites the project's own established patterns by name, not generic prose, File structure and exact schema (+10 more)

### Community 76 - "Database"
Cohesion: 0.11
Nodes (18): Accrual job (TASK-017), API documentation (TASK-057), Approvals (TASK-026), Database, Day 1 hand-off notes, Environment, HR audit (TASK-015), Known limitations (+10 more)

### Community 77 - "instrumentation.ts"
Cohesion: 0.38
Nodes (3): register(), assertEnvOrExit(), register()

### Community 79 - "Steps"
Cohesion: 0.22
Nodes (8): 0 — Run code review first, 1 — Gather context, 2 — Draft the PR, 3 — Push and open the PR, 4 — Output, /create-pr, Steps, When to use

### Community 80 - "LeaveTrack UI — Design System"
Cohesion: 0.13
Nodes (14): Backlog, Color tokens, Components, Core, Iconography, Layout & breakpoints, Leave types, LeaveTrack UI — Design System (+6 more)

### Community 81 - "ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR, Consequences, Context, Decision, Implementation note (TASK-026)

### Community 82 - "ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions, Consequences, Context, Decision

### Community 83 - "vitest"
Cohesion: 0.11
Nodes (11): vitest, getSession, root, git(), ignored(), root, El, timing (+3 more)

### Community 84 - "ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port, Consequences, Context, Decision, Options considered

### Community 85 - "repository.ts"
Cohesion: 0.27
Nodes (8): Database, utcDay(), utcMonthBounds(), withinUtcDays(), byId(), toView(), typeOf(), userName()

### Community 87 - "set-task-status.mjs"
Cohesion: 0.20
Nodes (6): RFC-4180, matches, previous, STATUSES, [taskId, status, csvArg], temp

### Community 88 - "schema.test.ts"
Cohesion: 0.17
Nodes (9): AUDIT_ACTIONS, LEAVE_TYPE_NAMES, REQUEST_STATUSES, ROLES, ARCH_TABLES, attempt(), EXPECTED_COLUMNS, EXPECTED_FKS (+1 more)

### Community 89 - "local-env.test.ts"
Cohesion: 0.14
Nodes (8): dir, script, run(), SECRET_VALUES, stub, LOCAL_STATUS, makeStub(), root

### Community 90 - "env.ts"
Cohesion: 0.13
Nodes (16): DEPLOYED_APP_ENVS, DEPLOYED_VERCEL_ENVS, EnvSchema, IdleTimeoutMinutesSchema, isLocalUrl(), LOCAL_HOSTS, LOCAL_ONLY_WHEN_NOT_DEPLOYED, optionalSecret (+8 more)

### Community 91 - "leave-requests/route.test.ts"
Cohesion: 0.18
Nodes (7): ANA_SESSION, BEN_SESSION, BENS_TEAM, CARLA_SESSION, getSession, Row, validBody

### Community 92 - "balance-writers.test.ts"
Cohesion: 0.31
Nodes (8): appFiles, files(), MOCK_FIELD, normalise(), root, Table, writersOf(), writesTable()

### Community 93 - "utils.ts"
Cohesion: 0.36
Nodes (5): LEAVE_TYPE_META, STATUS_META, Badge(), badgeVariants, class-variance-authority

### Community 94 - "local-env.mjs"
Cohesion: 0.15
Nodes (14): postgres, @supabase/supabase-js, Email, inviteUser(), main(), MESSAGES, hostOf(), isLocalUrl() (+6 more)

### Community 95 - "with-error-handler.ts"
Cohesion: 0.18
Nodes (14): Backend standards, submitLeaveRequestAction(), API additions (planned), Example — TASK-014 (approve/reject), ErrorCode, isAppError(), RouteHandler, withErrorHandler() (+6 more)

### Community 96 - "openapi.ts"
Cohesion: 0.09
Nodes (33): ComponentName, COOKIE, JsonSchema, STATUS_TEXT, AccrualResultSchema, AuditEventSchema, AuditRequestRecordSchema, BalanceSummarySchema (+25 more)

### Community 97 - "buildOpenApiDocument"
Cohesion: 0.32
Nodes (8): buildOpenApiDocument(), COMPONENTS, errors(), input(), parameters(), ref(), success(), without()

### Community 98 - "reset/route.ts"
Cohesion: 0.22
Nodes (9): notFound(), POST(), tokenMatches(), ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering, Consequences, Context, Decision, Options considered (+1 more)

### Community 99 - "decide.ts"
Cohesion: 0.20
Nodes (17): decideLeaveRequestAction(), Session, toRequestView(), countDays(), DecideDeps, decideLeaveRequest(), RequestIdSchema, getDecideDeps() (+9 more)

### Community 100 - "AppError"
Cohesion: 0.25
Nodes (14): GET, POST, GET, NO_STORE, POST, dynamic, POST, AppError (+6 more)

### Community 102 - "leave-request.ts"
Cohesion: 0.32
Nodes (6): DecisionInput, DecisionSchema, LeaveRequestInput, LeaveRequestSchema, RejectReasonSchema, valid

### Community 103 - "decimal.ts"
Cohesion: 0.73
Nodes (4): addDays(), fromHundredths(), sumDays(), toHundredths()

### Community 104 - "next"
Cohesion: 0.14
Nodes (10): authorized(), GET, handler(), POST, csp, nextConfig, securityHeaders, next (+2 more)

### Community 105 - "approval-routing.test.ts"
Cohesion: 0.10
Nodes (22): LeaveRequest, Approver, approverLabel(), canDecide(), hasApprover(), Person, memoryDecideStore, BalanceContext (+14 more)

## Knowledge Gaps
- **674 isolated node(s):** `@commitlint/config-conventional`, `uvx`, `nexus-mcp`, `semi`, `singleQuote` (+669 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 817 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `store.test.ts`, `package.json`, `auth.spec.ts`, `account-actions.test.ts`, `dev-accounts.ts`, `session-renewal.test.ts`, `fixtures.ts`, `sign-in-throttle.test.ts`, `approval-queue.tsx`, `local-scripts.test.ts`, `db/helpers.ts`, `memory-parity.test.ts`, `action-errors.test.ts`, `idle-session-guard.tsx`, `types.ts`, `independence.test.ts`, `heartbeat-route.test.ts`, `roles.ts`, `isDeployedEnv`, `openapi.test.ts`, `decide.test.ts`, `provider.ts`, `instrumentation.ts`, `repository.ts`, `schema.test.ts`, `local-env.test.ts`, `env.ts`, `leave-requests/route.test.ts`, `balance-writers.test.ts`, `local-env.mjs`, `with-error-handler.ts`, `openapi.ts`, `decide.ts`, `AppError`, `leave-request.ts`, `decimal.ts`, `next`, `approval-routing.test.ts`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `package.json`, `repositories.ts`, `account-actions.test.ts`, `login/actions.ts`, `login/page.tsx`, `app/layout.tsx`, `session-renewal.test.ts`, `fixtures.ts`, `approval-queue.tsx`, `heartbeat-route.test.ts`, `roles.ts`, `isDeployedEnv`, `mobile-nav.tsx`, `Button`, `leave-requests/route.test.ts`, `with-error-handler.ts`, `openapi.ts`, `reset/route.ts`, `decide.ts`, `AppError`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `scripts` connect `scripts` to `package.json`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `uvx`, `nexus-mcp` to the rest of the system?**
  _674 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Business Requirements Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `Architecture Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._