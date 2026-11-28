"use client";

import { CircleAlert, FlaskConical, Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useRef } from "react";
import { passwordLoginAction, type LoginState } from "@/app/(public)/login/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DevAccount } from "@/lib/auth/dev-accounts";
import { ROLE_LABEL } from "@/lib/auth/roles";
import type { Role } from "@/lib/data/types";

type PasswordLoginFormProps = {
  /** Path to return to after sign-in (validated server-side). */
  next?: string;
  /** A message to show before any attempt (e.g. an expired invite link). */
  notice?: string;
  /**
   * TASK-056 — LOCAL DEVELOPMENT ONLY. Passed by the login page only when
   * devLoginAccountsEnabled() holds for this request; otherwise both are undefined and the
   * dropdown does not exist. Choosing an account only fills the fields below.
   */
  devAccounts?: DevAccount[];
  devPassword?: string;
};

const ROLE_ORDER: Role[] = ["employee", "manager", "hr_admin"];

/**
 * Supabase Auth sign-in (TASK-024): email + password, checked by the provider; the
 * server action re-validates everything and finds the user by their invite link.
 */
export function PasswordLoginForm({
  next,
  notice,
  devAccounts,
  devPassword,
}: PasswordLoginFormProps) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    passwordLoginAction,
    {},
  );
  const error = state.error ?? notice;
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const showDevAccounts = Boolean(devAccounts?.length && devPassword);

  // Fill only — never submit, and never move focus to Sign in: the Enter that picked the account
  // would otherwise activate the button (TASK-056 VALIDATE). Focus stays on the menu; the user
  // tabs to Sign in.
  function fillDevAccount(email: string) {
    if (!emailRef.current || !passwordRef.current || !devPassword) return;
    emailRef.current.value = email;
    passwordRef.current.value = devPassword;
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {showDevAccounts ? (
        <div className="flex flex-col gap-3">
          <Alert className="border-status-pending-foreground/30 bg-status-pending text-status-pending-foreground">
            <FlaskConical aria-hidden />
            {/* hyphens-auto + wrap-anywhere: long words ("development") can break, so the notice
                fits at 320px with 200% text (WCAG 1.4.10). */}
            <AlertDescription className="wrap-anywhere hyphens-auto text-status-pending-foreground">
              Local development only. Choosing an account fills in its email and the local
              development password — you still sign in with Supabase.
            </AlertDescription>
          </Alert>
          <div className="grid gap-2">
            <Label htmlFor="dev-account">Fill in a local account</Label>
            {/* No name: this control is never submitted — it only fills the fields below. */}
            <Select onValueChange={fillDevAccount} disabled={pending}>
              <SelectTrigger id="dev-account" className="w-full">
                <SelectValue placeholder="Choose an account" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_ORDER.map((role) => {
                  const accounts = devAccounts!.filter((a) => a.role === role);
                  return accounts.length > 0 ? (
                    <SelectGroup key={role}>
                      <SelectLabel>{ROLE_LABEL[role]}</SelectLabel>
                      {accounts.map((a) => (
                        <SelectItem key={a.email} value={a.email}>
                          {/* wrap-anywhere: a long email can break, so the chosen value wraps at
                              200% text instead of widening the page (WCAG 1.4.10). */}
                          <span className="wrap-anywhere">
                            {a.name} — {a.email}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ) : null;
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}

      {error ? (
        <Alert variant="destructive" role="alert">
          <CircleAlert aria-hidden />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          ref={emailRef}
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
        {/* flex-wrap: at large text "Forgot password?" moves under the label instead of widening
            the page (WCAG 1.4.10). */}
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="inline-flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline focus-visible:underline md:min-h-0"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          ref={passwordRef}
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
