# MY DNCH HUB v0.2 — Backup & Restore

Owner-approved upgrade to the MY DNCH local-first dashboard.

## Browser experience
- Open [MY DNCH (EN)](https://dnchcoin.github.io/dnch-coin/my-dnch.html) or [MY DNCH (BG)](https://dnchcoin.github.io/dnch-coin/bg/my-dnch.html).
- **Export my data / Изтегли моите данни:** click to download `dnch-my-backup-YYYY-MM-DD.json`. This is produced locally via a browser Blob URL. No upload or API request is made.
- **Restore / Възстанови:** choose that file in another browser or device, inspect the preview table (current count, imported count, proposed merged count), then click **Confirm & merge / Потвърди и обедини**. Cancel leaves everything as before.
- Existing saved entries are kept and incoming entries are appended if not duplicated and capacity permits. Existing local greeting nickname wins over the imported nickname if already present. The UI explicitly warns about the limits.
- Once a restore succeeds, the MY DNCH dashboard instantly refreshes via `my-dnch-data-updated` event; other tabs react via browser `storage` events as before.
- Both languages have the same privacy, file-size, confirmation and safety notices.

## File format

```json
{
  "format": "dnch-my-backup",
  "version": 1,
  "exportedAt": "2026-10-18T15:00:00.000Z",
  "data": {
    "ideas": ["sec01"],
    "challengeDays": ["2026-10-18"],
    "music": [{"id": "hTWKbfoikeg", "title": "Nirvana"}],
    "forumTopics": [],
    "nickname": "Example"
  }
}
```

Only these **five** local browser keys are read and exported:
- `dnch-today-favorites-v1`
- `dnch-today-challenge-days-v1`
- `dnch-radio-personal-v1`
- `dnch-forum-saved-topics-v1`
- `my-dnch-local-alias-v1`

Do **not** add Supabase auth/session data, wallet secrets, private keys, device identifiers, paid APIs, browser history or arbitrary localStorage keys to this allowlist. This file is **not encrypted**: anyone who obtains it can read its contents, including the voluntary local nickname.

## Validation and security
- Upload size limit: **64 KiB**. JSON parsing happens inside the browser; no server upload.
- Strict format/version checks (other versions rejected), timestamp required, unexpected top-level or data fields rejected.
- Exact known curated idea IDs (24), maximum 24 IDs.
- ISO `20xx-MM-DD` date validation (calendar-valid), maximum 90 challenge dates.
- YouTube video ID validation (11 allowed characters), nonempty user-defined titles capped at 80 characters and strictly limited to `id`/`title` fields, maximum 20 music entries.
- Forum topic ID must be a UUID in canonical shape, maximum 100 entries.
- Nickname must be a string of no more than 32 characters, no control characters.
- Duplicates removed by ID in individual lists and skipped when merging with existing items.
- No unsanitized `innerHTML`, no evaluation of imported content, no dynamic external URLs beyond existing validated YouTube links.
- **Two-step restore:** selecting a file only reads, validates and displays a preview. The user must click a separate confirmation button to write.
- If current browser data changes between preview and confirmation, confirmation is aborted so the user can review a current preview again.
- Writes to localStorage use the same five allowlisted keys; best-effort snapshot rollback restores their previous values when a storage write fails. Because localStorage is not a transactional database, in severely restricted environments rollback cannot be absolutely guaranteed; the UI reports failure.
- Cross-device transfer requires the human user to move the downloaded file themselves. No automatic cloud sync or account migration.
- DNCH Radio playback and preview-only DNCH AI are unchanged.

## Tests
- JavaScript parsed successfully and all 8 new DOM IDs occur once on both BG/EN pages. CSS, script references and dashboard refresh event were checked.
- Isolated DOM/storage execution exercised **16 checks, all passed**: file format, secret exclusions, export fidelity, preview isolation, preview table, preserving local favorites, adding music, deduplication, preserving nickname, refresh event, unrelated keys unchanged, malicious ID rejection, stale-preview cancellation, cancel action and simulated-storage-error rollback.
- Browser end-to-end testing (mobile file picker, downloads and cross-device transfers) remains to be confirmed after GitHub Pages deploys.

## Manual acceptance checklist
1. In the same browser as DNCH Today, Radio and Forum, open MY DNCH and click Export. Ensure a JSON file downloads.
2. Open the JSON file to verify only the five expected data types are present; never paste private keys.
3. Select that same file on MY DNCH. Verify preview appears and existing items are not immediately changed. Press Cancel.
4. In a second browser, select the file, review the counts and press Confirm & merge. Revisit Today, Radio and Forum to confirm saved items.
5. Import the same file again; duplicates should be skipped and counts unchanged.
6. Try random JSON or a file larger than 64 KiB; it should be rejected without writing.
7. Verify on BG/EN mobile screens, then try adding a new saved item after restore and refresh the MY DNCH summary.
