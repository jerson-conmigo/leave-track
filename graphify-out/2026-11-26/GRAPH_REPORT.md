# Graph Report - leave-track  (2026-11-26)

## Corpus Check
- 175 files · ~65,581 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 6, .example 1, .css 1)

## Summary
- 1085 nodes · 2501 edges · 72 communities (62 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 62 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4ced20d6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Business Requirements Document — LeaveTrack v1.0
- Architecture Document — LeaveTrack v1.0
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
- Steps
- Steps
- Steps
- types.ts
- .prettierrc.json
- pr-verifier.md
- Steps
- Steps
- nexus
- extends
- postcss.config.mjs
- repositories.ts
- cn
- LeaveTrack UI — Design System
- app/layout.tsx
- schema.test.ts
- balance-card.tsx
- decide.ts
- approval-queue.tsx
- decide.test.ts
- route.test.ts
- Prove the test can fail (from TASK-010)
- repository.ts
- set-task-status.mjs
- Coding Standards — LeaveTrack
- mobile-nav.tsx
- implement-api-route.md
- implement-ui-component.md
- write-migration.md
- e2e/helpers.ts
- postgres-repository.ts
- LeaveRepository
- vitest
- submit.test.ts
- decide-memory.test.ts
- format.ts
- reset/route.ts
- postgres-repository.test.ts
- Backlog (deferred, owner = Day 1 team)
- roles.ts
- SqlClient
- eslint.config.mjs
- engines
- leave-requests/store.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 93 edges
2. `next` - 33 edges
3. `Button()` - 31 edges
4. `lucide-react` - 29 edges
5. `RequestForm()` - 24 edges
6. `vitest` - 24 edges
7. `DecisionDialog()` - 22 edges
8. `ApprovalQueue()` - 21 edges
9. `react` - 21 edges
10. `formatDays()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `UI` --references--> `Table()`  [INFERRED]
  knowledge/rules/coding-standards.md → components/ui/table.tsx
- `API route handlers` --references--> `withErrorHandler()`  [INFERRED]
  knowledge/rules/coding-standards.md → lib/api/with-error-handler.ts
- `Where data goes` --references--> `getSql()`  [INFERRED]
  README.md → lib/db/postgres.ts
- `Security-scoped queries: assert the scope structurally (from TASK-013)` --references--> `SqlClient`  [INFERRED]
  knowledge/patterns/implement-and-test.md → lib/db/sql.ts
- `Logging` --references--> `Logger`  [INFERRED]
  knowledge/rules/coding-standards.md → lib/logger.ts

## Import Cycles
- None detected.

## Communities (72 total, 10 thin omitted)

### Community 0 - "Business Requirements Document — LeaveTrack v1.0"
Cohesion: 0.14
Nodes (13): Assumptions, Business Context, Business Requirements Document — LeaveTrack v1.0, Constraints, Executive Summary, Functional Requirements, In Scope, Non-Functional Requirements (+5 more)

### Community 1 - "Architecture Document — LeaveTrack v1.0"
Cohesion: 0.25
Nodes (7): API Design (selected), Architecture Document — LeaveTrack v1.0, Data Model, Deployment Topology, Open Questions, Security, Stack

### Community 2 - "ADR-LeaveTrack-E001 — Auth & Session Strategy"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E001 — Auth & Session Strategy, Consequences, Context, Decision, Options Considered

### Community 3 - "Product Requirements Document — LeaveTrack v1.0"
Cohesion: 0.33
Nodes (5): Non-Functional Requirements, Out of Scope, Product Requirements Document — LeaveTrack v1.0, User Roles, User Stories

### Community 4 - "package.json"
Cohesion: 0.08
Nodes (25): description, @commitlint/config-conventional, name, private, version, @axe-core/playwright, class-variance-authority, clsx (+17 more)

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

### Community 25 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Inspect changes, 2 — Stage deliberately, 3 — Write the commit message, 4 — Confirm, /commit, Steps, When to use

### Community 26 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Orient with your knowledge graph (if one exists), 2 — Load context in priority order, 3 — Output this summary, nothing else, 4 — Stop, Arguments, /evaluate, Steps

### Community 27 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Blast radius check, 2 — Write the implementation blueprint, 3 — State constraints, 4 — Stop and wait, /plan, Prerequisite, Steps

### Community 28 - "types.ts"
Cohesion: 0.16
Nodes (12): PendingRange, AuditEvent, AuditHistoryFilter, AuditLogEntry, AuditRequestRecord, BalanceSummary, Decision, EmployeeAuditHistory (+4 more)

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

### Community 36 - "repositories.ts"
Cohesion: 0.05
Nodes (69): AGENTS.md — LeaveTrack, Backend standards, Frontend standards, Git conventions, Project, Quality gates (must pass before merge), Security rules, Stack (+61 more)

### Community 37 - "cn"
Cohesion: 0.05
Nodes (90): AuditPage(), metadata, one(), AppError(), ForbiddenPage(), metadata, NotFound(), DecisionDialog() (+82 more)

### Community 38 - "LeaveTrack UI — Design System"
Cohesion: 0.13
Nodes (14): Backlog, Color tokens, Components, Core, Iconography, Layout & breakpoints, Leave types, LeaveTrack UI — Design System (+6 more)

### Community 39 - "app/layout.tsx"
Cohesion: 0.22
Nodes (6): metadata, RootLayout(), viewport, Toaster(), geist, sonner

### Community 40 - "schema.test.ts"
Cohesion: 0.11
Nodes (17): AUDIT_ACTIONS, LEAVE_TYPE_NAMES, REQUEST_STATUSES, @electric-sql/pglite, createTestDb(), migratedDb(), MIGRATION_FILES, MIGRATIONS (+9 more)

### Community 41 - "balance-card.tsx"
Cohesion: 0.18
Nodes (23): BalancePage(), metadata, DashboardPage(), metadata, StatCard(), Loading(), metadata, NewRequestPage() (+15 more)

### Community 42 - "decide.ts"
Cohesion: 0.14
Nodes (14): Session, DecideLeaveRequestResult, DecideWarning, SubmitLeaveRequestResult, SubmitWarning, DecideDeps, RequestIdSchema, SubmitDeps (+6 more)

### Community 43 - "approval-queue.tsx"
Cohesion: 0.20
Nodes (30): ApprovalQueue(), ApprovalQueueProps, BalanceHint(), ActionBadge(), AuditTable(), EmptyState(), EmptyStateProps, LeaveTypeBadge() (+22 more)

### Community 44 - "decide.test.ts"
Cohesion: 0.21
Nodes (10): ANA, audit(), balance(), BEN, CARLA, dbs, MAYA, R (+2 more)

### Community 45 - "route.test.ts"
Cohesion: 0.12
Nodes (12): LEAVE_TYPE_IDS, BEN, getSession, MAYA, session(), ANA_SESSION, BEN_SESSION, BENS_TEAM (+4 more)

### Community 46 - "Prove the test can fail (from TASK-010)"
Cohesion: 0.15
Nodes (12): DialogTrigger(), "Authorize before any database access" — prove it with a repository spy (from TASK-015), Browser e2e recipe (from TASK-016), Defense in depth for "exactly once" writes (from TASK-014), Headless browser tests with Radix overlays, Pattern — Implement-and-test chain, Prove the test can fail (from TASK-010), Rules of the chain (+4 more)

### Community 48 - "repository.ts"
Cohesion: 0.14
Nodes (19): auditLog, BALANCE_ROWS, LAST_ACCRUAL_AT, leaveBalances, leavePolicies, leaveRequests, leaveTypes, USER_IDS (+11 more)

### Community 50 - "set-task-status.mjs"
Cohesion: 0.22
Nodes (5): RFC-4180, matches, previous, STATUSES, [taskId, status, csvArg]

### Community 52 - "Coding Standards — LeaveTrack"
Cohesion: 0.19
Nodes (12): API route handlers, Coding Standards — LeaveTrack, Database, Dependencies, Hard-won rules (from Day 0 VALIDATE), Logging, Testing, TypeScript (+4 more)

### Community 53 - "mobile-nav.tsx"
Cohesion: 0.14
Nodes (23): AuthenticatedLayout(), LoginPage(), AppShell(), AppShellProps, Brand(), MobileNav(), activeHref(), NAV_ITEMS (+15 more)

### Community 57 - "e2e/helpers.ts"
Cohesion: 0.21
Nodes (16): enlargeText(), expectNoHorizontalOverflow(), expectNotUnderHeader(), expectTapTargets(), expectVisibleFocus(), focusedLabel(), focusIndicatorChange(), Role (+8 more)

### Community 58 - "postgres-repository.ts"
Cohesion: 0.23
Nodes (11): availableForRequest(), buildBalanceSummaries(), createPostgresRepository(), UserRow, AuditAction, LeaveTypeName, toRequestView(), countDays() (+3 more)

### Community 59 - "LeaveRepository"
Cohesion: 0.18
Nodes (7): LeaveRepository, LeaveRequestView, OrgStats, PolicyView, TeamRequestView, User, reads()

### Community 60 - "vitest"
Cohesion: 0.18
Nodes (6): vitest, getEmployeeAuditHistory, getSession, HR, files(), root

### Community 61 - "submit.test.ts"
Cohesion: 0.20
Nodes (6): Notifier, createPostgresSubmitStore(), ANA, CARLA, dbs, submit()

### Community 62 - "decide-memory.test.ts"
Cohesion: 0.12
Nodes (16): SqlRow, toIso(), toNumber(), memoryDecideStore, createPostgresDecideStore(), DecidedRow, RequestRow, toLeaveRequest() (+8 more)

### Community 63 - "format.ts"
Cohesion: 0.31
Nodes (6): dateFmt, dateTimeFmt, formatDateTime(), formatDayNumber(), plain(), toUtc()

### Community 64 - "reset/route.ts"
Cohesion: 0.36
Nodes (5): notFound(), POST(), tokenMatches(), createMockDb(), resetMockDb()

### Community 65 - "postgres-repository.test.ts"
Cohesion: 0.33
Nodes (5): users, dbs, insertPending(), MIA_REPORTS, seedMiasTeam()

### Community 66 - "Backlog (deferred, owner = Day 1 team)"
Cohesion: 0.29
Nodes (5): Backlog (deferred, owner = Day 1 team), Fixed in VALIDATE, Retro — Day 0 scaffold (2026-11-24), What went well, AuditEntryView

### Community 67 - "roles.ts"
Cohesion: 0.06
Nodes (38): loginAction(), LoginSchema, LoginState, logoutAction(), APPLY — Generate the Complete Boilerplate, Ecosystem reference, EVALUATE — Understand the Architecture and Design, PLAN — Boilerplate + UI Shell + Project Rules (+30 more)

### Community 68 - "SqlClient"
Cohesion: 0.22
Nodes (6): ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port, Consequences, Context, Decision, Options considered, SqlClient

### Community 71 - "leave-requests/store.ts"
Cohesion: 0.17
Nodes (7): LeaveType, BalanceContext, DecideInput, DecideOutcome, NewLeaveRequest, Requester, SubmitStore

## Knowledge Gaps
- **455 isolated node(s):** `@commitlint/config-conventional`, `uvx`, `nexus-mcp`, `semi`, `singleQuote` (+450 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 531 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `repositories.ts` to `reset/route.ts`, `roles.ts`, `package.json`, `cn`, `app/layout.tsx`, `balance-card.tsx`, `approval-queue.tsx`, `route.test.ts`, `mobile-nav.tsx`, `vitest`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `balance-card.tsx`, `approval-queue.tsx`, `Coding Standards — LeaveTrack`, `mobile-nav.tsx`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `uvx`, `nexus-mcp` to the rest of the system?**
  _455 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Business Requirements Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `Architecture Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._