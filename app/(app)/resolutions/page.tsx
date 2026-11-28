import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ResolutionQueue } from "@/components/resolutions/resolution-queue";
import { ResolutionTable } from "@/components/resolutions/resolution-table";
import {
  parseResolutionTab,
  RESOLUTION_TABS,
  ResolutionTabs,
} from "@/components/resolutions/resolution-tabs";
import { requireRole } from "@/lib/auth/session";
import { repository } from "@/lib/data/repositories";

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
          <ResolutionTable resolutions={declined} label={label} empty="No declined proposals" />
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
