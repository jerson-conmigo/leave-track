import type { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LEAVE_TYPE_IDS, USER_IDS } from "@/lib/data/mock/fixtures";
import { mockRepository } from "@/lib/data/mock/repository";
import { mockDb, resetMockDb } from "@/lib/data/mock/store";
import { createPostgresRepository } from "@/lib/data/postgres-repository";
import type { LeaveRepository } from "@/lib/data/repositories";
import type { Role } from "@/lib/data/types";
import { toAppError } from "@/lib/db/errors";
import type { SqlClient } from "@/lib/db/sql";
import { approverLabel, canDecide, hasApprover } from "@/lib/leave-requests/approver";
import { decideLeaveRequest } from "@/lib/leave-requests/decide";
import { memoryDecideStore, memorySubmitStore } from "@/lib/leave-requests/memory-store";
import type { Notifier } from "@/lib/leave-requests/notifier";
import {
  createPostgresDecideStore,
  createPostgresSubmitStore,
} from "@/lib/leave-requests/postgres-store";
import type { DecideStore, SubmitStore } from "@/lib/leave-requests/store";
import { submitLeaveRequest } from "@/lib/leave-requests/submit";
import { closeAfterEachTest, createTestDb } from "../db/helpers";
import { future } from "../support/dates";

/**
 * TASK-026 (US-15, BR-10, ADR-LeaveTrack-E005) — approval routing, run against BOTH stores with
 * one case table: Postgres (PGlite + the real migration: SQL can_decide / has_approver /
 * approver_label) and the in-memory store (lib/leave-requests/approver.ts). A second HR Admin
 * exists ONLY inside these tests (the shared seed and fixtures keep one).
 */
const HANA = { id: "00000000-0000-4000-8000-0000000000a1", name: "Hana Sato" }; // test-only HR Admin
const { ana, ben, maya, carla, jordan } = USER_IDS;
const ROLE: Record<string, Role> = {
  [carla]: "hr_admin",
  [HANA.id]: "hr_admin",
  [ben]: "manager",
  [maya]: "manager",
  [ana]: "employee",
  [jordan]: "employee",
};
const as = (userId: string) => ({ userId, role: ROLE[userId]! });

type Backend = {
  submitStore: SubmitStore;
  decideStore: DecideStore;
  repo: LeaveRepository;
  addSecondHrAdmin(): Promise<void>;
  setManager(userId: string, managerId: string | null): Promise<void>;
  counts(): Promise<{ requests: number; audit: number }>;
  status(requestId: string): Promise<string | undefined>;
};

let db: PGlite;
let sql: SqlClient;
const track = closeAfterEachTest(); // B30: each test's database closes after that test

async function postgresBackend(): Promise<Backend> {
  ({ db, sql } = await createTestDb());
  track(db);
  const one = async <T>(text: string, params: unknown[] = []) =>
    (await db.query<T>(text, params)).rows[0];
  return {
    submitStore: createPostgresSubmitStore(sql),
    decideStore: createPostgresDecideStore(sql),
    repo: createPostgresRepository(sql),
    async addSecondHrAdmin() {
      await db.query(
        `insert into users (id, name, email, role, manager_id)
         values ($1, $2, 'hana.sato@leavetrack.test', 'hr_admin', null)`,
        [HANA.id, HANA.name],
      );
    },
    async setManager(userId, managerId) {
      await db.query(`update users set manager_id = $1 where id = $2`, [managerId, userId]);
    },
    async counts() {
      return (await one<{ requests: number; audit: number }>(
        `select (select count(*)::int from leave_requests) requests,
                (select count(*)::int from audit_log) audit`,
      ))!;
    },
    async status(id) {
      return (
        await one<{ s: string }>(`select status::text s from leave_requests where id = $1`, [id])
      )?.s;
    },
  };
}

