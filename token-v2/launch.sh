#!/usr/bin/env bash
# DNCH Coin v2. Runs on the OWNER'S trusted computer only.
# NEVER put a signing keypair in GitHub or a remote/cloud environment.
set -Eeuo pipefail
umask 077

ACTION="${1:-}"
KEYPAIR="${2:-}"
RPC="https://api.mainnet-beta.solana.com"
SUPPLY="4200000000"
RAW_SUPPLY="4200000000000000000"
OLD_MINT="8Ku27a4FnfzGmkLMQck3haKKAt4SJ4fmaCZDvrLtNSgi"
METADATA_URI="https://dnchcoin.github.io/dnch-coin/token-v2/metadata.json"
STATE_DIR="$HOME/.local/share/dnch-v2"
MINT_FILE="$STATE_DIR/mint-address"

usage() {
  echo "Usage: bash token-v2/launch.sh --check|--launch|--finalize /absolute/local/new-wallet.json" >&2
  exit 2
}
[[ "$ACTION" =~ ^(--check|--launch|--finalize)$ ]] || usage
[[ "$KEYPAIR" == /* && -f "$KEYPAIR" && -r "$KEYPAIR" ]] || { echo "Use a readable ABSOLUTE local keypair path (not its contents)." >&2; exit 2; }

command -v solana >/dev/null || { echo "Install solana CLI."; exit 2; }
command -v solana-keygen >/dev/null || { echo "Install solana-keygen."; exit 2; }
command -v spl-token >/dev/null || { echo "Install spl-token CLI."; exit 2; }
if [[ "$ACTION" == "--launch" ]]; then
  command -v mplx >/dev/null || { echo "Install Metaplex (mplx) CLI."; exit 2; }
fi

OWNER="$(solana-keygen pubkey "$KEYPAIR")"
[[ "$OWNER" != "$OLD_MINT" && "$OWNER" != "82bFerPuS2MsgmYHdbVBRSXQp6YLDJZSGCJERWcZwEyF" ]] || { echo "Refusing known old-account address."; exit 2; }
echo "Network: Solana MAINNET"
echo "New wallet/public authority: $OWNER"
echo "Token: DNCH Coin v2 (DNCH), decimals 9, issuance $SUPPLY"
echo "Original v1 mint (NOT touched): $OLD_MINT"
echo "Local signer path: $KEYPAIR (private contents never printed)"
solana --url "$RPC" balance "$OWNER"

if [[ "$ACTION" == "--check" ]]; then
  echo "Read-only check complete. No transactions were submitted."
  exit 0
fi

# This script temporarily selects the local keypair for Solana CLI and SPL Token CLI.
# It is intended for an isolated local working environment, not a shared computer.
solana config set --url "$RPC" --keypair "$KEYPAIR" >/dev/null

if [[ "$ACTION" == "--launch" ]]; then
  if [[ -e "$MINT_FILE" ]]; then
    echo "Existing local mint state at $MINT_FILE; launch will not create a second mint. Investigate first." >&2
    exit 1
  fi
  echo "This action SPENDS REAL SOL and creates a NEW, independent Solana token."
  read -r -p 'Type LAUNCH-DNCH-V2 to sign mainnet transactions: ' ANSWER
  [[ "$ANSWER" == "LAUNCH-DNCH-V2" ]] || { echo "Cancelled."; exit 1; }
  mkdir -p "$STATE_DIR"
  chmod 700 "$STATE_DIR"
  OUT="$(spl-token --url mainnet-beta create-token --decimals 9)"
  echo "$OUT"
  MINT="$(printf '%s\n' "$OUT" | awk '/^Address: / { print $2; exit }')"
  [[ "$MINT" =~ ^[1-9A-HJ-NP-Za-km-z]{32,44}$ ]] || {
    echo "Could not safely parse new mint. See output ABOVE and recover manually. DO NOT rerun --launch." >&2
    exit 1
  }
  printf '%s\n' "$MINT" > "$MINT_FILE"
  chmod 600 "$MINT_FILE"
  echo "Public mint saved: $MINT"
  spl-token --url mainnet-beta create-account "$MINT"
  # Rust CLI handles the full 4.2e18 raw units exactly (unlike JS floating point).
  spl-token --url mainnet-beta mint "$MINT" "$SUPPLY"
  DISPLAY="$(spl-token --url mainnet-beta display "$MINT")"
  echo "$DISPLAY"
  ACTUAL="$(printf '%s\n' "$DISPLAY" | sed -n 's/^[[:space:]]*Supply: *//p' | head -n 1)"
  [[ "$ACTUAL" == "$RAW_SUPPLY" ]] || {
    echo "Unexpected raw supply! Stop. Expected $RAW_SUPPLY; saw $ACTUAL." >&2
    exit 1
  }
  echo "Attaching metadata; ensure $METADATA_URI exists before this step."
  mplx toolbox token add-metadata "$MINT" --name "DNCH Coin v2" --symbol "DNCH" --uri "$METADATA_URI" -k "$KEYPAIR" -r "$RPC"
  echo "LAUNCH COMPLETED. Mint: $MINT"
  echo "NEXT: verify token, metadata and holder balance. Do not announce without verification."
elif [[ "$ACTION" == "--finalize" ]]; then
  [[ -f "$MINT_FILE" ]] || { echo "No local mint state. Aborting."; exit 1; }
  MINT="$(cat "$MINT_FILE")"
  [[ "$MINT" =~ ^[1-9A-HJ-NP-Za-km-z]{32,44}$ && "$MINT" != "$OLD_MINT" ]] || { echo "Invalid mint."; exit 1; }
  DISPLAY="$(spl-token --url mainnet-beta display "$MINT")"
  echo "$DISPLAY"
  ACTUAL="$(printf '%s\n' "$DISPLAY" | sed -n 's/^[[:space:]]*Supply: *//p' | head -n 1)"
  [[ "$ACTUAL" == "$RAW_SUPPLY" ]] || { echo "Incorrect supply. Refusing authority revoke."; exit 1; }
  echo "WARNING: Permanently revoking mint authority cannot be undone."
  read -r -p 'Type PERMANENTLY-REVOKE to revoke mint authority: ' ANSWER
  [[ "$ANSWER" == "PERMANENTLY-REVOKE" ]] || { echo "Cancelled."; exit 1; }
  spl-token --url mainnet-beta authorize "$MINT" mint --disable
  spl-token --url mainnet-beta display "$MINT"
  echo "Mint authority revocation submitted. Verify on-chain."
fi
