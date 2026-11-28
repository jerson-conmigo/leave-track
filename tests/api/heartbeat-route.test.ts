import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorEnvelopeSchema, SessionTimingSchema, successEnvelope } from "@/lib/api/schemas";
import { SESSION_COOKIE } from "@/lib/auth/cookies";
import { getSessionSecret } from "@/lib/auth/session-secret";
import { newSessionId, signSessionToken, type SessionClaims } from "@/lib/auth/session-token";
import { USER_IDS } from "@/lib/data/mock/fixtures";
import { resetMockDb } from "@/lib/data/mock/store";

/**
 * TASK-025 — POST /api/session/heartbeat through the REAL getSession (signed cookie + users row,
 * mock provider). Response matches the documented SessionTiming; the absolute expiry it reports
 * is the token's own `exp`, never moved by activity.
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
const { POST } = await import("@/app/api/session/heartbeat/route");

const T0 = 1_900_000_000;
const signIn = (c: Partial<SessionClaims> = {}) => {
  const claims: SessionClaims = {
    uid: USER_IDS.ana,
    role: "employee",
    sid: newSessionId(),
    iat: T0,
    lat: T0,
    exp: T0 + 8 * 3600,
    ...c,
  };
  jar.set(SESSION_COOKIE, signSessionToken(claims, getSessionSecret()));
  return claims;
};
const beat = () =>
  POST(new NextRequest("http://localhost/api/session/heartbeat", { method: "POST" }), undefined);

beforeEach(() => {
  jar.clear();
  resetMockDb();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.stubEnv("SESSION_IDLE_TIMEOUT_MINUTES", "30");
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  resetMockDb();
});

describe("POST /api/session/heartbeat", () => {
  it("200 SessionTiming: idle deadline from now, absolute = the token's exp, not cached", async () => {
    const claims = signIn();
    vi.setSystemTime((T0 + 600) * 1000);
    const res = await beat();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    const body = await res.json();
    expect(successEnvelope(SessionTimingSchema).parse(body)).toEqual(body);
    expect(body.data).toEqual({
      idleExpiresAt: T0 + 600 + 1800,
      absoluteExpiresAt: claims.exp,
      idleTimeoutSeconds: 1800,
      warningSeconds: 60,
      heartbeatIntervalSeconds: 30,
    });
  });

  it("near the 8-hour limit the idle deadline is capped at the absolute expiry", async () => {
    const claims = signIn({ lat: T0 + 8 * 3600 - 300 });
    vi.setSystemTime((T0 + 8 * 3600 - 120) * 1000);
    const { data } = await (await beat()).json();
    expect(data.idleExpiresAt).toBe(claims.exp);
    expect(data.absoluteExpiresAt).toBe(claims.exp);
  });

  it.each([
    ["no session", () => undefined],
    ["an idle session", () => signIn()],
    ["an expired session", () => signIn()],
  ])("401 envelope for %s", async (label, setup) => {
    setup();
    const t =
      label === "an idle session" ? T0 + 1800 : label === "an expired session" ? T0 + 8 * 3600 : T0;
    vi.setSystemTime(t * 1000);
    const res = await beat();
    expect(res.status).toBe(401);
    expect(ErrorEnvelopeSchema.parse(await res.json()).error.code).toBe("UNAUTHENTICATED");
  });
});
