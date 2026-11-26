# Business Requirements Document — LeaveTrack v1.0

## Executive Summary

LeaveTrack replaces an email-and-spreadsheet leave process with a self-service system: employees submit and track leave requests, managers approve for their own team only, and HR gets an auditable record ahead of the Q3 compliance audit.

## Business Context

Leave requests currently move by email and a shared spreadsheet. Managers report being blindsided by approvals they never saw; HR has no reliable record of who approved what, which Legal has flagged as a compliance gap. Employees have no way to check their own balance without asking HR directly.

## Stakeholders

| Stakeholder                                  | Concern                                                      |
| -------------------------------------------- | ------------------------------------------------------------ |
| Employees (~800 staff, ~30% without laptops) | Submit requests and see their balance without contacting HR  |
| Managers                                     | See and decide on requests only for their own direct reports |
| HR Administrators                            | An auditable, queryable record of every decision             |
| Legal / Compliance                           | Retained approval records ahead of the Q3 audit              |

## Scope

### In Scope

- BR-01 through BR-07 below.

### Out of Scope

- Payroll system integration.
- Multi-country public-holiday calendars.
- Biometric or badge-based attendance tracking.

## Functional Requirements

**BR-01 — Leave Request Submission.** Employees must be able to submit a leave request specifying leave type, start date, end date, and a reason, so that leave is tracked in one system instead of email and spreadsheets.

**BR-02 — Scoped Manager Approval.** Managers must be able to view and approve or reject leave requests only from their own direct reports — never the full staff list.

**BR-03 — Self-Service Balance Visibility.** Employees must be able to view their current leave balance, by leave type, at any time without contacting HR.

**BR-04 — Auditable Decision Record.** Every leave request decision (submitted, approved, rejected, by whom, and when) must be recorded and retained for a minimum of 3 years, to satisfy the compliance requirement Legal raised ahead of the Q3 audit.

**BR-05 — Mobile Accessibility.** The system must be fully usable on a mobile browser, since roughly 30% of the 800-person staff do not have a company laptop.

**BR-06 — Automatic Balance Accrual.** Leave balances must accrue automatically on a monthly cycle, based on each employee's assigned leave policy (e.g., 1.25 days/month for full-time staff), without manual HR intervention.

**BR-07 — Independently Tracked Leave Types.** The system must support at least three leave types — Vacation, Sick, and Unpaid — each with its own independently tracked balance where applicable (Unpaid has no balance to track).

## Non-Functional Requirements

- Must be in production before the Q3 compliance audit.
- Must support 800 concurrent staff without degradation.
- Decision records retained for 3+ years (BR-04) — no hard-delete on leave requests or approvals.

## Constraints

- Timeline: production-ready before Q3.
- Staff size: ~800, roughly 30% mobile-only.
- Compliance: 3-year minimum retention on approval records.

## Assumptions

- Each employee has exactly one manager for approval-routing purposes.
- Leave policies (accrual rate per leave type) are configured by HR, not self-service.

## Risks

- If accrual logic (BR-06) is wrong, every employee's balance is wrong — this requirement needs the tightest acceptance criteria and the most test coverage.
- Scoped approval (BR-02) is a security-relevant requirement: a manager seeing another team's requests is a data-exposure incident, not a cosmetic bug.

## Success Criteria

- 100% of leave requests move through LeaveTrack, zero through email/spreadsheet, within one month of launch.
- HR can produce a complete, dated approval record for any employee within one query, at any time.
- Zero cross-team visibility incidents in the first quarter post-launch.

---

## Revision v1.1 — EPIC 2 (2026-11-26)

EPIC 1 (BR-01 – BR-07) is complete and unchanged above. EPIC 2 makes LeaveTrack safe to deploy
to real staff, closes the approval-chain and negative-balance gaps found in the EPIC 2
evaluation, and adds the administration and reporting features HR asked for.

### EPIC 2 Objectives

