// T-010A — runtime-neutral envelope security tests (D-029). No network, no persistence.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createEnvelope, encodeEnvelope, decodeEnvelope, buildAscLink, decodeAscLink } from './asc-link.mjs';
import {
  MAX_LIFETIME_MS,
  canonicalJson,
  integrityPayload,
  parseIsoDateTime,
  sealEnvelope,
  validateEnvelopeSecurity
} from './envelope-security.mjs';

const sha256Hex = (text) => createHash('sha256').update(text, 'utf8').digest('hex');
const NOW = '2026-10-03T03:00:00.000Z';
const opts = { now: () => NOW, sha256Hex };

const contract = {
  Project: 'AISYNC',
  'Source method': 'ZASSIMPLE',
  Operation: 'SAVE',
  'Record type': 'proof',
  'Record ID': 'TEST_ONLY_T010A',
  'Content/change': { b: 'Simpan — ujian ✓', a: [3, 1, 2] },
  Lineage: ['D-029'],
  Destination: ['GitHub']
};

function sealed(overrides = {}) {
  return sealEnvelope(createEnvelope(contract, {
    requestId: 'TEST_ONLY_T010A_001',
    issuedAt: '2026-10-03T02:55:00Z',
    expiresAt: '2026-10-03T03:20:00Z',
    ...overrides
  }), sha256Hex);
}
const codeOf = (env, o = opts) => validateEnvelopeSecurity(env, o).code;

// ---- canonical JSON / digest determinism -------------------------------------------------
assert.equal(canonicalJson({ b: 1, a: { d: [2, 1], c: null } }), '{"a":{"c":null,"d":[2,1]},"b":1}');
assert.equal(canonicalJson({ a: 1, b: 2 }), canonicalJson({ b: 2, a: 1 }), 'key order irrelevant');
assert.notEqual(canonicalJson([1, 2]), canonicalJson([2, 1]), 'array order significant');
assert.equal(canonicalJson('✓'), '"✓"');
assert.throws(() => canonicalJson({ a: undefined }));
assert.throws(() => canonicalJson(NaN));
{
  const env = sealed();
  const reordered = { contract: { ...env.contract }, integrity: env.integrity, expires_at: env.expires_at, issued_at: env.issued_at, request_id: env.request_id, envelope_version: '0.1' };
  reordered.contract = Object.fromEntries(Object.entries(env.contract).reverse());
  assert.equal(validateEnvelopeSecurity(reordered, opts).ok, true, 'digest stable across key order');
  assert.deepStrictEqual(Object.keys(integrityPayload(env)).sort(), ['contract', 'envelope_version', 'expires_at', 'issued_at', 'request_id']);
  assert.equal(env.integrity.digest, sha256Hex(canonicalJson(integrityPayload(env))));
  const arr = JSON.parse(JSON.stringify(env));
  arr.contract.Lineage = ['X', 'Y'];
  const arrSealed = sealEnvelope(arr, sha256Hex);
  const swapped = JSON.parse(JSON.stringify(arrSealed));
  swapped.contract.Lineage = ['Y', 'X'];
  assert.equal(codeOf(swapped), 'INTEGRITY_MISMATCH', 'array order is part of the digest');
}

// ---- valid security ------------------------------------------------------------------------
{
  const r = validateEnvelopeSecurity(sealed(), opts);
  assert.equal(r.ok, true);
  assert.equal(r.requestId, 'TEST_ONLY_T010A_001');
  assert.equal(r.algorithm, 'SHA-256');
  assert.equal(MAX_LIFETIME_MS, 1800000);
  // exactly 30 minutes accepted
  assert.equal(validateEnvelopeSecurity(sealed({ issuedAt: '2026-10-03T02:50:00Z', expiresAt: '2026-10-03T03:20:00Z' }), opts).ok, true);
  // offset form accepted
  assert.equal(validateEnvelopeSecurity(sealed({ issuedAt: '2026-10-03T10:55:00+08:00', expiresAt: '2026-10-03T11:10:00.000+08:00' }), opts).ok, true);
}

// ---- expiry / lifetime ---------------------------------------------------------------------
assert.equal(codeOf(sealed({ issuedAt: '2026-10-03T02:00:00Z', expiresAt: '2026-10-03T02:30:00Z' })), 'REQUEST_EXPIRED');
assert.equal(codeOf(sealed({ issuedAt: '2026-10-03T02:40:00Z', expiresAt: '2026-10-03T03:00:00Z' })), 'REQUEST_EXPIRED', 'expires exactly now');
assert.equal(codeOf(sealed({ issuedAt: '2026-10-03T03:10:00Z', expiresAt: '2026-10-03T03:10:00Z' })), 'INVALID_LIFETIME');
assert.equal(codeOf(sealed({ issuedAt: '2026-10-03T03:10:00Z', expiresAt: '2026-10-03T03:05:00Z' })), 'INVALID_LIFETIME');
assert.equal(codeOf(sealed({ issuedAt: '2026-10-03T02:50:00Z', expiresAt: '2026-10-03T03:20:00.001Z' })), 'LIFETIME_EXCEEDED');
assert.equal(codeOf(sealed({ issuedAt: '2026-10-03T03:30:00Z', expiresAt: '2026-10-03T03:45:00Z' })), 'LIFETIME_EXCEEDED', 'future issued_at cannot extend remaining lifetime');
for (const bad of ['2026-10-03 03:10:00Z', '2026-10-03T03:10:00', '2026-02-30T00:00:00Z', '2026-13-01T00:00:00Z', '2026-10-03T25:00:00Z', 'tomorrow', '1759460400000']) {
  const env = sealed();
  env.expires_at = bad;
  assert.equal(codeOf(env), 'INVALID_TIMESTAMP', bad);
  assert.equal(parseIsoDateTime(bad), null, bad);
}
{
  const env = sealed();
  env.issued_at = 12345;
  assert.equal(codeOf(env), 'INVALID_TIMESTAMP');
  const noIssued = sealed();
  delete noIssued.issued_at;
  assert.equal(codeOf(noIssued), 'INVALID_ENVELOPE');
}

