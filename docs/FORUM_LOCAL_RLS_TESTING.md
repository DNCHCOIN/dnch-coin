# DNCH Community — isolated local RLS integration tests

**Status: pgTAP and local runner prepared, not yet executed on PostgreSQL.**
This checklist documents how to run the tests without touching the live
`DNCH Community` Supabase project, customers, Auth sessions, or billing.

## Important historical migration constraint

The existing `20261018_dnch_forum_admin.sql` migration intentionally
requires **exactly one verified founder with display_name `Admin1`**.
A plain `supabase db reset` in this repository cannot currently satisfy
that ordering on a completely empty local database because the founder has
to be inserted **after** the initial forum migrations but **before** the
admin migration. Never weaken that production guard merely for tests.

The included `tests/run-forum-rls-local.sh` handles this isolated fixture
and applies the relevant migrations in the correct order.

## Prerequisites

- Docker Engine, the Supabase CLI, PostgreSQL client `psql`, Node.js 18+
  and a local checkout of the PR #26 branch.
- No paid Supabase branch, no service-role keys, no remote database URL.
- A completely fresh **local Supabase instance** created in an unrelated
  temporary directory (so the project migrations are not automatically run).

For example, on a development machine:

```bash
mkdir -p /tmp/dnch-forum-rls-isolated
cd /tmp/dnch-forum-rls-isolated
supabase init
supabase start
```

Ensure the local database uses the default connection
`127.0.0.1:54322` (Supabase CLI often advertises this in `supabase status`).

Then return to your **checkout of the PR #26 branch** and run:

```bash
DNCH_ISOLATED_RLS_TEST=yes bash tests/run-forum-rls-local.sh
```

The runner has a fixed local-only database connection string and refuses
to start unless the feature flag is set, PostgreSQL/Node are available, the
Auth schema exists, and both the local users table and forum tables are
empty. It never accepts a production URL or remote credentials.

The runner creates **one fictional verified founder** under
`example.invalid`, seeds the local profile name and executes the existing
forum migrations in their proper historical order, followed by v1.1.
These fixture changes affect **only that disposable local database**.
The test SQL itself uses one explicit transaction that ends in `ROLLBACK`,
so its five additional fake Auth accounts, posts, reports, moderator blocks
and changes to the posting switch are not retained.

## Test coverage

`tests/forum-pilot-rls.pgtap.sql` uses **25 actual database-level checks**:

- RLS on the two pilot control tables; private membership SELECT.
- Approved author writes versus an unapproved Auth user.
- Prevention of author impersonation.
- Anonymous public reading and inability to publish or read approvals.
- Global posting pause that still permits reporting.
- Moderator block enforcement with continued reporting rights.
- Topic locks, hidden topics and protected moderation audit history.
- Loss of writing permission immediately after approval revocation.

`tests/forum-pilot-access.test.mjs` separately tests 14 client-level
permission state and race-condition scenarios with Node.js and a stubbed
Supabase client. It is **not** a substitute for PostgreSQL RLS tests.

### What still needs to be demonstrated

We have validated the JS mock test cases, but **the pgTAP SQL and bootstrap
shell script have not yet been executed in the isolated environment**.
A developer must run them as above, inspect every TAP result, then confirm
a clean 25/25 result and fix any SQL or test-fixture issues found.
A production launch additionally requires real Auth/login browser sessions,
email/SMTP, backups, privacy/terms, incident response and project-owner approval.

## Isolation rules

- NEVER paste the test SQL into the live Supabase SQL Editor, and never run it
  against the production project.
- Do not use a cloned database containing real user information.
- The bootstrap runner refuses to modify any already populated local DB.
- After testing, stop the disposable Supabase instance in the temporary
  workspace. Keep it separate from the application's real development data.
- If the script reports a missing table or a migration error, **stop**:
  investigate the schema difference and do not bypass the local-only checks.

For Supabase's official testing workflow, see
https://supabase.com/docs/guides/local-development/testing/overview .
