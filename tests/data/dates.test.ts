import { describe, expect, it } from "vitest";
import { utcDay, utcMonthBounds, withinUtcDays } from "@/lib/data/dates";

/** UTC calendar-date semantics shared by the mock and (in SQL) the Postgres repository. */
describe("lib/data/dates", () => {
  it("utcDay normalises any offset to the UTC calendar date", () => {
    expect(utcDay("2026-11-25T23:30:00.000Z")).toBe("2026-11-25");
    expect(utcDay("2026-11-26T08:30:00+13:00")).toBe("2026-11-25"); // Auckland morning = UTC evening
    expect(utcDay("2026-11-25T20:00:00-05:00")).toBe("2026-11-26"); // New York evening = next UTC day
  });

  it("withinUtcDays is inclusive and open-ended", () => {
    const t = "2026-11-19T23:59:59.999Z";
    expect(withinUtcDays(t, "2026-11-19", "2026-11-19")).toBe(true);
    expect(withinUtcDays(t, "2026-11-20")).toBe(false);
    expect(withinUtcDays(t, undefined, "2026-11-18")).toBe(false);
    expect(withinUtcDays(t)).toBe(true);
  });

  it("utcMonthBounds returns [start, next start) and rolls over the year", () => {
    expect(utcMonthBounds(new Date("2026-11-26T12:00:00Z"))).toEqual([
      "2026-11-01T00:00:00.000Z",
      "2026-12-01T00:00:00.000Z",
    ]);
    expect(utcMonthBounds(new Date("2026-12-31T23:59:59Z"))).toEqual([
      "2026-12-01T00:00:00.000Z",
      "2027-01-01T00:00:00.000Z",
    ]);
    // A local-time "Dec 1" that is still Nov 30 in UTC belongs to November.
    expect(utcMonthBounds(new Date("2026-12-01T05:00:00+13:00"))[0]).toBe(
      "2026-11-01T00:00:00.000Z",
    );
  });
});
