import { afterAll, describe, expect, it, vi } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { USER_IDS } from "@/lib/data/mock/fixtures";
import { mockRepository } from "@/lib/data/mock/repository";
import { createPostgresRepository } from "@/lib/data/postgres-repository";
import type { LeaveRepository } from "@/lib/data/repositories";
import { decideLeaveRequest } from "@/lib/leave-requests/decide";
import { memoryDecideStore } from "@/lib/leave-requests/memory-store";
import { createPostgresDecideStore } from "@/lib/leave-requests/postgres-store";
import type { DecideStore } from "@/lib/leave-requests/store";
import { createTestDb } from "../db/helpers";

/**
 * TASK-014 — the in-memory decide store (local dev) must behave exactly like the
 * Postgres store. Runs one scripted sequence on both and compares outcomes and
 * every resulting read.
 */
const req = (n: number) => `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const BEN = { userId: USER_IDS.ben, role: "manager" as const };
const MAYA = { userId: USER_IDS.maya, role: "manager" as const };
const notifier = {
  leaveRequestSubmitted: vi.fn().mockResolvedValue(undefined),
  leaveRequestDecided: vi.fn().mockResolvedValue(undefined),
};

type ManagerSession = { userId: string; role: "manager" };
const SCRIPT: [string, ManagerSession, string, unknown][] = [
  ["Ben approves Jordan's Vacation", BEN, req(4), { decision: "approve" }],
  ["Ben approves it again (409)", BEN, req(4), { decision: "approve" }],
  ["Maya acts on Jordan's Unpaid (403)", MAYA, req(5), { decision: "approve" }],
  ["Ben rejects Ana's Vacation", BEN, req(1), { decision: "reject", reason: "Release freeze" }],
  ["Maya approves Sam over balance", MAYA, req(7), { decision: "approve", reason: "OK by HR" }],
  ["Ben decides an unknown id (404)", BEN, req(999), { decision: "approve" }],
];

async function run(store: DecideStore) {
  const outcomes = [];
  for (const [, session, id, body] of SCRIPT) {
    try {
      const r = await decideLeaveRequest(session, id, body, { store, notifier });
      outcomes.push({ ok: true, status: r.request.status, warnings: r.warnings });
    } catch (e) {
      outcomes.push({ ok: false, code: (e as { code?: string }).code });
    }
  }
  return outcomes;
}

/** Everything a user can see after the script; decision timestamps reduced to presence. */
async function reads(repo: LeaveRepository) {
  const strip = <T extends { decidedAt: string | null }>(r: T) => ({
    ...r,
    decidedAt: r.decidedAt !== null,
  });
  const out: Record<string, unknown> = {};
  for (const id of [USER_IDS.ana, USER_IDS.jordan, USER_IDS.sam]) {
    out[`balances:${id}`] = await repo.getBalances(id);
    out[`mine:${id}`] = (await repo.listMyRequests(id)).map(strip);
  }
  for (const m of [USER_IDS.ben, USER_IDS.maya])
    out[`team:${m}`] = (await repo.listTeamRequests(m)).map(strip);
  return out;
}

let db: PGlite | undefined;
afterAll(async () => db?.close());

describe("memory decide store", () => {
  it("parity with Postgres: same outcomes, warnings and resulting reads for a scripted sequence", async () => {
    const t = await createTestDb();
    db = t.db;
    const pgOutcomes = await run(createPostgresDecideStore(t.sql));
    const memOutcomes = await run(memoryDecideStore);

    expect(memOutcomes).toEqual(pgOutcomes);
    expect(pgOutcomes.map((o) => (o.ok ? o.status : o.code))).toEqual([
      "approved",
      "CONFLICT",
      "FORBIDDEN",
      "rejected",
      "approved",
      "NOT_FOUND",
    ]);
    expect(await reads(mockRepository)).toEqual(await reads(createPostgresRepository(t.sql)));
  });

  it("mirrors the DB backstop: refuses a second decision audit row", async () => {
    const { mockDb } = await import("@/lib/data/mock/store");
    mockDb.auditLog.push({
      id: "dup",
      leaveRequestId: req(9),
      actorId: USER_IDS.maya,
      action: "approved",
      occurredAt: new Date().toISOString(),
    });
    await expect(
      decideLeaveRequest(
        MAYA,
        req(9),
        { decision: "approve" },
        { store: memoryDecideStore, notifier },
      ),
    ).rejects.toThrow(/audit_log_one_decision_per_request/);
    expect(mockDb.leaveRequests.find((r) => r.id === req(9))?.status).toBe("pending");
  });
});
