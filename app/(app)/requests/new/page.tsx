import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { RequestForm } from "@/components/leave/request-form";
import { Card, CardContent } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { repository } from "@/lib/data/repositories";
import { submitLeaveRequestAction } from "./actions";

export const metadata: Metadata = { title: "New request" };

export default async function NewRequestPage() {
  const session = await requireSession();
  const [leaveTypes, balances] = await Promise.all([
    repository.listLeaveTypes(),
    repository.getBalances(session.userId),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Request leave"
        description="Your manager is notified as soon as you submit."
      />
      <Card className="py-6">
        <CardContent className="px-4 sm:px-6">
          <RequestForm
            leaveTypes={leaveTypes}
            balances={balances}
            onSubmit={submitLeaveRequestAction}
          />
        </CardContent>
      </Card>
    </div>
  );
}
