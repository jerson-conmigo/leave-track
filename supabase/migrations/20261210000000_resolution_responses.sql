-- TASK-033 (US-10, ADR-LeaveTrack-E006 §2/§3/§6): the employee accepts or declines; HR re-proposes
-- once or records a binding final decision. Who decided and why are stored on the resolution;
-- applied amounts must exist exactly when something was applied.
alter table public.balance_resolutions
  add column decided_by uuid references public.users (id) on delete restrict,
  add column final_reason text;
create index balance_resolutions_decided_by_idx on public.balance_resolutions (decided_by);

alter table public.balance_resolutions add constraint balance_resolutions_applied_consistent check (
  case
    when status in ('accepted', 'finalized')
      then unpaid_days_applied is not null and recovery_days_applied is not null
    when status in ('proposed', 'declined', 'superseded', 'withdrawn')
      then unpaid_days_applied is null and recovery_days_applied is null
    else true -- 'expired' is settled by the expiry job (TASK-034)
  end
);
alter table public.balance_resolutions add constraint balance_resolutions_closed_consistent check (
  (status in ('proposed', 'declined')) = (closed_at is null)
);
alter table public.balance_resolutions add constraint balance_resolutions_final_reason_length check (
  final_reason is null or char_length(final_reason) between 3 and 500
);

alter table public.notifications drop constraint notifications_type_valid;
alter table public.notifications add constraint notifications_type_valid
  check (type in ('request.submitted', 'request.decided', 'request.cancelled', 'resolution.proposed',
                  'resolution.accepted', 'resolution.declined', 'resolution.finalized'));
