-- ============================================================================
-- READ-ONLY pre-deploy check for migration 20261129000000_untracked_types_guard
-- (TASK-018 / US-08). Run against production BEFORE deploying it:
--   psql "$DIRECT_URL" -f supabase/checks/untracked_type_rows.sql
-- Any row returned blocks the migration (it refuses to run on bad data). Decide
-- with HR whether each row should be deleted, moved to a tracked type, or whether
-- the leave type should track balances — then re-run this check.
-- ============================================================================

select 'leave_balances' as source, b.id, u.name as user_name, t.name as leave_type,
       b.balance::text as value
  from public.leave_balances b
  join public.leave_types t on t.id = b.leave_type_id
  join public.users u on u.id = b.user_id
 where not t.tracks_balance
union all
select 'leave_policies', p.id, u.name, t.name, p.accrual_per_month::text
  from public.leave_policies p
  join public.leave_types t on t.id = p.leave_type_id
  join public.users u on u.id = p.user_id
 where not t.tracks_balance
 order by source, leave_type, user_name;
