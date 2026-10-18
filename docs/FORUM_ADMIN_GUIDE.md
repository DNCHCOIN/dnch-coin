# DNCH Community v0.7 — moderator panel

## Status

Pilot moderation controls, not a production-ready moderation operation. The owner-confirmed Auth account is the initial admin. No frontend-controlled or user-selectable "admin" nickname grants moderation privileges.

## Access

- English: `https://dnchcoin.github.io/dnch-coin/admin.html`
- Bulgarian: `https://dnchcoin.github.io/dnch-coin/bg/admin.html`
- Sign in first through the matching forum page with the existing verified Supabase email account. The "Admin panel" link appears only when the logged-in user has a matching `forum_admins` RLS entry.
- Both admin pages are static and publicly retrievable HTML. **Authorization is in Supabase row-level security and database privileges**, not in HTML visibility or obscurity of the address.
- No service role API key is ever placed on the frontend.

## What admin can do

1. See reports and their reasons, then mark reviewed or dismissed.
2. Hide/restore threads and replies (non-destructive); lock/unlock threads.
3. See public forum member pseudonyms and their signup dates. Suspend or restore a member's ability to post or reply; this does not delete the account or revoke sign-in.
4. Continue using the regular forum account with normal permissions.

## Important boundaries

- Only the database owner can grant another admin. The `forum_admins` table grants no INSERT/UPDATE/DELETE rights to `anon` or `authenticated`.
- Admins can edit only moderation columns. They cannot edit other users' posts, change passwords, promote accounts or read Auth email addresses from the public API.
- Post suspension is enforced by RLS on topic/reply INSERT, not only the user interface.
- Report contents can contain untrusted text. Always render as plain text; never as HTML.
- Moderation actions are not currently recorded in a dedicated immutable audit log. Do not operate at scale before adding one.
- Existing open-registration pilot is **not** suitable for a public launch: configure production email/SMTP, anti-spam controls, a moderation contact, terms/privacy and self-service account deletion.
- The current internal demo uses a project-owner Auth session and the shared Supabase project. Test with a separate non-admin account before general release.
- Ensure stolen or expired login links are not forwarded. Project administrators should enable MFA for their own Supabase dashboard accounts.

## Manual acceptance test

1. Open admin link signed out: must show access denied and no forum data.
2. Open with the confirmed owner account: all three tabs should render.
3. Confirm the founding topic appears; no reports or blocks initially.
4. Hide a test topic, check anonymous public reading cannot see it, then restore it.
5. Lock the test topic and verify a second account cannot reply, then unlock.
6. As a non-admin user, verify API calls for updates, reports listing, member block writes and admin table insert all fail.
7. As the admin, block a non-admin test account, verify posting/replying fail server-side and restore access.
8. Check the Supabase security advisor again after testing.

Do not use the founding welcome topic as disposable test content. Create a clearly labeled test topic for moderation checks.
