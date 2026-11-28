import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE } from "@/lib/auth/cookies";
import { USER_IDS } from "@/lib/data/mock/fixtures";
import { mockDb, resetMockDb } from "@/lib/data/mock/store";
import { fakeJar, fakeSupabaseProvider, type FakeProvider } from "./fake-provider";

/**
 * TASK-024 AC2/AC3 — with Supabase Auth, getSession needs BOTH a valid signed token and
 * a live provider session linked (users.auth_user_id) to the same user. A provider
 * user with no linked row, a revoked session, or another user's token → null.
 */
const state = vi.hoisted(() => ({ provider: null as unknown, jar: null as unknown }));
vi.mock("@/lib/auth/provider", async (orig) => ({
  ...(await orig<typeof import("@/lib/auth/provider")>()),
  getAuthProvider: () => state.provider,
}));
vi.mock("next/headers", () => ({ cookies: async () => state.jar }));
vi.mock("react", async (orig) => ({
  ...(await orig<typeof import("react")>()),
  cache: (fn: unknown) => fn,
}));
const { getSession } = await import("@/lib/auth/session");
const { repository } = await import("@/lib/data/repositories");

const ANA_AUTH = "30000000-0000-4000-8000-000000000101";
const BEN_AUTH = "30000000-0000-4000-8000-000000000011";
let provider: FakeProvider;
let jar: ReturnType<typeof fakeJar>;

const signInAs = (uid: string, role: "employee" | "manager" | "hr_admin") =>
  jar.set(SESSION_COOKIE, provider.createSessionToken({ id: uid, role }));

beforeEach(() => {
  resetMockDb();
  mockDb.authLinks.push(
    { authUserId: ANA_AUTH, userId: USER_IDS.ana },
    { authUserId: BEN_AUTH, userId: USER_IDS.ben },
  );
  provider = fakeSupabaseProvider();
  jar = fakeJar();
  state.provider = provider;
  state.jar = jar;
});
afterEach(() => resetMockDb());

describe("getSession with Supabase Auth", () => {
  it("token + live linked provider session → the session from the DATABASE row (AC1)", async () => {
    signInAs(USER_IDS.ana, "employee");
    provider.currentProviderUser.mockResolvedValue(ANA_AUTH);
    expect(await getSession()).toMatchObject({ userId: USER_IDS.ana, role: "employee" });
  });

  it("no live provider session (signed out / revoked / unreachable) → null (AC3)", async () => {
    signInAs(USER_IDS.ana, "employee");
    provider.currentProviderUser.mockResolvedValue(null);
    expect(await getSession()).toBeNull();
  });

  it("a dead provider session stops BEFORE any user lookup (guard tested on its own)", async () => {
    // The link check below would also return null; this pins the liveness guard itself.
    signInAs(USER_IDS.ana, "employee");
    provider.currentProviderUser.mockResolvedValue(null);
    const byAuth = vi.spyOn(repository, "getUserByAuthUserId");
    const byId = vi.spyOn(repository, "getUserById");
    expect(await getSession()).toBeNull();
    expect(byAuth).not.toHaveBeenCalled();
    expect(byId).not.toHaveBeenCalled();
    byAuth.mockRestore();
    byId.mockRestore();
  });

  it("a provider user with no linked users row → null (AC2)", async () => {
    signInAs(USER_IDS.ana, "employee");
    provider.currentProviderUser.mockResolvedValue("30000000-0000-4000-8000-00000000dead");
    expect(await getSession()).toBeNull();
  });

  it("a valid token for a DIFFERENT user than the provider session → null", async () => {
    signInAs(USER_IDS.ana, "employee"); // e.g. a cookie copied from someone else
    provider.currentProviderUser.mockResolvedValue(BEN_AUTH);
    expect(await getSession()).toBeNull();
  });

  it("a live provider session but no signed token → null, without asking the provider", async () => {
    provider.currentProviderUser.mockResolvedValue(ANA_AUTH);
    expect(await getSession()).toBeNull();
    expect(provider.currentProviderUser).not.toHaveBeenCalled();
  });

  it("the role check still applies on top of the link", async () => {
    signInAs(USER_IDS.ana, "hr_admin");
    provider.currentProviderUser.mockResolvedValue(ANA_AUTH);
    expect(await getSession()).toBeNull();
  });
});
