-- ============================================================================
-- TASK-015 — supports the HR audit event log: newest-first, capped, across 3+
-- years of history (BR-04). `order by occurred_at desc, id limit N` can walk this
-- index instead of sorting the whole audit_log.
-- ============================================================================

create index audit_log_occurred_idx on public.audit_log (occurred_at desc, id);
