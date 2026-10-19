# DNCH Community v1.1 — Invitation-only posting pilot

**Status: prepared as a GitHub pull request; NOT deployed to the live Supabase project. Do not announce public registration.**

## Why this matters

The existing DNCH Community project has a real Supabase forum schema with row-level security, moderation and a founding account. Supabase Auth sessions alone must **not** imply permission to post. A database-controlled allowlist keeps the pilot private even if an Auth user is added by mistake. A second database-owned control provides an emergency pause for new forum topics and replies.

## New database objects and rights

Migration: `supabase/migrations/20261018_dnch_forum_invite_only.sql`.

- `public.forum_pilot_members(user_id, approved_at)`: approved verified Auth user UUIDs. Existing `forum_admins` are seeded automatically, so the existing owner remains eligible. **Only trusted database administrators** may insert/delete approvals; neither `anon` nor browser `authenticated` can write them. RLS permits each approved user to SELECT **only their own membership**.
- `public.forum_pilot_controls(id=1, posting_enabled, updated_at)`: one database-owned global posting flag. Visitors can read whether new posts are enabled, but browser roles cannot INSERT, UPDATE or DELETE it. Initially `posting_enabled=true`, preserving the current approved founder's ability to post after migration.
- Thread and reply INSERT policies require: user owns the new post, user is approved, global posting is enabled, user is not blocked by moderation, thread is visible and unlocked (for replies); existing rate-limit triggers and other restrictions remain intact.
- Report INSERT requires the authenticated user's own reporter ID and an approved pilot membership. Reports remain available to approved members when posting is paused or their posting rights are restricted, so misconduct can still be reported.
- Public read-only policies, administrator moderation/audit rights, Auth accounts and DNCH ID cloud backup allowlists are **unchanged**.
- The frontend only **mirrors** these privileges to provide understandable messages. Supabase RLS is authoritative; hiding a button is not authorization.

## Release order (required)

1. Review SQL with the database owner. Back up and test the migration in an isolated database or disposable local Supabase instance. **No test database has been created as part of this PR.**
2. Apply the migration to the existing pilot project only after review. Confirm both tables, their grants/RLS policies, the founding admin seed and all three updated INSERT policies. The GitHub PR does **not** perform this step.
3. Confirm the backend's Auth signup settings, allowlisted redirect URLs, email delivery, domain ownership and approved moderators. A client-side `shouldCreateUser:false` option does **not** disable Auth signup endpoints globally.
4. Merge/deploy frontend files (`assets/forum.js`, EN/BG `forum.html`). **Applying the frontend first fails closed and temporarily prevents posting**, because it cannot verify membership until the migration exists.
5. Test with a signed-out visitor, the approved founding account and a separate verified but unapproved Auth test account; do not use the public welcome post as a moderation test.
6. Invite outside testers only after their consent, confirmed emails, provider/budget approval, privacy/terms/contact information, incident process and tested backup/restore. Public rollout requires separate owner approval.

## Trusted-admin operations only

These examples are **manual database-owner operations in Supabase Studio**, not frontend API calls. Insert the UUID of an existing, verified `auth.users` record; do not paste emails or credentials into GitHub or a public chat.

Approve an invited verified account:

```sql
insert into public.forum_pilot_members (user_id)
values ('REPLACE-WITH-VERIFIED-AUTH-UUID'::uuid)
on conflict (user_id) do nothing;
```

Revoke that account's pilot posting permission:

```sql
delete from public.forum_pilot_members
where user_id = 'REPLACE-WITH-VERIFIED-AUTH-UUID'::uuid;
```

Pause all new topics/replies immediately; **do not remove posts**:

```sql
update public.forum_pilot_controls
set posting_enabled = false, updated_at = now()
where id = 1;
```

Resume when the incident is resolved (after a deliberate owner decision):

```sql
update public.forum_pilot_controls
set posting_enabled = true, updated_at = now()
where id = 1;
```

The examples require replacing the placeholder with a real UUID and a trusted, privileged DB session. They must not be callable by an ordinary signed-in browser user.

## Read-only preflight: 25 checks, not a substitute for RLS behavioral tests

The reusable `supabase/tests/forum_invite_only_preflight.sql` contains **25
read-only metadata checks** of table presence, RLS, grants, existing write
guards, forum-admin permissions and unexpected permissive policies.

