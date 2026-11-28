import { type SqlClient, toNumber } from "@/lib/db/sql";
import { writeResolutionProposed, writeResolutionResponse } from "@/lib/notifications/postgres";
import { clampAmounts, recoverySchedule } from "@/lib/resolutions/apply";
import { logger } from "@/lib/logger";
import {
  checkSplit,
  type ExpireResult,
  type Failure,
  type ProposeInput,
  type ResolutionStore,
  type SplitInput,
} from "@/lib/resolutions/store";
import { selectResolutionView } from "@/lib/resolutions/views";

/**
 * Resolutions over Postgres (TASK-032/033, ADR-LeaveTrack-E006). Each method runs in ONE
 * transaction. Transitions lock the resolution row (FOR UPDATE), so two concurrent responses have
 * exactly one winner, and re-check the status and the deadline against now() in SQL. Balance
 * changes lock the balance row, are clamped to the CURRENT deficit, and write the balance and its
 * ledger row in ONE statement per component (conversion, recovery).
 */
type Context = { tracks: boolean; accrual: number; balance: number };

/** The leave type and accrual for (user, type), with the balance row LOCKED. Null = unknown. */
async function lockContext(
  tx: SqlClient,
  userId: string,
  leaveTypeId: string,
): Promise<Context | null> {
  const [info] = await tx.query<{ tracks_balance: boolean; accrual: unknown }>(
    `select t.tracks_balance,
            coalesce((select accrual_per_month from leave_policies
                       where user_id = u.id and leave_type_id = t.id), 0) accrual
       from users u, leave_types t where u.id = $1 and t.id = $2`,
    [userId, leaveTypeId],
  );
  if (!info) return null;
  const [bal] = await tx.query<{ balance: unknown }>(
    `select balance from leave_balances where user_id = $1 and leave_type_id = $2 for update`,
    [userId, leaveTypeId],
  );
  return {
    tracks: info.tracks_balance,
    accrual: toNumber(info.accrual),
    balance: bal ? toNumber(bal.balance) : 0,
  };
}

type Locked = {
  id: string;
  user_id: string;
  leave_type_id: string;
  status: string;
  live: boolean;
  proposal_number: number;
  deficit: unknown;
  unpaid: unknown;
  recovery: unknown;
  start: string | null;
  months: number | null;
};

async function lockResolution(tx: SqlClient, id: string): Promise<Locked | null> {
  const [row] = await tx.query<Locked>(
    `select id, user_id, leave_type_id, status, respond_by > now() live, proposal_number,
            deficit_at_proposal deficit, unpaid_days_proposed unpaid,
            recovery_days_proposed recovery, recovery_start_period::text start, recovery_months months
       from balance_resolutions where id = $1 for update`,
    [id],
  );
  return row ?? null;
}

/** Insert a proposal, its 'proposed' event and the employee's notification. */
async function insertProposal(
  tx: SqlClient,
  input: ProposeInput,
  deficit: number,
  balance: number,
  proposalNumber: number,
  supersedesId: string | null,
): Promise<string> {
  const [row] = await tx.query<{ id: string }>(
    `insert into balance_resolutions
       (user_id, leave_type_id, deficit_at_proposal, unpaid_days_proposed, recovery_days_proposed,
        recovery_start_period, recovery_months, respond_by, proposed_by, proposal_number, supersedes_id)
     select $1, $2, $3, $4, $5, $6::date, $7, now() + make_interval(days => (value)::int), $8, $9, $10
       from app_settings where key = 'resolution_response_days'
     returning id`,
    [
      input.userId,
      input.leaveTypeId,
      deficit,
      input.unpaidDays,
      input.recoveryDays,
      input.recoveryStartPeriod,
      input.recoveryMonths,
      input.actorId,
      proposalNumber,
      supersedesId,
    ],
  );
  await event(tx, row!.id, "proposed", input.actorId, balance, balance, {
    unpaidDays: input.unpaidDays,
    recoveryDays: input.recoveryDays,
    recoveryStartPeriod: input.recoveryStartPeriod,
    recoveryMonths: input.recoveryMonths,
  });
  await writeResolutionProposed(tx, row!.id);
  return row!.id;
}

