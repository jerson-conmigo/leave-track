# Retro — Day 0 scaffold (2026-11-24)

## What went well

- Arch doc + ADR-E001 were precise enough to scaffold auth/guard shape with no guesswork.
- Single route→role matrix (`lib/auth/roles.ts`) kept proxy, page guards, and nav consistent.
- Validation found 7 real defects before any Day 1 work built on them (see "Fixed in VALIDATE").

## Fixed in VALIDATE

1. Seed failed on Postgres (`UNION ALL` literal typed as text → timestamptz column).
2. Hydration error #418 on /approvals (ICU Unicode spaces differ Node vs Chrome).
3. OS dark mode half-themed the light UI (Tailwind v4 `dark:` → prefers-color-scheme).
4. Vacation badge contrast 4.34:1 < AA → token darkened to `199 89% 31%` (5.50:1).
5. Manager balance hint double-counted the request under review.
6. 16 touch targets < 44px at mobile widths.
7. 4 FK columns without indexes; outdated majors (`@hookform/resolvers` 7, TypeScript 6.0,
   Supabase CLI 3) upgraded; v3 `config.toml` regenerated.

## Backlog (deferred, owner = Day 1 team)

| #   | Item                                                                                                                                                                                                         | Why deferred / trigger                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| B1  | ~~Rejection reason has no column.~~ **Resolved in TASK-010:** `leave_requests.decision_reason`, required when rejected (DB check), NULL while pending.                                                       | —                                                         |
| B2  | **Who approves a manager's own leave?** Ben/Maya report to Carla (`hr_admin`), who has no approvals queue.                                                                                                   | Product question for PRD owner before TASK-013/014.       |
| B3  | Write **ADR-LeaveTrack-E002** (accrual idempotency) — referenced by ARCH, missing. `accrual_runs` implements the proposed approach.                                                                          | Before TASK-017.                                          |
| B4  | `vercel.json` cron entry for `/api/jobs/accrual` + `CRON_SECRET` check.                                                                                                                                      | Route doesn't exist until TASK-017.                       |
| B5  | Business-day vs calendar-day counting (`countDays` in `lib/format.ts`).                                                                                                                                      | Product decision, TASK-011.                               |
| B6  | Manager notification channel (US-01 AC1 "manager is notified").                                                                                                                                              | No channel in ARCH.                                       |
| B7  | RLS policies (RLS is enabled, deny-all).                                                                                                                                                                     | Needs real auth (Day 1).                                  |
| B8  | TypeScript 7 upgrade.                                                                                                                                                                                        | Blocked: typescript-eslint supports `<6.1`.               |
| B9  | ESLint 10 peer warnings from `eslint-plugin-react` / `eslint-plugin-import` (declare ≤9). Lint works.                                                                                                        | Upgrade when plugins publish v10 support.                 |
| B10 | Nonce-based CSP (drop `'unsafe-inline'` on `script-src`).                                                                                                                                                    | Hardening.                                                |
| B11 | Dark mode (`next-themes` + `.dark` tokens).                                                                                                                                                                  | Not required by PRD.                                      |
| B12 | Migration/seed verified on PGlite (Postgres 17) — now automated in `tests/db/schema.test.ts` — but never on a real Supabase instance. Run `npx supabase start && npm run db:reset` once Docker is available. | Docker daemon still not running at TASK-010 (2026-11-24). |
