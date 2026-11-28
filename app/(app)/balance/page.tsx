import type { Metadata } from "next";
import { Info } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { BalanceCard } from "@/components/leave/balance-card";
import { ResolutionCard } from "@/components/resolutions/resolution-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireSession } from "@/lib/auth/session";
import { repository } from "@/lib/data/repositories";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Balance" };

export default async function BalancePage() {
  const session = await requireSession();
  const [balances, resolution] = await Promise.all([
    repository.getBalances(session.userId),
    repository.getMyResolution(session.userId), // TASK-033: own rows only, scoped in SQL
  ]);
  // One accrual run covers every tracked type (US-02 AC1).
  const asOf = balances.find((b) => b.asOf)?.asOf ?? null;

  return (
    <>
      <PageHeader
        title="Your leave balance"
        description={
          asOf
            ? `As of the last monthly accrual on ${formatDate(asOf)}. Each leave type is tracked separately.`
            : "No monthly accrual has run yet. Each leave type is tracked separately."
        }
      />
      {resolution ? <ResolutionCard resolution={resolution} /> : null}
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
