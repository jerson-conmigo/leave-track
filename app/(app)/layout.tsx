import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth/session";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return <AppShell session={session}>{children}</AppShell>;
}
