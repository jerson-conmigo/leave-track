# Graph Report - leave-track  (2026-11-26)

## Corpus Check
- 211 files · ~85,798 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 6, .csv 2, .example 1)

## Summary
- 1274 nodes · 2949 edges · 86 communities (76 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 81 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f58d1c12`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Business Requirements Document — LeaveTrack v1.0
- AppError
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
- accrual/route.ts
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
- user-menu.tsx
- app/layout.tsx
- Revision v1.1 — EPIC 2 (2026-11-26)
- types.ts
- roles.ts
- submit.test.ts
- repositories.ts
- request-form.tsx
- Prove the test can fail (from TASK-010)
- balance-card.tsx
- balance-writers.test.ts
- leave-requests/route.ts
- independence.test.ts
- implement-api-route.md
- implement-ui-component.md
- write-migration.md
- e2e/helpers.ts
- Steps
- decide.test.ts
- decide.ts
- submit.ts
- decision-dialog.tsx
- cn
- LeaveTrack UI — Design System
- Button
- LeaveTrack
- utcMonthBounds
- vercel.json
- AGENTS.md — LeaveTrack
- vitest
- env.ts
- login/actions.ts
- proxy.ts
- schema.test.ts
- Coding Standards — LeaveTrack
- Notifier
- /scaffold
- decide-memory.test.ts
- ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port
- ADR-LeaveTrack-E004 — Real Authentication: Supabase Auth with signed sessions
- ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR
- ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions
- Retro — Day 0 scaffold (2026-11-24)
- next.config.ts
- accrual/route.test.ts

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
- `API route handlers` --references--> `withErrorHandler()`  [INFERRED]
  knowledge/rules/coding-standards.md → lib/api/with-error-handler.ts
- `Security changes` --references--> `safeRedirectPath()`  [INFERRED]
  docs/arch-docs/ARCH-LeaveTrack-v1.0.md → lib/auth/roles.ts
- `EPIC 2 planning (2026-11-26)` --references--> `safeRedirectPath()`  [INFERRED]
  knowledge/retros/2026-11-24-day0-scaffold.md → lib/auth/roles.ts
- `Frontend standards` --references--> `requireRole()`  [INFERRED]
  AGENTS.md → lib/auth/session.ts
- `Decision` --references--> `requireRole()`  [INFERRED]
  docs/arch-docs/ADR-LeaveTrack-E004-Real-Authentication.md → lib/auth/session.ts

## Import Cycles
- None detected.

## Communities (86 total, 10 thin omitted)

### Community 0 - "Business Requirements Document — LeaveTrack v1.0"
Cohesion: 0.09
Nodes (21): Additional Functional Requirements, Additional Risks, Additional Stakeholder Concerns, Additional Success Criteria, Assumptions, Business Context, Business Requirements Document — LeaveTrack v1.0, Constraints (+13 more)

### Community 1 - "AppError"
Cohesion: 0.17
Nodes (14): GET, ParamsSchema, QuerySchema, AppError, ERROR_STATUS, ErrorCode, ApiFailure, ApiResponse (+6 more)

### Community 2 - "ADR-LeaveTrack-E001 — Auth & Session Strategy"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E001 — Auth & Session Strategy, Consequences, Context, Decision, Options Considered

### Community 3 - "Product Requirements Document — LeaveTrack v1.0"
Cohesion: 0.17
Nodes (11): Business Rules (EPIC 2), Non-Functional Requirements, Non-Functional Requirements (additions), Out of Scope, Out of Scope (additions), Product Requirements Document — LeaveTrack v1.0, Revision v1.1 — EPIC 2 (2026-11-26), User Roles (+3 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (28): description, engines, node, @commitlint/config-conventional, name, private, version, @axe-core/playwright (+20 more)

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

### Community 25 - "accrual/route.ts"
Cohesion: 0.17
Nodes (15): Backend standards, dynamic, GET, authorized(), GET, handler(), POST, API additions (planned) (+7 more)

### Community 26 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Orient with your knowledge graph (if one exists), 2 — Load context in priority order, 3 — Output this summary, nothing else, 4 — Stop, Arguments, /evaluate, Steps

### Community 27 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Blast radius check, 2 — Write the implementation blueprint, 3 — State constraints, 4 — Stop and wait, /plan, Prerequisite, Steps

### Community 28 - "memory-parity.test.ts"
Cohesion: 0.12
Nodes (23): memoryAccrualStore, currentPeriod(), monthsToAccrue(), nextPeriod(), createPostgresAccrualStore(), AccrualDeps, MAX_CATCH_UP_MONTHS, runMonthlyAccrual() (+15 more)

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
Cohesion: 0.21
Nodes (20): LoginPage(), ALL_EMPLOYEES, AuditFilters(), AuditFiltersProps, LoginForm(), LoginFormProps, MockUserOption, ROLE_ORDER (+12 more)

### Community 37 - "approval-queue.tsx"
Cohesion: 0.16
Nodes (35): ApprovalQueue(), ApprovalQueueProps, BalanceHint(), ActionBadge(), AuditTable(), EmptyState(), EmptyStateProps, LeaveTypeBadge() (+27 more)

### Community 38 - "user-menu.tsx"
Cohesion: 0.08
Nodes (37): AuthenticatedLayout(), AppShell(), AppShellProps, Brand(), MobileNav(), activeHref(), NAV_ITEMS, NavItem (+29 more)

### Community 39 - "app/layout.tsx"
Cohesion: 0.22
Nodes (6): metadata, RootLayout(), viewport, Toaster(), geist, sonner

### Community 40 - "Revision v1.1 — EPIC 2 (2026-11-26)"
Cohesion: 0.12
Nodes (15): API Design (selected), Architecture Document — LeaveTrack v1.0, Considered and not adopted, Data Model, Data model additions (planned), Deployment changes, Deployment Topology, EPIC 2 decisions (adopted 2026-11-26) (+7 more)

### Community 41 - "types.ts"
Cohesion: 0.06
Nodes (43): Backlog (deferred, owner = Day 1 team), availableForRequest(), buildBalanceSummaries(), PendingRange, byId(), toView(), typeOf(), userName() (+35 more)

### Community 42 - "roles.ts"
Cohesion: 0.22
Nodes (11): MAX_REDIRECT_LENGTH, NEVER_REDIRECT_TO, PUBLIC_PATHS, REDIRECT_BASES, REDIRECT_GUARDS, redirectRejection(), resolveRedirect(), ROLE_LABEL (+3 more)

### Community 43 - "submit.test.ts"
Cohesion: 0.15
Nodes (14): SqlClient, SqlRow, toIso(), toNumber(), createPostgresDecideStore(), createPostgresSubmitStore(), DecidedRow, RequestRow (+6 more)

### Community 44 - "repositories.ts"
Cohesion: 0.15
Nodes (23): ApprovalsPage(), metadata, AuditPage(), metadata, one(), BalancePage(), metadata, metadata (+15 more)

### Community 45 - "request-form.tsx"
Cohesion: 0.19
Nodes (16): EMPTY, RequestForm(), RequestFormProps, FormControl(), FormDescription(), FormField(), FormFieldContext, FormFieldContextValue (+8 more)

### Community 46 - "Prove the test can fail (from TASK-010)"
Cohesion: 0.11
Nodes (17): DialogTrigger(), "Authorize before any database access" — prove it with a repository spy (from TASK-015), Browser e2e recipe (from TASK-016), Cross-cutting invariants: matrix + writer registry (from TASK-018), Defense in depth for "exactly once" writes (from TASK-014), Fail-closed configuration: test build time and runtime separately (from TASK-019), Headless browser tests with Radix overlays, Overlapping guards: name them and test each one directly (from TASK-020) (+9 more)

### Community 48 - "balance-card.tsx"
Cohesion: 0.30
Nodes (14): DashboardPage(), metadata, StatCard(), Loading(), BalanceCard(), BalanceCardProps, BalanceCardSkeleton(), LEAVE_TYPE_META (+6 more)

### Community 50 - "balance-writers.test.ts"
Cohesion: 0.06
Nodes (26): RFC-4180, matches, previous, STATUSES, [taskId, status, csvArg], getSession, input, service (+18 more)

### Community 52 - "leave-requests/route.ts"
Cohesion: 0.22
Nodes (15): POST, GET, ListQuerySchema, NO_STORE, POST, decideLeaveRequestAction(), submitLeaveRequestAction(), isAppError() (+7 more)

### Community 53 - "independence.test.ts"
Cohesion: 0.18
Nodes (11): createMockDb(), resetMockDb(), ANA, BEN, dbs, Harness, HARNESSES, memoryHarness() (+3 more)

### Community 57 - "e2e/helpers.ts"
Cohesion: 0.25
Nodes (15): enlargeText(), expectNoHorizontalOverflow(), expectNotUnderHeader(), expectTapTargets(), expectVisibleFocus(), focusedLabel(), focusIndicatorChange(), Role (+7 more)

### Community 58 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Inspect changes, 2 — Stage deliberately, 3 — Write the commit message, 4 — Confirm, /commit, Steps, When to use

### Community 59 - "decide.test.ts"
Cohesion: 0.16
Nodes (14): decideLeaveRequest(), run(), ANA, audit(), balance(), BEN, CARLA, dbs (+6 more)

### Community 60 - "decide.ts"
Cohesion: 0.25
Nodes (8): DecideDeps, RequestIdSchema, DecisionInput, DecisionSchema, LeaveRequestSchema, RejectReasonSchema, zod, valid

### Community 61 - "submit.ts"
Cohesion: 0.18
Nodes (14): Session, selectRepository(), Driver, getSql(), globalForDb, wrap(), LeaveRequestDecidedNotice, LeaveRequestSubmittedNotice (+6 more)

### Community 62 - "decision-dialog.tsx"
Cohesion: 0.22
Nodes (15): DecisionDialog(), confirm(), handleOpenChange(), DecisionDialogProps, Alert(), AlertTitle(), alertVariants, Dialog() (+7 more)

### Community 63 - "cn"
Cohesion: 0.18
Nodes (14): AvatarBadge(), AvatarGroup(), AvatarGroupCount(), AvatarImage(), badgeVariants, CardAction(), CardFooter(), SelectSeparator() (+6 more)

### Community 64 - "LeaveTrack UI — Design System"
Cohesion: 0.13
Nodes (14): Backlog, Color tokens, Components, Core, Iconography, Layout & breakpoints, Leave types, LeaveTrack UI — Design System (+6 more)

### Community 65 - "Button"
Cohesion: 0.34
Nodes (9): AppError(), ForbiddenPage(), metadata, NotFound(), StatusScreen(), StatusScreenProps, Button(), buttonVariants (+1 more)

### Community 66 - "LeaveTrack"
Cohesion: 0.13
Nodes (14): Accrual job (TASK-017), Database, Day 1 hand-off notes, Environment, HR audit (TASK-015), Known limitations, Leave types are independent (TASK-018 / US-08), LeaveTrack (+6 more)

### Community 67 - "utcMonthBounds"
Cohesion: 0.36
Nodes (8): Database, utcDay(), utcMonthBounds(), withinUtcDays(), addDays(), fromHundredths(), sumDays(), toHundredths()

### Community 69 - "AGENTS.md — LeaveTrack"
Cohesion: 0.20
Nodes (9): AGENTS.md — LeaveTrack, Frontend standards, Git conventions, Project, Quality gates (must pass before merge), Security rules, Stack, Task tracking (+1 more)

### Community 70 - "vitest"
Cohesion: 0.07
Nodes (31): accrualRuns, auditLog, BALANCE_ROWS, LAST_ACCRUAL_AT, LEAVE_TYPE_IDS, leaveBalances, leavePolicies, leaveRequests (+23 more)

### Community 71 - "env.ts"
Cohesion: 0.08
Nodes (23): notFound(), POST(), tokenMatches(), ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering, Consequences, Context, Decision, Options considered (+15 more)

### Community 72 - "login/actions.ts"
Cohesion: 0.27
Nodes (8): loginAction(), LoginSchema, LoginState, logoutAction(), SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, sessionCookieOptions(), isProduction

### Community 73 - "proxy.ts"
Cohesion: 0.33
Nodes (8): APPLY — Generate the Complete Boilerplate, Next.js 16, canAccess(), isPublicPath(), isRole(), matches(), config, proxy()

### Community 74 - "schema.test.ts"
Cohesion: 0.09
Nodes (22): AUDIT_ACTIONS, LEAVE_TYPE_NAMES, REQUEST_STATUSES, @electric-sql/pglite, dbs, dbs, insertPending(), MIA_REPORTS (+14 more)

### Community 75 - "Coding Standards — LeaveTrack"
Cohesion: 0.22
Nodes (8): API route handlers, Coding Standards — LeaveTrack, Dependencies, Hard-won rules (from Day 0 VALIDATE), Logging, Testing, TypeScript, UI

### Community 76 - "Notifier"
Cohesion: 0.29
Nodes (5): ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox, Consequences, Context, Decision, Notifier

### Community 77 - "/scaffold"
Cohesion: 0.29
Nodes (6): Ecosystem reference, EVALUATE — Understand the Architecture and Design, PLAN — Boilerplate + UI Shell + Project Rules, Prerequisites, /scaffold, VALIDATE — Validate Infrastructure + Design Fidelity

### Community 78 - "decide-memory.test.ts"
Cohesion: 0.10
Nodes (14): LeaveRequest, memoryDecideStore, BalanceContext, DecideInput, DecideOutcome, DecideStore, NewLeaveRequest, Requester (+6 more)

### Community 79 - "ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port, Consequences, Context, Decision, Options considered

### Community 80 - "ADR-LeaveTrack-E004 — Real Authentication: Supabase Auth with signed sessions"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E004 — Real Authentication: Supabase Auth with signed sessions, Consequences, Context, Decision, Options considered

### Community 81 - "ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR, Consequences, Context, Decision

### Community 82 - "ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions, Consequences, Context, Decision

### Community 83 - "Retro — Day 0 scaffold (2026-11-24)"
Cohesion: 0.40
Nodes (4): EPIC 2 planning (2026-11-26), Fixed in VALIDATE, Retro — Day 0 scaffold (2026-11-24), What went well

### Community 84 - "next.config.ts"
Cohesion: 0.50
Nodes (3): csp, nextConfig, securityHeaders

## Knowledge Gaps
- **538 isolated node(s):** `@commitlint/config-conventional`, `uvx`, `nexus-mcp`, `semi`, `singleQuote` (+533 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 626 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `AppError`, `utcMonthBounds`, `package.json`, `approval-queue.tsx`, `env.ts`, `types.ts`, `schema.test.ts`, `submit.test.ts`, `roles.ts`, `decide.ts`, `decide-memory.test.ts`, `balance-writers.test.ts`, `accrual/route.test.ts`, `independence.test.ts`, `accrual/route.ts`, `decide.test.ts`, `memory-parity.test.ts`, `submit.ts`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `next` connect `repositories.ts` to `AppError`, `Button`, `login-form.tsx`, `approval-queue.tsx`, `user-menu.tsx`, `env.ts`, `app/layout.tsx`, `login/actions.ts`, `package.json`, `proxy.ts`, `vitest`, `balance-card.tsx`, `leave-requests/route.ts`, `next.config.ts`, `accrual/route.test.ts`, `accrual/route.ts`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `uvx`, `nexus-mcp` to the rest of the system?**
  _538 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Business Requirements Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `Architecture Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._