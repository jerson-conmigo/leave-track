import type { SqlClient } from "@/lib/db/sql";

/**
 * Notification writers over Postgres (TASK-030). They run on the CALLER's transaction (the
 * leave-request stores pass their `tx`), so the notification exists exactly when the business
 * change commits. Each statement inserts the notifications and their outbox rows together.
 */

/**
 * "Someone requested leave" → every user who may decide it, from the approval rule itself
 * (public.can_decide): the manager, or each OTHER HR Admin for an HR Admin's request.
 */
export async function writeRequestSubmitted(tx: SqlClient, requestId: string): Promise<number> {
  const rows = await tx.query<{ id: string }>(
    `with n as (
       insert into notifications (recipient_id, type, payload)
       select a.id, 'request.submitted',
              jsonb_build_object(
                'requestId', r.id, 'requesterId', u.id, 'requesterName', u.name,
                'leaveType', t.name, 'startDate', r.start_date::text, 'endDate', r.end_date::text,
                'days', r.end_date - r.start_date + 1)
         from leave_requests r
         join users u on u.id = r.user_id
         join leave_types t on t.id = r.leave_type_id
         join users a on public.can_decide(a.id, r.user_id)
        where r.id = $1
       returning id, recipient_id, payload
     )
     insert into notification_outbox (notification_id, recipient_id, idempotency_key, payload)
     select id, recipient_id, 'request.submitted:' || $1::text || ':' || recipient_id, payload
       from n
     returning id`,
    [requestId],
  );
  return rows.length;
}

/** "Your request was approved/rejected" → the requester. */
export async function writeRequestDecided(tx: SqlClient, requestId: string): Promise<number> {
  const rows = await tx.query<{ id: string }>(
    `with n as (
       insert into notifications (recipient_id, type, payload)
       select r.user_id, 'request.decided',
              jsonb_build_object(
                'requestId', r.id, 'decision', r.status::text, 'leaveType', t.name,
                'startDate', r.start_date::text, 'endDate', r.end_date::text,
                'days', r.end_date - r.start_date + 1,
                'decidedByName', d.name, 'reason', r.decision_reason)
         from leave_requests r
         join leave_types t on t.id = r.leave_type_id
         join users d on d.id = r.decided_by
        where r.id = $1 and r.status in ('approved', 'rejected')
       returning id, recipient_id, payload
     )
     insert into notification_outbox (notification_id, recipient_id, idempotency_key, payload)
     select id, recipient_id, 'request.decided:' || $1::text, payload
       from n
     returning id`,
    [requestId],
  );
  return rows.length;
}

/**
 * TASK-028 — "a request was withdrawn / approved leave cancelled" → every user who may decide the
 * requester's leave (public.can_decide), i.e. whoever would have had it in their queue.
 */
export async function writeRequestCancelled(
  tx: SqlClient,
  requestId: string,
  wasApproved: boolean,
): Promise<number> {
  const rows = await tx.query<{ id: string }>(
    `with n as (
       insert into notifications (recipient_id, type, payload)
       select a.id, 'request.cancelled',
              jsonb_build_object(
                'requestId', r.id, 'requesterId', u.id, 'requesterName', u.name,
                'leaveType', t.name, 'startDate', r.start_date::text, 'endDate', r.end_date::text,
                'days', r.end_date - r.start_date + 1, 'wasApproved', $2::boolean)
         from leave_requests r
         join users u on u.id = r.user_id
         join leave_types t on t.id = r.leave_type_id
         join users a on public.can_decide(a.id, r.user_id)
        where r.id = $1
       returning id, recipient_id, payload
     )
     insert into notification_outbox (notification_id, recipient_id, idempotency_key, payload)
     select id, recipient_id, 'request.cancelled:' || $1::text || ':' || recipient_id, payload
       from n
     returning id`,
    [requestId, wasApproved],
  );
  return rows.length;
}

/** TASK-032 — "HR proposed a resolution" → the employee. Runs on the caller's transaction. */
export async function writeResolutionProposed(
  tx: SqlClient,
  resolutionId: string,
): Promise<number> {
  const rows = await tx.query<{ id: string }>(
    `with n as (
       insert into notifications (recipient_id, type, payload)
       select r.user_id, 'resolution.proposed',
              jsonb_build_object(
                'resolutionId', r.id, 'leaveType', t.name,
                'deficit', r.deficit_at_proposal, 'unpaidDays', r.unpaid_days_proposed,
                'recoveryDays', r.recovery_days_proposed,
                'monthlyDeduction', case when r.recovery_days_proposed > 0
                  then round(r.recovery_days_proposed / r.recovery_months, 2) end,
                'recoveryStartPeriod', r.recovery_start_period::text,
                'recoveryMonths', r.recovery_months,
                'respondBy', to_char(r.respond_by at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
         from balance_resolutions r join leave_types t on t.id = r.leave_type_id
        where r.id = $1
       returning id, recipient_id, payload
     )
     insert into notification_outbox (notification_id, recipient_id, idempotency_key, payload)
     select id, recipient_id, 'resolution.proposed:' || $1::text, payload from n
     returning id`,
    [resolutionId],
  );
  return rows.length;
}

/**
 * TASK-033 — a response or HR's final decision. accepted/declined → every HR Admin except the
 * employee; finalized → the employee. Runs on the caller's transaction.
 */
export async function writeResolutionResponse(
  tx: SqlClient,
  resolutionId: string,
  type:
    "resolution.accepted" | "resolution.declined" | "resolution.finalized" | "resolution.expired",
): Promise<number> {
  // accepted/declined → HR; finalized → the employee; expired (TASK-034) → both.
  const audience =
    type === "resolution.finalized" ? "employee" : type === "resolution.expired" ? "both" : "hr";
  const rows = await tx.query<{ id: string }>(
    `with n as (
       insert into notifications (recipient_id, type, payload)
       select rcpt.id, $2,
              jsonb_build_object(
                'resolutionId', r.id, 'employeeId', r.user_id, 'employeeName', u.name,
                'leaveType', t.name,
                'unpaidApplied', r.unpaid_days_applied, 'recoveryApplied', r.recovery_days_applied,
                'reason', coalesce(r.final_reason, r.response_reason),
                'proposalNumber', r.proposal_number)
                - case when $2 = 'resolution.accepted' then array['employeeId', 'reason', 'proposalNumber']
                       when $2 = 'resolution.declined' then array['employeeId', 'unpaidApplied', 'recoveryApplied']
                       when $2 = 'resolution.expired' then array['recoveryApplied', 'reason', 'proposalNumber']
                       else array['employeeId', 'employeeName', 'proposalNumber'] end
         from balance_resolutions r
         join users u on u.id = r.user_id
         join leave_types t on t.id = r.leave_type_id
         join users rcpt on (($3 in ('hr', 'both') and rcpt.role = 'hr_admin' and rcpt.id <> r.user_id)
                             or ($3 in ('employee', 'both') and rcpt.id = r.user_id))
        where r.id = $1
       returning id, recipient_id, payload
     )
     insert into notification_outbox (notification_id, recipient_id, idempotency_key, payload)
     select id, recipient_id, $2 || ':' || $1::text || ':' || recipient_id, payload from n
     returning id`,
    [resolutionId, type, audience],
  );
  return rows.length;
}
