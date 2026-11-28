-- TASK-026 (US-15, BR-10, ADR-LeaveTrack-E005 — Proposed): approval routing.
--
-- ONE rule decides who may approve a request, in SQL (BR-02): public.can_decide. Everything
-- else is derived from it, so the decide statement, the approvals queue, the "no approver"
-- check at submit and the "Awaiting …" label can never disagree:
--   - an employee's or manager's request → their manager (users.manager_id);
--   - an HR Admin with no manager → any OTHER HR Admin;
--   - nobody ever decides their own request.
-- lib/leave-requests/approver.ts mirrors these functions for the in-memory store; a parity
-- test runs the same cases against both.

-- (a) May `actor` decide `requester`'s leave? Roles are read from the users table at query
--     time, so an org-chart change takes effect immediately (US-04 AC2 / US-15 AC5).
create function public.can_decide(actor uuid, requester uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
      from public.users r
      join public.users a on a.id = actor
     where r.id = requester
       and a.id <> r.id
       and (
         r.manager_id = a.id
         or (r.role = 'hr_admin' and r.manager_id is null and a.role = 'hr_admin')
       )
  )
$$;

-- (b) Does `requester` have anyone who may decide their requests? (BR-10: no orphans — submit
--     refuses with 409 otherwise.) Defined through can_decide, never separately.
create function public.has_approver(requester uuid)
returns boolean
language sql
stable
as $$
  select exists (select 1 from public.users a where public.can_decide(a.id, requester))
$$;

-- (c) Who a pending request is "Awaiting": the manager's name, 'HR' for an HR Admin decided by
--     their peers, or null when nobody can decide it. Consistent with can_decide by
--     construction (the manager is shown only if they may decide).
create function public.approver_label(requester uuid)
returns text
language sql
stable
as $$
  select case
           when m.id is not null and public.can_decide(m.id, r.id) then m.name
           when public.has_approver(r.id) then 'HR'
         end
    from public.users r
    left join public.users m on m.id = r.manager_id
   where r.id = requester
$$;

-- Server-only: the app connects as the owner. On Supabase the anon/authenticated roles would
-- otherwise be able to call these over the REST API and probe the org chart.
revoke execute on function public.can_decide(uuid, uuid) from public;
revoke execute on function public.has_approver(uuid) from public;
revoke execute on function public.approver_label(uuid) from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke execute on function public.can_decide(uuid, uuid) from anon, authenticated;
    revoke execute on function public.has_approver(uuid) from anon, authenticated;
    revoke execute on function public.approver_label(uuid) from anon, authenticated;
  end if;
end;
$$;

-- (d) Nobody decides their own request — declarative backstop behind can_decide (D-B).
--     Existing data is checked first: if any request was decided by its own requester the
--     migration stops and changes NOTHING (fix the data with HR first; it is never altered here).
do $$
declare
  offenders integer;
begin
  select count(*) into offenders
    from public.leave_requests
   where decided_by is not null and decided_by = user_id;
  if offenders > 0 then
    raise exception
      'TASK-026 pre-check failed: % leave request(s) were decided by their own requester. Review them with HR first (select id, user_id, decided_by from public.leave_requests where decided_by = user_id); nothing was changed.',
      offenders
      using errcode = 'check_violation';
  end if;
end;
$$;

alter table public.leave_requests
  add constraint leave_requests_no_self_decision
  check (decided_by is null or decided_by <> user_id);
