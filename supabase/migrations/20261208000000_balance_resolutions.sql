-- TASK-031 (US-09, ADR-LeaveTrack-E006 §2–§7 — Proposed): the schema for negative-balance
-- resolutions. Schema and integrity only; the services, API and UI arrive with TASK-032–036.
-- Status/action are text + CHECK (not enums) so later states can be added without the
-- "unsafe use of new enum value" transaction problem.

-- (a) Operational settings (HR edits them in TASK-040).
create table public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_by uuid references public.users (id) on delete restrict,
  updated_at timestamptz not null default now(),
  constraint app_settings_resolution_response_days_range check (
    key <> 'resolution_response_days'
    or (jsonb_typeof(value) = 'number' and (value)::numeric = trunc((value)::numeric)
        and (value)::numeric between 1 and 14)
  )
);
create index app_settings_updated_by_idx on public.app_settings (updated_by);
insert into public.app_settings (key, value) values ('resolution_response_days', '3')
on conflict (key) do nothing;

-- (b) A proposal to resolve a negative balance: convert to Unpaid and/or recover from accruals.
create table public.balance_resolutions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references public.users (id) on delete restrict,
  leave_type_id          uuid not null references public.leave_types (id) on delete restrict,
  status                 text not null default 'proposed',
  deficit_at_proposal    numeric(6, 2) not null,
  unpaid_days_proposed   numeric(6, 2) not null default 0,
  recovery_days_proposed numeric(6, 2) not null default 0,
  recovery_start_period  date,
  recovery_months        integer,
  unpaid_days_applied    numeric(6, 2),
  recovery_days_applied  numeric(6, 2),
  respond_by             timestamptz not null,
  response_reason        text,
  supersedes_id          uuid references public.balance_resolutions (id) on delete restrict,
  proposal_number        integer not null default 1,
  proposed_by            uuid not null references public.users (id) on delete restrict,
  proposed_at            timestamptz not null default now(),
  closed_at              timestamptz,
  constraint balance_resolutions_status_valid check (
    status in ('proposed', 'accepted', 'declined', 'expired', 'withdrawn', 'superseded', 'finalized')
  ),
  constraint balance_resolutions_deficit_positive check (deficit_at_proposal > 0),
  constraint balance_resolutions_amounts_nonnegative check (
    unpaid_days_proposed >= 0 and recovery_days_proposed >= 0
    and coalesce(unpaid_days_applied, 0) >= 0 and coalesce(recovery_days_applied, 0) >= 0
  ),
  constraint balance_resolutions_amounts_match_deficit check (
    unpaid_days_proposed + recovery_days_proposed = deficit_at_proposal
  ),
  constraint balance_resolutions_recovery_schedule check (
    recovery_days_proposed = 0
    or (recovery_start_period is not null and recovery_months >= 1
        and recovery_start_period = date_trunc('month', recovery_start_period)::date)
  ),
  constraint balance_resolutions_proposal_number_range check (proposal_number between 1 and 2)
);
create index balance_resolutions_user_idx on public.balance_resolutions (user_id);
create index balance_resolutions_leave_type_idx on public.balance_resolutions (leave_type_id);
create index balance_resolutions_supersedes_idx on public.balance_resolutions (supersedes_id);
create index balance_resolutions_proposed_by_idx on public.balance_resolutions (proposed_by);
-- One OPEN resolution per (user, leave type): proposed, or declined and awaiting HR.
create unique index balance_resolutions_one_open
  on public.balance_resolutions (user_id, leave_type_id) where status in ('proposed', 'declined');
-- Only leave types that track a balance (the TASK-018 guard).
create trigger balance_resolutions_tracked_type
  before insert or update of leave_type_id on public.balance_resolutions
  for each row execute function public.enforce_tracked_leave_type();

-- (c) The recovery schedule: one deduction per resolution and month.
create table public.balance_recoveries (
  id            uuid primary key default gen_random_uuid(),
  resolution_id uuid not null references public.balance_resolutions (id) on delete restrict,
  period        date not null,
  amount        numeric(6, 2) not null,
  applied_at    timestamptz,
  constraint balance_recoveries_resolution_period_key unique (resolution_id, period),
  constraint balance_recoveries_amount_positive check (amount > 0),
  constraint balance_recoveries_period_month check (period = date_trunc('month', period)::date)
);

-- (d) Append-only history of every resolution step (actor null = the system).
create table public.balance_resolution_events (
  id             uuid primary key default gen_random_uuid(),
  resolution_id  uuid not null references public.balance_resolutions (id) on delete restrict,
  action         text not null,
  actor_id       uuid references public.users (id) on delete restrict,
  balance_before numeric(6, 2),
  balance_after  numeric(6, 2),
  details        jsonb not null default '{}',
  reason         text,
  occurred_at    timestamptz not null default now(),
  constraint balance_resolution_events_action_valid check (
    action in ('proposed', 'accepted', 'declined', 'expired', 'withdrawn', 'superseded',
               'finalized', 'recovery_applied', 'reminder_sent')
  )
);
create index balance_resolution_events_resolution_idx on public.balance_resolution_events (resolution_id);
create index balance_resolution_events_actor_idx on public.balance_resolution_events (actor_id);

create function public.balance_resolution_events_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'balance_resolution_events is append-only (% refused)', tg_op
    using errcode = 'restrict_violation', constraint = 'balance_resolution_events_append_only';
end;
$$;
create trigger balance_resolution_events_no_update_delete
  before update or delete on public.balance_resolution_events
  for each row execute function public.balance_resolution_events_append_only();
create trigger balance_resolution_events_no_truncate
  before truncate on public.balance_resolution_events
  for each statement execute function public.balance_resolution_events_append_only();

-- Server-only tables: RLS on, no policies (the app connects as the table owner).
alter table public.app_settings enable row level security;
alter table public.balance_resolutions enable row level security;
alter table public.balance_recoveries enable row level security;
alter table public.balance_resolution_events enable row level security;
