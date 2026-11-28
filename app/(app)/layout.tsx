import { AppShell } from "@/components/layout/app-shell";
import { IdleSessionGuard } from "@/components/session/idle-session-guard";
import { getSessionTiming, requireSession } from "@/lib/auth/session";
import { repository } from "@/lib/data/repositories";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  // TASK-025: the idle warning gets its timing from the server (never a client constant).
  const timing = await getSessionTiming();
  // TASK-030: the header bell's unread count (one indexed query, scoped to this user in SQL).
  const unread = await repository.countUnreadNotifications(session.userId);

  return (
    <AppShell session={session} unreadNotifications={unread}>
      {children}
      {timing ? (
        <IdleSessionGuard
          idleTimeoutSeconds={timing.idleTimeoutSeconds}
          warningSeconds={timing.warningSeconds}
          heartbeatIntervalSeconds={timing.heartbeatIntervalSeconds}
          absoluteExpiresAt={timing.absoluteExpiresAt}
        />
      ) : null}
    </AppShell>
  );
}
