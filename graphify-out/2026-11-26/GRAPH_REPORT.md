# Graph Report - leave-track  (2026-11-26)

## Corpus Check
- 213 files · ~86,762 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 6, .csv 2, .example 1)

## Summary
- 1290 nodes · 2967 edges · 85 communities (74 shown, 11 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 81 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `281cdad9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Business Requirements Document — LeaveTrack v1.0
- accrual/route.ts
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
- schema.test.ts
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
- login-form.tsx
- approval-queue.tsx
- cn
- app/layout.tsx
- Architecture Document — LeaveTrack v1.0
- postgres.ts
- roles.ts
- utils.ts
- request-form.tsx
- env.ts
- Prove the test can fail (from TASK-010)
- repositories.ts
- balance-writers.test.ts
- AppError
- independence.test.ts
- implement-api-route.md
- implement-ui-component.md
- write-migration.md
- e2e/helpers.ts
- Steps
- LeaveTrack UI — Design System
- leave-requests/route.ts
- decide.ts
- types.ts
- decide.test.ts
- Coding Standards — LeaveTrack
- utcMonthBounds
- LeaveTrack
- /scaffold
- vercel.json
- Revision v1.1 — EPIC 2 (2026-11-26)
- vitest
- reset/route.ts
- mobile-nav.tsx
- proxy.ts
- db/helpers.ts
- ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering
- Notifier
- instrumentation.ts
- Retro — Day 0 scaffold (2026-11-24)
- action-errors.test.ts
- eslint.config.mjs
- ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR
- ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions
- engines
- leave-request.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 93 edges
2. `vitest` - 40 edges
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
- `Security changes` --references--> `safeRedirectPath()`  [INFERRED]
  docs/arch-docs/ARCH-LeaveTrack-v1.0.md → lib/auth/roles.ts
- `Where data goes` --references--> `getSql()`  [INFERRED]
  README.md → lib/db/postgres.ts
- `Options considered` --references--> `SqlClient`  [INFERRED]
  docs/arch-docs/ADR-LeaveTrack-E003-Data-Access.md → lib/db/sql.ts

## Import Cycles
- None detected.

## Communities (85 total, 11 thin omitted)

### Community 0 - "Business Requirements Document — LeaveTrack v1.0"
Cohesion: 0.09
Nodes (21): Additional Functional Requirements, Additional Risks, Additional Stakeholder Concerns, Additional Success Criteria, Assumptions, Business Context, Business Requirements Document — LeaveTrack v1.0, Constraints (+13 more)

### Community 1 - "accrual/route.ts"
Cohesion: 0.14
Nodes (20): Backend standards, GET, ParamsSchema, QuerySchema, dynamic, GET, authorized(), GET (+12 more)

### Community 2 - "ADR-LeaveTrack-E001 — Auth & Session Strategy"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E001 — Auth & Session Strategy, Consequences, Context, Decision, Options Considered

### Community 3 - "Product Requirements Document — LeaveTrack v1.0"
Cohesion: 0.17
Nodes (11): Business Rules (EPIC 2), Non-Functional Requirements, Non-Functional Requirements (additions), Out of Scope, Out of Scope (additions), Product Requirements Document — LeaveTrack v1.0, Revision v1.1 — EPIC 2 (2026-11-26), User Roles (+3 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (26): description, @commitlint/config-conventional, name, private, version, @axe-core/playwright, clsx, @commitlint/cli (+18 more)

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
Cohesion: 0.12
Nodes (17): dependencies, class-variance-authority, clsx, geist, @hookform/resolvers, lucide-react, next, pino (+9 more)

### Community 9 - "scripts"
Cohesion: 0.11
Nodes (18): scripts, build, db:push, db:reset, dev, format, format:check, lint (+10 more)

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

### Community 25 - "schema.test.ts"
Cohesion: 0.17
Nodes (9): AUDIT_ACTIONS, LEAVE_TYPE_NAMES, REQUEST_STATUSES, ROLES, ARCH_TABLES, attempt(), EXPECTED_COLUMNS, EXPECTED_FKS (+1 more)

### Community 26 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Orient with your knowledge graph (if one exists), 2 — Load context in priority order, 3 — Output this summary, nothing else, 4 — Stop, Arguments, /evaluate, Steps

### Community 27 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Blast radius check, 2 — Write the implementation blueprint, 3 — State constraints, 4 — Stop and wait, /plan, Prerequisite, Steps

### Community 28 - "memory-parity.test.ts"
Cohesion: 0.14
Nodes (22): memoryAccrualStore, currentPeriod(), monthsToAccrue(), nextPeriod(), createPostgresAccrualStore(), AccrualDeps, MAX_CATCH_UP_MONTHS, runMonthlyAccrual() (+14 more)

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

### Community 36 - "login-form.tsx"
Cohesion: 0.17
Nodes (26): AuditPage(), metadata, one(), ALL_EMPLOYEES, AuditFilters(), AuditFiltersProps, LoginForm(), LoginFormProps (+18 more)

### Community 37 - "approval-queue.tsx"
Cohesion: 0.09
Nodes (57): AppError(), ForbiddenPage(), metadata, NotFound(), ApprovalQueue(), ApprovalQueueProps, BalanceHint(), DecisionDialog() (+49 more)

### Community 38 - "cn"
Cohesion: 0.12
Nodes (26): UserMenu(), UserMenuProps, Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage() (+18 more)

### Community 39 - "app/layout.tsx"
Cohesion: 0.22
Nodes (6): metadata, RootLayout(), viewport, Toaster(), geist, sonner

### Community 40 - "Architecture Document — LeaveTrack v1.0"
Cohesion: 0.25
Nodes (7): API Design (selected), Architecture Document — LeaveTrack v1.0, Data Model, Deployment Topology, Open Questions, Security, Stack

### Community 41 - "postgres.ts"
Cohesion: 0.18
Nodes (10): ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port, Consequences, Context, Decision, Options considered, selectRepository(), Driver, getSql() (+2 more)

### Community 42 - "roles.ts"
Cohesion: 0.22
Nodes (11): matches(), MAX_REDIRECT_LENGTH, NEVER_REDIRECT_TO, PUBLIC_PATHS, REDIRECT_BASES, REDIRECT_GUARDS, redirectRejection(), resolveRedirect() (+3 more)

### Community 43 - "utils.ts"
Cohesion: 0.36
Nodes (4): Separator(), Textarea(), radix-ui, react

### Community 44 - "request-form.tsx"
Cohesion: 0.19
Nodes (16): LEAVE_TYPE_META, EMPTY, RequestForm(), RequestFormProps, FormControl(), FormDescription(), FormField(), FormFieldContext (+8 more)

### Community 45 - "env.ts"
Cohesion: 0.14
Nodes (15): loginAction(), LoginSchema, LoginState, logoutAction(), sessionCookieOptions(), DEPLOYED_APP_ENVS, DEPLOYED_VERCEL_ENVS, env (+7 more)

### Community 46 - "Prove the test can fail (from TASK-010)"
Cohesion: 0.13
Nodes (15): DialogTrigger(), "Authorize before any database access" — prove it with a repository spy (from TASK-015), Browser e2e recipe (from TASK-016), Cross-cutting invariants: matrix + writer registry (from TASK-018), Defense in depth for "exactly once" writes (from TASK-014), Fail-closed configuration: test build time and runtime separately (from TASK-019), Headless browser tests with Radix overlays, Overlapping guards: name them and test each one directly (from TASK-020) (+7 more)

### Community 48 - "repositories.ts"
Cohesion: 0.07
Nodes (50): AGENTS.md — LeaveTrack, Frontend standards, Git conventions, Project, Quality gates (must pass before merge), Security rules, Stack, Task tracking (+42 more)

### Community 50 - "balance-writers.test.ts"
Cohesion: 0.05
Nodes (26): RFC-4180, METRICS, rows, matches, previous, STATUSES, [taskId, status, csvArg], dir (+18 more)

### Community 52 - "AppError"
Cohesion: 0.13
Nodes (19): POST, decideLeaveRequestAction(), AppError, ERROR_STATUS, ErrorCode, isAppError(), ApiFailure, ApiResponse (+11 more)

### Community 53 - "independence.test.ts"
Cohesion: 0.07
Nodes (24): createMockDb(), resetMockDb(), memoryDecideStore, BalanceContext, DecideInput, DecideOutcome, DecideStore, NewLeaveRequest (+16 more)

### Community 57 - "e2e/helpers.ts"
Cohesion: 0.25
Nodes (15): enlargeText(), expectNoHorizontalOverflow(), expectNotUnderHeader(), expectTapTargets(), expectVisibleFocus(), focusedLabel(), focusIndicatorChange(), Role (+7 more)

### Community 58 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Inspect changes, 2 — Stage deliberately, 3 — Write the commit message, 4 — Confirm, /commit, Steps, When to use

### Community 59 - "LeaveTrack UI — Design System"
Cohesion: 0.13
Nodes (14): Backlog, Color tokens, Components, Core, Iconography, Layout & breakpoints, Leave types, LeaveTrack UI — Design System (+6 more)

### Community 60 - "leave-requests/route.ts"
Cohesion: 0.24
Nodes (12): GET, ListQuerySchema, NO_STORE, POST, submitLeaveRequestAction(), LoginPage(), getSession, MyLeaveContext (+4 more)

### Community 61 - "decide.ts"
Cohesion: 0.18
Nodes (15): Session, DecideLeaveRequestResult, DecideWarning, SubmitLeaveRequestResult, SubmitWarning, DecideDeps, RequestIdSchema, LeaveRequestDecidedNotice (+7 more)

### Community 62 - "types.ts"
Cohesion: 0.07
Nodes (38): Backlog (deferred, owner = Day 1 team), availableForRequest(), buildBalanceSummaries(), PendingRange, byId(), toView(), typeOf(), userName() (+30 more)

### Community 63 - "decide.test.ts"
Cohesion: 0.15
Nodes (15): createPostgresDecideStore(), createPostgresSubmitStore(), ANA, audit(), balance(), BEN, CARLA, dbs (+7 more)

### Community 64 - "Coding Standards — LeaveTrack"
Cohesion: 0.22
Nodes (8): API route handlers, Coding Standards — LeaveTrack, Dependencies, Hard-won rules (from Day 0 VALIDATE), Logging, Next.js 16, Testing, UI

### Community 65 - "utcMonthBounds"
Cohesion: 0.36
Nodes (8): Database, utcDay(), utcMonthBounds(), withinUtcDays(), addDays(), fromHundredths(), sumDays(), toHundredths()

### Community 66 - "LeaveTrack"
Cohesion: 0.14
Nodes (13): Accrual job (TASK-017), Database, Environment, HR audit (TASK-015), Known limitations, Leave types are independent (TASK-018 / US-08), LeaveTrack, Project layout (+5 more)

### Community 67 - "/scaffold"
Cohesion: 0.25
Nodes (7): APPLY — Generate the Complete Boilerplate, Ecosystem reference, EVALUATE — Understand the Architecture and Design, PLAN — Boilerplate + UI Shell + Project Rules, Prerequisites, /scaffold, VALIDATE — Validate Infrastructure + Design Fidelity

### Community 69 - "Revision v1.1 — EPIC 2 (2026-11-26)"
Cohesion: 0.25
Nodes (8): Considered and not adopted, Data model additions (planned), Deployment changes, EPIC 2 decisions (adopted 2026-11-26), Open Questions (updated), Revision v1.1 — EPIC 2 (2026-11-26), Security changes, Stack changes

### Community 70 - "vitest"
Cohesion: 0.07
Nodes (34): accrualRuns, auditLog, BALANCE_ROWS, LAST_ACCRUAL_AT, LEAVE_TYPE_IDS, leaveBalances, leavePolicies, leaveRequests (+26 more)

### Community 71 - "reset/route.ts"
Cohesion: 0.21
Nodes (9): notFound(), POST(), tokenMatches(), TypeScript, isDeployedEnv(), parseEnv(), REQUIRED_WHEN_DEPLOYED, mobile (+1 more)

### Community 72 - "mobile-nav.tsx"
Cohesion: 0.15
Nodes (22): AppShell(), AppShellProps, Brand(), MobileNav(), activeHref(), NAV_ITEMS, NavItem, navItemsFor() (+14 more)

### Community 73 - "proxy.ts"
Cohesion: 0.36
Nodes (6): SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, isPublicPath(), isRole(), config, proxy()

### Community 74 - "db/helpers.ts"
Cohesion: 0.08
Nodes (22): SqlClient, SqlRow, @electric-sql/pglite, dbs, DEC, dbs, dbs, insertPending() (+14 more)

### Community 75 - "ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering"
Cohesion: 0.29
Nodes (6): ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering, Consequences, Context, Decision, Options considered, Policy changes vs catch-up

### Community 76 - "Notifier"
Cohesion: 0.29
Nodes (5): ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox, Consequences, Context, Decision, Notifier

### Community 77 - "instrumentation.ts"
Cohesion: 0.38
Nodes (3): register(), assertEnvOrExit(), register()

### Community 78 - "Retro — Day 0 scaffold (2026-11-24)"
Cohesion: 0.33
Nodes (5): Coverage baseline (TASK-021, 2026-11-26), EPIC 2 planning (2026-11-26), Fixed in VALIDATE, Retro — Day 0 scaffold (2026-11-24), What went well

### Community 79 - "action-errors.test.ts"
Cohesion: 0.33
Nodes (4): getSession, input, service, code()

### Community 81 - "ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR, Consequences, Context, Decision

### Community 82 - "ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions, Consequences, Context, Decision

### Community 86 - "leave-request.ts"
Cohesion: 0.38
Nodes (5): DecisionInput, LeaveRequestInput, LeaveRequestSchema, RejectReasonSchema, valid

## Knowledge Gaps
- **546 isolated node(s):** `@commitlint/config-conventional`, `uvx`, `nexus-mcp`, `semi`, `singleQuote` (+541 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 640 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `utcMonthBounds`, `package.json`, `approval-queue.tsx`, `reset/route.ts`, `db/helpers.ts`, `roles.ts`, `instrumentation.ts`, `action-errors.test.ts`, `balance-writers.test.ts`, `AppError`, `independence.test.ts`, `leave-request.ts`, `schema.test.ts`, `memory-parity.test.ts`, `decide.ts`, `types.ts`, `decide.test.ts`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Why does `next` connect `repositories.ts` to `accrual/route.ts`, `login-form.tsx`, `approval-queue.tsx`, `package.json`, `reset/route.ts`, `app/layout.tsx`, `mobile-nav.tsx`, `proxy.ts`, `vitest`, `db/helpers.ts`, `env.ts`, `AppError`, `leave-requests/route.ts`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `Coding Standards — LeaveTrack`, `login-form.tsx`, `approval-queue.tsx`, `mobile-nav.tsx`, `utils.ts`, `request-form.tsx`, `repositories.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `uvx`, `nexus-mcp` to the rest of the system?**
  _546 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Business Requirements Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `accrual/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13666666666666666 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._