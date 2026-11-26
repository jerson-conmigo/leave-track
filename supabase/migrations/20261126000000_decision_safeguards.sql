-- ============================================================================
-- TASK-014 — decision safeguards (defense in depth against double deductions)
--
-- A request can be decided at most once. The application already guards this
-- (`update … where status = 'pending'` → 409 on a second decision). This index is
-- the database backstop: the balance decrement and the decision audit row are
-- written in the SAME transaction, so any second decision path (a regression, a
-- retry bug, a manual SQL slip) fails on this insert and rolls the decrement back.
-- `submitted` rows are excluded — every request has exactly one of those too, but
-- they are not part of the decision invariant.
-- ============================================================================

create unique index audit_log_one_decision_per_request
  on public.audit_log (leave_request_id)
  where action <> 'submitted';
