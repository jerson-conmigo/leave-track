import { AppShell } from "@/components/layout/app-shell";
import { IdleSessionGuard } from "@/components/session/idle-session-guard";
import { getSessionTiming, requireSession } from "@/lib/auth/session";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  // TASK-025: the idle warning gets its timing from the server (never a client constant).
  const timing = await getSessionTiming();

  return (
    <AppShell session={session}>
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
