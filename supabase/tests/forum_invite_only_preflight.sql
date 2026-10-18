-- DNCH Community v1.1: READ-ONLY deployment preflight.
-- Safe to run in the existing Supabase SQL Editor: SELECT only, no DDL/DML.
-- BEFORE the invite-only migration, expected results are FAIL.
-- AFTER applying it, all checks must PASS before frontend deployment.
-- Metadata checks do NOT replace real anon/member/admin RLS integration tests.

with checks as (
 select 1 as ordinal, 'Pilot member table exists' as check_name,
        to_regclass('public.forum_pilot_members') is not null as passed
 union all
 select 2, 'Global posting control table exists',
        to_regclass('public.forum_pilot_controls') is not null
 union all
 select 3, 'Pilot member RLS enabled',
        coalesce((select relrowsecurity from pg_class where oid=to_regclass('public.forum_pilot_members')),false)
 union all
 select 4, 'Posting control RLS enabled',
        coalesce((select relrowsecurity from pg_class where oid=to_regclass('public.forum_pilot_controls')),false)
 union all
 select 5, 'Anonymous cannot read invitation membership',
        not coalesce(has_table_privilege('anon',to_regclass('public.forum_pilot_members'),'SELECT'),false)
 union all
 select 6, 'Authenticated users may read their own membership',
        coalesce(has_table_privilege('authenticated',to_regclass('public.forum_pilot_members'),'SELECT'),false)
        and exists (select 1 from pg_policies where schemaname='public'
          and tablename='forum_pilot_members' and cmd='SELECT'
          and roles @> array['authenticated']::name[]
          and coalesce(qual,'') ilike '%auth.uid()%')
 union all
 select 7, 'Neither browser role may edit the invitation list',
        to_regclass('public.forum_pilot_members') is not null
        and not coalesce(has_table_privilege('anon',to_regclass('public.forum_pilot_members'),'INSERT, UPDATE, DELETE'),false)
        and not coalesce(has_table_privilege('authenticated',to_regclass('public.forum_pilot_members'),'INSERT, UPDATE, DELETE'),false)
 union all
 select 8, 'Neither browser role may modify the posting switch',
        to_regclass('public.forum_pilot_controls') is not null
        and not coalesce(has_table_privilege('anon',to_regclass('public.forum_pilot_controls'),'INSERT, UPDATE, DELETE'),false)
        and not coalesce(has_table_privilege('authenticated',to_regclass('public.forum_pilot_controls'),'INSERT, UPDATE, DELETE'),false)
 union all
 select 9, 'Guests can read posting switch status',
        coalesce(has_table_privilege('anon',to_regclass('public.forum_pilot_controls'),'SELECT'),false)
        and exists(select 1 from pg_policies where tablename='forum_pilot_controls'
          and schemaname='public' and cmd='SELECT' and roles @> array['anon']::name[])
 union all
 select 10, 'Topic inserts require invitation, pause flag and ownership',
        exists (select 1 from pg_policies where schemaname='public' and tablename='forum_threads'
          and cmd='INSERT' and roles @> array['authenticated']::name[]
          and coalesce(with_check,'') ilike '%forum_pilot_members%'
          and coalesce(with_check,'') ilike '%forum_pilot_controls%'
          and coalesce(with_check,'') ilike '%author_id%')
 union all
 select 11, 'Reply inserts require invitation, pause flag and thread checks',
        exists (select 1 from pg_policies where schemaname='public' and tablename='forum_replies'
          and cmd='INSERT' and roles @> array['authenticated']::name[]
          and coalesce(with_check,'') ilike '%forum_pilot_members%'
          and coalesce(with_check,'') ilike '%forum_pilot_controls%'
          and coalesce(with_check,'') ilike '%forum_threads%')
 union all
 select 12, 'Report inserts require invited author and no global pause gate',
        exists (select 1 from pg_policies where schemaname='public' and tablename='forum_reports'
          and cmd='INSERT' and roles @> array['authenticated']::name[]
          and coalesce(with_check,'') ilike '%forum_pilot_members%'
          and coalesce(with_check,'') not ilike '%forum_pilot_controls%')
 union all
 select 13, 'Moderation audit table retains RLS',
        coalesce((select relrowsecurity from pg_class where oid=to_regclass('public.forum_moderation_audit')),false)
 union all
 select 14, 'Forum admin assignment not writable from browser',
        not coalesce(has_table_privilege('authenticated',to_regclass('public.forum_admins'),'INSERT, UPDATE, DELETE'),false)
 union all
 select 15, 'No RLS opt-out on existing threads',
        coalesce((select relrowsecurity from pg_class where oid=to_regclass('public.forum_threads')),false)
)
select check_name,case when passed then 'PASS' else 'FAIL' end as result
from checks order by ordinal;
