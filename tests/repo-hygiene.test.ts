import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * TASK-022 — graph queries must not dirty the working tree: graphify's cache, HTML view,
 * dated snapshots and temporary extraction files are git-ignored; only the shared graph
 * is tracked. Asks git itself (`check-ignore` works whether or not the files exist).
 */
const root = path.resolve(import.meta.dirname, "..");
const git = (...args: string[]) => spawnSync("git", args, { cwd: root, encoding: "utf8" });
const ignored = (file: string) => git("check-ignore", "-q", "--no-index", file).status === 0;

describe("graphify-out tracking", () => {
  it.each([
    "graphify-out/cache/last_query_stamp",
    "graphify-out/cache/stat-index.json",
    "graphify-out/cache/ast/example.json",
    "graphify-out/graph.html",
    "graphify-out/2026-11-26/graph.json",
    "graphify-out/2031-01-01/GRAPH_REPORT.md",
    "graphify-out/.graphify_cached.json",
    "graphify-out/.graphify_uncached.txt",
  ])("ignores local graphify output: %s", (file) => {
    expect(ignored(file)).toBe(true);
  });

  it.each([
    "graphify-out/graph.json",
    "graphify-out/GRAPH_REPORT.md",
    "graphify-out/manifest.json",
    "graphify-out/.graphify_labels.json",
  ])("keeps the shared graph trackable: %s", (file) => {
    expect(ignored(file)).toBe(false);
  });

  it("no ignored graphify file is still tracked", () => {
    const res = git("ls-files", "--cached", "--ignored", "--exclude-standard", "graphify-out");
    expect(res.status).toBe(0);
    expect(res.stdout.trim()).toBe("");
  });
});
