import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockAuthProvider } from "@/lib/auth/provider";
import { SESSION_COOKIE } from "@/lib/auth/cookies";
import { NOT_LINKED_MESSAGE } from "@/lib/auth/sign-in";
import { USER_IDS } from "@/lib/data/mock/fixtures";
import { mockDb, resetMockDb } from "@/lib/data/mock/store";
import { memoryRateLimitStore } from "@/lib/rate-limit/memory-store";
import { fakeJar, fakeSupabaseProvider, type FakeProvider } from "./fake-provider";

/**
 * TASK-024 — the sign-in, sign-out, invite/reset and set-password transports.
 *  - The users row is found ONLY by users.auth_user_id; valid credentials with no
 *    linked row never leave a session behind (AC2).
 *  - The mock picker is refused whenever a real provider is configured.
 *  - Sign-out revokes the provider session (AC3).
 *  - The emailed-link route has a FIXED destination (no open redirect).
 */
const state = vi.hoisted(() => ({ provider: null as unknown, jar: null as unknown }));
vi.mock("@/lib/auth/provider", async (orig) => ({
  ...(await orig<typeof import("@/lib/auth/provider")>()),
  getAuthProvider: () => state.provider,
}));
// TASK-025: the sign-in throttle reads request headers (client IP) — none in these tests.
vi.mock("next/headers", () => ({
  cookies: async () => state.jar,
  headers: async () => new Headers(),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

const { loginAction, passwordLoginAction, logoutAction } =
  await import("@/app/(public)/login/actions");
const { setPasswordAction } = await import("@/app/(public)/auth/set-password/actions");
const { forgotPasswordAction } = await import("@/app/(public)/forgot-password/actions");
const { GET: confirm } = await import("@/app/(public)/auth/confirm/route");

const ANA_AUTH = "30000000-0000-4000-8000-000000000101";
let provider: FakeProvider;
let jar: ReturnType<typeof fakeJar>;

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
};
const redirectOf = async (p: Promise<unknown>) =>
  p.then(
    (v) => ({ returned: v }),
    (e: Error) => ({ redirect: e.message.replace(/^REDIRECT /, "") }),
  );

beforeEach(() => {
  resetMockDb();
  memoryRateLimitStore.clear(); // TASK-025: failed sign-ins in other files mustn't throttle these
  mockDb.authLinks.push({ authUserId: ANA_AUTH, userId: USER_IDS.ana });
  provider = fakeSupabaseProvider();
  jar = fakeJar();
  state.provider = provider;
  state.jar = jar;
});
afterEach(() => resetMockDb());

describe("passwordLoginAction", () => {
  const creds = { email: "ana@example.com", password: "correct horse battery" };

  it("linked provider user → signed session for the LINKED user, redirect to a safe next (AC1)", async () => {
    provider.signInWithPassword.mockResolvedValue({ ok: true, authUserId: ANA_AUTH });
    const out = await redirectOf(
      passwordLoginAction({}, form({ ...creds, next: "/requests?tab=mine" })),
    );
    expect(out).toEqual({ redirect: "/requests?tab=mine" });
    const claims = provider.readSessionToken(jar.store.get(SESSION_COOKIE));
    expect(claims).toMatchObject({ uid: USER_IDS.ana, role: "employee" });
    expect(provider.signInWithPassword).toHaveBeenCalledWith(
      expect.anything(),
      creds.email,
      creds.password,
    );
  });

  it("an unsafe next falls back to /dashboard", async () => {
    provider.signInWithPassword.mockResolvedValue({ ok: true, authUserId: ANA_AUTH });
    expect(
      await redirectOf(passwordLoginAction({}, form({ ...creds, next: "//evil.example" }))),
    ).toEqual({ redirect: "/dashboard" });
  });

  it("wrong credentials → a generic error and no session", async () => {
    const out = await passwordLoginAction({}, form(creds));
    expect(out).toEqual({ error: "Email or password is incorrect." });
    expect(jar.store.has(SESSION_COOKIE)).toBe(false);
  });

  it("valid credentials but NO linked users row → refused, provider session revoked (AC2)", async () => {
    provider.signInWithPassword.mockResolvedValue({
      ok: true,
      authUserId: "30000000-0000-4000-8000-00000000dead",
    });
    const out = await passwordLoginAction({}, form(creds));
    expect(out).toEqual({ error: NOT_LINKED_MESSAGE });
    expect(provider.signOut).toHaveBeenCalledOnce();
    expect(jar.store.has(SESSION_COOKIE)).toBe(false);
  });

  it("never matches by email: a provider user whose email equals a user's is still refused", async () => {
    const ana = mockDb.users.find((u) => u.id === USER_IDS.ana)!;
    provider.signInWithPassword.mockResolvedValue({
      ok: true,
      authUserId: "30000000-0000-4000-8000-00000000beef",
    });
    expect(await passwordLoginAction({}, form({ ...creds, email: ana.email }))).toEqual({
      error: NOT_LINKED_MESSAGE,
    });
  });

  it.each([
    ["a bad email", { email: "nope", password: "x" }, /work email/],
    ["no password", { email: "a@x.co", password: "" }, /password/],
  ])("%s → validation error before the provider is called", async (_l, fields, message) => {
    const out = await passwordLoginAction({}, form(fields));
    expect(out.error).toMatch(message);
    expect(provider.signInWithPassword).not.toHaveBeenCalled();
  });

  it("is refused with the mock adapter", async () => {
    state.provider = mockAuthProvider;
    expect(await passwordLoginAction({}, form(creds))).toEqual({
      error: "Password sign-in isn't enabled.",
    });
  });
});

describe("mock picker (loginAction) can never bypass a real provider", () => {
  it("is refused when AUTH_PROVIDER=supabase — no session is created", async () => {
    const out = await loginAction({}, form({ userId: USER_IDS.carla }));
    expect(out.error).toMatch(/email and password/);
    expect(jar.store.has(SESSION_COOKIE)).toBe(false);
  });

  it("still works with the mock adapter (dev/test)", async () => {
    state.provider = mockAuthProvider;
    expect(await redirectOf(loginAction({}, form({ userId: USER_IDS.ana })))).toEqual({
      redirect: "/dashboard",
    });
    expect(jar.store.has(SESSION_COOKIE)).toBe(true);
  });
});

describe("logoutAction (AC3)", () => {
  it("revokes the provider session, then clears our cookies", async () => {
    jar.set(SESSION_COOKIE, "token");
    jar.set("mock-role", "hr_admin");
    expect(await redirectOf(logoutAction())).toEqual({ redirect: "/login" });
    expect(provider.signOut).toHaveBeenCalledOnce();
    expect(jar.deleted).toEqual(expect.arrayContaining([SESSION_COOKIE, "mock-role"]));
  });
});

describe("/auth/confirm (emailed invite / reset links)", () => {
  const get = (query: string) =>
    confirm(new NextRequest(`http://localhost/auth/confirm${query}`), undefined);

  it.each(["invite", "recovery"] as const)("a valid %s link → /auth/set-password", async (type) => {
    provider.verifyEmailLink.mockResolvedValue(true);
    const res = await get(`?token_hash=abc&type=${type}`);
    expect(res.headers.get("location")).toBe("http://localhost/auth/set-password");
    expect(provider.verifyEmailLink).toHaveBeenCalledWith(expect.anything(), "abc", type);
  });

  it("the destination is FIXED: next / redirect_to in the query are ignored", async () => {
    provider.verifyEmailLink.mockResolvedValue(true);
    const res = await get(
      "?token_hash=abc&type=invite&next=//evil.example&redirect_to=https://evil.example",
    );
    expect(res.headers.get("location")).toBe("http://localhost/auth/set-password");
  });

  it.each([
    ["an expired or used token", "?token_hash=abc&type=invite"],
    ["a missing token", "?type=invite"],
    ["an unsupported type", "?token_hash=abc&type=signup"],
  ])("%s → /login?error=link", async (_l, query) => {
    const res = await get(query);
    expect(res.headers.get("location")).toBe("http://localhost/login?error=link");
  });

  it("404 envelope with the mock adapter", async () => {
    state.provider = mockAuthProvider;
    const res = await get("?token_hash=abc&type=invite");
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("NOT_FOUND");
  });
});

describe("setPasswordAction", () => {
  const pw = { password: "a-long-new-password", confirm: "a-long-new-password" };

  it("linked identity → password set, signed in as the linked user, /dashboard", async () => {
    provider.setPassword.mockResolvedValue({ ok: true, authUserId: ANA_AUTH });
    expect(await redirectOf(setPasswordAction({}, form(pw)))).toEqual({ redirect: "/dashboard" });
    expect(provider.readSessionToken(jar.store.get(SESSION_COOKIE))?.uid).toBe(USER_IDS.ana);
  });

  it("unlinked identity → signed out, /login?error=not-linked, no session (AC2)", async () => {
    provider.setPassword.mockResolvedValue({
      ok: true,
      authUserId: "30000000-0000-4000-8000-00000000dead",
    });
    expect(await redirectOf(setPasswordAction({}, form(pw)))).toEqual({
      redirect: "/login?error=not-linked",
    });
    expect(provider.signOut).toHaveBeenCalledOnce();
    expect(jar.store.has(SESSION_COOKIE)).toBe(false);
  });

  it("no provider session / refused → an error, no session", async () => {
    const out = await setPasswordAction({}, form(pw));
    expect(out.error).toMatch(/expired/);
    expect(jar.store.has(SESSION_COOKIE)).toBe(false);
  });

  it.each([
    ["too short", { password: "short", confirm: "short" }, /at least 12/],
    ["over 72 bytes", { password: "é".repeat(37), confirm: "é".repeat(37) }, /at most 72/],
    ["mismatch", { password: "a-long-new-password", confirm: "different-password!" }, /match/],
  ])("%s → validation error before the provider is called", async (_l, fields, message) => {
    expect((await setPasswordAction({}, form(fields))).error).toMatch(message);
    expect(provider.setPassword).not.toHaveBeenCalled();
  });
});

describe("forgotPasswordAction (no account enumeration)", () => {
  it.each(["ana@example.com", "nobody@example.com"])("%s → the same answer", async (email) => {
    expect(await forgotPasswordAction({}, form({ email }))).toEqual({ sent: true });
  });

  it("the reset link target comes from configuration, not the request", async () => {
    await forgotPasswordAction({}, form({ email: "ana@example.com" }));
    expect(provider.requestPasswordReset).toHaveBeenCalledWith(
      "ana@example.com",
      "http://localhost:3000/auth/set-password",
    );
  });

  it("a bad email → validation error; the mock adapter → refused", async () => {
    expect((await forgotPasswordAction({}, form({ email: "nope" }))).error).toMatch(/email/);
    state.provider = mockAuthProvider;
    expect((await forgotPasswordAction({}, form({ email: "a@x.co" }))).error).toMatch(
      /isn't enabled/,
    );
  });
});
