import { describe, expect, it } from "vitest";
import { USER_IDS } from "@/lib/data/mock/fixtures";
import { mockRepository } from "@/lib/data/mock/repository";

describe("mock repository — scoping contract the Day 1 SQL must keep", () => {
  it("returns only direct reports' requests to a manager (BR-02 / US-04)", async () => {
    const ben = await mockRepository.listTeamRequests(USER_IDS.ben);
    const bensTeam = new Set<string>([USER_IDS.ana, USER_IDS.jordan, USER_IDS.priya]);
    expect(ben.length).toBeGreaterThan(0);
    expect(ben.every((r) => bensTeam.has(r.employee.id))).toBe(true);
  });

  it("never leaks another team's requests", async () => {
    const maya = await mockRepository.listTeamRequests(USER_IDS.maya);
    expect(maya.some((r) => r.employee.id === USER_IDS.ana)).toBe(false);
  });

  it("filters to pending when asked", async () => {
    const pending = await mockRepository.listTeamRequests(USER_IDS.ben, { status: "pending" });
    expect(pending.every((r) => r.status === "pending")).toBe(true);
  });

  it("keeps pending days separate from the confirmed balance (US-02 AC2)", async () => {
    const [vacation] = await mockRepository.getBalances(USER_IDS.ana);
    expect(vacation?.leaveType.name).toBe("Vacation");
    expect(vacation?.confirmed).toBe(11.25);
    expect(vacation?.pending).toBe(11);
    expect(vacation?.available).toBe(0.25);
  });

  it("does not track a balance for Unpaid leave (US-08 AC2)", async () => {
    const unpaid = (await mockRepository.getBalances(USER_IDS.jordan)).find(
      (b) => b.leaveType.name === "Unpaid",
    );
    expect(unpaid?.confirmed).toBeNull();
    expect(unpaid?.available).toBeNull();
  });
});

describe("team request balance hint", () => {
  it("does not count the request under review against its own balance", async () => {
    const queue = await mockRepository.listTeamRequests(USER_IDS.ben, { status: "pending" });
    // Jordan: 6.5 Vacation confirmed, one 5-day pending request → 6.5 available for it, not 1.5.
    const jordanVacation = queue.find(
      (r) => r.employee.id === USER_IDS.jordan && r.leaveType === "Vacation",
    );
    expect(jordanVacation?.balanceAvailable).toBe(6.5);
    expect(jordanVacation!.days <= jordanVacation!.balanceAvailable!).toBe(true);
    // Ana: 11.25 confirmed, 11-day request → fits.
    const ana = queue.find((r) => r.employee.id === USER_IDS.ana);
    expect(ana?.balanceAvailable).toBe(11.25);
  });
});
