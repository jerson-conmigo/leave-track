"use client";

import { Bell, Check } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/data/types";
import { formatDate } from "@/lib/format";
import { notificationHref, notificationText } from "@/lib/notifications/format";
import type { Notification } from "@/lib/notifications/types";
import { cn } from "@/lib/utils";

/** Buttons wrap their label at 200% text on a 320px screen instead of widening the page. */
const WRAP = "h-auto min-h-11 max-w-full whitespace-normal md:min-h-9";

type Props = {
  notifications: Notification[];
  /** Server action: mark these (or, with no ids, all) of the user's notifications read. */
  onMarkRead: (ids?: string[]) => Promise<ActionResult>;
};

/**
 * TASK-030 — the inbox. Unread items carry a visible "New" label (text, not only colour or weight);
 * each links to where it's acted on. Mutations are props (server actions), per the frontend rules.
 */
export function NotificationList({ notifications, onMarkRead }: Props) {
  const [pending, startTransition] = useTransition();
  const unread = notifications.filter((n) => n.readAt === null).length;

  const mark = (ids?: string[]) =>
    startTransition(async () => {
      const result = await onMarkRead(ids);
      if (!result.success) toast.error(result.error.message);
    });

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border bg-card px-4 py-12 text-center">
        <Bell aria-hidden className="mx-auto size-8 text-muted-foreground" />
        <p className="font-medium">No notifications yet</p>
        <p className="text-sm text-muted-foreground">
          {"You'll see new requests and decisions here."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {unread === 0 ? "All caught up." : `${unread} unread`}
        </p>
        <Button
          variant="outline"
          className={WRAP}
          disabled={unread === 0 || pending}
          onClick={() => mark()}
        >
          <Check aria-hidden />
          Mark all as read
        </Button>
      </div>
      <ul aria-label="Notifications" className="flex flex-col gap-3">
        {notifications.map((n) => {
          const isUnread = n.readAt === null;
          return (
            <li
              key={n.id}
              className={cn(
                "flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-xs sm:flex-row sm:items-start sm:justify-between",
                isUnread && "border-primary/40",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className={cn("break-words", isUnread && "font-semibold")}>
                  {isUnread ? (
                    <span className="mr-2 inline-flex rounded-full bg-primary px-2 py-0.5 align-middle text-xs font-medium text-primary-foreground">
                      New
                    </span>
                  ) : null}
                  {notificationText(n)}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  <span>{formatDate(n.createdAt)}</span>
                  <span aria-hidden>·</span>
                  {/* ≥ 44px tall on touch screens (US-06), compact from md up. */}
                  <Link
                    className="inline-flex min-h-11 items-center rounded-sm underline underline-offset-4 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none md:min-h-0"
                    href={notificationHref(n)}
                  >
                    {n.type === "resolution.proposed"
                      ? "Open my balance"
                      : n.type === "request.decided"
                        ? "Open my requests"
                        : "Open approvals"}
                  </Link>
                </div>
              </div>
              {isUnread ? (
                <Button
                  variant="ghost"
                  className={cn("self-start", WRAP)}
                  disabled={pending}
                  onClick={() => mark([n.id])}
                >
                  Mark as read
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
