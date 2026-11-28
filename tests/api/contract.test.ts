import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import {
  AccrualResultSchema,
  DecideLeaveRequestResultSchema,
  EmployeeAuditHistorySchema,
  ErrorEnvelopeSchema,
  HealthSchema,
  MyLeaveContextSchema,
  SubmitLeaveRequestResultSchema,
  successEnvelope,
  TeamQueueSchema,
} from "@/lib/api/schemas";
import { LEAVE_TYPE_IDS, USER_IDS } from "@/lib/data/mock/fixtures";
import { future } from "../support/dates";
import { OVERLAP_MESSAGE } from "@/lib/validation/leave-request";

/**
 * TASK-057 — contract tests: the REAL route handlers (in-memory store, mocked session only),
 * with every response validated against the response schemas the OpenAPI document is built
 * from. A handler that returns a field the schema doesn't know (strict objects), drops one, or
 * changes a type fails here.
 */
const getSession = vi.fn();
vi.mock("@/lib/auth/session", () => ({ getSession: () => getSession() }));

const { GET: health } = await import("@/app/api/health/route");
const { GET: list, POST: submit } = await import("@/app/api/leave-requests/route");
const { POST: decide } = await import("@/app/api/leave-requests/[id]/decision/route");
const { GET: audit } = await import("@/app/api/audit/[userId]/route");
const { GET: accrualCron, POST: accrualManual } = await import("@/app/api/jobs/accrual/route");

const session = (userId: string, role: string, managerId: string | null = null) => ({
  userId,
  role,
  name: "x",
  email: "x@leavetrack.test",
  managerId,
});
const ANA = session(USER_IDS.ana, "employee", USER_IDS.ben);
const BEN = session(USER_IDS.ben, "manager");
const CARLA = session(USER_IDS.carla, "hr_admin");

/** Validate strictly: unknown keys are a contract violation, not something to ignore. */
async function expectContract(res: Response, status: number, data: z.ZodType) {
  expect(res.status).toBe(status);
  const json = await res.json();
  const schema = status >= 400 ? ErrorEnvelopeSchema : successEnvelope(data);
  const result = schema.safeParse(json);
  expect(result.success, JSON.stringify(result.error?.issues ?? [], null, 1)).toBe(true);
  expect(strictKeys(json, schema)).toEqual([]);
  return json;
}

/** Keys present in the payload but absent from the schema (zod objects strip them silently). */
function strictKeys(value: unknown, schema: z.ZodType, at = "$"): string[] {
  const def = (schema as unknown as { def?: Record<string, unknown> }).def ?? {};
  const type = def.type as string | undefined;
  if (type === "nullable" || type === "optional" || type === "default")
    return value == null ? [] : strictKeys(value, def.innerType as z.ZodType, at);
  if (type === "array" && Array.isArray(value))
    return value.flatMap((v, i) => strictKeys(v, def.element as z.ZodType, `${at}[${i}]`));
  if (type === "union")
    return (def.options as z.ZodType[]).some(
      (o) => o.safeParse(value).success && strictKeys(value, o).length === 0,
    )
      ? []
      : [`${at} (no union member matches strictly)`];
  if (type === "object" && value && typeof value === "object") {
    const shape = (schema as unknown as { shape: Record<string, z.ZodType> }).shape;
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
      k in shape ? strictKeys(v, shape[k]!, `${at}.${k}`) : [`${at}.${k}`],
    );
  }
  return [];
}

const json = (url: string, body: unknown) =>
  new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

beforeEach(() => {
  getSession.mockReset();
  vi.stubEnv("CRON_SECRET", "contract-test-cron-secret");
});
afterEach(() => vi.unstubAllEnvs());

describe("contract: real handlers vs the documented response schemas", () => {
  it("GET /api/health → Health", async () => {
    await expectContract(
      await health(new NextRequest("http://localhost/api/health"), undefined),
      200,
      HealthSchema,
    );
  });

  it("GET /api/leave-requests?scope=mine → MyLeaveContext; ?scope=team → TeamQueue", async () => {
    getSession.mockResolvedValue(ANA);
    const mine = await expectContract(
      await list(new NextRequest("http://localhost/api/leave-requests?scope=mine"), undefined),
      200,
      MyLeaveContextSchema,
    );
    expect(mine.data.balances.length).toBeGreaterThan(0);

    getSession.mockResolvedValue(BEN);
    const team = await expectContract(
      await list(
        new NextRequest("http://localhost/api/leave-requests?scope=team&status=all"),
        undefined,
      ),
      200,
      TeamQueueSchema,
    );
    expect(team.data.requests.length).toBeGreaterThan(0);
  });

  it("POST /api/leave-requests → 201 SubmitLeaveRequestResult; then POST …/decision → DecideLeaveRequestResult", async () => {
    getSession.mockResolvedValue(ANA);
    const created = await expectContract(
      await submit(
        json("http://localhost/api/leave-requests", {
          leaveTypeId: LEAVE_TYPE_IDS.Vacation,
          startDate: future("2027-05-03"),
          endDate: future("2027-05-04"),
          reason: "Family visit",
        }),
        undefined,
      ),
      201,
      SubmitLeaveRequestResultSchema,
    );

    getSession.mockResolvedValue(BEN);
    const id = created.data.request.id as string;
    await expectContract(
      await decide(
        json(`http://localhost/api/leave-requests/${id}/decision`, { decision: "approve" }),
        {
          params: Promise.resolve({ id }),
        },
      ),
      200,
      DecideLeaveRequestResultSchema,
    );
    // Deciding again: the documented 409.
    await expectContract(
      await decide(
        json(`http://localhost/api/leave-requests/${id}/decision`, { decision: "approve" }),
        {
          params: Promise.resolve({ id }),
        },
      ),
      409,
      ErrorEnvelopeSchema,
    );
  });

  it("GET /api/audit/{userId} → EmployeeAuditHistory (with events)", async () => {
    getSession.mockResolvedValue(CARLA);
    const res = await expectContract(
      await audit(new NextRequest(`http://localhost/api/audit/${USER_IDS.ana}`), {
        params: Promise.resolve({ userId: USER_IDS.ana }),
      }),
      200,
      EmployeeAuditHistorySchema,
    );
    expect(res.data.requests.some((r: { events: unknown[] }) => r.events.length > 0)).toBe(true);
  });

  it("GET and POST /api/jobs/accrual → AccrualResult (memory store)", async () => {
    const auth = { authorization: "Bearer contract-test-cron-secret" };
    for (const handler of [accrualCron, accrualManual]) {
      await expectContract(
        await handler(
          new NextRequest("http://localhost/api/jobs/accrual", { method: "POST", headers: auth }),
          undefined,
        ),
        200,
        AccrualResultSchema,
      );
    }
  });
});

