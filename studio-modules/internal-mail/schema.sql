-- DNCH Studio internal identity and mail. All data access is through the authenticated Edge API.
create table public.studio_members (
 id uuid primary key references auth.users(id) on delete cascade,
 username text unique not null check (username ~ '^[a-z0-9][a-z0-9_]{2,23}$'),
 display_name text not null check (length(display_name) between 1 and 60),
 recovery_hash text,
 revoked_before bigint not null default 0,
 created_at timestamptz not null default now()
);
create table public.studio_messages (
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references public.studio_members(id) on delete cascade,
 recipient_id uuid not null references public.studio_members(id) on delete cascade,
 subject text not null check (length(subject) between 1 and 160),
 body text not null check (length(body) between 1 and 20000),
 request_id uuid not null,
 read_at timestamptz,
 sender_deleted boolean not null default false,
 recipient_deleted boolean not null default false,
 created_at timestamptz not null default now(),
 unique(sender_id, request_id)
);
create index studio_messages_inbox on public.studio_messages(recipient_id, created_at desc);
create index studio_messages_sent on public.studio_messages(sender_id, created_at desc);
create table public.studio_drafts (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.studio_members(id) on delete cascade,
 recipient text not null default '' check(length(recipient)<=64),
 subject text not null default '' check(length(subject)<=160),
 body text not null default '' check(length(body)<=20000),
 updated_at timestamptz not null default now()
);
create index studio_drafts_owner on public.studio_drafts(owner_id,updated_at desc);
create table public.studio_rate_limits (
 bucket text primary key,
 hits integer not null,
 expires_at timestamptz not null
);
alter table public.studio_members enable row level security;
alter table public.studio_messages enable row level security;
alter table public.studio_drafts enable row level security;
alter table public.studio_rate_limits enable row level security;
revoke all on public.studio_members, public.studio_messages, public.studio_drafts, public.studio_rate_limits from public, anon, authenticated;
grant all on public.studio_members, public.studio_messages, public.studio_drafts, public.studio_rate_limits to service_role;
create function public.studio_take_rate(p_bucket text, p_limit integer, p_seconds integer) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare n integer;
begin
 delete from public.studio_rate_limits where expires_at < now() - interval '1 day';
 insert into public.studio_rate_limits(bucket,hits,expires_at) values(p_bucket,1,now()+make_interval(secs=>p_seconds))
 on conflict(bucket) do update set hits=case when studio_rate_limits.expires_at<now() then 1 else studio_rate_limits.hits+1 end,
 expires_at=case when studio_rate_limits.expires_at<now() then now()+make_interval(secs=>p_seconds) else studio_rate_limits.expires_at end
 returning hits into n;
 return n<=p_limit;
end $$;
revoke all on function public.studio_take_rate(text,integer,integer) from public,anon,authenticated;
grant execute on function public.studio_take_rate(text,integer,integer) to service_role;

create table public.studio_sessions (id uuid primary key, user_id uuid not null references public.studio_members(id) on delete cascade, created_at timestamptz not null default now());
create index studio_sessions_user on public.studio_sessions(user_id);
alter table public.studio_sessions enable row level security;
revoke all on public.studio_sessions from public, anon, authenticated;
grant all on public.studio_sessions to service_role;
