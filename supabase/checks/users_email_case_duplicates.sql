-- Read-only pre-deploy check for 20261130000000_users_auth_link.sql (TASK-024).
-- Lists users whose emails differ only in case. The migration refuses to run while
-- this returns rows; resolve them (rename or merge the accounts) first.
select lower(email) as email, count(*) as users, array_agg(id order by created_at) as user_ids
  from public.users
 group by lower(email)
having count(*) > 1
 order by 1;
