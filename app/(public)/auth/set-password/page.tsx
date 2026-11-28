import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { SetPasswordForm } from "@/components/auth/set-password-form";
import { Brand } from "@/components/layout/brand";
import { fromCookieJar } from "@/lib/auth/cookie-io";
import { getAuthProvider } from "@/lib/auth/provider";

export const metadata: Metadata = { title: "Set your password" };
// The provider is runtime configuration: never prerender a mock-mode 404 into the build.
export const dynamic = "force-dynamic";

/**
 * Reached from /auth/confirm after an invite or reset link (TASK-024). Needs the
 * provider session that link created; without one, back to sign-in.
 */
export default async function SetPasswordPage() {
  const provider = getAuthProvider();
  if (provider.name !== "supabase") notFound();
  if ((await provider.currentProviderUser(fromCookieJar(await cookies()))) === null) {
    redirect("/login?error=link");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10 sm:px-8">
      <div className="w-full max-w-sm">
        <Brand className="mb-8" />
        <h1 className="text-2xl font-semibold tracking-tight">Set your password</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Choose a password you don&apos;t use anywhere else.
        </p>
        <SetPasswordForm />
      </div>
    </main>
  );
}
