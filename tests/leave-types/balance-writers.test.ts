import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * TASK-018 — registry of every code path that WRITES leave_balances / leave_policies.
 * A new writer fails this test until it is reviewed for US-08 (keyed by its own
 * leave_type_id, gated on tracks_balance) and added here. The detector is itself
 * tested against a corpus of write patterns (and reads that must NOT match).
 */
type Table = "leave_balances" | "leave_policies" | "balance_ledger";
const MOCK_FIELD: Record<Table, string> = {
  leave_balances: "leaveBalances",
  leave_policies: "leavePolicies",
  balance_ledger: "balanceLedger", // TASK-029
};

/** Strip comments, collapse whitespace, lowercase — so formatting can't hide a write. */
export function normalise(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/--.*$/gm, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/** Does this source WRITE the table (SQL in any form, query builder, or the mock store)? */
export function writesTable(src: string, table: Table): boolean {
  const s = normalise(src);
  const t = `(?:only\\s+)?(?:"?public"?\\s*\\.\\s*)?"?${table}"?\\b`;
  const sql = new RegExp(
    `\\b(?:insert\\s+into|update|merge\\s+into|delete\\s+from|truncate(?:\\s+table)?|copy)\\s+${t}`,
  );
  const builder = new RegExp(
    `\\.from\\(\\s*["'\`]${table}["'\`]\\s*\\)\\s*\\.\\s*(?:insert|update|upsert|delete)\\b`,
  );
  const field = MOCK_FIELD[table].toLowerCase();
  const mock = new RegExp(
    `\\b${field}\\s*\\.\\s*(?:push|splice|unshift|pop|shift)\\s*\\(|\\b${field}\\s*\\.\\s*length\\s*=(?!=)|\\b${field}\\s*\\[[^\\]]*\\]\\s*=(?!=)`,
  );
  // a row object obtained from the mock collection and then mutated (bal.balance = …)
  const mockRowMutation =
    table === "leave_balances"
      ? /\.balance\s*(?:[-+]?=)(?!=)/
      : table === "leave_policies"
        ? /\.accrualpermonth\s*(?:[-+]?=)(?!=)/
        : /\.(?:delta|balanceafter|sourcekey)\s*(?:[-+]?=)(?!=)/;
  // TASK-029: the memory ledger is appended through one helper (lib/data/mock/store.ts).
  const ledgerHelper = table === "balance_ledger" && /\bappendledger\s*\(/.test(s);
  const touchesMock = new RegExp(`\\b${field}\\b`).test(s);
  const dynamic =
    /\b(?:insert\s+into|update|delete\s+from)\s+["'`]?\s*\$\{/.test(s) &&
    s.includes(table.slice(0, 6));
  // Computed-key alias of the mock store (`const t = mockDb[key]; t.splice(…)`): the
  // table can't be known statically, so it counts as a write to EVERY table.
  const computedAlias =
    /\bmockdb\b(?:\s+as\s+[^)]+\))?\s*\[[^\]]+\]/.test(s) &&
    /\.\s*(?:push|splice|unshift|pop|shift)\s*\(|\]\s*=(?!=)/.test(s);
  return (
    sql.test(s) ||
    builder.test(s) ||
    mock.test(s) ||
    (touchesMock && mockRowMutation.test(s)) ||
    dynamic ||
    computedAlias ||
    ledgerHelper
  );
}

const root = path.resolve(import.meta.dirname, "../..");
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
  });
const appFiles = ["lib", "app", "components"].flatMap((d) => files(path.join(root, d)));
const writersOf = (table: Table) =>
  appFiles
    .filter((f) => writesTable(readFileSync(f, "utf8"), table))
    .map((f) => path.relative(root, f))
    .sort();

describe("balance-writer detector (corpus)", () => {
  const positives: [string, string][] = [
    ["plain insert", "await tx.query(`insert into leave_balances (user_id) values ($1)`)"],
    ["UPPER + quoted + schema", 'sql`UPDATE "public"."leave_balances" SET balance = 1`'],
    ["update only", "update only leave_balances set balance = 0"],
    ["multiline", "INSERT\n  INTO\n    leave_balances\n (a) values (1)"],
    [
      "CTE write",
      "with x as (insert into public.leave_balances (a) values (1) returning *) select * from x",
    ],
    [
      "merge",
      "merge into leave_balances b using src s on b.id = s.id when matched then update set balance = 1",
    ],
    ["delete", "delete from leave_balances where id = $1"],
    ["truncate", "truncate table leave_balances"],
    ["copy", "copy leave_balances from stdin"],
    ["query builder", 'supabase.from("leave_balances").update({ balance: 1 })'],
    ["query builder upsert", "db.from('leave_balances')\n  .upsert(row)"],
    ["mock push", "mockDb.leaveBalances.push(bal)"],
    ["mock splice", "mockDb.leaveBalances.splice(0, 1)"],
    ["mock index assign", "mockDb.leaveBalances[0] = x"],
    ["mock row mutation", "const bal = mockDb.leaveBalances.find(f); bal.balance = 3;"],
    ["mock row +=", "const b = mockDb.leaveBalances[0]; b.balance += 1"],
    ["dynamic table", "await sql.unsafe(`update ${'leave_' + t} set balance = 1`)"],
    [
      "computed-key alias",
      "const target = mockDb[key] as unknown[]; target.splice(0, target.length)",
    ],
    ["computed-key assign", "(mockDb as Record<string, unknown>)[key] = fresh[key];"],
  ];
  const negatives: [string, string][] = [
    ["select", "select balance from leave_balances where user_id = $1"],
    ["join read", "select * from users u join leave_balances b on b.user_id = u.id"],
    ["commented write", "// insert into leave_balances values (1)\nselect 1"],
    ["block-commented write", "/* update leave_balances set balance = 1 */ select 1"],
    ["sql comment", "select 1 -- delete from leave_balances"],
    ["mock read", "mockDb.leaveBalances.find((b) => b.userId === id)"],
    ["mock filter", "const xs = mockDb.leaveBalances.filter(f).length === 0"],
    ["other table", "insert into leave_requests (user_id) values ($1)"],
    ["string mention", 'const label = "leave_balances table"'],
    ["computed-key read", "const rows = mockDb[key]; return rows.length;"],
  ];
  it.each(positives)("detects a write: %s", (_l, src) => {
    expect(writesTable(src, "leave_balances")).toBe(true);
  });
  it.each(negatives)("ignores a non-write: %s", (_l, src) => {
    expect(writesTable(src, "leave_balances")).toBe(false);
  });
});

