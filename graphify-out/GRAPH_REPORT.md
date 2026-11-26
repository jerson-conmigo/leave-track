# Graph Report - leave-track  (2026-11-26)

## Corpus Check
- 202 files · ~77,390 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 6, .example 1, .css 1)

## Summary
- 1206 nodes · 2855 edges · 80 communities (70 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 72 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b8d65395`
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
- audit/page.tsx
- AGENTS.md — LeaveTrack
- /scaffold
- decision-dialog.tsx
- balance-card.tsx
- Coding Standards — LeaveTrack
- Prove the test can fail (from TASK-010)
- decide.test.ts
- balance-writers.test.ts
- schema.test.ts
- LeaveTrack UI — Design System
- implement-api-route.md
- implement-ui-component.md
- write-migration.md
- e2e/helpers.ts
- Steps
- decide.ts
- accrual/route.ts
- types.ts
- fixtures.ts
- Retro — Day 0 scaffold (2026-11-24)
- Button
- leave-requests/route.ts
- postgres.ts
- roles.ts
- vercel.json
- independence.test.ts
- sidebar-nav.tsx
- next
- repository.ts
- decide-memory.test.ts
- resetMockDb
- utils.ts
- env.ts
- login/page.tsx
- next.config.ts
- accrual/route.test.ts

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
- `Decision` --references--> `POST()`  [INFERRED]
  docs/arch-docs/ADR-LeaveTrack-E002-Accrual-Idempotency.md → app/api/test/reset/route.ts
- `API route handlers` --references--> `withErrorHandler()`  [INFERRED]
  knowledge/rules/coding-standards.md → lib/api/with-error-handler.ts
- `Frontend standards` --references--> `requireRole()`  [INFERRED]
  AGENTS.md → lib/auth/session.ts
- `Options considered` --references--> `SqlClient`  [INFERRED]
  docs/arch-docs/ADR-LeaveTrack-E003-Data-Access.md → lib/db/sql.ts
- `Logging` --references--> `Logger`  [INFERRED]
  knowledge/rules/coding-standards.md → lib/logger.ts

## Import Cycles
- None detected.

## Communities (80 total, 10 thin omitted)

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
Cohesion: 0.12
Nodes (35): ALL_EMPLOYEES, AuditFilters(), AuditFiltersProps, LoginForm(), LoginFormProps, MockUserOption, ROLE_ORDER, EMPTY (+27 more)

### Community 26 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Orient with your knowledge graph (if one exists), 2 — Load context in priority order, 3 — Output this summary, nothing else, 4 — Stop, Arguments, /evaluate, Steps

### Community 27 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Blast radius check, 2 — Write the implementation blueprint, 3 — State constraints, 4 — Stop and wait, /plan, Prerequisite, Steps

### Community 28 - "memory-parity.test.ts"
Cohesion: 0.09
Nodes (33): Database, getAccrualDeps(), memoryAccrualStore, currentPeriod(), monthsToAccrue(), nextPeriod(), createPostgresAccrualStore(), AccrualDeps (+25 more)

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
Cohesion: 0.11
Nodes (27): UserMenu(), UserMenuProps, Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage() (+19 more)

### Community 37 - "approval-queue.tsx"
Cohesion: 0.22
Nodes (27): ApprovalQueue(), ApprovalQueueProps, BalanceHint(), ActionBadge(), AuditTable(), EmptyState(), EmptyStateProps, LeaveTypeBadge() (+19 more)

### Community 38 - "mobile-nav.tsx"
Cohesion: 0.22
Nodes (14): AuthenticatedLayout(), AppShell(), AppShellProps, Brand(), MobileNav(), Sheet(), SheetContent(), SheetDescription() (+6 more)

### Community 39 - "app/layout.tsx"
Cohesion: 0.22
Nodes (6): metadata, RootLayout(), viewport, Toaster(), geist, sonner

### Community 40 - "audit/page.tsx"
Cohesion: 0.15
Nodes (23): ApprovalsPage(), metadata, AuditPage(), metadata, one(), BalancePage(), metadata, metadata (+15 more)

### Community 41 - "AGENTS.md — LeaveTrack"
Cohesion: 0.22
Nodes (8): AGENTS.md — LeaveTrack, Frontend standards, Git conventions, Project, Quality gates (must pass before merge), Stack, Task tracking, Where things go

### Community 42 - "/scaffold"
Cohesion: 0.20
Nodes (9): APPLY — Generate the Complete Boilerplate, Ecosystem reference, EVALUATE — Understand the Architecture and Design, PLAN — Boilerplate + UI Shell + Project Rules, Prerequisites, /scaffold, VALIDATE — Validate Infrastructure + Design Fidelity, Next.js 16 (+1 more)

### Community 43 - "decision-dialog.tsx"
Cohesion: 0.19
Nodes (17): DecisionDialog(), confirm(), handleOpenChange(), DecisionDialogProps, Dialog(), DialogContent(), DialogDescription(), DialogFooter() (+9 more)

### Community 44 - "balance-card.tsx"
Cohesion: 0.33
Nodes (13): DashboardPage(), metadata, StatCard(), Loading(), BalanceCard(), BalanceCardProps, BalanceCardSkeleton(), Card() (+5 more)

### Community 45 - "Coding Standards — LeaveTrack"
Cohesion: 0.22
Nodes (8): API route handlers, Coding Standards — LeaveTrack, Dependencies, Hard-won rules (from Day 0 VALIDATE), Logging, Testing, TypeScript, UI

### Community 46 - "Prove the test can fail (from TASK-010)"
Cohesion: 0.13
Nodes (14): DialogTrigger(), "Authorize before any database access" — prove it with a repository spy (from TASK-015), Browser e2e recipe (from TASK-016), Cross-cutting invariants: matrix + writer registry (from TASK-018), Defense in depth for "exactly once" writes (from TASK-014), Headless browser tests with Radix overlays, Pattern — Implement-and-test chain, Precision tests need inputs that really drift (from TASK-017) (+6 more)

### Community 48 - "decide.test.ts"
Cohesion: 0.19
Nodes (11): ANA, audit(), balance(), BEN, CARLA, dbs, decide(), MAYA (+3 more)

### Community 50 - "balance-writers.test.ts"
Cohesion: 0.06
Nodes (26): RFC-4180, matches, previous, STATUSES, [taskId, status, csvArg], getSession, input, service (+18 more)

### Community 52 - "schema.test.ts"
Cohesion: 0.08
Nodes (26): Security-scoped queries: assert the scope structurally (from TASK-013), leaveRequests, users, AUDIT_ACTIONS, LEAVE_TYPE_NAMES, REQUEST_STATUSES, SqlClient, @electric-sql/pglite (+18 more)

### Community 53 - "LeaveTrack UI — Design System"
Cohesion: 0.13
Nodes (14): Backlog, Color tokens, Components, Core, Iconography, Layout & breakpoints, Leave types, LeaveTrack UI — Design System (+6 more)

### Community 57 - "e2e/helpers.ts"
Cohesion: 0.14
Nodes (22): ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering, Consequences, Context, Decision, Options considered, Policy changes vs catch-up, enlargeText(), expectNoHorizontalOverflow() (+14 more)

### Community 58 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Inspect changes, 2 — Stage deliberately, 3 — Write the commit message, 4 — Confirm, /commit, Steps, When to use

### Community 59 - "decide.ts"
Cohesion: 0.15
Nodes (17): Session, DecideDeps, RequestIdSchema, LeaveRequestDecidedNotice, LeaveRequestSubmittedNotice, logNotifier, Notifier, SubmitDeps (+9 more)

### Community 60 - "accrual/route.ts"
Cohesion: 0.12
Nodes (25): Backend standards, GET, ParamsSchema, QuerySchema, dynamic, GET, authorized(), GET (+17 more)

### Community 61 - "types.ts"
Cohesion: 0.09
Nodes (24): LeaveRepository, AccrualRun, AuditAction, AuditEntryView, AuditEvent, AuditFilter, AuditHistoryFilter, AuditLogEntry (+16 more)

### Community 62 - "fixtures.ts"
Cohesion: 0.08
Nodes (29): accrualRuns, auditLog, BALANCE_ROWS, LAST_ACCRUAL_AT, LEAVE_TYPE_IDS, leaveBalances, leavePolicies, leaveTypes (+21 more)

### Community 63 - "Retro — Day 0 scaffold (2026-11-24)"
Cohesion: 0.50
Nodes (3): Fixed in VALIDATE, Retro — Day 0 scaffold (2026-11-24), What went well

### Community 64 - "Button"
Cohesion: 0.34
Nodes (9): AppError(), ForbiddenPage(), metadata, NotFound(), StatusScreen(), StatusScreenProps, Button(), buttonVariants (+1 more)

### Community 65 - "leave-requests/route.ts"
Cohesion: 0.19
Nodes (10): GET, ListQuerySchema, NO_STORE, POST, AppError, submitLeaveRequest(), ANA, CARLA (+2 more)

### Community 66 - "postgres.ts"
Cohesion: 0.08
Nodes (24): ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port, Consequences, Context, Decision, Options considered, selectRepository(), Driver, getSql() (+16 more)

### Community 67 - "roles.ts"
Cohesion: 0.14
Nodes (17): Security rules, loginAction(), LoginSchema, LoginState, logoutAction(), SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, sessionCookieOptions() (+9 more)

### Community 69 - "independence.test.ts"
Cohesion: 0.08
Nodes (28): LeaveRequest, RequestStatus, SqlRow, toIso(), toNumber(), createPostgresDecideStore(), createPostgresSubmitStore(), DecidedRow (+20 more)

### Community 70 - "sidebar-nav.tsx"
Cohesion: 0.31
Nodes (9): activeHref(), NAV_ITEMS, NavItem, navItemsFor(), GROUP_LABEL, SidebarNav(), SidebarNavProps, canAccess() (+1 more)

### Community 71 - "next"
Cohesion: 0.25
Nodes (12): POST, decideLeaveRequestAction(), submitLeaveRequestAction(), isAppError(), isRole(), getSession, ActionResult, decideLeaveRequest() (+4 more)

### Community 72 - "repository.ts"
Cohesion: 0.16
Nodes (18): Backlog (deferred, owner = Day 1 team), availableForRequest(), buildBalanceSummaries(), PendingRange, byId(), toView(), typeOf(), userName() (+10 more)

### Community 73 - "decide-memory.test.ts"
Cohesion: 0.22
Nodes (7): memoryDecideStore, BEN, ManagerSession, MAYA, notifier, run(), SCRIPT

### Community 74 - "resetMockDb"
Cohesion: 0.43
Nodes (6): notFound(), POST(), tokenMatches(), createMockDb(), resetMockDb(), memoryHarness()

### Community 75 - "utils.ts"
Cohesion: 0.43
Nodes (4): LEAVE_TYPE_META, STATUS_META, Badge(), badgeVariants

### Community 76 - "env.ts"
Cohesion: 0.29
Nodes (5): env, EnvSchema, isProduction, optionalSecret, optionalUrl

### Community 77 - "login/page.tsx"
Cohesion: 0.50
Nodes (3): HIGHLIGHTS, LoginPage(), metadata

### Community 78 - "next.config.ts"
Cohesion: 0.50
Nodes (3): csp, nextConfig, securityHeaders

## Knowledge Gaps
- **502 isolated node(s):** `@commitlint/config-conventional`, `uvx`, `nexus-mcp`, `semi`, `singleQuote` (+497 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 588 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `fixtures.ts` to `leave-requests/route.ts`, `roles.ts`, `package.json`, `approval-queue.tsx`, `independence.test.ts`, `repository.ts`, `decide-memory.test.ts`, `accrual/route.ts`, `accrual/route.test.ts`, `decide.test.ts`, `balance-writers.test.ts`, `schema.test.ts`, `decide.ts`, `memory-parity.test.ts`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `Button`, `leave-requests/route.ts`, `roles.ts`, `package.json`, `approval-queue.tsx`, `mobile-nav.tsx`, `app/layout.tsx`, `audit/page.tsx`, `sidebar-nav.tsx`, `resetMockDb`, `balance-card.tsx`, `login/page.tsx`, `next.config.ts`, `accrual/route.test.ts`, `request-form.tsx`, `accrual/route.ts`, `fixtures.ts`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `Button`, `approval-queue.tsx`, `sidebar-nav.tsx`, `mobile-nav.tsx`, `audit/page.tsx`, `utils.ts`, `balance-card.tsx`, `decision-dialog.tsx`, `Coding Standards — LeaveTrack`, `request-form.tsx`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `uvx`, `nexus-mcp` to the rest of the system?**
  _502 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Business Requirements Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `Architecture Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._