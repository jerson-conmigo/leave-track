# Graph Report - leave-track  (2026-11-26)

## Corpus Check
- 210 files · ~84,477 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 6, .csv 2, .example 1)

## Summary
- 1265 nodes · 2931 edges · 81 communities (70 shown, 11 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 80 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2b7fc48b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Business Requirements Document — LeaveTrack v1.0
- AGENTS.md — LeaveTrack
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
- Revision v1.1 — EPIC 2 (2026-11-26)
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
- types.ts
- mobile-nav.tsx
- app/layout.tsx
- Architecture Document — LeaveTrack v1.0
- reset/route.ts
- Notifier
- repositories.ts
- Prove the test can fail (from TASK-010)
- balance-writers.test.ts
- submit.test.ts
- implement-api-route.md
- implement-ui-component.md
- write-migration.md
- e2e/helpers.ts
- Steps
- decide.test.ts
- next
- vitest
- postgres-repository.test.ts
- login/actions.ts
- LeaveTrack
- decide-memory.test.ts
- vercel.json
- roles.ts
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
- leave-requests/route.test.ts
- Coding Standards — LeaveTrack
- postgres.ts
- ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering
- instrumentation.ts
- ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port

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
- `Frontend standards` --references--> `requireRole()`  [INFERRED]
  AGENTS.md → lib/auth/session.ts
- `Options considered` --references--> `SqlClient`  [INFERRED]
  docs/arch-docs/ADR-LeaveTrack-E003-Data-Access.md → lib/db/sql.ts
- `Logging` --references--> `Logger`  [INFERRED]
  knowledge/rules/coding-standards.md → lib/logger.ts

## Import Cycles
- None detected.

## Communities (81 total, 11 thin omitted)

### Community 0 - "Business Requirements Document — LeaveTrack v1.0"
Cohesion: 0.09
Nodes (21): Additional Functional Requirements, Additional Risks, Additional Stakeholder Concerns, Additional Success Criteria, Assumptions, Business Context, Business Requirements Document — LeaveTrack v1.0, Constraints (+13 more)

### Community 1 - "AGENTS.md — LeaveTrack"
Cohesion: 0.22
Nodes (8): AGENTS.md — LeaveTrack, Frontend standards, Git conventions, Project, Quality gates (must pass before merge), Stack, Task tracking, Where things go

### Community 2 - "ADR-LeaveTrack-E001 — Auth & Session Strategy"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E001 — Auth & Session Strategy, Consequences, Context, Decision, Options Considered

### Community 3 - "Product Requirements Document — LeaveTrack v1.0"
Cohesion: 0.17
Nodes (11): Business Rules (EPIC 2), Non-Functional Requirements, Non-Functional Requirements (additions), Out of Scope, Out of Scope (additions), Product Requirements Document — LeaveTrack v1.0, Revision v1.1 — EPIC 2 (2026-11-26), User Roles (+3 more)

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

### Community 25 - "Revision v1.1 — EPIC 2 (2026-11-26)"
Cohesion: 0.29
Nodes (7): Considered and not adopted, Data model additions (planned), Deployment changes, EPIC 2 decisions (adopted 2026-11-26), Open Questions (updated), Revision v1.1 — EPIC 2 (2026-11-26), Stack changes

### Community 26 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Orient with your knowledge graph (if one exists), 2 — Load context in priority order, 3 — Output this summary, nothing else, 4 — Stop, Arguments, /evaluate, Steps

### Community 27 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Blast radius check, 2 — Write the implementation blueprint, 3 — State constraints, 4 — Stop and wait, /plan, Prerequisite, Steps

### Community 28 - "memory-parity.test.ts"
Cohesion: 0.10
Nodes (34): authorized(), GET, handler(), POST, Database, getAccrualDeps(), memoryAccrualStore, currentPeriod() (+26 more)

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
Cohesion: 0.05
Nodes (93): AuditPage(), one(), AppError(), ForbiddenPage(), metadata, NotFound(), DecisionDialog(), confirm() (+85 more)

### Community 37 - "types.ts"
Cohesion: 0.06
Nodes (69): ApprovalQueue(), ApprovalQueueProps, BalanceHint(), ActionBadge(), AuditTable(), EmptyState(), EmptyStateProps, LeaveTypeBadge() (+61 more)

### Community 38 - "mobile-nav.tsx"
Cohesion: 0.12
Nodes (26): AuthenticatedLayout(), HIGHLIGHTS, LoginPage(), metadata, AppShell(), AppShellProps, Brand(), MobileNav() (+18 more)

### Community 39 - "app/layout.tsx"
Cohesion: 0.22
Nodes (6): metadata, RootLayout(), viewport, Toaster(), geist, sonner

### Community 40 - "Architecture Document — LeaveTrack v1.0"
Cohesion: 0.25
Nodes (7): API Design (selected), Architecture Document — LeaveTrack v1.0, Data Model, Deployment Topology, Open Questions, Security, Stack

### Community 41 - "reset/route.ts"
Cohesion: 0.83
Nodes (3): notFound(), POST(), tokenMatches()

### Community 43 - "Notifier"
Cohesion: 0.29
Nodes (5): ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox, Consequences, Context, Decision, Notifier

### Community 44 - "repositories.ts"
Cohesion: 0.11
Nodes (36): ApprovalsPage(), metadata, metadata, BalancePage(), metadata, DashboardPage(), metadata, StatCard() (+28 more)

### Community 46 - "Prove the test can fail (from TASK-010)"
Cohesion: 0.13
Nodes (14): DialogTrigger(), "Authorize before any database access" — prove it with a repository spy (from TASK-015), Browser e2e recipe (from TASK-016), Cross-cutting invariants: matrix + writer registry (from TASK-018), Defense in depth for "exactly once" writes (from TASK-014), Headless browser tests with Radix overlays, Pattern — Implement-and-test chain, Precision tests need inputs that really drift (from TASK-017) (+6 more)

### Community 50 - "balance-writers.test.ts"
Cohesion: 0.06
Nodes (26): RFC-4180, matches, previous, STATUSES, [taskId, status, csvArg], getSession, input, service (+18 more)

### Community 52 - "submit.test.ts"
Cohesion: 0.14
Nodes (15): Security-scoped queries: assert the scope structurally (from TASK-013), SqlClient, SqlRow, toIso(), toNumber(), createPostgresDecideStore(), createPostgresSubmitStore(), DecidedRow (+7 more)

### Community 57 - "e2e/helpers.ts"
Cohesion: 0.21
Nodes (16): enlargeText(), expectNoHorizontalOverflow(), expectNotUnderHeader(), expectTapTargets(), expectVisibleFocus(), focusedLabel(), focusIndicatorChange(), Role (+8 more)

### Community 58 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Inspect changes, 2 — Stage deliberately, 3 — Write the commit message, 4 — Confirm, /commit, Steps, When to use

### Community 59 - "decide.test.ts"
Cohesion: 0.19
Nodes (11): ANA, audit(), balance(), BEN, CARLA, dbs, decide(), MAYA (+3 more)

### Community 61 - "next"
Cohesion: 0.06
Nodes (64): Backend standards, GET, ParamsSchema, QuerySchema, dynamic, GET, POST, GET (+56 more)

### Community 62 - "vitest"
Cohesion: 0.12
Nodes (14): LEAVE_TYPE_IDS, USER_IDS, mockRepository, mockDb, memorySubmitStore, vitest, getEmployeeAuditHistory, getSession (+6 more)

### Community 64 - "postgres-repository.test.ts"
Cohesion: 0.17
Nodes (8): users, balances(), dbs, DEC, dbs, insertPending(), MIA_REPORTS, seedMiasTeam()

### Community 65 - "login/actions.ts"
Cohesion: 0.24
Nodes (9): loginAction(), LoginSchema, LoginState, logoutAction(), SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, sessionCookieOptions(), isProduction (+1 more)

### Community 66 - "LeaveTrack"
Cohesion: 0.15
Nodes (12): Accrual job (TASK-017), Database, Environment, HR audit (TASK-015), Known limitations, Leave types are independent (TASK-018 / US-08), LeaveTrack, Project layout (+4 more)

### Community 67 - "decide-memory.test.ts"
Cohesion: 0.12
Nodes (13): memoryDecideStore, BalanceContext, DecideInput, DecideOutcome, DecideStore, NewLeaveRequest, Requester, BEN (+5 more)

### Community 69 - "roles.ts"
Cohesion: 0.31
Nodes (8): canAccess(), isPublicPath(), isRole(), matches(), PUBLIC_PATHS, ROUTE_ACCESS, config, proxy()

### Community 70 - "fixtures.ts"
Cohesion: 0.16
Nodes (12): accrualRuns, auditLog, BALANCE_ROWS, LAST_ACCRUAL_AT, leaveBalances, leavePolicies, leaveRequests, leaveTypes (+4 more)

### Community 71 - "env.ts"
Cohesion: 0.21
Nodes (11): TypeScript, DEPLOYED_APP_ENVS, DEPLOYED_VERCEL_ENVS, EnvSchema, isDeployedEnv(), optionalSecret, optionalUrl, parseEnv() (+3 more)

### Community 73 - "LeaveTrack UI — Design System"
Cohesion: 0.13
Nodes (14): Backlog, Color tokens, Components, Core, Iconography, Layout & breakpoints, Leave types, LeaveTrack UI — Design System (+6 more)

### Community 74 - "schema.test.ts"
Cohesion: 0.11
Nodes (18): AUDIT_ACTIONS, LEAVE_TYPE_NAMES, REQUEST_STATUSES, ROLES, @electric-sql/pglite, createTestDb(), migratedDb(), MIGRATION_FILES (+10 more)

### Community 78 - "independence.test.ts"
Cohesion: 0.11
Nodes (14): createMockDb(), resetMockDb(), SubmitStore, ANA, BEN, dbs, decide(), Harness (+6 more)

### Community 79 - "/scaffold"
Cohesion: 0.25
Nodes (7): APPLY — Generate the Complete Boilerplate, Ecosystem reference, EVALUATE — Understand the Architecture and Design, PLAN — Boilerplate + UI Shell + Project Rules, Prerequisites, /scaffold, VALIDATE — Validate Infrastructure + Design Fidelity

### Community 81 - "ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR, Consequences, Context, Decision

### Community 82 - "ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions, Consequences, Context, Decision

### Community 83 - "safeRedirectPath"
Cohesion: 0.25
Nodes (7): Security rules, Security changes, EPIC 2 planning (2026-11-26), Fixed in VALIDATE, Retro — Day 0 scaffold (2026-11-24), What went well, safeRedirectPath()

### Community 86 - "leave-requests/route.test.ts"
Cohesion: 0.20
Nodes (7): ANA_SESSION, BEN_SESSION, BENS_TEAM, CARLA_SESSION, getSession, Row, validBody

### Community 88 - "Coding Standards — LeaveTrack"
Cohesion: 0.22
Nodes (8): API route handlers, Coding Standards — LeaveTrack, Dependencies, Hard-won rules (from Day 0 VALIDATE), Logging, Next.js 16, Testing, UI

### Community 89 - "postgres.ts"
Cohesion: 0.25
Nodes (8): selectRepository(), Driver, getSql(), globalForDb, wrap(), env, Where data goes, postgres

### Community 90 - "ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering"
Cohesion: 0.29
Nodes (6): ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering, Consequences, Context, Decision, Options considered, Policy changes vs catch-up

### Community 91 - "instrumentation.ts"
Cohesion: 0.38
Nodes (3): register(), assertEnvOrExit(), register()

### Community 93 - "ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port, Consequences, Context, Decision, Options considered

## Knowledge Gaps
- **534 isolated node(s):** `@commitlint/config-conventional`, `uvx`, `nexus-mcp`, `semi`, `singleQuote` (+529 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 622 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `postgres-repository.test.ts`, `decide-memory.test.ts`, `package.json`, `types.ts`, `fixtures.ts`, `roles.ts`, `env.ts`, `decide.test.ts`, `schema.test.ts`, `independence.test.ts`, `balance-writers.test.ts`, `submit.test.ts`, `leave-requests/route.test.ts`, `instrumentation.ts`, `memory-parity.test.ts`, `next`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `login/actions.ts`, `cn`, `types.ts`, `mobile-nav.tsx`, `app/layout.tsx`, `package.json`, `reset/route.ts`, `roles.ts`, `repositories.ts`, `leave-requests/route.test.ts`, `memory-parity.test.ts`, `vitest`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `Coding Standards — LeaveTrack`, `repositories.ts`, `types.ts`, `mobile-nav.tsx`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `uvx`, `nexus-mcp` to the rest of the system?**
  _534 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Business Requirements Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `Architecture Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._