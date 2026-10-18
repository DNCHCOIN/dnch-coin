# DNCH ID v1.0 — private owner pilot (18 October 2026)

## Release state

DNCH ID v1.0 is an **invitation-only pilot**, not an open registration system. It reuses the existing Supabase Auth session from the DNCH Community forum. Users already have access to the forum's email magic-link sign-in, but the forum client now explicitly sends `shouldCreateUser:false` for its email OTP request. **This client-side choice does not disable Supabase's Auth signup endpoints globally.** Server-wide signups must be reviewed and explicitly restricted in Auth settings before inviting outside testers. Current built-in SMTP limitations mean email access is not suitable for public onboarding.

No password UI, API key billing, paid SMTP or mass email invitations are enabled. Do not enable public signups before the release gates below.

## Database security (applied to project `wthzcqgzcbkvhovtcmoe`)

Migration: `supabase/migrations/20261018_dnch_id_v1_pilot.sql`, applied as `dnch_id_v1_private_pilot_owner_data`.

1. `public.dnch_account_pilot_members`: allowlist of approved existing `auth.users`. Existing forum administrator UUIDs were copied into the allowlist without hardcoding them in the migration. Only trusted DB administration may add future pilot accounts. Browser `authenticated` role has own-membership SELECT **only**; no insert/update/delete.
2. `public.dnch_account_data`: one JSONB record per `auth.users.id`. `user_id` is the primary key, with `ON DELETE CASCADE` for permanent account deletion. JSONB has required shape/type checks and a hard cap of 16,384 bytes plus limits on arrays and nickname.
3. RLS is enabled on both tables. Pilot data SELECT, INSERT, UPDATE and DELETE are allowed only when `user_id = auth.uid()` and the authenticated user is on the pilot allowlist. Other users and `anon` cannot read the records or grant membership.
4. The only client-side Supabase key is the existing **publishable** key. No service role, auth JWT, wallet private key or secret is stored in repository code or uploaded as user preferences.

### Actual database validation

- Both tables: `rowsecurity=true`, 1 membership SELECT policy and 4 owner-data policies.
- `anon`: no table SELECT privilege on account data.
- `authenticated`: own membership SELECT allowed, membership INSERT denied.
- Current private pilot: **one** approved existing forum admin, zero cloud records after tests. No fake customer data was left behind.
- Under `SET LOCAL ROLE authenticated` plus the known existing pilot user's JWT subject, an owner INSERT/SELECT works; the whole transaction was rolled back.
- Under the same role with a synthetic nonmember subject, no allowlist rows are visible and an attempt to insert another user's record fails with **SQLSTATE 42501: new row violates row-level security policy**.

This validates owner access and nonmember insert blocking. Real multi-account cross-user tests and production auth redirect/SMTP tests remain on the release checklist.

## Browser UI

Bilingual `MY DNCH → DNCH ID` panel, powered by `assets/dnch-account.js`.

- Signed-out users are sent to the **existing pilot forum sign-in**, rather than being offered signup.
- The page calls `auth.getUser()` before accessing the cloud, then verifies current user's server-side allowlist membership.
- **Prepare cloud backup** collects only five existing local browser fields: saved idea IDs, completed challenge dates, saved YouTube IDs/titles, saved forum thread IDs and optional local nickname.
- **Confirm** explicitly uploads a complete user-chosen snapshot, replacing the previous cloud copy. No background or automatic sync. Upload rechecks session, local data and cloud version, including an optimistic `updated_at` condition for updates.
- **Preview cloud restore** shows existing/browser, cloud and expected merged item counts. Confirm restores into existing localStorage while preserving local items and nickname when present. Duplicate IDs are skipped; array lengths remain bounded. A best-effort rollback runs if browser storage fails.
- **Delete cloud copy** requires an explicit browser confirmation and deletes only the signed-in owner's row, guarded by the last known update timestamp. Local data remains untouched.
- All data fields are validated before use. User-provided strings are inserted using `textContent`, never raw HTML.
- Existing `MY DNCH Backup & Restore` JSON download remains an independent offline export/import option, and does not require a DNCH ID account.
- Session sharing with the forum uses the Supabase JS client's normal same-origin storage, not a new invented login method. Website and installed PWA on the same origin typically share state according to browser limitations.

## QA performed

- JavaScript syntax passed; 13 code-referenced element IDs were found exactly once on each BG/EN page.
- Mock browser environment: **13/13** checks passed for eligible and noneligible signed-in users, signed-out guest behavior, preview without writes, cancel, save after confirmation, no session secrets in cloud record, restore merge, dashboard refresh, and confirmed vs canceled deletion (before the additional deletion-version safeguard).
- Database role/RLS tests: positive owner write/read in a rollback transaction, nonmember invisible rows, nonmember cross-owner insert denied, anonymous table SELECT denied.
- Supabase security linter repeated after migration and did not report any RLS issues on the two new tables.
- `assets/forum.js`: pilot sign-in uses `shouldCreateUser:false` to avoid creating new users through this interface.
- PWA cache upgraded from public v2 to public v3, with `assets/dnch-account.js` required for fully cached core MY DNCH pages, keeping sensitive Supabase requests out of the service worker.

## Outstanding checks / blockers before public accounts

**Do not announce DNCH ID as a public sign-up or automatic sync service yet.** Confirm:

1. Server-side Supabase Auth signup policy is restricted while invitation-only testing proceeds; verify email provider configuration and redirect allowlist, including forum confirmation callback. The connector did not expose a direct Auth configuration editor, so this was **not** changed or verified here.
2. Configure a supported SMTP/email solution and check its recurring cost **only after explicit owner approval**. Existing default mail limitations will impede general public signup.
3. Enable/review leaked-password checks before launching password-based authentication (currently disabled; password-based registration has not been added here): https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
4. Review `public.dnch_ai_reserve_daily_request()` — Supabase warns it is an authenticated-executable SECURITY DEFINER RPC. The function itself checks forum admin membership, and DNCH AI remains disabled. Review executable grants before any AI rollout: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
5. Verify pilot RLS with **two real accounts** and two real browser sessions, including cross-user read/update/delete denials, consent during cloud restore, and revoked membership behavior.
6. Validate the real Android PWA, iOS Safari, offline behavior and magic-link redirect, plus successful account login and upload/restore by the approved account.
7. Document account deletion/privacy retention and complete regional legal review before launching to an international public audience.

## Manual pilot smoke test

1. Open `https://dnchcoin.github.io/dnch-coin/bg/my-dnch.html#dnch-account`.
2. If not signed in, use the forum pilot link to sign in with the existing approved account; do not attempt a fresh signup.
3. Return to DNCH ID and confirm the panel identifies a permitted pilot account.
4. Save a personal song or idea in DNCH Radio / DNCH Today. Select **Подготви облачно запазване**. No network upload should happen until **Потвърди**.
5. Confirm the cloud backup, switch browsers/devices and sign in with the same pilot account. Review **Прегледай облачно възстановяване**, then confirm a merge.
6. Check existing favorites remain, no duplicate items are added, and the local Backup & Restore export works as before.
7. Test Cancel and deleting the cloud copy; local data must remain.

Known limits: no automatic multi-device merge, no public signup, no custom roles UI, and no guarantee that the current default Supabase email sender will reach outside pilot addresses.
