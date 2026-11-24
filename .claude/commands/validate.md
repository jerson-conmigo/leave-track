# /validate

**VALIDATE** — Step 4 of the E→P→A→V cycle. Verify the implementation before calling it done.

## Prerequisite

APPLY must be complete.

## Steps

### 1 — Knowledge graph blast radius check

- `graphify-out/graph.json` exists → `graphify query "<what we just built>"`
- `.codegraph/codegraph.db` exists → `codegraph explore "<what we just built>"`
- Neither exists → skip, and note in VALIDATE COMPLETE that this check was unavailable.

Check: does anything that references the changed files now behave unexpectedly? Flag any community/symbol boundary crossings that weren't in the plan.

### 2 — Check against acceptance criteria

Load the acceptance criteria from the CSV task (or EVALUATE summary). For each criterion:

```
[ ] <criterion> — PASS / FAIL / PARTIAL
```

### 3 — Classify all issues found

```
[BLOCKER]   — prevents merge, must fix now
[FIX NOW]   — significant issue, fix before moving to next task
[BACKLOG]   — minor, log to knowledge/retros/ and defer
```

### 4 — Fix all BLOCKERs and FIX NOWs before continuing

Do not move to the next task until the implementation passes all acceptance criteria.

### 5 — If a pattern was discovered, contribute it back

If APPLY revealed a better approach or a non-obvious constraint:

```bash
# Append to knowledge/patterns/ or knowledge/rules/coding-standards.md
```

### 6 — Mark the dev task Done

Only when **every** acceptance criterion is PASS and no [BLOCKER] / [FIX NOW] remains open
(open [BACKLOG] items don't block), and the task came from `docs/dev-tasks/*.csv`:

```bash
npm run task:status -- <TASK-ID> Done
```

- The script rewrites only that row's `status` field — never re-save the CSV with a CSV library or
  editor (it re-quotes unrelated rows). Confirm the diff is a single line.
- Any criterion FAIL/PARTIAL → leave the status as is and say why in the summary.
- Never mark the parent `Epic` row Done here; that happens only when all its tasks are Done.

### 7 — When clean

```
VALIDATE COMPLETE
─────────────────
Criteria passed:  N/N
Issues fixed:     <list>
Backlog items:    <list added to knowledge/retros/>
Task status:      <TASK-ID> Open → Done   (or: unchanged — <reason>)
```

> "Task complete. Ready for the next `/evaluate`."
