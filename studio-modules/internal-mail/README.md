# DNCH Studio ID and internal mail

Live UI: `/studio-account.html`; entry point in `/studio.html`.

Internal addresses use `username@dnch`. They are platform identifiers and never route via SMTP or an external mailbox. No external email is requested during registration. Usernames are case-insensitive ASCII letters, numbers and underscores, 3–24 characters. Passwords are 12–128 characters.

## Components

- Static HTML, CSS and JavaScript hosted with the existing Studio site. Browser sessions use sessionStorage with a Studio-specific key. No service credentials are shipped to browsers.
- Supabase Auth for password hashing, sessions, refresh and login throttling. Internal Auth identifiers use the reserved `.invalid` suffix and are confirmed administratively; no verification email is sent.
- `studio-mail` Edge Function provides registration, recovery, authenticated message operations, draft persistence and logout. The gateway JWT precheck is disabled because registration/login have no user JWT. Private operations validate the caller with `auth.getUser`, check Studio membership and recovery revocation time, and derive ownership exclusively from that verified identity. The public application key is not a secret or proof of user identity.
- Four new tables, all with RLS enabled and direct browser access revoked. Only the server service role accesses them. The SQL rate helper is SECURITY INVOKER and executable only by service_role. No existing auth settings, memberships or other application tables were changed. The existing Auth trigger also creates a generic forum profile for new Auth users.

## Behavior

Inbox, sent, recipient read markers, reply, independent per-participant soft deletion, persistent drafts and paginated loading (50 records per page). Search covers loaded messages. Delivery is idempotent per sender/request UUID. Inputs are bounded on the server; message content renders with textContent, never HTML. Unknown and external recipients are rejected. Limits: 30 sends/hour/account, plus registration/login/recovery and general API limits. Rate counters persist in the database.

Recovery uses 192-bit random secrets; only SHA-256 hashes are stored. The original secret is shown once. Recovery atomically consumes the old hash, changes the password, issues a new secret and invalidates earlier access tokens in this API. Recovery does not rely on the internal mailbox itself.

## Deployment

Apply `schema.sql` once through the linked Supabase project. Deploy `index.ts` as `studio-mail`; keep runtime `SUPABASE_SERVICE_ROLE_KEY` server-only. Publish the static pages and `studio-assets/studio-mail.{css,js}` with the existing repository. Allowed browser origins are explicit in the Edge function; adjust these and the public key when adapting this module for another customer. Each customer should have a separate backend or explicit tenant isolation; this is a reusable implementation, not an automatic multi-tenant service.

## First-version limits

Text-only internal mail: no attachments, external email, push notifications or end-to-end encryption. Inbox refreshes on demand or every 45 seconds when the page is visible and no message/composer is open. Deleted messages retain the other participant's copy. Account deletion is handled through a verified support request. Losing both password and recovery secret requires support; there is no automated email reset. Transport is HTTPS; administrators retain database access.

## Validation

The accompanying `verify.py` creates temporary QA accounts and tests registration, login rejection, delivery, retry deduplication, read state, third-user isolation, private drafts, per-user deletion, internal-only addressing, recovery secret rotation, old-session invalidation, denied direct table access, session refresh and logout. It writes temporary test credentials only under `/tmp`; never commit those credentials. Delete only the generated QA Auth users after running it. Security advisors were checked; the new tables intentionally have no browser policies because their grants are revoked and access is server-mediated.
