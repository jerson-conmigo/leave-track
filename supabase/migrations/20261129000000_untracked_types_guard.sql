-- ============================================================================
-- TASK-018 / US-08 — untracked leave types can never hold a balance or a policy.
--
-- Generic: every check keys on leave_types.tracks_balance — nothing names
-- "Unpaid", so any future untracked type is covered with no code change.
-- Defence in depth behind the application checks (services/stores gate on
-- tracksBalance; tests/leave-types/* enforce it).
-- ============================================================================

-- (a) PRE-CHECK existing data. Fail (and roll back) rather than silently delete or
--     orphan production rows. Diagnose with supabase/checks/untracked_type_rows.sql.
do $$
declare
  bad_balances int;
  bad_policies int;
begin
  select count(*) into bad_balances
    from public.leave_balances b join public.leave_types t on t.id = b.leave_type_id
   where not t.tracks_balance;
  select count(*) into bad_policies
    from public.leave_policies p join public.leave_types t on t.id = p.leave_type_id
   where not t.tracks_balance;
  if bad_balances > 0 or bad_policies > 0 then
    raise exception
      'US-08 pre-check failed: % leave_balances and % leave_policies rows reference untracked leave types. Fix the data first (see supabase/checks/untracked_type_rows.sql); nothing was changed.',
      bad_balances, bad_policies
      using errcode = 'check_violation';
  end if;
end;
$$;

-- (b) Balances/policies may only reference a leave type that tracks a balance.
--     FOR SHARE locks the leave_types row for the rest of the transaction, so this
--     check cannot interleave with a concurrent tracks_balance true→false flip (d):
--     the flip's UPDATE needs a lock that conflicts with FOR SHARE.
create or replace function public.enforce_tracked_leave_type()
returns trigger
language plpgsql
as $$
declare
  tracked boolean;
begin
  select t.tracks_balance into tracked
    from public.leave_types t
   where t.id = new.leave_type_id
     for share;
  if tracked is distinct from true then
    raise exception 'Leave type % does not track a balance (US-08); % rows are not allowed for it.',
      new.leave_type_id, tg_table_name
      using errcode = 'check_violation', constraint = 'leave_type_must_track_balance';
  end if;
  return new;
end;
$$;

create trigger leave_balances_tracked_type
  before insert or update of leave_type_id on public.leave_balances
  for each row execute function public.enforce_tracked_leave_type();

create trigger leave_policies_tracked_type
  before insert or update of leave_type_id on public.leave_policies
  for each row execute function public.enforce_tracked_leave_type();

-- (d) A type that has balances or policies cannot stop tracking balances — otherwise
--     the invariant could be broken from the other side.
create or replace function public.prevent_untracking_with_balances()
returns trigger
language plpgsql
as $$
begin
  if old.tracks_balance and not new.tracks_balance and (
       exists (select 1 from public.leave_balances where leave_type_id = new.id)
       or exists (select 1 from public.leave_policies where leave_type_id = new.id)
     ) then
    raise exception 'Leave type % still has balances or policies; it cannot stop tracking balances (US-08).',
      new.id
      using errcode = 'check_violation', constraint = 'leave_type_has_balances';
  end if;
  return new;
end;
$$;

create trigger leave_types_untrack_guard
  before update of tracks_balance on public.leave_types
  for each row execute function public.prevent_untracking_with_balances();
