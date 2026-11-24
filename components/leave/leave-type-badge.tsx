import { CalendarOff, type LucideIcon, Thermometer, TreePalm } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LeaveTypeName } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export const LEAVE_TYPE_META: Record<
  LeaveTypeName,
  { icon: LucideIcon; text: string; subtle: string; bar: string }
> = {
  Vacation: {
    icon: TreePalm,
    text: "text-leave-vacation",
    subtle: "bg-leave-vacation-subtle",
    bar: "bg-leave-vacation",
  },
  Sick: {
    icon: Thermometer,
    text: "text-leave-sick",
    subtle: "bg-leave-sick-subtle",
    bar: "bg-leave-sick",
  },
  Unpaid: {
    icon: CalendarOff,
    text: "text-leave-unpaid",
    subtle: "bg-leave-unpaid-subtle",
    bar: "bg-leave-unpaid",
  },
};

/** Leave type chip — icon + label, never color alone (WCAG 1.4.1). */
export function LeaveTypeBadge({ type, className }: { type: LeaveTypeName; className?: string }) {
  const { icon: Icon, text, subtle } = LEAVE_TYPE_META[type];
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", subtle, text, className)}
    >
      <Icon aria-hidden />
      {type}
    </Badge>
  );
}
