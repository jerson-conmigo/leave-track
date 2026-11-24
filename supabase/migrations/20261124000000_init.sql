-- ============================================================================
-- LeaveTrack — initial schema
-- Source of truth: docs/arch-docs/ARCH-LeaveTrack-v1.0.md › Data Model
-- Additions beyond the arch doc (approved in /plan):
--   * accrual_runs — idempotency ledger for the monthly accrual job (US-07;
--     stands in for the missing ADR-LeaveTrack-E002).
--   * DELETE-blocking triggers on leave_requests / audit_log (BR-04: 3-year
--     retention, soft delete only — no hard-delete path anywhere).
--   * RLS enabled on every table with NO policies yet (deny-by-default for
--     anon/authenticated). Policies arrive with real auth on Day 1.
--   * leave_requests.decision_reason (TASK-010) — the manager's reason for the
--     current decision; REQUIRED when rejected (US-03 AC2), optional on approve,
--     NULL while pending.
-- ============================================================================


-- ── Enums ───────────────────────────────────────────────────────────────────
create type public.user_role as enum ('employee', 'manager', 'hr_admin');
create type public.request_status as enum ('pending', 'approved', 'rejected');
create type public.audit_action as enum ('submitted', 'approved', 'rejected');

-- ── users ───────────────────────────────────────────────────────────────────
create table public.users (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  email       text not null unique,
  role        public.user_role not null default 'employee',
  -- Sole source of truth for scoped visibility (US-04).
  manager_id  uuid references public.users (id) on delete restrict,
  created_at  timestamptz not null default now(),
  constraint users_not_own_manager check (manager_id is null or manager_id <> id)
);
create index users_manager_id_idx on public.users (manager_id);

-- ── leave_types ─────────────────────────────────────────────────────────────
create table public.leave_types (
  id              uuid primary key default gen_random_uuid(),
  name            text not null unique,
  tracks_balance  boolean not null default true
);

-- ── leave_policies ──────────────────────────────────────────────────────────
create table public.leave_policies (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users (id) on delete restrict,
  leave_type_id      uuid not null references public.leave_types (id) on delete restrict,
  accrual_per_month  numeric(5, 2) not null check (accrual_per_month >= 0),
  constraint leave_policies_user_type_key unique (user_id, leave_type_id)
);
create index leave_policies_leave_type_idx on public.leave_policies (leave_type_id);

-- ── leave_balances ──────────────────────────────────────────────────────────
create table public.leave_balances (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users (id) on delete restrict,
  leave_type_id  uuid not null references public.leave_types (id) on delete restrict,
  balance        numeric(6, 2) not null default 0,
  updated_at     timestamptz not null default now(),
  constraint leave_balances_user_type_key unique (user_id, leave_type_id)
);
create index leave_balances_leave_type_idx on public.leave_balances (leave_type_id);

-- ── leave_requests ──────────────────────────────────────────────────────────
create table public.leave_requests (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users (id) on delete restrict,
  leave_type_id  uuid not null references public.leave_types (id) on delete restrict,
  start_date     date not null,
  end_date       date not null,
  reason         text not null,
  status         public.request_status not null default 'pending',
  decided_by     uuid references public.users (id) on delete restrict,
  decided_at     timestamptz,
  decision_reason text,
  -- Soft delete only (BR-04). Every read path filters is_deleted = false.
  is_deleted     boolean not null default false,
  created_at     timestamptz not null default now(),
  constraint leave_requests_date_range check (end_date >= start_date),
  constraint leave_requests_decision_consistent check (
    (status = 'pending' and decided_by is null and decided_at is null and decision_reason is null)
    or (status <> 'pending' and decided_by is not null and decided_at is not null)
  ),
  -- US-03 AC2: a rejection always carries a non-blank reason.
  constraint leave_requests_reject_reason check (
    -- `~ '\S'` = contains a non-whitespace char (tabs/newlines count as blank,
    -- matching zod's .trim()); coalesce so NULL fails instead of passing.
    status <> 'rejected' or coalesce(decision_reason, '') ~ '\S'
  )
);
create index leave_requests_user_created_idx on public.leave_requests (user_id, created_at desc);
create index leave_requests_pending_idx on public.leave_requests (status) where not is_deleted;
create index leave_requests_leave_type_idx on public.leave_requests (leave_type_id);
create index leave_requests_decided_by_idx on public.leave_requests (decided_by);

-- ── audit_log ───────────────────────────────────────────────────────────────
create table public.audit_log (
  id                uuid primary key default gen_random_uuid(),
  leave_request_id  uuid not null references public.leave_requests (id) on delete restrict,
  actor_id          uuid not null references public.users (id) on delete restrict,
  action            public.audit_action not null,
  occurred_at       timestamptz not null default now()
);
create index audit_log_request_idx on public.audit_log (leave_request_id);
create index audit_log_actor_occurred_idx on public.audit_log (actor_id, occurred_at);

-- ── accrual_runs (idempotency ledger, US-07) ────────────────────────────────
-- The accrual job inserts the month's row FIRST inside its transaction;
-- a unique violation means the month already ran → no-op.
create table public.accrual_runs (
  id      uuid primary key default gen_random_uuid(),
  period  date not null unique check (period = date_trunc('month', period)::date),
  ran_at  timestamptz not null default now()
);

-- ── BR-04: block hard deletes ───────────────────────────────────────────────
create or replace function public.prevent_hard_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Hard delete is not allowed on %.% (BR-04 retention). Set is_deleted = true instead.',
    tg_table_schema, tg_table_name
    using errcode = 'restrict_violation';
end;
$$;

create trigger leave_requests_no_delete
  before delete on public.leave_requests
  for each row execute function public.prevent_hard_delete();

create trigger audit_log_no_delete
  before delete on public.audit_log
  for each row execute function public.prevent_hard_delete();

-- ── Row Level Security: deny by default until Day 1 policies ────────────────
alter table public.users          enable row level security;
alter table public.leave_types    enable row level security;
alter table public.leave_policies enable row level security;
alter table public.leave_balances enable row level security;
alter table public.leave_requests enable row level security;
alter table public.audit_log      enable row level security;
alter table public.accrual_runs   enable row level security;

-- ── Reference data ──────────────────────────────────────────────────────────
-- Fixed IDs match lib/data/mock/fixtures.ts (LEAVE_TYPE_IDS).
insert into public.leave_types (id, name, tracks_balance) values
  ('10000000-0000-4000-8000-000000000001', 'Vacation', true),
  ('10000000-0000-4000-8000-000000000002', 'Sick',     true),
  ('10000000-0000-4000-8000-000000000003', 'Unpaid',   false);
