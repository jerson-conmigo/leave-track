import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { Validator } from "@seriousme/openapi-schema-validator";
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import { ERROR_STATUS } from "@/lib/api/errors";
import { buildOpenApiDocument } from "@/lib/api/openapi";
import {
  AccrualResultSchema,
  BalanceSummarySchema,
  DecideLeaveRequestResultSchema,
  EmployeeAuditHistorySchema,
  ErrorCodeSchema,
  LeaveRequestViewSchema,
  MyLeaveContextSchema,
  SubmitLeaveRequestResultSchema,
  TeamQueueSchema,
  TeamRequestViewSchema,
} from "@/lib/api/schemas";
import type {
  AccrualResult,
  BalanceSummary,
  DecideLeaveRequestResult,
  EmployeeAuditHistory,
  LeaveRequestView,
  MyLeaveContext,
  SubmitLeaveRequestResult,
  TeamQueue,
  TeamRequestView,
} from "@/lib/data/types";
import { AuditParamsSchema, AuditQuerySchema, ListQuerySchema } from "@/lib/validation/api";
import { DecisionSchema, LeaveRequestSchema } from "@/lib/validation/leave-request";

/**
 * TASK-057 — the OpenAPI document is valid OpenAPI 3.1, documents EXACTLY the real API routes,
 * derives its request schemas from the zod schemas the routes use, mirrors the TypeScript
 * response types, sets security per operation as the routes enforce it, and carries no
 * environment values.
 */
const root = path.resolve(import.meta.dirname, "../..");
type Doc = ReturnType<typeof buildOpenApiDocument>;
type Operation = {
  security?: Record<string, string[]>[];
  responses: Record<string, { content?: Record<string, { schema: unknown }> }>;
  parameters?: unknown[];
  requestBody?: { content: Record<string, { schema: unknown }> };
};
const doc = buildOpenApiDocument();
const operations = (d: Doc = doc) =>
  Object.entries(d.paths).flatMap(([p, ops]) =>
    Object.entries(ops as Record<string, Operation>).map(([method, op]) => ({ p, method, op })),
  );

/** Routes the document deliberately leaves out (test-only hook; the document itself). */
const EXCLUDED = ["/api/test/reset", "/api/openapi.json"];

/** Every exported HTTP method of every app/api/**\/route.ts, as "METHOD /path/{param}". */
function routeOperations(): string[] {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = path.join(dir, f);
      return statSync(p).isDirectory() ? walk(p) : f === "route.ts" ? [p] : [];
    });
  return walk(path.join(root, "app/api")).flatMap((file) => {
    const route =
      "/" +
      path
        .relative(path.join(root, "app"), path.dirname(file))
        .split(path.sep)
        .map((s) => s.replace(/^\[(.+)\]$/, "{$1}"))
        .join("/");
    const src = readFileSync(file, "utf8");
    const methods = [
      ...src.matchAll(/export (?:const|async function|function) (GET|POST|PUT|PATCH|DELETE)\b/g),
    ].map((m) => m[1]!);
    const destructured = src.match(/export const \{([^}]+)\} = /)?.[1] ?? "";
    methods.push(...(destructured.match(/\b(GET|POST|PUT|PATCH|DELETE)\b/g) ?? []));
    return methods.map((m) => `${m} ${route}`);
  });
}

describe("OpenAPI 3.1 validity", () => {
  it("validates against the official OpenAPI 3.1 schema", async () => {
    const validator = new Validator();
    const result = await validator.validate(structuredClone(doc));
    expect(result.errors ?? []).toEqual([]);
    expect(result.valid).toBe(true);
    expect(validator.version).toBe("3.1");
    expect(doc.openapi).toBe("3.1.0");
  });

  it("the validator does reject a broken document (guards against a vacuous pass)", async () => {
    const broken = structuredClone(doc) as Record<string, unknown>;
    delete broken.info;
    expect((await new Validator().validate(broken)).valid).toBe(false);
  });

  it("every $ref resolves to a component schema", () => {
    const refs = [...JSON.stringify(doc).matchAll(/"\$ref":"#\/components\/schemas\/([^"]+)"/g)];
    expect(refs.length).toBeGreaterThan(0);
    for (const [, name] of refs) expect(doc.components.schemas).toHaveProperty(name!);
  });
});

