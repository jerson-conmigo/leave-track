# Product Requirements Document — LeaveTrack v1.0

Traces to: `docs/brd/BRD-LeaveTrack-v1.0.md`

## User Roles

- **Employee** — submits requests, views own balance.
- **Manager** — approves/rejects requests for direct reports only.
- **HR Admin** — configures leave policies, runs audit reports.

## User Stories

**US-01 — Submit a Leave Request** _(BR-01)_
As an Employee, I want to submit a leave request with type, start date, end date, and reason, so that my manager can review it without email.

- AC1: Given valid dates and a selected leave type, when I submit, then a request is created with status `pending` and my manager is notified.
- AC2: Given an end date before the start date, when I submit, then the form rejects it with a validation error and no request is created.
- AC3: Given a date range that exceeds my remaining balance for that leave type, when I submit, then I see a warning but may still submit for HR override.

**US-02 — View My Leave Balance** _(BR-03, BR-06)_
As an Employee, I want to see my current balance per leave type, so that I know what I have available before requesting.

- AC1: Given I have an assigned leave policy, when I open my balance page, then I see current balance per leave type, updated as of the last completed monthly accrual.
- AC2: Given a pending request exists, when I view my balance, then the pending amount is shown separately from the confirmed balance (not yet deducted).

**US-03 — Approve or Reject a Request** _(BR-02)_
As a Manager, I want to approve or reject a pending leave request from one of my direct reports, so that the decision is recorded and the employee is notified.

- AC1: Given a pending request from my direct report, when I approve it, then its status becomes `approved`, the employee's balance is decremented, and an audit record is created.
- AC2: Given a pending request from my direct report, when I reject it with a reason, then its status becomes `rejected`, no balance change occurs, and an audit record is created.
- AC3: Given a request from an employee who is NOT my direct report, when I attempt to view or act on it, then the system returns a 403 and the request never appears in my queue.

**US-04 — Manager Sees Only Their Team** _(BR-02)_
As a Manager, I want my request queue to show only my direct reports, so that I never see or act on another team's requests.

- AC1: Given I manage 5 employees, when I open my approvals queue, then I see requests from exactly those 5 and no one else.
- AC2: Given an org-chart change moves an employee to a different manager, when the change takes effect, then the employee's pending requests move to the new manager's queue.

**US-05 — HR Audit Report** _(BR-04)_
As an HR Admin, I want to query the full decision history for any employee or date range, so that I can produce compliance records on request.

- AC1: Given any employee ID, when I run the audit report, then I see every request they've made with status, decision-maker, and timestamp, going back at least 3 years.
- AC2: Given a completed request, when I view its record, then I can see it was never hard-deleted — only soft-deleted records are excluded from active views, never purged.

**US-06 — Mobile-Responsive Submission** _(BR-05)_
As an Employee on a mobile browser, I want to submit and check requests as easily as on desktop, so that I'm not blocked by not having a laptop.

- AC1: Given a viewport of 375px width, when I open the submit-request form, then all fields are usable without horizontal scrolling.
- AC2: Given a mobile browser, when I check my balance, then the page loads and renders correctly without a desktop-only layout.

**US-07 — Monthly Balance Accrual** _(BR-06)_
As the System, I want to accrue leave balances automatically on a monthly schedule, so that HR never has to update balances by hand.

- AC1: Given an employee's assigned policy grants 1.25 days/month for Vacation, when the monthly accrual job runs, then their Vacation balance increases by exactly 1.25 days.
- AC2: Given the accrual job has already run for the current month, when it is triggered again, then it does not double-accrue (idempotent).

**US-08 — Independently Tracked Leave Types** _(BR-07)_
As an Employee, I want Vacation, Sick, and Unpaid tracked separately, so that using one doesn't affect the others.

- AC1: Given I request Sick leave, when it's approved, then only my Sick balance is decremented — Vacation and Unpaid are unaffected.
- AC2: Given Unpaid leave has no balance policy, when I request it, then no balance check blocks the submission.

## Non-Functional Requirements

- p95 API response time under 500ms for balance and request-list endpoints.
- All approval-affecting endpoints require an authenticated session; scoped-visibility (US-03 AC3, US-04) is enforced server-side, never client-side only.

## Out of Scope

- Everything in the BRD's Out of Scope section: payroll integration, multi-country holiday calendars, biometric attendance.

---

## Revision v1.1 — EPIC 2 (2026-11-26)

US-01 – US-08 (EPIC 1) are complete and unchanged above. Tasks: `docs/dev-tasks/epic-2-hardening-and-resolution-tasks.csv`.
Architecture: `docs/arch-docs/ARCH-LeaveTrack-v1.0.md` (Revision v1.1) and ADR-LeaveTrack-E004 – E007.

### User Roles (additions)

- **HR Admin** — additionally resolves negative balances, approves leave for managers who report
  to HR and for other HR Admins, administers users, policies and settings, approves email changes.
- **System** — runs the accrual, resolution-expiry and notification jobs.

### Business Rules (EPIC 2)

