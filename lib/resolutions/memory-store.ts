import { appendLedger, atomically, mockDb } from "@/lib/data/mock/store";
import { addDays } from "@/lib/data/decimal";
import {
  writeResolutionProposedMemory,
  writeResolutionResponseMemory,
} from "@/lib/notifications/memory";
import { clampAmounts, recoverySchedule } from "@/lib/resolutions/apply";
import { logger } from "@/lib/logger";
import {
  checkSplit,
  type ExpireResult,
  type Failure,
  type ProposeInput,
  type ResolutionStore,
} from "@/lib/resolutions/store";
import { type MockResolution, OPEN_RESOLUTION_STATUSES } from "@/lib/resolutions/types";
import { toMemoryResolutionView } from "@/lib/resolutions/views";

/**
 * Resolutions over the in-memory mock DB (TASK-032/033) — the same rules and outcomes as Postgres
 * (parity-tested). Each method checks synchronously and then writes inside `atomically`, with no
 * `await` in between, so two concurrent calls can't both pass the same check.
 */
const fail = (reason: Failure["reason"]): Failure => ({ ok: false, reason });

function context(userId: string, leaveTypeId: string) {
  const user = mockDb.users.find((u) => u.id === userId);
  const type = mockDb.leaveTypes.find((t) => t.id === leaveTypeId);
  if (!user || !type) return null;
  return {
    tracks: type.tracksBalance,
    accrual:
      mockDb.leavePolicies.find((p) => p.userId === userId && p.leaveTypeId === leaveTypeId)
        ?.accrualPerMonth ?? 0,
    balance:
      mockDb.leaveBalances.find((b) => b.userId === userId && b.leaveTypeId === leaveTypeId)
        ?.balance ?? 0,
  };
}

function event(
  resolutionId: string,
  action: string,
  actorId: string | null,
  before: number | null,
  after: number | null,
  details: Record<string, unknown>,
  now: string,
) {
  mockDb.balanceResolutionEvents.push({
    id: crypto.randomUUID(),
    resolutionId,
    action,
    actorId,
    balanceBefore: before,
    balanceAfter: after,
    details,
    occurredAt: now,
  });
}

/** Mirrors balance_resolutions_one_open (same SQLSTATE + name, so toAppError maps it alike). */
function assertNoOpen(userId: string, leaveTypeId: string) {
  if (
    mockDb.balanceResolutions.some(
      (r) =>
        r.userId === userId &&
        r.leaveTypeId === leaveTypeId &&
        (OPEN_RESOLUTION_STATUSES as readonly string[]).includes(r.status),
    )
  ) {
    throw Object.assign(new Error("balance_resolutions_one_open violated"), {
      code: "23505",
      constraint: "balance_resolutions_one_open",
    });
  }
}

function insertProposal(
  input: ProposeInput,
  deficit: number,
  balance: number,
  proposalNumber: number,
  supersedesId: string | null,
  now: Date,
): MockResolution {
  assertNoOpen(input.userId, input.leaveTypeId);
  const days = mockDb.appSettings.find((s) => s.key === "resolution_response_days")?.value ?? 3;
  const row: MockResolution = {
    id: crypto.randomUUID(),
    userId: input.userId,
    leaveTypeId: input.leaveTypeId,
    status: "proposed",
    deficitAtProposal: deficit,
    unpaidDaysProposed: input.unpaidDays,
    recoveryDaysProposed: input.recoveryDays,
    recoveryStartPeriod: input.recoveryStartPeriod,
    recoveryMonths: input.recoveryMonths,
    respondBy: new Date(now.getTime() + days * 86_400_000).toISOString(),
    proposalNumber,
    proposedBy: input.actorId,
    proposedAt: now.toISOString(),
    closedAt: null,
    supersedesId,
    unpaidDaysApplied: null,
    recoveryDaysApplied: null,
    responseReason: null,
    decidedBy: null,
    finalReason: null,
  };
  mockDb.balanceResolutions.push(row);
  event(
    row.id,
    "proposed",
    input.actorId,
    balance,
    balance,
    {
      unpaidDays: input.unpaidDays,
      recoveryDays: input.recoveryDays,
      recoveryStartPeriod: input.recoveryStartPeriod,
      recoveryMonths: input.recoveryMonths,
    },
    row.proposedAt,
  );
  writeResolutionProposedMemory(row.id, row.proposedAt);
  return row;
}

