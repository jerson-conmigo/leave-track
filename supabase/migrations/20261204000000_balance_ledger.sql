-- TASK-029 (ADR-LeaveTrack-E006 §1 — Proposed): the balance ledger.
-- Every change to leave_balances writes ONE append-only row here, in the same transaction:
-- what changed (delta), the balance after it, why (source) and a unique source_key, so the same
-- change can never be recorded twice. Writers: approval (decide), accrual; later cancellation
-- (TASK-028), recovery and conversion (TASK-031+). tests/leave-types/balance-writers.test.ts
-- requires every leave_balances writer to also write this table.

create table public.balance_ledger (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users (id) on delete restrict,
  leave_type_id    uuid not null references public.leave_types (id) on delete restrict,
  delta            numeric(6, 2) not null,
  balance_after    numeric(6, 2) not null,
  source           text not null,
  source_key       text not null,
  leave_request_id uuid references public.leave_requests (id) on delete restrict,
  actor_id         uuid references public.users (id) on delete restrict, -- null = the system
  occurred_at      timestamptz not null default now(),
  constraint balance_ledger_source_key_key unique (source_key),
  constraint balance_ledger_source_valid check (
    source in ('opening', 'approval', 'accrual', 'cancellation', 'recovery', 'conversion')
  ),
  constraint balance_ledger_delta_nonzero check (delta <> 0 or source = 'opening'),
  constraint balance_ledger_source_key_length check (char_length(source_key) between 1 and 200)
);

create index balance_ledger_user_type_idx
  on public.balance_ledger (user_id, leave_type_id, occurred_at, id);
-- Every foreign-key column is indexed (project convention; pinned by tests/db/schema.test.ts).
create index balance_ledger_leave_type_idx on public.balance_ledger (leave_type_id);
create index balance_ledger_leave_request_idx on public.balance_ledger (leave_request_id);
create index balance_ledger_actor_idx on public.balance_ledger (actor_id);

-- Server-only table: RLS on, no policies (the app connects as the table owner).
alter table public.balance_ledger enable row level security;

-- Append-only: history can never be rewritten or removed.
create function public.balance_ledger_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'balance_ledger is append-only (% refused)', tg_op
    using errcode = 'restrict_violation',
          constraint = 'balance_ledger_append_only';
end;
$$;

create trigger balance_ledger_no_update_delete
  before update or delete on public.balance_ledger
  for each row execute function public.balance_ledger_append_only();

create trigger balance_ledger_no_truncate
  before truncate on public.balance_ledger
  for each statement execute function public.balance_ledger_append_only();

-- Only leave types that track a balance can have ledger rows (the TASK-018 guard, reused).
create trigger balance_ledger_tracked_type
  before insert on public.balance_ledger
  for each row execute function public.enforce_tracked_leave_type();

-- Opening rows: every balance that exists before the ledger starts gets one row, so that for
-- every (user, leave type) the sum of deltas equals the balance from day one. Idempotent.
insert into public.balance_ledger
  (user_id, leave_type_id, delta, balance_after, source, source_key, occurred_at)
select b.user_id, b.leave_type_id, b.balance, b.balance, 'opening',
       'opening:' || b.user_id || ':' || b.leave_type_id, b.updated_at
  from public.leave_balances b
on conflict (source_key) do nothing;
