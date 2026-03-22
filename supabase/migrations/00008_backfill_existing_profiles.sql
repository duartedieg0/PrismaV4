-- ============================================================
-- Migration 00008: Backfill missing profiles for existing auth users
-- Ensures legacy auth.users rows created before the trigger have a profile
-- ============================================================

insert into public.profiles (id, full_name, email, avatar_url)
select
  users.id,
  coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name'),
  users.email,
  users.raw_user_meta_data ->> 'avatar_url'
from auth.users as users
left join public.profiles as profiles
  on profiles.id = users.id
where profiles.id is null;
