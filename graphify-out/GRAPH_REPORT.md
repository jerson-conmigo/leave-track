# Graph Report - leave-track  (2026-11-27)

## Corpus Check
- 295 files · ~133,971 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 7, .csv 2, .example 1)

## Summary
- 1774 nodes · 4472 edges · 112 communities (98 shown, 14 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 115 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7b18635c`
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
- balance-card.tsx
- Step 3: Review
- /epav
- Steps
- Review Checklist
- Review Checklist
- Review Checklist
- Review Checklist
- session-token.ts
- Review Checklist
- Review Checklist
- Review Checklist
- Review Checklist
- Steps
- account-actions.test.ts
- Steps
- Steps
- next
- .prettierrc.json
- pr-verifier.md
- Steps
- Steps
- nexus
- extends
- postcss.config.mjs
- independence.test.ts
- password-login-form.tsx
- cn
- app/layout.tsx
- login/page.tsx
- roles.ts
- repo-hygiene.test.ts
- login/actions.ts
- approval-queue.tsx
- local-scripts.test.ts
- Prove the test can fail (from TASK-010)
- vitest
- decision-dialog.tsx
- memory-parity.test.ts
- AppError
- implement-api-route.md
- implement-ui-component.md
- write-migration.md
- request-form.tsx
- idle-session-guard.tsx
- contract.test.ts
- sign-in-throttle.test.ts
- Revision v1.1 — EPIC 2 (2026-11-26)
- auth.spec.ts
- session-renewal.test.ts
- with-error-handler.ts
- submit.test.ts
- mobile-nav.tsx
- types.ts
- vercel.json
- Button
- Coding Standards — LeaveTrack
- provider.ts
- Steps
- /scaffold
- openapi.ts
- Database
- schemas.ts
- Steps
- approvals/actions.ts
- ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR
- ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions
- action-errors.test.ts
- ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox
- decide.test.ts
- set-task-status.mjs
- local-env.mjs
- local-env.test.ts
- env.ts
- Retro — Day 0 scaffold (2026-11-24)
- balance-writers.test.ts
- repositories.ts
- ref_node_child_process
- LeaveTrack UI — Design System
- openapi.test.ts
- repository.ts
- reset/route.ts
- ref_node_fs
- local-only.mjs
- sidebar-nav.tsx
- decide.ts
- next.config.ts
- leave-request.ts
- utils.ts
- zod
- ADR-LeaveTrack-E004 — Real Authentication: Supabase Auth with signed sessions
- audit-route.test.ts
- postgres-repository.test.ts
- login-redirect.test.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 102 edges
2. `vitest` - 70 edges
3. `next` - 51 edges
4. `Button()` - 37 edges
5. `lucide-react` - 33 edges
6. `AppError` - 28 edges
7. `scripts` - 28 edges
8. `react` - 27 edges
9. `getAuthProvider()` - 25 edges
10. `USER_IDS` - 25 edges

## Surprising Connections (you probably didn't know these)
- `Measure layout only after it settles (from TASK-055)` --references--> `FormControl()`  [INFERRED]
  knowledge/patterns/implement-and-test.md → components/ui/form.tsx
- `Layout & breakpoints` --references--> `Sheet()`  [INFERRED]
  knowledge/design-system.md → components/ui/sheet.tsx
- `API route handlers` --references--> `withErrorHandler()`  [INFERRED]
  knowledge/rules/coding-standards.md → lib/api/with-error-handler.ts
- `Security changes` --references--> `safeRedirectPath()`  [INFERRED]
  docs/arch-docs/ARCH-LeaveTrack-v1.0.md → lib/auth/roles.ts
- `Decision` --references--> `requireRole()`  [INFERRED]
  docs/arch-docs/ADR-LeaveTrack-E004-Real-Authentication.md → lib/auth/session.ts

## Import Cycles
- None detected.

## Communities (112 total, 14 thin omitted)

### Community 0 - "Business Requirements Document — LeaveTrack v1.0"
Cohesion: 0.09
Nodes (21): Additional Functional Requirements, Additional Risks, Additional Stakeholder Concerns, Additional Success Criteria, Assumptions, Business Context, Business Requirements Document — LeaveTrack v1.0, Constraints (+13 more)

### Community 1 - "store.test.ts"
Cohesion: 0.25
Nodes (9): createMemoryRateLimitStore(), globalForRateLimit, createPostgresRateLimitStore(), BUCKET_SECONDS, bucketStart(), RateLimitStore, RETAIN_SECONDS, windowStart() (+1 more)

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

### Community 11 - "balance-card.tsx"
Cohesion: 0.28
Nodes (15): DashboardPage(), metadata, StatCard(), Loading(), NewRequestPage(), BalanceCard(), BalanceCardProps, BalanceCardSkeleton() (+7 more)

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

### Community 19 - "session-token.ts"
Cohesion: 0.09
Nodes (27): renewSessionToken(), getSessionSecret(), globalForSession, isClaims(), MAX_TOKEN_LENGTH, newSessionId(), renewClaims(), SessionClaims (+19 more)

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
Nodes (8): mockAuthProvider, memoryRateLimitStore, state, fakeJar(), FakeProvider, fakeSupabaseProvider(), state, state

### Community 26 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Orient with your knowledge graph (if one exists), 2 — Load context in priority order, 3 — Output this summary, nothing else, 4 — Stop, Arguments, /evaluate, Steps

### Community 27 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Blast radius check, 2 — Write the implementation blueprint, 3 — State constraints, 4 — Stop and wait, /plan, Prerequisite, Steps

### Community 28 - "next"
Cohesion: 0.12
Nodes (24): AGENTS.md — LeaveTrack, Frontend standards, Git conventions, Project, Quality gates (must pass before merge), Security rules, Stack, Task tracking (+16 more)

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

### Community 36 - "independence.test.ts"
Cohesion: 0.06
Nodes (44): accrualRuns, auditLog, BALANCE_ROWS, LAST_ACCRUAL_AT, LEAVE_TYPE_IDS, leaveBalances, leavePolicies, leaveTypes (+36 more)

### Community 37 - "password-login-form.tsx"
Cohesion: 0.14
Nodes (36): AuditPage(), metadata, one(), BalancePage(), metadata, forgotPasswordAction(), LoginState, ALL_EMPLOYEES (+28 more)

### Community 38 - "cn"
Cohesion: 0.12
Nodes (27): UserMenu(), UserMenuProps, Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage() (+19 more)

### Community 39 - "app/layout.tsx"
Cohesion: 0.22
Nodes (6): metadata, RootLayout(), viewport, Toaster(), geist, sonner

### Community 40 - "login/page.tsx"
Cohesion: 0.18
Nodes (16): HIGHLIGHTS, LoginPage(), metadata, NOTICES, signedOutNotice(), SignedOutBroadcast(), DEV_LOGIN_HOSTS, DevAccount (+8 more)

### Community 41 - "roles.ts"
Cohesion: 0.21
Nodes (13): TypeScript, canAccess(), isRole(), matches(), MAX_REDIRECT_LENGTH, NEVER_REDIRECT_TO, PUBLIC_PATHS, REDIRECT_BASES (+5 more)

### Community 42 - "repo-hygiene.test.ts"
Cohesion: 0.67
Nodes (3): git(), ignored(), root

### Community 43 - "login/actions.ts"
Cohesion: 0.18
Nodes (22): GET, setPasswordAction(), SetPasswordState, dynamic, metadata, SetPasswordPage(), endSessionAction(), loginAction() (+14 more)

### Community 44 - "approval-queue.tsx"
Cohesion: 0.21
Nodes (29): ApprovalQueue(), ApprovalQueueProps, BalanceHint(), ActionBadge(), AuditTable(), EmptyState(), EmptyStateProps, LeaveTypeBadge() (+21 more)

### Community 45 - "local-scripts.test.ts"
Cohesion: 0.19
Nodes (11): @supabase/supabase-js, listAllAuthUsers(), LOCAL_DEV_PASSWORD, main(), planSeed(), pushArgs(), exitWith(), LOCAL_HOSTS (+3 more)

### Community 46 - "Prove the test can fail (from TASK-010)"
Cohesion: 0.08
Nodes (24): DialogTrigger(), "Authorize before any database access" — prove it with a repository spy (from TASK-015), Browser e2e recipe (from TASK-016), Changing tooling versions: diff the resolved config, measure before thresholding (from TASK-021), Cross-cutting invariants: matrix + writer registry (from TASK-018), Defense in depth for "exactly once" writes (from TASK-014), Fail-closed configuration: test build time and runtime separately (from TASK-019), Headless browser tests with Radix overlays (+16 more)

### Community 48 - "vitest"
Cohesion: 0.09
Nodes (27): B30 — PGlite lifecycle and CI memory (2026-11-26), leaveRequests, AUDIT_LOG_LIMIT, @electric-sql/pglite, vitest, track, CASES, built() (+19 more)

### Community 50 - "decision-dialog.tsx"
Cohesion: 0.22
Nodes (14): DecisionDialog(), confirm(), handleOpenChange(), DecisionDialogProps, Dialog(), DialogContent(), DialogDescription(), DialogFooter() (+6 more)

### Community 52 - "memory-parity.test.ts"
Cohesion: 0.12
Nodes (24): getAccrualDeps(), memoryAccrualStore, currentPeriod(), monthsToAccrue(), nextPeriod(), createPostgresAccrualStore(), AccrualDeps, MAX_CATCH_UP_MONTHS (+16 more)

### Community 53 - "AppError"
Cohesion: 0.19
Nodes (19): GET, authorized(), GET, handler(), POST, POST, GET, NO_STORE (+11 more)

### Community 57 - "request-form.tsx"
Cohesion: 0.17
Nodes (18): EMPTY, RequestForm(), RequestFormProps, FormControl(), FormDescription(), FormField(), FormFieldContext, FormFieldContextValue (+10 more)

### Community 58 - "idle-session-guard.tsx"
Cohesion: 0.08
Nodes (45): APPLY — Generate the CSV(s) programmatically, Arguments, /dev-tasks-planner, EVALUATE — Read the source material and the real repo state, Every `Blocked` row cites the exact reason and states the fallback, Every `Done` row states its own Day-1 forward path, Every task cites the project's own established patterns by name, not generic prose, File structure and exact schema (+37 more)

### Community 59 - "contract.test.ts"
Cohesion: 0.15
Nodes (14): AccrualResultSchema, DecideLeaveRequestResultSchema, EmployeeAuditHistorySchema, HealthSchema, SubmitLeaveRequestResultSchema, successEnvelope(), TeamQueueSchema, ANA (+6 more)

### Community 60 - "sign-in-throttle.test.ts"
Cohesion: 0.20
Nodes (15): clientIp(), digest(), isSignInThrottled(), MAX_FAILURES_PER_EMAIL, MAX_FAILURES_PER_IP, recordSignInFailure(), SIGN_IN_WINDOW_SECONDS, signInKeys (+7 more)

### Community 61 - "Revision v1.1 — EPIC 2 (2026-11-26)"
Cohesion: 0.12
Nodes (15): API Design (selected), Architecture Document — LeaveTrack v1.0, Considered and not adopted, Data Model, Data model additions (planned), Deployment changes, Deployment Topology, EPIC 2 decisions (adopted 2026-11-26) (+7 more)

### Community 62 - "auth.spec.ts"
Cohesion: 0.06
Nodes (50): OPERATIONS, enlargeText(), expectNoHorizontalOverflow(), expectNotUnderHeader(), expectSelectsNotClipped(), expectTapTargets(), expectVisibleFocus(), focusedLabel() (+42 more)

### Community 63 - "session-renewal.test.ts"
Cohesion: 0.18
Nodes (16): proxyCookieIO(), SESSION_COOKIE, isPublicPath(), HEARTBEAT_INTERVAL_SECONDS, HEARTBEAT_PATH, sessionPolicy, shouldRenew(), TOUCH_INTERVAL_SECONDS (+8 more)

### Community 64 - "with-error-handler.ts"
Cohesion: 0.12
Nodes (20): Backend standards, ASSETS, dynamic, GET, dynamic, GET, dynamic, GET (+12 more)

### Community 65 - "submit.test.ts"
Cohesion: 0.22
Nodes (9): submitLeaveRequestAction(), getSubmitDeps(), createPostgresSubmitStore(), submitLeaveRequest(), ANA, CARLA, submit(), track (+1 more)

### Community 66 - "mobile-nav.tsx"
Cohesion: 0.19
Nodes (16): dynamic, ForgotPasswordPage(), metadata, AppShell(), AppShellProps, Brand(), MobileNav(), Sheet() (+8 more)

### Community 67 - "types.ts"
Cohesion: 0.07
Nodes (39): Backlog (deferred, owner = Day 1 team), availableForRequest(), buildBalanceSummaries(), PendingRange, createPostgresRepository(), UserRow, AccrualResult, AUDIT_ACTIONS (+31 more)

### Community 69 - "Button"
Cohesion: 0.37
Nodes (8): AppError(), ForbiddenPage(), metadata, NotFound(), StatusScreen(), StatusScreenProps, Button(), lucide-react

### Community 70 - "Coding Standards — LeaveTrack"
Cohesion: 0.20
Nodes (9): API route handlers, Coding Standards — LeaveTrack, Dependencies, Hard-won rules (from Day 0 VALIDATE), Logging, Next.js 16, Testing, UI (+1 more)

### Community 71 - "provider.ts"
Cohesion: 0.09
Nodes (19): CookieIO, CookieJar, CookieToSet, LEGACY_SESSION_COOKIES, SESSION_MAX_AGE_SECONDS, AuthProvider, EmailLinkType, NO_PROVIDER_SESSION (+11 more)

### Community 72 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Inspect changes, 2 — Stage deliberately, 3 — Write the commit message, 4 — Confirm, /commit, Steps, When to use

### Community 74 - "/scaffold"
Cohesion: 0.25
Nodes (7): APPLY — Generate the Complete Boilerplate, Ecosystem reference, EVALUATE — Understand the Architecture and Design, PLAN — Boilerplate + UI Shell + Project Rules, Prerequisites, /scaffold, VALIDATE — Validate Infrastructure + Design Fidelity

### Community 75 - "openapi.ts"
Cohesion: 0.20
Nodes (15): buildOpenApiDocument(), ComponentName, COMPONENTS, COOKIE, errors(), input(), JsonSchema, parameters() (+7 more)

### Community 76 - "Database"
Cohesion: 0.11
Nodes (17): Accrual job (TASK-017), API documentation (TASK-057), Database, Day 1 hand-off notes, Environment, HR audit (TASK-015), Known limitations, Leave types are independent (TASK-018 / US-08) (+9 more)

### Community 77 - "schemas.ts"
Cohesion: 0.13
Nodes (13): AuditEventSchema, BalanceSummarySchema, DecideWarningSchema, epochSeconds, ErrorCodeSchema, ErrorEnvelopeSchema, isoDate, isoTimestamp (+5 more)

### Community 79 - "Steps"
Cohesion: 0.22
Nodes (8): 0 — Run code review first, 1 — Gather context, 2 — Draft the PR, 3 — Push and open the PR, 4 — Output, /create-pr, Steps, When to use

### Community 80 - "approvals/actions.ts"
Cohesion: 0.32
Nodes (6): decideLeaveRequestAction(), isAppError(), BY_CONSTRAINT, BY_SQLSTATE, DbError, getDecideDeps()

### Community 81 - "ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR, Consequences, Context, Decision

### Community 82 - "ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions, Consequences, Context, Decision

### Community 83 - "action-errors.test.ts"
Cohesion: 0.14
Nodes (11): getSession, input, service, appFiles, code(), files(), rel(), root (+3 more)

### Community 84 - "ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox"
Cohesion: 0.50
Nodes (3): ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox, Consequences, Context

### Community 85 - "decide.test.ts"
Cohesion: 0.16
Nodes (14): decideLeaveRequest(), run(), ANA, audit(), balance(), BEN, CARLA, decide() (+6 more)

### Community 87 - "set-task-status.mjs"
Cohesion: 0.20
Nodes (6): RFC-4180, matches, previous, STATUSES, [taskId, status, csvArg], temp

### Community 88 - "local-env.mjs"
Cohesion: 0.43
Nodes (5): main(), managedValues(), planEnvFile(), unquote(), URL_KEYS

### Community 89 - "local-env.test.ts"
Cohesion: 0.24
Nodes (6): run(), SECRET_VALUES, stub, LOCAL_STATUS, makeStub(), root

### Community 90 - "env.ts"
Cohesion: 0.09
Nodes (20): ForgotPasswordState, register(), DEPLOYED_APP_ENVS, DEPLOYED_VERCEL_ENVS, EnvSchema, isLocalUrl(), LOCAL_HOSTS, LOCAL_ONLY_WHEN_NOT_DEPLOYED (+12 more)

### Community 91 - "Retro — Day 0 scaffold (2026-11-24)"
Cohesion: 0.33
Nodes (5): Coverage baseline (TASK-021, 2026-11-26), EPIC 2 planning (2026-11-26), Fixed in VALIDATE, Retro — Day 0 scaffold (2026-11-24), What went well

### Community 92 - "balance-writers.test.ts"
Cohesion: 0.31
Nodes (8): appFiles, files(), MOCK_FIELD, normalise(), root, Table, writersOf(), writesTable()

### Community 93 - "repositories.ts"
Cohesion: 0.07
Nodes (23): ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port, Consequences, Context, Decision, Options considered, LeaveRepository, selectRepository(), AuditEntryView (+15 more)

### Community 94 - "ref_node_child_process"
Cohesion: 0.25
Nodes (7): Email, inviteUser(), main(), MESSAGES, hostOf(), isLocalUrl(), USER

### Community 95 - "LeaveTrack UI — Design System"
Cohesion: 0.13
Nodes (14): Backlog, Color tokens, Components, Core, Iconography, Layout & breakpoints, Leave types, LeaveTrack UI — Design System (+6 more)

### Community 96 - "openapi.test.ts"
Cohesion: 0.12
Nodes (15): SessionTiming, DecideLeaveRequestResult, MyLeaveContext, SubmitLeaveRequestResult, TeamQueue, AuditParamsSchema, AuditQuerySchema, ListQuerySchema (+7 more)

### Community 97 - "repository.ts"
Cohesion: 0.20
Nodes (12): Database, utcDay(), utcMonthBounds(), withinUtcDays(), addDays(), fromHundredths(), sumDays(), toHundredths() (+4 more)

### Community 98 - "reset/route.ts"
Cohesion: 0.22
Nodes (9): notFound(), POST(), tokenMatches(), ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering, Consequences, Context, Decision, Options considered (+1 more)

### Community 99 - "ref_node_fs"
Cohesion: 0.11
Nodes (7): METRICS, rows, dir, script, dir, root, script

### Community 100 - "local-only.mjs"
Cohesion: 0.36
Nodes (11): assertLocal(), LocalOnlyError, parseEnvOutput(), readLocalStatus(), runSupabase(), supabaseBin(), APP_TABLES, check() (+3 more)

### Community 102 - "sidebar-nav.tsx"
Cohesion: 0.36
Nodes (7): activeHref(), NAV_ITEMS, NavItem, navItemsFor(), GROUP_LABEL, SidebarNav(), SidebarNavProps

### Community 103 - "decide.ts"
Cohesion: 0.14
Nodes (17): Decision, Session, DecideWarning, SubmitWarning, DecideDeps, RequestIdSchema, LeaveRequestDecidedNotice, LeaveRequestSubmittedNotice (+9 more)

### Community 104 - "next.config.ts"
Cohesion: 0.50
Nodes (3): csp, nextConfig, securityHeaders

### Community 105 - "leave-request.ts"
Cohesion: 0.32
Nodes (6): DecisionInput, DecisionSchema, LeaveRequestInput, LeaveRequestSchema, RejectReasonSchema, valid

### Community 106 - "utils.ts"
Cohesion: 0.36
Nodes (5): LEAVE_TYPE_META, STATUS_META, Badge(), badgeVariants, class-variance-authority

### Community 107 - "zod"
Cohesion: 0.40
Nodes (4): PASSWORD_MAX, PASSWORD_MIN, SetPasswordSchema, zod

### Community 108 - "ADR-LeaveTrack-E004 — Real Authentication: Supabase Auth with signed sessions"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E004 — Real Authentication: Supabase Auth with signed sessions, Consequences, Context, Decision, Options considered

### Community 109 - "audit-route.test.ts"
Cohesion: 0.33
Nodes (3): getEmployeeAuditHistory, getSession, HR

### Community 110 - "postgres-repository.test.ts"
Cohesion: 0.40
Nodes (4): insertPending(), MIA_REPORTS, seedMiasTeam(), track

## Knowledge Gaps
- **669 isolated node(s):** `@commitlint/config-conventional`, `uvx`, `nexus-mcp`, `semi`, `singleQuote` (+664 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 809 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `store.test.ts`, `package.json`, `session-token.ts`, `account-actions.test.ts`, `independence.test.ts`, `login/page.tsx`, `roles.ts`, `repo-hygiene.test.ts`, `approval-queue.tsx`, `local-scripts.test.ts`, `memory-parity.test.ts`, `AppError`, `idle-session-guard.tsx`, `contract.test.ts`, `sign-in-throttle.test.ts`, `auth.spec.ts`, `session-renewal.test.ts`, `with-error-handler.ts`, `submit.test.ts`, `types.ts`, `provider.ts`, `schemas.ts`, `action-errors.test.ts`, `decide.test.ts`, `local-env.test.ts`, `env.ts`, `balance-writers.test.ts`, `ref_node_child_process`, `openapi.test.ts`, `repository.ts`, `ref_node_fs`, `decide.ts`, `leave-request.ts`, `audit-route.test.ts`, `postgres-repository.test.ts`, `login-redirect.test.ts`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `package.json`, `balance-card.tsx`, `session-token.ts`, `account-actions.test.ts`, `independence.test.ts`, `password-login-form.tsx`, `app/layout.tsx`, `login/page.tsx`, `login/actions.ts`, `approval-queue.tsx`, `vitest`, `AppError`, `contract.test.ts`, `session-renewal.test.ts`, `with-error-handler.ts`, `submit.test.ts`, `mobile-nav.tsx`, `Button`, `provider.ts`, `schemas.ts`, `approvals/actions.ts`, `reset/route.ts`, `sidebar-nav.tsx`, `decide.ts`, `next.config.ts`, `audit-route.test.ts`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `scripts` connect `scripts` to `package.json`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `uvx`, `nexus-mcp` to the rest of the system?**
  _669 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Business Requirements Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `Architecture Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._