async function memoryBackend(): Promise<Backend> {
  resetMockDb();
  return {
    submitStore: memorySubmitStore,
    decideStore: memoryDecideStore,
    repo: mockRepository,
    async addSecondHrAdmin() {
      mockDb.users.push({
        id: HANA.id,
        name: HANA.name,
        email: "hana.sato@leavetrack.test",
        role: "hr_admin",
        managerId: null,
      });
    },
    async setManager(userId, managerId) {
      mockDb.users.find((u) => u.id === userId)!.managerId = managerId;
    },
    async counts() {
      return { requests: mockDb.leaveRequests.length, audit: mockDb.auditLog.length };
    },
    async status(id) {
      return mockDb.leaveRequests.find((r) => r.id === id)?.status;
    },
  };
}

let notifier: Notifier & {
  leaveRequestSubmitted: ReturnType<typeof vi.fn>;
  leaveRequestDecided: ReturnType<typeof vi.fn>;
};
beforeEach(() => {
  notifier = {
    leaveRequestSubmitted: vi.fn().mockResolvedValue(undefined),
    leaveRequestDecided: vi.fn().mockResolvedValue(undefined),
  };
});
afterEach(() => {
  resetMockDb();
  vi.restoreAllMocks();
});

const input = (n = 1) => ({
  leaveTypeId: LEAVE_TYPE_IDS.Vacation,
  startDate: future(`2027-0${n}-10`),
  endDate: future(`2027-0${n}-11`),
  reason: "Family visit",
});

