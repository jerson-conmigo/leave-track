"use client";

import { CircleAlert, Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { passwordLoginAction, type LoginState } from "@/app/(public)/login/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PasswordLoginFormProps = {
  /** Path to return to after sign-in (validated server-side). */
  next?: string;
  /** A message to show before any attempt (e.g. an expired invite link). */
  notice?: string;
};

/**
 * Supabase Auth sign-in (TASK-024): email + password, checked by the provider; the
 * server action re-validates everything and finds the user by their invite link.
 */
export function PasswordLoginForm({ next, notice }: PasswordLoginFormProps) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    passwordLoginAction,
    {},
  );
  const error = state.error ?? notice;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {error ? (
        <Alert variant="destructive" role="alert">
          <CircleAlert aria-hidden />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="you@company.com"
          required
          maxLength={320}
          disabled={pending}
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="inline-flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline focus-visible:underline md:min-h-0"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={1024}
          disabled={pending}
        />
      </div>

      {next ? <input type="hidden" name="next" value={next} /> : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
