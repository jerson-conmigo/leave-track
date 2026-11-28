import { z } from "zod";
import {
  AccrualResultSchema,
  BalanceSummarySchema,
  DecideLeaveRequestResultSchema,
  EmployeeAuditHistorySchema,
  ErrorEnvelopeSchema,
  HealthSchema,
  LeaveRequestViewSchema,
  LeaveTypeSchema,
  MyLeaveContextSchema,
  SubmitLeaveRequestResultSchema,
  TeamQueueSchema,
  TeamRequestViewSchema,
  AuditRequestRecordSchema,
  SessionTimingSchema,
  MarkReadResultSchema,
  CancelLeaveRequestResultSchema,
  ProposeResolutionResultSchema,
  ResolutionViewSchema,
} from "@/lib/api/schemas";
import { MarkReadSchema } from "@/lib/notifications/read";
import { AuditParamsSchema, AuditQuerySchema, ListQuerySchema } from "@/lib/validation/api";
import { DecisionSchema, LeaveRequestSchema } from "@/lib/validation/leave-request";
import { ProposeResolutionSchema } from "@/lib/resolutions/validation";
import pkg from "../../package.json";

/**
 * The OpenAPI 3.1 document for LeaveTrack's HTTP API (TASK-057), generated from the zod schemas
 * the routes validate with (requests) and lib/api/schemas.ts (responses). It documents ONLY what
 * exists: the operations below are pinned to app/api/**\/route.ts by tests/api/openapi.test.ts,
 * and every status listed is one that route (or its service / withErrorHandler) really returns.
 *
 * Not documented on purpose: POST /api/test/reset (test-only), the docs routes themselves and
 * server actions (sign-in, sign-out, password reset, form submits — not HTTP APIs).
 * Nothing is read from the environment: names and descriptions only, never values.
 */

type JsonSchema = Record<string, unknown>;

const COMPONENTS = {
  ErrorEnvelope: ErrorEnvelopeSchema,
  Health: HealthSchema,
  LeaveType: LeaveTypeSchema,
  BalanceSummary: BalanceSummarySchema,
  LeaveRequestView: LeaveRequestViewSchema,
  TeamRequestView: TeamRequestViewSchema,
  MyLeaveContext: MyLeaveContextSchema,
  TeamQueue: TeamQueueSchema,
  SubmitLeaveRequestResult: SubmitLeaveRequestResultSchema,
  DecideLeaveRequestResult: DecideLeaveRequestResultSchema,
  AuditRequestRecord: AuditRequestRecordSchema,
  EmployeeAuditHistory: EmployeeAuditHistorySchema,
  AccrualResult: AccrualResultSchema,
  SessionTiming: SessionTimingSchema,
  MarkReadResult: MarkReadResultSchema,
  CancelLeaveRequestResult: CancelLeaveRequestResultSchema,
  ResolutionView: ResolutionViewSchema,
  ProposeResolutionResult: ProposeResolutionResultSchema,
} as const;

type ComponentName = keyof typeof COMPONENTS;
const ref = (name: ComponentName) => ({ $ref: `#/components/schemas/${name}` });

/** JSON Schema of a request-side zod schema (input shape: transforms/defaults not applied). */
function input(schema: z.ZodType): JsonSchema {
  return without(z.toJSONSchema(schema, { io: "input" }) as JsonSchema, "$schema");
}

/** A copy without the given keys (component schemas don't carry their own $schema / $id). */
function without(schema: JsonSchema, ...keys: string[]): JsonSchema {
  const copy = { ...schema };
  for (const key of keys) delete copy[key];
  return copy;
}

function components(): Record<string, JsonSchema> {
  const registry = z.registry<{ id: string }>();
  for (const [id, schema] of Object.entries(COMPONENTS)) registry.add(schema, { id });
  const { schemas } = z.toJSONSchema(registry, { uri: (id) => `#/components/schemas/${id}` }) as {
    schemas: Record<string, JsonSchema>;
  };
  return Object.fromEntries(
    Object.entries(schemas).map(([id, s]) => [id, without(s, "$schema", "$id")]),
  );
}

