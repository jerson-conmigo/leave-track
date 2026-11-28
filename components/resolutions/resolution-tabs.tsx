import Link from "next/link";
import { cn } from "@/lib/utils";

export const RESOLUTION_TABS = [
  { id: "needs", label: "Needs proposal" },
  { id: "awaiting", label: "Awaiting employee" },
  { id: "declined", label: "Declined – review" },
  { id: "history", label: "History" },
] as const;
export type ResolutionTab = (typeof RESOLUTION_TABS)[number]["id"];

export function parseResolutionTab(value: unknown): ResolutionTab {
  return RESOLUTION_TABS.some((t) => t.id === value) ? (value as ResolutionTab) : "needs";
}

/** Server-rendered tab links (D-4): each tab is a URL, the current one marked with aria-current. */
export function ResolutionTabs({
  current,
  counts,
}: {
  current: ResolutionTab;
  counts: Partial<Record<ResolutionTab, number>>;
}) {
  return (
    <nav aria-label="Resolution queues" className="mb-4">
      <ul className="flex flex-wrap gap-2">
        {RESOLUTION_TABS.map((t) => {
          const active = t.id === current;
          const count = counts[t.id];
          return (
            <li key={t.id}>
              <Link
                href={`/resolutions?tab=${t.id}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {t.label}
                {count !== undefined ? (
                  <span className="tabular-nums" aria-label={`${count} items`}>
                    ({count})
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
