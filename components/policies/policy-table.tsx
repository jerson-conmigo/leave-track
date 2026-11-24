import { SlidersHorizontal } from "lucide-react";
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
import { ROLE_LABEL } from "@/lib/auth/roles";
import type { PolicyView } from "@/lib/data/types";
import { formatDays } from "@/lib/format";

/** Read-only accrual policies per employee and leave type (HR Admin). */
export function PolicyTable({ policies }: { policies: PolicyView[] }) {
  if (policies.length === 0) {
    return (
      <EmptyState
        icon={SlidersHorizontal}
        title="No leave policies yet"
        description="Assign an accrual policy to an employee to start tracking their balance."
      />
    );
  }

  return (
    <>
      <ul aria-label="Leave policies" className="flex flex-col gap-3 md:hidden">
        {policies.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 shadow-xs"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{p.userName}</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABEL[p.role]}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <LeaveTypeBadge type={p.leaveType} />
              <span className="text-sm tabular-nums">+{formatDays(p.accrualPerMonth)}/mo</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden rounded-lg border bg-card shadow-xs md:block">
        <Table aria-label="Leave policies">
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Leave type</TableHead>
              <TableHead className="text-right">Accrual / month</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {policies.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.userName}</TableCell>
                <TableCell className="text-muted-foreground">{ROLE_LABEL[p.role]}</TableCell>
                <TableCell>
                  <LeaveTypeBadge type={p.leaveType} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatDays(p.accrualPerMonth)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
