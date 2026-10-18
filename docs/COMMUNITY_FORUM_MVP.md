# DNCH Community — real forum MVP specification

**Status:** Planning, not launched. **Owner approval required** before deployment or collecting user accounts.

## Why this matters
The GitHub-linked Ideas Lab currently requires GitHub to actually submit a proposal. DNCH Community should let an international audience participate without cryptocurrency or developer accounts. The forum must not be presented as working until the service is deployed, moderated and tested.

## Phase 1 — deliverable, not just a mock-up

1. **Public reading:** Browse topics without signing in.
2. **Optional accounts:** Register with email and verification; add other sign-in providers only when justified. No wallet requirement.
3. **Discussion:** Create topics, reply, edit own posts, flag abuse; category navigation and search.
4. **Five initial categories:** DNCH Ecosystem Ideas; Music & Radio; Games & Cars; Science & Technology; Open Conversation.
5. **Language:** English and Bulgarian interface/seeded categories. Allow any-language posts but add language labels and moderation coverage; automatic translation must be opt-in and labeled if implemented.
6. **Community care:** Appointed moderators, reporting workflow, transparent rules, spam rate limits and appropriate age/privacy policies.
7. **Trust:** Label verified DNCH project announcements; never imply user posts are endorsed facts.

## Infrastructure decision required

GitHub Pages is static and cannot alone provide a secure forum with login, write operations and a shared database. Evaluate managed Discourse vs self-hosted Flarum/Discourse, including recurring hosting, email, updates, backups, abuse response and GDPR obligations. Choose the platform before developing a custom login or token-based rewards system.

## Privacy and security baseline

- Store only necessary account information and publish a privacy policy and terms for actual service.
- TLS everywhere, secure sessions, least-privilege admin accounts with MFA.
- Spam prevention, rate limiting, abuse reporting, block/mute and moderation auditability.
- Regular tested backups, updates, an incident contact and abuse escalation plan.
- Account deletion, export and retention policy before public registration.
- Use licensed/cleared media in user posts; transparent copyright handling.
- No automatic public posting of AI-generated news or reward distribution without review.

## Integration with DNCH Hub

Replace the Ideas Lab GitHub submission dependency with links to the deployed forum **only after** validating sign-in, posting, moderation, recovery and privacy. Preserve existing public project transparency in GitHub. DNCH Coin wallet connection remains optional and separate.

## Progressive milestones

- [ ] Select forum host/platform after a cost and feature comparison.
- [ ] Agree on moderation roles, rules, languages and account privacy documentation.
- [ ] Bring up a private pilot forum with 5 categories and seeded topics.
- [ ] Test registration, posting, reports, email verification, backups and deletion.
- [ ] Invite an initial small group; gather feedback and fix issues.
- [ ] Public launch and link from DNCH Hub (after explicit owner approval).

**The founding principle:** a useful international community even for visitors with no DNCH Coin.
