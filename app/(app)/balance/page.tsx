import type { Metadata } from "next";
import { Info } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { BalanceCard } from "@/components/leave/balance-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireSession } from "@/lib/auth/session";
import { repository } from "@/lib/data/repositories";

export const metadata: Metadata = { title: "Balance" };

export default async function BalancePage() {
  const session = await requireSession();
  const balances = await repository.getBalances(session.userId);

  return (
    <>
      <PageHeader title="Your leave balance" description="Each leave type is tracked separately." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {balances.map((b) => (
          <BalanceCard key={b.leaveType.id} balance={b} />
        ))}
      </div>
      <Alert className="mt-6">
        <Info aria-hidden />
        <AlertDescription>
          Balances update on the 1st of each month. Pending requests are shown separately and are
          only deducted once your manager approves them.
        </AlertDescription>
      </Alert>
    </>
  );
}