describe("registry — the reviewed writers, and nothing else", () => {
  it("leave_balances is written only by the reviewed decide + accrual stores (and the mock reset helper)", () => {
    expect(writersOf("leave_balances")).toEqual([
      "lib/accrual/memory-store.ts", // monthly accrual (memory) — tracked policies only
      "lib/accrual/postgres-store.ts", // monthly accrual — `where t.tracks_balance`
      "lib/data/mock/store.ts", // resetMockDb (test isolation only)
      "lib/leave-requests/memory-store.ts", // decide (memory) — `leaveType.tracksBalance`
      "lib/leave-requests/postgres-store.ts", // decide — `row.tracks_balance`
    ]);
  });

  it("leave_policies has no writers in app code (seed / tests / the mock reset only)", () => {
    expect(writersOf("leave_policies")).toEqual(["lib/data/mock/store.ts"]);
  });

  it("every SQL balance write is keyed by its own (user_id, leave_type_id) and gated on tracks_balance", () => {
    for (const f of ["lib/accrual/postgres-store.ts", "lib/leave-requests/postgres-store.ts"]) {
      const src = readFileSync(path.join(root, f), "utf8");
      const s = normalise(src);
      expect(s, f).toMatch(
        /insert into leave_balances \(user_id, leave_type_id, balance, updated_at\)/,
      );
      expect(s, f).toMatch(/on conflict \(user_id, leave_type_id\)/);
      expect(s, f).toMatch(/tracks_balance/);
    }
    // decide: the write sits under the tracked-type guard
    expect(
      normalise(readFileSync(path.join(root, "lib/leave-requests/postgres-store.ts"), "utf8")),
    ).toMatch(
      /if \(decision === "approve" && row\.tracks_balance\) \{.{0,200}insert into leave_balances/,
    );
    expect(
      normalise(readFileSync(path.join(root, "lib/accrual/postgres-store.ts"), "utf8")),
    ).toMatch(/insert into leave_balances.{0,300}where t\.tracks_balance/);
  });
});

describe("TASK-029 — balance ledger writers", () => {
  it.each<[string, string, boolean]>([
    ["SQL insert", "insert into balance_ledger (user_id) values ($1)", true],
    [
      "CTE insert",
      "with u as (update x set y = 1 returning *) insert into public.balance_ledger select * from u",
      true,
    ],
    ["mock push", "mockDb.balanceLedger.push(row)", true],
    ["memory helper", "appendLedger({ userId, delta: -2 })", true],
    ["row mutation", "const e = mockDb.balanceLedger[0]; e.delta = 1", true],
    ["select", "select delta from balance_ledger where user_id = $1", false],
    ["mock read", "mockDb.balanceLedger.filter((e) => e.userId === id)", false],
  ])("detector: %s → %s", (_l, src, expected) => {
    expect(writesTable(src, "balance_ledger")).toBe(expected);
  });

  it("balance_ledger is written only by the reviewed decide + accrual stores (and the mock store)", () => {
    expect(writersOf("balance_ledger")).toEqual([
      "lib/accrual/memory-store.ts",
      "lib/accrual/postgres-store.ts",
      "lib/data/mock/store.ts", // appendLedger (the memory mirror) + resetMockDb
      "lib/leave-requests/memory-store.ts",
      "lib/leave-requests/postgres-store.ts",
    ]);
  });

  it("every leave_balances writer ALSO writes balance_ledger (a new writer must add its ledger row)", () => {
    const ledgerWriters = new Set(writersOf("balance_ledger"));
    const missing = writersOf("leave_balances").filter((f) => !ledgerWriters.has(f));
    expect(missing).toEqual([]);
  });

  it("TASK-028: the cancellation credit and its ledger row are ONE statement that reverses the approval", () => {
    const s = normalise(
      readFileSync(path.join(root, "lib/leave-requests/postgres-store.ts"), "utf8"),
    );
    expect(s).toMatch(
      /select 0 - delta from balance_ledger where source_key = 'approval:' .{0,400}upserted as \( insert into leave_balances .{0,400}returning user_id, leave_type_id, balance \) insert into balance_ledger .{0,300}'cancellation'/,
    );
  });

  it("in SQL the ledger row is written in the SAME statement as the balance change", () => {
    for (const f of ["lib/accrual/postgres-store.ts", "lib/leave-requests/postgres-store.ts"]) {
      const s = normalise(readFileSync(path.join(root, f), "utf8"));
      expect(s, f).toMatch(
        /with upserted as \( insert into leave_balances .{0,400}returning user_id, leave_type_id, balance \) insert into balance_ledger/,
      );
    }
  });
});
