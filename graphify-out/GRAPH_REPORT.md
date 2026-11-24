# Graph Report - leave-track  (2026-11-24)

## Corpus Check
- 128 files · ~42,118 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 6, .example 1, .css 1)

## Summary
- 849 nodes · 1752 edges · 58 communities (49 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

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
- response.ts
- .prettierrc.json
- pr-verifier.md
- Steps
- Steps
- nexus
- extends
- postcss.config.mjs
- types.ts
- user-menu.tsx
- roles.ts
- layout.tsx
- env.ts
- cn
- schema.test.ts
- approval-queue.tsx
- engines
- mobile-nav.tsx
- login/actions.ts
- eslint.config.mjs
- LeaveTrack UI — Design System
- Coding Standards — LeaveTrack
- Retro — Day 0 scaffold (2026-11-24)
- implement-api-route.md
- implement-ui-component.md
- write-migration.md
- LeaveTrack
- /scaffold

## God Nodes (most connected - your core abstractions)
1. `cn()` - 93 edges
2. `Button()` - 31 edges
3. `lucide-react` - 28 edges
4. `RequestForm()` - 24 edges
5. `next` - 23 edges
6. `ApprovalQueue()` - 21 edges
7. `react` - 21 edges
8. `DecisionDialog()` - 20 edges
9. `RequestList()` - 19 edges
10. `Feature components` - 19 edges

## Surprising Connections (you probably didn't know these)
- `UI` --references--> `Table()`  [INFERRED]
  knowledge/rules/coding-standards.md → components/ui/table.tsx
- `API route handlers` --references--> `withErrorHandler()`  [INFERRED]
  knowledge/rules/coding-standards.md → lib/api/with-error-handler.ts
- `Frontend standards` --references--> `requireRole()`  [INFERRED]
  AGENTS.md → lib/auth/session.ts
- `Backlog (deferred, owner = Day 1 team)` --references--> `countDays()`  [INFERRED]
  knowledge/retros/2026-11-24-day0-scaffold.md → lib/format.ts
- `Hard-won rules (from Day 0 VALIDATE)` --references--> `cn()`  [INFERRED]
  knowledge/rules/coding-standards.md → lib/utils.ts

## Import Cycles
- None detected.

## Communities (58 total, 9 thin omitted)

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
Nodes (23): description, @commitlint/config-conventional, name, private, version, class-variance-authority, clsx, @commitlint/cli (+15 more)

### Community 5 - "Architecture Document — LeaveTrack v1.0"
Cohesion: 0.10
Nodes (19): Adr-Leavetrack-E001 — Auth & Session Strategy, ADR-LeaveTrack-E001 — Auth & Session Strategy, Api Design (Selected), API Design (selected), Architecture Document — LeaveTrack v1.0, Architecture Summary, Consequences, Context (+11 more)

### Community 6 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 7 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, @commitlint/cli, @commitlint/config-conventional, @electric-sql/pglite, eslint, eslint-config-next, husky, lint-staged (+11 more)

### Community 8 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, class-variance-authority, clsx, geist, @hookform/resolvers, lucide-react, next, pino (+8 more)

### Community 9 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, db:push, db:reset, dev, format, format:check, lint (+7 more)

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

### Community 28 - "response.ts"
Cohesion: 0.09
Nodes (27): AGENTS.md — LeaveTrack, Backend standards, Frontend standards, Git conventions, Project, Quality gates (must pass before merge), Security rules, Stack (+19 more)

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

### Community 36 - "types.ts"
Cohesion: 0.06
Nodes (57): ApprovalsPage(), metadata, AuditPage(), metadata, one(), BalancePage(), metadata, DashboardPage() (+49 more)

### Community 37 - "user-menu.tsx"
Cohesion: 0.16
Nodes (16): UserMenu(), UserMenuProps, Avatar(), AvatarFallback(), DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem() (+8 more)

### Community 38 - "roles.ts"
Cohesion: 0.31
Nodes (10): canAccess(), isPublicPath(), isRole(), matches(), PUBLIC_PATHS, ROLE_LABEL, ROUTE_ACCESS, safeRedirectPath() (+2 more)

### Community 39 - "layout.tsx"
Cohesion: 0.22
Nodes (6): metadata, RootLayout(), viewport, Toaster(), geist, sonner

### Community 40 - "env.ts"
Cohesion: 0.22
Nodes (7): env, EnvSchema, isProduction, optionalSecret, optionalUrl, pino, zod

### Community 41 - "cn"
Cohesion: 0.06
Nodes (73): AppError(), ForbiddenPage(), metadata, NotFound(), Decision, DecisionDialog(), confirm(), handleOpenChange() (+65 more)

### Community 42 - "schema.test.ts"
Cohesion: 0.05
Nodes (42): RFC-4180, auditLog, BALANCE_ROWS, LAST_ACCRUAL_AT, LEAVE_TYPE_IDS, leaveBalances, leavePolicies, leaveRequests (+34 more)

### Community 43 - "approval-queue.tsx"
Cohesion: 0.15
Nodes (36): ApprovalQueue(), ApprovalQueueProps, BalanceHint(), ActionBadge(), AuditTable(), EmptyState(), EmptyStateProps, LeaveTypeBadge() (+28 more)

### Community 45 - "mobile-nav.tsx"
Cohesion: 0.14
Nodes (23): AuthenticatedLayout(), AppShell(), AppShellProps, Brand(), MobileNav(), activeHref(), NAV_ITEMS, NavItem (+15 more)

### Community 46 - "login/actions.ts"
Cohesion: 0.27
Nodes (8): loginAction(), LoginSchema, LoginState, logoutAction(), SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, sessionCookieOptions(), Day 1 hand-off notes

### Community 50 - "LeaveTrack UI — Design System"
Cohesion: 0.13
Nodes (14): Backlog, Color tokens, Components, Core, Iconography, Layout & breakpoints, Leave types, LeaveTrack UI — Design System (+6 more)

### Community 52 - "Coding Standards — LeaveTrack"
Cohesion: 0.17
Nodes (11): API route handlers, Coding Standards — LeaveTrack, Database, Dependencies, Hard-won rules (from Day 0 VALIDATE), Logging, Next.js 16, Testing (+3 more)

### Community 53 - "Retro — Day 0 scaffold (2026-11-24)"
Cohesion: 0.40
Nodes (4): Backlog (deferred, owner = Day 1 team), Fixed in VALIDATE, Retro — Day 0 scaffold (2026-11-24), What went well

### Community 57 - "LeaveTrack"
Cohesion: 0.25
Nodes (7): Database, Environment, LeaveTrack, Project layout, Quick start, Scripts, Trying each role

### Community 59 - "/scaffold"
Cohesion: 0.25
Nodes (7): APPLY — Generate the Complete Boilerplate, Ecosystem reference, EVALUATE — Understand the Architecture and Design, PLAN — Boilerplate + UI Shell + Project Rules, Prerequisites, /scaffold, VALIDATE — Validate Infrastructure + Design Fidelity

## Knowledge Gaps
- **388 isolated node(s):** `@commitlint/config-conventional`, `uvx`, `nexus-mcp`, `semi`, `singleQuote` (+383 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 438 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `types.ts` to `package.json`, `roles.ts`, `layout.tsx`, `cn`, `approval-queue.tsx`, `mobile-nav.tsx`, `login/actions.ts`, `response.ts`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `types.ts`, `user-menu.tsx`, `approval-queue.tsx`, `mobile-nav.tsx`, `Coding Standards — LeaveTrack`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `approval-queue.tsx` to `types.ts`, `user-menu.tsx`, `package.json`, `layout.tsx`, `cn`, `mobile-nav.tsx`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `uvx`, `nexus-mcp` to the rest of the system?**
  _388 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Business Requirements Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `Architecture Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._