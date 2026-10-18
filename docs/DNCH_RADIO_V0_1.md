# DNCH Radio v0.1 — official YouTube music player

## What is available

- English `https://dnchcoin.github.io/dnch-coin/radio.html`
- Bulgarian `https://dnchcoin.github.io/dnch-coin/bg/radio.html`
- Dedicated, mobile-responsive music page with a 16:9 **visible** YouTube embedded video player, genre filters (All / Pop / Rock / Dance / Chill / My picks), track choice and previous / next / shuffle selection.
- Four independently verified videos from official artist YouTube channels:
  - Dua Lipa – Levitating feat. DaBaby: `https://www.youtube.com/watch?v=TUVcZfQe-Kw`
  - Nirvana – Smells Like Teen Spirit: `https://www.youtube.com/watch?v=hTWKbfoikeg`
  - The Weeknd – Blinding Lights: `https://www.youtube.com/watch?v=4NRXx6U8ABQ`
  - Coldplay – Yellow: `https://www.youtube.com/watch?v=yKNxeF4KMsY`
- Paste a YouTube URL (watch, youtu.be, music.youtube.com, shorts/live/embed) to add a personal track, or supply a validated 11-character video ID. The local personal list holds up to 20 videos and persists in browser localStorage. Custom title is user supplied, not fetched from the YouTube API.
- Direct **Watch on YouTube** link for unavailable/blocked embeds.
- New navigation link on all main pages, EN/BG, and a homepage Radio card labeled **YouTube player · pilot**.

## Limitations and compliance

**This is not a 24/7 radio broadcast.** No synchronized playback, global playlist, voting, DJ stream, or audio-only playback. A selected video is loaded in the official visible YouTube player and is not automatically started. The user presses Play inside YouTube. Prev, Next and Shuffle change the selected video and do not automatically start audio.

- Do not extract YouTube audio, play in hidden/background players, bypass YouTube monetization or controls, or reward watching with DNCH points/crypto.
- Respect YouTube embedding availability and geographical/age restrictions. Embedding a video does not give DNCH a general broadcast or music synchronization license.
- A YouTube iframe is **not created until the visitor chooses a track**; it uses `youtube-nocookie.com` in privacy-enhanced mode.
- Iframe referrer policy is `strict-origin-when-cross-origin` per YouTube embed requirements. The YouTube controls, branding and ads remain untouched.
- Selecting a video shares data directly with YouTube; see Google's privacy terms. No separate API key, no server-side extraction or external playlist storage is used.
- User's local selections do not synchronize between devices. Clearing browser storage removes them.
- Videos may be blocked from embedding and require viewing on YouTube. This has not yet been verified on the real deployed site/browsers.
- The planned listener voting, 24/7 radio stream, community points and licensing have **not** launched.
- DNCH AI remains in preview and no OpenAI API billing was activated.

## Manual testing

1. Open the EN/BG radio page. Confirm no network request to the YouTube iframe until a song is selected.
2. Select **Nirvana** from Rock and verify the visible YouTube player loads and the external YouTube link points to the corresponding official video.
3. Switch to Pop, Dance and Chill and choose another song; original YouTube player must remain fully visible with controls.
4. Test Previous / Next / Shuffle: selected song changes, with no hidden autoplay.
5. Paste a valid YouTube video link, add a personal title, view it under My picks, refresh the page, then remove it.
6. Reject non-YouTube domains and malformed video IDs. Try `https://youtu.be/yKNxeF4KMsY` (already curated, should reject duplication).
7. Verify navigation from the homepage and other DNCH pages, on desktop and mobile.
8. Verify DNCH AI is still disabled and there are no new Supabase tables or paid integrations.

## References
- YouTube Help: https://support.google.com/youtube/answer/171780
- YouTube Developer Policies: https://developers.google.com/youtube/terms/developer-policies
- Required Minimum Functionality: https://developers.google.com/youtube/terms/required-minimum-functionality
