-- DNCH Community v1.1 — real PostgreSQL / pgTAP RLS behavioral test.
-- LOCAL/DISPOSABLE, ALREADY-MIGRATED TEST DATABASE ONLY.
-- Do not execute through the connected live Supabase project or its SQL Editor.
-- Requires migrations through forum invite-only v1.1, including the founding admin.
-- Run with psql -X -v ON_ERROR_STOP=1 -f tests/forum-pilot-rls.pgtap.sql
-- All data changes, including auth.users fixture rows, are rolled back.
--
-- Not automatically run by supabase test db: the historical forum-admin
-- migration needs a founder to be seeded BEFORE that migration. See runbook.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

do $guard$
begin
 if to_regclass('public.forum_pilot_members') is null
    or to_regclass('public.forum_pilot_controls') is null then
   raise exception 'Apply the v1.1 migration in an ISOLATED test database first';
 end if;
 if (select count(*) from public.forum_admins)=0 then
   raise exception 'Test fixture needs an existing founder from the v0.7 admin migration';
 end if;
 if (select count(*) from public.forum_pilot_controls where id=1 and posting_enabled)=0 then
   raise exception 'Fixture needs the global posting switch enabled at start';
 end if;
end $guard$;

select plan(25);

-- Synthetic accounts, unique on each run. No real contactable email addresses.
-- The existing forum_create_profile trigger seeds their pseudonyms automatically.
select set_config('dnch.rls.invited', gen_random_uuid()::text, true);
select set_config('dnch.rls.outsider', gen_random_uuid()::text, true);
select set_config('dnch.rls.paused', gen_random_uuid()::text, true);
select set_config('dnch.rls.blocked', gen_random_uuid()::text, true);
select set_config('dnch.rls.replyer', gen_random_uuid()::text, true);

insert into auth.users (id,email)
select u.id::uuid, 'dnch-local-rls-'||u.id||'@example.invalid'
from (values
 (current_setting('dnch.rls.invited')),
 (current_setting('dnch.rls.outsider')),
 (current_setting('dnch.rls.paused')),
 (current_setting('dnch.rls.blocked')),
 (current_setting('dnch.rls.replyer'))
) u(id);

insert into public.forum_pilot_members(user_id)
select id::uuid from (values
 (current_setting('dnch.rls.invited')),
 (current_setting('dnch.rls.paused')),
 (current_setting('dnch.rls.blocked')),
 (current_setting('dnch.rls.replyer'))
) u(id);

-- 1–2: essential database protections.
select ok((select relrowsecurity from pg_class where oid='public.forum_pilot_members'::regclass),
          'Invitation membership table uses RLS');
select ok((select relrowsecurity from pg_class where oid='public.forum_pilot_controls'::regclass),
          'Global posting switch uses RLS');

-- 3–7: an approved signed-in member may write, but may not impersonate another.
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('dnch.rls.invited'),true);

select is((select count(*) from public.forum_pilot_members),1::bigint,
          'Approved member can read only their own invitation');
select lives_ok(
 format($q$insert into public.forum_threads(category_id,author_id,title,body)
  select id,%L::uuid,'Local RLS topic A','A test discussion written to verify invitation policies.'
  from public.forum_categories where slug='open-talk'$q$,current_setting('dnch.rls.invited')),
 'Approved member creates a real topic');

select set_config('dnch.rls.thread',
 (select id::text from public.forum_threads
  where author_id=current_setting('dnch.rls.invited')::uuid
  order by created_at desc limit 1),true);

select lives_ok(
 format($q$insert into public.forum_replies(thread_id,author_id,body)
  values(%L::uuid,%L::uuid,'Allowed local reply')$q$,
  current_setting('dnch.rls.thread'),current_setting('dnch.rls.invited')),
 'Approved member replies to the topic');

select lives_ok(
 format($q$insert into public.forum_reports(thread_id,reporter_id,reason)
  values(%L::uuid,%L::uuid,'Local RLS report, please review')$q$,
  current_setting('dnch.rls.thread'),current_setting('dnch.rls.invited')),
 'Approved member may report content');

select throws_ok(
 format($q$insert into public.forum_threads(category_id,author_id,title,body)
  select id,%L::uuid,'Forged member topic','This post must not be attributed to a different account.'
  from public.forum_categories where slug='open-talk'$q$,current_setting('dnch.rls.outsider')),
 'P0001', 'Invalid topic owner',
 'Member cannot forge a different author ID');

-- 8–12: a verified Auth account without an invitation can read but cannot write.
select set_config('request.jwt.claim.sub',current_setting('dnch.rls.outsider'),true);
select is((select count(*) from public.forum_pilot_members),0::bigint,
          'Uninvited member cannot view other members invitations');

select throws_ok(
 format($q$insert into public.forum_threads(category_id,author_id,title,body)
  select id,%L::uuid,'Uninvited member topic','An uninvited user must be denied a new discussion.'
  from public.forum_categories where slug='open-talk'$q$,current_setting('dnch.rls.outsider')),
 '42501',null,'Uninvited member cannot create a topic');

select throws_ok(
 format($q$insert into public.forum_replies(thread_id,author_id,body)
  values(%L::uuid,%L::uuid,'Uninvited reply')$q$,
  current_setting('dnch.rls.thread'),current_setting('dnch.rls.outsider')),
 '42501',null,'Uninvited member cannot reply');

select throws_ok(
 format($q$insert into public.forum_reports(thread_id,reporter_id,reason)
  values(%L::uuid,%L::uuid,'Uninvited member report attempt')$q$,
  current_setting('dnch.rls.thread'),current_setting('dnch.rls.outsider')),
 '42501',null,'Uninvited member cannot report');

