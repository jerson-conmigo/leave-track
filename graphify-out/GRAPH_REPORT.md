# Graph Report - leave-track  (2026-11-26)

## Corpus Check
- 224 files · ~91,911 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 6, .csv 2, .example 1)

## Summary
- 1344 nodes · 3107 edges · 96 communities (81 shown, 15 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 83 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eb40b281`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Business Requirements Document — LeaveTrack v1.0
- cn
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
- independence.test.ts
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
- db/helpers.ts
- approval-queue.tsx
- request-form.tsx
- app/layout.tsx
- Revision v1.1 — EPIC 2 (2026-11-26)
- decision-dialog.tsx
- roles.ts
- with-error-handler.ts
- decide.ts
- accrual/route.ts
- Prove the test can fail (from TASK-010)
- repositories.ts
- set-task-status.mjs
- Coding Standards — LeaveTrack
- leave-requests/route.ts
- implement-api-route.md
- implement-ui-component.md
- write-migration.md
- e2e/helpers.ts
- Steps
- mobile-nav.tsx
- AppError
- sidebar-nav.tsx
- LeaveTrack UI — Design System
- decide.test.ts
- types.ts
- leave-request.ts
- LeaveTrack
- Notifier
- vercel.json
- login/actions.ts
- vitest
- env.ts
- /scaffold
- postgres-repository.ts
- repository.ts
- Button
- approvals/actions.ts
- set-task-status.test.ts
- utils.ts
- decimal.ts
- Retro — Day 0 scaffold (2026-11-24)
- ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR
- ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions
- eslint.config.mjs
- engines
- repo-hygiene.test.ts
- proxy.ts
- postgres.ts
- coverage-summary.test.ts
- SubmitStore
- ActionResult
- balance-writers.test.ts
- coverage-summary.mjs
- ref_node_path
- security-conventions.test.ts
- action-errors.test.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 93 edges
2. `vitest` - 47 edges
3. `next` - 38 edges
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
- `Frontend standards` --references--> `requireRole()`  [INFERRED]
  AGENTS.md → lib/auth/session.ts
- `Where data goes` --references--> `getSql()`  [INFERRED]
  README.md → lib/db/postgres.ts
- `Security-scoped queries: assert the scope structurally (from TASK-013)` --references--> `SqlClient`  [INFERRED]
  knowledge/patterns/implement-and-test.md → lib/db/sql.ts

## Import Cycles
- None detected.

## Communities (96 total, 15 thin omitted)

### Community 0 - "Business Requirements Document — LeaveTrack v1.0"
Cohesion: 0.09
Nodes (21): Additional Functional Requirements, Additional Risks, Additional Stakeholder Concerns, Additional Success Criteria, Assumptions, Business Context, Business Requirements Document — LeaveTrack v1.0, Constraints (+13 more)

### Community 1 - "cn"
Cohesion: 0.11
Nodes (28): UserMenu(), UserMenuProps, Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage() (+20 more)

### Community 2 - "ADR-LeaveTrack-E001 — Auth & Session Strategy"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E001 — Auth & Session Strategy, Consequences, Context, Decision, Options Considered

### Community 3 - "Product Requirements Document — LeaveTrack v1.0"
Cohesion: 0.17
Nodes (11): Business Rules (EPIC 2), Non-Functional Requirements, Non-Functional Requirements (additions), Out of Scope, Out of Scope (additions), Product Requirements Document — LeaveTrack v1.0, Revision v1.1 — EPIC 2 (2026-11-26), User Roles (+3 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (27): description, @commitlint/config-conventional, name, private, version, @axe-core/playwright, class-variance-authority, clsx (+19 more)

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

### Community 25 - "independence.test.ts"
Cohesion: 0.10
Nodes (18): createMockDb(), resetMockDb(), memoryDecideStore, DecideStore, BEN, ManagerSession, MAYA, notifier (+10 more)

### Community 26 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Orient with your knowledge graph (if one exists), 2 — Load context in priority order, 3 — Output this summary, nothing else, 4 — Stop, Arguments, /evaluate, Steps

### Community 27 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Blast radius check, 2 — Write the implementation blueprint, 3 — State constraints, 4 — Stop and wait, /plan, Prerequisite, Steps

### Community 28 - "memory-parity.test.ts"
Cohesion: 0.15
Nodes (20): memoryAccrualStore, currentPeriod(), monthsToAccrue(), nextPeriod(), createPostgresAccrualStore(), AccrualDeps, MAX_CATCH_UP_MONTHS, runMonthlyAccrual() (+12 more)

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

### Community 36 - "db/helpers.ts"
Cohesion: 0.07
Nodes (27): ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port, Consequences, Context, Decision, Options considered, leaveRequests, users, AUDIT_LOG_LIMIT (+19 more)

### Community 37 - "approval-queue.tsx"
Cohesion: 0.21
Nodes (29): ApprovalQueue(), ApprovalQueueProps, BalanceHint(), ActionBadge(), AuditTable(), EmptyState(), EmptyStateProps, LeaveTypeBadge() (+21 more)

### Community 38 - "request-form.tsx"
Cohesion: 0.13
Nodes (34): ALL_EMPLOYEES, AuditFilters(), AuditFiltersProps, LoginForm(), LoginFormProps, MockUserOption, ROLE_ORDER, EMPTY (+26 more)

### Community 39 - "app/layout.tsx"
Cohesion: 0.22
Nodes (6): metadata, RootLayout(), viewport, Toaster(), geist, sonner

### Community 40 - "Revision v1.1 — EPIC 2 (2026-11-26)"
Cohesion: 0.12
Nodes (16): API additions (planned), API Design (selected), Architecture Document — LeaveTrack v1.0, Considered and not adopted, Data Model, Data model additions (planned), Deployment changes, Deployment Topology (+8 more)

### Community 41 - "decision-dialog.tsx"
Cohesion: 0.24
Nodes (13): DecisionDialog(), confirm(), handleOpenChange(), DecisionDialogProps, Dialog(), DialogContent(), DialogDescription(), DialogFooter() (+5 more)

### Community 42 - "roles.ts"
Cohesion: 0.19
Nodes (13): Security rules, TypeScript, isRole(), MAX_REDIRECT_LENGTH, NEVER_REDIRECT_TO, PUBLIC_PATHS, REDIRECT_BASES, REDIRECT_GUARDS (+5 more)

### Community 43 - "with-error-handler.ts"
Cohesion: 0.11
Nodes (19): AGENTS.md — LeaveTrack, Backend standards, Frontend standards, Git conventions, Project, Quality gates (must pass before merge), Stack, Task tracking (+11 more)

### Community 44 - "decide.ts"
Cohesion: 0.15
Nodes (18): DecideLeaveRequestResult, DecideWarning, SubmitLeaveRequestResult, SubmitWarning, DecideDeps, RequestIdSchema, LeaveRequestDecidedNotice, LeaveRequestSubmittedNotice (+10 more)

### Community 45 - "accrual/route.ts"
Cohesion: 0.22
Nodes (8): authorized(), GET, handler(), POST, getAccrualDeps(), AccrualTrigger, OK, runMonthlyAccrual

### Community 46 - "Prove the test can fail (from TASK-010)"
Cohesion: 0.11
Nodes (18): DialogTrigger(), "Authorize before any database access" — prove it with a repository spy (from TASK-015), Browser e2e recipe (from TASK-016), Changing tooling versions: diff the resolved config, measure before thresholding (from TASK-021), Cross-cutting invariants: matrix + writer registry (from TASK-018), Defense in depth for "exactly once" writes (from TASK-014), Fail-closed configuration: test build time and runtime separately (from TASK-019), Headless browser tests with Radix overlays (+10 more)

### Community 48 - "repositories.ts"
Cohesion: 0.07
Nodes (54): ApprovalsPage(), metadata, AuditPage(), metadata, one(), BalancePage(), metadata, DashboardPage() (+46 more)

### Community 50 - "set-task-status.mjs"
Cohesion: 0.20
Nodes (6): RFC-4180, matches, previous, STATUSES, [taskId, status, csvArg], temp

### Community 52 - "Coding Standards — LeaveTrack"
Cohesion: 0.22
Nodes (8): API route handlers, Coding Standards — LeaveTrack, Dependencies, Hard-won rules (from Day 0 VALIDATE), Logging, Next.js 16, Testing, UI

### Community 53 - "leave-requests/route.ts"
Cohesion: 0.27
Nodes (9): ListQuerySchema, NO_STORE, POST, submitLeaveRequestAction(), MyLeaveContext, TeamQueue, getSubmitDeps(), submitLeaveRequest() (+1 more)

### Community 57 - "e2e/helpers.ts"
Cohesion: 0.08
Nodes (34): enlargeText(), expectNoHorizontalOverflow(), expectNotUnderHeader(), expectTapTargets(), expectVisibleFocus(), focusedLabel(), focusIndicatorChange(), Role (+26 more)

### Community 58 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Inspect changes, 2 — Stage deliberately, 3 — Write the commit message, 4 — Confirm, /commit, Steps, When to use

### Community 59 - "mobile-nav.tsx"
Cohesion: 0.33
Nodes (10): MobileNav(), Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetPortal() (+2 more)

### Community 60 - "AppError"
Cohesion: 0.19
Nodes (15): GET, ParamsSchema, QuerySchema, dynamic, GET, POST, GET, AppError (+7 more)

### Community 61 - "sidebar-nav.tsx"
Cohesion: 0.33
Nodes (8): activeHref(), NAV_ITEMS, NavItem, navItemsFor(), GROUP_LABEL, SidebarNav(), SidebarNavProps, Role

### Community 62 - "LeaveTrack UI — Design System"
Cohesion: 0.13
Nodes (14): Backlog, Color tokens, Components, Core, Iconography, Layout & breakpoints, Leave types, LeaveTrack UI — Design System (+6 more)

### Community 63 - "decide.test.ts"
Cohesion: 0.15
Nodes (15): createPostgresDecideStore(), createPostgresSubmitStore(), ANA, audit(), balance(), BEN, CARLA, dbs (+7 more)

### Community 64 - "types.ts"
Cohesion: 0.07
Nodes (27): LeaveRepository, AUDIT_ACTIONS, AuditAction, AuditEntryView, AuditEvent, AuditHistoryFilter, AuditRequestRecord, BalanceSummary (+19 more)

### Community 65 - "leave-request.ts"
Cohesion: 0.28
Nodes (7): DecisionInput, DecisionSchema, LeaveRequestInput, LeaveRequestSchema, RejectReasonSchema, zod, valid

### Community 66 - "LeaveTrack"
Cohesion: 0.14
Nodes (13): Accrual job (TASK-017), Database, Environment, HR audit (TASK-015), Known limitations, Leave types are independent (TASK-018 / US-08), LeaveTrack, Project layout (+5 more)

### Community 67 - "Notifier"
Cohesion: 0.29
Nodes (5): ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox, Consequences, Context, Decision, Notifier

### Community 69 - "login/actions.ts"
Cohesion: 0.24
Nodes (10): loginAction(), LoginSchema, LoginState, logoutAction(), LEGACY_SESSION_COOKIES, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, sessionCookieOptions() (+2 more)

### Community 70 - "vitest"
Cohesion: 0.07
Nodes (30): accrualRuns, auditLog, BALANCE_ROWS, LAST_ACCRUAL_AT, LEAVE_TYPE_IDS, leaveBalances, leavePolicies, leaveTypes (+22 more)

### Community 71 - "env.ts"
Cohesion: 0.09
Nodes (23): notFound(), POST(), tokenMatches(), ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering, Consequences, Context, Decision, Options considered (+15 more)

### Community 72 - "/scaffold"
Cohesion: 0.25
Nodes (7): APPLY — Generate the Complete Boilerplate, Ecosystem reference, EVALUATE — Understand the Architecture and Design, PLAN — Boilerplate + UI Shell + Project Rules, Prerequisites, /scaffold, VALIDATE — Validate Infrastructure + Design Fidelity

### Community 73 - "postgres-repository.ts"
Cohesion: 0.16
Nodes (18): Backlog (deferred, owner = Day 1 team), availableForRequest(), buildBalanceSummaries(), PendingRange, createPostgresRepository(), UserRow, LeaveRequest, LeaveType (+10 more)

### Community 74 - "repository.ts"
Cohesion: 0.15
Nodes (12): Database, utcDay(), utcMonthBounds(), withinUtcDays(), byId(), mockRepository, toView(), typeOf() (+4 more)

### Community 75 - "Button"
Cohesion: 0.34
Nodes (9): AppError(), ForbiddenPage(), metadata, NotFound(), StatusScreen(), StatusScreenProps, Button(), buttonVariants (+1 more)

### Community 76 - "approvals/actions.ts"
Cohesion: 0.36
Nodes (7): decideLeaveRequestAction(), isAppError(), Decision, decideLeaveRequest(), getDecideDeps(), run(), decide()

### Community 77 - "set-task-status.test.ts"
Cohesion: 0.29
Nodes (3): dir, root, script

### Community 78 - "utils.ts"
Cohesion: 0.43
Nodes (4): STATUS_META, Badge(), badgeVariants, RequestStatus

### Community 79 - "decimal.ts"
Cohesion: 0.73
Nodes (4): addDays(), fromHundredths(), sumDays(), toHundredths()

### Community 80 - "Retro — Day 0 scaffold (2026-11-24)"
Cohesion: 0.33
Nodes (5): Coverage baseline (TASK-021, 2026-11-26), EPIC 2 planning (2026-11-26), Fixed in VALIDATE, Retro — Day 0 scaffold (2026-11-24), What went well

### Community 81 - "ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR, Consequences, Context, Decision

### Community 82 - "ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions, Consequences, Context, Decision

### Community 85 - "repo-hygiene.test.ts"
Cohesion: 0.50
Nodes (3): git(), ignored(), root

### Community 86 - "proxy.ts"
Cohesion: 0.48
Nodes (6): canAccess(), isPublicPath(), matches(), config, loginUrl(), proxy()

### Community 87 - "postgres.ts"
Cohesion: 0.33
Nodes (6): selectRepository(), Driver, getSql(), globalForDb, wrap(), env

### Community 90 - "ActionResult"
Cohesion: 0.67
Nodes (3): delay(), mockSubmit(), ActionResult

### Community 92 - "balance-writers.test.ts"
Cohesion: 0.31
Nodes (8): appFiles, files(), MOCK_FIELD, normalise(), root, Table, writersOf(), writesTable()

### Community 96 - "security-conventions.test.ts"
Cohesion: 0.40
Nodes (4): rel(), files(), root, UNSAFE_COMPARE

### Community 97 - "action-errors.test.ts"
Cohesion: 0.22
Nodes (7): getSession, input, service, appFiles, code(), files(), root

## Knowledge Gaps
- **559 isolated node(s):** `@commitlint/config-conventional`, `uvx`, `nexus-mcp`, `semi`, `singleQuote` (+554 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 660 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `package.json`, `independence.test.ts`, `memory-parity.test.ts`, `db/helpers.ts`, `approval-queue.tsx`, `roles.ts`, `decide.ts`, `accrual/route.ts`, `e2e/helpers.ts`, `AppError`, `decide.test.ts`, `types.ts`, `leave-request.ts`, `env.ts`, `postgres-repository.ts`, `repository.ts`, `set-task-status.test.ts`, `decimal.ts`, `repo-hygiene.test.ts`, `coverage-summary.test.ts`, `balance-writers.test.ts`, `ref_node_path`, `security-conventions.test.ts`, `action-errors.test.ts`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Why does `next` connect `repositories.ts` to `package.json`, `login/actions.ts`, `request-form.tsx`, `env.ts`, `app/layout.tsx`, `approval-queue.tsx`, `repository.ts`, `Button`, `approvals/actions.ts`, `accrual/route.ts`, `with-error-handler.ts`, `vitest`, `leave-requests/route.ts`, `proxy.ts`, `db/helpers.ts`, `e2e/helpers.ts`, `AppError`, `sidebar-nav.tsx`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `approval-queue.tsx`, `request-form.tsx`, `decision-dialog.tsx`, `Button`, `utils.ts`, `repositories.ts`, `Coding Standards — LeaveTrack`, `mobile-nav.tsx`, `sidebar-nav.tsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `uvx`, `nexus-mcp` to the rest of the system?**
  _559 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Business Requirements Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.1126984126984127 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._