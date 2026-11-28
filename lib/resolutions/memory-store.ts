import { atomically, mockDb } from "@/lib/data/mock/store";
import { writeResolutionProposedMemory } from "@/lib/notifications/memory";
import { cents, type ResolutionStore } from "@/lib/resolutions/store";
import { monthlyDeduction, OPEN_RESOLUTION_STATUSES } from "@/lib/resolutions/types";

/** TASK-032 — proposals over the in-memory mock DB: the same rules as Postgres (parity-tested). */
export const memoryResolutionStore: ResolutionStore = {
  async proposeWithAudit(input) {
    const user = mockDb.users.find((u) => u.id === input.userId);
    const type = mockDb.leaveTypes.find((t) => t.id === input.leaveTypeId);
    if (!user || !type) return { ok: false, reason: "not_found" };
    if (!type.tracksBalance) return { ok: false, reason: "untracked" };
    const balance =
      mockDb.leaveBalances.find((b) => b.userId === user.id && b.leaveTypeId === type.id)
        ?.balance ?? 0;
    if (balance >= 0) return { ok: false, reason: "not_in_deficit" };
    const deficit = Math.round(-balance * 100) / 100;
    if (cents(input.unpaidDays) + cents(input.recoveryDays) !== cents(deficit)) {
      return { ok: false, reason: "split_mismatch", deficit };
    }
    const accrualPerMonth =
      mockDb.leavePolicies.find((p) => p.userId === user.id && p.leaveTypeId === type.id)
        ?.accrualPerMonth ?? 0;
    if (
      input.recoveryDays > 0 &&
      (accrualPerMonth <= 0 ||
        monthlyDeduction(input.recoveryDays, input.recoveryMonths!) > accrualPerMonth)
    ) {
      return { ok: false, reason: "recovery_too_high", accrualPerMonth };
    }
    // Mirrors the unique partial index balance_resolutions_one_open.
    if (
      mockDb.balanceResolutions.some(
        (r) =>
          r.userId === user.id &&
          r.leaveTypeId === type.id &&
          (OPEN_RESOLUTION_STATUSES as readonly string[]).includes(r.status),
      )
    ) {
      throw Object.assign(new Error("balance_resolutions_one_open violated"), {
        code: "23505",
        constraint: "balance_resolutions_one_open",
      });
    }
    const now = new Date();
    const days = mockDb.appSettings.find((s) => s.key === "resolution_response_days")?.value ?? 3;
    const id = crypto.randomUUID();
    const respondBy = new Date(now.getTime() + days * 86_400_000).toISOString();
    atomically(() => {
      mockDb.balanceResolutions.push({
        id,
        userId: user.id,
        leaveTypeId: type.id,
        status: "proposed",
        deficitAtProposal: deficit,
        unpaidDaysProposed: input.unpaidDays,
        recoveryDaysProposed: input.recoveryDays,
        recoveryStartPeriod: input.recoveryStartPeriod,
        recoveryMonths: input.recoveryMonths,
        respondBy,
        proposalNumber: 1,
        proposedBy: input.actorId,
        proposedAt: now.toISOString(),
        closedAt: null,
      });
      mockDb.balanceResolutionEvents.push({
        id: crypto.randomUUID(),
        resolutionId: id,
        action: "proposed",
        actorId: input.actorId,
        balanceBefore: balance,
        balanceAfter: balance,
        details: {
          unpaidDays: input.unpaidDays,
          recoveryDays: input.recoveryDays,
          recoveryStartPeriod: input.recoveryStartPeriod,
          recoveryMonths: input.recoveryMonths,
        },
        occurredAt: now.toISOString(),
      });
      writeResolutionProposedMemory(id, now.toISOString());
    });
    return {
      ok: true,
      id,
      userName: user.name,
      leaveType: type.name,
      deficit,
      respondBy,
      proposedAt: now.toISOString(),
    };
  },
};
