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

export const MAX_REDIRECT_LENGTH = 2048;
const REDIRECT_BASE = "http://leavetrack.invalid";
// A same-scheme input like "http:evil.com" resolves as a RELATIVE path against an
// http base, so the origin check runs against both schemes.
const REDIRECT_BASES = [REDIRECT_BASE, "https://leavetrack.invalid"];
// ASCII control characters (browsers silently strip tab/CR/LF) and backslashes
// (browsers treat "\" as "/"): either can turn a "relative" path into another origin.
const UNSAFE_REDIRECT_CHARS = /[\u0000-\u001f\u007f\\]/;
const NEVER_REDIRECT_TO = ["/login", "/api"];

function resolveRedirect(next: string): URL | null {
  try {
    return new URL(next, REDIRECT_BASE);
  } catch {
    return null;
  }
}

/**
 * The redirect guards, in order (TASK-020). Several overlap on purpose (defence in
 * depth), so each is exported and unit-tested on its own — a guard that the others
 * happen to cover would otherwise be untested code.
 */
export const REDIRECT_GUARDS: readonly { name: string; rejects: (next: string) => boolean }[] = [
  { name: "length", rejects: (n) => n.length === 0 || n.length > MAX_REDIRECT_LENGTH },
  { name: "unsafe-characters", rejects: (n) => UNSAFE_REDIRECT_CHARS.test(n) },
  { name: "not-root-relative", rejects: (n) => !n.startsWith("/") || n.startsWith("//") },
  {
    name: "cross-origin",
    rejects: (n) =>
      REDIRECT_BASES.some((base) => {
        try {
          return new URL(n, base).origin !== base;
        } catch {
          return true;
        }
      }),
  },
  {
    name: "reserved-path",
    rejects: (n) => {
      const url = resolveRedirect(n);
      return !url || NEVER_REDIRECT_TO.some((prefix) => matches(url.pathname, prefix));
    },
  },
];

/** Name of the first guard that rejects `next`, or null when it is a safe redirect. */
export function redirectRejection(next: unknown): string | null {
  if (typeof next !== "string") return "not-a-string";
  return REDIRECT_GUARDS.find((guard) => guard.rejects(next))?.name ?? null;
}

/**
 * Only allow same-origin relative redirects (TASK-020). Anything else returns
 * `fallback`. Checks, in order: a string of 1–2,048 characters; no control
 * characters or backslashes; exactly one leading "/"; resolves (WHATWG URL — what
 * browsers use) to the app's own origin; not /login (loop) or /api/*. Returns the
 * normalised path + query + hash.
 */
export function safeRedirectPath(next: unknown, fallback = "/dashboard"): string {
  if (redirectRejection(next) !== null) return fallback;
  const url = resolveRedirect(next as string)!;
  return `${url.pathname}${url.search}${url.hash}`;
}