const STATUS_TEXT: Record<number, string> = {
  400: "VALIDATION_ERROR — the request is invalid (message says why).",
  401: "UNAUTHENTICATED — no valid session (or, for the accrual job, no valid Bearer token).",
  403: "FORBIDDEN — signed in, but this role or relationship may not do this.",
  404: "NOT_FOUND — the resource doesn't exist.",
  409: "CONFLICT — the request conflicts with the current state.",
  500: "INTERNAL_ERROR — unexpected failure; details are logged, never returned.",
};

function success(status: number, description: string, data: JsonSchema) {
  return {
    [status]: {
      description,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: { success: { type: "boolean", const: true }, data },
            required: ["success", "data"],
            additionalProperties: false,
          },
        },
      },
    },
  };
}

function errors(statuses: number[], notes: Partial<Record<number, string>> = {}) {
  return Object.fromEntries(
    statuses.map((status) => [
      status,
      {
        description: notes[status] ?? STATUS_TEXT[status],
        content: { "application/json": { schema: ref("ErrorEnvelope") } },
      },
    ]),
  );
}

/** Query/path parameters from a zod object schema (input shape). */
function parameters(schema: z.ZodType, location: "query" | "path"): JsonSchema[] {
  const json = input(schema) as { properties?: Record<string, JsonSchema>; required?: string[] };
  return Object.entries(json.properties ?? {}).map(([name, s]) => ({
    name,
    in: location,
    required: location === "path" || (json.required ?? []).includes(name),
    schema: s,
  }));
}

const COOKIE = [{ cookieAuth: [] }];

