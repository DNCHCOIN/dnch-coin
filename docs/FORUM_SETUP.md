# DNCH Community v0.5 — Private pilot activation checklist

**Current state:** Code is in a draft PR only. A forum backend has NOT been provisioned. No one can register or publish yet. Do not activate for public users until this checklist is complete.

## Why an external backend?

DNCH Hub is hosted on GitHub Pages (static HTML). A real forum needs server-side account management, storage, authorization, abuse handling and backups. This pilot chooses **Supabase Auth + PostgreSQL** as an implementation prototype; it is not a locked-in vendor decision. A separately managed service such as Discourse can be considered instead.

## Provision a pilot backend (project owner)

1. Create a dedicated **Supabase project** under a DNCH-owned account, preferably an appropriate EU region. Record estimated cost and project admin ownership. The assistant has not created this account.
2. Review `supabase/migrations/20261018_dnch_forum.sql` with a developer; execute in a **private TEST** Supabase project before production. It creates categories, pseudonyms, topics, replies, reports, RLS and basic throttling.
3. Enable **Email** sign-in with OTP/magic-link in Supabase Authentication. Review whether SMTP delivery and confirmation settings are suitable. Set Site URL to `https://dnchcoin.github.io/dnch-coin/`. Add BOTH exact redirect URLs:
   - `https://dnchcoin.github.io/dnch-coin/forum.html`
   - `https://dnchcoin.github.io/dnch-coin/bg/forum.html`
4. For a test deployment, fill in **only** the Project URL and public **publishable/anon key** in `assets/forum-config.js`. Never commit a `service_role`, secret API key, SMTP password, database password or personal account tokens. The publishable key is exposed by design; Row Level Security is essential.
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
- Add automated RLS tests with Supabase CLI (`supabase test db`) before public registration. This SQL migration is **not yet executed or integration-tested**.
- Confirm that text containing `<script>`, markdown or unusual Unicode renders as literal text, not executable code.
- Test a failed network call, a disabled storage environment, expired login links and a wrong redirect URL.

## Feature scope

### Implemented in this prototype (requires backend to work)
- Free public reading of forum threads; 5 seeded categories.
- Optional verified email magic-link registration; auto-generated pseudonyms.
- Create a thread, reply, report suspicious content, open direct topic URL.
- Bulgarian/English interface, optional choice of post language.
- Browser-side state and message handling; no invented discussions or fake activity.

### Not yet implemented
- Rich text, image uploads, notifications, password accounts, editable profile names, direct messages, member rewards, crypto payouts, translations of user submissions.
- In-app moderator dashboard, full-text indexed global search, GDPR self-service account deletion/export, a comprehensive automated test suite, robust anti-bot CAPTCHA or production SMTP setup.
- The SQL throttle is a **basic** anti-spam safeguard, not a complete anti-abuse system.

**Important:** Until these are reviewed, keep v0.5 labelled a private pilot. Do not misrepresent it as a production forum.

## Relevant documentation
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase managing user data: https://supabase.com/docs/guides/auth/managing-user-data
- Supabase email login: https://supabase.com/docs/guides/auth/auth-email-passwordless
