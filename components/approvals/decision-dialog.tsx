"use client";

import { CircleAlert, Loader2, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";
import { LeaveTypeBadge } from "@/components/leave/leave-type-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult, Decision, TeamRequestView } from "@/lib/data/types";
import { formatDateRange, formatDayNumber, formatDays } from "@/lib/format";
import { RejectReasonSchema } from "@/lib/validation/leave-request";

export type { Decision } from "@/lib/data/types";

type DecisionDialogProps = {
  request: TeamRequestView | null;
  decision: Decision;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Rejection always passes a validated reason (US-03 AC2). */
  onConfirm: (reason?: string) => Promise<ActionResult>;
};

export function DecisionDialog({
  request,
  decision,
  open,
  onOpenChange,
  onConfirm,
}: DecisionDialogProps) {
  const [reason, setReason] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const reasonId = useId();
  const isReject = decision === "reject";

  function handleOpenChange(next: boolean) {
    if (pending) return;
    if (!next) {
      setReason("");
      setFieldError(null);
      setSubmitError(null);
    }
    onOpenChange(next);
  }

  async function confirm() {
    let validReason: string | undefined;
    if (isReject) {
      const parsed = RejectReasonSchema.safeParse(reason);
      if (!parsed.success) {
        setFieldError(parsed.error.issues[0]?.message ?? "Enter a reason.");
        return;
      }
      validReason = parsed.data;
    }
    setPending(true);
    setSubmitError(null);
    const result = await onConfirm(validReason);
    setPending(false);
    if (!result.success) {
      setSubmitError(result.error.message);
      return;
    }
    handleOpenChange(false);
  }

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isReject ? "Reject leave request?" : "Approve leave request?"}</DialogTitle>
          <DialogDescription>
            {isReject
              ? `${request.employee.name} will be notified. Their balance won't change.`
              : `${request.employee.name}'s balance will be reduced by ${formatDays(request.days)}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md bg-muted/60 p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <LeaveTypeBadge type={request.leaveType} />
            <span className="font-medium">
              {formatDateRange(request.startDate, request.endDate)}
            </span>
            <span className="text-muted-foreground">· {formatDays(request.days)}</span>
          </div>
          <p className="mt-2 break-words text-muted-foreground">&ldquo;{request.reason}&rdquo;</p>
        </div>

        {!isReject &&
        request.balanceAvailable !== null &&
        request.days > request.balanceAvailable ? (
          <Alert
            role="status"
            className="border-status-pending-foreground/30 bg-status-pending text-status-pending-foreground"
          >
            <TriangleAlert aria-hidden />
            <AlertTitle>This approval exceeds the available balance</AlertTitle>
            <AlertDescription className="text-status-pending-foreground">
              Approving takes {request.employee.name}&apos;s {request.leaveType} balance to{" "}
              {formatDayNumber(request.balanceAvailable - request.days)} days. HR will need to
              review the override.
            </AlertDescription>
          </Alert>
        ) : null}

        {isReject ? (
          <div className="grid gap-2">
            <Label htmlFor={reasonId}>Reason for rejecting</Label>
            <Textarea
              id={reasonId}
              rows={3}
              value={reason}
              disabled={pending}
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={fieldError ? `${reasonId}-error` : undefined}
              onChange={(e) => {
                setReason(e.target.value);
                if (fieldError) setFieldError(null);
              }}
              placeholder="e.g. Overlaps the release freeze — could you pick another week?"
            />
            {fieldError ? (
              <p id={`${reasonId}-error`} className="text-sm text-destructive">
                {fieldError}
              </p>
            ) : null}
          </div>
        ) : null}

        {submitError ? (
          <Alert variant="destructive">
            <CircleAlert aria-hidden />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant={isReject ? "destructive" : "default"}
            onClick={confirm}
            disabled={pending}
          >
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {isReject ? "Reject request" : "Approve request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