- **R-01 Approver resolution (BR-10).** Approver = the requester's manager. A manager whose
  manager is an HR Admin is approved by that HR Admin. An HR Admin with no manager is approved
  by any *other* HR Admin. Nobody decides their own request. If no eligible approver exists,
  submission is refused (409). Scoping is enforced in SQL.
- **R-02 Resolution scope (BR-08).** Resolutions apply to one employee and one *tracked* leave
  type with a balance below zero. Vacation and Sick are always resolved independently; Unpaid
  never has a balance or resolution.
- **R-03 Resolution amounts.** `unpaid_days + recovery_days` equals the deficit at proposal.
  Recovery starts next month or at the next leave year (1 January) and runs 1–12 months; the
  monthly deduction may not exceed the employee's current accrual rate for that type.
- **R-04 Clamping.** When a resolution is applied, amounts are limited to the deficit at that
  moment (`max(0, −balance)`); proposed and applied amounts are both recorded. A balance that
  recovered in the meantime is never over-credited.
- **R-05 Response deadline.** The employee has `resolution_response_days` (default 3 calendar
  days, configurable 1–14) from the proposal; the deadline is fixed on the proposal. After it,
  responses are refused and the deficit is converted to Unpaid automatically.
- **R-06 Decline process.** A decline needs a reason (3–500 characters) and returns the
  resolution to HR. HR may re-propose once; after a second decline HR makes a binding final
  decision with a reason. A declined resolution with no HR action triggers a daily reminder to HR.
- **R-07 One open resolution.** At most one open resolution per employee and leave type.
- **R-08 Exactly once.** Every status change is a guarded transition; each recovery period is
  deducted once (including accrual catch-up); every action, balance change, event and
  notification is written in one transaction.
- **R-09 Warn, don't block.** A negative balance or an open resolution never blocks a new
  request (US-01 AC3 still applies); the employee sees an extra warning.
- **R-10 Request integrity (BR-13).** No overlapping pending/approved requests by the same
  employee; maximum length 90 calendar days; start dates in the past only for Sick leave, at
  most 30 days back. Pending requests can be withdrawn; approved leave can be cancelled by the
  employee before its start date (balance restored, manager notified).

### User Stories (EPIC 2)

**US-09 — HR Proposes a Negative-Balance Resolution** _(BR-08)_
As an HR Admin, I want to propose how an employee's negative balance is resolved, so that
deficits are handled consistently and with the employee's consent.

- AC1: Given balances across leave types, when I open the resolution queue, then only tracked types with a balance below 0 and no open resolution appear under "Needs proposal".
- AC2: Given a deficit of D days, when I propose, then unpaid + recovery days must equal D and the monthly recovery may not exceed the accrual rate, otherwise the proposal is rejected with a validation error.
- AC3: Given an open resolution for that employee and leave type, when I propose another, then it is refused (409).
- AC4: Given a valid proposal, when I submit it, then the resolution, its event row and the employee notification are written in one transaction, with a response deadline fixed on the proposal.
- AC5: Given I am not an HR Admin, or the balance is my own, when I try to propose, then I get 403.

**US-10 — Employee Responds to a Resolution** _(BR-08)_
As an Employee, I want to accept or decline a proposed resolution, so that nothing changes my
leave without my agreement.

- AC1: Given an open proposal before its deadline, when I accept, then the clamped amounts are applied (balance credited, conversion or recovery schedule recorded) and HR is notified.
- AC2: Given an open proposal, when I decline, then a reason of 3–500 characters is required and the resolution moves to HR review; on a second decline HR must make a final decision.
- AC3: Given the deadline has passed, when I try to respond, then I get 409 and the proposal is shown read-only.
- AC4: Given two accept requests at the same time, when both are processed, then the resolution is applied exactly once.

**US-11 — Automatic Conversion at the Deadline** _(BR-08)_
As the System, I want unanswered proposals converted to Unpaid at the deadline, so that no
resolution stays open indefinitely.

- AC1: Given a proposal past its deadline, when the expiry job runs (or the proposal is next read), then the deficit is converted to Unpaid and the resolution is closed.
- AC2: Given the job already processed a proposal, when it runs again, then nothing changes.
- AC3: Given an automatic conversion, when it completes, then the employee and HR are both notified.
- AC4: Given an expiry racing an employee's accept, when both run, then exactly one outcome is applied.

**US-12 — Recovery from Future Accruals** _(BR-08, BR-06)_
As an Employee, I want an agreed deficit recovered from my future accruals on a known schedule,
so that I can plan around it.

- AC1: Given an accepted recovery schedule, when each scheduled monthly accrual runs (including catch-up of missed months), then that period's amount is deducted exactly once.
- AC2: Given a Vacation recovery, when it is deducted, then Sick and Unpaid are unaffected.
- AC3: Given a recovery schedule, when I view my balance, then I see the upcoming deductions.
- AC4: Given a later policy change, when deductions are applied, then the agreed schedule amounts are unchanged.

