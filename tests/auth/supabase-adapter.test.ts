import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CookieIO, CookieToSet } from "@/lib/auth/cookie-io";

/**
 * TASK-024 — the Supabase half of the auth port, against a scripted Supabase client
 * (no network). Every failure fails CLOSED, cookies follow the session policy, and
 * sign-out revokes on the server and clears the provider cookies.
 */
const auth = {
  getClaims: vi.fn(),
  getUser: vi.fn(),
  signInWithPassword: vi.fn(),
  verifyOtp: vi.fn(),
  updateUser: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  signOut: vi.fn(),
};
const createServerClient = vi.fn((..._args: unknown[]) => ({ auth }));
vi.mock("@supabase/ssr", () => ({ createServerClient }));
vi.mock("@/lib/env", async (orig) => {
  const actual = await orig<typeof import("@/lib/env")>();
  return {
    ...actual,
    isProduction: true,
    env: {
      ...actual.env,
      AUTH_PROVIDER: "supabase",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    },
  };
});

const { supabaseAccount } = await import("@/lib/auth/supabase/adapter");
const { getAuthProvider, supabaseAuthProvider } = await import("@/lib/auth/provider");

function io(initial: Record<string, string> = {}) {
  const jar = new Map(Object.entries(initial));
  const writes: CookieToSet[] = [];
  const cookies: CookieIO = {
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: (list) => {
      writes.push(...list);
      for (const c of list) jar.set(c.name, c.value);
    },
  };
  return { cookies, writes };
}
const AUTH_ID = "30000000-0000-4000-8000-000000000001";
const expired = (writes: CookieToSet[], name: string) =>
  writes.some((w) => w.name === name && w.value === "" && w.options?.maxAge === 0);

beforeEach(() => {
  for (const fn of Object.values(auth)) fn.mockReset();
  createServerClient.mockClear();
});

describe("selection", () => {
  it("AUTH_PROVIDER=supabase selects the Supabase adapter", () => {
    expect(getAuthProvider()).toBe(supabaseAuthProvider);
    expect(getAuthProvider().name).toBe("supabase");
  });
});

describe("client configuration", () => {
  it("provider cookies are httpOnly, SameSite=Lax, Secure in production, 8h", async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: AUTH_ID } }, error: null });
    await supabaseAccount.currentProviderUser(io().cookies);
    const [url, key, options] = createServerClient.mock.calls[0]! as [string, string, never];
    expect([url, key]).toEqual(["https://project.supabase.co", "anon-key"]);
    expect((options as { cookieOptions: unknown }).cookieOptions).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 8 * 60 * 60,
    });
  });
});

describe("refresh (proxy.ts)", () => {
  it("a verified session → true, and no cookies are cleared", async () => {
    auth.getClaims.mockResolvedValue({ data: { claims: { sub: AUTH_ID } }, error: null });
    const { cookies, writes } = io({ "sb-x-auth-token": "t" });
    expect(await supabaseAccount.refresh(cookies)).toBe(true);
    expect(writes).toEqual([]);
  });

  it.each([
    ["no session", async () => ({ data: null, error: null })],
    ["an auth error", async () => ({ data: null, error: { code: "session_expired" } })],
    ["claims without a subject", async () => ({ data: { claims: {} }, error: null })],
    [
      "Supabase unreachable (throws)",
      async () => {
        throw new TypeError("fetch failed");
      },
    ],
  ])("%s → false, and the provider cookies are expired", async (_l, impl) => {
    auth.getClaims.mockImplementation(impl);
    const { cookies, writes } = io({ "sb-x-auth-token": "t", "lt-session": "keep" });
    expect(await supabaseAccount.refresh(cookies)).toBe(false);
    expect(expired(writes, "sb-x-auth-token")).toBe(true);
    expect(writes.some((w) => w.name === "lt-session")).toBe(false); // not the adapter's cookie
  });
});

