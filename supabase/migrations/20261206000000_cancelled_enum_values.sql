-- TASK-028 (US-16 AC3–AC4): the 'cancelled' status and audit action.
-- Alone in this file on purpose: Postgres can't USE an enum value in the transaction that added
-- it, so everything that refers to 'cancelled' lives in the next migration.
alter type public.request_status add value if not exists 'cancelled';
alter type public.audit_action add value if not exists 'cancelled';
