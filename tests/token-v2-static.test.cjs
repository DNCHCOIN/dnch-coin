'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'token-v2/metadata.json'), 'utf8'));
const script = fs.readFileSync(path.join(root, 'token-v2/launch.sh'), 'utf8');
const readme = fs.readFileSync(path.join(root, 'token-v2/README.md'), 'utf8');

test('v2 metadata identifies a separate not-yet-issued token', () => {
  assert.equal(data.name, 'DNCH Coin v2');
  assert.equal(data.symbol, 'DNCH');
  assert.ok(data.description.includes('separate from the original'));
  assert.match(data.image, /^https:\/\/dnchcoin\.github\.io\/dnch-coin\/dnch-logo\.png$/);
  assert.ok(!Object.hasOwn(data, 'mint'));
});
test('mint quantity exactly fits Solana uint64 when using 9 decimals', () => {
  const nominal = 4_200_000_000n;
  const raw = nominal * 10n ** 9n;
  assert.equal(raw.toString(), '4200000000000000000');
  assert.ok(raw < 2n ** 64n);
  assert.ok(script.includes('EXPECTED_RAW="4200000000000000000"'));
  assert.ok(script.includes('UI_SUPPLY="4200000000"'));
});
test('launcher is local, refuses v1, and has guarded mainnet path', () => {
  assert.ok(script.includes('set -Eeuo pipefail'));
  assert.ok(script.includes('umask 077'));
  assert.ok(script.includes('prepare-dnch-coin-v2/token-v2/metadata.json'));
  assert.ok(script.includes('MAINNET-DNCH-V2'));
  assert.ok(script.includes('PERMANENTLY-REVOKE-MINT'));
  assert.ok(script.includes('--resume'));
  assert.ok(script.includes('OLD_MINT="8Ku27a4FnfzGmkLMQck3haKKAt4SJ4fmaCZDvrLtNSgi"'));
  assert.ok(script.includes('No saved mint address'));
  assert.ok(!script.includes('solana config set --url mainnet-beta'));
  assert.match(readme, /NOT DEPLOYED/);
});
