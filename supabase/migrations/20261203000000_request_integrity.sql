-- TASK-027 (US-16 AC1–AC2, BR-13, ARCH D10): request integrity, enforced by the database as the
-- backstop behind zod and the submit service.
--   (a) no two pending/approved requests by the same person may overlap (atomic — two
--       simultaneous submissions create exactly one row);
--   (b) at most 90 calendar days per request (inclusive, as lib/format.ts countDays);
--   (c) no start date in the past, except up to leave_types.max_backdate_days (Sick: 30) —
--       keyed on that attribute, never on a leave type's name (AGENTS rule 7).
-- Every violation has a name; lib/db/errors.ts maps each to 400 VALIDATION_ERROR.

-- btree_gist gives uuid an equality operator class usable in a GiST exclusion constraint.
create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;

-- How many days before today a request of this type may start (Sick 30, others 0).
alter table public.leave_types
  add column max_backdate_days integer not null default 0,
  add constraint leave_types_max_backdate_days_range check (max_backdate_days between 0 and 365);
update public.leave_types set max_backdate_days = 30
 where id = '10000000-0000-4000-8000-000000000002'; -- Sick (fixed id, as in fixtures.ts)

-- Existing data is checked first: if any active requests overlap, or any request is longer than
-- 90 days, the migration stops and changes NOTHING (review those requests with HR first).
do $$
declare
  overlap_count integer;
  too_long integer;
begin
  select count(*) into overlap_count
    from public.leave_requests a
    join public.leave_requests b
      on a.user_id = b.user_id and a.id < b.id
   where a.status in ('pending', 'approved') and b.status in ('pending', 'approved')
     and not a.is_deleted and not b.is_deleted
     and daterange(a.start_date, a.end_date, '[]') && daterange(b.start_date, b.end_date, '[]');
  select count(*) into too_long
    from public.leave_requests
   where end_date - start_date + 1 > 90;
  if overlap_count > 0 or too_long > 0 then
    raise exception
      'TASK-027 pre-check failed: % overlapping pair(s) of active requests and % request(s) longer than 90 days. Review them with HR first; nothing was changed.',
      overlap_count, too_long
      using errcode = 'check_violation';
  end if;
end;
$$;

-- (a) No overlapping active requests per person. Rejected and soft-deleted requests don't count.
alter table public.leave_requests
  add constraint leave_requests_no_overlap
  exclude using gist (
    user_id with =,
    daterange(start_date, end_date, '[]') with &&
  ) where (status in ('pending', 'approved') and not is_deleted);

-- (b) At most 90 calendar days, inclusive.
alter table public.leave_requests
  add constraint leave_requests_max_length check (end_date - start_date + 1 <= 90);

-- (c) No past start beyond the type's allowance. A trigger, not a CHECK: "today" changes, and
--     existing (historical) rows must stay valid. Today is the UTC date.
--     Seed-only escape hatch: supabase/seed.sql sets leavetrack.allow_backdated = 'on' for its
--     historical rows and resets it at the end. Application code never sets it (pinned by
--     tests/leave-requests/request-integrity.test.ts).
create function public.leave_requests_backdate_guard()
returns trigger
language plpgsql
as $$
declare
  allowance integer;
begin
  if current_setting('leavetrack.allow_backdated', true) = 'on' then
    return new;
  end if;
  select max_backdate_days into allowance from public.leave_types where id = new.leave_type_id;
  if new.start_date < (now() at time zone 'utc')::date - coalesce(allowance, 0) then
    raise exception 'start date % is before the allowed window for this leave type', new.start_date
      using errcode = 'check_violation',
            constraint = 'leave_requests_backdate_window';
  end if;
  return new;
end;
$$;

create trigger leave_requests_backdate_guard
  before insert or update of start_date, leave_type_id on public.leave_requests
  for each row execute function public.leave_requests_backdate_guard();
