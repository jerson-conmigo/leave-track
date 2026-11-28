import { z } from "zod";

/**
 * TASK-032 — a resolution proposal (shared by the dialog and the server, which re-validates).
 * Days have at most 2 decimals; recovery needs a start month (YYYY-MM-01) and 1–24 months.
 */
const days = z
  .number({ error: "Enter a number of days." })
  .min(0, { error: "Days can't be negative." })
  .max(365, { error: "That's more than a year." })
  .refine((v) => Math.round(v * 100) === v * 100, { error: "Use at most 2 decimals." });

export const ProposeResolutionSchema = z
  .object({
    userId: z.uuid({ error: "Choose an employee." }),
    leaveTypeId: z.uuid({ error: "Choose a leave type." }),
    unpaidDays: days,
    recoveryDays: days,
    recoveryStartPeriod: z
      .string()
      .regex(/^\d{4}-\d{2}-01$/, { error: "Choose the first month of the recovery." })
      .optional(),
    recoveryMonths: z.number().int().min(1).max(24, { error: "At most 24 months." }).optional(),
  })
  .refine((v) => v.unpaidDays + v.recoveryDays > 0, {
    path: ["unpaidDays"],
    error: "Propose unpaid days, recovery days or both.",
  })
  .refine((v) => v.recoveryDays === 0 || (v.recoveryStartPeriod && v.recoveryMonths), {
    path: ["recoveryStartPeriod"],
    error: "A recovery needs a start month and a number of months.",
  });
export type ProposeResolutionInput = z.infer<typeof ProposeResolutionSchema>;

/** The first day of the month after `now` (UTC) — the earliest recovery start (D-2). */
export function earliestRecoveryStart(now: Date): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
    .toISOString()
    .slice(0, 10);
}
