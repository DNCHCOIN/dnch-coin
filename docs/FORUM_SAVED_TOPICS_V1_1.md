# DNCH Community v1.1 — saved topics (local bookmarks)

This release adds a lightweight way to revisit interesting DNCH Community discussions without account-sync infrastructure or extra hosted storage.

## Features

- Bookmark any visible discussion using **☆ Save / ☆ Запази** in the topic list or the topic details.
- Saved discussions show **★ Saved / ★ Запазена**; click again to remove the bookmark.
- Use **★ Saved topics / ★ Моите любими** above the search controls to show only bookmarked discussions. A number badge shows how many topic IDs are saved.
- Saved-only mode combines with the existing category, language, full-text search, oldest/newest sorting, and 10-topic paging.
- Maximum 100 local bookmarks per browser profile. Cross-tab changes on the same site update via the browser `storage` event.
- Works in both Bulgarian and English on the same GitHub Pages origin.

## Scope and privacy

- All bookmarks are local browser storage under key `dnch-forum-saved-topics-v1`; no emails, account IDs, post content or secret data are recorded in this feature.
- **Not synchronized** between devices or browsers; clearing browser storage also removes bookmarks. If storage is blocked, bookmarks work until the current page is closed.
- Bookmarking is not a server-side read or write permission: visibility is still determined by existing Supabase RLS.
- The public prelaunch preview stays the same until a visitor opens the existing forum pilot.
- The AI widget stays in **preview**; no OpenAI API activation, billing change, new Supabase table or new login method.

## Acceptance checks

1. Open the Bulgarian forum pilot and click **☆ Запази** on the founding discussion.
2. Confirm the counter becomes 1 and the control changes to **★ Запазена**.
3. Click **★ Моите любими**: the topic remains visible. Filter by English and confirm it remains visible; filter by Bulgarian and confirm no results.
4. Refresh the page and confirm the bookmark persists, then open the English forum on the same origin and confirm it remains saved.
5. Remove the bookmark from the saved-only view and confirm the saved list is empty.
6. Check that anonymous users still cannot view hidden topics and that GitHub Pages has updated to the new JavaScript and CSS version.

Static checks have passed: JavaScript parsing, existence and uniqueness of all forum DOM IDs on both language pages, local storage guards, favorite query composition with existing filters and responsive CSS. Live browser UI interactions still need an owner-side check.
