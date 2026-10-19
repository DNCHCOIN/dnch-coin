-- DNCH Community v1.1: READ-ONLY deployment preflight.
-- Safe to run in the existing Supabase SQL Editor: SELECT only, no DDL/DML.
-- BEFORE the invite-only migration, expected results are FAIL.
-- AFTER applying it, all checks must PASS before frontend deployment.
-- Checks 16-17 also detect an extra permissive INSERT/ALL policy that could OR-bypass
-- the intended invitation check. This is a metadata audit, NOT a real role test.
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
 union all
 select 16, 'Exactly one applicable INSERT policy per writable forum table',
        (select count(*) from pg_policies p where p.schemaname='public'
          and p.tablename='forum_threads' and p.cmd in ('ALL','INSERT')
          and (p.roles && array['authenticated','public']::name[])) = 1
        and (select count(*) from pg_policies p where p.schemaname='public'
          and p.tablename='forum_replies' and p.cmd in ('ALL','INSERT')
          and (p.roles && array['authenticated','public']::name[])) = 1
        and (select count(*) from pg_policies p where p.schemaname='public'
          and p.tablename='forum_reports' and p.cmd in ('ALL','INSERT')
          and (p.roles && array['authenticated','public']::name[])) = 1
 union all
 select 17, 'No anonymous or PUBLIC policy can grant forum INSERT',
        not exists(select 1 from pg_policies p where p.schemaname='public'
          and p.tablename in ('forum_threads','forum_replies','forum_reports')
          and p.cmd in ('ALL','INSERT')
          and (p.roles && array['anon','public']::name[]))
 union all
 select 18, 'Anonymous role has no INSERT grants on forum content',
        not has_table_privilege('anon','public.forum_threads','INSERT')
        and not has_table_privilege('anon','public.forum_replies','INSERT')
        and not has_table_privilege('anon','public.forum_reports','INSERT')
 union all
 select 19, 'Only own-membership SELECT policy exists for pilot approval',
        (select count(*) from pg_policies p where p.schemaname='public'
          and p.tablename='forum_pilot_members') = 1
        and exists(select 1 from pg_policies p where p.schemaname='public'
          and p.tablename='forum_pilot_members' and p.cmd='SELECT'
          and p.roles @> array['authenticated']::name[]
          and coalesce(p.qual,'') ilike '%user_id%'
          and coalesce(p.qual,'') ilike '%auth.uid()%')
 union all
 select 20, 'Pilot control has one public read-only RLS policy',
        (select count(*) from pg_policies p where p.schemaname='public'
          and p.tablename='forum_pilot_controls') = 1
        and exists(select 1 from pg_policies p where p.schemaname='public'
          and p.tablename='forum_pilot_controls' and p.cmd='SELECT'
          and p.roles @> array['anon','authenticated']::name[])
 union all
 select 21, 'All three forum write guard triggers remain enabled',
        (select count(*) from pg_trigger t
          join pg_class c on c.oid=t.tgrelid
          join pg_namespace n on n.oid=c.relnamespace
          where n.nspname='public'
          and (c.relname,t.tgname) in (
            ('forum_threads','forum_thread_guard'),
            ('forum_replies','forum_reply_guard'),
            ('forum_reports','forum_report_guard'))
          and t.tgenabled in ('O','A')) = 3
 union all
 select 22, 'Moderation audit trigger function not callable by browser',
        not has_function_privilege('authenticated','public.forum_record_moderation()','EXECUTE')
        and not has_function_privilege('anon','public.forum_record_moderation()','EXECUTE')
 union all
 select 23, 'Topic write policy still checks hidden and locked flags',
        exists(select 1 from pg_policies p where p.schemaname='public'
          and p.tablename='forum_threads' and p.cmd='INSERT'
          and coalesce(p.with_check,'') ilike '%is_hidden%'
          and coalesce(p.with_check,'') ilike '%is_locked%')
 union all
 select 24, 'Report write policy still requires reporter ownership',
        exists(select 1 from pg_policies p where p.schemaname='public'
          and p.tablename='forum_reports' and p.cmd='INSERT'
          and coalesce(p.with_check,'') ilike '%reporter_id%'
          and coalesce(p.with_check,'') ilike '%auth.uid()%')
 union all
 select 25, 'Anonymous and signed-in roles cannot assign admins',
        not has_table_privilege('anon','public.forum_admins','INSERT, UPDATE, DELETE')
        and not has_table_privilege('authenticated','public.forum_admins','INSERT, UPDATE, DELETE')
)
select check_name,case when passed then 'PASS' else 'FAIL' end as result
from checks order by ordinal;
