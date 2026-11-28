import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";
import { closeAfterEachTest, closeAll, createTestDb, migratedDb } from "./helpers";

/**
 * B30 — test databases are closed as soon as their test ends, pass or fail, and a
 * failed setup never leaks a half-built database. Keeping every per-test PGlite open
 * until afterAll held up to ~20 instances per file (peak memory ~3 GB per file).
 * Real PGlite throughout; the structural part keeps the pattern from coming back.
 */

describe("closeAfterEachTest — real PGlite", () => {
  const track = closeAfterEachTest();
  let fromPassingTest: PGlite | undefined;
  let fromFailingTest: PGlite | undefined;
  let extra: PGlite[] | undefined;

  it("a tracked database is open during its test", async () => {
    fromPassingTest = track((await createTestDb()).db);
    extra = [
      track(await migratedDb({ migrations: [] })),
      track(await migratedDb({ migrations: [] })),
    ];
    expect(fromPassingTest.closed).toBe(false);
    expect(extra.map((d) => d.closed)).toEqual([false, false]);
  });

  it("…and closed before the next test starts (every tracked one)", () => {
    expect(fromPassingTest?.closed).toBe(true);
    expect(extra?.map((d) => d.closed)).toEqual([true, true]);
  });

  it.fails("a test that FAILS after opening a database…", async () => {
    fromFailingTest = track(await migratedDb({ migrations: [] }));
    throw new Error("simulated test failure");
  });

  it("…still has its database closed afterwards", () => {
    expect(fromFailingTest).toBeDefined();
    expect(fromFailingTest?.closed).toBe(true);
  });
});

