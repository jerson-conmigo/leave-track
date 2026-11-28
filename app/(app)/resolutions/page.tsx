import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { type DeclinedItem, DeclinedReview } from "@/components/resolutions/declined-review";
import { ResolutionQueue } from "@/components/resolutions/resolution-queue";
import { ResolutionTable } from "@/components/resolutions/resolution-table";
import {
  parseResolutionTab,
  RESOLUTION_TABS,
  ResolutionTabs,
} from "@/components/resolutions/resolution-tabs";
import { requireRole } from "@/lib/auth/session";
import { repository } from "@/lib/data/repositories";
import type { ResolutionView } from "@/lib/resolutions/types";

/**
 * TASK-033 — what the HR dialog needs for a declined resolution: the leave type id, the current
 * balance and accrual. Re-proposing splits the CURRENT deficit; a final decision splits the
 * deficit the proposal was about (the server clamps it to the current one).
 */
async function declinedItems(rows: ResolutionView[]): Promise<DeclinedItem[]> {
  return Promise.all(
    rows.map(async (r) => {
      const b = (await repository.getBalances(r.userId)).find(
        (x) => x.leaveType.name === r.leaveType,
      );
      const balance = b?.confirmed ?? 0;
      return {
        resolution: r,
        row: {
          userId: r.userId,
          userName: r.userName,
          leaveTypeId: b?.leaveType.id ?? "",
          leaveType: r.leaveType,
          balance,
          deficit: r.proposalNumber >= 2 ? r.deficit : Math.max(0, -balance),
          accrualPerMonth: b?.accrualPerMonth ?? 0,
        },
      };
    }),
  );
}

export const metadata: Metadata = { title: "Resolutions" };

/** TASK-032 (US-09) — HR's negative-balance resolution queues. HR Admins only. */
export default async function ResolutionsPage({ searchParams }: PageProps<"/resolutions">) {
  const session = await requireRole("hr_admin");
  const tab = parseResolutionTab((await searchParams).tab);
  const [queue, awaiting, declined] = await Promise.all([
    repository.listResolutionQueue(),
    repository.listResolutions("awaiting"),
    repository.listResolutions("declined"),
  ]);
  const label = RESOLUTION_TABS.find((t) => t.id === tab)!.label;

  return (
    <>
      <PageHeader
        title="Resolutions"
        description="Propose how negative balances are resolved: converted to Unpaid, recovered from future accruals, or both."
      />
      <ResolutionTabs
        current={tab}
        counts={{ needs: queue.length, awaiting: awaiting.length, declined: declined.length }}
      />
      <section aria-label={label}>
        {tab === "needs" ? (
          <ResolutionQueue rows={queue} currentUserId={session.userId} />
        ) : tab === "awaiting" ? (
          <ResolutionTable
            resolutions={awaiting}
            label={label}
            empty="No proposals awaiting a response"
          />
        ) : tab === "declined" ? (
          <DeclinedReview items={await declinedItems(declined)} currentUserId={session.userId} />
        ) : (
          <ResolutionTable
            resolutions={await repository.listResolutions("history")}
            label={label}
            empty="No closed resolutions yet"
          />
        )}
      </section>
    </>
  );
}