/** Credit conversion then recovery (one ledger row each), then write the schedule. */
function applyAmounts(
  r: MockResolution,
  applied: { unpaid: number; recovery: number },
  schedule: { start: string | null; months: number | null },
  actorId: string | null, // null = the system (TASK-034 expiry)
  now: string,
): number {
  let bal = mockDb.leaveBalances.find(
    (b) => b.userId === r.userId && b.leaveTypeId === r.leaveTypeId,
  );
  for (const [source, delta] of [
    ["conversion", applied.unpaid],
    ["recovery", applied.recovery],
  ] as const) {
    if (delta <= 0) continue;
    if (!bal) {
      bal = {
        id: crypto.randomUUID(),
        userId: r.userId,
        leaveTypeId: r.leaveTypeId,
        balance: 0,
        updatedAt: now,
      };
      mockDb.leaveBalances.push(bal);
    }
    bal.balance = addDays(bal.balance, delta);
    bal.updatedAt = now;
    appendLedger({
      userId: r.userId,
      leaveTypeId: r.leaveTypeId,
      delta,
      balanceAfter: bal.balance,
      source,
      sourceKey: `resolution:${r.id}:${source}`,
      leaveRequestId: null,
      actorId,
      occurredAt: now,
    });
  }
  if (applied.recovery > 0) {
    for (const s of recoverySchedule(applied.recovery, schedule.months!, schedule.start!)) {
      if (mockDb.balanceRecoveries.some((x) => x.resolutionId === r.id && x.period === s.period)) {
        throw Object.assign(new Error("balance_recoveries_resolution_period_key violated"), {
          code: "23505",
          constraint: "balance_recoveries_resolution_period_key",
        });
      }
      mockDb.balanceRecoveries.push({
        id: crypto.randomUUID(),
        resolutionId: r.id,
        ...s,
        appliedAt: null,
      });
    }
  }
  return bal?.balance ?? 0;
}

const live = (r: MockResolution, now: Date) => Date.parse(r.respondBy) > now.getTime();