async function event(
  tx: SqlClient,
  resolutionId: string,
  action: string,
  actorId: string | null,
  before: number | null,
  after: number | null,
  details: Record<string, unknown>,
  reason: string | null = null,
) {
  await tx.query(
    `insert into balance_resolution_events
       (resolution_id, action, actor_id, balance_before, balance_after, details, reason)
     values ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
    [resolutionId, action, actorId, before, after, JSON.stringify(details), reason],
  );
}

/**
 * Apply clamped amounts: credit the tracked balance (conversion, then recovery — each its own
 * balance + ledger statement, idempotent by source_key) and write the recovery schedule.
 */
async function applyAmounts(
  tx: SqlClient,
  r: { id: string; userId: string; leaveTypeId: string },
  applied: { unpaid: number; recovery: number },
  schedule: { start: string | null; months: number | null },
  balance: number,
  actorId: string | null, // null = the system (TASK-034 expiry)
): Promise<number> {
  let after = balance;
  for (const [source, delta] of [
    ["conversion", applied.unpaid],
    ["recovery", applied.recovery],
  ] as const) {
    if (delta <= 0) continue;
    const [row] = await tx.query<{ balance: unknown }>(
      `with upserted as (
         insert into leave_balances (user_id, leave_type_id, balance, updated_at)
         select $1, $2, $3::numeric, now() from leave_types t where t.id = $2 and t.tracks_balance
         on conflict (user_id, leave_type_id)
         do update set balance = leave_balances.balance + $3::numeric, updated_at = now()
         returning user_id, leave_type_id, balance
       )
       insert into balance_ledger (user_id, leave_type_id, delta, balance_after, source, source_key, actor_id)
       select user_id, leave_type_id, $3::numeric, balance, $4, 'resolution:' || $5::text || ':' || $4, $6::uuid
         from upserted
       returning balance_after balance`,
      [r.userId, r.leaveTypeId, delta, source, r.id, actorId],
    );
    after = toNumber(row!.balance);
  }
  if (applied.recovery > 0) {
    for (const s of recoverySchedule(applied.recovery, schedule.months!, schedule.start!)) {
      await tx.query(
        `insert into balance_recoveries (resolution_id, period, amount) values ($1, $2::date, $3)`,
        [r.id, s.period, s.amount],
      );
    }
  }
  return after;
}

const fail = (reason: Failure["reason"]): Failure => ({ ok: false, reason });

export function createPostgresResolutionStore(sql: SqlClient): ResolutionStore {
  return {
    proposeWithAudit(input) {
      return sql.transaction(async (tx) => {
        const ctx = await lockContext(tx, input.userId, input.leaveTypeId);
        if (!ctx) return fail("not_found");
        if (!ctx.tracks) return fail("untracked");
        if (ctx.balance >= 0) return fail("not_in_deficit");
        const deficit = -ctx.balance;
        const bad = checkSplit(input, deficit, ctx.accrual);
        if (bad) return bad;
        const id = await insertProposal(tx, input, deficit, ctx.balance, 1, null);
        return { ok: true, resolution: await selectResolutionView(tx, id) };
      });
    },

    acceptWithApply({ resolutionId, actorId }) {
      return sql.transaction(async (tx) => {
        const r = await lockResolution(tx, resolutionId);
        if (!r || r.user_id !== actorId) return fail("not_found");
        if (r.status !== "proposed") return fail("not_open");
        if (!r.live) return fail("expired");
        const ctx = (await lockContext(tx, r.user_id, r.leave_type_id))!;
        const applied = clampAmounts(toNumber(r.unpaid), toNumber(r.recovery), -ctx.balance);
        const status = applied.unpaid + applied.recovery > 0 ? "accepted" : "finalized";
        // The guarded transition (ADR §2): no row → someone else answered first; nothing is applied.
        const moved = await tx.query(
          `update balance_resolutions
              set status = $2, unpaid_days_applied = $3, recovery_days_applied = $4,
                  decided_by = $5, closed_at = now()
            where id = $1 and status = 'proposed' and respond_by > now()
           returning id`,
          [r.id, status, applied.unpaid, applied.recovery, actorId],
        );
        if (moved.length === 0) return fail("not_open");
        const after = await applyAmounts(
          tx,
          { id: r.id, userId: r.user_id, leaveTypeId: r.leave_type_id },
          applied,
          { start: r.start, months: r.months },
          ctx.balance,
          actorId,
        );
        await event(tx, r.id, "accepted", actorId, ctx.balance, after, {
          proposed: { unpaidDays: toNumber(r.unpaid), recoveryDays: toNumber(r.recovery) },
          applied: { unpaidDays: applied.unpaid, recoveryDays: applied.recovery },
        });
        await writeResolutionResponse(tx, r.id, "resolution.accepted");
        return { ok: true, resolution: await selectResolutionView(tx, r.id) };
      });
    },

    declineWithReason({ resolutionId, actorId, reason }) {
      return sql.transaction(async (tx) => {
        const r = await lockResolution(tx, resolutionId);
        if (!r || r.user_id !== actorId) return fail("not_found");
        if (r.status !== "proposed") return fail("not_open");
        if (!r.live) return fail("expired");
        const moved = await tx.query(
          `update balance_resolutions set status = 'declined', response_reason = $2
            where id = $1 and status = 'proposed' and respond_by > now()
           returning id`,
          [r.id, reason],
        );
        if (moved.length === 0) return fail("not_open");
        await event(tx, r.id, "declined", actorId, null, null, {}, reason);
        await writeResolutionResponse(tx, r.id, "resolution.declined");
        return { ok: true, resolution: await selectResolutionView(tx, r.id) };
      });
    },

    reproposeWithAudit(input) {
      return sql.transaction(async (tx) => {
        const r = await lockResolution(tx, input.resolutionId);
        if (!r) return fail("not_found");
        if (r.user_id === input.actorId) return fail("own_balance");
        if (r.status !== "declined") return fail("not_open");
        if (r.proposal_number >= 2) return fail("final_round");
        const ctx = (await lockContext(tx, r.user_id, r.leave_type_id))!;
        if (ctx.balance >= 0) return fail("not_in_deficit");
        const deficit = -ctx.balance;
        const bad = checkSplit(input, deficit, ctx.accrual);
        if (bad) return bad;
        // Supersede FIRST, so the one-open index admits the new proposal.
        await tx.query(
          `update balance_resolutions set status = 'superseded', closed_at = now()
            where id = $1 and status = 'declined'`,
          [r.id],
        );
        await event(tx, r.id, "superseded", input.actorId, null, null, {});
        const split: SplitInput = input;
        const id = await insertProposal(
          tx,
          { ...split, userId: r.user_id, leaveTypeId: r.leave_type_id, actorId: input.actorId },
          deficit,
          ctx.balance,
          2,
          r.id,
        );
        return { ok: true, resolution: await selectResolutionView(tx, id) };
      });
    },

    finalizeWithAudit(input) {
      return sql.transaction(async (tx) => {
        const r = await lockResolution(tx, input.resolutionId);
        if (!r) return fail("not_found");
        if (r.user_id === input.actorId) return fail("own_balance");
        if (r.status !== "declined") return fail("not_open");
        if (r.proposal_number < 2) return fail("repropose_first");
        const ctx = (await lockContext(tx, r.user_id, r.leave_type_id))!;
        // HR splits the deficit the proposal was about; the result is clamped to the current one.
        const bad = checkSplit(input, toNumber(r.deficit), ctx.accrual);
        if (bad) return bad;
        const applied = clampAmounts(input.unpaidDays, input.recoveryDays, -ctx.balance);
        await tx.query(
          `update balance_resolutions
              set status = 'finalized', unpaid_days_applied = $2, recovery_days_applied = $3,
                  decided_by = $4, final_reason = $5, closed_at = now()
            where id = $1 and status = 'declined'`,
          [r.id, applied.unpaid, applied.recovery, input.actorId, input.reason],
        );
        const after = await applyAmounts(
          tx,
          { id: r.id, userId: r.user_id, leaveTypeId: r.leave_type_id },
          applied,
          { start: input.recoveryStartPeriod, months: input.recoveryMonths },
          ctx.balance,
          input.actorId,
        );
        await event(
          tx,
          r.id,
          "finalized",
          input.actorId,
          ctx.balance,
          after,
          {
            decided: { unpaidDays: input.unpaidDays, recoveryDays: input.recoveryDays },
            applied: { unpaidDays: applied.unpaid, recoveryDays: applied.recovery },
            recoveryStartPeriod: input.recoveryStartPeriod,
            recoveryMonths: input.recoveryMonths,
          },
          input.reason,
        );
        await writeResolutionResponse(tx, r.id, "resolution.finalized");
        return { ok: true, resolution: await selectResolutionView(tx, r.id) };
      });
    },

    async expireDue({ limit }) {
      const due = await sql.query<{ id: string }>(
        `select id from balance_resolutions
          where status = 'proposed' and respond_by <= now()
          order by respond_by, id limit $1`,
        [limit],
      );
      const result: ExpireResult = { expired: [], skipped: 0 };
      for (const { id } of due) {
        try {
          const unpaid = await sql.transaction(async (tx) => {
            // SKIP LOCKED: a response holding the row wins this round; the next run retries.
            const [r] = await tx.query<Locked>(
              `select id, user_id, leave_type_id, status, respond_by > now() live, proposal_number,
                      deficit_at_proposal deficit, unpaid_days_proposed unpaid,
                      recovery_days_proposed recovery, recovery_start_period::text start,
                      recovery_months months
                 from balance_resolutions where id = $1 for update skip locked`,
              [id],
            );
            if (!r || r.status !== "proposed" || r.live) return null;
            const ctx = (await lockContext(tx, r.user_id, r.leave_type_id))!;
            // D-1: no consent was given, so nothing is recovered — the deficit becomes Unpaid.
            const applied = clampAmounts(toNumber(r.deficit), 0, -ctx.balance);
            const moved = await tx.query(
              `update balance_resolutions
                  set status = 'expired', unpaid_days_applied = $2, recovery_days_applied = 0,
                      closed_at = now()
                where id = $1 and status = 'proposed' and respond_by <= now()
               returning id`,
              [r.id, applied.unpaid],
            );
            if (moved.length === 0) return null;
            const after = await applyAmounts(
              tx,
              { id: r.id, userId: r.user_id, leaveTypeId: r.leave_type_id },
              applied,
              { start: null, months: null },
              ctx.balance,
              null,
            );
            await event(tx, r.id, "expired", null, ctx.balance, after, {
              proposed: { unpaidDays: toNumber(r.unpaid), recoveryDays: toNumber(r.recovery) },
              applied: { unpaidDays: applied.unpaid, recoveryDays: 0 },
            });
            await writeResolutionResponse(tx, r.id, "resolution.expired");
            return applied.unpaid;
          });
          if (unpaid === null) result.skipped += 1;
          else result.expired.push({ id, unpaid });
        } catch (err) {
          result.skipped += 1;
          logger.error(
            { err, event: "resolution.expiry_failed", resolutionId: id },
            "expiry failed",
          );
        }
      }
      return result;
    },
  };
}
