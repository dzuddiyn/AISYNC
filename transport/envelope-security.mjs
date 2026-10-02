// T-010A — runtime-neutral ASC envelope security validation (D-029).
//
// Pure functions only: no network, no persistence, no clock or crypto of its own.
// The SHA-256 implementation (`sha256Hex(text) -> lowercase hex`, UTF-8 input) and the
// validation time are injected so the same code runs in Node and Apps Script.
//
// Boundary: SHA-256 carried with the payload gives integrity consistency / error detection
// only. It is NOT sender authentication, a signature, or a MAC: anyone able to rewrite the
// payload can also recompute the digest. Owner identity and the replay claim are enforced
// separately by the server binding.

export const SECURITY_ENVELOPE_VERSION = '0.1';
export const INTEGRITY_ALGORITHM = 'SHA-256';
export const MAX_LIFETIME_MS = 30 * 60 * 1000;

const ENVELOPE_KEYS = Object.freeze(['contract', 'envelope_version', 'expires_at', 'integrity', 'issued_at', 'request_id']);
const INTEGRITY_KEYS = Object.freeze(['algorithm', 'digest']);
const DIGEST_PATTERN = /^[0-9a-f]{64}$/;
const ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?(Z|([+-])(\d{2}):(\d{2}))$/;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function reject(code, message) {
  return { ok: false, code, message };
}

function sameKeys(value, expected) {
  const keys = Object.keys(value).sort();
  return keys.length === expected.length && keys.every(function (k, i) { return k === expected[i]; });
}

// Deterministic canonical JSON: object keys sorted recursively, array order preserved,
// scalars serialized exactly as JSON.stringify does. Non-JSON values throw.
export function canonicalJson(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Non-finite number is not canonical JSON.');
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJson).join(',') + ']';
  }
  if (isPlainObject(value)) {
    return '{' + Object.keys(value).sort().map(function (key) {
      return JSON.stringify(key) + ':' + canonicalJson(value[key]);
    }).join(',') + '}';
  }
  throw new Error('Unsupported value in canonical JSON.');
}

// The digest input: everything except the integrity object itself.
export function integrityPayload(envelope) {
  return {
    envelope_version: envelope.envelope_version,
    request_id: envelope.request_id,
    issued_at: envelope.issued_at,
    expires_at: envelope.expires_at,
    contract: envelope.contract
  };
}

function digestOf(envelope, sha256Hex) {
  const digest = sha256Hex(canonicalJson(integrityPayload(envelope)));
  if (typeof digest !== 'string' || !DIGEST_PATTERN.test(digest)) {
    throw new Error('Digest implementation returned an invalid SHA-256 hex value.');
  }
  return digest;
}

// Returns a copy of the envelope with integrity.digest set. Used by link generators/tests.
export function sealEnvelope(envelope, sha256Hex) {
  if (typeof sha256Hex !== 'function') {
    throw new Error('sha256Hex implementation is required.');
  }
  const sealed = JSON.parse(JSON.stringify(envelope));
  sealed.integrity = { algorithm: INTEGRITY_ALGORITHM, digest: digestOf(sealed, sha256Hex) };
  return sealed;
}

// Strict ISO 8601 date-time with explicit offset; returns epoch ms or null.
export function parseIsoDateTime(value) {
  if (typeof value !== 'string') return null;
  const m = ISO_PATTERN.exec(value);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);
  const second = Number(m[6]);
  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return null;
  if (new Date(Date.UTC(year, month - 1, day)).getUTCDate() !== day || day < 1) return null;
  if (m[9] !== undefined && (Number(m[10]) > 23 || Number(m[11]) > 59)) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

// Structural + expiry/lifetime + integrity validation. Order (D-029):
// structure → timestamps → lifetime → not expired → algorithm/digest format → digest match.
export function validateEnvelopeSecurity(envelope, { now, sha256Hex } = {}) {
  if (typeof now !== 'function' || typeof sha256Hex !== 'function') {
    return reject('SECURITY_CONFIG_MISSING', 'Server clock and SHA-256 implementation are required.');
  }
  if (!isPlainObject(envelope)) {
    return reject('INVALID_ENVELOPE', 'A decoded ASC envelope object is required.');
  }
  if (envelope.envelope_version !== SECURITY_ENVELOPE_VERSION) {
    return reject('UNSUPPORTED_ENVELOPE_VERSION', 'Unsupported ASC envelope version.');
  }
  if (!sameKeys(envelope, ENVELOPE_KEYS)) {
    return reject('INVALID_ENVELOPE', 'Envelope must contain exactly envelope_version, request_id, issued_at, expires_at, integrity, contract.');
  }
  if (typeof envelope.request_id !== 'string' || envelope.request_id.length === 0) {
    return reject('MISSING_REQUEST_ID', 'Envelope request_id is required.');
  }
  if (!isPlainObject(envelope.contract)) {
    return reject('INVALID_ENVELOPE', 'Envelope contract must be a JSON object.');
  }

  const issuedMs = parseIsoDateTime(envelope.issued_at);
  const expiresMs = parseIsoDateTime(envelope.expires_at);
  if (issuedMs === null || expiresMs === null) {
    return reject('INVALID_TIMESTAMP', 'issued_at and expires_at must be valid ISO date-time strings with an explicit offset.');
  }
  if (expiresMs <= issuedMs) {
    return reject('INVALID_LIFETIME', 'expires_at must be later than issued_at.');
  }
  if (expiresMs - issuedMs > MAX_LIFETIME_MS) {
    return reject('LIFETIME_EXCEEDED', 'Envelope lifetime exceeds 30 minutes.');
  }

  let nowMs;
  try {
    nowMs = Date.parse(now());
  } catch (error) {
    nowMs = NaN;
  }
  if (!Number.isFinite(nowMs)) {
    return reject('SECURITY_CLOCK_INVALID', 'Server clock did not return a valid date-time.');
  }
  if (nowMs >= expiresMs) {
    return reject('REQUEST_EXPIRED', 'ASC request has expired.');
  }
  // Remaining lifetime may never exceed the maximum either (e.g. issued_at in the future).
  if (expiresMs - nowMs > MAX_LIFETIME_MS) {
    return reject('LIFETIME_EXCEEDED', 'Remaining envelope lifetime exceeds 30 minutes.');
  }

  const integrity = envelope.integrity;
  if (!isPlainObject(integrity) || !sameKeys(integrity, INTEGRITY_KEYS)) {
    return reject('INTEGRITY_MISSING', 'Envelope integrity must contain exactly algorithm and digest.');
  }
  if (integrity.algorithm !== INTEGRITY_ALGORITHM) {
    return reject('INTEGRITY_ALGORITHM_UNSUPPORTED', 'integrity.algorithm must be SHA-256.');
  }
  if (typeof integrity.digest !== 'string' || !DIGEST_PATTERN.test(integrity.digest)) {
    return reject('INTEGRITY_DIGEST_INVALID', 'integrity.digest must be a lowercase 64-character SHA-256 hex digest.');
  }

  let expected;
  try {
    expected = digestOf(envelope, sha256Hex);
  } catch (error) {
    return reject('INTEGRITY_UNAVAILABLE', 'Integrity digest could not be computed.');
  }
  if (expected !== integrity.digest) {
    return reject('INTEGRITY_MISMATCH', 'Envelope content does not match its SHA-256 digest.');
  }

  return {
    ok: true,
    requestId: envelope.request_id,
    issuedAt: envelope.issued_at,
    expiresAt: envelope.expires_at,
    algorithm: INTEGRITY_ALGORITHM
  };
}
