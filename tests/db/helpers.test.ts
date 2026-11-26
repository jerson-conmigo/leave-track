import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import type { SqlClient } from "@/lib/db/sql";
import { createTestDb } from "./helpers";

/**
 * The PGlite test adapter must behave like the production postgres.js adapter
 * (nested `transaction` = SAVEPOINT), or tests could pass while production differs.
 */
let db: PGlite;
let sql: SqlClient;

beforeAll(async () => {
  ({ db, sql } = await createTestDb());
  await db.exec(`create table probe (v text not null)`);
});
afterAll(async () => db.close());

const values = async () =>
  (await db.query<{ v: string }>(`select v from probe order by v`)).rows.map((r) => r.v);

describe("pgliteClient transactions", () => {
  it("rolls back everything when the outer transaction throws", async () => {
    await db.exec(`truncate probe`);
    await expect(
      sql.transaction(async (tx) => {
        await tx.query(`insert into probe values ('outer')`);
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(await values()).toEqual([]);
  });

  it("nested failure caught inside the outer transaction rolls back ONLY the inner work", async () => {
    await db.exec(`truncate probe`);
    await sql.transaction(async (tx) => {
      await tx.query(`insert into probe values ('a-outer')`);
      await expect(
        tx.transaction(async (inner) => {
          await inner.query(`insert into probe values ('b-inner')`);
          throw new Error("inner boom");
        }),
      ).rejects.toThrow("inner boom");
      await tx.query(`insert into probe values ('c-after')`);
    });
    expect(await values()).toEqual(["a-outer", "c-after"]);
  });

  it("a successful nested transaction is committed with the outer one", async () => {
    await db.exec(`truncate probe`);
    await sql.transaction(async (tx) => {
      await tx.transaction(async (inner) => inner.query(`insert into probe values ('nested-ok')`));
    });
    expect(await values()).toEqual(["nested-ok"]);
  });
});
