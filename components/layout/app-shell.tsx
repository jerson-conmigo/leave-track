import { Brand } from "@/components/layout/brand";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { ROLE_ACCENT } from "@/lib/auth/roles";
import type { Session } from "@/lib/auth/session";
import type { Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

type AppShellProps = {
  session: Session;
  /** TASK-030: the user's unread notifications, for the header bell. */
  unreadNotifications?: number;
  /** TASK-047: the current theme choice, for the user menu's Light / Dark / System. */
  theme?: Theme;
  children: React.ReactNode;
};

/**
 * Authenticated layout: fixed sidebar ≥ lg, sticky top bar + sheet nav below.
 * Role-aware via `session.role` only — no client-side auth state.
 */
export function AppShell({
  session,
  unreadNotifications = 0,
  theme = "system",
  children,
}: AppShellProps) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>

      <aside className="hidden border-r bg-card lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:gap-6 lg:p-4">
        <Brand className="px-2 pt-1" />
        <SidebarNav role={session.role} />
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* TASK-047: a role-accent edge (decorative; the role is also written in the user menu). */}
        <header
          data-role-accent={session.role}
          className={cn(
            "sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-l-4 bg-card/95 px-2 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-4 lg:h-16 lg:px-8",
            ROLE_ACCENT[session.role].border,
          )}
        >
          <MobileNav role={session.role} />
          {/* min-w-0 lets the brand shrink/truncate at 320px with 200% text (WCAG 1.4.10). */}
          <Brand className="min-w-0 lg:hidden" />
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <NotificationBell unread={unreadNotifications} />
            <UserMenu name={session.name} email={session.email} role={session.role} theme={theme} />
          </div>
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 focus:outline-none md:px-6 lg:px-8 lg:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
