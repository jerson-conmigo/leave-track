# ADR-LeaveTrack-E004 — Real Authentication: Supabase Auth with signed sessions

**Status:** Proposed (EPIC 2 plan, 2026-11-26) — needs architect sign-off. Supersedes the Day 0
mock session of `ADR-LeaveTrack-E001` for every deployed environment.
**Tasks:** TASK-019, TASK-023, TASK-024, TASK-025, TASK-046 · **Stories:** US-13, US-14 · **BR-09**

**Implementation notes:** TASK-023 signed the session cookie. TASK-024 added the Supabase
adapter (`lib/auth/supabase/`, `@supabase/ssr` 0.12.7, `@supabase/supabase-js` 2.119.2):
password sign-in, invite (`npm run user:invite`, which sets `users.auth_user_id`), password
reset, provider-session refresh in `proxy.ts`, a server-side liveness check in `getSession`,
and revoking sign-out. The provider session proves identity; the app's signed `lt-session`
names the linked user. Session policy (TASK-025), MFA (TASK-046), RLS (TASK-042) and the
admin invite UI (TASK-043) remain.

## Context

The EPIC 2 evaluation confirmed the Day 0 session is two unsigned cookies (`mock-role`,
`mock-user-id`). Anyone can set them and impersonate any user, including HR Admins, without
signing in. `getSession()` only checks that the role matches the users table. This blocks any
deployment real staff can reach (ADR-E001). The stack already uses Supabase for Postgres.

## Options considered

1. **Supabase Auth** (`@supabase/ssr`): email/password, invites, password reset, email OTP and
   TOTP MFA built in; JWT sessions in httpOnly cookies refreshed server-side; same vendor and
   region as the database.
2. **Auth.js / NextAuth:** flexible, but needs its own adapter tables, email delivery and MFA work.
3. **Hand-rolled sessions:** full control, but password storage, reset and MFA become ours to secure.

## Decision

Option 1. Concretely:

- An **auth port** (`lib/auth/`) with two adapters: `supabase` (all deployed environments) and
  `mock` (dev/test only). Production refuses to start with the mock adapter or without the auth
  secrets (TASK-019 fail-closed env validation).
- Even the mock adapter's cookie is **HMAC-signed** (`SESSION_SECRET`), so forged cookies are
  rejected everywhere (TASK-023).
- `users.auth_user_id` links the provider identity to the app user. **Authorization stays in
  the database:** role, manager and active status are re-read on every request, never trusted
  from token claims, so admin changes take effect immediately.
- `proxy.ts` refreshes the provider session; pages still call `requireRole()`.
- Session policy (TASK-025): idle timeout (default 30 min, configurable), 8 h absolute limit,
  a new session on every sign-in, sign-in rate limits.
- MFA (TASK-046): TOTP mandatory for HR Admins; optional TOTP or emailed one-time code for others.
- Versions are resolved from the registry at implementation time and pinned exactly.

## Consequences

- Positive: individual, revocable sign-ins; MFA without building it; e2e keeps running on the
  signed mock adapter without external services.
- Negative: a new runtime dependency and provider configuration per environment; local
  development of the real flow needs `supabase start` (Docker).
- Follow-ups: RLS policies keyed on `auth.uid()` (TASK-042); users are provisioned by invite
  (TASK-043) — no open self-registration.
