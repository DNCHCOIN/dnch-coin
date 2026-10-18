-- DNCH Community v0.6 — user-owned display names for the existing pilot.
-- Verified Supabase Auth account is required. Only the display_name column may be edited.
begin;

-- Prevent account-role impersonation, controls, HTML-like characters and whitespace.
alter table public.forum_profiles
 add constraint forum_profiles_safe_display_name
 check (
   display_name = btrim(display_name)
   and display_name !~ '[[:cntrl:][:space:]<>@/\\]'
   and lower(display_name) !~ '^(admin|administrator|moderator|support|system|staff|official|root|dnch|dnchcoin)([._-].*)?$'
 ) not valid;
alter table public.forum_profiles validate constraint forum_profiles_safe_display_name;

-- Case-insensitive uniqueness, including generated default names.
create unique index forum_profiles_display_name_ci_unique on public.forum_profiles (lower(display_name));

grant update (display_name) on public.forum_profiles to authenticated;
create policy "profile owner updates nickname" on public.forum_profiles
 for update to authenticated
 using (id = (select auth.uid()))
 with check (id = (select auth.uid()));

-- The API caller does not get UPDATE privileges for id, created_at or other columns.
commit;
