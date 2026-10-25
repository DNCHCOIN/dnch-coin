# DNCH Coin v2 — integration QA report

**Date:** 2026-10-25  
**Status:** Local validator transaction test **PASSED**; Solana mainnet mint **NOT DEPLOYED**.

## Real signed local validator test

GitHub Actions run: https://github.com/DNCHCOIN/dnch-coin/actions/runs/40207486887

Isolated short-lived Linux runner with:
- Solana CLI **4.3.2**
- SPL Token CLI **5.6.1**
- Metaplex CLI (`@metaplex-foundation/cli`) **0.5.0**
- `solana-test-validator` bound to `127.0.0.1:8899`, with Metaplex Token Metadata Program cloned from public Devnet.
- Disposable generated signing wallet funded with valueless local-validator SOL. The private key was deleted after the test.

### Confirmed test operations

1. Local validator initialized successfully.
2. New SPL token mint created under `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`.
3. Mint has **9 decimals**, freeze authority **not set**, mint authority was the temporary local signer.
4. Temporary owner's associated token account created.
5. Issued exactly **4,200,000,000** display DNCH units, equal to **4,200,000,000,000,000,000** raw units.
6. Owner token account balance matched the complete minted supply.
7. Metaplex added on-chain Token Metadata with the name **DNCH Coin v2**, symbol **DNCH**, and configured public JSON URI. CLI reported metadata created successfully.
8. Mint authority revocation succeeded; `spl-token display` thereafter reported **Mint authority: (not set)**.
9. Freeze authority remained **(not set)**.
10. Temporary wallet and local-chain state were cleaned up. Local test mint is ephemeral and must **never** be advertised as an official mint.

### Devnet faucet restriction

An independent GitHub Actions test attempted to obtain free Devnet SOL through the public airdrop RPC. All three requests failed because the shared GitHub runner was rate limited. That run **did not create a Devnet mint** and did not exercise the launcher. Its failure is not evidence of a token or code malfunction. The rate-limit-dependent automation was removed. Devnet testing remains an optional additional milestone before Mainnet.

### What this does NOT establish

- No DNCH Coin v2 mint exists in **Mainnet**.
- The project does not control a new mainnet signer/key from this run.
- No public release, circulation, liquidity pool, exchange listing or Jupiter verification has happened.
- The local mint, its addresses and test SOL are not transferable to Mainnet.
- Successful local execution does not replace verifying the selected personal mainnet wallet and sufficient funding on launch day.

### Remaining custody and launch requirements

A new, owner-controlled mainnet signer with an independently tested offline backup; real SOL for account rent and transactions; confirmation of the planned 4.2B supply and allocation; final `--check` on mainnet; personally signed `--launch`; post-launch independent audit; optional separate mint-authority revocation; and publishing the **verified new** mint address to DNCH Hub.
