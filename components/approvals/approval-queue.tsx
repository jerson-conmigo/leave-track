"use client";

import { Check, ClipboardCheck, TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DecisionDialog, type Decision } from "@/components/approvals/decision-dialog";
import { EmptyState } from "@/components/leave/empty-state";
import { LeaveTypeBadge } from "@/components/leave/leave-type-badge";
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
import { mockSubmit } from "@/lib/data/mock/actions";
import type { ActionResult, RequestStatus, TeamRequestView } from "@/lib/data/types";
import { formatDate, formatDateRange, formatDays } from "@/lib/format";

type ApprovalQueueProps = {
  /** Already scoped server-side to the manager's direct reports (BR-02). */
  requests: TeamRequestView[];
  /** Day 0 default persists nothing; Day 1 passes the TASK-014 server action. */
  onDecide?: (requestId: string, decision: Decision, reason?: string) => Promise<ActionResult>;
};

function BalanceHint({ r }: { r: TeamRequestView }) {
  if (r.balanceAvailable === null)
    return <span className="text-muted-foreground">Not tracked</span>;
  const over = r.days > r.balanceAvailable;
  return (
    <span
      className={
        over
          ? "inline-flex items-center gap-1 font-medium text-status-pending-foreground"
          : undefined
      }
    >
      {over ? <TriangleAlert className="size-4" aria-hidden /> : null}
      {formatDays(r.balanceAvailable)} available
      {over ? <span className="sr-only"> — request exceeds balance</span> : null}
    </span>
  );
}

export function ApprovalQueue({ requests, onDecide = mockSubmit }: ApprovalQueueProps) {
  const [decided, setDecided] = useState<Record<string, RequestStatus>>({});
  const [active, setActive] = useState<{ request: TeamRequestView; decision: Decision } | null>(
    null,
  );

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="You're all caught up"
        description="There are no pending leave requests from your direct reports."
      />
    );
  }

  const open = (request: TeamRequestView, decision: Decision) => setActive({ request, decision });

  async function confirm(reason?: string): Promise<ActionResult> {
    if (!active)
      return { success: false, error: { code: "INTERNAL_ERROR", message: "No request selected." } };
    const { request, decision } = active;
    const result = await onDecide(request.id, decision, reason);
    if (result.success) {
      setDecided((d) => ({ ...d, [request.id]: decision === "approve" ? "approved" : "rejected" }));
      const title = `${decision === "approve" ? "Approved" : "Rejected"} ${request.employee.name}'s request`;
      const negative = result.warnings?.find((w) => w.code === "NEGATIVE_BALANCE");
      if (negative) {
        // Warn, don't block: the approval went through but left a negative balance.
        toast.warning(title, { description: negative.message });
      } else {
        toast.success(title, { description: `${request.employee.name} has been notified.` });
      }
    }
    return result;
  }

  const actions = (r: TeamRequestView, size: "default" | "sm") => {
    const status = decided[r.id] ?? r.status;
    if (status !== "pending") return <StatusBadge status={status} />;
    return (
      <div className="flex gap-2">
        <Button
          size={size}
          onClick={() => open(r, "approve")}
          aria-label={`Approve ${r.employee.name}'s request`}
        >
          <Check aria-hidden />
          Approve
        </Button>
        <Button
          size={size}
          variant="outline"
          onClick={() => open(r, "reject")}
          aria-label={`Reject ${r.employee.name}'s request`}
        >
          <X aria-hidden />
          Reject
        </Button>
      </div>
    );
  };

  return (
    <>
      <ul aria-label="Pending requests from your team" className="flex flex-col gap-3 md:hidden">
        {requests.map((r) => (
          <li key={r.id} className="rounded-lg border bg-card p-4 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{r.employee.name}</p>
                <p className="text-xs text-muted-foreground">Requested {formatDate(r.createdAt)}</p>
              </div>
              <LeaveTypeBadge type={r.leaveType} />
            </div>
            <p className="mt-3 text-sm font-medium">
              {formatDateRange(r.startDate, r.endDate)} · {formatDays(r.days)}
            </p>
            <p className="mt-1 text-sm">
              <BalanceHint r={r} />
            </p>
            <p className="mt-2 text-sm break-words text-muted-foreground">{r.reason}</p>
            <div className="mt-4 [&_button]:flex-1 [&>div]:flex">{actions(r, "default")}</div>
          </li>
        ))}
      </ul>

      <div className="hidden rounded-lg border bg-card shadow-xs md:block">
        <Table aria-label="Pending requests from your team">
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Decision</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <p className="font-medium">{r.employee.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                </TableCell>
                <TableCell>
                  <LeaveTypeBadge type={r.leaveType} />
                </TableCell>
                <TableCell>
                  <p className="font-medium">{formatDateRange(r.startDate, r.endDate)}</p>
                  <p className="text-xs text-muted-foreground">{formatDays(r.days)}</p>
                </TableCell>
                <TableCell className="text-sm">
                  <BalanceHint r={r} />
                </TableCell>
                <TableCell className="max-w-56 truncate" title={r.reason}>
                  {r.reason}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">{actions(r, "sm")}</div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DecisionDialog
        request={active?.request ?? null}
        decision={active?.decision ?? "approve"}
        open={active !== null}
        onOpenChange={(o) => {
          if (!o) setActive(null);
        }}
        onConfirm={confirm}
      />
    </>
  );
}
