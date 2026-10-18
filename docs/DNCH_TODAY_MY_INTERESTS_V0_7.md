# DNCH Today v0.7 — My Interests / Моите интереси

## Why
Daily useful content becomes more relevant when readers can choose the subjects they enjoy, without needing an account, tokens or any tracking. This feature is strictly browser-local.

## Implemented in the feature branch
- A bilingual topic-picker below Today's Challenge: Digital safety, Technology, Nature, Creativity, Science and Community.
- The visitor can toggle one or more topics. "All topics / Всички теми" clears the preference and restores the original daily mix.
- New browser-only storage key: `dnch-today-interests-v1` contains just a validated list of selected topic IDs.
- The three daily featured ideas are selected deterministically from the chosen topic pool using the visitor's local date. Each chosen topic contains four curated ideas, and the picker selects three distinct ideas without repeats.
- A day-specific shared URL and its target idea remain readable regardless of selected topics because the full searchable library remains unfiltered.
- The daily challenge is intentionally unchanged by topic selection. This prevents a marked-complete challenge from silently becoming a different task in the same day.
- Existing favorites, sharing, library filters/search, challenge progress, credits and user accounts are not changed.
- No requests to third-party services, user profiles, cookies, analytics or crypto rewards are introduced by this feature.

## Validation completed
- JavaScript parses.
- Simulated English and Bulgarian DOM interactions:
  - selected single topic produces three distinct, matching ideas;
  - adding a second topic persists both IDs and gives distinct picks;
  - invalid IDs in stored preferences are ignored;
  - "All topics" resets stored selection and the original daily picks;
  - Today's Challenge stays fixed when topic preferences change.
- Page HTML contains matching IDs for the new controls in both languages.

## Browser/mobile acceptance checklist (pending)
1. Open EN and BG DNCH Today in Chrome Android and desktop Chrome/Firefox.
2. Select Science, then add Technology. Reload and confirm preferences persist and only those topics appear in the featured three.
3. Choose All topics and confirm the original general daily mix returns.
4. Mark Today's Challenge as complete, change interests and confirm both task and completion status remain unchanged.
5. Check search, the full library, save/unsave favorites and open a shared link with `#idea=...`.
6. Confirm responsive mobile buttons, keyboard focus, contrast and screen-reader labels.
7. Confirm no new outbound requests or account requirement.

## Limitations
- No multi-device sync. Clearing browser storage, using a different browser or private mode may reset preferences.
- The source remains a 24-entry edited evergreen library; it is not a live news feed.
- The selections rotate by local calendar day (refresh on a new day to see changes).
