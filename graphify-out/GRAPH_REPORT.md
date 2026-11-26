# Graph Report - leave-track  (2026-11-26)

## Corpus Check
- 254 files · ~107,029 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 6, .csv 2, .example 1)

## Summary
- 1499 nodes · 3584 edges · 101 communities (84 shown, 17 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 98 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `67e4ea3e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Business Requirements Document — LeaveTrack v1.0
- Revision v1.1 — EPIC 2 (2026-11-26)
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
- approval-queue.tsx
- Review Checklist
- Review Checklist
- Review Checklist
- Review Checklist
- Steps
- repositories.ts
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
- mobile-nav.tsx
- repository.ts
- app/layout.tsx
- types.ts
- session-token.ts
- roles.ts
- cn
- login-form.tsx
- request-form.tsx
- Prove the test can fail (from TASK-010)
- action-errors.test.ts
- set-task-status.mjs
- decision-dialog.tsx
- login/page.tsx
- implement-api-route.md
- implement-ui-component.md
- write-migration.md
- /scaffold
- react
- invite-user.mjs
- LeaveRepository
- e2e/helpers.ts
- vitest
- e2e-supabase-harness.test.ts
- Button
- Steps
- LeaveTrack
- LeaveTrack UI — Design System
- vercel.json
- login/actions.ts
- forgot-password/actions.ts
- provider.ts
- Steps
- Notifier
- Coding Standards — LeaveTrack
- playwright.supabase.config.ts
- ref_node_path
- AGENTS.md — LeaveTrack
- ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port
- ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR
- ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions
- independence.test.ts
- set-task-status.test.ts
- next
- ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering
- instrumentation.ts
- decide.test.ts
- env.ts
- account-actions.test.ts
- balance-writers.test.ts
- EPIC 2 planning (2026-11-26)
- repo-hygiene.test.ts
- coverage-summary.test.ts
- coverage-summary.mjs
- security-conventions.test.ts
- playwright.config.ts
- auth.spec.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 93 edges
2. `vitest` - 57 edges
3. `next` - 46 edges
4. `Button()` - 37 edges
5. `lucide-react` - 32 edges
6. `AppError` - 26 edges
7. `RequestForm()` - 24 edges
8. `react` - 24 edges
9. `getAuthProvider()` - 23 edges
10. `DecisionDialog()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Decision` --references--> `POST()`  [INFERRED]
  docs/arch-docs/ADR-LeaveTrack-E002-Accrual-Idempotency.md → app/api/test/reset/route.ts
- `API route handlers` --references--> `withErrorHandler()`  [INFERRED]
  knowledge/rules/coding-standards.md → lib/api/with-error-handler.ts
- `Security changes` --references--> `safeRedirectPath()`  [INFERRED]
  docs/arch-docs/ARCH-LeaveTrack-v1.0.md → lib/auth/roles.ts
- `Frontend standards` --references--> `requireRole()`  [INFERRED]
  AGENTS.md → lib/auth/session.ts
- `Day 1 hand-off notes` --references--> `LeaveRepository`  [INFERRED]
  README.md → lib/data/repositories.ts

## Import Cycles
- None detected.

## Communities (101 total, 17 thin omitted)

### Community 0 - "Business Requirements Document — LeaveTrack v1.0"
Cohesion: 0.09
Nodes (21): Additional Functional Requirements, Additional Risks, Additional Stakeholder Concerns, Additional Success Criteria, Assumptions, Business Context, Business Requirements Document — LeaveTrack v1.0, Constraints (+13 more)

### Community 1 - "Revision v1.1 — EPIC 2 (2026-11-26)"
Cohesion: 0.12
Nodes (15): API Design (selected), Architecture Document — LeaveTrack v1.0, Considered and not adopted, Data Model, Data model additions (planned), Deployment changes, Deployment Topology, EPIC 2 decisions (adopted 2026-11-26) (+7 more)

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
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, geist, @hookform/resolvers, lucide-react, next, pino (+11 more)

### Community 9 - "scripts"
Cohesion: 0.10
Nodes (20): scripts, build, db:push, db:reset, dev, format, format:check, lint (+12 more)

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

### Community 19 - "approval-queue.tsx"
Cohesion: 0.14
Nodes (37): ApprovalQueue(), ApprovalQueueProps, BalanceHint(), ActionBadge(), AuditTable(), EmptyState(), EmptyStateProps, LeaveTypeBadge() (+29 more)

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

### Community 25 - "repositories.ts"
Cohesion: 0.09
Nodes (44): ApprovalsPage(), metadata, AuditPage(), metadata, one(), BalancePage(), metadata, DashboardPage() (+36 more)

### Community 26 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Orient with your knowledge graph (if one exists), 2 — Load context in priority order, 3 — Output this summary, nothing else, 4 — Stop, Arguments, /evaluate, Steps

### Community 27 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Blast radius check, 2 — Write the implementation blueprint, 3 — State constraints, 4 — Stop and wait, /plan, Prerequisite, Steps

### Community 28 - "memory-parity.test.ts"
Cohesion: 0.13
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

### Community 36 - "db/helpers.ts"
Cohesion: 0.15
Nodes (19): B30 — PGlite lifecycle and CI memory (2026-11-26), @electric-sql/pglite, insertPending(), MIA_REPORTS, seedMiasTeam(), track, built(), closeAfterEachTest() (+11 more)

### Community 37 - "mobile-nav.tsx"
Cohesion: 0.14
Nodes (22): AuthenticatedLayout(), AppShell(), AppShellProps, MobileNav(), activeHref(), NAV_ITEMS, NavItem, navItemsFor() (+14 more)

### Community 38 - "repository.ts"
Cohesion: 0.14
Nodes (20): Backlog (deferred, owner = Day 1 team), availableForRequest(), buildBalanceSummaries(), PendingRange, byId(), toView(), typeOf(), userName() (+12 more)

### Community 39 - "app/layout.tsx"
Cohesion: 0.22
Nodes (6): metadata, RootLayout(), viewport, Toaster(), geist, sonner

### Community 40 - "types.ts"
Cohesion: 0.07
Nodes (28): accrualRuns, auditLog, BALANCE_ROWS, LAST_ACCRUAL_AT, leaveRequests, leaveTypes, AccrualResult, AccrualRun (+20 more)

### Community 41 - "session-token.ts"
Cohesion: 0.14
Nodes (15): getSessionSecret(), isClaims(), MAX_TOKEN_LENGTH, SessionClaims, sign(), signSessionToken(), VerifyResult, verifySessionToken() (+7 more)

### Community 42 - "roles.ts"
Cohesion: 0.18
Nodes (17): proxyCookieIO(), canAccess(), isPublicPath(), isRole(), matches(), MAX_REDIRECT_LENGTH, NEVER_REDIRECT_TO, PUBLIC_PATHS (+9 more)

### Community 43 - "cn"
Cohesion: 0.14
Nodes (22): UserMenu(), UserMenuProps, Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage() (+14 more)

### Community 44 - "login-form.tsx"
Cohesion: 0.22
Nodes (18): LoginState, AuditFilters(), AuditFiltersProps, LoginForm(), LoginFormProps, MockUserOption, ROLE_ORDER, Select() (+10 more)

### Community 45 - "request-form.tsx"
Cohesion: 0.20
Nodes (15): EMPTY, RequestForm(), RequestFormProps, FormControl(), FormDescription(), FormField(), FormFieldContext, FormFieldContextValue (+7 more)

### Community 46 - "Prove the test can fail (from TASK-010)"
Cohesion: 0.09
Nodes (22): DialogTrigger(), "Authorize before any database access" — prove it with a repository spy (from TASK-015), Browser e2e recipe (from TASK-016), Changing tooling versions: diff the resolved config, measure before thresholding (from TASK-021), Cross-cutting invariants: matrix + writer registry (from TASK-018), Defense in depth for "exactly once" writes (from TASK-014), Fail-closed configuration: test build time and runtime separately (from TASK-019), Headless browser tests with Radix overlays (+14 more)

### Community 48 - "action-errors.test.ts"
Cohesion: 0.20
Nodes (8): getSession, input, service, appFiles, code(), files(), rel(), root

### Community 50 - "set-task-status.mjs"
Cohesion: 0.20
Nodes (6): RFC-4180, matches, previous, STATUSES, [taskId, status, csvArg], temp

### Community 52 - "decision-dialog.tsx"
Cohesion: 0.24
Nodes (14): DecisionDialog(), confirm(), handleOpenChange(), DecisionDialogProps, AlertTitle(), Dialog(), DialogContent(), DialogDescription() (+6 more)

### Community 53 - "login/page.tsx"
Cohesion: 0.25
Nodes (8): dynamic, ForgotPasswordPage(), metadata, HIGHLIGHTS, LoginPage(), metadata, NOTICES, Brand()

### Community 57 - "/scaffold"
Cohesion: 0.25
Nodes (7): APPLY — Generate the Complete Boilerplate, Ecosystem reference, EVALUATE — Understand the Architecture and Design, PLAN — Boilerplate + UI Shell + Project Rules, Prerequisites, /scaffold, VALIDATE — Validate Infrastructure + Design Fidelity

### Community 58 - "react"
Cohesion: 0.38
Nodes (11): forgotPasswordAction(), ForgotPasswordForm(), PasswordLoginForm(), PasswordLoginFormProps, SetPasswordForm(), Alert(), AlertDescription(), alertVariants (+3 more)

### Community 59 - "invite-user.mjs"
Cohesion: 0.22
Nodes (6): postgres, @supabase/supabase-js, Email, inviteUser(), MESSAGES, USER

### Community 60 - "LeaveRepository"
Cohesion: 0.15
Nodes (8): LeaveRepository, BalanceSummary, OrgStats, PolicyView, TeamRequestView, User, balancesFor(), reads()

### Community 61 - "e2e/helpers.ts"
Cohesion: 0.23
Nodes (15): enlargeText(), expectNoHorizontalOverflow(), expectNotUnderHeader(), expectTapTargets(), expectVisibleFocus(), focusedLabel(), focusIndicatorChange(), Role (+7 more)

### Community 62 - "vitest"
Cohesion: 0.07
Nodes (28): LEAVE_TYPE_IDS, leaveBalances, leavePolicies, USER_IDS, mockRepository, createMockDb(), globalForMock, mockDb (+20 more)

### Community 63 - "e2e-supabase-harness.test.ts"
Cohesion: 0.29
Nodes (7): accessTokenFromCookies(), TEST_EMAIL_DOMAIN, testEmail(), @supabase/ssr, harnessDir, root, sources

### Community 64 - "Button"
Cohesion: 0.30
Nodes (10): AppError(), ForbiddenPage(), metadata, NotFound(), StatusScreen(), StatusScreenProps, Button(), buttonVariants (+2 more)

### Community 65 - "Steps"
Cohesion: 0.22
Nodes (8): 0 — Run code review first, 1 — Gather context, 2 — Draft the PR, 3 — Push and open the PR, 4 — Output, /create-pr, Steps, When to use

### Community 66 - "LeaveTrack"
Cohesion: 0.12
Nodes (15): Accrual job (TASK-017), Database, Day 1 hand-off notes, Environment, HR audit (TASK-015), Known limitations, Leave types are independent (TASK-018 / US-08), LeaveTrack (+7 more)

### Community 67 - "LeaveTrack UI — Design System"
Cohesion: 0.13
Nodes (14): Backlog, Color tokens, Components, Core, Iconography, Layout & breakpoints, Leave types, LeaveTrack UI — Design System (+6 more)

### Community 69 - "login/actions.ts"
Cohesion: 0.23
Nodes (16): GET, setPasswordAction(), SetPasswordState, dynamic, metadata, SetPasswordPage(), loginAction(), logoutAction() (+8 more)

### Community 70 - "forgot-password/actions.ts"
Cohesion: 0.33
Nodes (5): ForgotPasswordState, ForgotPasswordSchema, PASSWORD_MAX, PASSWORD_MIN, SetPasswordSchema

### Community 71 - "provider.ts"
Cohesion: 0.10
Nodes (17): CookieIO, CookieJar, CookieToSet, SESSION_MAX_AGE_SECONDS, AuthProvider, EmailLinkType, NO_PROVIDER_SESSION, ProviderResult (+9 more)

### Community 72 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Inspect changes, 2 — Stage deliberately, 3 — Write the commit message, 4 — Confirm, /commit, Steps, When to use

### Community 74 - "Notifier"
Cohesion: 0.29
Nodes (5): ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox, Consequences, Context, Decision, Notifier

### Community 75 - "Coding Standards — LeaveTrack"
Cohesion: 0.15
Nodes (17): API route handlers, Coding Standards — LeaveTrack, Database, Dependencies, Hard-won rules (from Day 0 VALIDATE), Logging, Next.js 16, Testing (+9 more)

### Community 76 - "playwright.supabase.config.ts"
Cohesion: 0.38
Nodes (3): assertPortFree(), probePort(), local

### Community 79 - "AGENTS.md — LeaveTrack"
Cohesion: 0.20
Nodes (10): AGENTS.md — LeaveTrack, Frontend standards, Git conventions, Project, Quality gates (must pass before merge), Security rules, Stack, Task tracking (+2 more)

### Community 80 - "ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port, Consequences, Context, Decision, Options considered

### Community 81 - "ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR, Consequences, Context, Decision

### Community 82 - "ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions, Consequences, Context, Decision

### Community 83 - "independence.test.ts"
Cohesion: 0.07
Nodes (26): DecideLeaveRequestResult, DecideWarning, DecideDeps, RequestIdSchema, memoryDecideStore, BalanceContext, DecideInput, DecideOutcome (+18 more)

### Community 84 - "set-task-status.test.ts"
Cohesion: 0.29
Nodes (3): dir, root, script

### Community 85 - "next"
Cohesion: 0.05
Nodes (71): Backend standards, GET, ParamsSchema, QuerySchema, dynamic, GET, authorized(), GET (+63 more)

### Community 87 - "ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering"
Cohesion: 0.29
Nodes (6): ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering, Consequences, Context, Decision, Options considered, Policy changes vs catch-up

### Community 88 - "instrumentation.ts"
Cohesion: 0.38
Nodes (3): register(), assertEnvOrExit(), register()

### Community 89 - "decide.test.ts"
Cohesion: 0.09
Nodes (25): RequestStatus, SqlClient, SqlRow, toIso(), toNumber(), createPostgresDecideStore(), createPostgresSubmitStore(), DecidedRow (+17 more)

### Community 90 - "env.ts"
Cohesion: 0.13
Nodes (18): notFound(), POST(), tokenMatches(), TypeScript, globalForSession, DEPLOYED_APP_ENVS, DEPLOYED_VERCEL_ENVS, EnvSchema (+10 more)

### Community 91 - "account-actions.test.ts"
Cohesion: 0.14
Nodes (13): LEGACY_SESSION_COOKIES, SESSION_COOKIE, sessionCookieOptions(), mockAuthProvider, NOT_LINKED_MESSAGE, WritableJar, isProduction, state (+5 more)

### Community 92 - "balance-writers.test.ts"
Cohesion: 0.31
Nodes (8): appFiles, files(), MOCK_FIELD, normalise(), root, Table, writersOf(), writesTable()

### Community 93 - "EPIC 2 planning (2026-11-26)"
Cohesion: 0.33
Nodes (5): Coverage baseline (TASK-021, 2026-11-26), EPIC 2 planning (2026-11-26), Fixed in VALIDATE, Retro — Day 0 scaffold (2026-11-24), What went well

### Community 94 - "repo-hygiene.test.ts"
Cohesion: 0.67
Nodes (3): git(), ignored(), root

### Community 97 - "security-conventions.test.ts"
Cohesion: 0.50
Nodes (3): files(), root, UNSAFE_COMPARE

### Community 104 - "auth.spec.ts"
Cohesion: 0.16
Nodes (17): acceptInvite(), admin, anon, env, noSession, sql, assertTestEmail(), cleanupTestIdentities() (+9 more)

## Knowledge Gaps
- **600 isolated node(s):** `@commitlint/config-conventional`, `uvx`, `nexus-mcp`, `semi`, `singleQuote` (+595 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 720 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `package.json`, `approval-queue.tsx`, `memory-parity.test.ts`, `db/helpers.ts`, `repository.ts`, `types.ts`, `session-token.ts`, `roles.ts`, `action-errors.test.ts`, `invite-user.mjs`, `e2e-supabase-harness.test.ts`, `provider.ts`, `Coding Standards — LeaveTrack`, `ref_node_path`, `independence.test.ts`, `set-task-status.test.ts`, `next`, `instrumentation.ts`, `decide.test.ts`, `env.ts`, `account-actions.test.ts`, `balance-writers.test.ts`, `repo-hygiene.test.ts`, `coverage-summary.test.ts`, `security-conventions.test.ts`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `Button`, `react`, `login/actions.ts`, `mobile-nav.tsx`, `app/layout.tsx`, `provider.ts`, `package.json`, `roles.ts`, `session-token.ts`, `login-form.tsx`, `approval-queue.tsx`, `login/page.tsx`, `repositories.ts`, `env.ts`, `account-actions.test.ts`, `vitest`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `uvx`, `nexus-mcp` to the rest of the system?**
  _600 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Business Requirements Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `Revision v1.1 — EPIC 2 (2026-11-26)` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._