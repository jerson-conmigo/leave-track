import { describe, expect, it } from "vitest";
import {
  canAccess,
  isPublicPath,
  isRole,
  REDIRECT_GUARDS,
  redirectRejection,
  safeRedirectPath,
} from "@/lib/auth/roles";

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
    // TASK-024 account pages, reached from emailed links before a session exists.
    expect(isPublicPath("/forgot-password")).toBe(true);
    expect(isPublicPath("/auth/confirm")).toBe(true);
    expect(isPublicPath("/auth/set-password")).toBe(true);
    expect(isPublicPath("/auth")).toBe(false);
    expect(isPublicPath("/auth/other")).toBe(false);
  });

  it("validates role cookie values", () => {
    expect(isRole("manager")).toBe(true);
    expect(isRole("admin")).toBe(false);
    expect(isRole(undefined)).toBe(false);
  });
});

describe("safeRedirectPath", () => {
  // TASK-020: a corpus of every open-redirect form browsers would resolve off-site.
  const ALLOWED: [string, string][] = [
    ["/approvals?x=1", "/approvals?x=1"],
    ["/requests/new", "/requests/new"],
    ["/audit?from=2027-01-01&to=2027-01-31", "/audit?from=2027-01-01&to=2027-01-31"],
    ["/balance#vacation", "/balance#vacation"],
    ["/a/../requests", "/requests"],
    ["/%2F%2Fevil.com", "/%2F%2Fevil.com"],
  ];
  it.each(ALLOWED)("allows same-origin path %j → %j", (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });

  const REJECTED: [string, unknown][] = [
    ["undefined", undefined],
    ["null", null],
    ["a number", 42],
    ["empty", ""],
    ["relative", "dashboard"],
    ["leading spaces", "   /x"],
    ["protocol-relative", "//evil.com"],
    ["triple slash", "///evil.com"],
    ["slash-backslash", "/\\evil.com"],
    ["double backslash", "\\\\evil.com"],
    ["backslash-slash", "\\/evil.com"],
    ["tab", "/\t/evil.com"],
    ["newline", "/\n/evil.com"],
    ["carriage return", "/\r/evil.com"],
    ["tab + backslash", "/\t\\evil.com"],
    ["leading tab", "\t//evil.com"],
    ["NUL", "/\u0000/evil.com"],
    ["unit separator", "/\u001f/x"],
    ["DEL", "/\u007f/x"],
    ["absolute https", "https://evil.com"],
    ["scheme, one slash", "http:/evil.com"],
    ["scheme, no slash", "http:evil.com"],
    ["javascript:", "javascript:alert(1)"],
    ["data:", "data:text/html,x"],
    ["mailto:", "mailto:a@b.c"],
    ["/login (loop)", "/login"],
    ["/login with query", "/login?next=/x"],
    ["/login/ nested", "/login/x"],
    ["/api route", "/api/health"],
    ["/api root", "/api"],
    ["over 2,048 characters", "/" + "a".repeat(2048)],
  ];
  it.each(REJECTED)("rejects %s → /dashboard", (_label, input) => {
    expect(safeRedirectPath(input)).toBe("/dashboard");
  });

  it("accepts exactly 2,048 characters", () => {
    const max = "/" + "a".repeat(2047);
    expect(safeRedirectPath(max)).toBe(max);
  });

  it("honours a custom fallback", () => {
    expect(safeRedirectPath("//evil.com", "/requests")).toBe("/requests");
  });

  it("every output resolves to the app's own origin (browser URL parsing)", () => {
    const base = "https://app.leavetrack.test";
    for (const [, input] of [...REJECTED, ...ALLOWED.map(([i]) => [i, i] as const)]) {
      expect(new URL(safeRedirectPath(input), base).origin).toBe(base);
    }
  });
});

describe("redirect guards — each layer tested on its own (TASK-020)", () => {
  const guard = (name: string) => {
    const g = REDIRECT_GUARDS.find((x) => x.name === name);
    if (!g) throw new Error(`no guard ${name}`);
    return g.rejects;
  };

  it("runs exactly these guards, in this order", () => {
    expect(REDIRECT_GUARDS.map((g) => g.name)).toEqual([
      "length",
      "unsafe-characters",
      "not-root-relative",
      "cross-origin",
      "reserved-path",
    ]);
  });

  it("length: empty and over 2,048 rejected; 2,048 allowed", () => {
    expect(guard("length")("")).toBe(true);
    expect(guard("length")("/" + "a".repeat(2048))).toBe(true);
    expect(guard("length")("/" + "a".repeat(2047))).toBe(false);
  });

  it.each(["\t", "\n", "\r", "\u0000", "\u001f", "\u007f", "\\"])(
    "unsafe-characters: rejects %j anywhere",
    (ch) => {
      expect(guard("unsafe-characters")(`/a${ch}b`)).toBe(true);
    },
  );
  it("unsafe-characters: allows ordinary paths (including encoded %09 and %5C)", () => {
    expect(guard("unsafe-characters")("/requests?q=a%09b%5Cc")).toBe(false);
  });

  it.each(["//evil.com", "dashboard", " /x", "https://evil.com"])(
    "not-root-relative: rejects %j",
    (input) => {
      expect(guard("not-root-relative")(input)).toBe(true);
    },
  );
  it("not-root-relative: allows /x", () => {
    expect(guard("not-root-relative")("/x")).toBe(false);
  });

  // Called directly, bypassing the earlier guards — the only way to reach this layer.
  it.each(["//evil.com", "/\\evil.com", "/\t/evil.com", "https://evil.com", "http:evil.com"])(
    "cross-origin: rejects %j on its own",
    (input) => {
      expect(guard("cross-origin")(input)).toBe(true);
    },
  );
  it("cross-origin: allows same-origin paths", () => {
    expect(guard("cross-origin")("/requests?x=1#y")).toBe(false);
  });

  it.each(["/login", "/login/x", "/login?next=/a", "/api", "/api/health"])(
    "reserved-path: rejects %j",
    (input) => {
      expect(guard("reserved-path")(input)).toBe(true);
    },
  );
  it.each(["/loginx", "/apix", "/dashboard"])("reserved-path: allows %j", (input) => {
    expect(guard("reserved-path")(input)).toBe(false);
  });

  it("redirectRejection names the first guard that fires", () => {
    expect(redirectRejection(42)).toBe("not-a-string");
    expect(redirectRejection("/\t/evil.com")).toBe("unsafe-characters");
    expect(redirectRejection("/\\evil.com")).toBe("unsafe-characters");
    expect(redirectRejection("//evil.com")).toBe("not-root-relative");
    expect(redirectRejection("/api/x")).toBe("reserved-path");
    expect(redirectRejection("/requests")).toBeNull();
  });
});
