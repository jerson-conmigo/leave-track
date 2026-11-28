import { describe, expect, it } from "vitest";
import { clampAmounts, recoverySchedule } from "@/lib/resolutions/apply";

describe("clampAmounts (D-1: recovery shrinks first)", () => {
  it.each([
    [4, 2, 6, 4, 2], // unchanged
    [4, 2, 5, 4, 1], // recovery absorbs the cut
    [4, 2, 3, 3, 0], // recovery gone, then unpaid
    [4, 2, 0, 0, 0], // deficit gone
    [4, 2, 8, 4, 2], // never more than proposed
    [0.25, 1, 1.1, 0.25, 0.85],
  ])("%s + %s against %s → %s + %s", (u, r, d, eu, er) => {
    expect(clampAmounts(u, r, d)).toEqual({ unpaid: eu, recovery: er });
  });
});

describe("recoverySchedule (D-2: the last month takes the remainder)", () => {
  it("splits into 2-decimal months that sum exactly", () => {
    const rows = recoverySchedule(1, 3, "2027-11-01");
    expect(rows).toEqual([
      { period: "2027-11-01", amount: 0.33 },
      { period: "2027-12-01", amount: 0.33 },
      { period: "2028-01-01", amount: 0.34 },
    ]);
  });
  it("drops zero rows and returns nothing for no recovery", () => {
    expect(recoverySchedule(0.01, 3, "2027-01-01")).toEqual([
      { period: "2027-01-01", amount: 0.01 },
    ]);
    expect(recoverySchedule(0, 3, "2027-01-01")).toEqual([]);
  });
  it.each([
    [1.25, 1],
    [2.5, 4],
    [7.77, 7],
  ])("%s over %s months sums back exactly", (total, months) => {
    const sum = recoverySchedule(total, months, "2027-01-01").reduce(
      (s, r) => s + Math.round(r.amount * 100),
      0,
    );
    expect(sum).toBe(Math.round(total * 100));
  });
});
