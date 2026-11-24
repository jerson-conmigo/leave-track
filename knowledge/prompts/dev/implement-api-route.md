# Prompt — Implement an API route

Use for any `app/api/**/route.ts` task (e.g. TASK-011, 013, 014, 015, 017).

```
Implement <METHOD> <ROUTE> for <TASK-ID> (<user story>).

Read first: AGENTS.md, knowledge/rules/coding-standards.md, the task row in
docs/dev-tasks/*.csv, and the matching PRD acceptance criteria.

Requirements:
1. Wrap the handler in withErrorHandler (lib/api/with-error-handler.ts).
2. Resolve the session server-side; 401 if missing, 403 if the role/ownership check fails.
3. Validate input with a zod schema in lib/validation/ (reuse it in the UI form).
4. Put the logic in a domain service (lib/<domain>/<action>.ts) that takes a store
   port + collaborators as deps — see lib/leave-requests/ (TASK-011) for the shape:
   store.ts (port) · postgres-store.ts (SqlClient, all SQL parameterised) ·
   memory-store.ts (mock DB, local dev) · index.ts (wiring) · route.ts + server
   action as thin transports. Test the service with the postgres store on PGlite
   (tests/db/helpers.ts → createTestDb()).
   Scoping (manager_id) and is_deleted filtering go in the SQL itself.
5. Return ok(data) / throw AppError(code, message) — envelope per ARCH.
6. Write vitest tests covering every acceptance criterion, including the negative/security ones.
7. Log business events with pino (no console.*).

Output: the files changed, and how each acceptance criterion is satisfied + tested.
```
