import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/cookies";
import { canAccess, isPublicPath, isRole } from "@/lib/auth/roles";

/**
 * Route guard (Next.js 16 `proxy`, ADR-LeaveTrack-E001).
 *  1. Public paths pass through.
 *  2. No valid session cookie → /login?next=<path>  (APIs get a 401 envelope).
 *  3. Role not allowed for the path → /forbidden    (APIs get a 403 envelope).
 * Server components re-check with requireRole() — this is not the only gate.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const role = request.cookies.get(SESSION_COOKIE.role)?.value;
  const userId = request.cookies.get(SESSION_COOKIE.userId)?.value;
  const isApi = pathname.startsWith("/api/");

  if (!isRole(role) || !userId) {
    if (isApi) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHENTICATED", message: "Sign in to continue." } },
        { status: 401 },
      );
    }
    const login = new URL("/login", request.url);
    if (pathname !== "/") login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  if (!canAccess(pathname, role)) {
    if (isApi) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "You don't have access to this resource." },
        },
        { status: 403 },
      );
    }
    return NextResponse.redirect(new URL("/forbidden", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals and static files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
