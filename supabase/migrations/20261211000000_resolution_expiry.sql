-- TASK-034 (US-11, ADR-LeaveTrack-E006 §5): the daily expiry job converts unanswered proposals to
-- Unpaid and tells the employee and HR. The 'expired' status and event action already exist.
alter table public.notifications drop constraint notifications_type_valid;
alter table public.notifications add constraint notifications_type_valid
  check (type in ('request.submitted', 'request.decided', 'request.cancelled', 'resolution.proposed',
                  'resolution.accepted', 'resolution.declined', 'resolution.finalized',
                  'resolution.expired'));
