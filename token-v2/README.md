# DNCH Coin v2 — launch preparation (NOT DEPLOYED)

This is a **staging package**, not evidence of a new on-chain token. No new mint address exists until a wallet holder executes and signs the launch locally.

## Proposed parameters
- Network: Solana **mainnet-beta**
- Program: Original SPL Token Program (`TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`)
- Token name: **DNCH Coin v2**
- Symbol: **DNCH** (note: wallets may show two tokens with the same symbol; verify the mint address)
- Decimals: **9**
- Initial issuance: **4,200,000,000 DNCH** (raw units: 4,200,000,000,000,000,000)
- Freeze authority: **none** (must verify)
- Mint authority: local launching wallet; optional **irreversible** revoke only after verification
- Metadata: Metaplex metadata, JSON at `token-v2/metadata.json`; image at `dnch-logo.png`
- Reserve: the launching wallet's associated token account, **not** the abandoned original owner's account

## Original token / why v2 is proposed
Original SPL mint: `8Ku27a4FnfzGmkLMQck3haKKAt4SJ4fmaCZDvrLtNSgi`.
Original reserve ATA: `CAbupYs26xLzYji3MYgbxPgyTy9ixKGwP5dMFLMW9YES`.
Original mint authority and reserve owner: `82bFerPuS2MsgmYHdbVBRSXQp6YLDJZSGCJERWcZwEyF`.
As of October 25, 2026, the original reserve account held **4,199,998,990 DNCH** and had **no delegate**. The signing key was reported lost. No built-in migration from v1 exists, and v1 holders do not automatically own v2 tokens. Publicly disclose this before any launch.

## What can happen unattended
Website metadata, documentation, GitHub planning and read-only public verification. **Mainnet mint creation, transaction fees and signer approval are NOT available through GitHub or Vercel credentials.** Never store wallet private keys or seed phrases in this repository, CI, environment variables, messages or screenshots.

## Local launch steps — only on the owner's secured computer
1. Review the tokenomics, branding, old-token disclosure and distribution plan. Keep v1 live but distinguish it from v2.
2. Create a **new** Solana wallet that the owner controls and backs up offline. The CLI signer must be a local keypair or supported hardware signer. Fund it with enough SOL for mint rent, token account rent, metadata rent, network fees, and a buffer.
3. Install and test Solana CLI (`solana`, `solana-keygen`), SPL Token CLI (`spl-token`), and Metaplex CLI (`mplx`). Check versions and help. The published docs include links below.
4. Ensure this file and `metadata.json` are merged to `main` and the metadata URL responds publicly before issuing a token.
5. Run `bash token-v2/launch.sh --check /ABSOLUTE/PATH/TO/NEW_LOCAL_SIGNER.json` to inspect the selected wallet and expected details (read-only).
6. Run `bash token-v2/launch.sh --launch /ABSOLUTE/PATH/TO/NEW_LOCAL_SIGNER.json`. The script requires explicit confirmation, creates the mint, the holder's ATA, mints the exact supply, and attaches Metaplex metadata. It stores **only the public mint address** at `~/.local/share/dnch-v2/mint-address`.
7. Verify minted supply, metadata, recipient balance and mint/freeze rights independently via Solana Explorer, CLI and a compatible wallet. **Optional and irreversible:** `bash token-v2/launch.sh --finalize /ABSOLUTE/PATH/TO/NEW_LOCAL_SIGNER.json` revokes mint authority after requiring a second explicit confirmation.
8. Update DNCH website, social accounts and Jupiter request **only after the new mint has been verified**. The old Jupiter request is for v1 and cannot verify the new mint.

A different original mint address is expected. Symbol/name/logo alone are NOT proof of identity.

## Security
- The signer private key and recovery phrase must NEVER be given to an AI assistant, GitHub, Vercel, Supabase, CI runners, a bot, or an untrusted script.
- Back up the new signer securely before launch; test restoring the wallet without exposing its secret.
- Never commit the actual keypair even to a private repository.
- Publishing this branch does not deploy a token. Launch transactions consume real SOL.
- Plan treasury distribution, vesting, and public disclosure before any public offering.
- The script does not create a liquidity pool, a price, an exchange listing, a snapshot, or a migration contract.

## Primary references
- https://solana.com/docs/tokens/quickstart
- https://solana.com/docs/references/spl-token-cli
- https://www.metaplex.com/docs/dev-tools/cli/toolbox/add-metadata-to-token
