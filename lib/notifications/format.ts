import { formatDate, formatDateRange, formatDays } from "@/lib/format";
import type { Notification } from "@/lib/notifications/types";

/**
 * TASK-030 — the sentence and destination for a notification. Pure; the inbox renders the text as
 * escaped React text (payloads hold names and dates only).
 */
export function notificationText(n: Notification): string {
  if (n.type === "resolution.proposed") {
    const r = n.payload;
    const parts = [
      r.unpaidDays > 0 ? `${formatDays(r.unpaidDays)} converted to Unpaid` : null,
      r.recoveryDays > 0 && r.monthlyDeduction !== null
        ? `${formatDays(r.recoveryDays)} recovered at ${formatDays(r.monthlyDeduction)} a month`
        : null,
    ].filter(Boolean);
    return `HR proposed how to resolve your ${r.leaveType} deficit of ${formatDays(r.deficit)}: ${parts.join(" and ")}. Please respond by ${formatDate(r.respondBy)}.`;
  }
  if (n.type === "resolution.accepted") {
    const r = n.payload;
    return `${r.employeeName} accepted the ${r.leaveType} resolution: ${appliedText(r.unpaidApplied, r.recoveryApplied)}.`;
  }
  if (n.type === "resolution.declined") {
    const r = n.payload;
    const next = r.proposalNumber >= 2 ? "A final decision is needed." : "You can re-propose once.";
    return `${r.employeeName} declined the ${r.leaveType} resolution. Reason: ${r.reason} ${next}`;
  }
  if (n.type === "resolution.expired") {
    const r = n.payload;
    const what =
      r.unpaidApplied > 0
        ? `${formatDays(r.unpaidApplied)} converted to Unpaid`
        : "nothing was left to convert";
    return n.recipientId === r.employeeId
      ? `Your ${r.leaveType} resolution wasn't answered by the deadline: ${what}.`
      : `${r.employeeName}'s ${r.leaveType} resolution wasn't answered by the deadline: ${what}.`;
  }
  if (n.type === "resolution.finalized") {
    const r = n.payload;
    return `HR made a final decision on your ${r.leaveType} deficit: ${appliedText(r.unpaidApplied, r.recoveryApplied)}. Reason: ${r.reason}`;
  }
  const p = n.payload;
  const when = formatDateRange(p.startDate, p.endDate);
  if (n.type === "request.submitted") {
    const s = n.payload;
    return `${s.requesterName} requested ${formatDays(s.days)} of ${s.leaveType} (${when}).`;
  }
  if (n.type === "request.cancelled") {
    const c = n.payload;
    return c.wasApproved
      ? `${c.requesterName} cancelled approved ${c.leaveType} leave (${when}); ${formatDays(c.days)} went back to the balance.`
      : `${c.requesterName} withdrew a ${c.leaveType} request (${when}).`;
  }
  const d = n.payload;
  const verb = d.decision === "approved" ? "approved" : "rejected";
  const reason = d.reason ? ` Reason: ${d.reason}` : "";
  return `Your ${d.leaveType} request (${when}) was ${verb} by ${d.decidedByName}.${reason}`;
}

function appliedText(unpaid: number, recovery: number): string {
  const parts = [
    unpaid > 0 ? `${formatDays(unpaid)} converted to Unpaid` : null,
    recovery > 0 ? `${formatDays(recovery)} to be recovered from accruals` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" and ") : "nothing left to resolve";
}

/** Where acting on it happens: approvers go to Approvals, requesters to My requests. */
export function notificationHref(n: Notification): string {
  if (n.type === "resolution.proposed" || n.type === "resolution.finalized") return "/balance";
  if (n.type === "resolution.expired") {
    return n.recipientId === n.payload.employeeId ? "/balance" : "/resolutions?tab=history";
  }
  if (n.type === "resolution.accepted") return "/resolutions?tab=history";
  if (n.type === "resolution.declined") return "/resolutions?tab=declined";
  return n.type === "request.decided" ? "/requests" : "/approvals";
}

/** The bell's accessible name — the count is in words, never only a coloured dot. */
export function bellLabel(unread: number): string {
  if (unread <= 0) return "Notifications";
  return `Notifications, ${unread} unread`;
}

/** The bell's visible badge text (capped so it fits). */
export function bellBadge(unread: number): string | null {
  if (unread <= 0) return null;
  return unread > 9 ? "9+" : String(unread);
}
