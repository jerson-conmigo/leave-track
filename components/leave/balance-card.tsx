import { LEAVE_TYPE_META } from "@/components/leave/leave-type-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { BalanceSummary } from "@/lib/data/types";
import { formatDate, formatDayNumber, formatDays } from "@/lib/format";
import { cn } from "@/lib/utils";

type BalanceCardProps = {
  balance: BalanceSummary;
  /** "compact" for dashboard tiles; "full" adds the confirmed/pending breakdown. */
  variant?: "compact" | "full";
};

/**
 * One leave type's balance. Pending days are shown SEPARATELY and are not
 * deducted from the confirmed figure (US-02 AC2). Untracked types (Unpaid)
 * show "Not tracked" instead of a number (US-08 AC2).
 */
export function BalanceCard({ balance, variant = "full" }: BalanceCardProps) {
  const { leaveType, confirmed, pending, available, accrualPerMonth, asOf } = balance;
  const meta = LEAVE_TYPE_META[leaveType.name];
  const Icon = meta.icon;
  const titleId = `balance-${leaveType.id}`;

  return (
    <Card aria-labelledby={titleId} className="gap-4 py-5">
      <CardHeader className="px-5">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-lg",
              meta.subtle,
              meta.text,
            )}
          >
            <Icon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <CardTitle id={titleId} className="text-sm font-medium">
              {leaveType.name}
            </CardTitle>
            {accrualPerMonth !== null ? (
              <CardDescription className="text-xs">
                +{formatDays(accrualPerMonth)} / month
              </CardDescription>
            ) : (
              <CardDescription className="text-xs">No accrual policy</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5">
        {available === null ? (
          <>
            <p className="text-2xl font-semibold tracking-tight">Not tracked</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Unpaid leave has no balance and is never blocked by one.
            </p>
            {pending > 0 ? (
              <p className="mt-3 text-sm text-status-pending-foreground">
                {formatDays(pending)} pending
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {formatDayNumber(available)}
              <span className="ml-1 text-base font-normal text-muted-foreground">
                days available
              </span>
            </p>
            {variant === "full" ? (
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Confirmed</dt>
                  <dd className="font-medium tabular-nums">{formatDays(confirmed ?? 0)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Pending</dt>
                  <dd
                    className={cn(
                      "font-medium tabular-nums",
                      pending > 0 && "text-status-pending-foreground",
                    )}
                  >
                    {formatDays(pending)}
                  </dd>
                </div>
              </dl>
            ) : pending > 0 ? (
              <p className="mt-1 text-xs text-status-pending-foreground">
                {formatDays(pending)} pending approval
              </p>
            ) : null}
            {variant === "full" ? (
              <p className="mt-3 text-xs text-muted-foreground">
                {asOf ? `As of last accrual on ${formatDate(asOf)}` : "No accrual has run yet"}
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function BalanceCardSkeleton() {
  return (
    <Card className="gap-4 py-5" aria-hidden>
      <CardHeader className="px-5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5">
        <Skeleton className="h-8 w-36" />
      </CardContent>
    </Card>
  );
}
