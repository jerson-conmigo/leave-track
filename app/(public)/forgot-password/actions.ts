"use server";

import { getAuthProvider } from "@/lib/auth/provider";
import { env } from "@/lib/env";
import { ForgotPasswordSchema } from "@/lib/validation/auth";

export type ForgotPasswordState = { error?: string; sent?: boolean };

/**
 * Request a password-reset email (TASK-024). The answer is the same whether or not the
 * address belongs to anyone (no account enumeration). The emailed link goes to
 * /auth/confirm (supabase/templates/recovery.html). Rate limiting: TASK-025.
 */
export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const provider = getAuthProvider();
  if (provider.name !== "supabase") return { error: "Password sign-in isn't enabled." };

  const parsed = ForgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter your email." };

  // The URL comes from validated configuration, never from request headers.
  await provider.requestPasswordReset(
    parsed.data.email,
    new URL("/auth/set-password", env.NEXT_PUBLIC_APP_URL).toString(),
  );
  return { sent: true };
}
