# DNCH Mobile v0.2 — PWA reliability and security regression pass

This is a targeted follow-up to DNCH Mobile v0.1, before any public-account / Supabase Auth rollout. **It is not a comprehensive security audit of the entire DNCH ecosystem.**

## Fixed: broken offline updates could erase a healthy cache

Previous `service-worker.js` installed a new cache using `Promise.allSettled` for **every** asset and then called `skipWaiting()` even if required files failed to download. On activation it deleted old `dnch-mobile-public-*` caches. Consequently an offline / partial deployment update could leave the user with a partially empty app shell.

v0.2 uses version `dnch-mobile-public-v2` with two pre-cache tiers:
- **Required core:** both EN/BG home pages, both EN/BG MY DNCH pages, the offline fallback, shared site CSS, MY DNCH CSS/JS + backup JS, and the PWA registration helper.
- **Optional files:** static Radio, Today, manifests, icons, etc.; failures don't block install, because online pages use network-first behavior.

If any required file cannot be loaded successfully as a same-origin basic response, the new worker's install **fails**, the incomplete v2 cache is removed, and the existing active v1 worker/cache are left alone. Only after required files are fetched does the new worker activate and remove the obsolete v1 app cache.

The client uses network-first for allowlisted public pages. An offline request or a temporary HTTP 5xx response now uses a cached copy or the offline fallback if available. A genuine HTTP 404 or 403 **is not disguised** by a stale cached page. Other requests are not intercepted.

### Cache scope and identity

- Only GET requests to an explicit allowlist of same-origin public paths under `/dnch-coin/`.
- Query-string requests bypass the worker entirely. This protects sign-in callbacks and pilot flags from accidental caching.
- Forum and admin HTML pages, Supabase API/Auth and YouTube external requests are excluded.
- Sensitive storage/auth states are not serialized into SW responses by this project. No user-specific secrets are embedded in the static pages.
- `dnch-mobile-public-v1` is removed only on a **successful** version 2 activation; unrelated caches are not deleted.
- User's MY DNCH browser localStorage / saved ideas / backups are never touched by cache deletion.

## Fixed: ambiguous offline experience

A small, accessible BG/EN status banner appears when `navigator.onLine === false` and disappears when the browser reports network access again. It does not issue periodic polling, does not claim to verify actual connectivity, and appears on the 12 public pages already loading `assets/pwa.js`. It sits bottom-left to avoid the existing AI preview bubble. It explains that cached pages may work while YouTube and forum interactions require internet.

Native install remains opt-in. Android's install prompt is invoked only after the user taps **Install DNCH** and the browser fires `beforeinstallprompt`. On iPhone, the site continues to show Safari's Share → Add to Home Screen instructions. App shortcuts and manifest IDs are unchanged.

## Simulated tests performed

A mock Service Worker environment with cache, network, Request, URL and lifecycle events ran **17 / 17** assertions:
1. Failed required precache rejects new worker install.
2. Existing active v1 cache survives.
3. Incomplete v2 cache is deleted.
4. Broken worker does not call `skipWaiting`.
5. Optional asset failure does not reject a valid update.
6. Required v2 shell is cached.
7. Old v1 cache is deleted **only** after successful v2 activation.
8. Auth callback query bypassed.
9. Pilot forum excluded.
10. Admin excluded.
11. YouTube cross-origin excluded.
12. POST request excluded.
13. Network-first response for allowed pages.
14. Saved public page served offline.
15. Unknown path not intercepted.
16. Temporary HTTP 5xx serves existing public cached page.
17. HTTP 404 returned as 404, not hidden.

A mock PWA page environment also checked Bulgarian iPhone and English Android flows:
- Status indicator starts in correct state and updates on `online`/`offline` events.
- Banner uses accessible status role.
- Worker registration URL and scope resolve under `/dnch-coin/`.
- iOS receives home screen instructions.
- Android prompts only following a user click and a recorded `beforeinstallprompt` event.

**These are code-level simulations, not evidence of successful installation or background updating on real devices.**

## Required live-device verification before account rollout

1. Load the Bulgarian home page on Android Chrome. Confirm install button, manifest icon and installed launch to MY DNCH. Test iPhone Safari separately.
2. Visit MY DNCH and Today online, then turn on airplane mode. Confirm saved pages load (when fully cached), banner appears and disappears on reconnection. Confirm YouTube does not claim to play offline.
3. Simulate a temporary server outage in a controlled environment and confirm cached public page displays, but a genuine missing URL does not.
4. While update installation is artificially interrupted, confirm previous PWA cache remains usable. Test repeated Chrome loads to allow the new worker to retry updating.
5. Check that forum sign-in, Supabase auth, wallet and admin routes never show cached sensitive content.
6. Confirm local MY DNCH bookmarks and Backup & Restore have not changed or disappeared after PWA updating.
7. Verify BY VERSION change from v1 to v2 only affects `dnch-mobile-public-*` caches.

### Remaining separate release gate for real accounts

Before any public Supabase Auth rollout, review email/SMTP send limits, password protections, email redirect configuration, user profile ownership, admin-only RPC functions, and RLS policies with authenticated-user negative tests. This PWA update does **not** enable or modify auth, SQL, paid AI, or music streams.
