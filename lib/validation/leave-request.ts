import { z } from "zod";

/**
 * Leave request input (US-01). Shared by the client form and — on Day 1 — the
 * POST /api/leave-requests handler, which MUST re-validate server-side (AC2).
 */
export const LeaveRequestSchema = z
  .object({
    leaveTypeId: z.uuid({ error: "Choose a leave type." }),
    startDate: z.iso.date({ error: "Enter a valid start date." }),
    endDate: z.iso.date({ error: "Enter a valid end date." }),
    reason: z
      .string()
      .trim()
      .min(3, { error: "Add a short reason (at least 3 characters)." })
      .max(500, { error: "Keep the reason under 500 characters." }),
  })
  .refine((v) => v.endDate >= v.startDate, {
    path: ["endDate"],
    error: "End date can't be before the start date.",
  });

export type LeaveRequestInput = z.infer<typeof LeaveRequestSchema>;

/** Rejection requires a reason (US-03 AC2). */
export const RejectReasonSchema = z
  .string()
  .trim()
  .min(3, { error: "Give the employee a reason (at least 3 characters)." })
  .max(500, { error: "Keep the reason under 500 characters." });

/**
 * Manager decision body (US-03). Reject requires a reason (AC2); approve may
 * carry an optional note. Shared by the route, the server action, and the dialog.
 */
export const DecisionSchema = z.discriminatedUnion(
  "decision",
  [
    z.object({
      decision: z.literal("approve"),
      reason: z
        .string()
        .trim()
        .max(500, { error: "Keep the reason under 500 characters." })
        .optional()
        .transform((v) => (v ? v : undefined)),
    }),
    z.object({ decision: z.literal("reject"), reason: RejectReasonSchema }),
  ],
  { error: "Decision must be approve or reject." },
);

export type DecisionInput = z.infer<typeof DecisionSchema>;