describe("coverage: exactly the real routes", () => {
  it("documents every route + method and nothing else", () => {
    const real = routeOperations()
      .filter((o) => !EXCLUDED.includes(o.split(" ")[1]!))
      .sort();
    const documented = operations()
      .map(({ p, method }) => `${method.toUpperCase()} ${p}`)
      .sort();
    expect(documented).toEqual(real);
    // Sanity: the scan really found the API (a broken scan must not pass vacuously).
    expect(real).toEqual(
      [
        "GET /api/audit/{userId}",
        "GET /api/health",
        "GET /api/jobs/accrual",
        "GET /api/leave-requests",
        "POST /api/jobs/accrual",
        "POST /api/leave-requests",
        "POST /api/leave-requests/{id}/decision",
      ].sort(),
    );
  });

  it("the test-only reset hook, the docs routes and server actions are not documented", () => {
    const json = JSON.stringify(doc);
    for (const hidden of ["/api/test/reset", "/api/openapi.json", "/api-docs", "x-e2e-reset"]) {
      expect(json).not.toContain(hidden);
    }
    expect(Object.keys(doc.paths).every((p) => p.startsWith("/api/"))).toBe(true);
  });
});

describe("security per operation, as the routes enforce it", () => {
  const EXPECTED: Record<string, unknown[]> = {
    "get /api/health": [],
    "get /api/leave-requests": [{ cookieAuth: [] }],
    "post /api/leave-requests": [{ cookieAuth: [] }],
    "post /api/leave-requests/{id}/decision": [{ cookieAuth: [] }],
    "get /api/audit/{userId}": [{ cookieAuth: [] }],
    "get /api/jobs/accrual": [{ bearerAuth: [] }],
    "post /api/jobs/accrual": [{ bearerAuth: [] }],
  };

  it("each operation declares exactly its scheme (no global default to inherit)", () => {
    expect(doc).not.toHaveProperty("security");
    const actual = Object.fromEntries(
      operations().map(({ p, method, op }) => [`${method} ${p}`, op.security]),
    );
    expect(actual).toEqual(EXPECTED);
  });

  it("the schemes are the session cookie and the cron Bearer token — names only", () => {
    expect(doc.components.securitySchemes).toEqual({
      cookieAuth: expect.objectContaining({ type: "apiKey", in: "cookie", name: "lt-session" }),
      bearerAuth: expect.objectContaining({ type: "http", scheme: "bearer" }),
    });
  });

  it("every authenticated operation documents 401; role-gated ones document 403", () => {
    for (const { p, method, op } of operations()) {
      const authed = (op.security ?? []).length > 0;
      expect(Object.keys(op.responses).includes("401"), `${method} ${p}`).toBe(authed);
    }
    for (const key of [
      "get /api/leave-requests",
      "post /api/leave-requests/{id}/decision",
      "get /api/audit/{userId}",
    ]) {
      const [method, p] = key.split(" ") as [string, string];
      expect(
        Object.keys(
          (doc.paths as Record<string, Record<string, Operation>>)[p]![method]!.responses,
        ),
      ).toContain("403");
    }
  });
});

describe("responses use the envelope", () => {
  it("every error response is the ErrorEnvelope; every operation documents 500", () => {
    for (const { p, method, op } of operations()) {
      expect(op.responses, `${method} ${p}`).toHaveProperty("500");
      for (const [status, res] of Object.entries(op.responses)) {
        const schema = res.content?.["application/json"]?.schema as Record<string, unknown>;
        if (Number(status) >= 400) {
          expect(schema, `${method} ${p} ${status}`).toEqual({
            $ref: "#/components/schemas/ErrorEnvelope",
          });
        } else {
          expect(schema, `${method} ${p} ${status}`).toMatchObject({
            properties: { success: { const: true } },
            required: ["success", "data"],
          });
        }
      }
    }
  });

  it("the documented error codes are exactly the app's codes", () => {
    expect([...ErrorCodeSchema.options].sort()).toEqual(Object.keys(ERROR_STATUS).sort());
    const envelope = doc.components.schemas.ErrorEnvelope as {
      properties: { error: { properties: { code: { enum: string[] } } } };
    };
    expect(envelope.properties.error.properties.code.enum.sort()).toEqual(
      Object.keys(ERROR_STATUS).sort(),
    );
  });
});

