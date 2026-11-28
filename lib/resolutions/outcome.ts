import { AppError } from "@/lib/api/errors";
import { toAppError } from "@/lib/db/errors";
import type { Failure, ResolutionOutcome } from "@/lib/resolutions/store";
import type { ResolutionView } from "@/lib/resolutions/types";

/** One mapping from store failures to API errors, for every resolution service. */
export function failureToError(f: Failure): AppError {
  switch (f.reason) {
    case "not_found":
      return new AppError("NOT_FOUND", "Resolution, employee or leave type not found.");
    case "untracked":
      return new AppError("VALIDATION_ERROR", "This leave type has no balance to resolve.");
    case "not_in_deficit":
      return new AppError("CONFLICT", "This balance is no longer below zero.");
    case "split_mismatch":
      return new AppError(
        "VALIDATION_ERROR",
        `Unpaid and recovery days must add up to the deficit (${f.deficit} days).`,
      );
    case "recovery_too_high":
      return new AppError(
        "VALIDATION_ERROR",
        `The monthly deduction can't exceed the accrual rate (${f.accrualPerMonth ?? 0} days a month).`,
      );
    case "expired":
      return new AppError("CONFLICT", "The deadline to respond has passed.");
    case "not_open":
      return new AppError("CONFLICT", "This resolution has already been answered.");
    case "own_balance":
      return new AppError("FORBIDDEN", "You can't resolve your own balance.");
    case "final_round":
      return new AppError(
        "CONFLICT",
        "This was the second proposal; only a final decision is possible now.",
      );
    case "repropose_first":
      return new AppError(
        "CONFLICT",
        "A final decision comes after a second decline; re-propose first.",
      );
  }
}

/** Run a store call: database errors → toAppError; failures → AppError; success → the view. */
export async function settle(call: () => Promise<ResolutionOutcome>): Promise<ResolutionView> {
  let outcome: ResolutionOutcome;
  try {
    outcome = await call();
  } catch (error) {
    const known = toAppError(error);
    if (known) throw known;
    throw error;
  }
  if (!outcome.ok) throw failureToError(outcome);
  return outcome.resolution;
}
