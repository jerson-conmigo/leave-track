"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Loader2, TriangleAlert } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { LEAVE_TYPE_META } from "@/components/leave/leave-type-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { mockSubmit } from "@/lib/data/mock/actions";
import type { ActionResult, BalanceSummary, LeaveType } from "@/lib/data/types";
import { countDays, formatDays } from "@/lib/format";
import { LeaveRequestSchema, type LeaveRequestInput } from "@/lib/validation/leave-request";

type RequestFormProps = {
  leaveTypes: LeaveType[];
  /** Current balances — drive the non-blocking over-balance warning (US-01 AC3). */
  balances: BalanceSummary[];
  /**
   * Submit handler. Day 0 default persists nothing. Day 1 passes the real
   * server action (TASK-011), which MUST re-validate with LeaveRequestSchema.
   */
  onSubmit?: (values: LeaveRequestInput) => Promise<ActionResult>;
};

const EMPTY: LeaveRequestInput = { leaveTypeId: "", startDate: "", endDate: "", reason: "" };

export function RequestForm({ leaveTypes, balances, onSubmit = mockSubmit }: RequestFormProps) {
  const form = useForm<LeaveRequestInput>({
    resolver: zodResolver(LeaveRequestSchema),
    defaultValues: EMPTY,
    mode: "onTouched",
  });

  const [leaveTypeId, startDate, endDate] = useWatch({
    control: form.control,
    name: ["leaveTypeId", "startDate", "endDate"],
  });

  const balance = balances.find((b) => b.leaveType.id === leaveTypeId);
  const days = startDate && endDate && endDate >= startDate ? countDays(startDate, endDate) : 0;
  // Untracked types (Unpaid) are never balance-checked (US-08 AC2).
  const overBy =
    balance?.available != null && days > balance.available ? days - balance.available : 0;

  async function handleSubmit(values: LeaveRequestInput) {
    const result = await onSubmit(values);
    if (!result.success) {
      form.setError("root", { message: result.error.message });
      return;
    }
    toast.success("Request sent to your manager", {
      description: "Demo mode — nothing was saved. Submission is wired up in TASK-011.",
    });
    form.reset(EMPTY);
  }

  const { isSubmitting, errors } = form.formState;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        noValidate
        aria-describedby={errors.root ? "form-error" : undefined}
        className="flex flex-col gap-5"
      >
        {errors.root ? (
          <Alert variant="destructive" id="form-error">
            <CircleAlert aria-hidden />
            <AlertTitle>Couldn&apos;t send your request</AlertTitle>
            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="leaveTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Leave type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger className="w-full" onBlur={field.onBlur}>
                    <SelectValue placeholder="Choose a leave type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {leaveTypes.map((t) => {
                    const Icon = LEAVE_TYPE_META[t.name].icon;
                    const avail = balances.find((b) => b.leaveType.id === t.id)?.available;
                    return (
                      <SelectItem key={t.id} value={t.id}>
                        <Icon aria-hidden className={LEAVE_TYPE_META[t.name].text} />
                        {t.name}
                        <span className="text-muted-foreground">
                          {avail == null ? "· not tracked" : `· ${formatDays(avail)} available`}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start date</FormLabel>
                <FormControl>
                  <Input type="date" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    min={startDate || undefined}
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {days > 0 ? (
          <p className="-mt-2 text-sm text-muted-foreground" aria-live="polite">
            {formatDays(days)} requested
          </p>
        ) : null}

        {overBy > 0 && balance ? (
          <Alert
            className="border-status-pending-foreground/30 bg-status-pending text-status-pending-foreground"
            role="status"
          >
            <TriangleAlert aria-hidden />
            <AlertTitle>This is more than your {balance.leaveType.name} balance</AlertTitle>
            <AlertDescription className="text-status-pending-foreground">
              You&apos;re requesting {formatDays(overBy)} more than you have available. You can
              still submit — HR will review it for an override.
            </AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="e.g. Family trip"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormDescription>Your manager sees this when reviewing the request.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => form.reset(EMPTY)}
          >
            Clear
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {isSubmitting ? "Sending…" : "Submit request"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
