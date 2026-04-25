-- ============================================================
-- Migration 00021: Teacher Profile Fields
-- Adds profile detail columns and join tables for subjects/grade_levels
-- ============================================================

-- -------------------------------------------------------
-- 1. Add new columns to profiles
-- -------------------------------------------------------
alter table public.profiles
  add column phone text check (length(phone) <= 20),
  add column bio text check (length(bio) <= 500),
  add column state text check (length(state) = 2),
  add column city text check (length(city) <= 100),
  add column schools text check (length(schools) <= 500),
  add column years_experience integer check (years_experience >= 0),
  add column academic_background text check (length(academic_background) <= 200),
  add column profile_completed boolean not null default false,
  add column updated_at timestamptz not null default now();

-- -------------------------------------------------------
-- 2. Trigger to auto-update updated_at
-- -------------------------------------------------------
create or replace function public.set_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_profiles_updated_at();

-- -------------------------------------------------------
-- 3. profile_subjects join table
-- -------------------------------------------------------
create table public.profile_subjects (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  primary key (profile_id, subject_id)
);

alter table public.profile_subjects enable row level security;

create policy "Users can view own profile_subjects"
  on public.profile_subjects for select
  using (auth.uid() = profile_id);

create policy "Users can insert own profile_subjects"
  on public.profile_subjects for insert
  with check (auth.uid() = profile_id);

create policy "Users can delete own profile_subjects"
  on public.profile_subjects for delete
  using (auth.uid() = profile_id);

create policy "Admins can manage profile_subjects"
  on public.profile_subjects for all
  using (public.is_admin());

-- -------------------------------------------------------
-- 4. profile_grade_levels join table
-- -------------------------------------------------------
create table public.profile_grade_levels (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  grade_level_id uuid not null references public.grade_levels(id) on delete cascade,
  primary key (profile_id, grade_level_id)
);

alter table public.profile_grade_levels enable row level security;

create policy "Users can view own profile_grade_levels"
  on public.profile_grade_levels for select
  using (auth.uid() = profile_id);

create policy "Users can insert own profile_grade_levels"
  on public.profile_grade_levels for insert
  with check (auth.uid() = profile_id);

create policy "Users can delete own profile_grade_levels"
  on public.profile_grade_levels for delete
  using (auth.uid() = profile_id);

create policy "Admins can manage profile_grade_levels"
  on public.profile_grade_levels for all
  using (public.is_admin());

-- -------------------------------------------------------
-- 5. Grant permissions to authenticated and anon roles
-- -------------------------------------------------------
grant select, insert, delete on public.profile_subjects to authenticated;
grant select, insert, delete on public.profile_grade_levels to authenticated;
