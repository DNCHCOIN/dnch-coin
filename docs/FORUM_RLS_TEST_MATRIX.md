# DNCH Community — RLS test and rollout matrix

**Status (19 October 2026):** Private forum pilot only. The invitation-only
migration is **not** installed in the live Supabase project. No public signup.

| Test layer | Source | Result | Remaining requirement |
|---|---|---|---|
| Live, SELECT-only schema preflight (pre-migration) | `supabase/tests/forum_invite_only_preflight.sql` | 12 PASS / 13 expected FAIL | Re-run after approved pilot deployment: 25 PASS required |
| Local JavaScript authorization behavior (mock Supabase) | `tests/forum-pilot-access.test.mjs` | 14 PASS in an adapted in-memory harness | Also run `node --test` and browser QA |
| Real PostgreSQL authorization (pgTAP) | `tests/forum-pilot-rls.pgtap.sql` | **NOT RUN** | Requires isolated already-migrated PostgreSQL |
| Local-only bootstrap and runner | `tests/run-forum-rls-local.sh` | **NOT RUN** | Execute with empty local Supabase, never live |
| Signed-out and two real Auth sessions | Operator manual QA | **NOT RUN** | Test real login, RLS, invitation and moderation |
| Public release gates | `docs/FORUM_PRIVATE_PILOT_V1_1.md` | **BLOCKED** | SMTP, Auth settings, privacy/terms, anti-abuse, backups, owner approval |

## Isolated PostgreSQL pgTAP matrix (25 assertions)

| Cases | Mode | What the tests establish |
|---|---|---|
| 1–2 | Trusted setup | RLS enabled on pilot membership and posting switch |
| 3–7 | Approved Auth account | Own membership visible; topic, reply and report writes; forged author rejected |
| 8–12 | Unapproved Auth account | Other invitations hidden; topic/reply/report writes rejected; public reading allowed |
| 13–16 | `anon` | Invitation data private; topic readable; no INSERT grant; public switch readable |
| 17–19 | Approved Auth account + global pause | New topics and replies rejected; reporting still possible |
| 20–21 | Moderation-blocked approved account | Posting denied, reporting still possible |
| 22 | Locked topic | Reply from a different approved account rejected |
| 23–24 | Anonymous reader + verified admin | Hidden topic invisible to public; audit entries recorded |
| 25 | Revoked invitation | Previously invited member no longer allowed to publish |

### Operator commands

Only on a separate **empty local Supabase instance**, provisioned from a
different temporary workspace, run:

```bash
DNCH_ISOLATED_RLS_TEST=yes bash tests/run-forum-rls-local.sh
```

Read `docs/FORUM_LOCAL_RLS_TESTING.md` first. The starter points to
`127.0.0.1:54322`, not the real Supabase project, and explicitly verifies
that the local Auth database is empty before seeding fictional users.

**No role test can be declared passed merely because an RLS policy or
database permission appears in a SELECT-only catalog query.** pgTAP and
the real-user browser checks are separate release blockers.

PR #23 separately changes English forum navigation; reconcile with PR #26
when planning a later merge. No PR has been merged by these tests.
