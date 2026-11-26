import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { fromCookieJar } from "@/lib/auth/cookie-io";
import { SESSION_COOKIE } from "@/lib/auth/cookies";
import { getAuthProvider, NO_PROVIDER_SESSION } from "@/lib/auth/provider";
import { repository } from "@/lib/data/repositories";
import type { Role } from "@/lib/data/types";

export type Session = {
  userId: string;
  role: Role;
  name: string;
  email: string;
  managerId: string | null;
};

/**
 * Resolve the current session from the SIGNED session cookie (TASK-023). Returns null
 * when the cookie is missing, forged, tampered or expired, or when it disagrees with
 * the user directory. Authorization always comes from the database row, never from the
 * token. Memoised per request. Server components call this directly — no Context.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const jar = await cookies();
  const provider = getAuthProvider();
  const claims = provider.readSessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!claims) return null;

  // Supabase Auth (TASK-024): the provider session must ALSO be live — checked with the
  // Auth server, so a signed-out session is rejected — and linked by users.auth_user_id
  // to the same user this token names.
  const providerUser = await provider.currentProviderUser(fromCookieJar(jar));
  if (providerUser === null) return null; // signed out, revoked or unreachable: fail closed
  if (providerUser !== NO_PROVIDER_SESSION) {
    const linked = await repository.getUserByAuthUserId(providerUser);
    if (linked?.id !== claims.uid) return null; // unlinked, or another user's token
  }

  const user = await repository.getUserById(claims.uid);
  // A role changed since sign-in invalidates the session. TODO(TASK-043): also reject
  // deactivated users here.
  if (!user || user.role !== claims.role) return null;

  return {
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    managerId: user.managerId,
  };
});

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Defense in depth behind proxy.ts — call at the top of role-gated pages. */
export async function requireRole(...roles: Role[]): Promise<Session> {
  const session = await requireSession();
  if (!roles.includes(session.role)) redirect("/forbidden");
  return session;
}
