"use client";

import { CircleAlert, Loader2 } from "lucide-react";
import { useActionState } from "react";
import { setPasswordAction, type SetPasswordState } from "@/app/(public)/auth/set-password/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/validation/auth";

/** New password + confirmation (TASK-024). The server action re-validates. */
export function SetPasswordForm() {
  const [state, formAction, pending] = useActionState<SetPasswordState, FormData>(
    setPasswordAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error ? (
        <Alert variant="destructive" role="alert">
          <CircleAlert aria-hidden />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN}
          maxLength={PASSWORD_MAX}
          aria-describedby="password-hint"
          disabled={pending}
        />
        <p id="password-hint" className="text-sm text-muted-foreground">
          At least {PASSWORD_MIN} characters.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirm">Repeat new password</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          maxLength={PASSWORD_MAX}
          disabled={pending}
        />
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {pending ? "Saving…" : "Set password and sign in"}
      </Button>
    </form>
  );
}
