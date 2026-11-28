import { Scale } from "lucide-react";
import { EmptyState } from "@/components/leave/empty-state";
import { LeaveTypeBadge } from "@/components/leave/leave-type-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatDays, formatMonth } from "@/lib/format";
import type { ResolutionStatus, ResolutionView } from "@/lib/resolutions/types";

const STATUS_LABEL: Record<ResolutionStatus, string> = {
  proposed: "Awaiting employee",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  withdrawn: "Withdrawn",
  superseded: "Superseded",
  finalized: "Finalized",
};

function plan(r: ResolutionView): string {
  const parts = [
    r.unpaidDays > 0 ? `${formatDays(r.unpaidDays)} unpaid` : null,
    r.recoveryDays > 0 && r.monthlyDeduction !== null && r.recoveryStartPeriod
      ? `${formatDays(r.recoveryDays)} recovered (${formatDays(r.monthlyDeduction)}/mo from ${formatMonth(r.recoveryStartPeriod)})`
      : null,
  ];
  return parts.filter(Boolean).join(" + ");
}

/** A read-only list of resolutions for one tab (status always as text, never colour alone). */
export function ResolutionTable({
  resolutions,
  label,
  empty,
}: {
  resolutions: ResolutionView[];
  label: string;
  empty: string;
}) {
  if (resolutions.length === 0) {
    return <EmptyState icon={Scale} title={empty} description="Nothing to show in this tab yet." />;
  }
  return (
    <>
      <ul aria-label={label} className="flex flex-col gap-3 md:hidden">
        {resolutions.map((r) => (
          <li key={r.id} className="flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="min-w-0 font-medium break-words">{r.userName}</p>
              <LeaveTypeBadge type={r.leaveType} />
            </div>
            <p className="text-sm">{plan(r)}</p>
            <p className="text-xs text-muted-foreground">
              {STATUS_LABEL[r.status]} · respond by {formatDate(r.respondBy)} · by{" "}
              {r.proposedByName}
            </p>
          </li>
        ))}
      </ul>
      <div className="hidden rounded-lg border bg-card shadow-xs md:block">
        <Table aria-label={label}>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Leave type</TableHead>
              <TableHead>Proposal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Respond by</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resolutions.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.userName}</TableCell>
                <TableCell>
                  <LeaveTypeBadge type={r.leaveType} />
                </TableCell>
                <TableCell className="whitespace-normal">{plan(r)}</TableCell>
                <TableCell>{STATUS_LABEL[r.status]}</TableCell>
                <TableCell className="tabular-nums">{formatDate(r.respondBy)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
