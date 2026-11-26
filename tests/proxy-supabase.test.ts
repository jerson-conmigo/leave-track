import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE } from "@/lib/auth/cookies";
import { fakeSupabaseProvider, type FakeProvider } from "./auth/fake-provider";

/**
 * TASK-024 — proxy.ts with Supabase Auth: a valid signed token is not enough; the
 * provider session must refresh. Refreshed provider cookies reach the browser on EVERY
 * response (next, redirect, 401/403), and a dead provider session signs the user out.
 */
const state = vi.hoisted(() => ({ provider: null as unknown }));
vi.mock("@/lib/auth/provider", async (orig) => ({
  ...(await orig<typeof import("@/lib/auth/provider")>()),
  getAuthProvider: () => state.provider,
}));
const { proxy } = await import("@/proxy");

const ANA = "00000000-0000-4000-8000-000000000101";
let provider: FakeProvider;
beforeEach(() => {
  provider = fakeSupabaseProvider();
  state.provider = provider;
});

const req = (path: string, cookies: Record<string, string>) =>
  new NextRequest(`http://localhost${path}`, {
    headers: {
      cookie: Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join("; "),
    },
  });
const session = (role: "employee" | "manager" = "employee") => ({
  [SESSION_COOKIE]: provider.createSessionToken({ id: ANA, role }),
  "sb-x-auth-token": "old",
});
const setCookies = (res: Response) => res.headers.getSetCookie().join("\n");

describe("proxy with Supabase Auth", () => {
  it("a dead provider session → unauthenticated; lt-session and provider cookies cleared", async () => {
    provider.refresh.mockImplementation(async (io) => {
      io.setAll([{ name: "sb-x-auth-token", value: "", options: { maxAge: 0, path: "/" } }]);
      return false;
    });
    const page = await proxy(req("/dashboard", session()));
    expect(page.status).toBe(307);
    expect(page.headers.get("location")).toBe("http://localhost/login?next=%2Fdashboard");
    expect(setCookies(page)).toMatch(/lt-session=;/);
    expect(setCookies(page)).toMatch(/sb-x-auth-token=;.*Max-Age=0/);

    const api = await proxy(req("/api/leave-requests", session()));
    expect(api.status).toBe(401);
    expect(setCookies(api)).toMatch(/sb-x-auth-token=;/);
  });

  it("no signed token → unauthenticated without calling the provider", async () => {
    const res = await proxy(req("/dashboard", { "sb-x-auth-token": "valid" }));
    expect(res.status).toBe(307);
    expect(provider.refresh).not.toHaveBeenCalled();
  });

  it("refreshed provider cookies are set on the response AND visible to the page", async () => {
    provider.refresh.mockImplementation(async (io) => {
      io.setAll([{ name: "sb-x-auth-token", value: "new", options: { httpOnly: true } }]);
      return true;
    });
    const res = await proxy(req("/dashboard", session()));
    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(setCookies(res)).toMatch(/sb-x-auth-token=new/);
    // NextResponse.next({ request }) forwards the rewritten request cookies to the page.
    expect(res.headers.get("x-middleware-request-cookie") ?? "").toMatch(/sb-x-auth-token=new/);
  });

  it("refreshed cookies are kept on a role redirect (employee → /approvals)", async () => {
    provider.refresh.mockImplementation(async (io) => {
      io.setAll([{ name: "sb-x-auth-token", value: "new" }]);
      return true;
    });
    const res = await proxy(req("/approvals", session("employee")));
    expect(res.headers.get("location")).toBe("http://localhost/forbidden");
    expect(setCookies(res)).toMatch(/sb-x-auth-token=new/);
  });

  it("public paths never touch the provider", async () => {
    await proxy(req("/login", session()));
    await proxy(req("/auth/confirm", session()));
    expect(provider.refresh).not.toHaveBeenCalled();
  });
});
