# Graph Report - leave-track  (2026-11-27)

## Corpus Check
- 275 files · ~122,337 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 6, .csv 2, .example 1)

## Summary
- 1652 nodes · 4036 edges · 106 communities (93 shown, 13 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 101 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0c293284`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Business Requirements Document — LeaveTrack v1.0
- session-secret.ts
- ADR-LeaveTrack-E001 — Auth & Session Strategy
- Product Requirements Document — LeaveTrack v1.0
- package.json
- Architecture Document — LeaveTrack v1.0
- compilerOptions
- devDependencies
- dependencies
- scripts
- components.json
- /dev-tasks-planner
- Step 3: Review
- /epav
- Steps
- Review Checklist
- Review Checklist
- Review Checklist
- Review Checklist
- submit.ts
- Review Checklist
- Review Checklist
- Review Checklist
- Review Checklist
- Steps
- approval-queue.tsx
- Steps
- Steps
- memory-parity.test.ts
- .prettierrc.json
- pr-verifier.md
- Steps
- Steps
- nexus
- extends
- postcss.config.mjs
- Notifier
- password-login-form.tsx
- cn
- app/layout.tsx
- repo-hygiene.test.ts
- login/actions.ts
- roles.ts
- with-error-handler.ts
- independence.test.ts
- local-only.mjs
- Prove the test can fail (from TASK-010)
- db/helpers.ts
- sidebar-nav.tsx
- session.ts
- LeaveTrack UI — Design System
- implement-api-route.md
- implement-ui-component.md
- write-migration.md
- dev-accounts.ts
- types.ts
- mobile-nav.tsx
- repository.ts
- Architecture Document — LeaveTrack v1.0
- accrual/route.ts
- request-form.tsx
- openapi.test.ts
- ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port
- LeaveTrack
- local-scripts.test.ts
- vercel.json
- vitest
- auth.spec.ts
- provider.ts
- Steps
- /scaffold
- proxy.ts
- Revision v1.1 — EPIC 2 (2026-11-26)
- errors.test.ts
- Steps
- e2e-supabase-harness.test.ts
- ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR
- ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions
- Coding Standards — LeaveTrack
- AGENTS.md — LeaveTrack
- session-token.ts
- set-task-status.mjs
- Button
- no-name-logic.test.ts
- env.ts
- instrumentation.ts
- balance-writers.test.ts
- ADR-LeaveTrack-E004 — Real Authentication: Supabase Auth with signed sessions
- invite-user.mjs
- AppError
- ref_node_path
- local-env.mjs
- Retro — Day 0 scaffold (2026-11-24)
- login/page.tsx
- ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering
- decimal.ts
- next
- e2e/helpers.ts
- leave-requests/route.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 93 edges
2. `vitest` - 63 edges
3. `next` - 49 edges
4. `Button()` - 37 edges
5. `lucide-react` - 32 edges
6. `scripts` - 28 edges
7. `AppError` - 26 edges
8. `RequestForm()` - 24 edges
9. `react` - 24 edges
10. `getAuthProvider()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `Decision` --references--> `POST()`  [INFERRED]
  docs/arch-docs/ADR-LeaveTrack-E002-Accrual-Idempotency.md → app/api/test/reset/route.ts
- `Measure layout only after it settles (from TASK-055)` --references--> `FormControl()`  [INFERRED]
  knowledge/patterns/implement-and-test.md → components/ui/form.tsx
- `API route handlers` --references--> `withErrorHandler()`  [INFERRED]
  knowledge/rules/coding-standards.md → lib/api/with-error-handler.ts
- `Frontend standards` --references--> `requireRole()`  [INFERRED]
  AGENTS.md → lib/auth/session.ts
- `Decision` --references--> `requireRole()`  [INFERRED]
  docs/arch-docs/ADR-LeaveTrack-E004-Real-Authentication.md → lib/auth/session.ts

## Import Cycles
- None detected.

## Communities (106 total, 13 thin omitted)

### Community 0 - "Business Requirements Document — LeaveTrack v1.0"
Cohesion: 0.09
Nodes (21): Additional Functional Requirements, Additional Risks, Additional Stakeholder Concerns, Additional Success Criteria, Assumptions, Business Context, Business Requirements Document — LeaveTrack v1.0, Constraints (+13 more)

### Community 1 - "session-secret.ts"
Cohesion: 0.33
Nodes (3): globalForSession, mobile, load()

### Community 2 - "ADR-LeaveTrack-E001 — Auth & Session Strategy"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E001 — Auth & Session Strategy, Consequences, Context, Decision, Options Considered

### Community 3 - "Product Requirements Document — LeaveTrack v1.0"
Cohesion: 0.17
Nodes (11): Business Rules (EPIC 2), Non-Functional Requirements, Non-Functional Requirements (additions), Out of Scope, Out of Scope (additions), Product Requirements Document — LeaveTrack v1.0, Revision v1.1 — EPIC 2 (2026-11-26), User Roles (+3 more)

### Community 4 - "package.json"
Cohesion: 0.06
Nodes (30): description, engines, node, @commitlint/config-conventional, name, private, version, @axe-core/playwright (+22 more)

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
Nodes (20): dependencies, class-variance-authority, clsx, geist, @hookform/resolvers, lucide-react, next, pino (+12 more)

### Community 9 - "scripts"
Cohesion: 0.07
Nodes (28): scripts, build, db:check:local, db:migrate:local, db:push:hosted, db:reset, db:reset:local, db:seed:auth (+20 more)

### Community 10 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 11 - "/dev-tasks-planner"
Cohesion: 0.12
Nodes (16): APPLY — Generate the CSV(s) programmatically, Arguments, /dev-tasks-planner, EVALUATE — Read the source material and the real repo state, Every `Blocked` row cites the exact reason and states the fallback, Every `Done` row states its own Day-1 forward path, Every task cites the project's own established patterns by name, not generic prose, File structure and exact schema (+8 more)

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

### Community 19 - "submit.ts"
Cohesion: 0.18
Nodes (11): SubmitWarning, LeaveRequestDecidedNotice, LeaveRequestSubmittedNotice, logNotifier, Requester, SubmitDeps, Logger, server-only (+3 more)

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

### Community 25 - "approval-queue.tsx"
Cohesion: 0.10
Nodes (53): DashboardPage(), metadata, StatCard(), Loading(), ApprovalQueue(), ApprovalQueueProps, BalanceHint(), ActionBadge() (+45 more)

### Community 26 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Orient with your knowledge graph (if one exists), 2 — Load context in priority order, 3 — Output this summary, nothing else, 4 — Stop, Arguments, /evaluate, Steps

### Community 27 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Blast radius check, 2 — Write the implementation blueprint, 3 — State constraints, 4 — Stop and wait, /plan, Prerequisite, Steps

### Community 28 - "memory-parity.test.ts"
Cohesion: 0.11
Nodes (25): memoryAccrualStore, currentPeriod(), monthsToAccrue(), nextPeriod(), createPostgresAccrualStore(), AccrualDeps, MAX_CATCH_UP_MONTHS, runMonthlyAccrual() (+17 more)

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

### Community 36 - "Notifier"
Cohesion: 0.29
Nodes (5): ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox, Consequences, Context, Decision, Notifier

### Community 37 - "password-login-form.tsx"
Cohesion: 0.21
Nodes (23): LoginState, AuditFilters(), AuditFiltersProps, LoginForm(), LoginFormProps, MockUserOption, ROLE_ORDER, PasswordLoginForm() (+15 more)

### Community 38 - "cn"
Cohesion: 0.09
Nodes (38): DecisionDialog(), confirm(), handleOpenChange(), DecisionDialogProps, UserMenu(), UserMenuProps, AlertTitle(), Avatar() (+30 more)

### Community 39 - "app/layout.tsx"
Cohesion: 0.22
Nodes (6): metadata, RootLayout(), viewport, Toaster(), geist, sonner

### Community 40 - "repo-hygiene.test.ts"
Cohesion: 0.67
Nodes (3): git(), ignored(), root

### Community 41 - "login/actions.ts"
Cohesion: 0.22
Nodes (17): Security rules, setPasswordAction(), SetPasswordState, dynamic, metadata, SetPasswordPage(), loginAction(), logoutAction() (+9 more)

### Community 42 - "roles.ts"
Cohesion: 0.21
Nodes (12): Security changes, TypeScript, isRole(), MAX_REDIRECT_LENGTH, NEVER_REDIRECT_TO, PUBLIC_PATHS, REDIRECT_BASES, REDIRECT_GUARDS (+4 more)

### Community 43 - "with-error-handler.ts"
Cohesion: 0.18
Nodes (11): ASSETS, dynamic, GET, dynamic, GET, dynamic, GET, fail() (+3 more)

### Community 44 - "independence.test.ts"
Cohesion: 0.05
Nodes (46): createMockDb(), resetMockDb(), DecideLeaveRequestResult, DecideWarning, RequestStatus, toIso(), RequestIdSchema, memoryDecideStore (+38 more)

### Community 45 - "local-only.mjs"
Cohesion: 0.17
Nodes (20): listAllAuthUsers(), LOCAL_DEV_PASSWORD, main(), planSeed(), pushArgs(), assertLocal(), exitWith(), LOCAL_HOSTS (+12 more)

### Community 46 - "Prove the test can fail (from TASK-010)"
Cohesion: 0.08
Nodes (24): DialogTrigger(), "Authorize before any database access" — prove it with a repository spy (from TASK-015), Browser e2e recipe (from TASK-016), Changing tooling versions: diff the resolved config, measure before thresholding (from TASK-021), Cross-cutting invariants: matrix + writer registry (from TASK-018), Defense in depth for "exactly once" writes (from TASK-014), Fail-closed configuration: test build time and runtime separately (from TASK-019), Headless browser tests with Radix overlays (+16 more)

### Community 48 - "db/helpers.ts"
Cohesion: 0.09
Nodes (25): B30 — PGlite lifecycle and CI memory (2026-11-26), AUDIT_LOG_LIMIT, SqlClient, @electric-sql/pglite, track, insertPending(), MIA_REPORTS, seedMiasTeam() (+17 more)

### Community 50 - "sidebar-nav.tsx"
Cohesion: 0.33
Nodes (7): activeHref(), NAV_ITEMS, NavItem, navItemsFor(), GROUP_LABEL, SidebarNavProps, Role

### Community 52 - "session.ts"
Cohesion: 0.16
Nodes (23): ApprovalsPage(), metadata, AuditPage(), metadata, one(), BalancePage(), metadata, metadata (+15 more)

### Community 53 - "LeaveTrack UI — Design System"
Cohesion: 0.13
Nodes (14): Backlog, Color tokens, Components, Core, Iconography, Layout & breakpoints, Leave types, LeaveTrack UI — Design System (+6 more)

### Community 57 - "dev-accounts.ts"
Cohesion: 0.23
Nodes (10): DEV_LOGIN_HOSTS, DevAccount, devLoginAccountsEnabled(), isDevLoginHost(), LOCAL_DEV_PASSWORD, RawEnv, ROLE_ORDER, form() (+2 more)

### Community 58 - "types.ts"
Cohesion: 0.08
Nodes (26): Backlog (deferred, owner = Day 1 team), LeaveRepository, AccrualRun, AUDIT_ACTIONS, AuditEntryView, AuditEvent, AuditFilter, AuditHistoryFilter (+18 more)

### Community 59 - "mobile-nav.tsx"
Cohesion: 0.21
Nodes (15): AuthenticatedLayout(), AppShell(), AppShellProps, MobileNav(), SidebarNav(), Sheet(), SheetContent(), SheetDescription() (+7 more)

### Community 60 - "repository.ts"
Cohesion: 0.12
Nodes (24): Database, availableForRequest(), buildBalanceSummaries(), PendingRange, utcDay(), utcMonthBounds(), withinUtcDays(), byId() (+16 more)

### Community 61 - "Architecture Document — LeaveTrack v1.0"
Cohesion: 0.25
Nodes (7): API Design (selected), Architecture Document — LeaveTrack v1.0, Data Model, Deployment Topology, Open Questions, Security, Stack

### Community 62 - "accrual/route.ts"
Cohesion: 0.23
Nodes (13): Backend standards, dynamic, GET, authorized(), GET, handler(), POST, API additions (planned) (+5 more)

### Community 63 - "request-form.tsx"
Cohesion: 0.20
Nodes (15): EMPTY, RequestForm(), RequestFormProps, FormControl(), FormDescription(), FormField(), FormFieldContext, FormFieldContextValue (+7 more)

### Community 64 - "openapi.test.ts"
Cohesion: 0.05
Nodes (62): buildOpenApiDocument(), ComponentName, COMPONENTS, COOKIE, errors(), input(), JsonSchema, parameters() (+54 more)

### Community 65 - "ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port, Consequences, Context, Decision, Options considered

### Community 66 - "LeaveTrack"
Cohesion: 0.12
Nodes (16): Accrual job (TASK-017), API documentation (TASK-057), Database, Day 1 hand-off notes, Environment, HR audit (TASK-015), Known limitations, Leave types are independent (TASK-018 / US-08) (+8 more)

### Community 67 - "local-scripts.test.ts"
Cohesion: 0.24
Nodes (7): run(), SECRET_VALUES, stub, stub, LOCAL_STATUS, makeStub(), root

### Community 69 - "vitest"
Cohesion: 0.07
Nodes (32): accrualRuns, auditLog, BALANCE_ROWS, LAST_ACCRUAL_AT, LEAVE_TYPE_IDS, leaveBalances, leavePolicies, leaveRequests (+24 more)

### Community 70 - "auth.spec.ts"
Cohesion: 0.15
Nodes (19): acceptInvite(), admin, anon, DEV_NOTICE_TEXT, env, noSession, sql, assertTestEmail() (+11 more)

### Community 71 - "provider.ts"
Cohesion: 0.06
Nodes (34): ForgotPasswordState, Logging, CookieIO, CookieJar, CookieToSet, LEGACY_SESSION_COOKIES, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS (+26 more)

### Community 72 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Inspect changes, 2 — Stage deliberately, 3 — Write the commit message, 4 — Confirm, /commit, Steps, When to use

### Community 74 - "/scaffold"
Cohesion: 0.25
Nodes (7): APPLY — Generate the Complete Boilerplate, Ecosystem reference, EVALUATE — Understand the Architecture and Design, PLAN — Boilerplate + UI Shell + Project Rules, Prerequisites, /scaffold, VALIDATE — Validate Infrastructure + Design Fidelity

### Community 75 - "proxy.ts"
Cohesion: 0.43
Nodes (7): proxyCookieIO(), canAccess(), isPublicPath(), matches(), config, loginUrl(), proxy()

### Community 76 - "Revision v1.1 — EPIC 2 (2026-11-26)"
Cohesion: 0.29
Nodes (7): Considered and not adopted, Data model additions (planned), Deployment changes, EPIC 2 decisions (adopted 2026-11-26), Open Questions (updated), Revision v1.1 — EPIC 2 (2026-11-26), Stack changes

### Community 77 - "errors.test.ts"
Cohesion: 0.22
Nodes (5): getSession, input, service, CASES, code()

### Community 79 - "Steps"
Cohesion: 0.22
Nodes (8): 0 — Run code review first, 1 — Gather context, 2 — Draft the PR, 3 — Push and open the PR, 4 — Output, /create-pr, Steps, When to use

### Community 80 - "e2e-supabase-harness.test.ts"
Cohesion: 0.18
Nodes (10): accessTokenFromCookies(), TEST_EMAIL_DOMAIN, testEmail(), assertPortFree(), probePort(), local, @supabase/ssr, harnessDir (+2 more)

### Community 81 - "ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR, Consequences, Context, Decision

### Community 82 - "ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions, Consequences, Context, Decision

### Community 83 - "Coding Standards — LeaveTrack"
Cohesion: 0.25
Nodes (7): API route handlers, Coding Standards — LeaveTrack, Dependencies, Hard-won rules (from Day 0 VALIDATE), Next.js 16, Testing, UI

### Community 84 - "AGENTS.md — LeaveTrack"
Cohesion: 0.22
Nodes (8): AGENTS.md — LeaveTrack, Frontend standards, Git conventions, Project, Quality gates (must pass before merge), Stack, Task tracking, Where things go

### Community 85 - "session-token.ts"
Cohesion: 0.14
Nodes (15): getSessionSecret(), isClaims(), MAX_TOKEN_LENGTH, SessionClaims, sign(), signSessionToken(), VerifyResult, verifySessionToken() (+7 more)

### Community 87 - "set-task-status.mjs"
Cohesion: 0.20
Nodes (6): RFC-4180, matches, previous, STATUSES, [taskId, status, csvArg], temp

### Community 88 - "Button"
Cohesion: 0.34
Nodes (9): AppError(), ForbiddenPage(), metadata, NotFound(), StatusScreen(), StatusScreenProps, Button(), buttonVariants (+1 more)

### Community 89 - "no-name-logic.test.ts"
Cohesion: 0.25
Nodes (7): appFiles, files(), rel(), root, files(), root, UNSAFE_COMPARE

### Community 90 - "env.ts"
Cohesion: 0.10
Nodes (21): Driver, getSql(), globalForDb, wrap(), DEPLOYED_APP_ENVS, DEPLOYED_VERCEL_ENVS, env, EnvSchema (+13 more)

### Community 91 - "instrumentation.ts"
Cohesion: 0.38
Nodes (3): register(), assertEnvOrExit(), register()

### Community 92 - "balance-writers.test.ts"
Cohesion: 0.31
Nodes (8): appFiles, files(), MOCK_FIELD, normalise(), root, Table, writersOf(), writesTable()

### Community 93 - "ADR-LeaveTrack-E004 — Real Authentication: Supabase Auth with signed sessions"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E004 — Real Authentication: Supabase Auth with signed sessions, Consequences, Context, Decision, Options considered

### Community 94 - "invite-user.mjs"
Cohesion: 0.27
Nodes (7): postgres, Email, inviteUser(), main(), MESSAGES, hostOf(), USER

### Community 95 - "AppError"
Cohesion: 0.18
Nodes (12): GET, ConfirmQuery, GET, AppError, ERROR_STATUS, ErrorCode, ApiFailure, ApiResponse (+4 more)

### Community 96 - "ref_node_path"
Cohesion: 0.09
Nodes (9): METRICS, rows, dir, script, files(), root, dir, root (+1 more)

### Community 97 - "local-env.mjs"
Cohesion: 0.39
Nodes (6): isLocalUrl(), main(), managedValues(), planEnvFile(), unquote(), URL_KEYS

### Community 98 - "Retro — Day 0 scaffold (2026-11-24)"
Cohesion: 0.33
Nodes (5): Coverage baseline (TASK-021, 2026-11-26), EPIC 2 planning (2026-11-26), Fixed in VALIDATE, Retro — Day 0 scaffold (2026-11-24), What went well

### Community 99 - "login/page.tsx"
Cohesion: 0.21
Nodes (11): forgotPasswordAction(), dynamic, ForgotPasswordPage(), metadata, HIGHLIGHTS, LoginPage(), metadata, NOTICES (+3 more)

### Community 100 - "ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering"
Cohesion: 0.29
Nodes (6): ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering, Consequences, Context, Decision, Options considered, Policy changes vs catch-up

### Community 102 - "decimal.ts"
Cohesion: 0.73
Nodes (4): addDays(), fromHundredths(), sumDays(), toHundredths()

### Community 103 - "next"
Cohesion: 0.22
Nodes (7): notFound(), POST(), tokenMatches(), csp, nextConfig, securityHeaders, next

### Community 104 - "e2e/helpers.ts"
Cohesion: 0.21
Nodes (17): OPERATIONS, enlargeText(), expectNoHorizontalOverflow(), expectNotUnderHeader(), expectSelectsNotClipped(), expectTapTargets(), expectVisibleFocus(), focusedLabel() (+9 more)

### Community 105 - "leave-requests/route.ts"
Cohesion: 0.21
Nodes (17): POST, GET, NO_STORE, POST, decideLeaveRequestAction(), submitLeaveRequestAction(), isAppError(), getSession (+9 more)

## Knowledge Gaps
- **653 isolated node(s):** `@commitlint/config-conventional`, `uvx`, `nexus-mcp`, `semi`, `singleQuote` (+648 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 782 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `session-secret.ts`, `package.json`, `submit.ts`, `approval-queue.tsx`, `memory-parity.test.ts`, `repo-hygiene.test.ts`, `roles.ts`, `with-error-handler.ts`, `independence.test.ts`, `db/helpers.ts`, `dev-accounts.ts`, `types.ts`, `repository.ts`, `openapi.test.ts`, `local-scripts.test.ts`, `provider.ts`, `errors.test.ts`, `e2e-supabase-harness.test.ts`, `session-token.ts`, `no-name-logic.test.ts`, `env.ts`, `instrumentation.ts`, `balance-writers.test.ts`, `invite-user.mjs`, `AppError`, `ref_node_path`, `decimal.ts`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `package.json`, `submit.ts`, `approval-queue.tsx`, `password-login-form.tsx`, `app/layout.tsx`, `login/actions.ts`, `with-error-handler.ts`, `sidebar-nav.tsx`, `session.ts`, `accrual/route.ts`, `openapi.test.ts`, `vitest`, `provider.ts`, `proxy.ts`, `errors.test.ts`, `session-token.ts`, `Button`, `AppError`, `login/page.tsx`, `leave-requests/route.ts`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `scripts` connect `scripts` to `package.json`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `uvx`, `nexus-mcp` to the rest of the system?**
  _653 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Business Requirements Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `Architecture Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._