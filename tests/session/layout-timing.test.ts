import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

/**
 * TASK-025 — the idle warning never has its own timeout: the authenticated layout passes the
 * SERVER's timing (getSessionTiming → sessionPolicy) straight through, and the client component
 * contains no timeout numbers of its own.
 */
const timing = {
  idleExpiresAt: 2_000_000_600,
  absoluteExpiresAt: 2_000_028_800,
  idleTimeoutSeconds: 600, // deliberately not the 30-minute default
  warningSeconds: 45,
  heartbeatIntervalSeconds: 20,
};
vi.mock("@/lib/auth/session", () => ({
  requireSession: async () => ({ userId: "u", role: "employee", name: "Ana", email: "a@b.c" }),
  getSessionTiming: async () => timing,
}));
vi.mock("@/components/layout/app-shell", () => ({ AppShell: () => null }));
// TASK-047: the layout also reads the theme cookie.
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("@/components/session/idle-session-guard", () => ({ IdleSessionGuard: () => null }));

const { default: AuthenticatedLayout } = await import("@/app/(app)/layout");
const { IdleSessionGuard } = await import("@/components/session/idle-session-guard");

type El = { type: unknown; props: { children?: unknown } & Record<string, unknown> };
const find = (node: unknown, type: unknown): El | undefined => {
  if (!node || typeof node !== "object") return undefined;
  const el = node as El;
  if (el.type === type) return el;
  const kids = el.props?.children;
  for (const k of Array.isArray(kids) ? kids : [kids]) {
    const hit = find(k, type);
    if (hit) return hit;
  }
  return undefined;
};

describe("idle warning timing comes from the server", () => {
  it("the layout passes getSessionTiming's values to the guard, unchanged", async () => {
    const tree = await AuthenticatedLayout({ children: null });
    const guard = find(tree, IdleSessionGuard);
    expect(guard?.props).toEqual({
      idleTimeoutSeconds: 600,
      warningSeconds: 45,
      heartbeatIntervalSeconds: 20,
      absoluteExpiresAt: 2_000_028_800,
    });
  });

  it("the client guard has no timeout constants of its own", () => {
    const src = readFileSync(
      path.resolve(import.meta.dirname, "../../components/session/idle-session-guard.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/\b(1800|30 \* 60|60 \* 30|28800|8 \* 60 \* 60)\b/);
    expect(src).not.toMatch(/SESSION_IDLE_TIMEOUT_MINUTES|session-policy/);
    expect(src).toMatch(/timeout: idleTimeoutSeconds \* 1000/);
    expect(src).toMatch(/promptBeforeIdle: warningSeconds \* 1000/);
  });
});
