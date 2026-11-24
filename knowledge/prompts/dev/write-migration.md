# Prompt — Write a database migration

```
Write a Supabase migration for <change> (<TASK-ID>).

Read first: supabase/migrations/* (current schema), ARCH › Data Model, AGENTS.md Backend standards.

Requirements:
1. New file supabase/migrations/<UTC yyyymmddhhmmss>_<snake_name>.sql — never edit an applied one.
2. Index every new FK; FKs are `on delete restrict`.
3. Express invariants as constraints (check / unique / not null).
4. Keep soft-delete + no-hard-delete guarantees intact (BR-04).
5. Enable RLS on new tables; add policies only alongside real auth.
6. Update lib/data/types.ts, the repository, fixtures.ts and seed.sql to match.
7. Explain how to roll forward safely if the migration fails midway.

Output: the SQL, the TS type changes, and a short note on data impact.
```
