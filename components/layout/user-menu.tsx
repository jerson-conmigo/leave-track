"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/(public)/login/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABEL } from "@/lib/auth/roles";
import type { Role } from "@/lib/data/types";
import { initials } from "@/lib/format";

type UserMenuProps = { name: string; email: string; role: Role };

export function UserMenu({ name, email, role }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Name from content (WCAG 2.5.3 Label in Name): the visible name/role is part of
            the accessible name; the avatar initials are decorative. */}
        <Button variant="ghost" className="gap-2 px-2">
          <Avatar className="size-8" aria-hidden>
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
