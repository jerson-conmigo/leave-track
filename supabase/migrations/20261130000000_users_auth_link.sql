-- ============================================================================
-- TASK-024 / US-13 — link each LeaveTrack user to their Supabase Auth identity.
--
-- users.auth_user_id is set ONLY by an administrator when the user is invited
-- (scripts/invite-user.mjs; the admin UI is TASK-043). Sign-in never links by email —
-- that would let whoever controls an address take over an account (ADR-LeaveTrack-E004).
-- Authorization still comes from the users row; this column only answers "which user
-- is this provider identity?".
-- ============================================================================

-- (a) PRE-CHECK existing data. Invites find the user by email, so two users whose
--     emails differ only in case would be ambiguous. Fail (and roll back) rather than
--     guess. Diagnose with supabase/checks/users_email_case_duplicates.sql.
do $$
declare
  dupes int;
begin
  select count(*) into dupes
    from (select lower(email) from public.users group by lower(email) having count(*) > 1) d;
  if dupes > 0 then
    raise exception
      'TASK-024 pre-check failed: % email addresses are shared by several users (ignoring case). Fix the data first (see supabase/checks/users_email_case_duplicates.sql); nothing was changed.',
      dupes
      using errcode = 'unique_violation';
  end if;
end;
$$;

-- (b) One users row per provider identity, and at most one per email (any case).
alter table public.users add column auth_user_id uuid;
alter table public.users add constraint users_auth_user_id_key unique (auth_user_id);
create unique index users_email_lower_key on public.users (lower(email));

-- (c) On Supabase, deleting the provider identity unlinks the user (the users row and
--     its history are never deleted — BR-04). Skipped where there is no auth schema
--     (plain Postgres / PGlite tests).
do $$
begin
  if exists (select 1 from information_schema.tables
              where table_schema = 'auth' and table_name = 'users') then
    alter table public.users
      add constraint users_auth_user_id_fkey foreign key (auth_user_id)
      references auth.users (id) on delete set null;
  end if;
end;
$$;
