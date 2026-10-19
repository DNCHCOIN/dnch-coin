#!/usr/bin/env bash
# DNCH Community - local PostgreSQL RLS integration test bootstrap.
# IMPORTANT: This uses ONLY localhost port 54322. Never run against production.
# Start an EMPTY Supabase CLI instance from a SEPARATE temporary working folder first.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ "${DNCH_ISOLATED_RLS_TEST:-}" != "yes" ]]; then
  echo "Refusing to modify any database without DNCH_ISOLATED_RLS_TEST=yes."
  echo "Read docs/FORUM_LOCAL_RLS_TESTING.md; start fresh local Supabase first."
  exit 2
fi
if ! command -v psql >/dev/null 2>&1; then
  echo "PostgreSQL client psql is required." >&2
  exit 2
fi
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 18+ is required for the browser-logic tests." >&2
  exit 2
fi

# Intentionally non-configurable URL: no accidental Supabase hosted-project DSN.
# Standard local Supabase DB connection: Docker port 54322 forwarded to localhost.
DB='postgresql://postgres:postgres@127.0.0.1:54322/postgres'
PSQL=(psql -X -v ON_ERROR_STOP=1 -q -d "$DB")

if ! "${PSQL[@]}" -Atqc "select 1" >/dev/null 2>&1; then
  echo "No local Supabase Postgres on 127.0.0.1:54322." >&2
  exit 2
fi

# Never silently reuse a dirty local DB: the initial forum-admin migration
# requires EXACTLY one verified founder at its execution point.
fresh=$("${PSQL[@]}" -Atqc "select case when
    to_regclass('auth.users') is not null
    and to_regclass('public.forum_categories') is null
    and (select count(*) from auth.users)=0
    then 'yes' else 'no' end")
if [[ "$fresh" != "yes" ]]; then
  echo "Refusing: this is not a fresh local Supabase database." >&2
  echo "Use a separate empty CLI workspace, do not reset an existing DB." >&2
  exit 2
fi

echo "Bootstrapping ONLY disposable local Supabase at 127.0.0.1:54322..."
"${PSQL[@]}" -f supabase/migrations/20261018_dnch_forum.sql
"${PSQL[@]}" -f supabase/migrations/20261018_dnch_forum_profiles.sql

# Founder is needed by the existing forum-admin migration, which expects
# exactly one confirmed Auth user with public profile name Admin1.
# Fake email has an invalid/reserved domain; do not use actual contact data.
"${PSQL[@]}" <<'SQL'
insert into auth.users(id,email,email_confirmed_at)
values ('8c2c9323-ed19-48a2-8c62-950000000001','dnch-local-founder@example.invalid',now());
update public.forum_profiles
set display_name='Admin1'
where id='8c2c9323-ed19-48a2-8c62-950000000001';
SQL

"${PSQL[@]}" -f supabase/migrations/20261018_dnch_forum_admin.sql
"${PSQL[@]}" -f supabase/migrations/20261018_dnch_forum_audit.sql
"${PSQL[@]}" -f supabase/migrations/20261018_dnch_forum_search.sql
"${PSQL[@]}" -f supabase/migrations/20261018_dnch_forum_invite_only.sql

echo "Running pgTAP integration tests with transaction rollback..."
# pgTAP outputs TAP lines. Plain psql exits zero for SQL that returns "not ok";
# therefore fail explicitly on any TAP assertion failure or missing test plan.
TAP_OUT=$(mktemp)
trap 'rm -f "$TAP_OUT"' EXIT
"${PSQL[@]}" -f tests/forum-pilot-rls.pgtap.sql | tee "$TAP_OUT"
if grep -Eq '(^|[[:space:]])not ok[[:space:]]' "$TAP_OUT"; then
  echo "FAILED: at least one PostgreSQL RLS assertion did not pass." >&2
  exit 1
fi
if ! grep -Eq '1\\.\\.25([^[:digit:]]|$)' "$TAP_OUT"; then
  echo "FAILED: did not find pgTAP plan for all 25 checks." >&2
  exit 1
fi

echo "Running Node.js simulated browser permission regressions..."
node --test tests/forum-pilot-access.test.mjs

echo "Local-only tests finished. Review the TAP output for any 'not ok' results."
echo "The disposable bootstrap DB remains local; do not reuse for production."
