import { describe, expect, it } from "vitest";
import { canAccess, isPublicPath, isRole, safeRedirectPath } from "@/lib/auth/roles";

describe("route access matrix", () => {
  it("gives every role the employee pages", () => {
    for (const role of ["employee", "manager", "hr_admin"] as const) {
      for (const path of ["/dashboard", "/requests", "/requests/new", "/balance"]) {
        expect(canAccess(path, role)).toBe(true);
      }
    }
  });

  it("limits /approvals to managers", () => {
    expect(canAccess("/approvals", "manager")).toBe(true);
    expect(canAccess("/approvals", "employee")).toBe(false);
    expect(canAccess("/approvals", "hr_admin")).toBe(false);
  });

  it("limits /audit and /policies to HR admins, including nested paths", () => {
    expect(canAccess("/audit", "hr_admin")).toBe(true);
    expect(canAccess("/audit/123", "manager")).toBe(false);
    expect(canAccess("/policies", "employee")).toBe(false);
  });

  it("does not treat lookalike prefixes as protected routes", () => {
    expect(canAccess("/auditorium", "employee")).toBe(true);
  });

  it("recognises public paths", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/api/health")).toBe(true);
    expect(isPublicPath("/dashboard")).toBe(false);
  });

  it("validates role cookie values", () => {
    expect(isRole("manager")).toBe(true);
    expect(isRole("admin")).toBe(false);
    expect(isRole(undefined)).toBe(false);
  });
});

describe("safeRedirectPath", () => {
  it("allows same-origin relative paths", () => {
    expect(safeRedirectPath("/approvals?x=1")).toBe("/approvals?x=1");
  });

  it("rejects open redirects", () => {
    expect(safeRedirectPath("//evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("https://evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("/\\evil.example")).toBe("/dashboard");
    expect(safeRedirectPath(undefined)).toBe("/dashboard");
  });
});