describe("request schemas come from the routes' own zod schemas", () => {
  const input = (s: z.ZodType) => {
    const json = { ...(z.toJSONSchema(s, { io: "input" }) as Record<string, unknown>) };
    delete json.$schema;
    return json;
  };
  const paths = doc.paths as Record<string, Record<string, Operation>>;

  it("bodies: LeaveRequestSchema and DecisionSchema", () => {
    expect(
      paths["/api/leave-requests"]!.post!.requestBody!.content["application/json"]!.schema,
    ).toEqual(input(LeaveRequestSchema));
    expect(
      paths["/api/leave-requests/{id}/decision"]!.post!.requestBody!.content["application/json"]!
        .schema,
    ).toEqual(input(DecisionSchema));
  });

  it("parameters: ListQuerySchema, AuditParamsSchema, AuditQuerySchema", () => {
    const props = (s: z.ZodType) =>
      (input(s) as { properties: Record<string, unknown> }).properties;
    const schemasOf = (op: Operation) =>
      Object.fromEntries(
        (op.parameters as { name: string; schema: unknown }[]).map((p) => [p.name, p.schema]),
      );
    expect(schemasOf(paths["/api/leave-requests"]!.get!)).toEqual(props(ListQuerySchema));
    expect(schemasOf(paths["/api/audit/{userId}"]!.get!)).toEqual({
      ...props(AuditParamsSchema),
      ...props(AuditQuerySchema),
    });
  });

  it("refinements JSON Schema can't express are stated in the descriptions", () => {
    const text = JSON.stringify(doc);
    expect(text).toContain("`endDate` must be on or after `startDate`");
    expect(text).toContain("A rejection needs a reason (3–500 characters)");
    expect(text).toContain("`from` must be on or before `to`");
  });
});

/** Deep structural form: `A & B` and the merged object zod infers compare as equal. */
type Simplify<T> = T extends (infer U)[]
  ? Simplify<U>[]
  : T extends object
    ? { [K in keyof T]: Simplify<T[K]> }
    : T;
type Inferred<S extends z.ZodType> = Simplify<z.infer<S>>;

describe("response schemas mirror the TypeScript types (compile-time drift guard)", () => {
  it("z.infer of each response schema EQUALS its type (checked by the typecheck gate)", () => {
    expectTypeOf<Inferred<typeof LeaveRequestViewSchema>>().toEqualTypeOf<
      Simplify<LeaveRequestView>
    >();
    expectTypeOf<Inferred<typeof TeamRequestViewSchema>>().toEqualTypeOf<
      Simplify<TeamRequestView>
    >();
    expectTypeOf<Inferred<typeof BalanceSummarySchema>>().toEqualTypeOf<Simplify<BalanceSummary>>();
    expectTypeOf<Inferred<typeof MyLeaveContextSchema>>().toEqualTypeOf<Simplify<MyLeaveContext>>();
    expectTypeOf<Inferred<typeof TeamQueueSchema>>().toEqualTypeOf<Simplify<TeamQueue>>();
    expectTypeOf<Inferred<typeof SubmitLeaveRequestResultSchema>>().toEqualTypeOf<
      Simplify<SubmitLeaveRequestResult>
    >();
    expectTypeOf<Inferred<typeof DecideLeaveRequestResultSchema>>().toEqualTypeOf<
      Simplify<DecideLeaveRequestResult>
    >();
    expectTypeOf<Inferred<typeof EmployeeAuditHistorySchema>>().toEqualTypeOf<
      Simplify<EmployeeAuditHistory>
    >();
    expectTypeOf<Inferred<typeof AccrualResultSchema>>().toEqualTypeOf<Simplify<AccrualResult>>();
  });
});

describe("no environment values in the document", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("secrets and URLs set in the environment never appear; the document doesn't depend on env", () => {
    const baseline = JSON.stringify(buildOpenApiDocument());
    const SENTINELS = {
      CRON_SECRET: "sentinel-cron-secret-7f3a",
      SESSION_SECRET: "sentinel-session-secret-7f3a",
      SUPABASE_SERVICE_ROLE_KEY: "sentinel-service-role-7f3a",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "sentinel-anon-key-7f3a",
      E2E_RESET_TOKEN: "sentinel-reset-token-7f3a",
      DATABASE_URL: "postgresql://sentinel:pw@db.sentinel.example:6543/postgres",
      NEXT_PUBLIC_SUPABASE_URL: "https://sentinel.supabase.co",
    };
    for (const [k, v] of Object.entries(SENTINELS)) vi.stubEnv(k, v);
    const json = JSON.stringify(buildOpenApiDocument());
    for (const v of Object.values(SENTINELS)) expect(json).not.toContain(v);
    expect(json).toBe(baseline);
  });

  it("the builder reads nothing from process.env", () => {
    const src = readFileSync(path.join(root, "lib/api/openapi.ts"), "utf8");
    expect(src).not.toMatch(/process\.env|@\/lib\/env/);
  });
});
