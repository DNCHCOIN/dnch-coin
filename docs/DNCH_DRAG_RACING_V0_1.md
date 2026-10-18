# DNCH Drag Racing v0.1 — First playable DNCH game

## Launch paths
- EN: `https://dnchcoin.github.io/dnch-coin/drag-racing.html`
- BG: `https://dnchcoin.github.io/dnch-coin/bg/drag-racing.html`
- Added **DNCH Games** to the navigation of 12 public Hub pages; homepages also feature a prominent Play Drag Racing card.
- PWA manifest shortcuts point to the game in both languages. Offline public asset cache incremented from v3 to v4 and optionally includes static race game files. No new SDK, account, database or API needed.

## Gameplay (free arcade prototype)
- Three **fictional** cars: V8 Street Beast, Turbo Spark and Midnight Muscle. No manufacturer trademarks or third-party racing images.
- One-quarter-mile head-to-head AI competition: **402.336 metres**. Standing start with a three-light countdown, full-throttle acceleration and manual gear shift timing. Early throttle applies an in-game 0.35 s time penalty.
- Optional automatic gearbox for touchscreen accessibility. Five gears, RPM redline around 7200, one nitro boost after second gear, short shift delays.
- Animated top-down 2D drag lanes with competitor, launch tree, finish stripe, scrolling track, live speed in km/h, RPM, gear, distance, progress and elapsed time.
- Touchscreen: START, hold GAS, SHIFT, NITRO. Keyboard: ENTER starts, RIGHT ARROW/W holds gas, SPACE/UP shifts, N uses nitro. You can race again after the finish.
- Garage upgrade levels 0–3: engine output, tyre grip, gear shifting speed. Fictional **game credits (CR)** for completed races, initially 300 CR, upgrades cost 100–450 CR depending on part and level.
- Each car has its own personal best and purchased parts; lifetime wins/races and current game credits are saved in browser localStorage under `dnch-drag-v1`.
- Local game credits have **no financial or crypto value** and are not tied to DNCH Coin or the Supabase user account. No ads, purchases, deposits, gambling or promises of rewards. No online rankings or multiplayer yet.
- Clearing browser data erases the game save. MY DNCH export and cloud sync do not yet include game data.

## Architecture
- `assets/drag-engine.js`: dependency-free deterministic arcade simulation, progression model and save sanitization; public window export `DNCH_DRAG_ENGINE`.
- `assets/drag-game.js`: canvas presentation, HUD, garage, keyboard/pointer input and localStorage integration; no global API key and no network request.
- `assets/drag-game.css`: responsive layout styled with DNCH dark-and-gold brand; mobile layout uses a five-gauge dashboard and two-column large touch controls.
- `drag-racing.html` and `bg/drag-racing.html`: translated pages, proper metadata and PWA links.
- Existing DNCH Radio embeds, forum signup pilot, DNCH ID cloud data, and AI settings are **unchanged**.
- Service worker continues to cache only fixed public same-origin paths. The game is an **optional** offline resource, so an interrupted game download cannot break MY DNCH's core offline shell. Already cached game resources are usable without internet; nothing cloud-backed is implied.

## Tests performed
**Code-level automated simulations, not a live-browser end-to-end test:**
- Engine JavaScript syntax parsed; 6 / 6 simulated 402 m races (three cars × manual/auto shift) finished against their AI rivals in approximately 13 seconds with nitro and reasonable shifting.
- Additional engine checks: upgrades cost credits and increase stats, insufficient balance rejected, malicious/stale save data sanitized, nitro locked before gear 2, countdown advances only through simulation frames, acceleration waits until the start light, manual finish and earned game credits.
- Complete UI controller run in mock Canvas/DOM in **both EN and BG**: three car choices, initial credits, START countdown, holding gas with simulated pointer action, auto shift, finishing, awarded credits, saved personal best and no unrelated wallet/session data. All checks passed.
- Matched all **23** controller DOM IDs on both language pages; detected and corrected a missing elapsed-time element in initial layout.
- Checked 12 public navigation pages, the BG/EN home promo links, both game asset paths, both PWA manifest shortcuts, service-worker v4 asset allowlist and DNCH AI remaining `enabled: false`; all static checks passed.

## First manual acceptance test (real phone)
1. Open BG `https://dnchcoin.github.io/dnch-coin/bg/drag-racing.html` on Android Chrome or iPhone Safari. Wait for GitHub Pages deploy to propagate.
2. Pick the V8. Press **СТАРТ**, wait for the green light, hold **ГАЗ**. Use **СМЯНА** before the RPM bar turns red, then **НИТРО** after shifting to 2nd. Alternatively enable automatic shifting.
3. Reach the finish; observe winner/loser time and added game credits. Press **СТАРТ** again for another race.
4. Buy a garage upgrade and race again. Refresh: selected car, upgrade, credits and best time should persist in the same browser.
5. Switch language using EN / BG link. Check controls and the game save remain on the same device.
6. Install DNCH PWA and test the game shortcut. If the game page has been cached, repeat with airplane mode enabled. YouTube music and forum functions remain online-only.
7. Test desktop keyboard START/GAS/SHIFT/NITRO, mobile touch orientation, reduced motion, and no accidental scrolling while holding gas.

## Future (not part of v0.1)
- Better vehicle animation and sound with opt-in audio/mute.
- More drag classes, garage paint options, rear-wheel/4×4 handling, clutch, 1/8-mile and 1/2-mile modes.
- Server-authoritative race validation and fair leaderboard with anti-cheat.
- Privacy-safe, expressly opt-in game-save sync under DNCH ID only after the account pilot security gates pass.

**No leaderboard or crypto integrations were activated.**
