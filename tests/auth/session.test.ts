import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE } from "@/lib/auth/cookies";
import { getSessionSecret } from "@/lib/auth/session-secret";
import { newSessionId, signSessionToken } from "@/lib/auth/session-token";
import { USER_IDS } from "@/lib/data/mock/fixtures";
import { mockDb, resetMockDb } from "@/lib/data/mock/store";
import type { Role } from "@/lib/data/types";

/**
 * TASK-023 — getSession trusts only a valid signed cookie AND the database: the role,
 * name and manager come from the users row, and a role changed since sign-in (or a
 * deleted user) invalidates the session.
 */
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { value: jar.get(name) } : undefined),
  }),
}));
vi.mock("react", async (orig) => ({
  ...(await orig<typeof import("react")>()),
  cache: (fn: unknown) => fn,
}));
const { getSession } = await import("@/lib/auth/session");

const now = () => Math.floor(Date.now() / 1000);
const signIn = (uid: string, role: Role) =>
  jar.set(
    SESSION_COOKIE,
    signSessionToken(
      { uid, role, sid: newSessionId(), iat: now(), lat: now(), exp: now() + 3600 },
      getSessionSecret(),
    ),
  );

beforeEach(() => {
  jar.clear();
  resetMockDb();
});
afterEach(() => resetMockDb());

describe("getSession", () => {
  it("returns the session built from the DATABASE row", async () => {
    signIn(USER_IDS.ben, "manager");
    expect(await getSession()).toMatchObject({
      userId: USER_IDS.ben,
      role: "manager",
      name: "Ben Ortiz",
    });
  });

  it("no cookie → null", async () => {
    expect(await getSession()).toBeNull();
  });

  it("the Day 0 unsigned cookies alone → null", async () => {
    jar.set("mock-role", "hr_admin");
    jar.set("mock-user-id", USER_IDS.carla);
    expect(await getSession()).toBeNull();
  });

  it("a validly signed claim of a role the user does not have → null", async () => {
    signIn(USER_IDS.ana, "hr_admin");
    expect(await getSession()).toBeNull();
  });

  it("role changed in the database since sign-in → null", async () => {
    signIn(USER_IDS.ana, "employee");
    expect(await getSession()).not.toBeNull();
    mockDb.users.find((u) => u.id === USER_IDS.ana)!.role = "manager";
    expect(await getSession()).toBeNull();
  });

  it("user no longer exists → null", async () => {
    signIn("00000000-0000-4000-8000-000000000999", "employee");
    expect(await getSession()).toBeNull();
  });

  it("forged cookie → null", async () => {
    jar.set(
      SESSION_COOKIE,
      signSessionToken(
        {
          uid: USER_IDS.carla,
          role: "hr_admin",
          sid: newSessionId(),
          iat: now(),
          lat: now(),
          exp: now() + 3600,
        },
        "z".repeat(64),
      ),
    );
    expect(await getSession()).toBeNull();
  });
});
