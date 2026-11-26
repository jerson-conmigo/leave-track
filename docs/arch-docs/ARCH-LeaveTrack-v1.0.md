# Architecture Document — LeaveTrack v1.0

Traces to: `docs/prd/PRD-LeaveTrack-v1.0.md`

## Stack

- **Frontend/Backend:** Next.js 16 (App Router), TypeScript.
- **Database:** Postgres via Supabase.
- **Auth (Day 0):** mock cookie session — see `ADR-LeaveTrack-E001`. Real provider wired in Day 1.
- **Deployment target:** Vercel (app), Supabase (managed Postgres).

Rationale: the team already runs Next.js + Supabase on other projects (fits nexus's Day 0 mock-auth-mock-data pattern directly); no NFR here demands anything heavier.

## Data Model

```
users            (id, name, email, role[employee|manager|hr_admin], manager_id nullable FK -> users.id)
leave_types      (id, name, tracks_balance boolean)          -- seeded: Vacation, Sick, Unpaid
leave_policies   (id, user_id FK, leave_type_id FK, accrual_per_month numeric)
leave_balances   (id, user_id FK, leave_type_id FK, balance numeric, updated_at)
leave_requests   (id, user_id FK, leave_type_id FK, start_date, end_date, reason,
                  status[pending|approved|rejected], decided_by FK -> users.id nullable,
                  decided_at nullable, is_deleted boolean default false, created_at)
audit_log        (id, leave_request_id FK, actor_id FK, action, occurred_at)
```

- `leave_requests.is_deleted` — **soft delete only**, per BR-04 (3-year retention). No hard-delete path exists anywhere in the codebase.
- `users.manager_id` is the sole source of truth for the scoped-visibility rule (US-04). A manager's queue query always filters `WHERE manager_id = :current_user_id`.

## API Design (selected)

| Method | Route                            | Auth          | Notes                                                          |
| ------ | -------------------------------- | ------------- | -------------------------------------------------------------- |
| POST   | /api/leave-requests              | Employee      | US-01. Validates date range server-side (AC2).                 |
| GET    | /api/leave-requests?scope=mine   | Employee      | US-02 balance context.                                         |
| GET    | /api/leave-requests?scope=team   | Manager       | US-04 — server-side filter on `manager_id`, never client-side. |
| POST   | /api/leave-requests/:id/decision | Manager       | US-03. 403 if requester is not a direct report (AC3).          |
| GET    | /api/audit/:userId               | HR Admin      | US-05. Reads soft-deleted-excluded, never hard-deleted, rows.  |
| POST   | /api/jobs/accrual                | System (cron) | US-07. Idempotent — see ADR-LeaveTrack-E002.                   |

Error format: `{ success: false, error: { code, message } }` on every non-2xx response, per AGENTS.md convention.

## Security

- Every manager-scoped endpoint enforces the `manager_id` filter in the query itself, not in application logic that could be bypassed — this is the direct implementation of PRD NFR "enforced server-side, never client-side only."
- Session cookie is httpOnly, 8h expiry (Day 0 mock auth pattern; unchanged shape when real auth replaces it in Day 1).

## Deployment Topology

- Single Next.js app on Vercel, single Supabase Postgres instance (pooled connection, not direct).
- Monthly accrual job (US-07) runs as a scheduled Vercel Cron hitting `/api/jobs/accrual`.

## Open Questions

- Should `leave_policies` support mid-year policy changes (e.g., a promotion changing accrual rate)? Flagged for Sprint 2 — not required for Q3 launch (BRD scope).

---

## Revision v1.1 — EPIC 2 (2026-11-26)

Traces to PRD Revision v1.1 (US-09 – US-24). The v1.0 sections above describe the EPIC 1
system as built and are kept as history. Status of the tables/APIs below: **planned** — each
lands with its task in `docs/dev-tasks/epic-2-hardening-and-resolution-tasks.csv`.

### Stack changes

- **Auth:** Supabase Auth replaces the Day 0 mock session (`ADR-LeaveTrack-E004`). Sessions are
  signed; the mock adapter remains for dev/test only and is refused in production.
- **No new frameworks.** Server components + server actions remain the data pattern; forms stay
  on react-hook-form + zod; charts are inline SVG; themes are cookie-driven `.dark` tokens.

### Data model additions (planned)

```
users                   + auth_user_id uuid unique (TASK-024, done), is_active boolean (TASK-043)
leave_requests          status + 'cancelled' (TASK-028)
audit_action            + 'cancelled' (TASK-028)
balance_ledger          (id, user_id, leave_type_id, delta, balance_after, source, source_key unique,
                         actor_id nullable, occurred_at)                         -- TASK-029, ADR-E006
balance_resolutions     (id, user_id, leave_type_id, status, deficit_at_proposal,
                         unpaid_days_proposed, recovery_days_proposed, recovery_start_period,
                         recovery_months, unpaid_days_applied, recovery_days_applied,
                         respond_by, response_reason, supersedes_id, proposal_number,
                         proposed_by, proposed_at, closed_at)                    -- TASK-031
balance_recoveries      (id, resolution_id, period, amount, applied_at, unique(resolution_id, period))
balance_resolution_events (id, resolution_id, action, actor_id nullable, balance_before,
                         balance_after, details jsonb, reason, occurred_at)       -- append-only
app_settings            (key, value jsonb, updated_by, updated_at)               -- audited
notifications           (id, recipient_id, type, payload jsonb, read_at, created_at)   -- TASK-030
notification_outbox     (id, idempotency_key unique, channel, payload, status, attempts,
                         next_attempt_at, sent_at)                               -- ADR-E007
leave_policy_versions   (id, user_id, leave_type_id, accrual_per_month, effective_from) -- TASK-039
rate_limits             (key, window_start, count)                               -- TASK-041
pending_email_changes   (id, user_id, new_email, status, decided_by, decided_at) -- TASK-045
```

Invariants carried forward: tracked-type triggers (TASK-018) also guard `balance_ledger`,
`balance_resolutions` and `balance_recoveries`; event/ledger tables reject UPDATE/DELETE;
one open resolution per (user, leave type) via a unique partial index; self-approval rejected
by a trigger (TASK-026).

### API additions (planned)

| Method   | Route                                    | Auth          | Notes                                              |
| -------- | ---------------------------------------- | ------------- | -------------------------------------------------- |
| GET/POST | /api/resolutions                         | HR Admin      | US-09. Queue by status; propose.                   |
| POST     | /api/resolutions/:id/withdraw · finalize | HR Admin      | US-09/US-10 (R-06).                                |
| GET      | /api/me/resolutions                      | Employee      | US-10.                                             |
| POST     | /api/resolutions/:id/response            | Employee      | US-10. accept, or decline + reason.                |
| GET/POST | /api/jobs/resolution-expiry              | System (cron) | US-11. Bearer `CRON_SECRET`, idempotent.           |
| GET/POST | /api/jobs/notifications                  | System (cron) | US-17. Outbox dispatcher + nudges.                 |
| POST     | /api/leave-requests/:id/cancel           | Employee      | US-16.                                             |
| GET      | /api/notifications                       | Any           | US-17. Own notifications only.                     |
| GET      | /api/exports/:report                     | HR Admin      | US-23. Streamed CSV, formula-escaped, audited.     |
| \*       | /api/admin/users · policies · settings   | HR Admin      | US-18, US-19. Every change audited.                |

All routes keep the error envelope, `withErrorHandler`, zod validation and `toAppError`
mappings for every new named constraint. Server actions mirror the routes.

### Security changes

- Signed, httpOnly, `SameSite=Lax`, `Secure` sessions; idle timeout (default 30 min) plus 8 h
  absolute; new session on every sign-in (TASK-023 – TASK-025).
- MFA (TOTP) mandatory for HR Admins (TASK-046).
- `safeRedirectPath` compares parsed origins and rejects control characters (TASK-020).
- Production fails closed without `DATABASE_URL`, auth secrets or `CRON_SECRET` (TASK-019).
- Nonce-based CSP; rate limits stored in Postgres for sign-in, submit and decisions (TASK-041).
- RLS policies plus a CI smoke run on real Supabase (TASK-042).

### Deployment changes

- Additional Vercel Cron jobs: resolution expiry (daily) and notifications/nudges. Responses
  after the deadline are refused at read time, so a daily job can be up to a day late without
  changing outcomes. An hourly schedule needs the Vercel Pro plan.

### EPIC 2 decisions (adopted 2026-11-26)

| #   | Decision                                                                                     |
| --- | -------------------------------------------------------------------------------------------- |
| D1  | Supabase Auth is the identity provider (ADR-E004).                                           |
| D2  | An HR Admin's own leave is approved by another HR Admin; with no other HR Admin, submission is refused. |
| D3  | The leave year is the calendar year.                                                         |
| D4  | Monthly recovery deduction may not exceed the current accrual rate.                         |
| D5  | Unpaid conversion is recorded in days only (no dated Unpaid records).                        |
| D6  | After a decline HR may re-propose once; after a second decline HR makes a binding final decision with a reason. |
| D7  | Resolution expiry runs daily; the deadline is also enforced on every read/response.         |
| D8  | Response deadline configurable 1–14 days (default 3), fixed on each proposal.               |
| D9  | **Open:** calendar vs business days (needs a holidays source). TASK-038 is Blocked on it.   |
| D10 | Maximum request length 90 days; past start dates only for Sick, at most 30 days back.       |
| D11 | Employees may cancel approved leave before its start date; the manager is notified.         |
| D12 | In-app notifications first; email through a provider REST API (Resend), no SDK.             |
| D13 | "Admin" means HR Admin; no new role.                                                        |
| D14 | MFA mandatory for HR Admins, optional for others; emailed one-time code optional.           |
| D15 | Keep the in-memory store for now; replacing it with PGlite in dev/e2e needs its own ADR.     |
| D16 | Rate limits are stored in a Postgres table (no new service).                                |
| D17 | Charts are inline SVG (no chart library).                                                   |
| D18 | A negative balance never blocks new requests (warn, don't block).                           |

### Considered and not adopted

- **TanStack React Query + Devtools:** reads happen in server components and writes through
  server actions; a client cache would duplicate server state. Revisit only if analytics or
  search needs live client-side refetching.
- **Application Docker image:** no benefit on Vercel. Local Supabase (`supabase start`) already
  uses Docker; TASK-053 documents it.
- **React Hook Form + Zod:** already in place since EPIC 1; new forms reuse it.

### Open Questions (updated)

- D9 (calendar vs business days) — blocks TASK-038.
- The v1.0 question on mid-year policy changes is answered by `leave_policy_versions` (TASK-039).