On 19 October 2026 it was run against the current Supabase project **before
the invitation-only migration**. The result was **12 PASS / 13 FAIL**. The
failures are expected for the not-yet-installed pilot tables and INSERT gates;
they are *not* authorization proof. The 12 successes check preservation of
existing controls and restrictions in today's schema.

**Hard release gate:** do not publish the new forum frontend until:
1. A separate disposable/local Supabase database passes real role-based tests
   with two accounts, anonymous access and attempts to bypass grants.
2. The migration is reviewed and applied to the **approved private pilot**
   in the correct order.
3. The SELECT-only preflight returns **25 PASS / 0 FAIL** after that rollout.
4. Real account/session browser checks also pass. Static metadata checks alone
   cannot establish real security.

## Repeatable browser-access regression tests

A new **dependency-free Node test suite** is available at
`tests/forum-pilot-access.test.mjs`. Run from repository root:

```sh
node --test tests/forum-pilot-access.test.mjs
```

It reads the actual code from `assets/forum.js` and the EN/BG forum HTML,
extracts the access functions, then uses a fake Supabase client to verify
invite-only posting, deny-by-default on backend failures, emergency pause,
moderator block, locked threads, revoked invitations, sign-out, and stale
concurrent requests after account changes. There are **14 deterministic cases**.

An adapted execution of these 14 cases against the **current GitHub branch
files** completed with **14 PASS / 0 FAIL**. This was an in-memory
simulation, **not a real Supabase / Node CLI / browser integration run**.
Rerun `node --test` in a local Node environment before deployment.

## Isolated PostgreSQL integration suite — prepared, not executed

The proposed `tests/forum-pilot-rls.pgtap.sql` contains **25 pgTAP
behavioral assertions** executed under synthetic `authenticated`, `anon`
and trusted moderator contexts. It checks real INSERT permission decisions,
reporting during emergency pause, moderation locks, hidden reads, audit and
revocation, rather than just searching metadata for policy names.

A localhost-only bootstrap runner and step-by-step setup instructions are at:

- `tests/run-forum-rls-local.sh`
- `docs/FORUM_LOCAL_RLS_TESTING.md`

The old forum-admin migration requires exactly one seeded, verified founder at
its own execution point, which is why the isolated local bootstrap applies
migrations in a deliberate order. The runner connects only to
`127.0.0.1:54322`, refuses any populated local DB and checks for TAP failures.

**Not yet executed**: there is no running isolated PostgreSQL / Supabase
instance in the current working environment. No hosted Supabase development
branch was purchased or created. Do **not** mark the database testing gate
complete until an operator performs a real isolated run and records the result.

## Security acceptance tests (NOT YET RUN against the database)

1. `anon` can read visible topics but cannot read approvals, create posts, reply, report or update posting controls.
2. An existing verified Auth account without a row in `forum_pilot_members` cannot create a thread, reply or report (even by direct REST request) but may read visible public content.
3. The approved owner can create a test thread/reply and submit a report with the global flag enabled; a forged `author_id` and a duplicate report are rejected.
4. With `posting_enabled=false`, even an approved writer cannot create threads/replies; approved writers can still file reports and admins can moderate.
5. A blocked member cannot post when the flag is enabled, but an approved member can still report.
6. An approved user cannot list other members' approvals and cannot INSERT/UPDATE/DELETE either pilot table.
7. Hiding/restoring a test post still creates an audit record, and anonymous users cannot read hidden content.
8. Check both EN/BG interfaces and stale-session handling; a revoked user must fail server-side immediately even if their page UI is not yet refreshed.
9. Verify account deletion/consent, rate limits, reports, backups, monitoring, real SMTP and legal documents before any public signup.

## Local code checks completed

- Browser script parsed successfully; EN/BG status elements and key form IDs are present.
- Simulated permission states passed: approved, not invited, globally paused, moderator-blocked, backend unavailable (fail closed).
- RLS migration statically checked against existing policy names and includes no browser-write privileges for either new table.
- **No new migration was applied and no real two-account integration or production email tests were performed.**

## Existing security-advisor notices to follow up

The Supabase security advisor also flags the *separate* signed-in-executable `dnch_ai_reserve_daily_request()` security-definer function and disabled leaked-password protection. DNCH AI and password-based public registration must remain off until independently reviewed; this forum PR does not alter either. Reference: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable and https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.
