# DNCH Radio v0.2 — Sleep timer / Таймер за спиране

## Feature
- A bilingual 5, 15, 30, or 60 minute **Stop after** timer appears below the visible YouTube player controls.
- The visitor must first select a track. Pressing Start begins a page-local countdown; pressing Cancel leaves playback untouched.
- The timer **persists while the user navigates tracks inside DNCH Radio**, without changing or autoplaying YouTube videos.
- On expiry, the embedded iframe is removed from the DOM. This stops playback inside this DNCH page; it does not control YouTube tabs/apps opened separately.
- Countdown uses a `Date.now()` deadline so normal tab throttling does not accumulate timing drift. `visibilitychange` and `pageshow` check the deadline when users return.
- If a selected personal track is deleted and the iframe is removed, the timer is canceled. Setting another timer replaces the previous one.
- No server calls, YouTube Data API, hidden player, media extraction, downloads, accounts, blockchain, reward points, notifications or advertising changes.
- The forum preview is now clearly labeled as not-yet-live in the Radio nav, and music suggestions link to the currently available Ideas Lab rather than inviting users to post into the inactive forum.
- The public, opt-in offline PWA cache name increases to `dnch-mobile-public-v6`; auth/forum/private API paths remain excluded.

## Limits and privacy
- The timer exists **only in the currently open DNCH Radio page**. Reloading, leaving, or closing the page cancels it. No personal information or timer state is persisted.
- Background/browser sleep modes may delay JavaScript timers, meaning the stop can occur late. The timer is not a guaranteed sleep alarm.
- The feature stops only the **visible YouTube iframe selected inside DNCH**. It cannot stop content running in the external YouTube app or another tab.
- YouTube playback remains manual in the visible official iframe. Video embedding restrictions, availability, monetization and YouTube controls still apply.
- All original local personal playlist behavior remains unchanged.

## Validation performed
- JavaScript syntax validation.
- Mock browser tests for **both BG and EN**:
  1. No YouTube iframe loads before explicit song selection.
  2. Start button disabled before track selection, enabled afterwards.
  3. Countdown starts from 05:00 and advances correctly.
  4. Changing tracks retains the timer.
  5. On expiry, the iframe disappears, one timer is cleared, buttons return to their idle states.
  6. Canceling the timer does not remove or restart the player.
  7. After a simulated background delay, returning to the page stops the expired iframe.
- HTML control IDs checked in both language pages.
- Service-worker JavaScript syntax verified after cache version bump.

## Phone/desktop acceptance still required
1. Load EN/BG Radio in Android Chrome and desktop Chrome/Firefox.
2. Confirm no YouTube request occurs until a video is selected.
3. Select a curated video, press Play within YouTube, start the 5 min timer.
4. Use Next and Shuffle: selection should change without autoplay; timer should keep counting down.
5. In a second test, cancel and confirm the existing player continues.
6. Confirm the selected iframe disappears after timer expiry and can be reloaded by selecting another song.
7. Background the browser briefly and return; verify countdown is based on elapsed clock time.
8. Check the 5/15/30/60 choices, keyboard navigation, accessible status messages, portrait mobile layout and PWA refresh.
9. Confirm personal picks still add/remove and survive page reload, while active timer **does not** survive reload.

## Previous version
See `docs/DNCH_RADIO_V0_1.md` for curated music choices, YouTube compliance boundaries and full original acceptance checklist.
