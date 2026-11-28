-- TASK-030 (US-17 AC1, ADR-LeaveTrack-E007 — Proposed): in-app notifications plus a
-- transactional outbox. Both rows are written by the SAME transaction as the business change
-- (lib/notifications, called from the leave-request stores), so a rolled-back action leaves no
-- notification and a committed one always has its notification. Email delivery from the outbox
-- (dispatcher, retries, nudges) is TASK-037: until then outbox rows stay 'pending'.

create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.users (id) on delete restrict,
  type         text not null,
  payload      jsonb not null,
  read_at      timestamptz,
  created_at   timestamptz not null default now(),
  constraint notifications_type_valid check (type in ('request.submitted', 'request.decided')),
  constraint notifications_payload_object check (jsonb_typeof(payload) = 'object')
);

-- A recipient's inbox, newest first; and their unread count.
create index notifications_recipient_idx
  on public.notifications (recipient_id, created_at desc, id);
create index notifications_unread_idx
  on public.notifications (recipient_id) where read_at is null;

create table public.notification_outbox (
  id              uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications (id) on delete restrict,
  recipient_id    uuid not null references public.users (id) on delete restrict,
  channel         text not null default 'email',
  idempotency_key text not null,
  payload         jsonb not null,
  status          text not null default 'pending',
  attempts        integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  sent_at         timestamptz,
  created_at      timestamptz not null default now(),
  constraint notification_outbox_idempotency_key_key unique (idempotency_key),
  constraint notification_outbox_channel_valid check (channel in ('email')),
  constraint notification_outbox_status_valid check (status in ('pending', 'sent', 'failed')),
  constraint notification_outbox_attempts_nonnegative check (attempts >= 0)
);

-- Every foreign-key column is indexed (pinned by tests/db/schema.test.ts); the dispatcher
-- (TASK-037) claims due rows by (status, next_attempt_at).
create index notification_outbox_notification_idx on public.notification_outbox (notification_id);
create index notification_outbox_recipient_idx on public.notification_outbox (recipient_id);
create index notification_outbox_due_idx on public.notification_outbox (status, next_attempt_at);

-- Server-only tables: RLS on, no policies (the app connects as the table owner).
alter table public.notifications enable row level security;
alter table public.notification_outbox enable row level security;
