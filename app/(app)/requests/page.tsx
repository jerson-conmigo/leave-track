import type { Metadata } from "next";
import { CalendarPlus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { RequestList } from "@/components/leave/request-list";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/session";
import { repository } from "@/lib/data/repositories";

export const metadata: Metadata = { title: "My requests" };

export default async function MyRequestsPage() {
  const session = await requireSession();
  const requests = await repository.listMyRequests(session.userId);

  return (
    <>
      <PageHeader
        title="My requests"
        description="Every leave request you've made and where it stands."
        action={
          <Button asChild className="w-full sm:w-auto">
            <Link href="/requests/new">
              <CalendarPlus aria-hidden />
              New request
            </Link>
          </Button>
        }
      />
      <RequestList requests={requests} />
    </>
  );
}