**US-13 — Secure Sign-in and Sessions** _(BR-09)_
- AC1: Given valid credentials from the identity provider, when I sign in, then a signed session is created and my role is read from the users table.
- AC2: Given a tampered or forged session cookie, when I make any request, then it is rejected as unauthenticated.
- AC3: Given no activity for the configured idle timeout (default 30 minutes) or 8 hours since sign-in, when I make a request, then I must sign in again.
- AC4: Given a deployed environment (APP_ENV production/staging or VERCEL_ENV production/preview), when the mock sign-in or a required secret is configured/missing, then the app refuses to start.

**US-14 — Multi-Factor Authentication** _(BR-09)_
- AC1: Given I am an HR Admin, when I sign in, then I must complete an authenticator-app (TOTP) challenge, enrolling by QR code on first use.
- AC2: Given I am an Employee or Manager, when I enable MFA or sign in with an emailed one-time code, then the session is created only after the code is verified.

**US-15 — Approval Routing for Managers and HR Admins** _(BR-10)_
- AC1: Given a manager who reports to an HR Admin, when they submit, then the request appears in that HR Admin's approvals queue and nowhere else.
- AC2: Given an HR Admin submits, when another HR Admin opens approvals, then they can decide it; the requester cannot.
- AC3: Given a requester with no eligible approver, when they submit, then the request is refused (409) and nothing is created.
- AC4: Given a pending request, when the employee views it, then they see who it is awaiting.
- AC5: Given an org-chart change moves an employee, when it takes effect, then their pending requests move to the new approver's queue (US-04 AC2).

**US-16 — Request Integrity and Withdrawal** _(BR-13)_
- AC1: Given an existing pending or approved request, when I submit one with overlapping dates, then it is rejected with a validation error.
- AC2: Given a range longer than 90 days, or a past start date (other than Sick ≤ 30 days back), when I submit, then it is rejected.
- AC3: Given my pending request, when I withdraw it, then it becomes `cancelled` with an audit row and leaves my approver's queue.
- AC4: Given my approved leave that has not started, when I cancel it, then my balance is restored in the same transaction, an audit row is written and my manager is notified.

**US-17 — Notifications and Nudges** _(BR-11)_
- AC1: Given a notifiable event, when the business action commits, then an in-app notification and an outbox entry are written in the same transaction.
- AC2: Given an outbox entry, when the dispatcher runs, then the email is sent at least once and duplicates are suppressed by an idempotency key.
- AC3: Given an email failure, when it happens, then it is retried with backoff and never undoes the business action.
- AC4: Given a request pending longer than 3 days or a resolution 24 hours from its deadline, when the nudge job runs, then the approver or employee is reminded once per day at most.

**US-18 — Policy and Settings Administration** _(BR-12)_
- AC1: Given I am an HR Admin, when I change an accrual rate with an effective month, then the previous rate is kept and accrual uses the rate in effect for each month.
- AC2: Given I change the response deadline, idle timeout or maximum request length, when I save, then the value is validated, audited and applies only to new proposals/sessions/requests.

**US-19 — User Administration** _(BR-14)_
- AC1: Given I am an HR Admin, when I change a user's role, manager or active status, then the change is audited and takes effect on the user's next request.
- AC2: Given the change would remove the last HR Admin, demote myself, or create a manager cycle, when I save, then it is refused.

**US-20 — Profile, Password and Email Change** _(BR-14)_
- AC1: Given I am signed in, when I change my password, then I must re-enter my current password.
- AC2: Given I request a new email address, when HR approves it and I confirm from the new address, then it becomes my sign-in email; each step is audited.

**US-21 — Analytics and Balance Graphs** _(BR-15)_
- AC1: Given my role, when I open analytics, then I see leave usage by type and month and balance trends for exactly the people I may see (own / direct reports / organisation), scoped in SQL.

**US-22 — Leave Calendar** _(BR-15)_
- AC1: Given my role, when I open the calendar, then I see approved and pending leave by day for my scope, as a list on mobile, operable by keyboard.

**US-23 — Search, Filtering and CSV Export** _(BR-15, BR-04)_
- AC1: Given filters (person, type, status, dates), when I search requests, approvals or the audit log, then results are scoped, paginated by cursor and stable.
- AC2: Given I am an HR Admin, when I export, then a CSV of the filtered rows downloads, spreadsheet-formula characters are escaped, and the export is audited.

**US-24 — Light/Dark Theme and Role Accents** _(BR-05)_
- AC1: Given a theme choice (light, dark, system), when pages render, then they use it without a flash of the wrong theme and meet WCAG AA contrast in both.
- AC2: Given my role, when I use the app, then a role accent colour identifies the context without being the only cue.

### Non-Functional Requirements (additions)

- Background jobs (accrual, resolution expiry, notifications) are idempotent and safe under duplicate, overlapping and missed runs.
- Notifications are delivered at least once; business actions never depend on delivery.
- Production refuses to start without `DATABASE_URL`, auth secrets and `CRON_SECRET`.

### Out of Scope (additions)

- Payroll export of converted Unpaid days with specific dates (conversion is recorded in days only).
