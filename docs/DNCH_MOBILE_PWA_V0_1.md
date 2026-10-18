# DNCH Mobile v0.1 — installable Progressive Web App

**Goal:** Android and iPhone visitors can put DNCH Hub on their home screen with a genuine app icon and standalone browser experience. No app store submission, new Supabase dependencies, API keys, payments or changes to music playback.

## What's shipped

- EN and BG manifests (`manifest.webmanifest`, `manifest-bg.webmanifest`) with a shared stable app ID `/dnch-coin/` and GitHub Pages scope `/dnch-coin/`.
- Launches directly into `my-dnch.html` (English) or `bg/my-dnch.html` (Bulgarian), with shortcuts for MY DNCH, DNCH Radio and DNCH Today.
- Optimized PNG install icons at `assets/icons/dnch-192.png` (192×192) and `assets/icons/dnch-512.png` (512×512); Apple touch icon included.
- Install metadata and a scoped registration helper on the **12 public EN/BG pages** (Home, MY DNCH, Today, Radio, Ideas Lab, Our Story). Intentionally not injected into admin or forum sign-in pages.
- Install button on Home and MY DNCH; Android/Chromium supported native prompt is invoked **only after clicking**. iPhone Safari instructions explain Share → Add to Home Screen. Other browsers may offer installation through their own menu.
- A conservative, public-only service worker and bilingual offline fallback page.

## Android

1. Open `https://dnchcoin.github.io/dnch-coin/bg/` in Chrome.
2. Tap **Инсталирай DNCH**, if Chrome makes the native app prompt available. If the native prompt is not available, use the Chrome menu's **Install app** or **Add to Home screen** option.
3. An icon named **DNCH Hub** should appear on the home screen; launching it opens MY DNCH. Exact steps and browser support vary.

## iPhone/iPad

1. Open the Bulgarian homepage in **Safari**.
2. Tap **Инсталирай DNCH** on the page to view instructions.
3. Tap Safari's **Share** control, choose **Add to Home Screen**, and confirm. iOS support varies by version/browser.
4. Open DNCH Hub from the home screen.

## Offline mode and security

- Only explicitly listed **public, static DNCH pages and assets** can be stored, refreshed network-first, or served from cache. The worker is versioned `dnch-mobile-public-v1`.
- Pages include Home, MY DNCH, Today and Radio plus their public JS/CSS. The offline landing page explains missing capabilities.
- **No forum or admin HTML, sign-in/OTP callbacks, tokens, Supabase results, wallet actions, paid APIs, private JSON, external YouTube frames, account data or cross-origin traffic is cached.**
- Requests with query strings are never intercepted/cached. Existing forum pilot access via `?pilot=1` is unaffected.
- Online content wins over cached content; cached static content is used only when offline.
- Previously opened MY DNCH/Today pages can still show their locally saved material without an internet connection. **The YouTube player, forum interactions and live external services always require internet.**
- Saved items, localStorage keys, optional nickname and backup export/import stay as before; installing does not create cross-device synchronization or a verified account.
- Cache might use device space and can be cleared by the browser/OS. Normal browser limitations apply.
- Upgrading to a future app version replaces only caches named `dnch-mobile-public-*`. No other service worker caches are deleted.

## Static test plan

1. Verify each of the two manifests parses as JSON, has the same `id` and `scope`, required 192/512 PNG entries, correct language-specific start URL, and real matching assets.
2. Verify the 12 public pages each include a manifest link with correct relative path, matching Apple touch/icon paths, and PWA registration script. Home + MY DNCH have install buttons.
3. Verify service worker is syntactically valid and caches only the allowlisted same-origin paths; queries and unknown paths are excluded.
4. Ensure `assets/dnch-ai-config.js` still contains `enabled: false` and radio code is unchanged.
5. Test on real Android Chrome: install prompt or menu, icon, installed launch page, back/navigation, portrait layout, and audio behavior.
6. Test on real iOS Safari: Add to Home Screen, icon, standalone navigation, and local saved content.
7. With Wi-Fi/mobile data disabled, revisit a previously loaded public page; confirm cached content or bilingual offline fallback. Verify YouTube clearly does not falsely claim to play offline.
8. For forum sign-in and admin pages, confirm online-only behavior with no stale cached account details.
9. If installed once in English and once in Bulgarian, manifest ID should identify one app rather than creating unrelated duplicate apps (browser handling may differ).

**Deployment:** GitHub Pages may take a few minutes after merging a PR. A real mobile install and offline field test cannot be asserted from static repository checks.
