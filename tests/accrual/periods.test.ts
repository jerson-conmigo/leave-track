import { describe, expect, it } from "vitest";
import { currentPeriod, monthsToAccrue } from "@/lib/accrual/periods";

describe("accrual periods (UTC months)", () => {
  it("currentPeriod is the first of the UTC month", () => {
    expect(currentPeriod(new Date("2026-12-31T23:59:59Z"))).toBe("2026-12-01");
    expect(currentPeriod(new Date("2027-01-01T05:00:00+13:00"))).toBe("2026-12-01"); // still Dec in UTC
  });

  it("no run yet → only the current month", () => {
    expect(monthsToAccrue(null, "2026-12-01", 12)).toEqual({ periods: ["2026-12-01"] });
  });

  it("already accrued this month (or a later one) → nothing; never a future month", () => {
    expect(monthsToAccrue("2026-12-01", "2026-12-01", 12)).toEqual({ periods: [] });
    expect(monthsToAccrue("2027-03-01", "2026-12-01", 12)).toEqual({ periods: [] });
  });

  it("missed months are returned oldest first, across a year boundary", () => {
    expect(monthsToAccrue("2026-11-01", "2027-02-01", 12)).toEqual({
      periods: ["2026-12-01", "2027-01-01", "2027-02-01"],
    });
  });

  it("refuses a gap larger than the cap, reporting how many months are missing", () => {
    expect(monthsToAccrue("2026-11-01", "2027-11-01", 12)).toEqual({
      periods: Array.from({ length: 12 }, (_, i) => {
        const d = new Date(Date.UTC(2026, 11 + i, 1));
        return d.toISOString().slice(0, 10);
      }),
    });
    expect(monthsToAccrue("2026-11-01", "2027-12-01", 12)).toEqual({ tooFarBehind: 13 });
    expect(monthsToAccrue("2026-11-01", "2028-01-01", 12)).toEqual({ tooFarBehind: 14 });
  });
});
