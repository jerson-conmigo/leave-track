"use client";

import { CircleAlert, Loader2, Scale } from "lucide-react";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { resolutionTransitionAction } from "@/app/(app)/resolutions/actions";
import { LeaveTypeBadge } from "@/components/leave/leave-type-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatDays, formatMonth } from "@/lib/format";
import type { ResolutionView } from "@/lib/resolutions/types";
import { ResponseReasonSchema } from "@/lib/resolutions/validation";
import { cn } from "@/lib/utils";

/** Wraps at 200% text on a 320px screen; ≥ 44px on touch. */
const WRAP = "h-auto min-h-11 max-w-full whitespace-normal md:min-h-9";

export function proposalText(r: {
  unpaidDays: number;
  recoveryDays: number;
  monthlyDeduction: number | null;
  recoveryStartPeriod: string | null;
  recoveryMonths: number | null;
}): string {
  const parts = [
    r.unpaidDays > 0 ? `${formatDays(r.unpaidDays)} converted to Unpaid` : null,
    r.recoveryDays > 0 && r.monthlyDeduction !== null && r.recoveryStartPeriod && r.recoveryMonths
      ? `${formatDays(r.recoveryDays)} recovered from your accruals: ${formatDays(r.monthlyDeduction)} a month for ${r.recoveryMonths} ${r.recoveryMonths === 1 ? "month" : "months"} from ${formatMonth(r.recoveryStartPeriod)}`
      : null,
  ];
  return parts.filter(Boolean).join(", and ");
}

function appliedText(r: ResolutionView): string {
  const parts = [
    (r.unpaidApplied ?? 0) > 0 ? `${formatDays(r.unpaidApplied!)} converted to Unpaid` : null,
    (r.recoveryApplied ?? 0) > 0
      ? `${formatDays(r.recoveryApplied!)} to be recovered from accruals`
      : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" and ") : "nothing — the balance was no longer below zero";
}

/**
 * TASK-033 (US-10) — the employee's resolution on /balance: accept or decline before the
 * deadline; read-only once it has passed or been answered. UX only — the server decides.
 */
export function ResolutionCard({ resolution: r }: { resolution: ResolutionView }) {
  const open = r.status === "proposed" && !r.expired;
  return (
    <section
      aria-labelledby="resolution-title"
      className="mb-6 flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-xs"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Scale aria-hidden className="size-5 text-primary" />
        <h2 id="resolution-title" className="text-base font-semibold">
          Negative balance resolution
        </h2>
        <LeaveTypeBadge type={r.leaveType} />
      </div>

      {r.status === "proposed" ? (
        <>
          <p className="text-sm">
            Your {r.leaveType} balance was {formatDays(r.deficit)} below zero. HR proposes:{" "}
            {proposalText(r)}.
          </p>
          {open ? (
            <>
              <p className="text-sm font-medium">Please respond by {formatDate(r.respondBy)}.</p>
              <div className="flex flex-wrap gap-2">
                <AcceptButton r={r} />
                <DeclineButton r={r} />
              </div>
            </>
          ) : (
            <p role="status" className="text-sm font-medium">
              The deadline to respond ({formatDate(r.respondBy)}) has passed. This proposal can no
              longer be answered.
            </p>
          )}
        </>
      ) : r.status === "declined" ? (
        <p role="status" className="text-sm">
          You declined this proposal: &ldquo;{r.responseReason}&rdquo;. HR will review it.
        </p>
      ) : r.status === "accepted" || r.status === "finalized" ? (
        <p role="status" className="text-sm">
          {r.status === "accepted" ? "You accepted. " : "Resolved. "}
          Applied: {appliedText(r)}.{r.finalReason ? ` HR's final decision: ${r.finalReason}` : ""}
        </p>
      ) : r.status === "expired" ? (
        <p role="status" className="text-sm">
          Nobody answered by the deadline ({formatDate(r.respondBy)}), so it was converted
          automatically. Applied: {appliedText(r)}.
        </p>
      ) : (
        <p role="status" className="text-sm">
          This resolution is closed ({r.status}).
        </p>
      )}
    </section>
  );
}

function AcceptButton({ r }: { r: ResolutionView }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const confirm = () =>
    startTransition(async () => {
      const result = await resolutionTransitionAction("accept", r.id);
      if (result.success) {
        toast.success("Resolution accepted");
        setOpen(false);
      } else toast.error(result.error.message);
    });
  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <AlertDialogTrigger asChild>
        <Button className={WRAP}>Accept</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Accept this resolution?</AlertDialogTitle>
          <AlertDialogDescription>
            {proposalText(r)}. If your balance has changed since, only what is still below zero is
            applied. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className={cn(buttonVariants({ variant: "outline" }), WRAP)}
            disabled={pending}
          >
            Not now
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants(), WRAP)}
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              confirm();
            }}
          >
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Accept resolution
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeclineButton({ r }: { r: ResolutionView }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const id = useId();
  const submit = () => {
    const parsed = ResponseReasonSchema.safeParse(reason);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a reason.");
      return;
    }
    startTransition(async () => {
      const result = await resolutionTransitionAction("decline", r.id, { reason: parsed.data });
      if (result.success) {
        toast.success("Resolution declined; HR will review it");
        setOpen(false);
      } else setError(result.error.message);
    });
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (!next) {
          setReason("");
          setError(null);
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className={WRAP}>
          Decline
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Decline this resolution?</DialogTitle>
          <DialogDescription>
            HR will review your reason and may propose once more.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor={id}>Reason for declining</Label>
          <Textarea
            id={id}
            rows={3}
            value={reason}
            disabled={pending}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
          />
          {error ? (
            <Alert id={`${id}-error`} variant="destructive">
              <CircleAlert aria-hidden />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className={WRAP}
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Keep proposal
          </Button>
          <Button className={WRAP} onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Decline resolution
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
