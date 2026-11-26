import { afterEach, describe, expect, it } from "vitest";
import { USER_IDS } from "@/lib/data/mock/fixtures";
import { mockRepository } from "@/lib/data/mock/repository";
import { mockDb, resetMockDb } from "@/lib/data/mock/store";
import { createPostgresRepository } from "@/lib/data/postgres-repository";
import {
  closeAfterEachTest,
  createTestDb,
  MIGRATION_FILES,
  MIGRATIONS,
  migratedDb,
  SEED,
} from "./helpers";

/**
 * TASK-024 — users.auth_user_id links a Supabase identity to a LeaveTrack user.
 * The migration refuses ambiguous (case-duplicate) emails instead of guessing, and
 * both stores find a user ONLY through the link.
 */
const FILE = "20261130000000_users_auth_link.sql";
const AUTH_ID = "30000000-0000-4000-8000-000000000101";
afterEach(() => resetMockDb());

const track = closeAfterEachTest(); // B30: each test's database closes after that test
const migration = MIGRATIONS[MIGRATION_FILES.indexOf(FILE)]!;

describe("migration", () => {
  it("pre-check: emails differing only in case → refuses and changes nothing", async () => {
    const db = track(await migratedDb({ upTo: FILE }));
    await db.exec(SEED);
    await db.query(
      `insert into users (name, email) select 'Twin', upper(email) from users limit 1`,
    );
    await expect(db.exec(migration)).rejects.toThrow(/TASK-024 pre-check failed: 1 email/);
    const cols = await db.query(
      `select 1 from information_schema.columns where table_name = 'users' and column_name = 'auth_user_id'`,
    );
    expect(cols.rows).toHaveLength(0);
  });

  it("clean data → nullable, unique auth_user_id (every existing user starts unlinked)", async () => {
    const db = track(await migratedDb({ upTo: FILE }));
    await db.exec(SEED);
    await db.exec(migration);
    const { rows } = await db.query<{ n: number }>(
      `select count(*)::int as n from users where auth_user_id is not null`,
    );
    expect(rows[0]!.n).toBe(0);
    await db.query(`update users set auth_user_id = $1 where id = $2`, [AUTH_ID, USER_IDS.ana]);
    await expect(
      db.query(`update users set auth_user_id = $1 where id = $2`, [AUTH_ID, USER_IDS.ben]),
    ).rejects.toMatchObject({ code: "23505", constraint: "users_auth_user_id_key" });
  });

  it("without an auth schema (plain Postgres) the foreign key is skipped, not an error", async () => {
    const db = track(await migratedDb());
    const { rows } = await db.query(
      `select 1 from information_schema.table_constraints where constraint_name = 'users_auth_user_id_fkey'`,
    );
    expect(rows).toHaveLength(0);
  });
});

describe("getUserByAuthUserId — Postgres and memory stay in parity", () => {
  it("Postgres: found only through the link", async () => {
    const { db, sql } = await createTestDb();
    track(db);
    const repo = createPostgresRepository(sql);
    expect(await repo.getUserByAuthUserId(AUTH_ID)).toBeNull();
    await db.query(`update users set auth_user_id = $1 where id = $2`, [AUTH_ID, USER_IDS.ana]);
    const pg = await repo.getUserByAuthUserId(AUTH_ID);

    mockDb.authLinks.push({ authUserId: AUTH_ID, userId: USER_IDS.ana });
    const mem = await mockRepository.getUserByAuthUserId(AUTH_ID);
    expect(pg).toEqual(mem);
    expect(pg).toMatchObject({ id: USER_IDS.ana });
  });

  it("memory: an unlinked identity → null", async () => {
    expect(await mockRepository.getUserByAuthUserId(AUTH_ID)).toBeNull();
  });
});
