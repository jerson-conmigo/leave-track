-- ============================================================================
-- TASK-017 — audit trail for the monthly accrual job (see ADR-LeaveTrack-E002).
-- Each accrual_runs row (one per accrued month — the idempotency key) now records
-- who triggered it, what it changed, and the exact policy rates it applied, so
-- "why did my balance change?" stays answerable after a policy changes (catch-up
-- accrues missed months at the CURRENT rate — the `rates` snapshot makes that
-- visible). Existing rows (the seeded run) keep the defaults.
-- ============================================================================

alter table public.accrual_runs
  add column trigger text not null default 'manual'
    constraint accrual_runs_trigger_check check (trigger in ('cron', 'manual')),
  add column users_accrued int not null default 0
    constraint accrual_runs_users_check check (users_accrued >= 0),
  add column days_accrued numeric(8, 2) not null default 0
    constraint accrual_runs_days_check check (days_accrued >= 0),
  add column rates jsonb not null default '[]'::jsonb;