describe("contract: TASK-026 approvals queue for an HR Admin", () => {
  it("GET ?scope=team as an HR Admin → TeamQueue of the managers' requests", async () => {
    getSession.mockResolvedValue(CARLA);
    const team = await expectContract(
      await list(
        new NextRequest("http://localhost/api/leave-requests?scope=team&status=all"),
        undefined,
      ),
      200,
      TeamQueueSchema,
    );
    expect(team.data.requests.length).toBeGreaterThan(0);
  });
});

describe("contract: TASK-027 overlap", () => {
  it("POST an overlapping request → 400 envelope with the overlap message", async () => {
    getSession.mockResolvedValue(ANA);
    const body = (start: string, end: string) =>
      json("http://localhost/api/leave-requests", {
        leaveTypeId: LEAVE_TYPE_IDS.Vacation,
        startDate: start,
        endDate: end,
        reason: "Family visit",
      });
    await expectContract(
      await submit(body(future("2027-09-06"), future("2027-09-08")), undefined),
      201,
      SubmitLeaveRequestResultSchema,
    );
    const res = await expectContract(
      await submit(body(future("2027-09-08"), future("2027-09-09")), undefined),
      400,
      ErrorEnvelopeSchema,
    );
    expect(res.error.message).toBe(OVERLAP_MESSAGE);
  });
});

describe("contract: documented error statuses come back in the envelope", () => {
  it.each([
    [
      "401 no session (leave requests)",
      () => list(new NextRequest("http://localhost/api/leave-requests?scope=mine"), undefined),
      null,
      401,
    ],
    [
      "400 bad scope",
      () => list(new NextRequest("http://localhost/api/leave-requests?scope=all"), undefined),
      ANA,
      400,
    ],
    [
      "403 team queue for an employee",
      () => list(new NextRequest("http://localhost/api/leave-requests?scope=team"), undefined),
      ANA,
      403,
    ],
    [
      "400 invalid submit body",
      () => submit(json("http://localhost/api/leave-requests", {}), undefined),
      ANA,
      400,
    ],
    [
      "403 decision by a non-manager",
      () =>
        decide(
          json(`http://localhost/api/leave-requests/${USER_IDS.ana}/decision`, {
            decision: "approve",
          }),
          {
            params: Promise.resolve({ id: USER_IDS.ana }),
          },
        ),
      ANA,
      403,
    ],
    [
      "404 decision on an unknown request",
      () =>
        decide(
          json(
            "http://localhost/api/leave-requests/00000000-0000-4000-8000-00000000ffff/decision",
            { decision: "approve" },
          ),
          {
            params: Promise.resolve({ id: "00000000-0000-4000-8000-00000000ffff" }),
          },
        ),
      BEN,
      404,
    ],
    [
      "403 audit for a non-HR user",
      () =>
        audit(new NextRequest(`http://localhost/api/audit/${USER_IDS.ana}`), {
          params: Promise.resolve({ userId: USER_IDS.ana }),
        }),
      BEN,
      403,
    ],
    [
      "404 audit for an unknown employee",
      () =>
        audit(new NextRequest("http://localhost/api/audit/00000000-0000-4000-8000-00000000ffff"), {
          params: Promise.resolve({ userId: "00000000-0000-4000-8000-00000000ffff" }),
        }),
      CARLA,
      404,
    ],
    [
      "409 submit with no eligible approver (TASK-026: the only HR Admin)",
      () =>
        submit(
          json("http://localhost/api/leave-requests", {
            leaveTypeId: LEAVE_TYPE_IDS.Vacation,
            startDate: future("2027-06-07"),
            endDate: future("2027-06-08"),
            reason: "Conference",
          }),
          undefined,
        ),
      CARLA,
      409,
    ],
    [
      "401 accrual without the Bearer token",
      () => accrualCron(new NextRequest("http://localhost/api/jobs/accrual"), undefined),
      null,
      401,
    ],
  ] as const)("%s", async (_label, call, who, status) => {
    getSession.mockResolvedValue(who);
    await expectContract(await call(), status, ErrorEnvelopeSchema);
  });
});
