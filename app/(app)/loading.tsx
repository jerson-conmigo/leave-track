import { BalanceCardSkeleton } from "@/components/leave/balance-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="mb-6 h-4 w-72 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <BalanceCardSkeleton />
        <BalanceCardSkeleton />
        <BalanceCardSkeleton />
      </div>
      <Skeleton className="mt-8 h-48 w-full rounded-lg" />
    </div>
  );
}
