import { describe, expect, it } from "vitest";
import { availableForRequest, buildBalanceSummaries } from "@/lib/data/balance";
import type { LeaveType } from "@/lib/data/types";

/** US-02 balance rules — the single implementation shared by all repositories. */
const V = "10000000-0000-4000-8000-000000000001";
const S = "10000000-0000-4000-8000-000000000002";
const U = "10000000-0000-4000-8000-000000000003";
const types: LeaveType[] = [
  { id: V, name: "Vacation", tracksBalance: true, maxBackdateDays: 0 },
  { id: S, name: "Sick", tracksBalance: true, maxBackdateDays: 30 },
  { id: U, name: "Unpaid", tracksBalance: false, maxBackdateDays: 0 },
];
const ACCRUAL = "2026-11-01T02:00:00.000Z";

const build = (over: Partial<Parameters<typeof buildBalanceSummaries>[0]> = {}) =>
  buildBalanceSummaries({
    leaveTypes: types,
    balances: [
      { leaveTypeId: V, balance: 11.25 },
      { leaveTypeId: S, balance: 5 },
    ],
    policies: [
      { leaveTypeId: V, accrualPerMonth: 1.25 },
      { leaveTypeId: S, accrualPerMonth: 1 },
    ],
    pendingRanges: [{ leaveTypeId: V, startDate: "2026-12-21", endDate: "2026-12-31" }],
    lastAccrualAt: ACCRUAL,
    ...over,
  });

describe("buildBalanceSummaries", () => {
  it("AC1: one summary per type, in type order, with confirmed balance as of the accrual run", () => {
    const [vac, sick, unpaid] = build();
    expect([vac?.leaveType.name, sick?.leaveType.name, unpaid?.leaveType.name]).toEqual([
      "Vacation",
      "Sick",
      "Unpaid",
    ]);
    expect(vac).toMatchObject({ confirmed: 11.25, accrualPerMonth: 1.25, asOf: ACCRUAL });
    expect(sick).toMatchObject({ confirmed: 5, pending: 0, available: 5, asOf: ACCRUAL });
  });

  it("AC2: pending is reported separately and NOT deducted from confirmed", () => {
    const [vac] = build();
    expect(vac).toMatchObject({ confirmed: 11.25, pending: 11, available: 0.25 });
  });

  it("only counts pending ranges of the same type (US-08)", () => {
    const [vac, sick] = build({
      pendingRanges: [{ leaveTypeId: S, startDate: "2027-01-04", endDate: "2027-01-05" }],
    });
    expect(vac?.pending).toBe(0);
    expect(sick).toMatchObject({ pending: 2, available: 3 });
  });

  it("untracked types (Unpaid) have no confirmed/available/asOf, but still show pending days", () => {
    const [, , unpaid] = build({
      pendingRanges: [{ leaveTypeId: U, startDate: "2026-11-30", endDate: "2026-11-30" }],
    });
    expect(unpaid).toMatchObject({
      confirmed: null,
      available: null,
      asOf: null,
      accrualPerMonth: null,
      pending: 1,
    });
  });

  it("treats a tracked type with no balance row as 0 confirmed", () => {
    const [vac] = build({ balances: [], pendingRanges: [] });
    expect(vac).toMatchObject({ confirmed: 0, available: 0 });
  });

  it("asOf is null when no accrual has run yet", () => {
    expect(build({ lastAccrualAt: null }).map((b) => b.asOf)).toEqual([null, null, null]);
  });
});

describe("availableForRequest (queue balance hint)", () => {
  const pending = [
    { id: "r1", leaveTypeId: V, startDate: "2026-12-01", endDate: "2026-12-05" }, // 5 days — under review
    { id: "r2", leaveTypeId: V, startDate: "2027-01-04", endDate: "2027-01-05" }, // 2 days
    { id: "r3", leaveTypeId: S, startDate: "2027-01-06", endDate: "2027-01-06" }, // other type
  ];

  it("excludes the request under review and other types", () => {
    expect(
      availableForRequest({
        tracksBalance: true,
        confirmed: 6.5,
        pendingRanges: pending,
        request: { id: "r1", leaveTypeId: V },
      }),
    ).toBe(4.5);
  });

  it("missing balance row counts as 0; untracked types are null", () => {
    expect(
      availableForRequest({
        tracksBalance: true,
        confirmed: undefined,
        pendingRanges: [],
        request: { id: "x", leaveTypeId: V },
      }),
    ).toBe(0);
    expect(
      availableForRequest({
        tracksBalance: false,
        confirmed: 3,
        pendingRanges: pending,
        request: { id: "x", leaveTypeId: U },
      }),
    ).toBeNull();
  });
});
