import { ScrollText, Send } from "lucide-react";
import { EmptyState } from "@/components/leave/empty-state";
import { LeaveTypeBadge } from "@/components/leave/leave-type-badge";
import { StatusBadge } from "@/components/leave/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AuditAction, AuditEntryView } from "@/lib/data/types";
import { formatDateRange, formatDateTime, formatDays } from "@/lib/format";

function ActionBadge({ action }: { action: AuditAction }) {
  if (action === "submitted") {
    return (
      <Badge variant="secondary" className="font-medium">
        <Send aria-hidden />
        Submitted
      </Badge>
    );
  }
  return <StatusBadge status={action} />;
}

/** Decision history (US-05). Rows come from audit_log; soft-deleted requests are excluded upstream. */
export function AuditTable({ entries }: { entries: AuditEntryView[] }) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={ScrollText}
        title="No matching records"
        description="Try a different employee or widen the date range."
      />
    );
  }

  return (
    <>
      <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
        {entries.length} {entries.length === 1 ? "record" : "records"}
      </p>

      <ul aria-label="Audit records" className="flex flex-col gap-3 md:hidden">
        {entries.map((e) => (
          <li key={e.id} className="rounded-lg border bg-card p-4 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <ActionBadge action={e.action} />
              <time className="text-right text-xs text-muted-foreground" dateTime={e.occurredAt}>
                {formatDateTime(e.occurredAt)}
              </time>
            </div>
            <p className="mt-3 font-medium">{e.employeeName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <LeaveTypeBadge type={e.leaveType} />
              <span>{formatDateRange(e.startDate, e.endDate)}</span>
              <span className="text-muted-foreground">· {formatDays(e.days)}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">By {e.actorName}</p>
          </li>
        ))}
      </ul>

      <div className="hidden rounded-lg border bg-card shadow-xs md:block">
        <Table aria-label="Audit records">
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Request</TableHead>
              <TableHead>By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-sm text-muted-foreground">
                  <time dateTime={e.occurredAt}>{formatDateTime(e.occurredAt)}</time>
                </TableCell>
                <TableCell>
                  <ActionBadge action={e.action} />
                </TableCell>
                <TableCell className="font-medium">{e.employeeName}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <LeaveTypeBadge type={e.leaveType} />
                    <span className="text-sm">
                      {formatDateRange(e.startDate, e.endDate)}{" "}
                      <span className="text-muted-foreground">({formatDays(e.days)})</span>
                    </span>
                  </div>
                </TableCell>
                <TableCell>{e.actorName}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
