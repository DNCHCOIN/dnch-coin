#!/usr/bin/env bash
# DNCH Coin v2 — owner-operated, resumable Solana CLI launcher.
# This script MUST run only on the owner's trusted PC. Never commit/copy wallet keys.
set -Eeuo pipefail
umask 077

usage() {
  echo "Usage: bash token-v2/launch.sh --check|--launch|--resume|--status|--finalize /ABSOLUTE/PRIVATE/KEYPAIR.json [--network localnet|devnet|mainnet]" >&2
  exit 2
}
[ "$#" -eq 2 ] || [ "$#" -eq 4 ] || usage
MODE="$1"
KEYPAIR="$2"
NETWORK="mainnet"
if [ "$#" -eq 4 ]; then
  [ "$3" = "--network" ] || usage
  NETWORK="$4"
fi
case "$MODE" in --check|--launch|--resume|--status|--finalize) ;; *) usage ;; esac
case "$NETWORK" in localnet) RPC="http://127.0.0.1:8899";; devnet) RPC="https://api.devnet.solana.com";; mainnet) RPC="https://api.mainnet-beta.solana.com";; *) usage ;; esac
[ -f "$KEYPAIR" ] && [ -r "$KEYPAIR" ] || { echo "Missing/unreadable local signing keypair." >&2; exit 2; }
case "$KEYPAIR" in /*) ;; *) echo "Use an ABSOLUTE path to a local keypair." >&2; exit 2;; esac

command -v solana >/dev/null
command -v solana-keygen >/dev/null
command -v spl-token >/dev/null
OWNER="$(solana-keygen pubkey "$KEYPAIR")"
OLD_OWNER="82bFerPuS2MsgmYHdbVBRSXQp6YLDJZSGCJERWcZwEyF"
OLD_MINT="8Ku27a4FnfzGmkLMQck3haKKAt4SJ4fmaCZDvrLtNSgi"
[ "$OWNER" != "$OLD_OWNER" ] || { echo "Refusing original inaccessible wallet as v2 authority." >&2; exit 1; }
STATE="$HOME/.local/share/dnch-v2/$NETWORK"
MINT_FILE="$STATE/mint-address"
START_MARKER="$STATE/launch-started"
META_MARKER="$STATE/metadata-completed"
CREATE_LOG="$STATE/create-token-output.txt"
EXPECTED_RAW="4200000000000000000"
UI_SUPPLY="4200000000"
if [ "$NETWORK" = "mainnet" ]; then
  URI="https://dnchcoin.github.io/dnch-coin/token-v2/metadata.json"
else
  URI="https://raw.githubusercontent.com/DNCHCOIN/dnch-coin/main/token-v2/metadata.json"
fi

# Temporary config isolates signer/RPC from the user's existing ~/.config/solana/cli/config.yml.
CONFIG="$(mktemp)"
trap 'rm -f "$CONFIG"' EXIT
solana --config "$CONFIG" config set --url "$RPC" --keypair "$KEYPAIR" >/dev/null
spl() { spl-token --config "$CONFIG" --url "$RPC" "$@"; }
require_mint() {
  [ -f "$MINT_FILE" ] || { echo "No saved mint address. Check $CREATE_LOG for recovery; never rerun --launch blindly." >&2; exit 1; }
  MINT="$(cat "$MINT_FILE")"
  [[ "$MINT" =~ ^[1-9A-HJ-NP-Za-km-z]{32,44}$ ]] || { echo "Invalid saved mint address." >&2; exit 1; }
  [ "$MINT" != "$OLD_MINT" ] || { echo "Refusing to operate on old mint." >&2; exit 1; }
}
display_raw_supply() {
  local output
  output="$(spl display "$MINT")"
  printf '%s\n' "$output" >&2
  printf '%s\n' "$output" | awk '$1 == "Supply:" {print $2; exit}'
}
verify_mint_authorities() {
  local d
  d="$(spl display "$MINT")"
  printf '%s\n' "$d" | grep -Eq "Freeze authority:[[:space:]]*\\(not set\\)" || {
    echo "Freeze authority is set or unreadable. Aborting before issuance." >&2; exit 1;
  }
  printf '%s\n' "$d" | grep -Fq "Mint authority: $OWNER" || {
    echo "Expected mint authority does not match the new wallet. Aborting." >&2; exit 1;
  }
}
check_metadata_url() {
  command -v curl >/dev/null
  command -v jq >/dev/null
  curl --connect-timeout 10 --max-time 25 -fsSL "$URI" |
    jq -e '.name=="DNCH Coin v2" and .symbol=="DNCH" and (.image|type=="string") and (.description|type=="string")' >/dev/null || {
      echo "Metadata URI is not publicly available / does not match. Aborting." >&2; exit 1;
    }
}
echo "Network: $NETWORK ($RPC)"
echo "Owner and fee payer (public): $OWNER"
echo "Token: DNCH Coin v2 / DNCH / 9 decimals / $UI_SUPPLY units"
echo "Original v1 untouched: $OLD_MINT"
solana --config "$CONFIG" --url "$RPC" balance "$OWNER"

if [ "$MODE" = "--check" ]; then
  echo "Read-only check; no transactions submitted."
  if [ "$NETWORK" = "mainnet" ]; then check_metadata_url; fi
  exit 0
fi
if [ "$MODE" = "--status" ]; then
  if [ -f "$MINT_FILE" ]; then
    require_mint
    echo "Recorded v2 mint: $MINT"
    spl display "$MINT"
    spl balance "$MINT" || true
  else
    echo "No v2 mint recorded in $MINT_FILE"
  fi
  exit 0
fi
command -v mplx >/dev/null || { echo "Metaplex mplx CLI is required for metadata." >&2; exit 2; }
check_metadata_url

if [ "$MODE" = "--launch" ]; then
  [ ! -e "$START_MARKER" ] && [ ! -e "$MINT_FILE" ] || {
    echo "Previous launch was started. Use --resume if mint-address exists; inspect create-token-output.txt otherwise." >&2; exit 1;
  }
  echo "Creates a new TOKEN MINT and SPENDS SOL. It does NOT migrate original holders."
  echo "Wallet must already be backed up securely outside WSL; this script does not back it up."
  if [ "$NETWORK" = "mainnet" ]; then
    read -r -p 'Type MAINNET-DNCH-V2 to approve real mainnet transactions: ' CONFIRM
    [ "$CONFIRM" = "MAINNET-DNCH-V2" ] || exit 1
  else
    if [ "$NETWORK" = "devnet" ]; then
      read -r -p 'Type DEVNET-DNCH-V2 to approve test transactions: ' CONFIRM
      [ "$CONFIRM" = "DEVNET-DNCH-V2" ] || exit 1
    else
      read -r -p 'Type LOCALNET-DNCH-V2 to approve local-only test transactions: ' CONFIRM
      [ "$CONFIRM" = "LOCALNET-DNCH-V2" ] || exit 1
    fi
  fi
  mkdir -p "$STATE"
  : > "$START_MARKER"
  echo "Creating new mint (any successful output is saved locally)."
  if ! spl create-token --decimals 9 > "$CREATE_LOG" 2>&1; then
    cat "$CREATE_LOG" >&2
    echo "Creation failed or status unknown. Inspect the log before any retry." >&2
    exit 1
  fi
  cat "$CREATE_LOG"
  MINT="$(awk '$1=="Address:" {print $2; exit}' "$CREATE_LOG")"
  if ! [[ "$MINT" =~ ^[1-9A-HJ-NP-Za-km-z]{32,44}$ ]]; then
    echo "Mint may exist but its address was not parsed. Inspect $CREATE_LOG and recover manually; DO NOT relaunch." >&2
    exit 1
  fi
  printf '%s\n' "$MINT" > "$MINT_FILE"
  chmod 600 "$MINT_FILE"
  echo "New mint address recorded: $MINT"
fi

if [ "$MODE" = "--launch" ] || [ "$MODE" = "--resume" ]; then
  require_mint
  verify_mint_authorities
  RAW="$(display_raw_supply)"
  if [ "$RAW" = "0" ]; then
    echo "Creating owner's associated token account if needed."
    if ! spl balance "$MINT" >/dev/null 2>&1; then spl create-account "$MINT"; fi
    echo "Minting exactly $UI_SUPPLY display units ($EXPECTED_RAW raw units)."
    spl mint "$MINT" "$UI_SUPPLY"
    RAW="$(display_raw_supply)"
  fi
  [ "$RAW" = "$EXPECTED_RAW" ] || { echo "Unexpected supply $RAW; stop, do not mint or finalize again." >&2; exit 1; }
  [ "$(spl balance "$MINT")" = "$UI_SUPPLY" ] || {
    echo "Owner's reserve balance does not match entire new issuance. Stop for independent review." >&2; exit 1;
  }
  if [ ! -f "$META_MARKER" ]; then
    echo "Adding on-chain Metaplex token metadata from $URI."
    echo "If metadata was previously attached and only the marker is missing, inspect on-chain and resolve manually."
    mplx toolbox token add-metadata "$MINT" --name "DNCH Coin v2" --symbol "DNCH" --uri "$URI" -k "$KEYPAIR" -r "$RPC"
    : > "$META_MARKER"
  fi
  echo "Token issuance and metadata stages completed. Mint: $MINT"
  echo "NEXT: independently verify authority, supply, metadata and backup BEFORE --finalize."
  exit 0
fi

if [ "$MODE" = "--finalize" ]; then
  require_mint
  [ -f "$META_MARKER" ] || { echo "Metadata stage not completed; abort." >&2; exit 1; }
  verify_mint_authorities
  [ "$(display_raw_supply)" = "$EXPECTED_RAW" ] || { echo "Unexpected supply; abort." >&2; exit 1; }
  [ "$(spl balance "$MINT")" = "$UI_SUPPLY" ] || { echo "Reserve balance mismatch; abort." >&2; exit 1; }
  echo "WARNING: Removing Mint Authority is irreversible. No additional DNCH v2 can ever be minted."
  echo "Confirm metadata and wallet backup before proceeding."
  read -r -p 'Type PERMANENTLY-REVOKE-MINT to finalize: ' CONFIRM
  [ "$CONFIRM" = "PERMANENTLY-REVOKE-MINT" ] || exit 1
  spl authorize "$MINT" mint --disable
  spl display "$MINT"
  echo "Verify on-chain that Mint authority is (not set)."
fi
