import { describe, expect, it } from "vitest";
import { AppError, ERROR_STATUS } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";

describe("API envelope", () => {
  it("ok() wraps data in { success: true, data }", async () => {
    const res = ok({ hello: "world" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, data: { hello: "world" } });
  });

  it("fail(code, message) returns the arch-doc error shape and status", async () => {
    const res = fail("FORBIDDEN", "Not your direct report");
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      success: false,
      error: { code: "FORBIDDEN", message: "Not your direct report" },
    });
  });

  it("fail(AppError) maps the error's code to its HTTP status", async () => {
    const res = fail(new AppError("VALIDATION_ERROR", "End date before start date"));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("every error code maps to a non-2xx status", () => {
    for (const status of Object.values(ERROR_STATUS)) expect(status).toBeGreaterThanOrEqual(400);
  });
});
