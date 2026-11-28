"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import type { ActionResult, LeaveRequestView } from "@/lib/data/types";
import { formatDateRange, formatDays } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Wraps at 200% text on a 320px screen instead of widening the page; ≥ 44px on touch. */
const WRAP = "h-auto min-h-11 max-w-full whitespace-normal md:min-h-9";

/**
 * TASK-028 — "Withdraw" (pending) or "Cancel leave" (approved, not started), behind a confirm
 * dialog. UX only: the server decides (requester only, before the first day, UTC).
 */
export function CancelRequestButton({
  request,
  onCancel,
}: {
  request: LeaveRequestView;
  onCancel: (requestId: string) => Promise<ActionResult>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const approved = request.status === "approved";
  const range = formatDateRange(request.startDate, request.endDate);
  const verb = approved ? "Cancel leave" : "Withdraw";

  const confirm = () =>
    startTransition(async () => {
      const result = await onCancel(request.id);
      if (result.success) {
        toast.success(approved ? "Leave cancelled" : "Request withdrawn");
        setOpen(false);
      } else {
        toast.error(result.error.message);
      }
    });

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      {/* A real Trigger, so Radix returns focus to it when the dialog closes. */}
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className={WRAP}
          aria-label={`${verb}: ${request.leaveType}, ${range}`}
        >
          {verb}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {approved ? "Cancel this leave?" : "Withdraw this request?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {approved
              ? `${request.leaveType}, ${range}. Its ${formatDays(request.days)} go back to your balance. This can't be undone.`
              : `${request.leaveType}, ${range}. It will no longer wait for approval. This can't be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className={cn(buttonVariants({ variant: "outline" }), WRAP)}
            disabled={pending}
          >
            {approved ? "Keep leave" : "Keep request"}
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: "destructive" }), WRAP)}
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              confirm();
            }}
          >
            {approved ? "Cancel leave" : "Withdraw request"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
