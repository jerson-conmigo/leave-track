"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fromCookieJar } from "@/lib/auth/cookie-io";
import { getAuthProvider } from "@/lib/auth/provider";
import { clearSessionCookies, completeSignIn } from "@/lib/auth/sign-in";
import { repository } from "@/lib/data/repositories";
import { logger } from "@/lib/logger";
import { SetPasswordSchema } from "@/lib/validation/auth";

export type SetPasswordState = { error?: string };

/**
 * Step two of an invite or a password reset (TASK-024): the emailed link already gave
 * the browser a provider session (/auth/confirm). Set the password, then sign in as the
 * user linked to that identity by users.auth_user_id — or refuse if none is linked.
 */
export async function setPasswordAction(
  _prev: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const provider = getAuthProvider();
  if (provider.name !== "supabase") return { error: "Password sign-in isn't enabled." };

  const parsed = SetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid password." };

  const jar = await cookies();
  const io = fromCookieJar(jar);
  const result = await provider.setPassword(io, parsed.data.password);
  if (!result.ok) {
    return { error: "Your link has expired or the password was refused. Request a new link." };
  }

  const user = await repository.getUserByAuthUserId(result.authUserId);
  if (!user) {
    await provider.signOut(io);
    clearSessionCookies(jar);
    logger.warn({ authUserId: result.authUserId }, "password set, but provider user not linked");
    redirect("/login?error=not-linked");
  }

  completeSignIn(jar, user);
  logger.info({ userId: user.id, role: user.role }, "password set; signed in");
  redirect("/dashboard");
}
