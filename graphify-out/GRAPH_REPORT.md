# Graph Report - leave-track  (2026-11-26)

## Corpus Check
- 210 files · ~84,675 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 6, .csv 2, .example 1)

## Summary
- 1266 nodes · 2932 edges · 83 communities (72 shown, 11 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 80 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2b7fc48b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Business Requirements Document — LeaveTrack v1.0
- types.ts
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
- Steps
- Review Checklist
- Review Checklist
- Review Checklist
- Review Checklist
- Steps
- login-form.tsx
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
- cn
- approval-queue.tsx
- mobile-nav.tsx
- app/layout.tsx
- Revision v1.1 — EPIC 2 (2026-11-26)
- request-form.tsx
- approvals/actions.ts
- ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox
- repositories.ts
- next
- Prove the test can fail (from TASK-010)
- AppError
- balance-writers.test.ts
- api/errors.ts
- utcMonthBounds
- implement-api-route.md
- implement-ui-component.md
- write-migration.md
- e2e/helpers.ts
- Steps
- decide.test.ts
- leave-requests/route.ts
- decide.ts
- repository.ts
- audit/page.tsx
- login/actions.ts
- LeaveTrack
- vercel.json
- vitest
- fixtures.ts
- env.ts
- eslint.config.mjs
- LeaveTrack UI — Design System
- schema.test.ts
- engines
- independence.test.ts
- /scaffold
- ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR
- ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions
- safeRedirectPath
- Coding Standards — LeaveTrack
- postgres.ts
- ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering
- instrumentation.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 93 edges
2. `vitest` - 39 edges
3. `next` - 37 edges
4. `Button()` - 31 edges
5. `lucide-react` - 29 edges
6. `RequestForm()` - 24 edges
7. `AppError` - 24 edges
8. `DecisionDialog()` - 22 edges
9. `ApprovalQueue()` - 21 edges
10. `react` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Decision` --references--> `POST()`  [INFERRED]
  docs/arch-docs/ADR-LeaveTrack-E002-Accrual-Idempotency.md → app/api/test/reset/route.ts
- `API route handlers` --references--> `withErrorHandler()`  [INFERRED]
  knowledge/rules/coding-standards.md → lib/api/with-error-handler.ts
- `Where data goes` --references--> `getSql()`  [INFERRED]
  README.md → lib/db/postgres.ts
- `TypeScript` --references--> `isDeployedEnv()`  [INFERRED]
  knowledge/rules/coding-standards.md → lib/env.ts
- `Logging` --references--> `Logger`  [INFERRED]
  knowledge/rules/coding-standards.md → lib/logger.ts

## Import Cycles
- None detected.

## Communities (83 total, 11 thin omitted)

### Community 0 - "Business Requirements Document — LeaveTrack v1.0"
Cohesion: 0.09
Nodes (21): Additional Functional Requirements, Additional Risks, Additional Stakeholder Concerns, Additional Success Criteria, Assumptions, Business Context, Business Requirements Document — LeaveTrack v1.0, Constraints (+13 more)

### Community 1 - "types.ts"
Cohesion: 0.06
Nodes (41): Backlog (deferred, owner = Day 1 team), availableForRequest(), buildBalanceSummaries(), PendingRange, createPostgresRepository(), UserRow, LeaveRepository, selectRepository() (+33 more)

### Community 2 - "ADR-LeaveTrack-E001 — Auth & Session Strategy"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E001 — Auth & Session Strategy, Consequences, Context, Decision, Options Considered

### Community 3 - "Product Requirements Document — LeaveTrack v1.0"
Cohesion: 0.17
Nodes (11): Business Rules (EPIC 2), Non-Functional Requirements, Non-Functional Requirements (additions), Out of Scope, Out of Scope (additions), Product Requirements Document — LeaveTrack v1.0, Revision v1.1 — EPIC 2 (2026-11-26), User Roles (+3 more)

### Community 4 - "package.json"
Cohesion: 0.08
Nodes (25): description, @commitlint/config-conventional, name, private, version, class-variance-authority, clsx, @commitlint/cli (+17 more)

### Community 5 - "Architecture Document — LeaveTrack v1.0"
Cohesion: 0.10
Nodes (19): Adr-Leavetrack-E001 — Auth & Session Strategy, ADR-LeaveTrack-E001 — Auth & Session Strategy, Api Design (Selected), API Design (selected), Architecture Document — LeaveTrack v1.0, Architecture Summary, Consequences, Context (+11 more)

### Community 6 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 7 - "devDependencies"
Cohesion: 0.10
Nodes (21): devDependencies, @axe-core/playwright, @commitlint/cli, @commitlint/config-conventional, @electric-sql/pglite, eslint, eslint-config-next, husky (+13 more)

### Community 8 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, class-variance-authority, clsx, geist, @hookform/resolvers, lucide-react, next, pino (+9 more)

### Community 9 - "scripts"
Cohesion: 0.12
Nodes (17): scripts, build, db:push, db:reset, dev, format, format:check, lint (+9 more)

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

### Community 19 - "Steps"
Cohesion: 0.22
Nodes (8): 0 — Run code review first, 1 — Gather context, 2 — Draft the PR, 3 — Push and open the PR, 4 — Output, /create-pr, Steps, When to use

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

### Community 25 - "login-form.tsx"
Cohesion: 0.24
Nodes (18): AuditFilters(), AuditFiltersProps, LoginForm(), LoginFormProps, MockUserOption, ROLE_ORDER, Input(), Label() (+10 more)

### Community 26 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Orient with your knowledge graph (if one exists), 2 — Load context in priority order, 3 — Output this summary, nothing else, 4 — Stop, Arguments, /evaluate, Steps

### Community 27 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Blast radius check, 2 — Write the implementation blueprint, 3 — State constraints, 4 — Stop and wait, /plan, Prerequisite, Steps

### Community 28 - "memory-parity.test.ts"
Cohesion: 0.12
Nodes (21): memoryAccrualStore, currentPeriod(), monthsToAccrue(), nextPeriod(), createPostgresAccrualStore(), AccrualOutcome, AccrualStore, AccruedPeriod (+13 more)

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

### Community 36 - "cn"
Cohesion: 0.12
Nodes (27): UserMenu(), UserMenuProps, Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage() (+19 more)

### Community 37 - "approval-queue.tsx"
Cohesion: 0.09
Nodes (55): AppError(), ForbiddenPage(), metadata, NotFound(), ApprovalQueue(), ApprovalQueueProps, BalanceHint(), DecisionDialog() (+47 more)

### Community 38 - "mobile-nav.tsx"
Cohesion: 0.12
Nodes (25): AuthenticatedLayout(), HIGHLIGHTS, LoginPage(), metadata, AppShell(), AppShellProps, Brand(), MobileNav() (+17 more)

### Community 39 - "app/layout.tsx"
Cohesion: 0.22
Nodes (6): metadata, RootLayout(), viewport, Toaster(), geist, sonner

### Community 40 - "Revision v1.1 — EPIC 2 (2026-11-26)"
Cohesion: 0.13
Nodes (14): API Design (selected), Architecture Document — LeaveTrack v1.0, Considered and not adopted, Data Model, Data model additions (planned), Deployment changes, Deployment Topology, EPIC 2 decisions (adopted 2026-11-26) (+6 more)

### Community 41 - "request-form.tsx"
Cohesion: 0.16
Nodes (18): LEAVE_TYPE_META, EMPTY, RequestForm(), RequestFormProps, FormControl(), FormDescription(), FormField(), FormFieldContext (+10 more)

### Community 42 - "approvals/actions.ts"
Cohesion: 0.24
Nodes (15): Backend standards, GET, ParamsSchema, QuerySchema, POST, GET, decideLeaveRequestAction(), API additions (planned) (+7 more)

### Community 43 - "ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox"
Cohesion: 0.50
Nodes (3): ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox, Consequences, Context

### Community 44 - "repositories.ts"
Cohesion: 0.09
Nodes (43): AGENTS.md — LeaveTrack, Frontend standards, Git conventions, Project, Quality gates (must pass before merge), Stack, Task tracking, Where things go (+35 more)

### Community 45 - "next"
Cohesion: 0.12
Nodes (9): csp, nextConfig, securityHeaders, next, getSession, input, service, CASES (+1 more)

### Community 46 - "Prove the test can fail (from TASK-010)"
Cohesion: 0.12
Nodes (15): DialogTrigger(), "Authorize before any database access" — prove it with a repository spy (from TASK-015), Browser e2e recipe (from TASK-016), Cross-cutting invariants: matrix + writer registry (from TASK-018), Defense in depth for "exactly once" writes (from TASK-014), Fail-closed configuration: test build time and runtime separately (from TASK-019), Headless browser tests with Radix overlays, Pattern — Implement-and-test chain (+7 more)

### Community 48 - "AppError"
Cohesion: 0.24
Nodes (11): authorized(), GET, handler(), POST, getAccrualDeps(), AccrualDeps, MAX_CATCH_UP_MONTHS, runMonthlyAccrual() (+3 more)

### Community 50 - "balance-writers.test.ts"
Cohesion: 0.08
Nodes (22): RFC-4180, matches, previous, STATUSES, [taskId, status, csvArg], files(), root, appFiles (+14 more)

### Community 52 - "api/errors.ts"
Cohesion: 0.22
Nodes (10): ERROR_STATUS, ErrorCode, ApiFailure, ApiResponse, ApiSuccess, fail(), RouteHandler, BY_CONSTRAINT (+2 more)

### Community 53 - "utcMonthBounds"
Cohesion: 0.36
Nodes (8): Database, utcDay(), utcMonthBounds(), withinUtcDays(), addDays(), fromHundredths(), sumDays(), toHundredths()

### Community 57 - "e2e/helpers.ts"
Cohesion: 0.20
Nodes (17): enlargeText(), expectNoHorizontalOverflow(), expectNotUnderHeader(), expectTapTargets(), expectVisibleFocus(), focusedLabel(), focusIndicatorChange(), Role (+9 more)

### Community 58 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Inspect changes, 2 — Stage deliberately, 3 — Write the commit message, 4 — Confirm, /commit, Steps, When to use

### Community 59 - "decide.test.ts"
Cohesion: 0.21
Nodes (10): ANA, audit(), balance(), BEN, CARLA, dbs, MAYA, R (+2 more)

### Community 60 - "leave-requests/route.ts"
Cohesion: 0.29
Nodes (9): ListQuerySchema, NO_STORE, POST, submitLeaveRequestAction(), isAppError(), ActionResult, getSubmitDeps(), submitLeaveRequest() (+1 more)

### Community 61 - "decide.ts"
Cohesion: 0.13
Nodes (19): Decision, DecideLeaveRequestResult, DecideWarning, DecideDeps, RequestIdSchema, LeaveRequestDecidedNotice, LeaveRequestSubmittedNotice, logNotifier (+11 more)

### Community 62 - "repository.ts"
Cohesion: 0.13
Nodes (14): USER_IDS, byId(), mockRepository, toView(), typeOf(), userName(), mockDb, AUDIT_LOG_LIMIT (+6 more)

### Community 63 - "audit/page.tsx"
Cohesion: 0.38
Nodes (8): AuditPage(), metadata, one(), ALL_EMPLOYEES, Alert(), AlertDescription(), AlertTitle(), alertVariants

### Community 65 - "login/actions.ts"
Cohesion: 0.21
Nodes (10): loginAction(), LoginSchema, LoginState, logoutAction(), SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, sessionCookieOptions(), isProduction (+2 more)

### Community 66 - "LeaveTrack"
Cohesion: 0.14
Nodes (13): Accrual job (TASK-017), Database, Environment, HR audit (TASK-015), Known limitations, Leave types are independent (TASK-018 / US-08), LeaveTrack, Project layout (+5 more)

### Community 69 - "vitest"
Cohesion: 0.17
Nodes (13): APPLY — Generate the Complete Boilerplate, Next.js 16, canAccess(), isPublicPath(), isRole(), matches(), PUBLIC_PATHS, ROLE_LABEL (+5 more)

### Community 70 - "fixtures.ts"
Cohesion: 0.08
Nodes (23): accrualRuns, auditLog, BALANCE_ROWS, LAST_ACCRUAL_AT, LEAVE_TYPE_IDS, leaveBalances, leavePolicies, leaveRequests (+15 more)

### Community 71 - "env.ts"
Cohesion: 0.19
Nodes (13): notFound(), POST(), tokenMatches(), DEPLOYED_APP_ENVS, DEPLOYED_VERCEL_ENVS, EnvSchema, isDeployedEnv(), optionalSecret (+5 more)

### Community 73 - "LeaveTrack UI — Design System"
Cohesion: 0.13
Nodes (14): Backlog, Color tokens, Components, Core, Iconography, Layout & breakpoints, Leave types, LeaveTrack UI — Design System (+6 more)

### Community 74 - "schema.test.ts"
Cohesion: 0.06
Nodes (30): ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port, Consequences, Context, Decision, Options considered, Security-scoped queries: assert the scope structurally (from TASK-013), SqlClient, createPostgresSubmitStore() (+22 more)

### Community 78 - "independence.test.ts"
Cohesion: 0.06
Nodes (34): createMockDb(), resetMockDb(), toIso(), memoryDecideStore, createPostgresDecideStore(), DecidedRow, RequestRow, toLeaveRequest() (+26 more)

### Community 79 - "/scaffold"
Cohesion: 0.29
Nodes (6): Ecosystem reference, EVALUATE — Understand the Architecture and Design, PLAN — Boilerplate + UI Shell + Project Rules, Prerequisites, /scaffold, VALIDATE — Validate Infrastructure + Design Fidelity

### Community 81 - "ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR, Consequences, Context, Decision

### Community 82 - "ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions, Consequences, Context, Decision

### Community 83 - "safeRedirectPath"
Cohesion: 0.25
Nodes (7): Security rules, Security changes, EPIC 2 planning (2026-11-26), Fixed in VALIDATE, Retro — Day 0 scaffold (2026-11-24), What went well, safeRedirectPath()

### Community 88 - "Coding Standards — LeaveTrack"
Cohesion: 0.22
Nodes (8): API route handlers, Coding Standards — LeaveTrack, Dependencies, Hard-won rules (from Day 0 VALIDATE), Logging, Testing, TypeScript, UI

### Community 89 - "postgres.ts"
Cohesion: 0.25
Nodes (7): dynamic, GET, Driver, getSql(), globalForDb, wrap(), env

### Community 90 - "ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering"
Cohesion: 0.29
Nodes (6): ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering, Consequences, Context, Decision, Options considered, Policy changes vs catch-up

### Community 91 - "instrumentation.ts"
Cohesion: 0.38
Nodes (3): register(), assertEnvOrExit(), register()

## Knowledge Gaps
- **535 isolated node(s):** `@commitlint/config-conventional`, `uvx`, `nexus-mcp`, `semi`, `singleQuote` (+530 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 623 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `types.ts`, `package.json`, `approval-queue.tsx`, `fixtures.ts`, `env.ts`, `decide.test.ts`, `schema.test.ts`, `next`, `independence.test.ts`, `balance-writers.test.ts`, `api/errors.ts`, `utcMonthBounds`, `instrumentation.ts`, `memory-parity.test.ts`, `decide.ts`, `repository.ts`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `login/actions.ts`, `package.json`, `approval-queue.tsx`, `mobile-nav.tsx`, `env.ts`, `app/layout.tsx`, `vitest`, `approvals/actions.ts`, `fixtures.ts`, `repositories.ts`, `AppError`, `api/errors.ts`, `login-form.tsx`, `leave-requests/route.ts`, `repository.ts`, `audit/page.tsx`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `approval-queue.tsx`, `mobile-nav.tsx`, `request-form.tsx`, `repositories.ts`, `Coding Standards — LeaveTrack`, `login-form.tsx`, `audit/page.tsx`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `uvx`, `nexus-mcp` to the rest of the system?**
  _535 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Business Requirements Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06078316773816481 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._