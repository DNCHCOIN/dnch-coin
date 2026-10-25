# DNCH Coin v2 — Technical release (NOT DEPLOYED)

**Status (25 October 2026):** Version 2 is the next DNCH Coin release under preparation for Solana. No new mainnet mint has been created or announced yet.

## Planned release changes

- Updated issuance procedure with network selection and read-only preflight.
- Resume and duplicate-launch safeguards for partial deployments.
- Independent checks for supply, mint authority, freeze authority, treasury balance and metadata.
- Explicit locally approved mainnet launch and optional irreversible finalization.
- Protected, separately backed-up signing wallet; no secrets in the GitHub repository or CI.

## Token specification

| Property | Plan |
|---|---|
| Name | DNCH Coin v2 |
| Symbol | DNCH |
| Network | Solana mainnet-beta (after devnet testing) |
| Program | Original SPL Token Program, `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` |
| Decimals | 9 |
| Initial issuance | 4,200,000,000 DNCH |
| Raw units | 4,200,000,000,000,000,000 |
| Freeze authority | None, checked before issuing |
| Mint authority | Owner's new signing wallet, optionally revoked after verification |
| Treasury | Associated token account owned by the launch wallet |
| Circulating supply | Not equivalent to the planned minted quantity |
| New mint address | Not assigned until launch |

Version 2 will use a **new mint address**, and the verified address will be announced through the official website after launch. A token's name or symbol is not a unique identity. Earlier DNCH token holdings are separate; automatic conversion is not part of this deployment. This repository does not run any swap, liquidity pool, sale, or airdrop.

## Local setup — signing remains under wallet owner's control

1. Install and verify the official `solana` CLI, `solana-keygen`, `spl-token`, Metaplex `mplx`, `curl` and `jq`. Review the current help output because CLI versions change.
2. Create or securely provision a **new** signer on the owner's computer, and make at least one offline backup that can be restored. Do not share or commit the private key or recovery phrase.
3. Test on devnet using a local test signer funded with devnet faucet SOL. After reviewing this package:
   ```bash
   bash token-v2/launch.sh --check /ABSOLUTE/PATH/TO/LOCAL-TEST-KEYPAIR.json --network devnet
   bash token-v2/launch.sh --launch /ABSOLUTE/PATH/TO/LOCAL-TEST-KEYPAIR.json --network devnet
   bash token-v2/launch.sh --status /ABSOLUTE/PATH/TO/LOCAL-TEST-KEYPAIR.json --network devnet
   ```
   A successful GitHub mock test does not replace real devnet testing.
4. Before mainnet, verify that `https://dnchcoin.github.io/dnch-coin/token-v2/metadata.json` and the logo load correctly. The new owner wallet needs enough real SOL for account rent, metadata rent and fees.
5. Mainnet commands (they require personal confirmation and spend real SOL):
   ```bash
   bash token-v2/launch.sh --check /ABSOLUTE/PATH/TO/LOCAL-MAINNET-KEYPAIR.json --network mainnet
   bash token-v2/launch.sh --launch /ABSOLUTE/PATH/TO/LOCAL-MAINNET-KEYPAIR.json --network mainnet
   bash token-v2/launch.sh --status /ABSOLUTE/PATH/TO/LOCAL-MAINNET-KEYPAIR.json --network mainnet
   ```
6. The **public** mint address is recorded locally at `~/.local/share/dnch-v2/mainnet/mint-address`. After an interrupted launch, use `--resume` only if this public address is present. If creation finished before the address was written, inspect `create-token-output.txt` in that same directory and resolve manually. **Never rerun `--launch` blindly.**
7. Independently verify 9 decimals, total and treasury supply, freeze authority absence, metadata, minted account and wallet custody. Only then, if the supply must become permanently fixed, use:
   ```bash
   bash token-v2/launch.sh --finalize /ABSOLUTE/PATH/TO/LOCAL-MAINNET-KEYPAIR.json --network mainnet
   ```
   Revoking mint authority is irreversible. Review the decision before signing.
8. Publish the verified **new** mint address on the website and official accounts, then submit a new token verification to Jupiter if desired.

## Security / communication

Never put secret keys in GitHub, GitHub Actions, Vercel, Supabase, email or this chat. A private key is not recoverable from a mint address, domain or GitHub credentials. Avoid announcements about a live release before chain verification. Disclose the actual new mint ID and avoid portraying previous on-chain tokens as the same asset.

## References

- https://solana.com/docs/tokens/quickstart
- https://solana.com/docs/references/spl-token-cli
- https://www.metaplex.com/docs/dev-tools/cli/toolbox/add-metadata-to-token
