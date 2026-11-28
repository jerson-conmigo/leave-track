import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationList } from "@/components/notifications/notification-list";
import { requireSession } from "@/lib/auth/session";
import { repository } from "@/lib/data/repositories";
import { markNotificationsReadAction } from "./actions";

export const metadata: Metadata = { title: "Notifications" };

/** TASK-030 — the signed-in user's own notifications (scoped to the recipient in SQL). */
export default async function NotificationsPage() {
  const session = await requireSession();
  const notifications = await repository.listNotifications(session.userId);
  return (
    <>
      <PageHeader
        title="Notifications"
        description="New leave requests waiting for you, and decisions on your own requests."
      />
      <NotificationList notifications={notifications} onMarkRead={markNotificationsReadAction} />
    </>
  );
}
