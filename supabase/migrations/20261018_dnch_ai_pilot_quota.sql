-- DNCH AI limited pilot: bounded request quota for verified forum admins.
-- This does NOT turn on OpenAI billing or the public widget.
begin;
create table public.dnch_ai_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_day date not null,
  requests smallint not null check(requests between 1 and 10),
  primary key(user_id,usage_day)
);
alter table public.dnch_ai_daily_usage enable row level security;
revoke all on public.dnch_ai_daily_usage from anon,authenticated;

create function public.dnch_ai_reserve_daily_request()
returns boolean
language plpgsql security definer set search_path=''
as $$
declare
  actor uuid := auth.uid();
  updated smallint;
begin
  if actor is null then return false; end if;
  if not exists(select 1 from public.forum_admins a where a.user_id=actor) then
    return false;
  end if;
  insert into public.dnch_ai_daily_usage(user_id,usage_day,requests)
   values(actor,(now() at time zone 'UTC')::date,1)
  on conflict(user_id,usage_day) do update
    set requests = public.dnch_ai_daily_usage.requests+1
    where public.dnch_ai_daily_usage.requests < 10
  returning requests into updated;
  return updated is not null;
end $$;
revoke all on function public.dnch_ai_reserve_daily_request() from public,anon;
grant execute on function public.dnch_ai_reserve_daily_request() to authenticated;
commit;
