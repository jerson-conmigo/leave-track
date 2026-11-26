# Graph Report - leave-track  (2026-11-26)

## Corpus Check
- 215 files · ~88,295 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 6, .csv 2, .example 1)

## Summary
- 1304 nodes · 2988 edges · 89 communities (78 shown, 11 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 81 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ab306ad3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Business Requirements Document — LeaveTrack v1.0
- api/errors.ts
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
- decide.ts
- Steps
- Steps
- concurrency.test.ts
- .prettierrc.json
- pr-verifier.md
- Steps
- Steps
- nexus
- extends
- postcss.config.mjs
- memory-parity.test.ts
- approval-queue.tsx
- cn
- app/layout.tsx
- Revision v1.1 — EPIC 2 (2026-11-26)
- repository.ts
- roles.ts
- decide-memory.test.ts
- new/actions.ts
- login-form.tsx
- Prove the test can fail (from TASK-010)
- balance-card.tsx
- set-task-status.mjs
- request-form.tsx
- independence.test.ts
- implement-api-route.md
- implement-ui-component.md
- write-migration.md
- e2e/helpers.ts
- Steps
- mobile-nav.tsx
- leave-requests/route.ts
- decision-dialog.tsx
- next
- decide.test.ts
- Button
- proxy.ts
- LeaveTrack
- audit/page.tsx
- vercel.json
- login/actions.ts
- vitest
- env.ts
- /scaffold
- types.ts
- schema.test.ts
- utils.ts
- Notifier
- set-task-status.test.ts
- Retro — Day 0 scaffold (2026-11-24)
- withErrorHandler
- ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR
- ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions
- requireRole
- coverage-summary.test.ts
- balance-writers.test.ts
- ref_node_fs
- ref_node_path
- security-conventions.test.ts
- no-name-logic.test.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 93 edges
2. `vitest` - 42 edges
3. `next` - 37 edges
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
- `Security changes` --references--> `safeRedirectPath()`  [INFERRED]
  docs/arch-docs/ARCH-LeaveTrack-v1.0.md → lib/auth/roles.ts
- `Where data goes` --references--> `getSql()`  [INFERRED]
  README.md → lib/db/postgres.ts
- `Options considered` --references--> `SqlClient`  [INFERRED]
  docs/arch-docs/ADR-LeaveTrack-E003-Data-Access.md → lib/db/sql.ts
- `Security-scoped queries: assert the scope structurally (from TASK-013)` --references--> `SqlClient`  [INFERRED]
  knowledge/patterns/implement-and-test.md → lib/db/sql.ts

## Import Cycles
- None detected.

## Communities (89 total, 11 thin omitted)

### Community 0 - "Business Requirements Document — LeaveTrack v1.0"
Cohesion: 0.09
Nodes (21): Additional Functional Requirements, Additional Risks, Additional Stakeholder Concerns, Additional Success Criteria, Assumptions, Business Context, Business Requirements Document — LeaveTrack v1.0, Constraints (+13 more)

### Community 1 - "api/errors.ts"
Cohesion: 0.18
Nodes (12): dynamic, GET, ERROR_STATUS, ErrorCode, ApiFailure, ApiResponse, ApiSuccess, fail() (+4 more)

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

### Community 25 - "decide.ts"
Cohesion: 0.14
Nodes (17): Session, DecideLeaveRequestResult, DecideWarning, SubmitLeaveRequestResult, SubmitWarning, DecideDeps, RequestIdSchema, LeaveRequestDecidedNotice (+9 more)

### Community 26 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Orient with your knowledge graph (if one exists), 2 — Load context in priority order, 3 — Output this summary, nothing else, 4 — Stop, Arguments, /evaluate, Steps

### Community 27 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Blast radius check, 2 — Write the implementation blueprint, 3 — State constraints, 4 — Stop and wait, /plan, Prerequisite, Steps

### Community 28 - "concurrency.test.ts"
Cohesion: 0.06
Nodes (46): authorized(), GET, handler(), POST, ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port, Consequences, Context, Decision (+38 more)

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

### Community 36 - "memory-parity.test.ts"
Cohesion: 0.12
Nodes (17): users, SqlClient, SqlRow, @electric-sql/pglite, SCRIPT, dbs, insertPending(), MIA_REPORTS (+9 more)

### Community 37 - "approval-queue.tsx"
Cohesion: 0.16
Nodes (35): metadata, PoliciesPage(), ApprovalQueue(), ApprovalQueueProps, BalanceHint(), ActionBadge(), AuditTable(), EmptyState() (+27 more)

### Community 38 - "cn"
Cohesion: 0.14
Nodes (23): UserMenu(), UserMenuProps, Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage() (+15 more)

### Community 39 - "app/layout.tsx"
Cohesion: 0.22
Nodes (6): metadata, RootLayout(), viewport, Toaster(), geist, sonner

### Community 40 - "Revision v1.1 — EPIC 2 (2026-11-26)"
Cohesion: 0.12
Nodes (15): API Design (selected), Architecture Document — LeaveTrack v1.0, Considered and not adopted, Data Model, Data model additions (planned), Deployment changes, Deployment Topology, EPIC 2 decisions (adopted 2026-11-26) (+7 more)

### Community 41 - "repository.ts"
Cohesion: 0.16
Nodes (17): availableForRequest(), buildBalanceSummaries(), PendingRange, byId(), toView(), typeOf(), userName(), createPostgresRepository() (+9 more)

### Community 42 - "roles.ts"
Cohesion: 0.24
Nodes (10): NEVER_REDIRECT_TO, PUBLIC_PATHS, REDIRECT_BASES, REDIRECT_GUARDS, redirectRejection(), resolveRedirect(), ROLE_LABEL, ROUTE_ACCESS (+2 more)

### Community 43 - "decide-memory.test.ts"
Cohesion: 0.09
Nodes (18): RequestStatus, toIso(), memoryDecideStore, DecidedRow, RequestRow, toLeaveRequest(), BalanceContext, DecideInput (+10 more)

### Community 44 - "new/actions.ts"
Cohesion: 0.23
Nodes (10): submitLeaveRequestAction(), isAppError(), ActionResult, getSubmitDeps(), submitLeaveRequest(), DecisionInput, LeaveRequestInput, LeaveRequestSchema (+2 more)

### Community 45 - "login-form.tsx"
Cohesion: 0.23
Nodes (18): AuditFilters(), AuditFiltersProps, LoginForm(), LoginFormProps, MockUserOption, ROLE_ORDER, Input(), Label() (+10 more)

### Community 46 - "Prove the test can fail (from TASK-010)"
Cohesion: 0.10
Nodes (19): DialogTrigger(), "Authorize before any database access" — prove it with a repository spy (from TASK-015), Browser e2e recipe (from TASK-016), Changing tooling versions: diff the resolved config, measure before thresholding (from TASK-021), Cross-cutting invariants: matrix + writer registry (from TASK-018), Defense in depth for "exactly once" writes (from TASK-014), Fail-closed configuration: test build time and runtime separately (from TASK-019), Headless browser tests with Radix overlays (+11 more)

### Community 48 - "balance-card.tsx"
Cohesion: 0.19
Nodes (22): BalancePage(), metadata, DashboardPage(), metadata, StatCard(), Loading(), metadata, NewRequestPage() (+14 more)

### Community 50 - "set-task-status.mjs"
Cohesion: 0.20
Nodes (6): RFC-4180, matches, previous, STATUSES, [taskId, status, csvArg], temp

### Community 52 - "request-form.tsx"
Cohesion: 0.19
Nodes (16): LEAVE_TYPE_META, EMPTY, RequestForm(), RequestFormProps, FormControl(), FormDescription(), FormField(), FormFieldContext (+8 more)

### Community 53 - "independence.test.ts"
Cohesion: 0.15
Nodes (13): createMockDb(), resetMockDb(), ANA, BEN, dbs, decide(), Harness, HARNESSES (+5 more)

### Community 57 - "e2e/helpers.ts"
Cohesion: 0.25
Nodes (15): enlargeText(), expectNoHorizontalOverflow(), expectNotUnderHeader(), expectTapTargets(), expectVisibleFocus(), focusedLabel(), focusIndicatorChange(), Role (+7 more)

### Community 58 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Inspect changes, 2 — Stage deliberately, 3 — Write the commit message, 4 — Confirm, /commit, Steps, When to use

### Community 59 - "mobile-nav.tsx"
Cohesion: 0.07
Nodes (39): AuthenticatedLayout(), HIGHLIGHTS, LoginPage(), metadata, AppShell(), AppShellProps, Brand(), MobileNav() (+31 more)

### Community 60 - "leave-requests/route.ts"
Cohesion: 0.23
Nodes (15): GET, POST, GET, ListQuerySchema, NO_STORE, POST, decideLeaveRequestAction(), AppError (+7 more)

### Community 61 - "decision-dialog.tsx"
Cohesion: 0.22
Nodes (15): DecisionDialog(), confirm(), handleOpenChange(), DecisionDialogProps, Dialog(), DialogContent(), DialogDescription(), DialogFooter() (+7 more)

### Community 62 - "next"
Cohesion: 0.17
Nodes (9): ParamsSchema, QuerySchema, metadata, repository, csp, nextConfig, securityHeaders, next (+1 more)

### Community 63 - "decide.test.ts"
Cohesion: 0.15
Nodes (15): createPostgresDecideStore(), createPostgresSubmitStore(), ANA, audit(), balance(), BEN, CARLA, dbs (+7 more)

### Community 64 - "Button"
Cohesion: 0.27
Nodes (10): AppError(), metadata, MyRequestsPage(), ForbiddenPage(), metadata, NotFound(), StatusScreen(), StatusScreenProps (+2 more)

### Community 65 - "proxy.ts"
Cohesion: 0.27
Nodes (9): APPLY — Generate the Complete Boilerplate, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, canAccess(), isPublicPath(), isRole(), matches(), config (+1 more)

### Community 66 - "LeaveTrack"
Cohesion: 0.14
Nodes (13): Accrual job (TASK-017), Database, Environment, HR audit (TASK-015), Known limitations, Leave types are independent (TASK-018 / US-08), LeaveTrack, Project layout (+5 more)

### Community 67 - "audit/page.tsx"
Cohesion: 0.38
Nodes (8): AuditPage(), metadata, one(), ALL_EMPLOYEES, Alert(), AlertDescription(), AlertTitle(), alertVariants

### Community 69 - "login/actions.ts"
Cohesion: 0.25
Nodes (8): loginAction(), LoginSchema, LoginState, logoutAction(), sessionCookieOptions(), MAX_REDIRECT_LENGTH, isProduction, Day 1 hand-off notes

### Community 70 - "vitest"
Cohesion: 0.07
Nodes (31): accrualRuns, auditLog, BALANCE_ROWS, LAST_ACCRUAL_AT, LEAVE_TYPE_IDS, leaveBalances, leavePolicies, leaveRequests (+23 more)

### Community 71 - "env.ts"
Cohesion: 0.06
Nodes (33): notFound(), POST(), tokenMatches(), ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering, Consequences, Context, Decision, Options considered (+25 more)

### Community 72 - "/scaffold"
Cohesion: 0.29
Nodes (6): Ecosystem reference, EVALUATE — Understand the Architecture and Design, PLAN — Boilerplate + UI Shell + Project Rules, Prerequisites, /scaffold, VALIDATE — Validate Infrastructure + Design Fidelity

### Community 73 - "types.ts"
Cohesion: 0.10
Nodes (23): Backlog (deferred, owner = Day 1 team), LeaveRepository, selectRepository(), AccrualRun, AUDIT_LOG_LIMIT, AuditAction, AuditEntryView, AuditEvent (+15 more)

### Community 74 - "schema.test.ts"
Cohesion: 0.14
Nodes (11): AUDIT_ACTIONS, LEAVE_TYPE_NAMES, REQUEST_STATUSES, MIGRATION_FILES, MIGRATIONS, SEED, ARCH_TABLES, attempt() (+3 more)

### Community 75 - "utils.ts"
Cohesion: 0.33
Nodes (4): badgeVariants, Separator(), class-variance-authority, radix-ui

### Community 76 - "Notifier"
Cohesion: 0.29
Nodes (5): ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox, Consequences, Context, Decision, Notifier

### Community 77 - "set-task-status.test.ts"
Cohesion: 0.29
Nodes (3): dir, root, script

### Community 78 - "Retro — Day 0 scaffold (2026-11-24)"
Cohesion: 0.33
Nodes (5): Coverage baseline (TASK-021, 2026-11-26), EPIC 2 planning (2026-11-26), Fixed in VALIDATE, Retro — Day 0 scaffold (2026-11-24), What went well

### Community 79 - "withErrorHandler"
Cohesion: 0.18
Nodes (10): Backend standards, API additions (planned), Example — TASK-014 (approve/reject), withErrorHandler(), toAppError(), getSession, input, service (+2 more)

### Community 81 - "ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR, Consequences, Context, Decision

### Community 82 - "ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions, Consequences, Context, Decision

### Community 85 - "requireRole"
Cohesion: 0.12
Nodes (16): AGENTS.md — LeaveTrack, Frontend standards, Git conventions, Project, Quality gates (must pass before merge), Security rules, Stack, Task tracking (+8 more)

### Community 88 - "coverage-summary.test.ts"
Cohesion: 0.18
Nodes (5): dir, script, git(), ignored(), root

### Community 92 - "balance-writers.test.ts"
Cohesion: 0.31
Nodes (8): appFiles, files(), MOCK_FIELD, normalise(), root, Table, writersOf(), writesTable()

### Community 96 - "security-conventions.test.ts"
Cohesion: 0.50
Nodes (3): files(), root, UNSAFE_COMPARE

### Community 97 - "no-name-logic.test.ts"
Cohesion: 0.50
Nodes (4): appFiles, files(), rel(), root

## Knowledge Gaps
- **553 isolated node(s):** `@commitlint/config-conventional`, `uvx`, `nexus-mcp`, `semi`, `singleQuote` (+548 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 648 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `api/errors.ts`, `package.json`, `decide.ts`, `concurrency.test.ts`, `memory-parity.test.ts`, `approval-queue.tsx`, `repository.ts`, `roles.ts`, `decide-memory.test.ts`, `new/actions.ts`, `independence.test.ts`, `decide.test.ts`, `env.ts`, `schema.test.ts`, `set-task-status.test.ts`, `withErrorHandler`, `coverage-summary.test.ts`, `balance-writers.test.ts`, `ref_node_path`, `security-conventions.test.ts`, `no-name-logic.test.ts`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `Button`, `api/errors.ts`, `proxy.ts`, `audit/page.tsx`, `package.json`, `approval-queue.tsx`, `login/actions.ts`, `env.ts`, `app/layout.tsx`, `vitest`, `new/actions.ts`, `login-form.tsx`, `leave-requests/route.ts`, `withErrorHandler`, `balance-card.tsx`, `decide.ts`, `mobile-nav.tsx`, `concurrency.test.ts`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `Button`, `audit/page.tsx`, `approval-queue.tsx`, `env.ts`, `utils.ts`, `login-form.tsx`, `balance-card.tsx`, `request-form.tsx`, `mobile-nav.tsx`, `decision-dialog.tsx`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `uvx`, `nexus-mcp` to the rest of the system?**
  _553 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Business Requirements Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `Architecture Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._