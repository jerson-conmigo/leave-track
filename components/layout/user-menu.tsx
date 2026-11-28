"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { logoutAction } from "@/app/(public)/login/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setThemeAction } from "@/app/theme/actions";
import { ROLE_ACCENT, ROLE_LABEL } from "@/lib/auth/roles";
import { type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/data/types";
import { initials } from "@/lib/format";

type UserMenuProps = { name: string; email: string; role: Role; theme?: Theme };

const THEME_LABEL: Record<Theme, string> = { light: "Light", dark: "Dark", system: "System" };

export function UserMenu({ name, email, role, theme = "system" }: UserMenuProps) {
  const [, startTransition] = useTransition();
  const chooseTheme = (value: string) =>
    startTransition(async () => {
      const result = await setThemeAction(value);
      if (!result.success) toast.error(result.error.message);
    });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Name from content (WCAG 2.5.3 Label in Name): the visible name/role is part of
            the accessible name; the avatar initials are decorative. */}
        <Button variant="ghost" className="gap-2 px-2">
          <Avatar
            className={cn("size-8 ring-2 ring-offset-2 ring-offset-card", ROLE_ACCENT[role].ring)}
            aria-hidden
          >
            <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <span className="sr-only text-left sm:not-sr-only sm:block">
            <span className="block text-sm leading-tight font-medium">{name}</span>
            <span className="block text-xs leading-tight text-muted-foreground">
              {ROLE_LABEL[role]}
            </span>
          </span>
          <span className="sr-only">, account menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* TASK-047: Light / Dark / System — the checked item is announced as checked. */}
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Theme
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={chooseTheme}>
          {(Object.keys(THEME_LABEL) as Theme[]).map((t) => (
            <DropdownMenuRadioItem key={t} value={t}>
              {THEME_LABEL[t]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut aria-hidden />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
