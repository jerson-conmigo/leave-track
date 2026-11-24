import {
  CalendarPlus,
  ClipboardCheck,
  LayoutDashboard,
  ListChecks,
  type LucideIcon,
  ScrollText,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import { canAccess } from "@/lib/auth/roles";
import type { Role } from "@/lib/data/types";

export type NavItem = { href: string; label: string; icon: LucideIcon; group: "me" | "manage" };

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "me" },
  { href: "/requests/new", label: "New request", icon: CalendarPlus, group: "me" },
  { href: "/requests", label: "My requests", icon: ListChecks, group: "me" },
  { href: "/balance", label: "Balance", icon: Wallet, group: "me" },
  { href: "/approvals", label: "Approvals", icon: ClipboardCheck, group: "manage" },
  { href: "/audit", label: "Audit report", icon: ScrollText, group: "manage" },
  { href: "/policies", label: "Leave policies", icon: SlidersHorizontal, group: "manage" },
];

/** Nav visibility derives from the same ROUTE_ACCESS matrix the proxy enforces. */
export function navItemsFor(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => canAccess(item.href, role));
}

/** Most specific match wins, so /requests/new doesn't also light up /requests. */
export function activeHref(pathname: string, items: readonly NavItem[]): string | undefined {
  return items
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}
