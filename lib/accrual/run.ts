import { AppError } from "@/lib/api/errors";
import type { AccrualStore, AccrualTrigger } from "@/lib/accrual/store";
import type { AccrualResult } from "@/lib/data/types";
import { logger } from "@/lib/logger";

export type AccrualDeps = { store: AccrualStore };

/** A gap larger than this is refused (needs a human) — see ADR-LeaveTrack-E002. */
export const MAX_CATCH_UP_MONTHS = 12;

/**
 * Monthly balance accrual (US-07, BR-06). Idempotent per UTC month and safe under
 * duplicate/overlapping invocations; accrues every missed month (catch-up) at the
 * CURRENT policy rates — each run row snapshots the rates it applied.
 */
export async function runMonthlyAccrual(
  { store }: AccrualDeps,
  { trigger, now = new Date() }: { trigger: AccrualTrigger; now?: Date },
): Promise<AccrualResult> {
  const outcome = await store.runAccrual({ now, trigger, maxCatchUpMonths: MAX_CATCH_UP_MONTHS });

  if (outcome.status === "too_far_behind") {
    logger.error(
      {
        event: "accrual.too_far_behind",
        monthsMissing: outcome.monthsMissing,
        max: MAX_CATCH_UP_MONTHS,
      },
      "accrual refused: too many missed months — manual review required",
    );
    throw new AppError(
      "CONFLICT",
      `Accrual is ${outcome.monthsMissing} months behind (max ${MAX_CATCH_UP_MONTHS}). Manual review required.`,
    );
  }

  const { accrued } = outcome;
  if (accrued.length === 0) {
    logger.info({ event: "accrual.up_to_date", trigger }, "accrual already up to date");
  } else {
    if (accrued.length > 1) {
      logger.warn(
        { event: "accrual.catch_up", periods: accrued.map((a) => a.period), trigger },
        "accrual caught up missed months at the CURRENT policy rates",
      );
    }
    for (const a of accrued)
      logger.info({ event: "accrual.accrued", trigger, ...a }, "accrued month");
  }
  return { accrued, upToDate: accrued.length === 0, catchUp: accrued.length > 1 };
}
