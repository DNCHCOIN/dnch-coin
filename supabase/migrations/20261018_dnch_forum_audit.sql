-- DNCH Community v0.8 — immutable moderator action history.
-- No login emails, post bodies, reasons or IP addresses are written to this log.
begin;
create table public.forum_moderation_audit (
  id bigint generated always as identity primary key,
  actor_id uuid not null references auth.users(id),
  target_type text not null check (target_type in ('topic','reply','report','member')),
  target_id uuid not null,
  action text not null check (action in (
    'topic_hidden','topic_restored','topic_locked','topic_unlocked',
    'reply_hidden','reply_restored','report_open','report_reviewed',
    'report_dismissed','member_restricted','member_restored'
  )),
  created_at timestamptz not null default now()
);
create index forum_moderation_audit_recent on public.forum_moderation_audit (created_at desc);
alter table public.forum_moderation_audit enable row level security;
revoke all on public.forum_moderation_audit from anon, authenticated;
grant select on public.forum_moderation_audit to authenticated;
create policy "only verified moderators can read audit"
 on public.forum_moderation_audit for select to authenticated
 using (exists (select 1 from public.forum_admins a where a.user_id = (select auth.uid())));

-- Audit entries are written only by database triggers. Browsers cannot insert,
-- update, delete or forge audit events, including admins.
create function public.forum_record_moderation() returns trigger
 language plpgsql security definer set search_path = ''
 as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'Authenticated moderator required for audited actions';
  end if;
  if not exists (select 1 from public.forum_admins where user_id=actor) then
    raise exception 'Moderator role required for audited actions';
  end if;

  if TG_TABLE_NAME = 'forum_threads' then
    if old.is_hidden is distinct from new.is_hidden then
      insert into public.forum_moderation_audit(actor_id,target_type,target_id,action)
      values(actor,'topic',new.id,case when new.is_hidden then 'topic_hidden' else 'topic_restored' end);
    end if;
    if old.is_locked is distinct from new.is_locked then
      insert into public.forum_moderation_audit(actor_id,target_type,target_id,action)
      values(actor,'topic',new.id,case when new.is_locked then 'topic_locked' else 'topic_unlocked' end);
    end if;
  elsif TG_TABLE_NAME = 'forum_replies' then
    if old.is_hidden is distinct from new.is_hidden then
      insert into public.forum_moderation_audit(actor_id,target_type,target_id,action)
      values(actor,'reply',new.id,case when new.is_hidden then 'reply_hidden' else 'reply_restored' end);
    end if;
  elsif TG_TABLE_NAME = 'forum_reports' then
    if old.status is distinct from new.status then
      insert into public.forum_moderation_audit(actor_id,target_type,target_id,action)
      values(actor,'report',new.id,case new.status
       when 'open' then 'report_open'
       when 'reviewed' then 'report_reviewed'
       else 'report_dismissed' end);
    end if;
  elsif TG_TABLE_NAME = 'forum_member_blocks' then
    if TG_OP='INSERT' or old.is_blocked is distinct from new.is_blocked then
      insert into public.forum_moderation_audit(actor_id,target_type,target_id,action)
      values(actor,'member',new.user_id,case when new.is_blocked then 'member_restricted' else 'member_restored' end);
    end if;
  end if;
  return new;
end $$;

revoke all on function public.forum_record_moderation() from public, anon, authenticated;

create trigger audit_moderated_topics after update of is_hidden,is_locked
 on public.forum_threads for each row execute function public.forum_record_moderation();
create trigger audit_moderated_replies after update of is_hidden
 on public.forum_replies for each row execute function public.forum_record_moderation();
create trigger audit_moderated_reports after update of status
 on public.forum_reports for each row execute function public.forum_record_moderation();
create trigger audit_member_block_created after insert
 on public.forum_member_blocks for each row execute function public.forum_record_moderation();
create trigger audit_member_block_changed after update of is_blocked
 on public.forum_member_blocks for each row execute function public.forum_record_moderation();

commit;
