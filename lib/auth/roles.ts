import { ROLES, type Role } from "@/lib/data/types";

/**
 * Single source of truth for route → role access. Used by proxy.ts (guard),
 * requireRole() (server-component defense in depth), and the nav (visibility).
 * Routes not listed here are open to every authenticated role.
 */
export const ROUTE_ACCESS: readonly { prefix: string; roles: readonly Role[] }[] = [
  { prefix: "/approvals", roles: ["manager"] },
  { prefix: "/audit", roles: ["hr_admin"] },
  { prefix: "/policies", roles: ["hr_admin"] },
];

/**
 * Reachable without a session. `/api/test/reset` is gated by its own token and is
 * a 404 unless E2E_RESET_TOKEN is set (tests only). `/api/jobs/accrual` is called by
 * Vercel Cron (no cookie) and gated by `Authorization: Bearer $CRON_SECRET`.
 */
export const PUBLIC_PATHS: readonly string[] = [
  "/login",
  "/forbidden",
  "/api/health",
  "/api/test/reset",
  "/api/jobs/accrual",
];

export const ROLE_LABEL: Record<Role, string> = {
  employee: "Employee",
  manager: "Manager",
  hr_admin: "HR Admin",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

function matches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => matches(pathname, p));
}

export function canAccess(pathname: string, role: Role): boolean {
  const rule = ROUTE_ACCESS.find((r) => matches(pathname, r.prefix));
  return !rule || rule.roles.includes(role);
}

/** Only allow same-origin relative redirects (blocks `//evil.com`, `https://…`). */
export function safeRedirectPath(next: unknown, fallback = "/dashboard"): string {
  if (
    typeof next !== "string" ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.startsWith("/\\")
  ) {
    return fallback;
  }
  return next;
}
