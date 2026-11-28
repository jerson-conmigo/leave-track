-- ============================================================================
-- LeaveTrack — development seed data. IDEMPOTENT: safe to run repeatedly.
-- IDs are identical to lib/data/mock/fixtures.ts — keep both in sync.
-- Never run against production.
-- ============================================================================

-- TASK-027: the seed loads HISTORICAL requests (past start dates), which the
-- leave_requests_backdate_guard trigger refuses for normal inserts. Seed-only escape hatch,
-- switched off again at the end of this file. Application code never sets it.
select set_config('leavetrack.allow_backdated', 'on', false);

-- Leave types are reference data inserted by the migration; re-assert here so
-- the seed is self-contained.
insert into public.leave_types (id, name, tracks_balance) values
  ('10000000-0000-4000-8000-000000000001', 'Vacation', true),
  ('10000000-0000-4000-8000-000000000002', 'Sick',     true),
  ('10000000-0000-4000-8000-000000000003', 'Unpaid',   false)
on conflict (id) do nothing;

-- Users: HR admin first, then managers, then employees (FK order).
insert into public.users (id, name, email, role, manager_id) values
  ('00000000-0000-4000-8000-000000000001', 'Carla Diaz',    'carla.diaz@leavetrack.test',    'hr_admin', null),
  ('00000000-0000-4000-8000-000000000011', 'Ben Ortiz',     'ben.ortiz@leavetrack.test',     'manager',  '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000012', 'Maya Chen',     'maya.chen@leavetrack.test',     'manager',  '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000101', 'Ana Reyes',     'ana.reyes@leavetrack.test',     'employee', '00000000-0000-4000-8000-000000000011'),
  ('00000000-0000-4000-8000-000000000102', 'Jordan Lee',    'jordan.lee@leavetrack.test',    'employee', '00000000-0000-4000-8000-000000000011'),
  ('00000000-0000-4000-8000-000000000103', 'Priya Nair',    'priya.nair@leavetrack.test',    'employee', '00000000-0000-4000-8000-000000000011'),
  ('00000000-0000-4000-8000-000000000104', 'Sam Okafor',    'sam.okafor@leavetrack.test',    'employee', '00000000-0000-4000-8000-000000000012'),
  ('00000000-0000-4000-8000-000000000105', 'Lena Fischer',  'lena.fischer@leavetrack.test',  'employee', '00000000-0000-4000-8000-000000000012'),
  ('00000000-0000-4000-8000-000000000106', 'Diego Alvarez', 'diego.alvarez@leavetrack.test', 'employee', '00000000-0000-4000-8000-000000000012')
on conflict (id) do nothing;

-- Policies & balances: [user, vacation balance, sick balance].
-- Vacation accrues 1.25/month, Sick 1.00/month, Unpaid has no policy.
with b(user_id, vacation, sick) as (
  values
    ('00000000-0000-4000-8000-000000000001'::uuid, 14.50, 8.00),
    ('00000000-0000-4000-8000-000000000011'::uuid, 12.00, 6.00),
    ('00000000-0000-4000-8000-000000000012'::uuid,  9.75, 7.00),
    ('00000000-0000-4000-8000-000000000101'::uuid, 11.25, 5.00),
    ('00000000-0000-4000-8000-000000000102'::uuid,  6.50, 3.00),
    ('00000000-0000-4000-8000-000000000103'::uuid, 15.00, 9.00),
    ('00000000-0000-4000-8000-000000000104'::uuid,  3.75, 4.00),
    ('00000000-0000-4000-8000-000000000105'::uuid,  8.00, 6.50),
    ('00000000-0000-4000-8000-000000000106'::uuid, 10.00, 2.00)
),
policies as (
  insert into public.leave_policies (user_id, leave_type_id, accrual_per_month)
  select user_id, '10000000-0000-4000-8000-000000000001'::uuid, 1.25 from b
  union all
  select user_id, '10000000-0000-4000-8000-000000000002'::uuid, 1.00 from b
  on conflict (user_id, leave_type_id) do nothing
  returning 1
)
insert into public.leave_balances (user_id, leave_type_id, balance, updated_at)
select user_id, '10000000-0000-4000-8000-000000000001'::uuid, vacation, '2026-11-01T02:00:00Z'::timestamptz from b
union all
select user_id, '10000000-0000-4000-8000-000000000002'::uuid, sick, '2026-11-01T02:00:00Z'::timestamptz from b
on conflict (user_id, leave_type_id) do nothing;

