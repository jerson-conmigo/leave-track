import { Ban, CircleCheck, CircleX, Clock, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RequestStatus } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const STATUS_META: Record<RequestStatus, { label: string; icon: LucideIcon; className: string }> = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-status-pending text-status-pending-foreground",
  },
  approved: {
    label: "Approved",
    icon: CircleCheck,
    className: "bg-status-approved text-status-approved-foreground",
  },
  rejected: {
    label: "Rejected",
    icon: CircleX,
    className: "bg-status-rejected text-status-rejected-foreground",
  },
  // TASK-028: withdrawn while pending, or approved leave cancelled before it started.
  cancelled: {
    label: "Cancelled",
    icon: Ban,
    className: "bg-status-cancelled text-status-cancelled-foreground",
  },
};

/** Request status — icon + text, never color alone. */
export function StatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  const { label, icon: Icon, className: tone } = STATUS_META[status];
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", tone, className)}>
      <Icon aria-hidden />
      {label}
    </Badge>
  );
}