export const memoryResolutionStore: ResolutionStore = {
  async proposeWithAudit(input) {
    const ctx = context(input.userId, input.leaveTypeId);
    if (!ctx) return fail("not_found");
    if (!ctx.tracks) return fail("untracked");
    if (ctx.balance >= 0) return fail("not_in_deficit");
    const deficit = addDays(0, -ctx.balance);
    const bad = checkSplit(input, deficit, ctx.accrual);
    if (bad) return bad;
    const now = new Date();
    const row = atomically(() => insertProposal(input, deficit, ctx.balance, 1, null, now));
    return { ok: true, resolution: toMemoryResolutionView(row, now) };
  },

  async acceptWithApply({ resolutionId, actorId }) {
    const now = new Date();
    const r = mockDb.balanceResolutions.find((x) => x.id === resolutionId);
    if (!r || r.userId !== actorId) return fail("not_found");
    if (r.status !== "proposed") return fail("not_open");
    if (!live(r, now)) return fail("expired");
    const ctx = context(r.userId, r.leaveTypeId)!;
    const applied = clampAmounts(r.unpaidDaysProposed, r.recoveryDaysProposed, -ctx.balance);
    const iso = now.toISOString();
    atomically(() => {
      Object.assign(r, {
        status: applied.unpaid + applied.recovery > 0 ? "accepted" : "finalized",
        unpaidDaysApplied: applied.unpaid,
        recoveryDaysApplied: applied.recovery,
        decidedBy: actorId,
        closedAt: iso,
      });
      const after = applyAmounts(
        r,
        applied,
        { start: r.recoveryStartPeriod, months: r.recoveryMonths },
        actorId,
        iso,
      );
      event(
        r.id,
        "accepted",
        actorId,
        ctx.balance,
        after,
        {
          proposed: { unpaidDays: r.unpaidDaysProposed, recoveryDays: r.recoveryDaysProposed },
          applied: { unpaidDays: applied.unpaid, recoveryDays: applied.recovery },
        },
        iso,
      );
      writeResolutionResponseMemory(r.id, "resolution.accepted", iso);
    });
    return { ok: true, resolution: toMemoryResolutionView(r, now) };
  },

  async declineWithReason({ resolutionId, actorId, reason }) {
    const now = new Date();
    const r = mockDb.balanceResolutions.find((x) => x.id === resolutionId);
    if (!r || r.userId !== actorId) return fail("not_found");
    if (r.status !== "proposed") return fail("not_open");
    if (!live(r, now)) return fail("expired");
    const iso = now.toISOString();
    atomically(() => {
      Object.assign(r, { status: "declined", responseReason: reason });
      mockDb.balanceResolutionEvents.push({
        id: crypto.randomUUID(),
        resolutionId: r.id,
        action: "declined",
        actorId,
        balanceBefore: null,
        balanceAfter: null,
        details: { reason },
        occurredAt: iso,
      });
      writeResolutionResponseMemory(r.id, "resolution.declined", iso);
    });
    return { ok: true, resolution: toMemoryResolutionView(r, now) };
  },

  async reproposeWithAudit(input) {
    const r = mockDb.balanceResolutions.find((x) => x.id === input.resolutionId);
    if (!r) return fail("not_found");
    if (r.userId === input.actorId) return fail("own_balance");
    if (r.status !== "declined") return fail("not_open");
    if (r.proposalNumber >= 2) return fail("final_round");
    const ctx = context(r.userId, r.leaveTypeId)!;
    if (ctx.balance >= 0) return fail("not_in_deficit");
    const deficit = addDays(0, -ctx.balance);
    const bad = checkSplit(input, deficit, ctx.accrual);
    if (bad) return bad;
    const now = new Date();
    const iso = now.toISOString();
    const row = atomically(() => {
      Object.assign(r, { status: "superseded", closedAt: iso });
      event(r.id, "superseded", input.actorId, null, null, {}, iso);
      return insertProposal(
        {
          userId: r.userId,
          leaveTypeId: r.leaveTypeId,
          actorId: input.actorId,
          unpaidDays: input.unpaidDays,
          recoveryDays: input.recoveryDays,
          recoveryStartPeriod: input.recoveryStartPeriod,
          recoveryMonths: input.recoveryMonths,
        },
        deficit,
        ctx.balance,
        2,
        r.id,
        now,
      );
    });
    return { ok: true, resolution: toMemoryResolutionView(row, now) };
  },

  async finalizeWithAudit(input) {
    const r = mockDb.balanceResolutions.find((x) => x.id === input.resolutionId);
    if (!r) return fail("not_found");
    if (r.userId === input.actorId) return fail("own_balance");
    if (r.status !== "declined") return fail("not_open");
    if (r.proposalNumber < 2) return fail("repropose_first");
    const ctx = context(r.userId, r.leaveTypeId)!;
    const bad = checkSplit(input, r.deficitAtProposal, ctx.accrual);
    if (bad) return bad;
    const applied = clampAmounts(input.unpaidDays, input.recoveryDays, -ctx.balance);
    const now = new Date();
    const iso = now.toISOString();
    atomically(() => {
      Object.assign(r, {
        status: "finalized",
        unpaidDaysApplied: applied.unpaid,
        recoveryDaysApplied: applied.recovery,
        decidedBy: input.actorId,
        finalReason: input.reason,
        closedAt: iso,
      });
      const after = applyAmounts(
        r,
        applied,
        { start: input.recoveryStartPeriod, months: input.recoveryMonths },
        input.actorId,
        iso,
      );
      mockDb.balanceResolutionEvents.push({
        id: crypto.randomUUID(),
        resolutionId: r.id,
        action: "finalized",
        actorId: input.actorId,
        balanceBefore: ctx.balance,
        balanceAfter: after,
        details: {
          decided: { unpaidDays: input.unpaidDays, recoveryDays: input.recoveryDays },
          applied: { unpaidDays: applied.unpaid, recoveryDays: applied.recovery },
          reason: input.reason,
        },
        occurredAt: iso,
      });
      writeResolutionResponseMemory(r.id, "resolution.finalized", iso);
    });
    return { ok: true, resolution: toMemoryResolutionView(r, now) };
  },

  async expireDue({ limit }) {
    const now = new Date();
    const due = mockDb.balanceResolutions
      .filter((r) => r.status === "proposed" && !live(r, now))
      .sort((a, b) => a.respondBy.localeCompare(b.respondBy) || a.id.localeCompare(b.id))
      .slice(0, limit);
    const result: ExpireResult = { expired: [], skipped: 0 };
    for (const r of due) {
      // Re-checked synchronously right before writing (mirrors the SQL re-check under the lock).
      if (r.status !== "proposed" || live(r, now)) {
        result.skipped += 1;
        continue;
      }
      const ctx = context(r.userId, r.leaveTypeId)!;
      // D-1: no consent was given, so nothing is recovered — the deficit becomes Unpaid.
      const applied = clampAmounts(r.deficitAtProposal, 0, -ctx.balance);
      const iso = now.toISOString();
      try {
        atomically(() => {
          Object.assign(r, {
            status: "expired",
            unpaidDaysApplied: applied.unpaid,
            recoveryDaysApplied: 0,
            closedAt: iso,
          });
          const after = applyAmounts(r, applied, { start: null, months: null }, null, iso);
          event(
            r.id,
            "expired",
            null,
            ctx.balance,
            after,
            {
              proposed: { unpaidDays: r.unpaidDaysProposed, recoveryDays: r.recoveryDaysProposed },
              applied: { unpaidDays: applied.unpaid, recoveryDays: 0 },
            },
            iso,
          );
          writeResolutionResponseMemory(r.id, "resolution.expired", iso);
        });
        result.expired.push({ id: r.id, unpaid: applied.unpaid });
      } catch (err) {
        result.skipped += 1;
        logger.error(
          { err, event: "resolution.expiry_failed", resolutionId: r.id },
          "expiry failed",
        );
      }
    }
    return result;
  },
};