1. Replace the Day 0 mock sign-in with real authentication before any deployment staff can reach.
2. Guarantee every leave request has an eligible approver (managers and HR Admins included).
3. Give HR a controlled, auditable way to resolve negative balances with the employee's consent.
4. Deliver real notifications, request-integrity rules, policy/user administration and reporting.

### Additional Stakeholder Concerns

| Stakeholder        | Concern                                                                       |
| ------------------ | ----------------------------------------------------------------------------- |
| HR Administrators  | Resolve negative balances fairly; administer users, policies and settings     |
| Employees          | Be told — and agree — before a negative balance is converted or recovered     |
| Legal / Compliance | Every resolution, consent, automatic conversion and admin change is auditable |
| IT / Security      | No shared or forgeable sign-in; MFA for privileged users                      |

### Additional Functional Requirements

**BR-08 — Negative Balance Resolution.** When an employee's balance for a tracked leave type
is negative, HR must be able to propose a resolution — convert the excess to Unpaid leave,
recover it from future accruals, or a split of both. The employee must be notified and may
accept or decline (with a reason). A declined proposal returns to HR for review. If the
employee does not respond within the response deadline (default 3 calendar days), the excess
is converted to Unpaid automatically and both parties are notified. No resolution may remain
open indefinitely, and no deficit may be deducted twice.

**BR-09 — Authentication and Session Security.** Staff must sign in with individual
credentials through a real identity provider; sessions must be tamper-proof, expire after
inactivity and after an absolute limit, and privileged users (HR Admins) must use MFA.

**BR-10 — Complete Approval Chain.** Every leave request must have an eligible approver:
an employee's manager, an HR Admin for managers who report to HR, and another HR Admin for
HR Admins. No one may decide their own request. A request that would have no approver must
not be created.

**BR-11 — Notifications.** Employees, managers and HR must be notified of events that need
their attention (submitted, decided, resolution proposed/answered/expired, reminders),
in-app and by email. A failed notification must never undo the business action.

**BR-12 — Policy and Settings Administration.** HR must be able to change accrual rates with
an effective date (history kept) and configure operational settings (resolution response
deadline, inactivity timeout, maximum request length).

**BR-13 — Request Integrity.** The system must prevent overlapping requests by the same
employee, enforce a maximum request length and past-date rules, and let employees withdraw
pending requests or cancel approved leave before it starts.

**BR-14 — User Administration.** HR Admins must be able to manage users' roles, managers and
active status, and approve email-address changes; users must be able to manage their profile
and password. Every change is audited and at least one HR Admin must always exist.

**BR-15 — Reporting.** HR and managers must have analytics, a leave calendar, search and
filtering, and CSV export — each scoped to what the viewer is allowed to see.

### Updated Scope

- In scope: BR-01 through BR-15.
- Still out of scope: payroll integration, multi-country holiday calendars, biometric attendance.
- Considered and not adopted: a client-side data cache (React Query) and an application
  Docker image — see `docs/arch-docs/ARCH-LeaveTrack-v1.0.md` (Revision v1.1).

### Updated Assumptions

- Each employee has exactly one approver resolved by BR-10 (replaces the v1.0 assumption that
  everyone has a manager).
- The leave year is the calendar year (1 January – 31 December).
- Leave length is counted in calendar days until a business-day rule is decided (open question).

### Additional Risks

- Negative-balance resolution touches balances and the accrual job (BR-06): it needs the same
  strict acceptance criteria and concurrency testing as accrual itself.
- Replacing authentication touches every page and API; it must ship behind regression tests
  for role scoping (BR-02) and must never fall back to the mock sign-in in production.

### Additional Success Criteria

- Zero sign-ins through shared or forgeable sessions after launch; 100% of HR Admins enrolled in MFA.
- Every leave request has an approver; zero requests stuck pending with no eligible approver.
- Every negative balance is resolved (accepted, finalized or auto-converted) within its deadline,
  with a complete audit trail.
