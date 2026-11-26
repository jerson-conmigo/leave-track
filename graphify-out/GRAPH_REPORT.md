# Graph Report - leave-track  (2026-11-26)

## Corpus Check
- 263 files · ~113,851 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 6, .csv 2, .example 1)

## Summary
- 1560 nodes · 3748 edges · 104 communities (88 shown, 16 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 98 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b0da8dea`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Business Requirements Document — LeaveTrack v1.0
- decide.ts
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
- approval-queue.tsx
- Review Checklist
- Review Checklist
- Review Checklist
- Review Checklist
- Steps
- repositories.ts
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
- next
- react
- mobile-nav.tsx
- app/layout.tsx
- e2e/helpers.ts
- login/actions.ts
- roles.ts
- cn
- login-form.tsx
- invite-user.mjs
- Prove the test can fail (from TASK-010)
- db/helpers.ts
- vitest
- request-form.tsx
- Notifier
- implement-api-route.md
- implement-ui-component.md
- write-migration.md
- ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port
- decision-dialog.tsx
- local-only.mjs
- types.ts
- Revision v1.1 — EPIC 2 (2026-11-26)
- decide.test.ts
- new/actions.ts
- Button
- AppError
- LeaveTrack
- local-scripts.test.ts
- vercel.json
- fixtures.ts
- repository.ts
- provider.ts
- Steps
- LeaveTrack UI — Design System
- session.test.ts
- /scaffold
- Retro — Day 0 scaffold (2026-11-24)
- Steps
- login/page.tsx
- ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR
- ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions
- Coding Standards — LeaveTrack
- action-errors.test.ts
- accrual/route.ts
- set-task-status.mjs
- postgres.ts
- coverage-summary.mjs
- env.ts
- account-actions.test.ts
- balance-writers.test.ts
- leave-request.ts
- local-env.mjs
- ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering
- instrumentation.ts
- set-task-status.test.ts
- coverage-summary.test.ts
- next.config.ts
- independence.test.ts
- engines
- auth.spec.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 93 edges
2. `vitest` - 59 edges
3. `next` - 46 edges
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
- `API route handlers` --references--> `withErrorHandler()`  [INFERRED]
  knowledge/rules/coding-standards.md → lib/api/with-error-handler.ts
- `Security changes` --references--> `safeRedirectPath()`  [INFERRED]
  docs/arch-docs/ARCH-LeaveTrack-v1.0.md → lib/auth/roles.ts
- `Day 1 hand-off notes` --references--> `LeaveRepository`  [INFERRED]
  README.md → lib/data/repositories.ts
- `Where data goes` --references--> `getSql()`  [INFERRED]
  README.md → lib/db/postgres.ts

## Import Cycles
- None detected.

## Communities (104 total, 16 thin omitted)

### Community 0 - "Business Requirements Document — LeaveTrack v1.0"
Cohesion: 0.09
Nodes (21): Additional Functional Requirements, Additional Risks, Additional Stakeholder Concerns, Additional Success Criteria, Assumptions, Business Context, Business Requirements Document — LeaveTrack v1.0, Constraints (+13 more)

### Community 1 - "decide.ts"
Cohesion: 0.25
Nodes (12): Session, toRequestView(), DecideDeps, decideLeaveRequest(), RequestIdSchema, LeaveRequestDecidedNotice, LeaveRequestSubmittedNotice, logNotifier (+4 more)

### Community 2 - "ADR-LeaveTrack-E001 — Auth & Session Strategy"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E001 — Auth & Session Strategy, Consequences, Context, Decision, Options Considered

### Community 3 - "Product Requirements Document — LeaveTrack v1.0"
Cohesion: 0.17
Nodes (11): Business Rules (EPIC 2), Non-Functional Requirements, Non-Functional Requirements (additions), Out of Scope, Out of Scope (additions), Product Requirements Document — LeaveTrack v1.0, Revision v1.1 — EPIC 2 (2026-11-26), User Roles (+3 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (27): description, @commitlint/config-conventional, name, private, version, @axe-core/playwright, clsx, @commitlint/cli (+19 more)

### Community 5 - "Architecture Document — LeaveTrack v1.0"
Cohesion: 0.10
Nodes (19): Adr-Leavetrack-E001 — Auth & Session Strategy, ADR-LeaveTrack-E001 — Auth & Session Strategy, Api Design (Selected), API Design (selected), Architecture Document — LeaveTrack v1.0, Architecture Summary, Consequences, Context (+11 more)

### Community 6 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 7 - "devDependencies"
Cohesion: 0.09
Nodes (22): devDependencies, @axe-core/playwright, @commitlint/cli, @commitlint/config-conventional, @electric-sql/pglite, eslint, eslint-config-next, husky (+14 more)

### Community 8 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, geist, @hookform/resolvers, lucide-react, next, pino (+11 more)

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

### Community 19 - "approval-queue.tsx"
Cohesion: 0.14
Nodes (37): ApprovalQueue(), ApprovalQueueProps, BalanceHint(), ActionBadge(), AuditTable(), EmptyState(), EmptyStateProps, LeaveTypeBadge() (+29 more)

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

### Community 25 - "repositories.ts"
Cohesion: 0.07
Nodes (50): AGENTS.md — LeaveTrack, Frontend standards, Git conventions, Project, Quality gates (must pass before merge), Security rules, Stack, Task tracking (+42 more)

### Community 26 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Orient with your knowledge graph (if one exists), 2 — Load context in priority order, 3 — Output this summary, nothing else, 4 — Stop, Arguments, /evaluate, Steps

### Community 27 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Blast radius check, 2 — Write the implementation blueprint, 3 — State constraints, 4 — Stop and wait, /plan, Prerequisite, Steps

### Community 28 - "memory-parity.test.ts"
Cohesion: 0.12
Nodes (24): memoryAccrualStore, currentPeriod(), monthsToAccrue(), nextPeriod(), createPostgresAccrualStore(), AccrualDeps, MAX_CATCH_UP_MONTHS, runMonthlyAccrual() (+16 more)

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

### Community 36 - "next"
Cohesion: 0.21
Nodes (9): ConfirmQuery, ERROR_STATUS, ErrorCode, ApiFailure, ApiResponse, ApiSuccess, fail(), RouteHandler (+1 more)

### Community 37 - "react"
Cohesion: 0.38
Nodes (11): forgotPasswordAction(), ForgotPasswordForm(), PasswordLoginForm(), PasswordLoginFormProps, SetPasswordForm(), Alert(), AlertDescription(), alertVariants (+3 more)

### Community 38 - "mobile-nav.tsx"
Cohesion: 0.15
Nodes (21): AuthenticatedLayout(), AppShell(), AppShellProps, MobileNav(), activeHref(), NAV_ITEMS, NavItem, navItemsFor() (+13 more)

### Community 39 - "app/layout.tsx"
Cohesion: 0.22
Nodes (6): metadata, RootLayout(), viewport, Toaster(), geist, sonner

### Community 40 - "e2e/helpers.ts"
Cohesion: 0.11
Nodes (26): enlargeText(), expectNoHorizontalOverflow(), expectNotUnderHeader(), expectTapTargets(), expectVisibleFocus(), focusedLabel(), focusIndicatorChange(), Role (+18 more)

### Community 41 - "login/actions.ts"
Cohesion: 0.15
Nodes (21): GET, setPasswordAction(), SetPasswordState, dynamic, metadata, SetPasswordPage(), ForgotPasswordState, loginAction() (+13 more)

### Community 42 - "roles.ts"
Cohesion: 0.17
Nodes (18): proxyCookieIO(), canAccess(), isPublicPath(), isRole(), matches(), MAX_REDIRECT_LENGTH, NEVER_REDIRECT_TO, PUBLIC_PATHS (+10 more)

### Community 43 - "cn"
Cohesion: 0.14
Nodes (23): UserMenu(), UserMenuProps, Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage() (+15 more)

### Community 44 - "login-form.tsx"
Cohesion: 0.24
Nodes (17): LoginState, ALL_EMPLOYEES, AuditFilters(), AuditFiltersProps, LoginForm(), LoginFormProps, MockUserOption, ROLE_ORDER (+9 more)

### Community 45 - "invite-user.mjs"
Cohesion: 0.27
Nodes (7): postgres, Email, inviteUser(), main(), MESSAGES, hostOf(), USER

### Community 46 - "Prove the test can fail (from TASK-010)"
Cohesion: 0.09
Nodes (21): DialogTrigger(), "Authorize before any database access" — prove it with a repository spy (from TASK-015), Browser e2e recipe (from TASK-016), Changing tooling versions: diff the resolved config, measure before thresholding (from TASK-021), Cross-cutting invariants: matrix + writer registry (from TASK-018), Defense in depth for "exactly once" writes (from TASK-014), Fail-closed configuration: test build time and runtime separately (from TASK-019), Headless browser tests with Radix overlays (+13 more)

### Community 48 - "db/helpers.ts"
Cohesion: 0.11
Nodes (22): PGlite: close per test, not per file (from B30), B30 — PGlite lifecycle and CI memory (2026-11-26), AUDIT_LOG_LIMIT, @electric-sql/pglite, track, insertPending(), MIA_REPORTS, seedMiasTeam() (+14 more)

### Community 50 - "vitest"
Cohesion: 0.15
Nodes (13): vitest, files(), root, appFiles, files(), rel(), root, git() (+5 more)

### Community 52 - "request-form.tsx"
Cohesion: 0.19
Nodes (16): LEAVE_TYPE_META, EMPTY, RequestForm(), RequestFormProps, FormControl(), FormDescription(), FormField(), FormFieldContext (+8 more)

### Community 53 - "Notifier"
Cohesion: 0.29
Nodes (5): ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox, Consequences, Context, Decision, Notifier

### Community 57 - "ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port, Consequences, Context, Decision, Options considered

### Community 58 - "decision-dialog.tsx"
Cohesion: 0.23
Nodes (14): DecisionDialog(), confirm(), handleOpenChange(), DecisionDialogProps, AlertTitle(), Dialog(), DialogContent(), DialogDescription() (+6 more)

### Community 59 - "local-only.mjs"
Cohesion: 0.19
Nodes (18): listAllAuthUsers(), LOCAL_DEV_PASSWORD, main(), planSeed(), pushArgs(), assertLocal(), exitWith(), LocalOnlyError (+10 more)

### Community 60 - "types.ts"
Cohesion: 0.07
Nodes (36): Backlog (deferred, owner = Day 1 team), availableForRequest(), buildBalanceSummaries(), PendingRange, createPostgresRepository(), UserRow, LeaveRepository, selectRepository() (+28 more)

### Community 61 - "Revision v1.1 — EPIC 2 (2026-11-26)"
Cohesion: 0.12
Nodes (15): API Design (selected), Architecture Document — LeaveTrack v1.0, Considered and not adopted, Data Model, Data model additions (planned), Deployment changes, Deployment Topology, EPIC 2 decisions (adopted 2026-11-26) (+7 more)

### Community 62 - "decide.test.ts"
Cohesion: 0.09
Nodes (27): Security-scoped queries: assert the scope structurally (from TASK-013), SqlClient, SqlRow, toIso(), toNumber(), createPostgresDecideStore(), createPostgresSubmitStore(), DecidedRow (+19 more)

### Community 63 - "new/actions.ts"
Cohesion: 0.17
Nodes (16): Backend standards, decideLeaveRequestAction(), submitLeaveRequestAction(), API additions (planned), Example — TASK-014 (approve/reject), isAppError(), withErrorHandler(), ActionResult (+8 more)

### Community 64 - "Button"
Cohesion: 0.30
Nodes (10): AppError(), ForbiddenPage(), metadata, NotFound(), StatusScreen(), StatusScreenProps, Button(), buttonVariants (+2 more)

### Community 65 - "AppError"
Cohesion: 0.27
Nodes (12): GET, ParamsSchema, QuerySchema, POST, GET, ListQuerySchema, NO_STORE, POST (+4 more)

### Community 66 - "LeaveTrack"
Cohesion: 0.12
Nodes (15): Accrual job (TASK-017), Database, Day 1 hand-off notes, Environment, HR audit (TASK-015), Known limitations, Leave types are independent (TASK-018 / US-08), LeaveTrack (+7 more)

### Community 67 - "local-scripts.test.ts"
Cohesion: 0.20
Nodes (9): LOCAL_HOSTS, EXCLUDED_SERVICES, run(), SECRET_VALUES, stub, stub, LOCAL_STATUS, makeStub() (+1 more)

### Community 69 - "fixtures.ts"
Cohesion: 0.06
Nodes (31): accrualRuns, auditLog, BALANCE_ROWS, LAST_ACCRUAL_AT, LEAVE_TYPE_IDS, leaveBalances, leavePolicies, leaveRequests (+23 more)

### Community 70 - "repository.ts"
Cohesion: 0.14
Nodes (15): Database, utcDay(), utcMonthBounds(), withinUtcDays(), addDays(), fromHundredths(), sumDays(), toHundredths() (+7 more)

### Community 71 - "provider.ts"
Cohesion: 0.10
Nodes (18): CookieIO, CookieJar, CookieToSet, SESSION_MAX_AGE_SECONDS, AuthProvider, EmailLinkType, NO_PROVIDER_SESSION, ProviderResult (+10 more)

### Community 72 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Inspect changes, 2 — Stage deliberately, 3 — Write the commit message, 4 — Confirm, /commit, Steps, When to use

### Community 74 - "LeaveTrack UI — Design System"
Cohesion: 0.13
Nodes (14): Backlog, Color tokens, Components, Core, Iconography, Layout & breakpoints, Leave types, LeaveTrack UI — Design System (+6 more)

### Community 75 - "session.test.ts"
Cohesion: 0.20
Nodes (8): getSessionSecret(), globalForSession, load(), jar, now(), signIn(), now(), token()

### Community 76 - "/scaffold"
Cohesion: 0.25
Nodes (7): APPLY — Generate the Complete Boilerplate, Ecosystem reference, EVALUATE — Understand the Architecture and Design, PLAN — Boilerplate + UI Shell + Project Rules, Prerequisites, /scaffold, VALIDATE — Validate Infrastructure + Design Fidelity

### Community 77 - "Retro — Day 0 scaffold (2026-11-24)"
Cohesion: 0.33
Nodes (5): Coverage baseline (TASK-021, 2026-11-26), EPIC 2 planning (2026-11-26), Fixed in VALIDATE, Retro — Day 0 scaffold (2026-11-24), What went well

### Community 79 - "Steps"
Cohesion: 0.22
Nodes (8): 0 — Run code review first, 1 — Gather context, 2 — Draft the PR, 3 — Push and open the PR, 4 — Output, /create-pr, Steps, When to use

### Community 80 - "login/page.tsx"
Cohesion: 0.25
Nodes (8): dynamic, ForgotPasswordPage(), metadata, HIGHLIGHTS, LoginPage(), metadata, NOTICES, Brand()

### Community 81 - "ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR, Consequences, Context, Decision

### Community 82 - "ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions, Consequences, Context, Decision

### Community 83 - "Coding Standards — LeaveTrack"
Cohesion: 0.18
Nodes (10): API route handlers, Coding Standards — LeaveTrack, Dependencies, Hard-won rules (from Day 0 VALIDATE), Logging, Next.js 16, Testing, TypeScript (+2 more)

### Community 84 - "action-errors.test.ts"
Cohesion: 0.33
Nodes (4): getSession, input, service, code()

### Community 85 - "accrual/route.ts"
Cohesion: 0.24
Nodes (7): authorized(), GET, handler(), POST, getAccrualDeps(), OK, runMonthlyAccrual

### Community 87 - "set-task-status.mjs"
Cohesion: 0.20
Nodes (6): RFC-4180, matches, previous, STATUSES, [taskId, status, csvArg], temp

### Community 88 - "postgres.ts"
Cohesion: 0.25
Nodes (7): dynamic, GET, Driver, getSql(), globalForDb, wrap(), env

### Community 90 - "env.ts"
Cohesion: 0.11
Nodes (20): notFound(), POST(), tokenMatches(), DEPLOYED_APP_ENVS, DEPLOYED_VERCEL_ENVS, EnvSchema, isDeployedEnv(), isLocalUrl() (+12 more)

### Community 91 - "account-actions.test.ts"
Cohesion: 0.15
Nodes (12): LEGACY_SESSION_COOKIES, SESSION_COOKIE, sessionCookieOptions(), mockAuthProvider, NOT_LINKED_MESSAGE, WritableJar, state, fakeJar() (+4 more)

### Community 92 - "balance-writers.test.ts"
Cohesion: 0.31
Nodes (8): appFiles, files(), MOCK_FIELD, normalise(), root, Table, writersOf(), writesTable()

### Community 93 - "leave-request.ts"
Cohesion: 0.32
Nodes (6): DecisionInput, DecisionSchema, LeaveRequestInput, LeaveRequestSchema, RejectReasonSchema, valid

### Community 94 - "local-env.mjs"
Cohesion: 0.39
Nodes (6): isLocalUrl(), main(), managedValues(), planEnvFile(), unquote(), URL_KEYS

### Community 95 - "ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering"
Cohesion: 0.29
Nodes (6): ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering, Consequences, Context, Decision, Options considered, Policy changes vs catch-up

### Community 96 - "instrumentation.ts"
Cohesion: 0.38
Nodes (3): register(), assertEnvOrExit(), register()

### Community 97 - "set-task-status.test.ts"
Cohesion: 0.29
Nodes (3): dir, root, script

### Community 99 - "next.config.ts"
Cohesion: 0.50
Nodes (3): csp, nextConfig, securityHeaders

### Community 100 - "independence.test.ts"
Cohesion: 0.07
Nodes (31): USER_IDS, mockRepository, createMockDb(), mockDb, resetMockDb(), LeaveRequest, memoryDecideStore, memorySubmitStore (+23 more)

### Community 104 - "auth.spec.ts"
Cohesion: 0.09
Nodes (28): acceptInvite(), admin, anon, env, noSession, sql, assertTestEmail(), cleanupTestIdentities() (+20 more)

## Knowledge Gaps
- **620 isolated node(s):** `@commitlint/config-conventional`, `uvx`, `nexus-mcp`, `semi`, `singleQuote` (+615 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 743 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `decide.ts`, `package.json`, `approval-queue.tsx`, `memory-parity.test.ts`, `next`, `e2e/helpers.ts`, `roles.ts`, `invite-user.mjs`, `db/helpers.ts`, `types.ts`, `decide.test.ts`, `new/actions.ts`, `local-scripts.test.ts`, `fixtures.ts`, `repository.ts`, `provider.ts`, `session.test.ts`, `action-errors.test.ts`, `accrual/route.ts`, `env.ts`, `account-actions.test.ts`, `balance-writers.test.ts`, `leave-request.ts`, `instrumentation.ts`, `set-task-status.test.ts`, `coverage-summary.test.ts`, `independence.test.ts`, `auth.spec.ts`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `package.json`, `approval-queue.tsx`, `repositories.ts`, `react`, `mobile-nav.tsx`, `app/layout.tsx`, `login/actions.ts`, `roles.ts`, `login-form.tsx`, `new/actions.ts`, `Button`, `AppError`, `fixtures.ts`, `repository.ts`, `provider.ts`, `session.test.ts`, `login/page.tsx`, `accrual/route.ts`, `env.ts`, `account-actions.test.ts`, `next.config.ts`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `scripts` connect `scripts` to `package.json`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `uvx`, `nexus-mcp` to the rest of the system?**
  _620 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Business Requirements Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Should `Architecture Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._