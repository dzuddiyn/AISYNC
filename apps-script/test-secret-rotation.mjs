import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';

const SOURCE = fs.readFileSync(new URL('./SecretRotation.gs', import.meta.url), 'utf8');

const ACTIVE = '-----BEGIN PRIVATE KEY-----\nACTIVE_KEY\n-----END PRIVATE KEY-----';
const CANDIDATE = '-----BEGIN PRIVATE KEY-----\nCANDIDATE_KEY\n-----END PRIVATE KEY-----';
const LEGACY = 'ghp_LEGACY_SECRET_SHOULD_NOT_LEAK';

function world({ candidate = CANDIDATE, legacy = LEGACY, failOnKeyCall = {} } = {}) {
  const props = new Map([
    ['GITHUB_APP_CLIENT_ID', 'Iv1.test'],
    ['GITHUB_APP_INSTALLATION_ID', '123456'],
    ['GITHUB_APP_PRIVATE_KEY', ACTIVE]
  ]);
  if (candidate !== null) props.set('ASC_GITHUB_APP_PRIVATE_KEY_CANDIDATE', candidate);
  if (legacy !== null) props.set('GITHUB_TOKEN', legacy);

  const keyCalls = new Map();
  const tokenForKey = key => {
    const count = (keyCalls.get(key) || 0) + 1;
    keyCalls.set(key, count);
    if (failOnKeyCall[key] === count) {
      return { ok: false, error: { code: 'TEST_KEY_REJECTED', message: 'rejected' } };
    }
    return { ok: true, token: 'ghs_TEST_' + count, expiresAt: '2026-10-04T15:00:00Z' };
  };

  const ctx = {
    console,
    JSON,
    Date,
    Object,
    Array,
    String,
    Boolean,
    RegExp,
    Error,
    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty: key => props.has(key) ? props.get(key) : null,
          setProperty: (key, value) => { props.set(key, String(value)); },
          deleteProperty: key => { props.delete(key); }
        };
      }
    },
    LockService: {
      getScriptLock() {
        return { tryLock: () => true, releaseLock: () => {} };
      }
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      Charset: { UTF_8: 'UTF_8' },
      computeDigest(_alg, value) {
        return Array.from(crypto.createHash('sha256').update(String(value)).digest(), b => b > 127 ? b - 256 : b);
      },
      getUuid() { return '11111111-2222-3333-4444-555555555555'; }
    },
    ascAuthorizationContext_: () => ({ owner: true }),
    ascIsOwner_: () => true,
    ascScriptProperty_(name) {
      return props.has(name) ? props.get(name) : null;
    },
    ascNormalizeGitHubAppPrivateKey_(pem) {
      if (typeof pem !== 'string' || !pem.includes('PRIVATE KEY')) {
        throw new Error('bad pem');
      }
      return pem;
    },
    ascGitHubAppInstallationTokenForConfig_(config) {
      return tokenForKey(config.privateKey);
    },
    ascGitHubAppInstallationToken_() {
      const key = props.get('GITHUB_APP_PRIVATE_KEY');
      return key ? tokenForKey(key) : { ok: false, error: { code: 'NO_ACTIVE_KEY' } };
    }
  };
  vm.createContext(ctx);
  vm.runInContext(SOURCE, ctx, { filename: 'SecretRotation.gs' });
  return { ctx, props, keyCalls };
}

const plain = value => JSON.parse(JSON.stringify(value));
const noSecrets = value => {
  const text = JSON.stringify(value);
  assert.equal(text.includes('ACTIVE_KEY'), false);
  assert.equal(text.includes('CANDIDATE_KEY'), false);
  assert.equal(text.includes('ghp_LEGACY_SECRET'), false);
};

