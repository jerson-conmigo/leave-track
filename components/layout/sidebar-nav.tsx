"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeHref, navItemsFor, type NavItem } from "@/components/layout/nav-items";
import type { Role } from "@/lib/data/types";
import { cn } from "@/lib/utils";

type SidebarNavProps = {
  role: Role;
  /** Called after a link is chosen — lets the mobile sheet close itself. */
  onNavigate?: () => void;
  className?: string;
};

const GROUP_LABEL: Record<NavItem["group"], string> = { me: "My leave", manage: "Manage" };

export function SidebarNav({ role, onNavigate, className }: SidebarNavProps) {
  const pathname = usePathname();
  const items = navItemsFor(role);
  const current = activeHref(pathname, items);
  const groups = (["me", "manage"] as const)
    .map((g) => ({ group: g, items: items.filter((i) => i.group === g) }))
    .filter((g) => g.items.length > 0);

  return (
    <nav aria-label="Main" className={cn("flex flex-col gap-6", className)}>
      {groups.map(({ group, items: groupItems }) => (
        <div key={group} className="flex flex-col gap-1">
          <p className="px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {GROUP_LABEL[group]}
          </p>
          <ul className="flex flex-col gap-0.5">
            {groupItems.map(({ href, label, icon: Icon }) => {
              const isActive = href === current;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:h-9",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/80 hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
