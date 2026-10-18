-- DNCH Community v1.0 — indexed search across topic titles and text.
-- Existing public-topic row-level security policies continue to apply.
begin;

alter table public.forum_threads
  add column search_document tsvector
  generated always as (
    to_tsvector('simple'::regconfig, coalesce(title,'') || ' ' || coalesce(body,''))
  ) stored;

create index forum_threads_search_document_gin
  on public.forum_threads using gin (search_document);

-- Search is a read-only generated field; never add write privileges.
grant select(search_document) on public.forum_threads to anon,authenticated;

commit;
