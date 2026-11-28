import { readFileSync } from "node:fs";
import path from "node:path";
import type { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import { LEAVE_TYPE_IDS, USER_IDS } from "@/lib/data/mock/fixtures";
import { toAppError } from "@/lib/db/errors";
import { closeAfterEachTest, createTestDb } from "./helpers";

/**
 * TASK-031 (US-09, ADR-LeaveTrack-E006) — the resolution schema's integrity rules, proven on
 * PGlite with the real migrations. AC1 tracked types only; AC2 unpaid + recovery = deficit; AC3 one
 * open resolution per (user, type); AC4 events append-only; AC5 every new name mapped.
 */
const { sam, carla } = USER_IDS;
const { Vacation, Unpaid } = LEAVE_TYPE_IDS;
let db: PGlite;
const track = closeAfterEachTest(); // B30
beforeEach(async () => {
  ({ db } = await createTestDb());
  track(db);
});

const attempt = (text: string, params: unknown[] = []) =>
  db.query(text, params).then(
    () => null,
    (e: unknown) => e as { constraint?: string; code?: string },
  );
const propose = (
  o: { type?: string; deficit?: number; unpaid?: number; recovery?: number; status?: string } = {},
) =>
  attempt(
    `insert into balance_resolutions (user_id, leave_type_id, status, deficit_at_proposal,
       unpaid_days_proposed, recovery_days_proposed, recovery_start_period, recovery_months,
       respond_by, proposed_by)
     values ($1, $2, $3, $4, $5, $6, case when $6::numeric > 0 then date '2027-01-01' end,
             case when $6::numeric > 0 then 2 end, now() + interval '3 days', $7)`,
    [
      sam,
      o.type ?? Vacation,
      o.status ?? "proposed",
      o.deficit ?? 6,
      o.unpaid ?? 4,
      o.recovery ?? 2,
      carla,
    ],
  );

describe("TASK-031 — resolution schema", () => {
  it("AC1: a resolution for Unpaid (untracked) is rejected", async () => {
    expect(await propose({ type: Unpaid })).toMatchObject({
      constraint: "leave_type_must_track_balance",
    });
  });

  it("AC2: unpaid + recovery must equal the deficit", async () => {
    expect(await propose({ unpaid: 4, recovery: 1 })).toMatchObject({
      constraint: "balance_resolutions_amounts_match_deficit",
    });
    expect(await propose({ unpaid: 4, recovery: 2 })).toBeNull();
  });

  it("AC3: a second OPEN (proposed or declined) resolution for the same user and type is rejected", async () => {
    expect(await propose()).toBeNull();
    expect(await propose()).toMatchObject({ constraint: "balance_resolutions_one_open" });
    await db.query(`update balance_resolutions set status = 'declined'`);
    expect(await propose()).toMatchObject({ constraint: "balance_resolutions_one_open" });
    await db.query(`update balance_resolutions set status = 'finalized', closed_at = now()`);
    expect(await propose()).toBeNull(); // closed → a new one may be opened
  });

  it("AC4: resolution events can't be updated, deleted or truncated", async () => {
    await propose();
    await db.query(
      `insert into balance_resolution_events (resolution_id, action, actor_id)
       select id, 'proposed', $1 from balance_resolutions`,
      [carla],
    );
    for (const sql of [
      `update balance_resolution_events set reason = 'x'`,
      `delete from balance_resolution_events`,
      `truncate balance_resolution_events`,
    ]) {
      expect(await attempt(sql), sql).toMatchObject({
        constraint: "balance_resolution_events_append_only",
      });
    }
  });

  it("other rules: recovery schedule, one recovery per month, settings default and range", async () => {
    expect(
      await attempt(
        `insert into balance_resolutions (user_id, leave_type_id, deficit_at_proposal, unpaid_days_proposed,
           recovery_days_proposed, respond_by, proposed_by)
         values ($1, $2, 2, 0, 2, now(), $3)`,
        [sam, Vacation, carla],
      ),
    ).toMatchObject({ constraint: "balance_resolutions_recovery_schedule" });
    await propose();
    const recover = () =>
      attempt(`insert into balance_recoveries (resolution_id, period, amount)
               select id, date '2027-01-01', 1 from balance_resolutions`);
    expect(await recover()).toBeNull();
    expect(await recover()).toMatchObject({
      constraint: "balance_recoveries_resolution_period_key",
    });
    const [row] = (
      await db.query<{ v: number }>(
        `select (value)::int v from app_settings where key = 'resolution_response_days'`,
      )
    ).rows;
    expect(row?.v).toBe(3);
    expect(
      await attempt(`update app_settings set value = '15' where key = 'resolution_response_days'`),
    ).toMatchObject({ constraint: "app_settings_resolution_response_days_range" });
  });

  it("AC5: every constraint/trigger name the migration defines is mapped in toAppError", () => {
    const root = path.resolve(import.meta.dirname, "../..");
    const sql = readFileSync(
      path.join(root, "supabase/migrations/20261208000000_balance_resolutions.sql"),
      "utf8",
    );
    const names = [
      ...sql.matchAll(/constraint (\w+) (?:check|unique)/g),
      ...sql.matchAll(/create unique index (\w+)/g),
      ...sql.matchAll(/constraint = '(\w+)'/g),
    ].map((m) => m[1]!);
    expect(names.length).toBeGreaterThanOrEqual(13);
    for (const name of new Set(names)) {
      const code =
        name.endsWith("_key") || name.endsWith("_open")
          ? "23505"
          : name.endsWith("append_only")
            ? "23001"
            : "23514";
      expect(toAppError({ code, constraint: name }), name).not.toBeNull();
    }
  });
});
