-- TASK-028 (US-16 AC3–AC4, BR-13): withdraw pending / cancel approved requests.
-- A cancellation records who and when (the requester), keeps the approval's decided_* fields
-- for the audit trail, and is final. Balance restoration + ledger row, the audit row and the
-- notification are written by the leave-request stores in one transaction.

alter table public.leave_requests
  add column cancelled_at timestamptz,
  add column cancelled_by uuid references public.users (id) on delete restrict;
create index leave_requests_cancelled_by_idx on public.leave_requests (cancelled_by);

-- (a) The decision CHECK learns 'cancelled'. Existing rows are checked first: the migration stops
--     and changes NOTHING if any would violate it.
do $$
declare
  bad integer;
begin
  select count(*) into bad from public.leave_requests
   where not (
     (status = 'pending' and decided_by is null and decided_at is null and decision_reason is null)
     or (status in ('approved', 'rejected') and decided_by is not null and decided_at is not null)
   );
  if bad > 0 then
    raise exception 'TASK-028 pre-check failed: % leave request(s) have inconsistent decision fields; nothing was changed.', bad
      using errcode = 'check_violation';
  end if;
end;
$$;

alter table public.leave_requests drop constraint leave_requests_decision_consistent;
alter table public.leave_requests add constraint leave_requests_decision_consistent check (
  (status = 'pending' and decided_by is null and decided_at is null and decision_reason is null
     and cancelled_by is null and cancelled_at is null)
  or (status in ('approved', 'rejected') and decided_by is not null and decided_at is not null
     and cancelled_by is null and cancelled_at is null)
  or (status = 'cancelled' and cancelled_by = user_id and cancelled_at is not null
     and ((decided_by is null and decided_at is null)            -- withdrawn while pending
          or (decided_by is not null and decided_at is not null))) -- cancelled after approval
);

-- (b) One decision per request still (approved/rejected only), and at most one cancellation.
drop index public.audit_log_one_decision_per_request;
create unique index audit_log_one_decision_per_request
  on public.audit_log (leave_request_id) where action in ('approved', 'rejected');
create unique index audit_log_one_cancellation_per_request
  on public.audit_log (leave_request_id) where action = 'cancelled';

-- (c) A cancelled request is final: its status can never change again.
create function public.leave_requests_cancel_final()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'cancelled' and new.status <> 'cancelled' then
    raise exception 'a cancelled leave request is final'
      using errcode = 'check_violation', constraint = 'leave_requests_cancel_final';
  end if;
  return new;
end;
$$;
create trigger leave_requests_cancel_final
  before update of status on public.leave_requests
  for each row execute function public.leave_requests_cancel_final();

-- (d) The approver hears about cancellations (TASK-030 notifications).
alter table public.notifications drop constraint notifications_type_valid;
alter table public.notifications add constraint notifications_type_valid
  check (type in ('request.submitted', 'request.decided', 'request.cancelled'));
