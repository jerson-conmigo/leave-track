# ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering

**Status:** Proposed (TASK-017, 2026-11-26) — needs architect sign-off. Referenced by
ARCH-LeaveTrack-v1.0 (API table) and backlog B3.

## Context

US-07 / BR-06: balances accrue monthly from each user's `leave_policies`, with no HR
intervention. The BRD flags it as the highest-impact risk ("if accrual is wrong, every
balance is wrong"). The job runs as a Vercel Cron, whose documented behaviour shapes the
design:

- Invocations are **HTTP GET** with `Authorization: Bearer $CRON_SECRET`; POST is not possible.
- Delivery is **best effort and never retried** — a run can be missed entirely.
- The same scheduled run **can be invoked more than once**, and long runs can overlap.
- Schedules are UTC; cron runs only on production deployments.

## Options considered

1. **Per-balance `last_accrued_period` column.** Idempotent per row, but a run that dies
   halfway leaves some balances accrued and others not, and there is no single record of
   "this month was accrued".
2. **Distributed lock (e.g. Redis) around the job.** Prevents overlap but not a duplicate
   run *after* the first finished; adds infrastructure.
3. **Ledger + single transaction + catch-up** (chosen). `accrual_runs.period` (UTC month,
   UNIQUE, CHECKed to the first of the month) is the idempotency key.

## Decision

- **One transaction per invocation:** for each month still to accrue, insert its
  `accrual_runs` row (`on conflict (period) do nothing`), then add every tracked policy's
  `accrual_per_month` to its balance with one set-based upsert, then record the audit
  fields. Ledger row and balance effect commit together or not at all.
- **Duplicates / overlaps:** a second invocation claiming the same month blocks on the
  unique index until the first commits, then skips that month. No lock service needed.
- **Catch-up:** each run accrues every month missing since the latest ledger row, oldest
  first, up to the current UTC month. First-ever run: current month only. Gap > 12 months:
  refused with 409 and nothing written — needs a human. Never a future month.
- **Schedule:** daily at 02:00 UTC (`vercel.json`). The first successful run of a month
  accrues it; later runs are no-ops — cheap insurance against missed deliveries.
- **HTTP:** `GET` (Vercel Cron) and `POST` (manual/ops, the ARCH contract) share one
  handler. The audit `trigger` is derived from the **method** (GET → `cron`, POST →
  `manual`), never from headers, and never used for authorization. Auth (constant-time
  Bearer check) runs before any database access and fails closed if `CRON_SECRET` is unset.
- **Exactness:** all day arithmetic is `numeric` in SQL; the in-memory dev store uses
  integer hundredths (`lib/data/decimal.ts`).
- **Audit:** each ledger row records `trigger`, `users_accrued`, `days_accrued` and a
  `rates` snapshot (`{userId, leaveTypeId, accrualPerMonth}` actually applied).

## Policy changes vs catch-up

There is no policy history (effective-dated rates are an ARCH open question for Sprint 2,
backlog B24). Catch-up therefore applies the **current** rate to every missed month: if a
rate changed during the gap, earlier missed months use the new rate. This is visible —
each month's ledger row stores the `rates` it applied, and catch-up logs a warning naming
the periods. **Correction procedure:** compare the snapshot with the rate that was in
effect, and post a manual balance adjustment for the difference (until policy history
exists, adjustments are an HR/ops action outside this job).

## Consequences

- Positive: exactly-once accrual per month under duplicates, overlaps and retries;
  self-healing after missed runs; a queryable audit trail; no extra infrastructure.
- Negative: catch-up uses current rates (above); the 12-month guard needs manual action;
  true parallel locking is verified by unit/logic tests (PGlite serialises transactions)
  and must be confirmed on real Supabase (B12). Production triggering can only be proven
  on a Vercel production deployment; add alerting if no run exists for the current month
  by the 2nd (B23).
- Deviation from ARCH: GET is added because Vercel Cron cannot POST.
