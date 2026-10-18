# DNCH Community v1.0 — topic discovery

This release improves browsing for the existing DNCH Community **limited pilot**. It does NOT change Auth configuration, public registration policy or OpenAI/AI billing.

## New features

- Search by keywords across **titles and post content** using a PostgreSQL indexed generated full-text search field, with the `simple` text dictionary for multilingual matching.
- Existing category tabs continue to work in combination with keyword search.
- Filter topics by **all languages / Bulgarian / English / Other**.
- Sort by **newest / oldest**.
- Browse results in pages of **10 topics** with previous/next controls and total result count.
- Enter/submit search, clear search, and category changes reset pagination. Searching does not require login once the limited pilot interface is available.
- Preserves the existing `?pilot=1` page parameter when navigating back from a topic or after posting a new topic.

## Security

- Search runs through the existing Supabase browser client using the publishable (non-secret) key; **RLS remains responsible** for filtering hidden topics.
- The generated `search_document` column is read-only and indexed with GIN. The browser does not get write access to it.
- The view uses `textContent` for topic data, avoiding arbitrary HTML rendering in search results.
- Keyword text is passed to Supabase's built-in `textSearch` filter with web-search parsing, rather than interpolating raw SQL.
- No new accounts, API keys, secrets, cost or PII storage.
- Only the user-facing interface in pilot mode is changed, not the public pre-launch preview.

## Checks performed

- Supabase migration applied successfully; single existing founder topic found by words from its title and body; nonsensical query returns zero.
- Database query permissions verified: anonymous SELECT allowed under topic RLS; anonymous and authenticated UPDATE of search field denied.
- English and Bulgarian pages have every `forum.js` ID exactly once.
- Frontend JavaScript parsed, and responsive CSS present.
- GitHub Pages browser end-to-end testing and multiple-page pagination remain **untested** until there are enough genuine discussions.

## Next tests

1. Open `bg/forum.html?pilot=1` in the same browser where the founder is logged in.
2. Search for `Welcome` or `DNCH`, and confirm the founding topic appears.
3. Clear the query, change language to Bulgarian (should show no results while the sole topic is English) then back to English.
4. As more topics are published, verify next/previous pagination and sorting.
5. Verify hidden topics remain invisible to unauthenticated browsing.
