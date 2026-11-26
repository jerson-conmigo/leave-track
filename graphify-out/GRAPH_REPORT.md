# Graph Report - leave-track  (2026-11-26)

## Corpus Check
- 206 files · ~83,132 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 6, .csv 2, .example 1)

## Summary
- 1251 nodes · 2903 edges · 82 communities (73 shown, 9 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 79 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f4d37cb6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Business Requirements Document — LeaveTrack v1.0
- repositories.ts
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
- request-form.tsx
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
- leave-requests/route.test.ts
- login-form.tsx
- repository.ts
- decision-dialog.tsx
- requireRole
- Button
- Prove the test can fail (from TASK-010)
- decide.test.ts
- balance-writers.test.ts
- audit.test.ts
- types.ts
- implement-api-route.md
- implement-ui-component.md
- write-migration.md
- e2e/helpers.ts
- Steps
- independence.test.ts
- api/errors.ts
- next
- fixtures.ts
- leave-requests/route.ts
- postgres-repository.ts
- audit/page.tsx
- LeaveTrack
- decide-memory.test.ts
- vercel.json
- leave-requests/postgres-store.ts
- roles.ts
- postgres.ts
- decide.ts
- LeaveTrack UI — Design System
- schema.test.ts
- accrual/route.ts
- decimal.ts
- new/actions.ts
- ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox
- leave-request.ts
- ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR
- ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions

## God Nodes (most connected - your core abstractions)
1. `cn()` - 93 edges
2. `next` - 37 edges
3. `vitest` - 37 edges
4. `Button()` - 31 edges
5. `lucide-react` - 29 edges
6. `RequestForm()` - 24 edges
7. `AppError` - 24 edges
8. `DecisionDialog()` - 22 edges
9. `ApprovalQueue()` - 21 edges
10. `react` - 21 edges

## Surprising Connections (you probably didn't know these)
- `API route handlers` --references--> `withErrorHandler()`  [INFERRED]
  knowledge/rules/coding-standards.md → lib/api/with-error-handler.ts
- `Where data goes` --references--> `getSql()`  [INFERRED]
  README.md → lib/db/postgres.ts
- `Options considered` --references--> `SqlClient`  [INFERRED]
  docs/arch-docs/ADR-LeaveTrack-E003-Data-Access.md → lib/db/sql.ts
- `Security-scoped queries: assert the scope structurally (from TASK-013)` --references--> `SqlClient`  [INFERRED]
  knowledge/patterns/implement-and-test.md → lib/db/sql.ts
- `Logging` --references--> `Logger`  [INFERRED]
  knowledge/rules/coding-standards.md → lib/logger.ts

## Import Cycles
- None detected.

## Communities (82 total, 9 thin omitted)

### Community 0 - "Business Requirements Document — LeaveTrack v1.0"
Cohesion: 0.09
Nodes (21): Additional Functional Requirements, Additional Risks, Additional Stakeholder Concerns, Additional Success Criteria, Assumptions, Business Context, Business Requirements Document — LeaveTrack v1.0, Constraints (+13 more)

### Community 1 - "repositories.ts"
Cohesion: 0.14
Nodes (13): LeaveRepository, AuditEntryView, AuditFilter, AuditHistoryFilter, BalanceSummary, EmployeeAuditHistory, LeaveRequestView, OrgStats (+5 more)

### Community 2 - "ADR-LeaveTrack-E001 — Auth & Session Strategy"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E001 — Auth & Session Strategy, Consequences, Context, Decision, Options Considered

### Community 3 - "Product Requirements Document — LeaveTrack v1.0"
Cohesion: 0.17
Nodes (11): Business Rules (EPIC 2), Non-Functional Requirements, Non-Functional Requirements (additions), Out of Scope, Out of Scope (additions), Product Requirements Document — LeaveTrack v1.0, Revision v1.1 — EPIC 2 (2026-11-26), User Roles (+3 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (29): description, engines, node, @commitlint/config-conventional, name, private, version, @axe-core/playwright (+21 more)

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

### Community 25 - "request-form.tsx"
Cohesion: 0.19
Nodes (16): LEAVE_TYPE_META, EMPTY, RequestForm(), RequestFormProps, FormControl(), FormDescription(), FormField(), FormFieldContext (+8 more)

### Community 26 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Orient with your knowledge graph (if one exists), 2 — Load context in priority order, 3 — Output this summary, nothing else, 4 — Stop, Arguments, /evaluate, Steps

### Community 27 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Blast radius check, 2 — Write the implementation blueprint, 3 — State constraints, 4 — Stop and wait, /plan, Prerequisite, Steps

### Community 28 - "memory-parity.test.ts"
Cohesion: 0.15
Nodes (21): memoryAccrualStore, currentPeriod(), monthsToAccrue(), nextPeriod(), createPostgresAccrualStore(), AccrualDeps, MAX_CATCH_UP_MONTHS, runMonthlyAccrual() (+13 more)

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
Nodes (27): logoutAction(), UserMenu(), UserMenuProps, Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount() (+19 more)

### Community 37 - "approval-queue.tsx"
Cohesion: 0.09
Nodes (58): BalancePage(), metadata, DashboardPage(), metadata, StatCard(), Loading(), metadata, NewRequestPage() (+50 more)

### Community 38 - "mobile-nav.tsx"
Cohesion: 0.17
Nodes (17): AuthenticatedLayout(), HIGHLIGHTS, LoginPage(), metadata, AppShell(), AppShellProps, Brand(), MobileNav() (+9 more)

### Community 39 - "app/layout.tsx"
Cohesion: 0.22
Nodes (6): metadata, RootLayout(), viewport, Toaster(), geist, sonner

### Community 40 - "leave-requests/route.test.ts"
Cohesion: 0.18
Nodes (8): session(), ANA_SESSION, BEN_SESSION, BENS_TEAM, CARLA_SESSION, getSession, Row, validBody

### Community 41 - "login-form.tsx"
Cohesion: 0.23
Nodes (19): loginAction(), LoginState, AuditFilters(), AuditFiltersProps, LoginForm(), LoginFormProps, MockUserOption, ROLE_ORDER (+11 more)

### Community 42 - "repository.ts"
Cohesion: 0.27
Nodes (8): Database, utcDay(), utcMonthBounds(), withinUtcDays(), byId(), toView(), typeOf(), userName()

### Community 43 - "decision-dialog.tsx"
Cohesion: 0.17
Nodes (17): DecisionDialog(), confirm(), handleOpenChange(), DecisionDialogProps, Dialog(), DialogContent(), DialogDescription(), DialogFooter() (+9 more)

### Community 44 - "requireRole"
Cohesion: 0.05
Nodes (37): AGENTS.md — LeaveTrack, Frontend standards, Git conventions, Project, Quality gates (must pass before merge), Security rules, Stack, Task tracking (+29 more)

### Community 45 - "Button"
Cohesion: 0.35
Nodes (8): AppError(), ForbiddenPage(), metadata, NotFound(), StatusScreen(), StatusScreenProps, Button(), buttonVariants

### Community 46 - "Prove the test can fail (from TASK-010)"
Cohesion: 0.12
Nodes (15): DialogTrigger(), "Authorize before any database access" — prove it with a repository spy (from TASK-015), Browser e2e recipe (from TASK-016), Cross-cutting invariants: matrix + writer registry (from TASK-018), Defense in depth for "exactly once" writes (from TASK-014), Headless browser tests with Radix overlays, Pattern — Implement-and-test chain, Precision tests need inputs that really drift (from TASK-017) (+7 more)

### Community 48 - "decide.test.ts"
Cohesion: 0.11
Nodes (18): createPostgresDecideStore(), createPostgresSubmitStore(), ANA, audit(), balance(), BEN, CARLA, dbs (+10 more)

### Community 50 - "balance-writers.test.ts"
Cohesion: 0.08
Nodes (22): RFC-4180, matches, previous, STATUSES, [taskId, status, csvArg], files(), root, appFiles (+14 more)

### Community 52 - "audit.test.ts"
Cohesion: 0.11
Nodes (12): leaveRequests, users, SqlClient, SqlRow, @electric-sql/pglite, dbs, DEC, dbs (+4 more)

### Community 53 - "types.ts"
Cohesion: 0.14
Nodes (14): PendingRange, AccrualResult, AccrualRun, AuditEvent, AuditLogEntry, AuditRequestRecord, DecideLeaveRequestResult, DecideWarning (+6 more)

### Community 57 - "e2e/helpers.ts"
Cohesion: 0.12
Nodes (25): notFound(), POST(), tokenMatches(), ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering, Consequences, Context, Decision, Options considered (+17 more)

### Community 58 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Inspect changes, 2 — Stage deliberately, 3 — Write the commit message, 4 — Confirm, /commit, Steps, When to use

### Community 59 - "independence.test.ts"
Cohesion: 0.18
Nodes (11): createMockDb(), resetMockDb(), ANA, BEN, dbs, Harness, HARNESSES, memoryHarness() (+3 more)

### Community 60 - "api/errors.ts"
Cohesion: 0.14
Nodes (17): Backend standards, API additions (planned), Example — TASK-014 (approve/reject), ERROR_STATUS, ErrorCode, ApiFailure, ApiResponse, ApiSuccess (+9 more)

### Community 61 - "next"
Cohesion: 0.16
Nodes (11): metadata, metadata, LoginSchema, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, sessionCookieOptions(), repository, csp (+3 more)

### Community 62 - "fixtures.ts"
Cohesion: 0.11
Nodes (21): accrualRuns, auditLog, BALANCE_ROWS, LAST_ACCRUAL_AT, LEAVE_TYPE_IDS, leaveBalances, leavePolicies, leaveTypes (+13 more)

### Community 63 - "leave-requests/route.ts"
Cohesion: 0.22
Nodes (15): GET, ParamsSchema, QuerySchema, POST, GET, ListQuerySchema, NO_STORE, POST (+7 more)

### Community 64 - "postgres-repository.ts"
Cohesion: 0.20
Nodes (13): Backlog (deferred, owner = Day 1 team), availableForRequest(), buildBalanceSummaries(), createPostgresRepository(), UserRow, selectRepository(), AUDIT_LOG_LIMIT, AuditAction (+5 more)

### Community 65 - "audit/page.tsx"
Cohesion: 0.38
Nodes (8): AuditPage(), metadata, one(), ALL_EMPLOYEES, Alert(), AlertDescription(), AlertTitle(), alertVariants

### Community 66 - "LeaveTrack"
Cohesion: 0.13
Nodes (14): Accrual job (TASK-017), Database, Day 1 hand-off notes, Environment, HR audit (TASK-015), Known limitations, Leave types are independent (TASK-018 / US-08), LeaveTrack (+6 more)

### Community 67 - "decide-memory.test.ts"
Cohesion: 0.20
Nodes (7): memoryDecideStore, DecideStore, BEN, ManagerSession, MAYA, notifier, SCRIPT

### Community 69 - "leave-requests/postgres-store.ts"
Cohesion: 0.13
Nodes (13): LeaveRequest, LeaveType, RequestStatus, toIso(), DecidedRow, RequestRow, toLeaveRequest(), BalanceContext (+5 more)

### Community 70 - "roles.ts"
Cohesion: 0.07
Nodes (32): APPLY — Generate the Complete Boilerplate, Ecosystem reference, EVALUATE — Understand the Architecture and Design, PLAN — Boilerplate + UI Shell + Project Rules, Prerequisites, /scaffold, VALIDATE — Validate Infrastructure + Design Fidelity, activeHref() (+24 more)

### Community 71 - "postgres.ts"
Cohesion: 0.15
Nodes (12): dynamic, GET, Driver, getSql(), globalForDb, wrap(), env, EnvSchema (+4 more)

### Community 72 - "decide.ts"
Cohesion: 0.24
Nodes (12): Session, DecideDeps, RequestIdSchema, LeaveRequestDecidedNotice, LeaveRequestSubmittedNotice, logNotifier, Notifier, SubmitDeps (+4 more)

### Community 73 - "LeaveTrack UI — Design System"
Cohesion: 0.13
Nodes (14): Backlog, Color tokens, Components, Core, Iconography, Layout & breakpoints, Leave types, LeaveTrack UI — Design System (+6 more)

### Community 74 - "schema.test.ts"
Cohesion: 0.09
Nodes (22): ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port, Consequences, Context, Decision, Options considered, AUDIT_ACTIONS, LEAVE_TYPE_NAMES, REQUEST_STATUSES (+14 more)

### Community 75 - "accrual/route.ts"
Cohesion: 0.24
Nodes (7): authorized(), GET, handler(), POST, getAccrualDeps(), OK, runMonthlyAccrual

### Community 76 - "decimal.ts"
Cohesion: 0.73
Nodes (4): addDays(), fromHundredths(), sumDays(), toHundredths()

### Community 77 - "new/actions.ts"
Cohesion: 0.20
Nodes (11): decideLeaveRequestAction(), submitLeaveRequestAction(), isAppError(), ActionResult, getDecideDeps(), getSubmitDeps(), submitLeaveRequest(), getSession (+3 more)

### Community 79 - "ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox"
Cohesion: 0.29
Nodes (4): ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox, Consequences, Context, Decision

### Community 80 - "leave-request.ts"
Cohesion: 0.38
Nodes (5): DecisionInput, LeaveRequestInput, LeaveRequestSchema, RejectReasonSchema, valid

### Community 81 - "ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR, Consequences, Context, Decision

### Community 82 - "ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions, Consequences, Context, Decision

## Knowledge Gaps
- **531 isolated node(s):** `@commitlint/config-conventional`, `uvx`, `nexus-mcp`, `semi`, `singleQuote` (+526 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 619 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `fixtures.ts` to `package.json`, `memory-parity.test.ts`, `approval-queue.tsx`, `leave-requests/route.test.ts`, `repository.ts`, `decide.test.ts`, `balance-writers.test.ts`, `audit.test.ts`, `independence.test.ts`, `api/errors.ts`, `postgres-repository.ts`, `decide-memory.test.ts`, `roles.ts`, `decide.ts`, `schema.test.ts`, `accrual/route.ts`, `decimal.ts`, `new/actions.ts`, `leave-request.ts`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `audit/page.tsx`, `package.json`, `approval-queue.tsx`, `mobile-nav.tsx`, `app/layout.tsx`, `roles.ts`, `login-form.tsx`, `leave-requests/route.test.ts`, `accrual/route.ts`, `new/actions.ts`, `Button`, `e2e/helpers.ts`, `api/errors.ts`, `fixtures.ts`, `leave-requests/route.ts`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `audit/page.tsx`, `approval-queue.tsx`, `roles.ts`, `mobile-nav.tsx`, `login-form.tsx`, `decision-dialog.tsx`, `Button`, `request-form.tsx`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `uvx`, `nexus-mcp` to the rest of the system?**
  _531 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Business Requirements Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `repositories.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1383399209486166 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._