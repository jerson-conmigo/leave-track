"use client";

import { CircleAlert, Loader2 } from "lucide-react";
import { useId, useState } from "react";
import { LeaveTypeBadge } from "@/components/leave/leave-type-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionResult } from "@/lib/data/types";
import { formatDayNumber, formatDays, formatMonth } from "@/lib/format";
import { monthlyDeduction, type ResolutionQueueRow } from "@/lib/resolutions/types";
import {
  earliestRecoveryStart,
  type ProposeResolutionInput,
  ProposeResolutionSchema,
} from "@/lib/resolutions/validation";

/** The next 12 months, starting next month (D-2: the current month's accrual is never touched). */
function recoveryMonthsFrom(now: Date): string[] {
  const first = earliestRecoveryStart(now);
  const [y, m] = first.split("-").map(Number) as [number, number];
  return Array.from({ length: 12 }, (_, i) =>
    new Date(Date.UTC(y, m - 1 + i, 1)).toISOString().slice(0, 10),
  );
}

type ProposeDialogProps = {
  row: ResolutionQueueRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: ProposeResolutionInput) => Promise<ActionResult>;
  /** Opened from outside (no DialogTrigger): focus goes back here, or to <main> if it left the DOM. */
  returnFocusTo?: HTMLElement | null;
};

export function ProposeDialog({
  row,
  open,
  onOpenChange,
  onConfirm,
  returnFocusTo,
}: ProposeDialogProps) {
  const ids = {
    unpaid: useId(),
    recovery: useId(),
    start: useId(),
    months: useId(),
    preview: useId(),
  };
  // Defaults come from the row: the queue remounts this dialog per row (key), so they reset.
  const [periods] = useState(() => recoveryMonthsFrom(new Date()));
  const [unpaid, setUnpaid] = useState(() => (row ? formatDayNumber(row.deficit) : ""));
  const [recovery, setRecovery] = useState("0");
  const [months, setMonths] = useState("1");
  const [start, setStart] = useState(() => periods[0]!);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleOpenChange(next: boolean) {
    if (pending) return;
    if (!next) setError(null);
    onOpenChange(next);
  }

  if (!row) return null;
  const unpaidN = Number(unpaid) || 0;
  const recoveryN = Number(recovery) || 0;
  const monthsN = Math.trunc(Number(months)) || 0;
  const monthly = recoveryN > 0 && monthsN > 0 ? monthlyDeduction(recoveryN, monthsN) : null;
  const total = Math.round((unpaidN + recoveryN) * 100) / 100;
  const overCap = monthly !== null && monthly > row.accrualPerMonth;

  async function confirm() {
    if (!row) return;
    const parsed = ProposeResolutionSchema.safeParse({
      userId: row.userId,
      leaveTypeId: row.leaveTypeId,
      unpaidDays: unpaidN,
      recoveryDays: recoveryN,
      ...(recoveryN > 0 ? { recoveryStartPeriod: start, recoveryMonths: monthsN } : {}),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the proposal.");
      return;
    }
    if (total !== row.deficit) {
      setError(`Unpaid and recovery days must add up to ${formatDays(row.deficit)}.`);
      return;
    }
    if (overCap) {
      setError(`The monthly deduction can't exceed ${formatDays(row.accrualPerMonth)} a month.`);
      return;
    }
    setPending(true);
    setError(null);
    const result = await onConfirm(parsed.data);
    setPending(false);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const target = returnFocusTo?.isConnected
            ? returnFocusTo
            : document.getElementById("main");
          target?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>Propose a resolution</DialogTitle>
          <DialogDescription>
            {row.userName} is {formatDays(row.deficit)} below zero. They&apos;ll be asked to accept
            or decline.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted/60 p-3 text-sm">
          <LeaveTypeBadge type={row.leaveType} />
          <span className="font-medium">Deficit {formatDays(row.deficit)}</span>
          <span className="text-muted-foreground">
            · accrues {formatDays(row.accrualPerMonth)} a month
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={ids.unpaid}>Convert to Unpaid (days)</Label>
            <Input
              id={ids.unpaid}
              inputMode="decimal"
              value={unpaid}
              disabled={pending}
              onChange={(e) => setUnpaid(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={ids.recovery}>Recover from accruals (days)</Label>
            <Input
              id={ids.recovery}
              inputMode="decimal"
              value={recovery}
              disabled={pending || row.accrualPerMonth <= 0}
              aria-describedby={row.accrualPerMonth <= 0 ? `${ids.recovery}-hint` : undefined}
              onChange={(e) => setRecovery(e.target.value)}
            />
            {row.accrualPerMonth <= 0 ? (
              <p id={`${ids.recovery}-hint`} className="text-xs text-muted-foreground">
                No monthly accrual, so recovery isn&apos;t possible.
              </p>
            ) : null}
          </div>
          {recoveryN > 0 ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor={ids.start}>First month</Label>
                <Select value={start} onValueChange={setStart} disabled={pending}>
                  <SelectTrigger id={ids.start} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((p) => (
                      <SelectItem key={p} value={p}>
                        {formatMonth(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor={ids.months}>Number of months</Label>
                <Input
                  id={ids.months}
                  inputMode="numeric"
                  value={months}
                  disabled={pending}
                  onChange={(e) => setMonths(e.target.value)}
                />
              </div>
            </>
          ) : null}
        </div>

        <p id={ids.preview} role="status" className="text-sm">
          <span
            className={
              total === row.deficit ? "text-muted-foreground" : "font-medium text-destructive"
            }
          >
            Total {formatDays(total)} of {formatDays(row.deficit)}.
          </span>{" "}
          {monthly !== null ? (
            <span className={overCap ? "font-medium text-destructive" : undefined}>
              {monthsN} {monthsN === 1 ? "month" : "months"} × {formatDays(monthly)} from{" "}
              {formatMonth(start)}
              {overCap ? ` — above the ${formatDays(row.accrualPerMonth)} accrual` : ""}.
            </span>
          ) : null}
        </p>

        {error ? (
          <Alert variant="destructive">
            <CircleAlert aria-hidden />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Send proposal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
