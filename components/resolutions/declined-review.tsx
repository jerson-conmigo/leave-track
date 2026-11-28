"use client";

import { Scale } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { resolutionTransitionAction } from "@/app/(app)/resolutions/actions";
import { EmptyState } from "@/components/leave/empty-state";
import { LeaveTypeBadge } from "@/components/leave/leave-type-badge";
import { ProposeDialog, type ProposeMode } from "@/components/resolutions/propose-dialog";
import { Button } from "@/components/ui/button";
import { formatDays } from "@/lib/format";
import type { ResolutionQueueRow, ResolutionView } from "@/lib/resolutions/types";

export type DeclinedItem = { resolution: ResolutionView; row: ResolutionQueueRow };

/**
 * TASK-033 (D6) — HR's "Declined – review": the employee's reason, then Re-propose (after the
 * first decline) or Final decision (after the second). Never on HR's own balance.
 */
export function DeclinedReview({
  items,
  currentUserId,
}: {
  items: DeclinedItem[];
  currentUserId: string;
}) {
  const [selected, setSelected] = useState<DeclinedItem | null>(null);
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Scale}
        title="No declined proposals"
        description="Declined proposals wait here for your review."
      />
    );
  }
  const mode = (i: DeclinedItem): Extract<ProposeMode, "repropose" | "finalize"> =>
    i.resolution.proposalNumber >= 2 ? "finalize" : "repropose";

  return (
    <>
      <ul aria-label="Declined proposals" className="flex flex-col gap-3">
        {items.map((i) => {
          const r = i.resolution;
          const m = mode(i);
          return (
            <li key={r.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 font-medium break-words">{r.userName}</p>
                <LeaveTypeBadge type={r.leaveType} />
              </div>
              <p className="text-sm">
                Declined proposal {r.proposalNumber} of 2 for a {formatDays(r.deficit)} deficit.
              </p>
              <blockquote className="border-l-2 pl-3 text-sm break-words text-muted-foreground">
                &ldquo;{r.responseReason}&rdquo;
              </blockquote>
              <div>
                {r.userId === currentUserId ? (
                  <span className="text-sm text-muted-foreground">
                    Another HR Admin resolves this
                  </span>
                ) : (
                  <Button
                    className="h-auto min-h-11 max-w-full whitespace-normal md:min-h-9"
                    aria-label={`${m === "finalize" ? "Final decision" : "Re-propose"} for ${r.userName}, ${r.leaveType}`}
                    onClick={(e) => {
                      setTrigger(e.currentTarget);
                      setSelected(i);
                      setOpen(true);
                    }}
                  >
                    {m === "finalize" ? "Final decision" : "Re-propose"}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {selected ? (
        <ProposeDialog
          key={selected.resolution.id}
          mode={mode(selected)}
          row={selected.row}
          open={open}
          onOpenChange={setOpen}
          returnFocusTo={trigger}
          onConfirm={async (input) => {
            const m = mode(selected);
            const result = await resolutionTransitionAction(m, selected.resolution.id, input);
            if (result.success) {
              toast.success(
                m === "finalize" ? "Final decision recorded." : "Second proposal sent.",
              );
            }
            return result;
          }}
        />
      ) : null}
    </>
  );
}
