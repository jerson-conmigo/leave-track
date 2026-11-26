# ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR

**Status:** Proposed (EPIC 2 plan, 2026-11-26) — needs architect sign-off.
**Tasks:** TASK-026 · **Stories:** US-15 (and US-03/US-04 regression) · **BR-10**, BR-02

## Context

Confirmed in the EPIC 2 evaluation (backlog B2): managers report to an HR Admin, but
`/approvals` is manager-only, so managers' leave can never be decided. HR Admins have no
manager, so their own requests are created and stay pending forever. BR-02 requires scoping
to be enforced in SQL.

## Decision

- **Approver = `users.manager_id`**, as today. HR Admins may open `/approvals`; the existing SQL
  scope (`u.manager_id = :actor`) already limits them to their direct reports (the managers).
- **HR Admins without a manager** are approved by **any other HR Admin**. The decide and queue
  queries gain one SQL branch: requester is `hr_admin` with no manager, actor is `hr_admin`,
  and actor ≠ requester. No application-side filtering.
- **No self-decisions:** a database trigger rejects `decided_by = user_id`, in addition to the SQL scope.
- **No orphan requests:** submit resolves the approver first; if none is eligible (e.g. the only
  HR Admin), it returns 409 and creates nothing.
- **Visibility:** pending requests show "Awaiting <approver>" (or "Awaiting HR"), from the same resolution.
- Org-chart changes move pending requests automatically because scoping reads the current
  `manager_id` (US-04 AC2) — now covered by an explicit test.

## Consequences

- Positive: every request has an approver; one routing rule in SQL; no new tables.
- Negative: in organisations with a single HR Admin, that person cannot request leave until a
  second HR Admin or a manager is assigned (D2) — surfaced as a clear error.
- Regression focus: the manager-scope structural tests, the approvals e2e, `decide.ts` and both stores.