// ---- integrity -----------------------------------------------------------------------------
{
  const missingDigest = sealed();
  missingDigest.integrity = { algorithm: 'SHA-256', digest: null };
  assert.equal(codeOf(missingDigest), 'INTEGRITY_DIGEST_INVALID');
  const noIntegrity = sealed();
  noIntegrity.integrity = null;
  assert.equal(codeOf(noIntegrity), 'INTEGRITY_MISSING');
  const noDigestKey = sealed();
  noDigestKey.integrity = { algorithm: 'SHA-256' };
  assert.equal(codeOf(noDigestKey), 'INTEGRITY_MISSING');
  for (const algorithm of ['sha-256', 'SHA-1', 'HMAC-SHA-256', '']) {
    const env = sealed();
    env.integrity.algorithm = algorithm;
    assert.equal(codeOf(env), 'INTEGRITY_ALGORITHM_UNSUPPORTED', algorithm);
  }
  for (const digest of ['abc', 'A'.repeat(64), 'g'.repeat(64), sealed().integrity.digest.toUpperCase(), sealed().integrity.digest + '0']) {
    const env = sealed();
    env.integrity.digest = digest;
    assert.equal(codeOf(env), 'INTEGRITY_DIGEST_INVALID', digest);
  }
  const changedContract = sealed();
  changedContract.contract['Content/change'] = 'altered';
  assert.equal(codeOf(changedContract), 'INTEGRITY_MISMATCH');
  const changedId = sealed();
  changedId.request_id = 'TEST_ONLY_T010A_999';
  assert.equal(codeOf(changedId), 'INTEGRITY_MISMATCH');
  const changedExpiry = sealed();
  changedExpiry.expires_at = '2026-10-03T03:19:00Z';
  assert.equal(codeOf(changedExpiry), 'INTEGRITY_MISMATCH');
  const changedIssued = sealed();
  changedIssued.issued_at = '2026-10-03T02:56:00Z';
  assert.equal(codeOf(changedIssued), 'INTEGRITY_MISMATCH');
  const extra = sealed();
  extra.nonce = 'x';
  assert.equal(codeOf(extra), 'INVALID_ENVELOPE');
}

// ---- structure / config --------------------------------------------------------------------
assert.equal(codeOf(null), 'INVALID_ENVELOPE');
assert.equal(codeOf({ ...sealed(), envelope_version: '9' }), 'UNSUPPORTED_ENVELOPE_VERSION');
assert.equal(codeOf({ ...sealed(), request_id: '' }), 'MISSING_REQUEST_ID');
assert.equal(codeOf({ ...sealed(), contract: [] }), 'INVALID_ENVELOPE');
assert.equal(codeOf(sealed(), { now: () => NOW }), 'SECURITY_CONFIG_MISSING');
assert.equal(codeOf(sealed(), { sha256Hex }), 'SECURITY_CONFIG_MISSING');
assert.equal(codeOf(sealed(), { now: () => 'not a date', sha256Hex }), 'SECURITY_CLOCK_INVALID');
assert.equal(codeOf(sealed(), { now: () => NOW, sha256Hex: () => 'bad' }), 'INTEGRITY_UNAVAILABLE');
assert.equal(codeOf(sealed(), { now: () => NOW, sha256Hex: () => { throw new Error('x'); } }), 'INTEGRITY_UNAVAILABLE');

// ---- validation is pure: input not mutated -------------------------------------------------
{
  const env = sealed();
  const snap = JSON.stringify(env);
  validateEnvelopeSecurity(env, opts);
  assert.equal(JSON.stringify(env), snap);
}

// ---- ASC Link transport still round-trips the secure envelope ------------------------------
{
  const env = sealed();
  assert.deepStrictEqual(decodeEnvelope(encodeEnvelope(env)), env);
  const link = buildAscLink('https://script.google.com/macros/s/example/exec', env);
  const back = decodeAscLink(link);
  assert.deepStrictEqual(back, env);
  assert.equal(validateEnvelopeSecurity(back, opts).ok, true);
  assert.equal(new URL(link).search, '');
}

console.log('T-010A envelope security test: PASS');
