import { describe, expect, it } from "vitest";
import { countDays, formatDateRange, formatDateTime, formatDays, initials } from "@/lib/format";

describe("countDays", () => {
  it("counts inclusive calendar days", () => {
    expect(countDays("2026-12-21", "2026-12-31")).toBe(11);
    expect(countDays("2026-11-30", "2026-11-30")).toBe(1);
  });

  it("is safe across DST and month boundaries", () => {
    expect(countDays("2026-03-07", "2026-03-09")).toBe(3);
    expect(countDays("2026-02-27", "2026-03-02")).toBe(4);
  });

  it("returns 0 for an inverted range", () => {
    expect(countDays("2026-12-31", "2026-12-21")).toBe(0);
  });
});

describe("formatDays / initials", () => {
  it("pluralises and trims decimals", () => {
    expect(formatDays(1)).toBe("1 day");
    expect(formatDays(1.25)).toBe("1.25 days");
    expect(formatDays(2.5)).toBe("2.5 days");
  });

  it("builds two-letter initials", () => {
    expect(initials("Ana Reyes")).toBe("AR");
    expect(initials("Diego  Alvarez Ruiz")).toBe("DA");
  });
});

describe("hydration-safe date formatting", () => {
  // Node ICU emits U+2009 / U+202F where browsers emit U+0020; any non-ASCII
  // space here would cause a server/client text mismatch (React #418).
  const unicodeSpace = /[  -   　]/;

  it("formatDateRange uses only plain spaces", () => {
    const out = formatDateRange("2026-12-21", "2026-12-31");
    expect(out).toBe("Dec 21 – 31, 2026");
    expect(out).not.toMatch(unicodeSpace);
  });

  it("formatDateTime uses only plain spaces", () => {
    const out = formatDateTime("2026-11-18T09:12:00.000Z");
    expect(out).toBe("Nov 18, 2026, 9:12 AM UTC");
    expect(out).not.toMatch(unicodeSpace);
  });
});
