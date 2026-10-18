# MY DNCH HUB v0.1 — Local-first personal dashboard

## What is launched

- **MY DNCH** has a dedicated responsive dashboard at `/my-dnch.html` (English) and `/bg/my-dnch.html` (Bulgarian).
- All 14 pre-existing site pages link directly to it using the same relative `my-dnch.html` route for each language directory.
- The dashboard is **local to each browser and device** and does not claim to represent a signed-in account or server record.
- Four spaces:
  1. **MY TODAY** — saved DNCH Today ideas with their names and deep links to `today.html#idea=<id>`; today's locally marked challenge and completed days in the most recent seven-day calendar window.
  2. **MY MUSIC** — personal YouTube videos saved in DNCH Radio, with their provided titles and explicit links to YouTube. Also a link back to DNCH Radio. No playback logic changed.
  3. **MY COMMUNITY** — locally saved topic IDs with direct links to the limited pilot forum. Actual visibility and moderation remain enforced by the existing forum and Supabase RLS.
  4. **MY PROFILE** — optional **local greeting name** (up to 32 characters). Clearly not the official DNCH forum account, and not synced to any server.
- Dashboard content refreshes on window focus, on the Refresh button, and when another tab changes the applicable localStorage values.
- Empty-state explanations tell new users how to start saving content in the original feature pages.

## Read-only reuse of existing data

| Source | Existing localStorage key | Purpose |
|---|---|---|
| DNCH Today | `dnch-today-favorites-v1` | Saved idea IDs (24 currently known titles) |
| DNCH Today | `dnch-today-challenge-days-v1` | Daily challenge completion days |
| DNCH Radio | `dnch-radio-personal-v1` | User-added YouTube IDs and titles |
| DNCH Community | `dnch-forum-saved-topics-v1` | Saved discussion IDs |
| MY DNCH | `my-dnch-local-alias-v1` | Optional browser-only greeting |

No Supabase SQL migrations, Edge Functions, OpenAI API settings, crypto wallet access, media player changes, new registration workflow, tracker, or paid APIs have been introduced.

The existing English/Bulgarian idea title catalog is copied from the **24 curated titles** in `assets/today.js` into `assets/my-dnch.js`. Keep them aligned when editing the existing ideas list. This is intentionally static and avoids downloading content or modifying the existing Today content engine.

## Trust and privacy boundaries

- Data is validated before displaying: safe idea IDs from known catalog, YouTube 11-character IDs, topic UUIDs, ISO date strings, max 20 displayed personal song entries and max 100 bookmarked ideas/topic references.
- All potentially user-defined strings are written using DOM `textContent`; no unsanitized `innerHTML` use.
- Music links target `https://www.youtube.com/watch?v=<validated_id>` and open on user action. Embedded radio player is left untouched.
- Forum links include `?pilot=1#topic=<validated_id>`. Hiding/deleting a topic server-side is **not overridden** by a saved local bookmark.
- Local nickname is never treated as authenticated identity. It should not be used for authorization or to imply account verification.
- Clearing site data / changing browsers or devices may remove the saved information. There is no cloud restore yet.
- Cross-language browsing on the **same GitHub Pages origin** shares the local saved items; that is not cross-device synchronization.
- DNCH AI remains in its existing disabled preview mode.

## QA evidence and remaining checks

1. JavaScript syntax check passed; all referenced element IDs were found once in each of the new language pages.
2. The 24 English/Bulgarian idea titles were compared with the original Today source data and matched.
3. Every one of the 14 existing page navigation menus was checked for exactly one MY DNCH entry.
4. Dashboard JS executed in an isolated DOM/localStorage test with synthetic saved ideas, daily challenge, YouTube songs, and forum UUIDs. All nine checks passed for valid/deduplicated counts, deep links, saved alias, clear alias and cross-tab storage-event refresh.
5. Browser end-to-end layout and persistence checks on the live deployed GitHub Pages page remain outstanding.

### Suggested browser smoke test
Open `/bg/my-dnch.html` in the same browser previously used for DNCH Today/Radio/Community. Favorite counts should match. Save a new song or idea in its source section, return to MY DNCH, and check that the number and list update. Change to the English MY DNCH page on the same origin and confirm data persists. Confirm clearing the local greeting does not delete any bookmarks. Try a narrow mobile screen.

## Next phase — not yet implemented
Unified real accounts with opt-in cloud sync, secure account-specific Supabase RLS policies, data migration consent/merge, verification and user privacy controls. Separate planning/approval required.
