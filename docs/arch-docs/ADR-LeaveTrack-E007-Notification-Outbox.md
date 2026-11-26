# ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox

**Status:** Proposed (EPIC 2 plan, 2026-11-26) — needs architect sign-off.
**Tasks:** TASK-030, TASK-037 · **Stories:** US-17 (used by US-09 – US-11, US-15, US-16) · **BR-11**

## Context

Notifications are log-only today (backlog B6). EPIC 2 adds events that people must act on —
resolution proposals with a 3-day deadline, declines, automatic conversions, reminders.
Sending email inside a request or transaction risks either losing the notification (commit
then crash) or notifying about something that rolled back.

## Decision

- **In-app first:** a `notifications` table (recipient, type, payload, read_at) with a bell and
  a `/notifications` page. Recipients only ever read their own rows.
- **Transactional outbox:** the same transaction that changes business state inserts the
  in-app notification and a `notification_outbox` row with a unique `idempotency_key`
  (e.g. `resolution.proposed:<id>`).
- **Dispatcher job** (`/api/jobs/notifications`, Vercel Cron, constant-time Bearer
  `CRON_SECRET`): claims due rows with `FOR UPDATE SKIP LOCKED`, sends email through the
  provider's REST API with the idempotency key (D12: Resend, no SDK), and retries with
  exponential backoff. Delivery is at least once; duplicates are suppressed by the key.
- **Nudges** run in the same job: stale pending approvals (older than 3 days) and resolution
  reminders (24 h before the deadline), at most once per day per item.
- The notifier port stays; `leaveRequestSubmitted` / `leaveRequestDecided` move from logging
  to the outbox. A delivery failure never undoes a business action.

## Consequences

- Positive: no lost or phantom notifications; works with no email provider configured (in-app only).
- Negative: one more job and table; email templates to maintain; provider API key per environment.
