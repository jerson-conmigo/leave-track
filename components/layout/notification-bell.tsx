import { Bell } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { bellBadge, bellLabel } from "@/lib/notifications/format";
import { cn } from "@/lib/utils";

/**
 * TASK-030 — the header bell (server-rendered). The unread count is part of the accessible name
 * ("Notifications, 3 unread") and shown as text in a badge — never colour alone. ≥ 44px target.
 */
export function NotificationBell({ unread }: { unread: number }) {
  const badge = bellBadge(unread);
  return (
    <Link
      href="/notifications"
      aria-label={bellLabel(unread)}
      // A fixed 44px touch target (not rem): at 200% text a rem-sized bell no longer fits the
      // 320px header next to the menu and account buttons (WCAG 1.4.10).
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "relative size-[44px] shrink-0 md:size-9",
      )}
    >
      <Bell aria-hidden className="size-5" />
      {badge ? (
        <span
          aria-hidden
          data-slot="notification-count"
          className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] leading-4 font-semibold text-primary-foreground"
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
