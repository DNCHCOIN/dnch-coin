#!/usr/bin/env bash
# Offline mock integration test. It intentionally NEVER runs the real Solana CLIs.
set -Eeuo pipefail
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/bin" "$TMP/home" "$TMP/mock"
export HOME="$TMP/home" MOCK_ROOT="$TMP/mock" MOCK_METADATA="$PWD/token-v2/metadata.json"
printf 'FAKE - NOT A REAL KEY\n' > "$TMP/fake-key.json"

cat > "$TMP/bin/solana-keygen" <<'SH'
#!/usr/bin/env bash
[ "$1" = "pubkey" ] || exit 10
echo "4VDBUbey88djrcanKEmPmDhAAsyBMnwbW99orFSxYdtr"
SH
cat > "$TMP/bin/solana" <<'SH'
#!/usr/bin/env bash
case " $* " in
  *" config set "*) exit 0 ;;
  *" balance "*) echo "10 SOL"; exit 0 ;;
esac
echo "Unexpected solana call" >&2
exit 11
SH
cat > "$TMP/bin/spl-token" <<'SH'
#!/usr/bin/env bash
CMD=""
for word in "$@"; do
  case "$word" in
    create-token|display|balance|create-account|mint|authorize) CMD="$word"; break ;;
  esac
done
case "$CMD" in
  create-token)
    echo "create-token" >> "$MOCK_ROOT/calls"
    echo "Creating token 4Nd1mYxKfr7PBhWBe5wbfTZyE33foNHe16FDmBdt6xiM"
    echo "Address: 4Nd1mYxKfr7PBhWBe5wbfTZyE33foNHe16FDmBdt6xiM"
    ;;
  display)
    echo "SPL Token Mint"
    printf 'Supply: %s\n' "$(cat "$MOCK_ROOT/supply" 2>/dev/null || echo 0)"
    echo "Decimals: 9"
    if [ -f "$MOCK_ROOT/revoked" ]; then
      echo "Mint authority: (not set)"
    else
      echo "Mint authority: 4VDBUbey88djrcanKEmPmDhAAsyBMnwbW99orFSxYdtr"
    fi
    echo "Freeze authority: (not set)"
    ;;
  balance)
    [ -f "$MOCK_ROOT/ata" ] || exit 12
    if [ -f "$MOCK_ROOT/supply" ]; then
      echo "4200000000"
    else
      echo "0"
    fi
    ;;
  create-account)
    echo "create-account" >> "$MOCK_ROOT/calls"
    touch "$MOCK_ROOT/ata"
    ;;
  mint)
    echo "mint" >> "$MOCK_ROOT/calls"
    echo "4200000000000000000" > "$MOCK_ROOT/supply"
    ;;
  authorize)
    echo "authorize" >> "$MOCK_ROOT/calls"
    touch "$MOCK_ROOT/revoked"
    ;;
  *)
    echo "Unexpected spl-token command: $*" >&2
    exit 13
    ;;
esac
SH
cat > "$TMP/bin/mplx" <<'SH'
#!/usr/bin/env bash
echo "mplx add-metadata" >> "$MOCK_ROOT/calls"
SH
cat > "$TMP/bin/curl" <<'SH'
#!/usr/bin/env bash
cat "$MOCK_METADATA"
SH
chmod +x "$TMP/bin/"*
export PATH="$TMP/bin:$PATH"
LAUNCHER="token-v2/launch.sh"
WALLET="$TMP/fake-key.json"
bash "$LAUNCHER" --check "$WALLET" --network devnet > "$TMP/check.out"
[ ! -f "$MOCK_ROOT/calls" ] || { echo "Read-only check submitted a transaction"; exit 1; }
printf 'DEVNET-DNCH-V2\n' | bash "$LAUNCHER" --launch "$WALLET" --network devnet > "$TMP/launch.out"
MINT_FILE="$HOME/.local/share/dnch-v2/devnet/mint-address"
[ -s "$MINT_FILE" ]
[ -f "$HOME/.local/share/dnch-v2/devnet/metadata-completed" ]
# Duplicated invocation MUST fail before creating a second mint
if printf 'DEVNET-DNCH-V2\n' | bash "$LAUNCHER" --launch "$WALLET" --network devnet > "$TMP/dup.out" 2>&1; then
  echo "Repeated launch wrongly succeeded" >&2; exit 1
fi
bash "$LAUNCHER" --resume "$WALLET" --network devnet > "$TMP/resume.out"
bash "$LAUNCHER" --status "$WALLET" --network devnet > "$TMP/status.out"
[ "$(grep -c '^create-token$' "$MOCK_ROOT/calls")" -eq 1 ]
[ "$(grep -c '^mint$' "$MOCK_ROOT/calls")" -eq 1 ]
[ "$(grep -c '^mplx add-metadata$' "$MOCK_ROOT/calls")" -eq 1 ]
printf 'PERMANENTLY-REVOKE-MINT\n' | bash "$LAUNCHER" --finalize "$WALLET" --network devnet > "$TMP/finalize.out"
[ -f "$MOCK_ROOT/revoked" ]
echo "Offline mock check passed: check / launch / duplicate guard / resume / status / finalize"
