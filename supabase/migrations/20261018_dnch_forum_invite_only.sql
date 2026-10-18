-- DNCH Community v1.1 — invitation-only posting and a database-controlled posting pause.
-- IMPORTANT: Review and apply this migration BEFORE deploying the matching forum.js.
-- This does not configure Supabase Auth signups, outbound email, legal/privacy pages,
-- or turn the private forum into a public launch.
begin;

-- Only a trusted database administrator can add or remove approved pilot writers.
-- A verified Auth account by itself does not confer posting access.
create table public.forum_pilot_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  approved_at timestamptz not null default now()
);
alter table public.forum_pilot_members enable row level security;
revoke all on public.forum_pilot_members from anon, authenticated;
grant select on public.forum_pilot_members to authenticated;
create policy "pilot members read own approval" on public.forum_pilot_members
  for select to authenticated using (user_id = (select auth.uid()));

-- Preserve access for the verified current founder without hardcoding a user ID.
-- Fail rather than accidentally disabling the original test account.
do $$
begin
  if not exists (select 1 from public.forum_admins) then
    raise exception 'DNCH forum pilot requires an existing verified admin';
  end if;
end $$;
insert into public.forum_pilot_members (user_id)
select user_id from public.forum_admins;

-- One database-managed flag; browser visitors may read but NEVER change it.
-- Turning this OFF blocks new threads/replies at the database layer immediately.
-- Reports stay available to approved pilot members, even during a posting pause.
create table public.forum_pilot_controls (
  id integer primary key check (id = 1),
  posting_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.forum_pilot_controls(id, posting_enabled) values (1, true);
alter table public.forum_pilot_controls enable row level security;
revoke all on public.forum_pilot_controls from anon, authenticated;
grant select on public.forum_pilot_controls to anon, authenticated;
create policy "forum may read posting availability" on public.forum_pilot_controls
  for select to anon, authenticated using (true);

-- Existing ownership, lock/visibility and moderator block checks remain in force.
drop policy "members create own topics" on public.forum_threads;
create policy "members create own topics" on public.forum_threads
  for insert to authenticated
  with check (
    (select auth.uid()) = author_id
    and is_hidden = false and is_locked = false
    and exists (
      select 1 from public.forum_pilot_members m
      where m.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.forum_pilot_controls c
      where c.id = 1 and c.posting_enabled
    )
    and not exists (
      select 1 from public.forum_member_blocks b
      where b.user_id = (select auth.uid()) and b.is_blocked
    )
  );

drop policy "members reply to open topics" on public.forum_replies;
create policy "members reply to open topics" on public.forum_replies
  for insert to authenticated
  with check (
    (select auth.uid()) = author_id and is_hidden = false
    and exists (
      select 1 from public.forum_pilot_members m
      where m.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.forum_pilot_controls c
      where c.id = 1 and c.posting_enabled
    )
    and not exists (
      select 1 from public.forum_member_blocks b
      where b.user_id = (select auth.uid()) and b.is_blocked
    )
    and exists (
      select 1 from public.forum_threads t
      where t.id = thread_id and not t.is_hidden and not t.is_locked
    )
  );

drop policy "members can report" on public.forum_reports;
create policy "members can report" on public.forum_reports
  for insert to authenticated
  with check (
    (select auth.uid()) = reporter_id
    and exists (
      select 1 from public.forum_pilot_members m
      where m.user_id = (select auth.uid())
    )
  );

-- Intentionally no browser INSERT/UPDATE/DELETE grants for either pilot table.
-- Review sign-up settings and conduct two-account RLS tests before inviting others.
commit;
