import { NextResponse, type NextRequest } from "next/server";
import { proxyCookieIO } from "@/lib/auth/cookie-io";
import { SESSION_COOKIE } from "@/lib/auth/cookies";
import { getAuthProvider } from "@/lib/auth/provider";
import { canAccess, isPublicPath } from "@/lib/auth/roles";

/**
 * Route guard (Next.js 16 `proxy`, ADR-LeaveTrack-E001).
 *  1. Public paths pass through.
 *  2. No valid SIGNED session cookie (missing, forged, tampered or expired — TASK-023),
 *     or no live provider session (Supabase Auth, refreshed here — TASK-024)
 *     → /login?next=<path> (APIs get a 401 envelope); the session cookies are deleted.
 *  3. Role not allowed for the path → /forbidden    (APIs get a 403 envelope).
 * Server components re-check with requireRole() — this is not the only gate.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const provider = getAuthProvider();
  const cookies = proxyCookieIO(request);
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  // The role here only routes the request; pages and APIs re-read the user (getSession).
  const claims = provider.readSessionToken(token);
  const isApi = pathname.startsWith("/api/");

  // Fail closed: a refresh error or an unreachable provider counts as signed out.
  if (!claims || !(await provider.refresh(cookies.io))) {
    const response = isApi
      ? NextResponse.json(
          { success: false, error: { code: "UNAUTHENTICATED", message: "Sign in to continue." } },
          { status: 401 },
        )
      : NextResponse.redirect(loginUrl(request, pathname, search));
    if (token) response.cookies.delete(SESSION_COOKIE); // forged / tampered / expired / orphaned
    return cookies.applyTo(response); // includes the provider's cleared cookies
  }

  if (!canAccess(pathname, claims.role)) {
    if (isApi) {
      return cookies.applyTo(
        NextResponse.json(
          {
            success: false,
            error: { code: "FORBIDDEN", message: "You don't have access to this resource." },
          },
          { status: 403 },
        ),
      );
    }
    return cookies.applyTo(NextResponse.redirect(new URL("/forbidden", request.url)));
  }

  // Refreshed provider cookies reach the browser AND the page rendered for this request.
  return cookies.applyTo(NextResponse.next({ request }));
}

function loginUrl(request: NextRequest, pathname: string, search: string): URL {
  const login = new URL("/login", request.url);
  if (pathname !== "/") login.searchParams.set("next", `${pathname}${search}`);
  return login;
}

export const config = {
  // Skip Next internals and static files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
