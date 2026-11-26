import { describe, expect, it } from "vitest";
import { addDays, sumDays } from "@/lib/data/decimal";

describe("exact day arithmetic (integer hundredths)", () => {
  it("avoids binary float errors", () => {
    expect(0.1 + 0.2).not.toBe(0.3); // the trap
    expect(addDays(0.1, 0.2)).toBe(0.3);
    expect(addDays(addDays(1.33, 1.33), 1.33)).toBe(3.99);
    expect(sumDays([1.33, 1.33, 1.33])).toBe(3.99);
  });

  it("handles negatives and sums of the seed policies exactly", () => {
    expect(addDays(-1.25, 1.25)).toBe(0);
    expect(addDays(-2.75, 0.5)).toBe(-2.25);
    expect(sumDays([...Array(9).fill(1.25), ...Array(9).fill(1)])).toBe(20.25);
  });
});