-- Accrual for Nov 2026 already ran (balances above reflect it).
insert into public.accrual_runs (period, ran_at) values ('2026-11-01', '2026-11-01T02:00:00Z')
on conflict (period) do nothing;

-- Leave requests.
insert into public.leave_requests
  (id, user_id, leave_type_id, start_date, end_date, reason, status, decided_by, decided_at, decision_reason, created_at)
values
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000001', '2026-12-21', '2026-12-31', 'Year-end holiday with family', 'pending',  null, null, null, '2026-11-18T09:12:00Z'),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000002', '2026-10-06', '2026-10-07', 'Flu',                          'approved', '00000000-0000-4000-8000-000000000011', '2026-10-06T10:02:00Z', null, '2026-10-06T07:40:00Z'),
  ('20000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000001', '2026-08-10', '2026-08-14', 'Summer trip',                  'approved', '00000000-0000-4000-8000-000000000011', '2026-07-21T08:15:00Z', null, '2026-07-20T14:30:00Z'),
  ('20000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000001', '2026-12-01', '2026-12-05', 'Visiting parents',             'pending',  null, null, null, '2026-11-19T11:05:00Z'),
  ('20000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000003', '2026-11-30', '2026-11-30', 'Moving apartments',            'pending',  null, null, null, '2026-11-20T16:45:00Z'),
  ('20000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000103', '10000000-0000-4000-8000-000000000001', '2026-11-16', '2026-11-20', 'Conference + rest days',       'rejected', '00000000-0000-4000-8000-000000000011', '2026-11-03T09:00:00Z', 'Overlaps the Q4 release freeze — please pick another week', '2026-11-02T13:20:00Z'),
  ('20000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000104', '10000000-0000-4000-8000-000000000001', '2027-01-04', '2027-01-08', 'Ski week',                     'pending',  null, null, null, '2026-11-21T08:30:00Z'),
  ('20000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000105', '10000000-0000-4000-8000-000000000002', '2026-11-19', '2026-11-19', 'Dentist appointment',          'approved', '00000000-0000-4000-8000-000000000012', '2026-11-19T08:10:00Z', null, '2026-11-19T06:55:00Z'),
  ('20000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000106', '10000000-0000-4000-8000-000000000001', '2026-12-14', '2026-12-16', 'Long weekend',                 'pending',  null, null, null, '2026-11-22T10:00:00Z'),
  ('20000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000001', '2026-12-28', '2026-12-31', 'Holidays',                     'pending',  null, null, null, '2026-11-15T12:00:00Z')
on conflict (id) do nothing;

-- Audit log: a `submitted` row for every request + a decision row for decided ones.
-- IDs follow fixtures.ts: request n → submitted 2n-1, decision 2n.
insert into public.audit_log (id, leave_request_id, actor_id, action, occurred_at)
select
  ('30000000-0000-4000-8000-' || lpad((n * 2 - 1)::text, 12, '0'))::uuid,
  r.id, r.user_id, 'submitted'::public.audit_action, r.created_at
from public.leave_requests r
cross join lateral (select right(r.id::text, 12)::int as n) idx
where r.id::text like '20000000-0000-4000-8000-%'
union all
select
  ('30000000-0000-4000-8000-' || lpad((n * 2)::text, 12, '0'))::uuid,
  r.id, r.decided_by, r.status::text::public.audit_action, r.decided_at
from public.leave_requests r
cross join lateral (select right(r.id::text, 12)::int as n) idx
where r.id::text like '20000000-0000-4000-8000-%' and r.status <> 'pending'
on conflict (id) do nothing;

-- TASK-029: opening balance_ledger rows for the seeded balances (as the migration's backfill),
-- so every (user, leave type)'s ledger sums to its balance. Idempotent.
-- Guarded: migration tests load this seed onto schemas from before the ledger existed.
do $$
begin
  if to_regclass('public.balance_ledger') is not null then
    insert into public.balance_ledger
      (user_id, leave_type_id, delta, balance_after, source, source_key, occurred_at)
    select b.user_id, b.leave_type_id, b.balance, b.balance, 'opening',
           'opening:' || b.user_id || ':' || b.leave_type_id, b.updated_at
      from public.leave_balances b
    on conflict (source_key) do nothing;
  end if;
end;
$$;

-- TASK-027: end of the seed — normal inserts are checked again.
select set_config('leavetrack.allow_backdated', 'off', false);
