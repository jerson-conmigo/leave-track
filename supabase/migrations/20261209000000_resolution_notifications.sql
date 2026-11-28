-- TASK-032 (US-09): the employee is notified when HR proposes a negative-balance resolution.
alter table public.notifications drop constraint notifications_type_valid;
alter table public.notifications add constraint notifications_type_valid
  check (type in ('request.submitted', 'request.decided', 'request.cancelled', 'resolution.proposed'));
