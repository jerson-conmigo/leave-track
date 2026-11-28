import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Brand } from "@/components/layout/brand";
import { getAuthProvider } from "@/lib/auth/provider";

export const metadata: Metadata = { title: "Reset your password" };
// The provider is runtime configuration: never prerender a mock-mode 404 into the build.
export const dynamic = "force-dynamic";

/** Password reset request (TASK-024). Only with a real provider. */
export default function ForgotPasswordPage() {
  if (getAuthProvider().name !== "supabase") notFound();

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10 sm:px-8">
      <div className="w-full max-w-sm">
        <Brand className="mb-8" />
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          We&apos;ll email you a link to choose a new one.
        </p>
        <ForgotPasswordForm />
        <p className="mt-6 text-sm">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline focus-visible:underline md:min-h-0"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
