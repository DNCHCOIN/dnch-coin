-- DNCH ID v1.0: closed pilot. No public signups or paid email setup.
-- Membership is curated server-side. Even authenticated nonmembers cannot sync.
create table if not exists public.dnch_account_pilot_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 granted_at timestamptz not null default now()
);
alter table public.dnch_account_pilot_members enable row level security;
revoke all on public.dnch_account_pilot_members from public, anon, authenticated;
grant select on public.dnch_account_pilot_members to authenticated;
create policy "pilot members see own membership"
 on public.dnch_account_pilot_members for select to authenticated
 using (user_id = (select auth.uid()));

-- Grant existing forum administrators pilot access without hardcoded UUIDs.
insert into public.dnch_account_pilot_members (user_id)
 select user_id from public.forum_admins on conflict (user_id) do nothing;

create table if not exists public.dnch_account_data (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null,
 updated_at timestamptz not null default now(),
 constraint dnch_account_data_shape check (
  jsonb_typeof(data) = 'object'
  and data ?& array['ideas','challengeDays','music','forumTopics','nickname']
  and jsonb_typeof(data->'ideas') = 'array'
  and jsonb_typeof(data->'challengeDays') = 'array'
  and jsonb_typeof(data->'music') = 'array'
  and jsonb_typeof(data->'forumTopics') = 'array'
  and jsonb_typeof(data->'nickname') = 'string'
  and jsonb_array_length(data->'ideas') <= 24
  and jsonb_array_length(data->'challengeDays') <= 90
  and jsonb_array_length(data->'music') <= 20
  and jsonb_array_length(data->'forumTopics') <= 100
  and char_length(data->>'nickname') <= 32
  and octet_length(data::text) <= 16384
 )
);
alter table public.dnch_account_data enable row level security;
revoke all on public.dnch_account_data from public, anon, authenticated;
grant select,insert,update,delete on public.dnch_account_data to authenticated;

create policy "pilot owner selects own data"
 on public.dnch_account_data for select to authenticated
 using (user_id = (select auth.uid()) and exists (
  select 1 from public.dnch_account_pilot_members m
  where m.user_id = (select auth.uid())
 ));
create policy "pilot owner inserts own data"
 on public.dnch_account_data for insert to authenticated
 with check (user_id = (select auth.uid()) and exists (
  select 1 from public.dnch_account_pilot_members m
  where m.user_id = (select auth.uid())
 ));
create policy "pilot owner updates own data"
 on public.dnch_account_data for update to authenticated
 using (user_id = (select auth.uid()) and exists (
  select 1 from public.dnch_account_pilot_members m
  where m.user_id = (select auth.uid())
 ))
 with check (user_id = (select auth.uid()) and exists (
  select 1 from public.dnch_account_pilot_members m
  where m.user_id = (select auth.uid())
 ));
create policy "pilot owner deletes own data"
 on public.dnch_account_data for delete to authenticated
 using (user_id = (select auth.uid()) and exists (
  select 1 from public.dnch_account_pilot_members m
  where m.user_id = (select auth.uid())
 ));

comment on table public.dnch_account_data is
 'DNCH ID closed-pilot user-selected backups. Only authenticated approved users can access their own single JSON row via RLS.';
comment on table public.dnch_account_pilot_members is
 'Closed pilot allowlist, managed only from trusted database administration. Never writable by anon or authenticated browser clients.';
