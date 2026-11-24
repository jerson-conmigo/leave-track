"use client";

import { CircleAlert, FlaskConical, Loader2 } from "lucide-react";
import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/(public)/login/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { ROLE_LABEL } from "@/lib/auth/roles";
import type { Role } from "@/lib/data/types";

export type MockUserOption = { id: string; name: string; role: Role };

type LoginFormProps = {
  mockUsers: MockUserOption[];
  /** Path to return to after sign-in (validated server-side). */
  next?: string;
};

const ROLE_ORDER: Role[] = ["employee", "manager", "hr_admin"];

export function LoginForm({ mockUsers, next }: LoginFormProps) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const defaultUser = mockUsers.find((u) => u.role === "employee")?.id;

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <Alert className="border-status-pending-foreground/30 bg-status-pending text-status-pending-foreground">
        <FlaskConical aria-hidden />
        <AlertTitle>Demo sign-in</AlertTitle>
        <AlertDescription className="text-status-pending-foreground">
          Any email and password work. Pick a person to try each role.
        </AlertDescription>
      </Alert>

      {state.error ? (
        <Alert variant="destructive" role="alert">
          <CircleAlert aria-hidden />
          <AlertDescription>{state.error}</AlertDescription>
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
          disabled={pending}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          disabled={pending}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="userId">Sign in as</Label>
        <Select name="userId" defaultValue={defaultUser} disabled={pending}>
          <SelectTrigger id="userId" className="w-full">
            <SelectValue placeholder="Choose a person" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_ORDER.map((role) => (
              <SelectGroup key={role}>
                <SelectLabel>{ROLE_LABEL[role]}</SelectLabel>
                {mockUsers
                  .filter((u) => u.role === role)
                  .map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {next ? <input type="hidden" name="next" value={next} /> : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
