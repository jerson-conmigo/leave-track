import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { SESSION_COOKIE } from "@/lib/auth/cookies";
import { getSessionSecret } from "@/lib/auth/session-secret";
import { signSessionToken, type SessionClaims } from "@/lib/auth/session-token";
import type { Role } from "@/lib/data/types";
import { proxy } from "@/proxy";

/** TASK-023 AC1 — proxy.ts only lets a valid SIGNED session through. */
const ANA = "00000000-0000-4000-8000-000000000101";
const now = () => Math.floor(Date.now() / 1000);
const token = (role: Role, secret = getSessionSecret(), c: Partial<SessionClaims> = {}) =>
  signSessionToken({ uid: ANA, role, iat: now(), exp: now() + 3600, ...c }, secret);

const req = (path: string, cookies: Record<string, string> = {}) =>
  new NextRequest(`http://localhost${path}`, {
    headers: {
      cookie: Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join("; "),
    },
  });

const cleared = (res: Response) =>
  (res.headers.get("set-cookie") ?? "").includes(`${SESSION_COOKIE}=;`) ||
  /lt-session=.*(Max-Age=0|Expires=Thu, 01 Jan 1970)/i.test(res.headers.get("set-cookie") ?? "");

describe("proxy", () => {
  it("lets public paths through without a session", async () => {
    expect((await proxy(req("/login"))).headers.get("x-middleware-next")).toBe("1");
    expect((await proxy(req("/api/health"))).headers.get("x-middleware-next")).toBe("1");
  });

  it("no cookie: pages redirect to /login?next=…, APIs get a 401 envelope", async () => {
    const page = await proxy(req("/requests?x=1"));
    expect(page.status).toBe(307);
    expect(page.headers.get("location")).toBe("http://localhost/login?next=%2Frequests%3Fx%3D1");
    const api = await proxy(req("/api/leave-requests"));
    expect(api.status).toBe(401);
    expect(await api.json()).toEqual({
      success: false,
      error: { code: "UNAUTHENTICATED", message: "Sign in to continue." },
    });
  });

  it.each([
    ["forged (other secret)", () => token("hr_admin", "f".repeat(64))],
    ["expired", () => token("employee", undefined, { iat: now() - 9 * 3600, exp: now() - 1 })],
    ["garbage", () => "not-a-token"],
  ])("%s cookie → unauthenticated, and the bad cookie is deleted", async (_l, make) => {
    const value = make();
    const page = await proxy(req("/dashboard", { [SESSION_COOKIE]: value }));
    expect(page.status).toBe(307);
    expect(page.headers.get("location")).toContain("/login");
    expect(cleared(page)).toBe(true);
    const api = await proxy(req("/api/leave-requests", { [SESSION_COOKIE]: value }));
    expect(api.status).toBe(401);
    expect(cleared(api)).toBe(true);
  });

  it("the Day 0 unsigned cookies alone no longer authenticate (impersonation closed)", async () => {
    const res = await proxy(req("/audit", { "mock-role": "hr_admin", "mock-user-id": ANA }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("a valid session passes; role gating still applies (employee → /approvals is 403)", async () => {
    const employee = token("employee");
    expect(
      (await proxy(req("/dashboard", { [SESSION_COOKIE]: employee }))).headers.get(
        "x-middleware-next",
      ),
    ).toBe("1");
    const page = await proxy(req("/approvals", { [SESSION_COOKIE]: employee }));
    expect(page.headers.get("location")).toBe("http://localhost/forbidden");
    const api = await proxy(req("/approvals/x", { [SESSION_COOKIE]: employee }));
    expect(api.status).toBe(307);
    expect(
      (await proxy(req("/approvals", { [SESSION_COOKIE]: token("manager") }))).headers.get(
        "x-middleware-next",
      ),
    ).toBe("1");
  });
});
