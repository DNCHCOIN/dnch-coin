# DNCH Coin v2 — deployment package (NOT ISSUED / NOT DEPLOYED)

**Status, 25 October 2026:** Files are prepared for review. There is **no v2 mint address, no v2 circulation, no v2 listing, and no v1→v2 swap**. GitHub changes do not create blockchain tokens.

## Reference facts: v1
- Network: Solana mainnet, original SPL Token Program.
- Original mint: `8Ku27a4FnfzGmkLMQck3haKKAt4SJ4fmaCZDvrLtNSgi`
- Original reserve ATA: `CAbupYs26xLzYji3MYgbxPgyTy9ixKGwP5dMFLMW9YES`
- Old authority / reserve owner: `82bFerPuS2MsgmYHdbVBRSXQp6YLDJZSGCJERWcZwEyF`
- Supply minted: 4,200,000,000 DNCH (9 decimals).
- Reserve amount observed with CLI on 25 October 2026: 4,199,998,990 DNCH; no delegate; no freeze authority on mint.
- 1,010 DNCH exist outside that reserve. Their ownership/control has NOT yet been independently verified.
- Owner reports loss of the old signer's key after deleting WSL/Ubuntu; the public data does not reveal or restore that key.
- **Nothing in v2 moves or takes possession of existing v1 tokens.** New token ≠ old token.

## Proposal: v2
- Network: Solana mainnet-beta; **test on devnet first**.
- Program: original SPL Token Program (`TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`), not Token-2022.
- Name: **DNCH Coin v2**; symbol: **DNCH**. Never trust symbol alone: new mint address is the identity.
- Decimals: 9.
- Planned initial issuance: **4,200,000,000 DNCH**, exactly **4,200,000,000,000,000,000** base units, below the uint64 max.
- Mint authority: the new locally controlled signer, optionally revoked **only after** on-chain verification.
- Freeze authority: **must be absent**. The script stops before issuance if it detects a freeze authority.
- All freshly issued tokens initially stay in the **new owner-controlled token account**. This is **not equivalent to circulating supply**.
- Metaplex metadata points to `token-v2/metadata.json` on the official GitHub Pages site after publication. Existing `dnch-logo.png` is reused.

## Do this on the owner's own computer only

1. Choose a new wallet that you **personally control** and can restore from offline backups. Never expose or paste seed phrases or keypair JSON in GitHub, GitHub Actions, Vercel, Supabase, chat, screenshots, or cloud storage. The script needs an absolute path to a **local** Solana CLI keypair, not a Phantom password.
2. Review and finalize tokenomics, treasury custody and the public v1/v2 disclosure. If a migration/redemption plan is desired, it must be separately designed: v2 ownership is **not** automatically granted to v1 holders.
3. Install/update Solana CLI, SPL Token CLI, Metaplex CLI (`mplx`), `curl`, `jq`. Check `solana --version`, `spl-token --version`, `mplx --version` and command help before real transactions. Consider hardware signing or a multisig treasury after initial issuance.
4. On **devnet**, create a locally backed-up *test* signer and fund with faucet SOL. Use:
   ```bash
   bash token-v2/launch.sh --check /ABSOLUTE/LOCAL/TEST-WALLET.json --network devnet
   bash token-v2/launch.sh --launch /ABSOLUTE/LOCAL/TEST-WALLET.json --network devnet
   bash token-v2/launch.sh --status /ABSOLUTE/LOCAL/TEST-WALLET.json --network devnet
   ```
   Test on devnet only **after** the docs and metadata are reviewed. A devnet mint is not the mainnet v2 mint.
5. **Mainnet prerequisite:** merge/release `token-v2/metadata.json` and verify `https://dnchcoin.github.io/dnch-coin/token-v2/metadata.json` returns the correct public JSON and the logo loads. Make a *different*, independently backed-up mainnet wallet. Fund it with SOL sufficient for mint/token accounts/metadata rent and transaction fees. 
6. When ready, execute locally:
   ```bash
   bash token-v2/launch.sh --check /ABSOLUTE/LOCAL/MAINNET-WALLET.json --network mainnet
   bash token-v2/launch.sh --launch /ABSOLUTE/LOCAL/MAINNET-WALLET.json --network mainnet
   bash token-v2/launch.sh --status /ABSOLUTE/LOCAL/MAINNET-WALLET.json --network mainnet
   ```
   The interactive `--launch` prompt must be explicitly confirmed on the owner's machine. Transactions spend real SOL.
7. The public mint address is recorded locally at `~/.local/share/dnch-v2/mainnet/mint-address`. If a launch stops after the mint address has been written, use `--resume` (same network and signer), **never restart with `--launch`**. If a launch crashes between creating the mint and saving its address, inspect `~/.local/share/dnch-v2/mainnet/create-token-output.txt` and recover the public mint before doing anything else. No keys are written to this state directory.
8. Independently verify the new mint on a chain explorer and wallet: **owner**, 9 decimals, **4.2B** supply, reserve **4.2B**, freeze authority **none**, mint authority correct, metadata/URI/logo correct, and no unintended delegate. Publishing a name/logo in GitHub is not itself on-chain verification.
9. Only after all checks and explicit consent, optionally make the supply unchangeable:
   ```bash
   bash token-v2/launch.sh --finalize /ABSOLUTE/LOCAL/MAINNET-WALLET.json --network mainnet
   ```
   **This permanently revokes mint authority. It must never be done before confirming metadata and successful issuance.** Freeze authority is already required to be absent.
10. Update the official website and X with the verified new **mint address** and explicit v1/v2 distinction. Submit a separate Jupiter verification for v2. Do not reuse a v1 Jupiter review as a v2 review.

## Scope & risk decisions

The script is **locally operated**; it never broadcasts from CI. Its temporary CLI config does not overwrite the user's existing Solana config. It records only public addresses and progress markers. Devnet tests and GitHub static checks do **not** replace a mainnet audit.

- No liquidity pool, listing, token sale, value claim, automatic migration, or guaranteed market price is created.
- The old 4,199,998,990 DNCH reserve remains in the original inaccessible ATA unless the original signer returns.
- Circulating supply cannot be equated to the complete 4.2B issuance.
- Public communication should make token identity and treasury disclosure unmistakable.
- Launch ownership should be independent of one disposable WSL system and secured by recoverable, tested backups.
- Treasury allocation / vesting / giveaways require a separate distribution policy and (if public distribution is planned) appropriate legal compliance review.

## Source references
- https://solana.com/docs/tokens/quickstart
- https://solana.com/docs/references/spl-token-cli
- https://solana.com/docs/references/solana-cli
- https://www.metaplex.com/docs/dev-tools/cli/toolbox/add-metadata-to-token