describe.each<[string, () => Promise<Backend>]>([
  ["postgres", postgresBackend],
  ["memory", memoryBackend],
])("%s store — approval routing", (_name, make) => {
  let b: Backend;
  beforeEach(async () => {
    b = await make();
  });
  const submit = (userId: string, n = 1) =>
    submitLeaveRequest({ userId }, input(n), { store: b.submitStore, notifier });
  const decide = (actor: string, id: string, decision: "approve" | "reject" = "approve") =>
    decideLeaveRequest(
      as(actor),
      id,
      decision === "approve" ? { decision } : { decision, reason: "Busy week" },
      {
        store: b.decideStore,
        notifier,
      },
    );
  const queueIds = async (viewer: string) =>
    (await b.repo.listTeamRequests(viewer, { status: "pending" })).map((r) => r.id);

  it("AC1: a manager's request goes to THEIR HR Admin's queue only — not another manager's, not their own", async () => {
    const { request } = await submit(ben);
    expect(request.awaiting).toBe("Carla Diaz");
    expect(await queueIds(carla)).toContain(request.id);
    expect(await queueIds(maya)).not.toContain(request.id);
    expect(await queueIds(ben)).not.toContain(request.id);
    expect(notifier.leaveRequestSubmitted).toHaveBeenCalledWith(
      expect.objectContaining({
        approver: expect.objectContaining({ kind: "manager", id: carla }),
      }),
    );
  });

  it("AC1: an HR Admin's queue never contains employees' requests", async () => {
    const { request } = await submit(ana);
    expect(await queueIds(carla)).not.toContain(request.id);
    await expect(decide(carla, request.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await b.status(request.id)).toBe("pending");
  });

  it("AC1: the HR Admin decides the manager's request; another manager → 403; the manager themselves → 403", async () => {
    const { request } = await submit(ben);
    await expect(decide(maya, request.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(decide(ben, request.id)).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "You can't decide your own leave request.",
    });
    const { request: decided } = await decide(carla, request.id);
    expect(decided).toMatchObject({
      status: "approved",
      decidedByName: "Carla Diaz",
      awaiting: null,
    });
  });

  it("AC3: the only HR Admin has no approver → 409 and NOTHING is created (no request, no audit row)", async () => {
    const before = await b.counts();
    await expect(submit(carla)).rejects.toMatchObject({ code: "CONFLICT", status: 409 });
    expect(await b.counts()).toEqual(before);
    expect(notifier.leaveRequestSubmitted).not.toHaveBeenCalled();
  });

  it("AC3: a store-level insert for a requester without an approver writes nothing (race guard)", async () => {
    const before = await b.counts();
    const row = await b.submitStore.insertRequestWithAudit({ userId: carla, ...input() });
    expect(row).toBeNull();
    expect(await b.counts()).toEqual(before);
  });

  it("AC3: an employee with no manager → 409, nothing created", async () => {
    await b.setManager(ana, null);
    const before = await b.counts();
    await expect(submit(ana)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(await b.counts()).toEqual(before);
  });

  it("AC2: with a second HR Admin, an HR Admin's request awaits 'HR' and is decided by the OTHER one", async () => {
    await b.addSecondHrAdmin();
    const { request } = await submit(carla);
    expect(request.awaiting).toBe("HR");
    expect(notifier.leaveRequestSubmitted).toHaveBeenCalledWith(
      expect.objectContaining({ approver: { kind: "hr" } }),
    );
    expect(await queueIds(HANA.id)).toContain(request.id);
    expect(await queueIds(carla)).not.toContain(request.id); // never your own
    expect(await queueIds(ben)).not.toContain(request.id);

    await expect(decide(carla, request.id)).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "You can't decide your own leave request.",
    });
    await expect(decide(ben, request.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await b.status(request.id)).toBe("pending");

    const { request: decided } = await decide(HANA.id, request.id, "reject");
    expect(decided).toMatchObject({ status: "rejected", decidedByName: HANA.name });
  });

  it("AC2: each of two HR Admins decides the other's request — and Hana's queue also holds no employees", async () => {
    await b.addSecondHrAdmin();
    const { request: hanas } = await submit(HANA.id);
    expect(await queueIds(carla)).toContain(hanas.id);
    await decide(carla, hanas.id);
    expect(await b.status(hanas.id)).toBe("approved");
    const { request: anas } = await submit(ana, 2);
    expect(await queueIds(HANA.id)).not.toContain(anas.id);
  });

  it("AC4: 'Awaiting' follows the approver: manager's name, HR, and null once decided", async () => {
    const { request } = await submit(ana);
    expect(request.awaiting).toBe("Ben Ortiz");
    const mine = await b.repo.listMyRequests(ana);
    expect(mine.find((r) => r.id === request.id)?.awaiting).toBe("Ben Ortiz");
    const queued = (await b.repo.listTeamRequests(ben, { status: "pending" })).find(
      (r) => r.id === request.id,
    );
    expect(queued?.awaiting).toBe("Ben Ortiz");
    await decide(ben, request.id);
    const after = await b.repo.listMyRequests(ana);
    expect(after.find((r) => r.id === request.id)?.awaiting).toBeNull();
    const history = await b.repo.getEmployeeAuditHistory(ana);
    expect(history?.requests.find((r) => r.id === request.id)?.awaiting).toBeNull();
  });

  it("AC5: moving an employee to another manager moves their pending request — queue, label and who may decide", async () => {
    const { request } = await submit(ana);
    expect(await queueIds(ben)).toContain(request.id);

    await b.setManager(ana, maya);
    expect(await queueIds(ben)).not.toContain(request.id);
    expect(await queueIds(maya)).toContain(request.id);
    expect((await b.repo.listMyRequests(ana)).find((r) => r.id === request.id)?.awaiting).toBe(
      "Maya Chen",
    );
    await expect(decide(ben, request.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await decide(maya, request.id);
    expect(await b.status(request.id)).toBe("approved");
  });

  it("not-eligible wins over already-decided: another team's decided request is 403, never 409", async () => {
    const { request } = await submit(ana);
    await decide(ben, request.id);
    await expect(decide(maya, request.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(decide(ben, request.id)).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

describe("parity: SQL functions = approver.ts, for every pair of people", () => {
  it("can_decide, has_approver and approver_label agree with the in-memory rule (with and without a 2nd HR Admin)", async () => {
    const pg = await postgresBackend();
    for (const withHana of [false, true]) {
      resetMockDb();
      const mem = await memoryBackend();
      if (withHana) {
        await pg.addSecondHrAdmin();
        await mem.addSecondHrAdmin();
      }
      const users = mockDb.users;
      const ids = users.map((u) => u.id);
      const pairs = (
        await db.query<{ actor: string; requester: string; ok: boolean }>(
          `select a.id actor, r.id requester, public.can_decide(a.id, r.id) ok
             from users a cross join users r`,
        )
      ).rows;
      expect(pairs).toHaveLength(ids.length * ids.length);
      for (const p of pairs) {
        expect(p.ok, `can_decide(${p.actor}, ${p.requester}) withHana=${withHana}`).toBe(
          canDecide(users, p.actor, p.requester),
        );
      }
      const people = (
        await db.query<{ id: string; has: boolean; label: string | null }>(
          `select id, public.has_approver(id) has, public.approver_label(id) label from users`,
        )
      ).rows;
      for (const p of people) {
        expect(p.has, `has_approver(${p.id})`).toBe(hasApprover(users, p.id));
        expect(p.label, `approver_label(${p.id})`).toBe(approverLabel(users, p.id));
      }
    }
  });
});

describe("postgres only — database backstops", () => {
  it("the CHECK constraint refuses a self-decision written directly, and it reaches clients as 403", async () => {
    await postgresBackend();
    const err = await db
      .query(
        `update leave_requests set status = 'approved', decided_by = user_id, decided_at = now()
          where id = '20000000-0000-4000-8000-000000000001'`,
      )
      .then(
        () => null,
        (e: unknown) => e,
      );
    expect(err).toMatchObject({ code: "23514", constraint: "leave_requests_no_self_decision" });
    expect(toAppError(err)).toMatchObject({
      code: "FORBIDDEN",
      message: "You can't decide your own leave request.",
    });
  });

  it("two HR Admins deciding the same request at once: exactly one decision and one decision audit row", async () => {
    const b = await postgresBackend();
    await b.addSecondHrAdmin();
    await db.query(
      `insert into users (id, name, email, role, manager_id)
       values ('00000000-0000-4000-8000-0000000000a2', 'Ivo Test', 'ivo.test@leavetrack.test', 'hr_admin', null)`,
    );
    ROLE["00000000-0000-4000-8000-0000000000a2"] = "hr_admin";
    const { request } = await submitLeaveRequest({ userId: carla }, input(), {
      store: b.submitStore,
      notifier,
    });
    const results = await Promise.allSettled(
      [HANA.id, "00000000-0000-4000-8000-0000000000a2"].map((actor) =>
        decideLeaveRequest(
          as(actor),
          request.id,
          { decision: "approve" },
          {
            store: b.decideStore,
            notifier,
          },
        ),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    const [{ n }] = (
      await db.query<{ n: number }>(
        `select count(*)::int n from audit_log where leave_request_id = $1 and action <> 'submitted'`,
        [request.id],
      )
    ).rows as [{ n: number }];
    expect(n).toBe(1);
  });

  it("the routing functions can't be called by PUBLIC (server-only; no REST probing on Supabase)", async () => {
    await postgresBackend();
    const rows = (
      await db.query<{ fn: string; public_exec: boolean }>(
        `select p.proname fn, has_function_privilege('public', p.oid, 'execute') public_exec
           from pg_proc p
          where p.pronamespace = 'public'::regnamespace
            and p.proname in ('can_decide', 'has_approver', 'approver_label')
          order by 1`,
      )
    ).rows;
    expect(rows).toEqual([
      { fn: "approver_label", public_exec: false },
      { fn: "can_decide", public_exec: false },
      { fn: "has_approver", public_exec: false },
    ]);
  });
});
