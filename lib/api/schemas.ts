import { z } from "zod";
import { ERROR_STATUS, type ErrorCode } from "@/lib/api/errors";
import { AUDIT_ACTIONS, LEAVE_TYPE_NAMES, REQUEST_STATUSES, ROLES } from "@/lib/data/types";

/**
 * Response schemas of the HTTP API (TASK-057) — the runtime description of what the route
 * handlers return, used to generate the OpenAPI document (lib/api/openapi.ts). They mirror the
 * TypeScript types in lib/data/types.ts field for field; tests/api/openapi.test.ts asserts the
 * inferred types are EQUAL to those types (a type change without a schema change fails the
 * typecheck) and tests/api/contract.test.ts validates real handler responses against them.
 * Validation only — nothing here changes what the routes do.
 */

const isoDate = z.iso.date().describe("Date, YYYY-MM-DD");
const isoTimestamp = z.iso.datetime({ offset: true }).describe("ISO 8601 timestamp");

export const ErrorCodeSchema = z.enum(Object.keys(ERROR_STATUS) as [ErrorCode, ...ErrorCode[]]);

/** Every non-2xx response: exactly { success: false, error: { code, message } }. */
export const ErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: z.object({ code: ErrorCodeSchema, message: z.string() }),
});

/** Every 2xx API response (except the raw OpenAPI document): { success: true, data }. */
export const successEnvelope = <T extends z.ZodType>(data: T) =>
  z.object({ success: z.literal(true), data });

export const HealthSchema = z.object({
  status: z.literal("ok"),
  env: z.enum(["development", "staging", "production"]),
  version: z.string().describe('Short commit SHA, or "dev"'),
  timestamp: isoTimestamp,
});

export const LeaveTypeSchema = z.object({
  id: z.uuid(),
  name: z.enum(LEAVE_TYPE_NAMES),
  tracksBalance: z.boolean(),
  maxBackdateDays: z
    .number()
    .int()
    .describe("Days before today a request of this type may start (Sick 30, others 0)"),
});

export const BalanceSummarySchema = z.object({
  leaveType: LeaveTypeSchema,
  confirmed: z.number().nullable().describe("Null for leave types that don't track a balance"),
  pending: z.number(),
  available: z.number().nullable(),
  accrualPerMonth: z.number().nullable(),
  asOf: isoTimestamp.nullable().describe("Date of the last accrual run, if any"),
});

export const LeaveRequestViewSchema = z.object({
  id: z.uuid(),
  leaveType: z.enum(LEAVE_TYPE_NAMES),
  startDate: isoDate,
  endDate: isoDate,
  days: z.number(),
  reason: z.string(),
  status: z.enum(REQUEST_STATUSES),
  createdAt: isoTimestamp,
  decidedAt: isoTimestamp.nullable(),
  decidedByName: z.string().nullable(),
  awaiting: z
    .string()
    .nullable()
    .describe(
      "Pending: the approver's name, or \"HR\" for an HR Admin's request; null once decided",
    ),
});

export const TeamRequestViewSchema = LeaveRequestViewSchema.extend({
  employee: z.object({ id: z.uuid(), name: z.string(), email: z.string() }),
  balanceAvailable: z.number().nullable(),
});

export const MyLeaveContextSchema = z.object({
  balances: z.array(BalanceSummarySchema),
  requests: z.array(LeaveRequestViewSchema),
});

export const TeamQueueSchema = z.object({ requests: z.array(TeamRequestViewSchema) });

export const SubmitWarningSchema = z.object({
  code: z.literal("EXCEEDS_BALANCE"),
  message: z.string(),
  requestedDays: z.number(),
  availableDays: z.number(),
});

export const SubmitLeaveRequestResultSchema = z.object({
  request: LeaveRequestViewSchema,
  warnings: z.array(SubmitWarningSchema),
});

export const DecideWarningSchema = z.object({
  code: z.literal("NEGATIVE_BALANCE"),
  message: z.string(),
  leaveType: z.enum(LEAVE_TYPE_NAMES),
  balanceAfter: z.number(),
});

export const DecideLeaveRequestResultSchema = z.object({
  request: LeaveRequestViewSchema,
  warnings: z.array(DecideWarningSchema),
});

export const AuditEventSchema = z.object({
  action: z.enum(AUDIT_ACTIONS),
  actorId: z.uuid(),
  actorName: z.string(),
  occurredAt: isoTimestamp,
});

export const AuditRequestRecordSchema = LeaveRequestViewSchema.extend({
  decidedBy: z.object({ id: z.uuid(), name: z.string() }).nullable(),
  decisionReason: z.string().nullable(),
  events: z.array(AuditEventSchema),
});

export const EmployeeAuditHistorySchema = z.object({
  employee: z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.string(),
    role: z.enum(ROLES),
    managerName: z.string().nullable(),
  }),
  requests: z.array(AuditRequestRecordSchema),
});

export const AccrualResultSchema = z.object({
  accrued: z.array(
    z.object({
      period: isoDate.describe("Month accrued, YYYY-MM-01 (UTC)"),
      usersAccrued: z.number(),
      daysAccrued: z.number(),
    }),
  ),
  upToDate: z.boolean(),
  catchUp: z.boolean(),
});

const epochSeconds = z.number().int().describe("Unix time, seconds");

/** POST /api/session/heartbeat (TASK-025). Mirrors SessionTiming (lib/auth/session.ts). */
export const SessionTimingSchema = z.object({
  idleExpiresAt: epochSeconds,
  absoluteExpiresAt: epochSeconds.describe(
    "The 8-hour limit since sign-in; activity never moves it",
  ),
  idleTimeoutSeconds: z.number().int(),
  warningSeconds: z.number().int(),
  heartbeatIntervalSeconds: z.number().int(),
});
