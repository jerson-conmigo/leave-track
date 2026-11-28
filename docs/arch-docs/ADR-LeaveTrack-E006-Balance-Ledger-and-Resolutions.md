# ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions

**Status:** Proposed (EPIC 2 plan, 2026-11-26) — needs architect sign-off.
**Tasks:** TASK-029, TASK-031 – TASK-036 · **Stories:** US-09 – US-12 · **BR-08**, BR-06, BR-07

## Context

Managers may approve over-balance requests (US-01 AC3), so tracked balances can go negative.
US-01 promised an "HR override", but no workflow exists (backlog B19). HR needs to propose a
resolution — convert the excess to Unpaid, recover it from future accruals, or both — and the
employee must accept or decline within a deadline, after which the excess converts to Unpaid.
Balances today are mutated in place by the decide and accrual stores, with no per-change history.

## Decision

1. **Balance ledger (TASK-029).** Every balance change writes an append-only `balance_ledger`
   row (delta, balance after, source, unique `source_key`) in the same transaction as the
   change. Sources: approval, cancellation, accrual, recovery, conversion. The writer registry
   test is extended to the ledger. The ledger feeds resolutions, the audit report and analytics.
2. **Resolutions are rows with a guarded state machine (TASK-031).**
   `proposed → accepted | declined | expired | withdrawn`; `declined → superseded (re-proposal)
   | finalized`. Every transition is `UPDATE … WHERE status = <expected> [AND respond_by > now()]
   RETURNING`, so concurrent actions have exactly one winner. One open resolution per
   (user, leave type) is enforced by a unique partial index.
3. **Amounts.** `unpaid_days + recovery_days = deficit at proposal` (CHECK). When applied,
   amounts are **clamped** to the current deficit and both proposed and applied amounts are
   stored. Conversion credits the tracked balance and records the days on the resolution — no
   Unpaid balance is ever created (the TASK-018 trigger still forbids one).
4. **Recovery.** On acceptance the recovered amount is credited now and a schedule is written
   to `balance_recoveries` (unique per resolution and period). The accrual job applies each
   period's deduction inside the same transaction that claims the month in `accrual_runs`, so
   catch-up applies each missed period exactly once. The monthly amount may not exceed the
   accrual rate (D4); the leave year is the calendar year (D3).
5. **Deadline.** `respond_by = proposed_at + app_settings.resolution_response_days` (default 3,
   range 1–14), fixed per proposal. A daily job converts expired proposals (`FOR UPDATE SKIP
   LOCKED`, idempotent); responses after `respond_by` are refused even before the job runs (D7).
6. **Decline process (D6).** A decline needs a reason and returns to HR; HR may re-propose once
   (a new row that supersedes the old); after a second decline HR records a binding final
   decision with a reason. A daily reminder goes to HR for declined items awaiting action.
7. **Audit.** `balance_resolution_events` (append-only; actor null = system) records balance
   before/after, proposal and applied amounts, response, reason and timestamps. A separate table
   is used because `audit_log` requires a leave request and a non-null actor; the HR audit
   report unions both.

## Consequences

- Positive: consent-based, auditable resolutions; no double deductions by construction; the
  ledger gives every balance a traceable history.
- Negative: every balance writer must also write the ledger (registry test enforces it); the
  accrual transaction grows; both stores (memory and Postgres) must implement it with parity tests.
- Risk: highest data-integrity risk in EPIC 2 — concurrency tests (accept vs expiry, accept vs
  accept, accrual vs apply) and break-and-restore probes are mandatory.

## Implementation note (TASK-029)

§1 is built: `balance_ledger` (append-only by trigger; unique `source_key`; tracked types only via
the TASK-018 guard) is written in the same statement as every balance change — approvals and
accrual today. Existing balances got one `opening` row each (migration backfill, seed, and the
mock store), so per (user, type) the ledger sums to the balance from the start. This ADR's status
is unchanged (Proposed) pending architect-of-record sign-off.

Cancellation (TASK-028) is the third writer: cancelling approved leave reverses that approval's
ledger delta (`cancellation:<request>`), in the same statement as the balance credit.

TASK-031 built the resolution schema (§2–§7 tables, constraints, one-open index, append-only events,
`app_settings`); the state machine, deadline, recovery and conversion logic follow in TASK-032–036.

TASK-032 built proposing (§3): HR-only `POST /api/resolutions` and the `/resolutions` queues; the monthly
recovery is recovery ÷ months (2 decimals, ≤ the accrual rate), starting next month at the earliest.

TASK-033 built responses (§2/§3/§4/§6): accept/decline with the deadline enforced in SQL, clamping (recovery
reduced first) with proposed and applied amounts stored, the recovery schedule (last month takes the remainder),
one re-proposal and HR's binding final decision.

TASK-034 built the expiry (§5): a daily job claims due proposals with `FOR UPDATE SKIP LOCKED`, converts the
clamped deficit entirely to Unpaid (recovery needs consent), closes them as expired and notifies the employee and
HR; cron auth is shared with accrual (lib/jobs/cron-auth.ts).
