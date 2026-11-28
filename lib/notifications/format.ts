import { formatDateRange, formatDays } from "@/lib/format";
import type { Notification } from "@/lib/notifications/types";

/**
 * TASK-030 — the sentence and destination for a notification. Pure; the inbox renders the text as
 * escaped React text (payloads hold names and dates only).
 */
export function notificationText(n: Notification): string {
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

/** Where acting on it happens: approvers go to Approvals, requesters to My requests. */
export function notificationHref(n: Notification): string {
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
