import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_COOKIE } from "@/lib/auth/cookies";
import { isRole } from "@/lib/auth/roles";
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
 * Resolve the current session from the mock cookies. Returns null when the
 * cookies are missing, malformed, or disagree with the user directory.
 * Memoised per request. Server components call this directly — no Context.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const jar = await cookies();
  const role = jar.get(SESSION_COOKIE.role)?.value;
  const userId = jar.get(SESSION_COOKIE.userId)?.value;
  if (!isRole(role) || !userId) return null;

  const user = await repository.getUserById(userId);
  if (!user || user.role !== role) return null;

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
