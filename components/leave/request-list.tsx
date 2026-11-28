import { CalendarPlus, ListChecks } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/leave/empty-state";
import { LeaveTypeBadge } from "@/components/leave/leave-type-badge";
import { CancelRequestButton } from "@/components/leave/cancel-request-button";
import { StatusBadge } from "@/components/leave/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ActionResult, LeaveRequestView } from "@/lib/data/types";
import { formatDate, formatDateRange, formatDays } from "@/lib/format";

type RequestListProps = {
  requests: LeaveRequestView[];
  /** TASK-028: server action to withdraw / cancel; when omitted, no buttons are shown. */
  onCancel?: (requestId: string) => Promise<ActionResult>;
  /** Accessible name for the list/table. */
  label?: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

/** An employee's own requests: stacked cards below md, a table from md up. */
export function RequestList({
  requests,
  onCancel,
  label = "My leave requests",
  emptyTitle = "No leave requests yet",
  emptyDescription = "When you request time off, it shows up here with its approval status.",
}: RequestListProps) {
  if (requests.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title={emptyTitle}
        description={emptyDescription}
        action={
          <Button asChild>
            <Link href="/requests/new">
              <CalendarPlus aria-hidden />
              New request
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <ul aria-label={label} className="flex flex-col gap-3 md:hidden">
        {requests.map((r) => (
          <li key={r.id} className="rounded-lg border bg-card p-4 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <LeaveTypeBadge type={r.leaveType} />
              <StatusBadge status={r.status} />
            </div>
            <p className="mt-3 font-medium">{formatDateRange(r.startDate, r.endDate)}</p>
            <p className="text-sm text-muted-foreground">{formatDays(r.days)}</p>
            <p className="mt-2 text-sm break-words">{r.reason}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Requested {formatDate(r.createdAt)}
              {r.decidedByName && r.decidedAt
                ? ` · ${r.status === "approved" ? "Approved" : "Rejected"} by ${r.decidedByName}`
                : ""}
              {r.status === "pending" && r.awaiting ? ` · Awaiting ${r.awaiting}` : ""}
            </p>
            {onCancel && r.cancellable ? (
              <div className="mt-3">
                <CancelRequestButton request={r} onCancel={onCancel} />
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="hidden rounded-lg border bg-card shadow-xs md:block">
        <Table aria-label={label}>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="text-right">Days</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approver</TableHead>
              {onCancel ? (
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <LeaveTypeBadge type={r.leaveType} />
                </TableCell>
                <TableCell className="font-medium">
                  {formatDateRange(r.startDate, r.endDate)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{r.days}</TableCell>
                <TableCell className="max-w-64 truncate" title={r.reason}>
                  {r.reason}
                </TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.status === "pending" && r.awaiting
                    ? `Awaiting ${r.awaiting}`
                    : (r.decidedByName ?? "—")}
                </TableCell>
                {onCancel ? (
                  <TableCell className="text-right">
                    {r.cancellable ? <CancelRequestButton request={r} onCancel={onCancel} /> : null}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
