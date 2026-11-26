import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

/**
 * TASK-022 — scripts/set-task-status.mjs rewrites ONLY the status field of one task and
 * leaves every other byte intact (AGENTS.md task-tracking rule). Runs the real CLI on
 * temp files; the real CSVs are only ever copied.
 */
const root = path.resolve(import.meta.dirname, "..");
const script = path.join(root, "scripts/set-task-status.mjs");
const dir = mkdtempSync(path.join(tmpdir(), "task-status-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

let n = 0;
const write = (content: string | Buffer) => {
  const file = path.join(dir, `t${n++}.csv`);
  writeFileSync(file, content);
  return file;
};
const run = (id: string, status: string, file: string) =>
  spawnSync(process.execPath, [script, id, status, file], { encoding: "utf8", cwd: root });
const bytes = (file: string) => readFileSync(file);
const H = "task_id,summary,status,notes";

describe("golden: the real task CSVs", () => {
  const real = readdirSync(path.join(root, "docs/dev-tasks")).filter((f) => f.endsWith(".csv"));

  it("finds both task CSVs", () => {
    expect(real.sort()).toEqual([
      "epic-1-leave-request-tasks.csv",
      "epic-2-hardening-and-resolution-tasks.csv",
    ]);
  });

  it.each(real)(
    "%s: changing a status changes only that field, and reverting restores the bytes",
    (name) => {
      const file = path.join(dir, `golden-${name}`);
      copyFileSync(path.join(root, "docs/dev-tasks", name), file);
      const original = bytes(file);
      const firstTask = original.toString("utf8").split("\n")[2]!.split(",")[0]!; // first TASK row
      const before = original.toString("utf8").split("\n");

      const res = run(firstTask, "In Progress", file);
      expect(res.status, res.stderr).toBe(0);
      expect(res.stdout).toMatch(
        new RegExp(`${firstTask} (Open|Done|Blocked|In Progress) → In Progress`),
      );
      const after = bytes(file).toString("utf8").split("\n");
      const changed = after.map((l, i) => (l === before[i] ? null : i)).filter((i) => i !== null);
      expect(changed).toHaveLength(1);
      expect(after[changed[0]!]).toContain(",In Progress,");

      const previous = res.stdout.match(/ (\S+(?: Progress)?) → /)![1]!;
      expect(run(firstTask, previous, file).status).toBe(0);
      expect(bytes(file).equals(original)).toBe(true);
    },
  );
});

describe("encodings and line endings", () => {
  it("keeps a UTF-8 BOM and recognises the header behind it", () => {
    const file = write(
      Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(`${H}\nT-1,a,Open,x\n`)]),
    );
    expect(run("T-1", "Done", file).status).toBe(0);
    expect(bytes(file).subarray(0, 3)).toEqual(Buffer.from([0xef, 0xbb, 0xbf]));
    expect(bytes(file).subarray(3).toString()).toBe(`${H}\nT-1,a,Done,x\n`);
  });

  it.each([
    ["LF", "\n"],
    ["CRLF", "\r\n"],
  ])("keeps %s line endings", (_l, eol) => {
    const file = write(`${H}${eol}T-1,a,Open,x${eol}T-2,b,Open,y${eol}`);
    expect(run("T-2", "Done", file).status).toBe(0);
    expect(bytes(file).toString()).toBe(`${H}${eol}T-1,a,Open,x${eol}T-2,b,Done,y${eol}`);
  });

  it("mixed CRLF/LF: every record keeps its own ending, and rows after the boundary are found", () => {
    const file = write(`${H}\r\nT-1,a,Open,x\nT-2,b,Open,y\r\nT-3,c,Open,z\n`);
    expect(run("T-2", "Done", file).status).toBe(0);
    expect(run("T-3", "Blocked", file).status).toBe(0);
    expect(bytes(file).toString()).toBe(`${H}\r\nT-1,a,Open,x\nT-2,b,Done,y\r\nT-3,c,Blocked,z\n`);
  });

  it("keeps a missing trailing newline", () => {
    const file = write(`${H}\nT-1,a,Open,x`);
    expect(run("T-1", "Done", file).status).toBe(0);
    expect(bytes(file).toString()).toBe(`${H}\nT-1,a,Done,x`);
  });
});

describe("quoted fields", () => {
  it("updates a row whose quoted field spans several lines, touching only its status", () => {
    const file = write(`${H}\nT-1,"line one\nline two, with comma",Open,x\nT-2,b,Open,y\n`);
    const res = run("T-1", "Done", file);
    expect(res.status, res.stderr).toBe(0);
    expect(bytes(file).toString()).toBe(
      `${H}\nT-1,"line one\nline two, with comma",Done,x\nT-2,b,Open,y\n`,
    );
  });

  it("never treats a line INSIDE a quoted field as a row (no silent corruption)", () => {
    const content = `${H}\nT-1,"see:\nT-9,fake,Open,z",Open,x\n`;
    const file = write(content);
    const res = run("T-9", "Done", file);
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/T-9 not found/);
    expect(bytes(file).toString()).toBe(content);
  });

  it('handles "" escapes and quoted status values', () => {
    const file = write(`${H}\nT-1,"say ""hi"", ok","Open",x\n`);
    expect(run("T-1", "In Progress", file).status).toBe(0);
    expect(bytes(file).toString()).toBe(`${H}\nT-1,"say ""hi"", ok",In Progress,x\n`);
  });
});

describe("refusals leave the file unchanged (exit 1)", () => {
  it.each([
    [
      "an unterminated quoted field",
      `${H}\nT-1,"never closed,Open,x\n`,
      "T-1",
      "Done",
      /unterminated quoted field/,
    ],
    [
      "a row with too few fields",
      `${H}\nT-1,a,Open\n`,
      "T-1",
      "Done",
      /record 2.*3 fields.*header has 4/,
    ],
    [
      "a row with too many fields",
      `${H}\nT-1,a,Open,x,extra\n`,
      "T-1",
      "Done",
      /record 2.*5 fields.*header has 4/,
    ],
    ["an invalid status", `${H}\nT-1,a,Open,x\n`, "T-1", "Finished", /status must be one of/],
    ["an unknown task", `${H}\nT-1,a,Open,x\n`, "T-404", "Done", /T-404 not found/],
    ["a duplicate task id", `${H}\nT-1,a,Open,x\nT-1,b,Open,y\n`, "T-1", "Done", /found 2 times/],
  ])("%s", (_l, content, id, status, message) => {
    const file = write(content);
    const res = run(id, status, file);
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(message);
    expect(bytes(file).toString()).toBe(content);
  });
});

describe("structure", () => {
  it("writes through a temp file and an atomic rename (never a half-written CSV)", () => {
    const src = readFileSync(script, "utf8");
    expect(src).toMatch(/renameSync\(/);
    expect(src).not.toMatch(/writeFileSync\(file,/);
  });
});