// 1. Status returns fingerprints/presence only.
{
  const w = world();
  const status = plain(w.ctx.ascSecretRotationStatus_());
  assert.equal(status.active_present, true);
  assert.equal(status.candidate_present, true);
  assert.equal(status.previous_present, false);
  assert.equal(status.legacy_github_token_present, true);
  assert.equal(status.secret_values_exposed, false);
  assert.match(status.active_fingerprint, /^[0-9a-f]{64}$/);
  assert.match(status.candidate_fingerprint, /^[0-9a-f]{64}$/);
  assert.notEqual(status.active_fingerprint, status.candidate_fingerprint);
  noSecrets(status);

  w.props.set('ASC_GITHUB_APP_KEY_ROTATION_META', JSON.stringify({
    state: 'TEST',
    private_key: ACTIVE,
    token: LEGACY,
    note: 'must not escape'
  }));
  const sanitized = plain(w.ctx.ascSecretRotationStatus_());
  assert.equal(sanitized.metadata.state, 'TEST');
  assert.equal(Object.prototype.hasOwnProperty.call(sanitized.metadata, 'private_key'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(sanitized.metadata, 'token'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(sanitized.metadata, 'note'), false);
  noSecrets(sanitized);
}

// 2. Candidate validates live without changing active state.
{
  const w = world();
  const before = w.props.get('GITHUB_APP_PRIVATE_KEY');
  const result = plain(w.ctx.ascValidateGitHubAppKeyCandidate_());
  assert.equal(result.ok, true);
  assert.equal(result.status, 'CANDIDATE_VALID');
  assert.equal(w.props.get('GITHUB_APP_PRIVATE_KEY'), before);
  assert.equal(w.props.get('ASC_GITHUB_APP_PRIVATE_KEY_CANDIDATE'), CANDIDATE);
  noSecrets(result);
}

// 3. Promote keeps previous for rollback and verifies new active key.
{
  const w = world();
  const result = plain(w.ctx.ascPromoteGitHubAppKeyCandidate_());
  assert.equal(result.ok, true);
  assert.equal(result.status, 'ACTIVE_VERIFIED');
  assert.equal(result.previous_retained_for_rollback, true);
  assert.equal(w.props.get('GITHUB_APP_PRIVATE_KEY'), CANDIDATE);
  assert.equal(w.props.get('ASC_GITHUB_APP_PRIVATE_KEY_PREVIOUS'), ACTIVE);
  assert.equal(w.props.has('ASC_GITHUB_APP_PRIVATE_KEY_CANDIDATE'), false);
  const meta = JSON.parse(w.props.get('ASC_GITHUB_APP_KEY_ROTATION_META'));
  assert.equal(meta.state, 'ACTIVE_VERIFIED');
  noSecrets(result);
}

// 4. If post-promotion active verification fails, rotation auto-rolls back.
{
  const w = world({ failOnKeyCall: { [CANDIDATE]: 2 } });
  const result = plain(w.ctx.ascPromoteGitHubAppKeyCandidate_());
  assert.equal(result.ok, false);
  assert.equal(result.status, 'AUTO_ROLLED_BACK');
  assert.equal(w.props.get('GITHUB_APP_PRIVATE_KEY'), ACTIVE);
  assert.equal(w.props.get('ASC_GITHUB_APP_PRIVATE_KEY_CANDIDATE'), CANDIDATE);
  assert.equal(w.props.has('ASC_GITHUB_APP_PRIVATE_KEY_PREVIOUS'), false);
  assert.equal(JSON.parse(w.props.get('ASC_GITHUB_APP_KEY_ROTATION_META')).state, 'AUTO_ROLLED_BACK');
  noSecrets(result);
}

// 5. Candidate validation failure performs no key mutation.
{
  const w = world({ failOnKeyCall: { [CANDIDATE]: 1 } });
  const result = plain(w.ctx.ascPromoteGitHubAppKeyCandidate_());
  assert.equal(result.ok, false);
  assert.equal(result.status, 'CANDIDATE_VALIDATION_FAILED');
  assert.equal(w.props.get('GITHUB_APP_PRIVATE_KEY'), ACTIVE);
  assert.equal(w.props.get('ASC_GITHUB_APP_PRIVATE_KEY_CANDIDATE'), CANDIDATE);
  assert.equal(w.props.has('ASC_GITHUB_APP_PRIVATE_KEY_PREVIOUS'), false);
  noSecrets(result);
}

// 6. Manual rollback restores prior key and preserves promoted key as candidate.
{
  const w = world();
  const promoted = w.ctx.ascPromoteGitHubAppKeyCandidate_();
  assert.equal(promoted.ok, true);
  const result = plain(w.ctx.ascRollbackGitHubAppKeyRotation_());
  assert.equal(result.ok, true);
  assert.equal(result.status, 'MANUAL_ROLLBACK_VERIFIED');
  assert.equal(w.props.get('GITHUB_APP_PRIVATE_KEY'), ACTIVE);
  assert.equal(w.props.get('ASC_GITHUB_APP_PRIVATE_KEY_CANDIDATE'), CANDIDATE);
  assert.equal(w.props.has('ASC_GITHUB_APP_PRIVATE_KEY_PREVIOUS'), false);
  noSecrets(result);
}

// 7. Finalize requires explicit external old-key revocation confirmation.
{
  const w = world();
  w.ctx.ascPromoteGitHubAppKeyCandidate_();
  assert.throws(
    () => w.ctx.ascFinalizeGitHubAppKeyRotation_({ oldKeyRevoked: false }),
    /SECRET_ROTATION_OLD_KEY_REVOCATION_CONFIRMATION_REQUIRED/
  );
  assert.equal(w.props.get('ASC_GITHUB_APP_PRIVATE_KEY_PREVIOUS'), ACTIVE);

  const result = plain(w.ctx.ascFinalizeGitHubAppKeyRotation_({ oldKeyRevoked: true }));
  assert.equal(result.ok, true);
  assert.equal(result.status, 'FINALIZED');
  assert.equal(result.previous_secret_removed, true);
  assert.equal(w.props.get('GITHUB_APP_PRIVATE_KEY'), CANDIDATE);
  assert.equal(w.props.has('ASC_GITHUB_APP_PRIVATE_KEY_PREVIOUS'), false);
  assert.equal(JSON.parse(w.props.get('ASC_GITHUB_APP_KEY_ROTATION_META')).state, 'FINALIZED');
  noSecrets(result);
}

// 8. Legacy PAT retirement removes PAT only after GitHub App verification.
{
  const w = world();
  const result = plain(w.ctx.ascRetireLegacyGitHubReadToken_());
  assert.equal(result.ok, true);
  assert.equal(result.status, 'LEGACY_READ_TOKEN_RETIRED');
  assert.equal(w.props.has('GITHUB_TOKEN'), false);
  noSecrets(result);
}

// 9. Failed App verification restores legacy PAT exactly.
{
  const w = world({ failOnKeyCall: { [ACTIVE]: 1 } });
  const result = plain(w.ctx.ascRetireLegacyGitHubReadToken_());
  assert.equal(result.ok, false);
  assert.equal(result.status, 'LEGACY_TOKEN_RETIREMENT_ROLLED_BACK');
  assert.equal(w.props.get('GITHUB_TOKEN'), LEGACY);
  noSecrets(result);
}

// 10. Missing candidate and duplicate candidate fail safely.
{
  const missing = world({ candidate: null });
  const m = plain(missing.ctx.ascValidateGitHubAppKeyCandidate_());
  assert.equal(m.ok, false);
  assert.equal(m.status, 'CANDIDATE_KEY_MISSING');

  const same = world({ candidate: ACTIVE });
  const s = plain(same.ctx.ascValidateGitHubAppKeyCandidate_());
  assert.equal(s.ok, false);
  assert.equal(s.status, 'CANDIDATE_EQUALS_ACTIVE');
  assert.equal(same.props.get('GITHUB_APP_PRIVATE_KEY'), ACTIVE);
}

assert.doesNotMatch(SOURCE, /console\.log|Logger\.log/);
console.log('T-019F secret rotation state machine: PASS');
console.log('candidate validation / promote / auto-rollback / manual rollback / finalize / PAT retirement: PASS');
