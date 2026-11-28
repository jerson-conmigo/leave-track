"use client";

import { Scale } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { proposeResolutionAction } from "@/app/(app)/resolutions/actions";
import { EmptyState } from "@/components/leave/empty-state";
import { LeaveTypeBadge } from "@/components/leave/leave-type-badge";
import { ProposeDialog } from "@/components/resolutions/propose-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDays } from "@/lib/format";
import type { ResolutionQueueRow } from "@/lib/resolutions/types";

/** "Needs proposal" (TASK-032 AC1): negative tracked balances without an open resolution. */
export function ResolutionQueue({
  rows,
  currentUserId,
}: {
  rows: ResolutionQueueRow[];
  currentUserId: string;
}) {
  const [selected, setSelected] = useState<ResolutionQueueRow | null>(null);
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Scale}
        title="No balances need a proposal"
        description="Balances below zero appear here until a resolution is proposed."
      />
    );
  }

  function openFor(row: ResolutionQueueRow, button: HTMLButtonElement) {
    setTrigger(button);
    setSelected(row);
    setOpen(true);
  }

  const action = (row: ResolutionQueueRow) =>
    row.userId === currentUserId ? (
      <span className="text-sm text-muted-foreground">Another HR Admin resolves this</span>
    ) : (
      <Button
        size="sm"
        className="min-h-11 sm:min-h-9"
        aria-label={`Propose a resolution for ${row.userName}, ${row.leaveType}`}
        onClick={(e) => openFor(row, e.currentTarget)}
      >
        Propose
      </Button>
    );

  return (
    <>
      <ul aria-label="Balances needing a proposal" className="flex flex-col gap-3 md:hidden">
        {rows.map((r) => (
          <li
            key={`${r.userId}:${r.leaveTypeId}`}
            className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="min-w-0 font-medium break-words">{r.userName}</p>
              <LeaveTypeBadge type={r.leaveType} />
            </div>
            <p className="text-sm">
              <span className="font-medium tabular-nums">{formatDays(r.deficit)}</span> below zero ·{" "}
              <span className="text-muted-foreground">
                accrues {formatDays(r.accrualPerMonth)}/mo
              </span>
            </p>
            <div>{action(r)}</div>
          </li>
        ))}
      </ul>

      <div className="hidden rounded-lg border bg-card shadow-xs md:block">
        <Table aria-label="Balances needing a proposal">
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Leave type</TableHead>
              <TableHead className="text-right">Deficit</TableHead>
              <TableHead className="text-right">Accrual / month</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Action</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={`${r.userId}:${r.leaveTypeId}`}>
                <TableCell className="font-medium">{r.userName}</TableCell>
                <TableCell>
                  <LeaveTypeBadge type={r.leaveType} />
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatDays(r.deficit)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatDays(r.accrualPerMonth)}
                </TableCell>
                <TableCell className="text-right">{action(r)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ProposeDialog
        key={selected ? `${selected.userId}:${selected.leaveTypeId}` : "none"}
        row={selected}
        open={open}
        onOpenChange={setOpen}
        returnFocusTo={trigger}
        onConfirm={async (input) => {
          const result = await proposeResolutionAction(input);
          if (result.success) toast.success(`Proposal sent to ${selected?.userName}.`);
          return result;
        }}
      />
    </>
  );
}
