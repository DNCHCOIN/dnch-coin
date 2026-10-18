# DNCH AI — v0.9 website chat pilot

## What is deployed now

- A floating, responsive **DNCH AI** chat window on all 12 English and Bulgarian DNCH website pages.
- Until a paid OpenAI API account is explicitly configured/approved, the widget displays **coming soon** and links visitors to the official ChatGPT website as an alternative. It **does not fabricate AI replies**.
- The Supabase Edge Function `dnch-ai-chat` is deployed with Supabase JWT verification on. It **does not contact OpenAI** because server-side `DNCH_AI_ENABLED` is unset and `OPENAI_API_KEY` has not been supplied.
- A database function atomically limits each authenticated founding-admin pilot user to **10 calls per UTC day**. Pilot access is limited to the verified DNCH forum administrator.
- This is not an iframe of ChatGPT, not a way to use the site owner's ChatGPT Plus subscription and not an OpenAI-endorsed product.

## To enable a first owner-only test (requires separate owner approval of API charges)

1. Review [OpenAI API pricing](https://developers.openai.com/api/docs/pricing) and configure the API project spend/budget/notifications to a low agreed amount. API billing is **separate** from ChatGPT Plus.
2. In the **Supabase project** > Edge Functions > Secrets, set `OPENAI_API_KEY` and `DNCH_AI_ENABLED=true`. Do **not** send or commit the API key to chat, GitHub or client-side HTML.
3. Optionally set `OPENAI_MODEL` to an approved, available lower-cost Responses API model. Default is `gpt-5-mini`.
4. In `assets/dnch-ai-config.js`, flip `enabled` from `false` to `true` only after owner approval and backend testing. When enabled, the widget uses the member's existing Supabase Auth session.
5. Test with the confirmed owner account; signed-out visitors should be told to sign in. Ordinary members must get an access denial even if they attempt to invoke the server directly.
6. Verify no messages, personal data or API keys are written into GitHub, console logs or database tables. The widget does not persist chat history in server storage. Responses API is called with `store:false`.
7. Check the backend's call cap, mobile layout, Bulgarian/English messages, 401/403/429/503 behavior and OpenAI account usage after a few test questions.

## Public launch — not yet

The public chat must NOT be enabled just by disabling the owner check. First require an abuse-resistant authentication/CAPTCHA or equivalent identity protection, robust per-user/IP quotas, an explicit OpenAI monthly spending budget and usage monitoring, content abuse review, user terms/privacy/retention notices and appropriate language support.

## Authentication and security choices

- Function verifies JWT at gateway, then calls Supabase Auth `getUser`, then checks RLS-protected `forum_admins`.
- Requests are validated (max 7 messages, max 600 characters each), require same-site origin and capped output (600 tokens); fixed server-side instructions and model. CORS allowed only for the DNCH GitHub Pages origin.
- The API key is read only via server-side `Deno.env.get('OPENAI_API_KEY')`.
- Server-side quota is stored in `public.dnch_ai_daily_usage` (no direct anonymous/authenticated table grants), with a single narrow RPC accessible to authenticated members and allowing only verified admins.
- Hidden/disabled controls in the browser are **not** a security boundary; the Edge Function enforces access and quotas.

## Remaining acceptance tests

- Confirm initial deployment refuses calls without configured secrets: no API cost.
- Verify owner JWT login and a permitted quota RPC response (only with owner's browser session, never through assistant impersonation).
- Verify standard user and signed-out user cannot invoke the function.
- Validate multilingual text responses when the owner authorizes API billing.
- Before broad public use, conduct a GDPR/privacy review and a realistic abuse/cost test.
