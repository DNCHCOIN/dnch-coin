-- DNCH Community v0.7: pilot administrator & moderated reports.
-- Admin grants are created by the database owner, never from the browser.
begin;
create table public.forum_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 granted_at timestamptz not null default now()
);
alter table public.forum_admins enable row level security;
revoke all on public.forum_admins from anon,authenticated;
grant select on public.forum_admins to authenticated;
create policy "members verify own admin membership" on public.forum_admins
 for select to authenticated using (user_id = (select auth.uid()));

-- Establish the single, already verified DNCH founder as the inaugural admin.
-- Never grant based on display_name alone; also require exactly one Auth user.
do $$
begin
 if (select count(*) from auth.users) <> 1
    or (select count(*) from auth.users u join public.forum_profiles p on p.id=u.id
        where u.email_confirmed_at is not null and p.display_name='Admin1') <> 1
 then
   raise exception 'Cannot safely identify the sole verified founding member';
 end if;
 insert into public.forum_admins(user_id)
 select u.id from auth.users u join public.forum_profiles p on p.id=u.id
 where u.email_confirmed_at is not null and p.display_name='Admin1';
end $$;

-- Forum roles cannot be assigned or revoked by any API member.
create policy "admin views hidden topics" on public.forum_threads
 for select to authenticated using (exists(
  select 1 from public.forum_admins m where m.user_id=(select auth.uid())));
create policy "admin moderates topics" on public.forum_threads
 for update to authenticated using (exists(
  select 1 from public.forum_admins m where m.user_id=(select auth.uid())))
 with check (exists(
  select 1 from public.forum_admins m where m.user_id=(select auth.uid())));
grant update(is_hidden,is_locked) on public.forum_threads to authenticated;

create policy "admin views hidden replies" on public.forum_replies
 for select to authenticated using (exists(
  select 1 from public.forum_admins m where m.user_id=(select auth.uid())));
create policy "admin moderates replies" on public.forum_replies
 for update to authenticated using (exists(
  select 1 from public.forum_admins m where m.user_id=(select auth.uid())))
 with check (exists(
  select 1 from public.forum_admins m where m.user_id=(select auth.uid())));
grant update(is_hidden) on public.forum_replies to authenticated;

-- Reports remain invisible to non-admin members, including their authors.
alter table public.forum_reports
 add column status text not null default 'open'
 check (status in ('open','reviewed','dismissed'));
grant select,update(status) on public.forum_reports to authenticated;
create policy "admin reviews reports" on public.forum_reports
 for select to authenticated using (exists(
  select 1 from public.forum_admins m where m.user_id=(select auth.uid())));
create policy "admin marks reports" on public.forum_reports
 for update to authenticated using (exists(
  select 1 from public.forum_admins m where m.user_id=(select auth.uid())))
 with check (exists(
  select 1 from public.forum_admins m where m.user_id=(select auth.uid())));

-- Suspend posting rather than deleting member accounts or exposing email.
create table public.forum_member_blocks (
 user_id uuid primary key references public.forum_profiles(id) on delete cascade,
 is_blocked boolean not null default true,
 reason text not null check (char_length(btrim(reason)) between 5 and 300),
 updated_at timestamptz not null default now(),
 updated_by uuid not null references auth.users(id)
);
alter table public.forum_member_blocks enable row level security;
revoke all on public.forum_member_blocks from anon,authenticated;
grant select,insert,update(is_blocked,reason,updated_by,updated_at) on public.forum_member_blocks to authenticated;
create policy "admins or member view block status" on public.forum_member_blocks
 for select to authenticated using (
  user_id=(select auth.uid()) or
  exists(select 1 from public.forum_admins m where m.user_id=(select auth.uid())));
create policy "admins block nonadmins" on public.forum_member_blocks
 for insert to authenticated with check (
  updated_by=(select auth.uid()) and
  exists(select 1 from public.forum_admins m where m.user_id=(select auth.uid()))
  and not exists(select 1 from public.forum_admins m where m.user_id=forum_member_blocks.user_id)
 );
create policy "admins change blocks on nonadmins" on public.forum_member_blocks
 for update to authenticated using (
  exists(select 1 from public.forum_admins m where m.user_id=(select auth.uid()))
  and not exists(select 1 from public.forum_admins m where m.user_id=forum_member_blocks.user_id))
 with check (
  updated_by=(select auth.uid()) and
  exists(select 1 from public.forum_admins m where m.user_id=(select auth.uid()))
  and not exists(select 1 from public.forum_admins m where m.user_id=forum_member_blocks.user_id)
 );

-- Keep original owner and locked-thread checks, add DB-enforced block checks.
drop policy "members create own topics" on public.forum_threads;
create policy "members create own topics" on public.forum_threads
 for insert to authenticated with check (
   (select auth.uid())=author_id and is_hidden=false and is_locked=false
   and not exists(select 1 from public.forum_member_blocks b
      where b.user_id=(select auth.uid()) and b.is_blocked));
drop policy "members reply to open topics" on public.forum_replies;
create policy "members reply to open topics" on public.forum_replies
 for insert to authenticated with check (
   (select auth.uid())=author_id and is_hidden=false
   and not exists(select 1 from public.forum_member_blocks b
      where b.user_id=(select auth.uid()) and b.is_blocked)
   and exists(select 1 from public.forum_threads t
      where t.id=thread_id and not t.is_hidden and not t.is_locked));

commit;