export function buildOpenApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: "LeaveTrack API",
      version: pkg.version,
      description:
        "Same-origin JSON API (no CORS). Successful responses are `{ success: true, data }`; " +
        "every error is `{ success: false, error: { code, message } }`. Authorization always " +
        "comes from the signed-in user's database row, never from request data.",
    },
    servers: [{ url: "/" }],
    tags: [
      { name: "Health" },
      { name: "Leave requests" },
      { name: "Audit" },
      { name: "Jobs" },
      { name: "Session" },
      { name: "Notifications" },
    ],
    paths: {
      "/api/health": {
        get: {
          tags: ["Health"],
          operationId: "getHealth",
          summary: "Liveness probe",
          description: "Touches no external service. No authentication.",
          security: [],
          responses: {
            ...success(200, "The app is up.", ref("Health")),
            ...errors([500]),
          },
        },
      },
      "/api/leave-requests": {
        get: {
          tags: ["Leave requests"],
          operationId: "listLeaveRequests",
          summary: "Your leave context, or your team's queue",
          description:
            "`scope=mine`: the signed-in user's balances and requests (any role). " +
            "`scope=team`: the approvals queue of a manager or HR Admin — the requests they may " +
            "decide, scoped in SQL (a manager's reports; for an HR Admin also the managers who " +
            "report to them and other HR Admins without a manager; never their own); " +
            "`status` (`pending` by default, or `all`) only applies to `scope=team`. " +
            "The subject is always the signed-in user — `userId`/`managerId` parameters are ignored.",
          security: COOKIE,
          parameters: parameters(ListQuerySchema, "query"),
          responses: {
            ...success(200, "For `scope=mine` a MyLeaveContext; for `scope=team` a TeamQueue.", {
              oneOf: [ref("MyLeaveContext"), ref("TeamQueue")],
            }),
            ...errors([400, 401, 403, 500], {
              403: "FORBIDDEN — `scope=team` is for managers and HR Admins only.",
            }),
          },
        },
        post: {
          tags: ["Leave requests"],
          operationId: "submitLeaveRequest",
          summary: "Submit a leave request",
          description:
            "Any signed-in role. The requester is always the signed-in user (a `userId` in the " +
            "body is ignored). `endDate` must be on or after `startDate`. A request beyond the " +
            "available balance is accepted with an `EXCEEDS_BALANCE` warning; leave types that " +
            "don't track a balance are never balance-checked." +
            " Refused with 409 (nothing created) when nobody may approve the requester's leave (BR-10)." +
            " Refused with 400 (TASK-027, BR-13) when it overlaps one of your pending or approved " +
            "requests, is longer than 90 days, or starts in the past (only Sick may start up to 30 " +
            "days back — each leave type's `maxBackdateDays`; today is the UTC date).",
          security: COOKIE,
          requestBody: {
            required: true,
            content: { "application/json": { schema: input(LeaveRequestSchema) } },
          },
          responses: {
            ...success(201, "Created.", ref("SubmitLeaveRequestResult")),
            ...errors([400, 401, 409, 500], {
              400: "VALIDATION_ERROR — invalid input, an overlap with your own pending/approved request, more than 90 days, or a start date before the allowed window.",
              409: "CONFLICT — there's no eligible approver for this requester; nothing was created.",
            }),
          },
        },
      },
      "/api/leave-requests/{id}/decision": {
        post: {
          tags: ["Leave requests"],
          operationId: "decideLeaveRequest",
          summary: "Approve or reject a pending request",
          description:
            "Managers and HR Admins, and only for requests waiting for them (a manager's reports; " +
            "an HR Admin's managers and other HR Admins without a manager) — never their own. " +
            "A rejection needs " +
            "a reason (3–500 characters); an approval may include one. Approving beyond the " +
            "balance succeeds with a `NEGATIVE_BALANCE` warning. Every decision writes an audit " +
            "record in the same transaction.",
          security: COOKIE,
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Leave request id",
              schema: { type: "string", format: "uuid" },
            },
          ],
          requestBody: {
            required: true,
            content: { "application/json": { schema: input(DecisionSchema) } },
          },
          responses: {
            ...success(200, "Decided.", ref("DecideLeaveRequestResult")),
            ...errors([400, 401, 403, 404, 409, 500], {
              403: "FORBIDDEN — not a manager or HR Admin, your own request, or not waiting for you.",
              409: "CONFLICT — the request has already been decided.",
            }),
          },
        },
      },
      "/api/leave-requests/{id}/cancel": {
        post: {
          tags: ["Leave requests"],
          operationId: "cancelLeaveRequest",
          summary: "Withdraw a pending request or cancel approved leave",
          description:
            "Only the requester. A PENDING request is withdrawn; APPROVED leave can be cancelled " +
            "until its first day (UTC) and its days go back to that leave type's balance (exactly " +
            "what the approval took). Everything — status, balance, history, audit row and the " +
            "approvers' notifications — happens in one transaction. A cancelled request is final.",
          security: COOKIE,
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Leave request id",
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            ...success(200, "Cancelled.", ref("CancelLeaveRequestResult")),
            ...errors([400, 401, 403, 404, 409, 500], {
              403: "FORBIDDEN — only the requester can cancel a request.",
              409: "CONFLICT — the leave has started, the request was rejected, or it's already cancelled.",
            }),
          },
        },
      },
      "/api/resolutions": {
        post: {
          tags: ["Resolutions"],
          operationId: "proposeResolution",
          summary: "Propose how a negative balance is resolved",
          description:
            "HR Admins only, never for their own balance. Unpaid + recovery days must equal the " +
            "employee's CURRENT deficit (re-read in the transaction) on a leave type that tracks " +
            "a balance; recovery starts next month at the earliest and the monthly deduction " +
            "(recovery ÷ months) may not exceed the accrual rate. The resolution, its history " +
            "event and the employee's notification are written in one transaction; the response " +
            "deadline is fixed at proposal from the HR setting (default 3 days).",
          security: COOKIE,
          requestBody: {
            required: true,
            content: { "application/json": { schema: input(ProposeResolutionSchema) } },
          },
          responses: {
            ...success(201, "Proposed.", ref("ProposeResolutionResult")),
            ...errors([400, 401, 403, 404, 409, 500], {
              403: "FORBIDDEN — not an HR Admin, or your own balance.",
              409: "CONFLICT — an open resolution already exists, or the balance is no longer below zero.",
            }),
          },
        },
      },
      "/api/audit/{userId}": {
        get: {
          tags: ["Audit"],
          operationId: "getEmployeeAuditHistory",
          summary: "An employee's full decision history",
          description:
            "HR Admins only (checked before any database access). Every non-deleted request with " +
            "its status, decision-maker, decision time, reason and audit events. Optional `from`/" +
            "`to` filter on the request's creation date (UTC, inclusive); `from` must be on or " +
            "before `to`.",
          security: COOKIE,
          parameters: [
            ...parameters(AuditParamsSchema, "path"),
            ...parameters(AuditQuerySchema, "query"),
          ],
          responses: {
            ...success(200, "The employee and their requests.", ref("EmployeeAuditHistory")),
            ...errors([400, 401, 403, 404, 500], {
              403: "FORBIDDEN — HR Admins only.",
              404: "NOT_FOUND — no such employee.",
            }),
          },
        },
      },
      "/api/notifications/read": {
        post: {
          tags: ["Notifications"],
          operationId: "markNotificationsRead",
          summary: "Mark your notifications as read",
          description:
            "Marks the signed-in user's OWN unread notifications as read: the listed `ids`, or " +
            "all of them when `ids` is omitted. Ids belonging to someone else are not touched.",
          security: COOKIE,
          requestBody: {
            required: false,
            content: { "application/json": { schema: input(MarkReadSchema) } },
          },
          responses: {
            ...success(200, "Marked.", ref("MarkReadResult")),
            ...errors([400, 401, 500]),
          },
        },
      },
      "/api/session/heartbeat": {
        post: {
          tags: ["Session"],
          operationId: "sessionHeartbeat",
          summary: "Record activity and read the session's timing",
          description:
            "Sent by the app after real user activity (never on a timer). Renews the idle " +
            "window; the absolute limit (8 hours since sign-in) never moves. No request body.",
          security: COOKIE,
          responses: {
            ...success(200, "The session's timing after this activity.", ref("SessionTiming")),
            ...errors([401, 500], {
              401: "UNAUTHENTICATED — the session expired, went idle or was signed out.",
            }),
          },
        },
      },
      "/api/jobs/accrual": Object.fromEntries(
        (["get", "post"] as const).map((method) => [
          method,
          {
            tags: ["Jobs"],
            operationId: method === "get" ? "runAccrualCron" : "runAccrualManual",
            summary:
              method === "get" ? "Monthly accrual (Vercel Cron)" : "Monthly accrual (manual run)",
            description:
              "Bearer token = the server's CRON_SECRET, compared in constant time before any " +
              "database access; refused when it isn't configured. Idempotent: each month is " +
              "claimed once, missed months are caught up (up to a limit).",
            security: [{ bearerAuth: [] }],
            responses: {
              ...success(200, "Accrued (or already up to date).", ref("AccrualResult")),
              ...errors([401, 409, 500], {
                401: "UNAUTHENTICATED — missing or wrong Bearer token.",
                409: "CONFLICT — too many missed months; manual review required.",
              }),
            },
          },
        ]),
      ),
    },
    components: {
      schemas: components(),
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "lt-session",
          description:
            "The signed session cookie set when you sign in on the website (httpOnly, " +
            "same-origin). Sign-in is not an API endpoint.",
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          description:
            "The accrual job's shared secret (CRON_SECRET). Used only by /api/jobs/accrual.",
        },
      },
    },
  };
}
