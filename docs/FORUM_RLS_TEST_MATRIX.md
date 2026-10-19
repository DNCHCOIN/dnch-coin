# DNCH Community — RLS acceptance matrix

Status: draft, not production tested. On 19 October 2026, the read-only 25-check preflight returned 12 PASS and 13 FAIL; the failures correspond to the not-yet-applied invitation-only schema.

Before rollout, verify with two separate real accounts and an anonymous session: read-only public access, denied uninvited writes, permitted invited writes, global pause, moderator restrictions, forged author IDs, private reports, and revoked membership. Confirm database permissions, not just hidden UI buttons.

Do not apply migrations to the live database or open public registration until the owner reviews the results. PR #23 also changes the English forum navigation, so reconcile it with PR #26 before merge.