describe("currentProviderUser (getSession)", () => {
  it("asks the Auth server (getUser), not the local token", async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: AUTH_ID } }, error: null });
    expect(await supabaseAccount.currentProviderUser(io().cookies)).toBe(AUTH_ID);
    expect(auth.getUser).toHaveBeenCalledOnce();
    expect(auth.getClaims).not.toHaveBeenCalled();
  });

  it.each([
    [
      "a revoked session",
      async () => ({ data: { user: null }, error: { code: "session_not_found" } }),
    ],
    [
      "Supabase unreachable",
      async () => {
        throw new TypeError("fetch failed");
      },
    ],
  ])("%s → null", async (_l, impl) => {
    auth.getUser.mockImplementation(impl);
    expect(await supabaseAccount.currentProviderUser(io().cookies)).toBeNull();
  });
});

describe("signInWithPassword", () => {
  it("valid credentials → the provider user id", async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: { id: AUTH_ID } }, error: null });
    expect(await supabaseAccount.signInWithPassword(io().cookies, "a@x.co", "pw")).toEqual({
      ok: true,
      authUserId: AUTH_ID,
    });
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "a@x.co", password: "pw" });
  });

  it.each([
    [
      "wrong password",
      async () => ({ data: { user: null }, error: { code: "invalid_credentials" } }),
    ],
    [
      "unreachable",
      async () => {
        throw new TypeError("fetch failed");
      },
    ],
  ])("%s → not ok", async (_l, impl) => {
    auth.signInWithPassword.mockImplementation(impl);
    expect(await supabaseAccount.signInWithPassword(io().cookies, "a@x.co", "pw")).toEqual({
      ok: false,
    });
  });
});

describe("email links and passwords", () => {
  it("verifyEmailLink passes the token hash and type, and reports the result", async () => {
    auth.verifyOtp.mockResolvedValueOnce({ error: null });
    expect(await supabaseAccount.verifyEmailLink(io().cookies, "hash", "invite")).toBe(true);
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: "hash", type: "invite" });
    auth.verifyOtp.mockResolvedValueOnce({ error: { code: "otp_expired" } });
    expect(await supabaseAccount.verifyEmailLink(io().cookies, "hash", "recovery")).toBe(false);
  });

  it("setPassword needs a live provider session first", async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: { code: "no_session" } });
    expect(await supabaseAccount.setPassword(io().cookies, "a-long-password")).toEqual({
      ok: false,
    });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("setPassword with a live session updates and returns the user id", async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: AUTH_ID } }, error: null });
    auth.updateUser.mockResolvedValue({ data: { user: { id: AUTH_ID } }, error: null });
    expect(await supabaseAccount.setPassword(io().cookies, "a-long-password")).toEqual({
      ok: true,
      authUserId: AUTH_ID,
    });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "a-long-password" });
  });

  it("requestPasswordReset never throws or reveals a provider error", async () => {
    auth.resetPasswordForEmail.mockResolvedValueOnce({ error: { code: "user_not_found" } });
    await expect(
      supabaseAccount.requestPasswordReset("nobody@x.co", "http://app/auth/set-password"),
    ).resolves.toBeUndefined();
    auth.resetPasswordForEmail.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(
      supabaseAccount.requestPasswordReset("nobody@x.co", "http://app/auth/set-password"),
    ).resolves.toBeUndefined();
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("nobody@x.co", {
      redirectTo: "http://app/auth/set-password",
    });
  });
});

describe("signOut (AC3)", () => {
  it("revokes this session on the Auth server and expires the provider cookies", async () => {
    auth.signOut.mockResolvedValue({ error: null });
    const { cookies, writes } = io({ "sb-x-auth-token": "t", "sb-x-auth-token.1": "u" });
    await supabaseAccount.signOut(cookies);
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(expired(writes, "sb-x-auth-token")).toBe(true);
    expect(expired(writes, "sb-x-auth-token.1")).toBe(true);
  });

  it("still clears the cookies when the server call fails", async () => {
    auth.signOut.mockRejectedValue(new TypeError("fetch failed"));
    const { cookies, writes } = io({ "sb-x-auth-token": "t" });
    await supabaseAccount.signOut(cookies);
    expect(expired(writes, "sb-x-auth-token")).toBe(true);
  });
});