select is((select count(*) from public.forum_threads
           where id=current_setting('dnch.rls.thread')::uuid),1::bigint,
          'Uninvited account can still read a visible topic');

-- 13–16: anonymous visitors cannot read invitations or post.
set local role anon;
select ok(not has_table_privilege('anon','public.forum_pilot_members','SELECT'),
          'Anonymous visitor cannot select invitation membership');
select is((select count(*) from public.forum_threads
           where id=current_setting('dnch.rls.thread')::uuid),1::bigint,
          'Anonymous visitor may read public topic');
select ok(not has_table_privilege('anon','public.forum_threads','INSERT'),
          'Anonymous visitor cannot insert a topic');
select is((select posting_enabled from public.forum_pilot_controls where id=1),
          true,'Anonymous visitor may read only the posting switch status');

-- 17–19: pause denies new posts but retains reporting for invited users.
set local role postgres;
update public.forum_pilot_controls set posting_enabled=false where id=1;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('dnch.rls.paused'),true);

select throws_ok(
 format($q$insert into public.forum_threads(category_id,author_id,title,body)
  select id,%L::uuid,'Paused member topic','Global pause must stop a new topic before it exists.'
  from public.forum_categories where slug='open-talk'$q$,current_setting('dnch.rls.paused')),
 '42501',null,'Global pause denies a new topic by an invited member');

select throws_ok(
 format($q$insert into public.forum_replies(thread_id,author_id,body)
  values(%L::uuid,%L::uuid,'Paused new reply')$q$,
  current_setting('dnch.rls.thread'),current_setting('dnch.rls.paused')),
 '42501',null,'Global pause denies a new reply');

select lives_ok(
 format($q$insert into public.forum_reports(thread_id,reporter_id,reason)
  values(%L::uuid,%L::uuid,'Reporting remains available during pause')$q$,
  current_setting('dnch.rls.thread'),current_setting('dnch.rls.paused')),
 'Approved member can still report while posting is paused');

-- 20–21: moderation block is independent of the global switch.
-- The audit trigger requires auth.uid() to be a registered moderator.
set local role postgres;
update public.forum_pilot_controls set posting_enabled=true where id=1;
select set_config('request.jwt.claim.sub',
 (select user_id::text from public.forum_admins order by granted_at limit 1),true);
insert into public.forum_member_blocks(user_id,is_blocked,reason,updated_by)
select current_setting('dnch.rls.blocked')::uuid,true,
       'Temporary local RLS test posting restriction',user_id
from public.forum_admins order by granted_at limit 1;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('dnch.rls.blocked'),true);

select throws_ok(
 format($q$insert into public.forum_threads(category_id,author_id,title,body)
  select id,%L::uuid,'Blocked member topic','A moderated account must not publish this new topic.'
  from public.forum_categories where slug='open-talk'$q$,current_setting('dnch.rls.blocked')),
 '42501',null,'A blocked but invited member cannot start a topic');

select lives_ok(
 format($q$insert into public.forum_reports(thread_id,reporter_id,reason)
  values(%L::uuid,%L::uuid,'A restricted member can still file a report')$q$,
  current_setting('dnch.rls.thread'),current_setting('dnch.rls.blocked')),
 'A blocked but invited member can still report');

-- 22: locking a topic blocks new replies by members with no prior replies.
set local role postgres;
select set_config('request.jwt.claim.sub',
 (select user_id::text from public.forum_admins order by granted_at limit 1),true);
update public.forum_threads set is_locked=true
 where id=current_setting('dnch.rls.thread')::uuid;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('dnch.rls.replyer'),true);
select throws_ok(
 format($q$insert into public.forum_replies(thread_id,author_id,body)
  values(%L::uuid,%L::uuid,'Locked topic reply')$q$,
  current_setting('dnch.rls.thread'),current_setting('dnch.rls.replyer')),
 '42501',null,'Locked topic rejects replies from an otherwise approved member');

-- 23–24: moderation hides content from visitors and records the action.
set local role postgres;
select set_config('request.jwt.claim.sub',
 (select user_id::text from public.forum_admins order by granted_at limit 1),true);
update public.forum_threads set is_hidden=true
 where id=current_setting('dnch.rls.thread')::uuid;
set local role anon;
select is((select count(*) from public.forum_threads
           where id=current_setting('dnch.rls.thread')::uuid),0::bigint,
          'Hidden topic is absent from anonymous reads');
set local role authenticated;
select set_config('request.jwt.claim.sub',
 (select user_id::text from public.forum_admins order by granted_at limit 1),true);
select ok((select count(*) from public.forum_moderation_audit
           where target_id=current_setting('dnch.rls.thread')::uuid
             and action in ('topic_locked','topic_hidden'))>=2,
          'Moderator actions are present in the database-owned audit');

-- 25: revoked approval cannot write even if a normal login remains valid.
set local role postgres;
select set_config('request.jwt.claim.sub',
 (select user_id::text from public.forum_admins order by granted_at limit 1),true);
update public.forum_threads set is_hidden=false,is_locked=false
 where id=current_setting('dnch.rls.thread')::uuid;
delete from public.forum_pilot_members
 where user_id=current_setting('dnch.rls.paused')::uuid;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('dnch.rls.paused'),true);
select throws_ok(
 format($q$insert into public.forum_threads(category_id,author_id,title,body)
  select id,%L::uuid,'Revoked pilot member','The formerly approved member no longer has posting permission.'
  from public.forum_categories where slug='open-talk'$q$,current_setting('dnch.rls.paused')),
 '42501',null,'Revoking a pilot invitation prevents a new topic');

set local role postgres;
select * from finish();
rollback;
