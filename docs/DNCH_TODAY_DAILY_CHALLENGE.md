# DNCH Today v0.6 — Daily challenge and sharing

## What changed

DNCH Today already rotates **three** editorially curated evergreen ideas each local calendar day. This update does not duplicate that rotation or fabricate live news. Instead it adds:

- **Today's challenge / Днешното предизвикателство:** a highlighted practical action taken from the original unfiltered daily selection. With the later v0.7 personal interests feature, this action stays fixed for the day even if the visitor filters the three featured ideas.
- An **I've done it / Изпълних го** control. Visitors can mark/unmark today's action and see how many of the last seven local calendar days were marked complete.
- Local completion dates in browser storage under `dnch-today-challenge-days-v1`, limited to roughly 90 recent entries on subsequent writes. No email, session identity, content of user activity, server API or rewards.
- A **Share / Сподели** button on every featured and library idea. Mobile devices with Web Share use the native share sheet; other browsers copy a link or show a manual-copy fallback.
- Share links point to a specific idea (`#idea=sec01` etc.). Opening one scrolls to the linked item in the full idea library and visually highlights it.
- Both Bulgarian and English interfaces. Cross-language links select the language of the visited page.
- Existing search, category filters, saved ideas, DNCH Radio, DNCH Community and inactive DNCH AI remain unchanged.

## Boundaries

- Nothing new is fetched from the network by this feature. Featured ideas are **rotating evergreen content**, not current headlines.
- Checked days are stored only in the **current browser**. Clearing site data, private browsing or changing device can remove/lose progress. There is no account synchronization.
- Checking the box is entirely self-reported and does not award points, money or crypto.
- The date and streak count use the visitor's **local calendar**, and update when the page reloads on a new day.
- Sharing uses browser APIs and may need the user's manual action in certain browsers. No social media API, tracking ID, or OpenAI service is involved.

## Acceptance tests

1. Open BG and EN DNCH Today; confirm the daily challenge displays one of the three existing featured ideas, with its practical action.
2. Mark complete, refresh, and verify status persists for today; uncheck and verify count updates.
3. Share a featured idea: on mobile use the system share sheet. On desktop verify link copies or a manual-copy prompt appears.
4. Open a shared link such as `https://dnchcoin.github.io/dnch-coin/bg/today.html#idea=sec01`. It must scroll to that item in the library.
5. Verify saving bookmarks, searching, category filters and the three rotating featured cards still work.
6. Check layout and readability at narrow mobile widths.

Static JS parse, expected DOM identifiers and both language pages can be checked without a browser. Full interactive tests should be performed after GitHub Pages deployment.
