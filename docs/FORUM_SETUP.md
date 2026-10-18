# DNCH Community v0.5 — Private pilot activation checklist

**Current state (18 October 2026):** A dedicated DNCH Community Supabase project exists, and forum categories, RLS, an owner account, moderation, audit history and search have been provisioned. Public registration is NOT approved or verified; posting is available only in an opt-in private pilot. **The invitation-only posting controls in `docs/FORUM_PRIVATE_PILOT_V1_1.md` are proposed and not yet deployed.** Do not treat the forum as publicly launched.

## Why an external backend?

DNCH Hub is hosted on GitHub Pages (static HTML). A real forum needs server-side account management, storage, authorization, abuse handling and backups. This pilot chooses **Supabase Auth + PostgreSQL** as an implementation prototype; it is not a locked-in vendor decision. A separately managed service such as Discourse can be considered instead.

## Pilot backend: provisioned foundation and remaining release checks

1. **Already provisioned:** verify continued DNCH project ownership, the EU hosting region and recurring subscription/usage costs before inviting outside testers.
2. **Initial schema already applied:** review the original forum migrations and perform real two-account RLS tests. Separately review and test the **pending** invitation-only migration `supabase/migrations/20261018_dnch_forum_invite_only.sql` before applying it to the existing project; deploy the matching frontend only afterward.
3. Enable **Email** sign-in with OTP/magic-link in Supabase Authentication. Review whether SMTP delivery and confirmation settings are suitable. Set Site URL to `https://dnchcoin.github.io/dnch-coin/`. Add BOTH exact redirect URLs:
   - `https://dnchcoin.github.io/dnch-coin/forum.html`
   - `https://dnchcoin.github.io/dnch-coin/bg/forum.html`
4. The existing pilot frontend contains the Supabase project URL and a **public publishable key**. Keep those as the only browser credentials. Never commit a `service_role`, secret API key, SMTP password, database password or personal session tokens. Publishable keys are public by design; RLS and grants are essential.
5. Configure a real anti-spam provider/CAPTCHA, strict Auth signup limits, mail limits and monitoring **before** exposing public sign-up.
6. Appoint at least one moderator and publish clear community guidelines and privacy policy/terms (GDPR-relevant data handling; contact, deletion/export, retention).
7. Assign a moderation workflow in Supabase Studio (view `public.forum_reports`; set `is_hidden = true` on reported posts, `is_locked = true` on threads where necessary). Moderator access stays strictly on the private admin side; **no admin secret in the frontend**.
8. Configure backups, test restoring one, define an abuse contact and an incident response owner.
9. Test in browser on desktop and Android; verify EN/BG links, magic link return, signed-out reading, member posting/replying/reporting, hiding posts, locked discussions and responsive layout.
10. Before public launch, confirm the project owner approves the backend provider, hosting budget, language moderation scope, and privacy wording.

## Security tests: do not skip

Use two separate **verified** test accounts plus a signed-out browser.

- Signed out: may read categories, pseudonyms and nonhidden topics/replies; **cannot** create topics, replies or reports.
- Account A: can create posts ONLY as A. Attempts to set `author_id` to B must be rejected by RLS and the DB trigger.
- Account B: cannot update or delete A's topic, even with custom API calls (only SELECT and INSERT grants).
- Neither account can select `forum_reports`, set `is_hidden=true`, lock threads, or read emails via `forum_profiles`.
- Hidden topics and hidden replies disappear for anonymous visitors and members.
- Locked topics reject replies.
- Duplicate reports must fail; very rapid repeat submissions should be throttled (DB timing triggers, plus stronger network-level rate limits required).
- Add repeatable RLS tests with Supabase CLI (`supabase test db`) before public registration. The base forum schema exists, but the new invitation-only migration has **not** been applied or integration-tested.
- Confirm that text containing `<script>`, markdown or unusual Unicode renders as literal text, not executable code.
- Test a failed network call, a disabled storage environment, expired login links and a wrong redirect URL.

## Feature scope

### Implemented in this prototype (requires backend to work)
- Free public reading of forum threads; 5 seeded categories.
- Email magic-link sign-in for existing verified pilot accounts (public signups remain out of scope), with auto-generated pseudonyms and editable display names.
- Create a thread, reply, report suspicious content, open direct topic URL.
- Bulgarian/English interface, optional choice of post language; owner-only moderation panel, report workflow, full-text indexed topic search and browser-only bookmarks already exist in the pilot.
- Browser-side state and message handling; no invented discussions or fake activity.

### Not yet implemented
- Rich text, image uploads, notifications, password-based public accounts, direct messages, member rewards, crypto payouts, translations of user submissions.
- GDPR self-service account deletion/export, a comprehensive automated test suite, robust anti-bot CAPTCHA, approved production SMTP, tested backups and public terms/privacy.
- The SQL throttle is a **basic** anti-spam safeguard, not a complete anti-abuse system.

**Important:** Until these are reviewed, keep v0.5 labelled a private pilot. Do not misrepresent it as a production forum.

## Relevant documentation
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase managing user data: https://supabase.com/docs/guides/auth/managing-user-data
- Supabase email login: https://supabase.com/docs/guides/auth/auth-email-passwordless
