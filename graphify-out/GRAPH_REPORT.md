# Graph Report - leave-track  (2026-11-28)

## Corpus Check
- 372 files · ~183,132 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 6, .csv 2, .example 1)

## Summary
- 2179 nodes · 6398 edges · 120 communities (103 shown, 17 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 149 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bae9353c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Business Requirements Document — LeaveTrack v1.0
- session-renewal.test.ts
- ADR-LeaveTrack-E001 — Auth & Session Strategy
- Product Requirements Document — LeaveTrack v1.0
- package.json
- Architecture Document — LeaveTrack v1.0
- compilerOptions
- devDependencies
- dependencies
- scripts
- components.json
- approval-routing.test.ts
- Step 3: Review
- /epav
- Steps
- Review Checklist
- Review Checklist
- Review Checklist
- Review Checklist
- e2e/helpers.ts
- Review Checklist
- Review Checklist
- Review Checklist
- Review Checklist
- Steps
- contract.test.ts
- Steps
- Steps
- respond.test.ts
- .prettierrc.json
- pr-verifier.md
- Steps
- Steps
- nexus
- extends
- postcss.config.mjs
- postgres-repository.ts
- react
- accrual/route.ts
- logger.ts
- decide.test.ts
- next
- resolutions/memory-store.ts
- theme.ts
- cn
- local-only.mjs
- Prove the test can fail (from TASK-010)
- LeaveTrack UI — Design System
- provider.ts
- balance-ledger.test.ts
- Database
- implement-api-route.md
- implement-ui-component.md
- write-migration.md
- notifications/types.ts
- vitest
- openapi.test.ts
- lib/format.ts
- request-form.tsx
- Button
- Steps
- roles.ts
- mobile-nav.tsx
- auth.spec.ts
- resolution-card.tsx
- vercel.json
- Revision v1.1 — EPIC 2 (2026-11-26)
- tokens.test.ts
- adapter.ts
- env.ts
- propose-dialog.tsx
- cancel.test.ts
- withErrorHandler
- ref_node_path
- Steps
- data/types.ts
- ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR
- ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions
- openapi.ts
- resolutions/types.ts
- read.ts
- store.test.ts
- validation.ts
- /dev-tasks-planner
- ref_node_child_process
- dev-accounts.ts
- balance-writers.test.ts
- resolutions/postgres-store.ts
- schemas.ts
- next.config.ts
- sign-in-throttle.test.ts
- login/actions.ts
- repositories.ts
- reset/route.ts
- api/errors.ts
- local-scripts.test.ts
- invite-user.mjs
- instrumentation.ts
- Coding Standards — LeaveTrack
- app-shell.tsx
- sidebar-nav.tsx
- Retro — Day 0 scaffold (2026-11-24)
- ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox
- ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port
- CLAUDE.md
- /scaffold
- decimal.ts
- ResolutionStore
- login-redirect.test.ts
- recoverySchedule
- independence.test.ts
- action-errors.test.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 116 edges
2. `vitest` - 83 edges
3. `next` - 70 edges
4. `AppError` - 60 edges
5. `Button()` - 50 edges
6. `getSession` - 40 edges
7. `lucide-react` - 40 edges
8. `formatDays()` - 38 edges
9. `createTestDb()` - 37 edges
10. `ok()` - 34 edges

## Surprising Connections (you probably didn't know these)
- `Measure layout only after it settles (from TASK-055)` --references--> `FormControl()`  [INFERRED]
  knowledge/patterns/implement-and-test.md → components/ui/form.tsx
- `API route handlers` --references--> `withErrorHandler()`  [INFERRED]
  knowledge/rules/coding-standards.md → lib/api/with-error-handler.ts
- `Security changes` --references--> `safeRedirectPath()`  [INFERRED]
  docs/arch-docs/ARCH-LeaveTrack-v1.0.md → lib/auth/roles.ts
- `Day 1 hand-off notes` --references--> `LeaveRepository`  [INFERRED]
  README.md → lib/data/repositories.ts
- `Where data goes` --references--> `getSql()`  [INFERRED]
  README.md → lib/db/postgres.ts

## Import Cycles
- None detected.

## Communities (120 total, 17 thin omitted)

### Community 0 - "Business Requirements Document — LeaveTrack v1.0"
Cohesion: 0.09
Nodes (21): Additional Functional Requirements, Additional Risks, Additional Stakeholder Concerns, Additional Success Criteria, Assumptions, Business Context, Business Requirements Document — LeaveTrack v1.0, Constraints (+13 more)

### Community 1 - "session-renewal.test.ts"
Cohesion: 0.10
Nodes (27): SESSION_COOKIE, getSessionSecret(), globalForSession, isClaims(), MAX_TOKEN_LENGTH, newSessionId(), renewClaims(), SessionClaims (+19 more)

### Community 2 - "ADR-LeaveTrack-E001 — Auth & Session Strategy"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E001 — Auth & Session Strategy, Consequences, Context, Decision, Options Considered

### Community 3 - "Product Requirements Document — LeaveTrack v1.0"
Cohesion: 0.17
Nodes (11): Business Rules (EPIC 2), Non-Functional Requirements, Non-Functional Requirements (additions), Out of Scope, Out of Scope (additions), Product Requirements Document — LeaveTrack v1.0, Revision v1.1 — EPIC 2 (2026-11-26), User Roles (+3 more)

### Community 4 - "package.json"
Cohesion: 0.06
Nodes (32): description, engines, node, @commitlint/config-conventional, name, private, version, @axe-core/playwright (+24 more)

### Community 5 - "Architecture Document — LeaveTrack v1.0"
Cohesion: 0.10
Nodes (19): Adr-Leavetrack-E001 — Auth & Session Strategy, ADR-LeaveTrack-E001 — Auth & Session Strategy, Api Design (Selected), API Design (selected), Architecture Document — LeaveTrack v1.0, Architecture Summary, Consequences, Context (+11 more)

### Community 6 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 7 - "devDependencies"
Cohesion: 0.09
Nodes (23): devDependencies, @axe-core/playwright, @commitlint/cli, @commitlint/config-conventional, @electric-sql/pglite, eslint, eslint-config-next, husky (+15 more)

### Community 8 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, class-variance-authority, clsx, geist, @hookform/resolvers, lucide-react, next, pino (+13 more)

### Community 9 - "scripts"
Cohesion: 0.07
Nodes (28): scripts, build, db:check:local, db:migrate:local, db:push:hosted, db:reset, db:reset:local, db:seed:auth (+20 more)

### Community 10 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 11 - "approval-routing.test.ts"
Cohesion: 0.07
Nodes (29): Implementation note (TASK-030), Time-shift probe: find tests that depend on today's date (from TASK-027), atomically(), LeaveRequest, Approver, approverLabel(), canDecide(), hasApprover() (+21 more)

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

### Community 19 - "e2e/helpers.ts"
Cohesion: 0.12
Nodes (28): OPERATIONS, create(), daysFromToday(), enlargeText(), expectNoHorizontalOverflow(), expectNotUnderHeader(), expectSelectsNotClipped(), expectTapTargets() (+20 more)

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

### Community 25 - "contract.test.ts"
Cohesion: 0.12
Nodes (17): AccrualResultSchema, EmployeeAuditHistorySchema, ErrorEnvelopeSchema, MarkReadResultSchema, ProposeResolutionResultSchema, ResolutionExpiryResultSchema, SubmitLeaveRequestResultSchema, successEnvelope() (+9 more)

### Community 26 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Orient with your knowledge graph (if one exists), 2 — Load context in priority order, 3 — Output this summary, nothing else, 4 — Stop, Arguments, /evaluate, Steps

### Community 27 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Blast radius check, 2 — Write the implementation blueprint, 3 — State constraints, 4 — Stop and wait, /plan, Prerequisite, Steps

### Community 28 - "respond.test.ts"
Cohesion: 0.07
Nodes (30): resetMockDb(), memoryResolutionStore, earliestRecoveryStart(), memory(), memoryBackend(), memory(), memory(), memoryHarness() (+22 more)

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

### Community 36 - "postgres-repository.ts"
Cohesion: 0.08
Nodes (28): B30 — PGlite lifecycle and CI memory (2026-11-26), UserRow, AUDIT_LOG_LIMIT, SqlClient, SqlRow, DEC, run(), track (+20 more)

### Community 37 - "react"
Cohesion: 0.14
Nodes (37): SetPasswordState, forgotPasswordAction(), LoginState, HIGHLIGHTS, LoginPage(), metadata, NOTICES, signedOutNotice() (+29 more)

### Community 38 - "accrual/route.ts"
Cohesion: 0.08
Nodes (25): dynamic, GET, GET, handler(), POST, GET, POST, getAccrualDeps() (+17 more)

### Community 39 - "logger.ts"
Cohesion: 0.26
Nodes (17): resolutionTransitionAction(), Transition, Session, Logger, runResolutionExpiry(), finalizeResolution(), reproposeResolution(), failureToError() (+9 more)

### Community 40 - "decide.test.ts"
Cohesion: 0.21
Nodes (10): ANA, audit(), balance(), BEN, CARLA, MAYA, R, requestRow() (+2 more)

### Community 41 - "next"
Cohesion: 0.19
Nodes (22): GET, handler, POST, POST, GET, NO_STORE, POST, POST (+14 more)

### Community 42 - "resolutions/memory-store.ts"
Cohesion: 0.43
Nodes (4): writeResolutionProposedMemory(), assertNoOpen(), event(), insertProposal()

### Community 43 - "theme.ts"
Cohesion: 0.23
Nodes (12): metadata, RootLayout(), viewport, Toaster(), htmlClassFor(), parseTheme(), THEME_COOKIE, THEME_COOKIE_MAX_AGE (+4 more)

### Community 44 - "cn"
Cohesion: 0.10
Nodes (35): setThemeAction(), AppShell(), THEME_LABEL, UserMenu(), UserMenuProps, STATUS_META, Avatar(), AvatarBadge() (+27 more)

### Community 45 - "local-only.mjs"
Cohesion: 0.14
Nodes (25): listAllAuthUsers(), LOCAL_DEV_PASSWORD, main(), planSeed(), pushArgs(), assertLocal(), exitWith(), isLocalUrl() (+17 more)

### Community 46 - "Prove the test can fail (from TASK-010)"
Cohesion: 0.08
Nodes (24): "Authorize before any database access" — prove it with a repository spy (from TASK-015), Browser e2e recipe (from TASK-016), Changing tooling versions: diff the resolved config, measure before thresholding (from TASK-021), Cross-cutting invariants: matrix + writer registry (from TASK-018), Defense in depth for "exactly once" writes (from TASK-014), Fail-closed configuration: test build time and runtime separately (from TASK-019), Headless browser tests with Radix overlays, Local dev tooling: local-only by construction, hosted only by explicit flag (from TASK-054) (+16 more)

### Community 48 - "LeaveTrack UI — Design System"
Cohesion: 0.13
Nodes (14): Backlog, Color tokens, Components, Core, Dark theme (TASK-047), Iconography, Leave types, LeaveTrack UI — Design System (+6 more)

### Community 50 - "provider.ts"
Cohesion: 0.11
Nodes (18): LEGACY_SESSION_COOKIES, sessionCookieOptions(), EmailLinkType, mockAuthProvider, NO_PROVIDER_SESSION, ProviderResult, renewSessionToken(), sessionTokens (+10 more)

### Community 52 - "balance-ledger.test.ts"
Cohesion: 0.15
Nodes (13): currentPeriod(), monthsToAccrue(), nextPeriod(), AccrualOutcome, AccrualStore, AccruedPeriod, Backend, BEN (+5 more)

### Community 53 - "Database"
Cohesion: 0.08
Nodes (24): Accrual job (TASK-017), API documentation (TASK-057), Approvals (TASK-026), Balance history (TASK-029), Database, Day 1 hand-off notes, Environment, HR audit (TASK-015) (+16 more)

### Community 57 - "notifications/types.ts"
Cohesion: 0.13
Nodes (21): append(), writeRequestCancelledMemory(), writeRequestDecidedMemory(), writeRequestSubmittedMemory(), writeResolutionResponseMemory(), cancelledKey(), decidedKey(), Notification (+13 more)

### Community 58 - "vitest"
Cohesion: 0.04
Nodes (65): memoryAccrualStore, accrualRuns, auditLog, BALANCE_ROWS, LAST_ACCRUAL_AT, LEAVE_TYPE_IDS, leaveBalances, leavePolicies (+57 more)

### Community 59 - "openapi.test.ts"
Cohesion: 0.10
Nodes (19): LeaveRequestViewSchema, SessionTiming, AccrualResult, CancelLeaveRequestResult, DecideLeaveRequestResult, MyLeaveContext, SubmitLeaveRequestResult, TeamQueue (+11 more)

### Community 60 - "lib/format.ts"
Cohesion: 0.17
Nodes (36): ApprovalQueue(), ApprovalQueueProps, BalanceHint(), ActionBadge(), AuditTable(), EmptyState(), EmptyStateProps, LeaveTypeBadge() (+28 more)

### Community 61 - "request-form.tsx"
Cohesion: 0.14
Nodes (21): EMPTY, localToday(), RequestForm(), RequestFormProps, shiftLocalDate(), AlertTitle(), FormControl(), FormDescription() (+13 more)

### Community 62 - "Button"
Cohesion: 0.20
Nodes (16): AppError(), ForbiddenPage(), metadata, NotFound(), NotificationBell(), StatusScreen(), StatusScreenProps, NotificationList() (+8 more)

### Community 63 - "Steps"
Cohesion: 0.25
Nodes (7): 1 — Inspect changes, 2 — Stage deliberately, 3 — Write the commit message, 4 — Confirm, /commit, Steps, When to use

### Community 64 - "roles.ts"
Cohesion: 0.12
Nodes (23): Security rules, proxyCookieIO(), canAccess(), isPublicPath(), isRole(), matches(), MAX_REDIRECT_LENGTH, NEVER_REDIRECT_TO (+15 more)

### Community 65 - "mobile-nav.tsx"
Cohesion: 0.27
Nodes (12): MobileNav(), Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetPortal() (+4 more)

### Community 66 - "auth.spec.ts"
Cohesion: 0.11
Nodes (25): acceptInvite(), admin, anon, DEV_NOTICE_TEXT, env, noSession, sql, assertTestEmail() (+17 more)

### Community 67 - "resolution-card.tsx"
Cohesion: 0.16
Nodes (34): CancelRequestButton(), AcceptButton(), appliedText(), proposalText(), ResolutionCard(), ACTIVITY_EVENTS, IdleSessionGuard(), IdleSessionGuardProps (+26 more)

### Community 69 - "Revision v1.1 — EPIC 2 (2026-11-26)"
Cohesion: 0.12
Nodes (15): API Design (selected), Architecture Document — LeaveTrack v1.0, Considered and not adopted, Data Model, Data model additions (planned), Deployment changes, Deployment Topology, EPIC 2 decisions (adopted 2026-11-26) (+7 more)

### Community 70 - "tokens.test.ts"
Cohesion: 0.25
Nodes (7): contrast(), css, dark, light, luminance(), PAIRS, systemDark

### Community 71 - "adapter.ts"
Cohesion: 0.12
Nodes (11): CookieIO, CookieToSet, AuthProvider, noCookies, supabaseAccount, clearProviderCookies(), createSupabaseServerClient(), PROVIDER_COOKIE_PREFIX (+3 more)

### Community 72 - "env.ts"
Cohesion: 0.10
Nodes (21): SESSION_MAX_AGE_SECONDS, HEARTBEAT_INTERVAL_SECONDS, HEARTBEAT_PATH, TOUCH_INTERVAL_SECONDS, WARNING_SECONDS, DEPLOYED_APP_ENVS, DEPLOYED_VERCEL_ENVS, EnvSchema (+13 more)

### Community 74 - "propose-dialog.tsx"
Cohesion: 0.16
Nodes (25): DecisionDialog(), confirm(), handleOpenChange(), DecisionDialogProps, COPY, ProposeDialog(), confirm(), ProposeDialogProps (+17 more)

### Community 75 - "cancel.test.ts"
Cohesion: 0.08
Nodes (40): todayUtc(), DecideWarning, LeaveTypeName, toRequestView(), countDays(), CancelDeps, cancelLeaveRequest(), RequestIdSchema (+32 more)

### Community 76 - "withErrorHandler"
Cohesion: 0.17
Nodes (13): decideLeaveRequestAction(), cancelLeaveRequestAction(), API additions (planned), Example — TASK-014 (approve/reject), withErrorHandler(), BY_CONSTRAINT, BY_SQLSTATE, DbError (+5 more)

### Community 77 - "ref_node_path"
Cohesion: 0.08
Nodes (14): RFC-4180, METRICS, rows, matches, previous, STATUSES, [taskId, status, csvArg], temp (+6 more)

### Community 79 - "Steps"
Cohesion: 0.22
Nodes (8): 0 — Run code review first, 1 — Gather context, 2 — Draft the PR, 3 — Push and open the PR, 4 — Output, /create-pr, Steps, When to use

### Community 80 - "data/types.ts"
Cohesion: 0.06
Nodes (33): Database, availableForRequest(), buildBalanceSummaries(), PendingRange, daysBefore(), utcDay(), utcMonthBounds(), withinUtcDays() (+25 more)

### Community 81 - "ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR, Consequences, Context, Decision, Implementation note (TASK-026)

### Community 82 - "ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions, Consequences, Context, Decision, Implementation note (TASK-029)

### Community 83 - "openapi.ts"
Cohesion: 0.18
Nodes (16): buildOpenApiDocument(), ComponentName, COMPONENTS, COOKIE, errors(), input(), JsonSchema, parameters() (+8 more)

### Community 84 - "resolutions/types.ts"
Cohesion: 0.15
Nodes (16): toIso(), toLeaveRequest(), MockRecovery, MockResolution, MockResolutionEvent, monthlyDeduction(), OPEN_RESOLUTION_STATUSES, ResolutionGroup (+8 more)

### Community 85 - "read.ts"
Cohesion: 0.28
Nodes (10): POST, markNotificationsReadAction(), proposeResolutionAction(), isAppError(), getMarkReadDeps(), createPostgresNotificationReadStore(), markNotificationsRead(), MarkReadDeps (+2 more)

### Community 87 - "store.test.ts"
Cohesion: 0.26
Nodes (11): getRateLimitStore(), createMemoryRateLimitStore(), globalForRateLimit, memoryRateLimitStore, createPostgresRateLimitStore(), BUCKET_SECONDS, bucketStart(), RateLimitStore (+3 more)

### Community 88 - "validation.ts"
Cohesion: 0.17
Nodes (10): days, DeclineResolutionSchema, FinalizeResolutionInput, FinalizeResolutionSchema, ProposeResolutionInput, ProposeResolutionSchema, ReproposeResolutionInput, ReproposeResolutionSchema (+2 more)

### Community 89 - "/dev-tasks-planner"
Cohesion: 0.12
Nodes (17): APPLY — Generate the CSV(s) programmatically, Arguments, /dev-tasks-planner, EVALUATE — Read the source material and the real repo state, Every `Blocked` row cites the exact reason and states the fallback, Every `Done` row states its own Day-1 forward path, Every task cites the project's own established patterns by name, not generic prose, File structure and exact schema (+9 more)

### Community 90 - "ref_node_child_process"
Cohesion: 0.13
Nodes (9): assertPortFree(), probePort(), local, git(), ignored(), root, dir, root (+1 more)

### Community 91 - "dev-accounts.ts"
Cohesion: 0.25
Nodes (9): DEV_LOGIN_HOSTS, DevAccount, devLoginAccountsEnabled(), isDevLoginHost(), LOCAL_DEV_PASSWORD, RawEnv, ROLE_ORDER, ON (+1 more)

### Community 92 - "balance-writers.test.ts"
Cohesion: 0.31
Nodes (8): appFiles, files(), MOCK_FIELD, normalise(), root, Table, writersOf(), writesTable()

### Community 93 - "resolutions/postgres-store.ts"
Cohesion: 0.14
Nodes (16): writeResolutionProposed(), applyAmounts(), Context, event(), insertProposal(), lockContext(), Locked, cents() (+8 more)

### Community 94 - "schemas.ts"
Cohesion: 0.13
Nodes (14): AuditEventSchema, AuditRequestRecordSchema, BalanceSummarySchema, CancelLeaveRequestResultSchema, DecideLeaveRequestResultSchema, DecideWarningSchema, epochSeconds, ErrorCodeSchema (+6 more)

### Community 95 - "next.config.ts"
Cohesion: 0.50
Nodes (3): csp, nextConfig, securityHeaders

### Community 96 - "sign-in-throttle.test.ts"
Cohesion: 0.17
Nodes (15): clientIp(), digest(), isSignInThrottled(), MAX_FAILURES_PER_EMAIL, MAX_FAILURES_PER_IP, recordSignInFailure(), SIGN_IN_WINDOW_SECONDS, signInKeys (+7 more)

### Community 97 - "login/actions.ts"
Cohesion: 0.14
Nodes (24): ConfirmQuery, GET, setPasswordAction(), dynamic, metadata, SetPasswordPage(), ForgotPasswordState, endSessionAction() (+16 more)

### Community 98 - "repositories.ts"
Cohesion: 0.05
Nodes (65): AGENTS.md — LeaveTrack, Frontend standards, Git conventions, Project, Quality gates (must pass before merge), Stack, Task tracking, Where things go (+57 more)

### Community 99 - "reset/route.ts"
Cohesion: 0.22
Nodes (9): notFound(), POST(), tokenMatches(), ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering, Consequences, Context, Decision, Options considered (+1 more)

### Community 100 - "api/errors.ts"
Cohesion: 0.14
Nodes (16): ASSETS, dynamic, GET, dynamic, GET, dynamic, GET, ERROR_STATUS (+8 more)

### Community 102 - "local-scripts.test.ts"
Cohesion: 0.22
Nodes (8): LOCAL_HOSTS, run(), SECRET_VALUES, stub, stub, LOCAL_STATUS, makeStub(), root

### Community 103 - "invite-user.mjs"
Cohesion: 0.24
Nodes (8): postgres, @supabase/supabase-js, Email, inviteUser(), main(), MESSAGES, hostOf(), USER

### Community 104 - "instrumentation.ts"
Cohesion: 0.38
Nodes (3): register(), assertEnvOrExit(), register()

### Community 105 - "Coding Standards — LeaveTrack"
Cohesion: 0.18
Nodes (10): API route handlers, Coding Standards — LeaveTrack, Dependencies, Hard-won rules (from Day 0 VALIDATE), Logging, Next.js 16, Testing, TypeScript (+2 more)

### Community 106 - "app-shell.tsx"
Cohesion: 0.27
Nodes (7): dynamic, ForgotPasswordPage(), metadata, AppShellProps, Brand(), ROLE_ACCENT, Theme

### Community 107 - "sidebar-nav.tsx"
Cohesion: 0.36
Nodes (7): activeHref(), NAV_ITEMS, NavItem, navItemsFor(), GROUP_LABEL, SidebarNav(), SidebarNavProps

### Community 108 - "Retro — Day 0 scaffold (2026-11-24)"
Cohesion: 0.33
Nodes (5): Coverage baseline (TASK-021, 2026-11-26), EPIC 2 planning (2026-11-26), Fixed in VALIDATE, Retro — Day 0 scaffold (2026-11-24), What went well

### Community 109 - "ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox"
Cohesion: 0.29
Nodes (4): ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox, Consequences, Context, Decision

### Community 110 - "ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port, Consequences, Context, Decision, Options considered

### Community 112 - "/scaffold"
Cohesion: 0.25
Nodes (7): APPLY — Generate the Complete Boilerplate, Ecosystem reference, EVALUATE — Understand the Architecture and Design, PLAN — Boilerplate + UI Shell + Project Rules, Prerequisites, /scaffold, VALIDATE — Validate Infrastructure + Design Fidelity

### Community 113 - "decimal.ts"
Cohesion: 0.57
Nodes (5): addDays(), fromHundredths(), sumDays(), toHundredths(), applyAmounts()

### Community 116 - "recoverySchedule"
Cohesion: 0.73
Nodes (4): clampAmounts(), fromCents(), recoverySchedule(), toCents()

### Community 118 - "independence.test.ts"
Cohesion: 0.13
Nodes (32): Backend standards, createPostgresAccrualStore(), createPostgresRepository(), toNumber(), createPostgresCancelStore(), createPostgresDecideStore(), createPostgresSubmitStore(), DecidedRow (+24 more)

### Community 120 - "action-errors.test.ts"
Cohesion: 0.14
Nodes (11): getSession, input, service, appFiles, code(), files(), rel(), root (+3 more)

## Knowledge Gaps
- **761 isolated node(s):** `@commitlint/config-conventional`, `uvx`, `nexus-mcp`, `semi`, `singleQuote` (+756 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 935 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `session-renewal.test.ts`, `package.json`, `approval-routing.test.ts`, `contract.test.ts`, `respond.test.ts`, `postgres-repository.ts`, `accrual/route.ts`, `decide.test.ts`, `theme.ts`, `provider.ts`, `balance-ledger.test.ts`, `openapi.test.ts`, `lib/format.ts`, `roles.ts`, `auth.spec.ts`, `resolution-card.tsx`, `tokens.test.ts`, `adapter.ts`, `env.ts`, `cancel.test.ts`, `withErrorHandler`, `ref_node_path`, `data/types.ts`, `store.test.ts`, `ref_node_child_process`, `dev-accounts.ts`, `balance-writers.test.ts`, `sign-in-throttle.test.ts`, `api/errors.ts`, `local-scripts.test.ts`, `invite-user.mjs`, `instrumentation.ts`, `decimal.ts`, `login-redirect.test.ts`, `recoverySchedule`, `independence.test.ts`, `action-errors.test.ts`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `session-renewal.test.ts`, `package.json`, `contract.test.ts`, `react`, `accrual/route.ts`, `logger.ts`, `theme.ts`, `provider.ts`, `vitest`, `lib/format.ts`, `Button`, `roles.ts`, `withErrorHandler`, `read.ts`, `next.config.ts`, `login/actions.ts`, `repositories.ts`, `reset/route.ts`, `api/errors.ts`, `app-shell.tsx`, `sidebar-nav.tsx`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `mobile-nav.tsx`, `repositories.ts`, `resolution-card.tsx`, `react`, `Coding Standards — LeaveTrack`, `app-shell.tsx`, `sidebar-nav.tsx`, `propose-dialog.tsx`, `lib/format.ts`, `request-form.tsx`, `Button`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `uvx`, `nexus-mcp` to the rest of the system?**
  _761 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Business Requirements Document — LeaveTrack v1.0` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `session-renewal.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10253699788583509 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._