describe("closeAll — one failing close never leaves the others open", () => {
  const fake = (close: () => Promise<void>) => ({ close }) as unknown as PGlite;

  it("closes every database, waits for all of them, then reports every failure", async () => {
    let slowFinished = false;
    const dbs = [
      fake(async () => {}),
      fake(async () => {
        throw new Error("close failed");
      }),
      fake(
        () =>
          new Promise<void>((resolve) =>
            setTimeout(() => {
              slowFinished = true;
              resolve();
            }, 20),
          ),
      ),
    ];
    const error = await closeAll(dbs).then(
      () => null,
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(AggregateError);
    expect((error as AggregateError).errors).toHaveLength(1);
    expect((error as AggregateError).message).toMatch(/1 test database\(s\) failed to close/);
    expect(slowFinished).toBe(true); // did not give up at the first rejection
  });

  it("resolves quietly when every close succeeds", async () => {
    await expect(closeAll([fake(async () => {}), fake(async () => {})])).resolves.toBeUndefined();
  });
});

describe("setup failure never leaks a half-built database", () => {
  it("migratedDb: a failing migration closes the database before rethrowing", async () => {
    let created: PGlite | undefined;
    await expect(
      migratedDb({
        migrations: ["create table t (id int)", "this is not sql"],
        create: () => (created = new PGlite()),
      }),
    ).rejects.toThrow(/syntax error/);
    expect(created?.closed).toBe(true);
  });

  it("createTestDb: a failing seed closes the database before rethrowing", async () => {
    let created: PGlite | undefined;
    await expect(
      createTestDb({
        migrations: ["create table t (id int)"],
        seed: "insert into no_such_table values (1)",
        create: () => (created = new PGlite()),
      }),
    ).rejects.toThrow(/no_such_table/);
    expect(created?.closed).toBe(true);
  });

  it("a successful setup returns an OPEN database (the close is only on failure)", async () => {
    let created: PGlite | undefined;
    const db = await migratedDb({
      migrations: ["create table t (id int)"],
      create: () => (created = new PGlite()),
    });
    expect(db).toBe(created);
    expect(db.closed).toBe(false);
    await db.close();
  });
});

describe("structure: every test file that creates databases is reviewed and closes them", () => {
  const root = path.resolve(import.meta.dirname, "../..");
  const testFiles = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = path.join(dir, f);
      return statSync(p).isDirectory() ? testFiles(p) : f.endsWith(".test.ts") ? [p] : [];
    });
  const CREATES = /\b(createTestDb|migratedDb)\(|new PGlite\(/;
  const files = Object.fromEntries(
    testFiles(path.join(root, "tests"))
      .map((f) => [path.relative(root, f), readFileSync(f, "utf8")] as const)
      .filter(([, src]) => CREATES.test(src)),
  );

  // A new database per test → must use closeAfterEachTest (B30).
  const PER_TEST = [
    "tests/accrual/concurrency.test.ts",
    "tests/accrual/run.test.ts",
    "tests/data/audit.test.ts",
    "tests/data/balance-ledger.test.ts",
    "tests/data/postgres-repository.test.ts",
    "tests/db/pglite-lifecycle.test.ts",
    "tests/db/resolutions.test.ts",
    "tests/db/users-auth-link.test.ts",
    "tests/leave-requests/approval-routing.test.ts",
    "tests/leave-requests/cancel.test.ts",
    "tests/leave-requests/decide.test.ts",
    "tests/leave-requests/request-integrity.test.ts",
    "tests/leave-requests/submit.test.ts",
    "tests/leave-types/independence.test.ts",
    "tests/notifications/notifications.test.ts",
    "tests/resolutions/propose.test.ts",
    "tests/resolutions/expire.test.ts",
    "tests/resolutions/respond.test.ts",
  ];
  // One database for the whole file, created in beforeAll and closed in afterAll.
  const PER_FILE = [
    "tests/db/errors.test.ts",
    "tests/db/helpers.test.ts",
    "tests/db/schema.test.ts",
    "tests/rate-limit/store.test.ts", // TASK-025: unique keys per test instead of clearing
  ];
  // One database created inside a single test and closed in afterAll (at most one held).
  const SINGLE_IN_TEST = [
    "tests/accrual/memory-parity.test.ts",
    "tests/leave-requests/decide-memory.test.ts",
  ];

  it("every database-creating test file is classified (a new one fails here until reviewed)", () => {
    expect(Object.keys(files).sort()).toEqual([...PER_TEST, ...PER_FILE, ...SINGLE_IN_TEST].sort());
  });

  it.each(PER_TEST)("%s closes each test's databases with closeAfterEachTest", (file) => {
    const src = files[file]!;
    expect(src).toMatch(/closeAfterEachTest\(\)/);
    expect(src).not.toMatch(/afterAll\([^)]*\)?[\s\S]{0,80}\.close\(/);
  });

  // The lifecycle test itself also opens databases on purpose to prove setup failures close
  // them, so the one-track-per-creation rule applies to the other per-test files.
  it.each(PER_TEST.filter((f) => !f.endsWith("pglite-lifecycle.test.ts")))(
    "%s tracks every database it creates (no creation without track())",
    (file) => {
      const src = files[file]!;
      const creations = src.match(/\b(createTestDb|migratedDb)\(|new PGlite\(/g) ?? [];
      const tracked = src.match(/\btrack\(/g) ?? [];
      expect(tracked.length).toBeGreaterThanOrEqual(creations.length);
    },
  );

  it("no test file accumulates databases until afterAll", () => {
    for (const [file, src] of Object.entries(files)) {
      expect(src, file).not.toMatch(/PGlite\[\]\s*=\s*\[\]/);
      expect(src, file).not.toMatch(/\bdbs\.push\(/);
    }
  });

  it.each(PER_FILE)("%s creates its database only in beforeAll", (file) => {
    const src = files[file]!;
    expect(src).toMatch(
      /beforeAll\(async \(\) => \{\s*(\(\{[^}]*\}\s*=\s*)?(db\s*=\s*)?await (createTestDb|migratedDb)\(/,
    );
    expect(src).not.toMatch(/beforeEach\(/);
  });
});
