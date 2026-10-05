import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';

const SOURCE = fs.readFileSync(new URL('./BetaAccess.gs', import.meta.url), 'utf8');
const MANIFEST = JSON.parse(fs.readFileSync(new URL('./appsscript.json', import.meta.url), 'utf8'));

const OWNER = 'owner@example.test';
const REGISTRY = {
  schema_version: '0.1',
  projects: {
    AISYNC: {
      repository: 'dzuddiyn/AISYNC',
      branch: 'main',
      path_prefix: 'records',
      extension: '.md',
      allowed_operations: ['SAVE']
    },
    BETA2: {
      repository: 'dzuddiyn/AISYNC',
      branch: 'main',
      path_prefix: 'records',
      extension: '.md',
      allowed_operations: ['SAVE']
    }
  }
};

const signed = buf => Array.from(buf, b => b > 127 ? b - 256 : b);
const hash = value => crypto.createHash('sha256').update(String(value)).digest('hex');

function makeWorld() {
  const store = {};
  let activeUser = OWNER;
  let tempKey = 'owner-temp-key';
  let uuidCounter = 0;
  const lock = { held: false };

  const ctx = {
    console,
    JSON,
    Date,
    Object,
    Array,
    String,
    Boolean,
    Number,
    RegExp,
    Error,
    encodeURIComponent,
    Utilities: {
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      Charset: { UTF_8: 'UTF_8' },
      computeDigest(_alg, value) {
        return signed(crypto.createHash('sha256').update(String(value)).digest());
      },
      getUuid() {
        uuidCounter += 1;
        return ('00000000-0000-4000-8000-' + String(uuidCounter).padStart(12, '0'));
      }
    },
    Session: {
      getActiveUser: () => ({ getEmail: () => activeUser }),
      getEffectiveUser: () => ({ getEmail: () => OWNER }),
      getTemporaryActiveUserKey: () => tempKey
    },
    ScriptApp: {
      getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/BETA/exec' })
    },
    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty: key => Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null,
          setProperty: (key, value) => { store[key] = String(value); },
          deleteProperty: key => { delete store[key]; },
          getProperties: () => ({ ...store })
        };
      }
    },
    LockService: {
      getScriptLock() {
        let mine = false;
        return {
          tryLock() {
            if (lock.held) return false;
            lock.held = true;
            mine = true;
            return true;
          },
          releaseLock() {
            if (mine) lock.held = false;
            mine = false;
          }
        };
      }
    },
    ascProductionRegistry_: () => ({ ok: true, registry: REGISTRY })
  };

  ctx.ascIsOwner_ = context => Boolean(context) &&
    typeof context.activeUser === 'string' &&
    context.activeUser.length > 0 &&
    context.activeUser === context.effectiveUser;

  ctx.ascAuthorizationContext_ = () => {
    const base = {
      activeUser: activeUser || '',
      effectiveUser: OWNER
    };
    return typeof ctx.ascBetaAuthorizationContext_ === 'function'
      ? ctx.ascBetaAuthorizationContext_(base)
      : base;
  };

  vm.createContext(ctx);
  vm.runInContext(SOURCE, ctx, { filename: 'BetaAccess.gs' });

  return {
    ctx,
    store,
    setUser(email, key) {
      activeUser = email;
      tempKey = key;
    }
  };
}

const plain = value => JSON.parse(JSON.stringify(value));

// Manifest must require a signed-in Google user while preserving owner execution authority.
assert.equal(MANIFEST.webapp.access, 'ANYONE');
assert.equal(MANIFEST.webapp.executeAs, 'USER_DEPLOYING');

const w = makeWorld();

// Owner is always authorized and remains distinguishable from beta participants.
{
  const state = plain(w.ctx.getBetaAccessState());
  assert.equal(state.ok, true);
  assert.equal(state.access, 'OWNER');
  assert.equal(state.authorized, true);
  assert.deepEqual(state.allowed_projects, ['*']);
}

// Owner creates a one-time invitation scoped to AISYNC.
const invitation = plain(w.ctx.createBetaInvitation({
  label: 'BETA-01',
  allowed_projects: ['AISYNC'],
  invite_hours: 72,
  participant_days: 21
}));
assert.equal(invitation.ok, true);
assert.equal(invitation.status, 'INVITATION_CREATED');
assert.deepEqual(invitation.allowed_projects, ['AISYNC']);
assert.match(invitation.invite_url, /\?view=beta-enroll&invite=bta_[A-Za-z0-9]{64}$/);
const token = decodeURIComponent(invitation.invite_url.split('invite=')[1]);
assert.match(token, /^bta_[A-Za-z0-9]{64}$/);

// Raw invite token is never persisted.
assert.equal(JSON.stringify(w.store).includes(token), false);
assert.equal(Object.keys(w.store).some(key => key.includes(token)), false);

// Owner cannot accidentally consume an invitation intended for a beta participant.
{
  const ownerClaim = plain(w.ctx.claimBetaInvitation({ invite_token: token }));
  assert.equal(ownerClaim.ok, false);
  assert.equal(ownerClaim.error.code, 'OWNER_ALREADY_AUTHORIZED');
}

// A signed-in non-owner without enrollment is denied.
w.setUser('', 'temporary-user-key-1');
{
  const state = plain(w.ctx.getBetaAccessState());
  assert.equal(state.access, 'NOT_ALLOWLISTED');
  assert.equal(state.authorized, false);
}

// Claim binds the current temporary-user-key fingerprint, not the raw key.
const claim = plain(w.ctx.claimBetaInvitation({ invite_token: token }));
assert.equal(claim.ok, true);
assert.equal(claim.status, 'ENROLLED');
assert.equal(claim.label, 'BETA-01');
assert.deepEqual(claim.allowed_projects, ['AISYNC']);

const userFingerprint = hash('temporary-user-key-1');
const participantKey = 'asc.beta.participant.v1.' + userFingerprint;
assert.ok(Object.prototype.hasOwnProperty.call(w.store, participantKey));
assert.equal(JSON.stringify(w.store).includes('temporary-user-key-1'), false);
assert.equal(JSON.stringify(w.store).includes(token), false);

// Enrolled beta actor is authorized only for the invitation project scope.
{
  const context = plain(w.ctx.ascAuthorizationContext_());
  assert.equal(context.owner, false);
  assert.equal(context.betaAuthorized, true);
  assert.equal(typeof context.betaParticipantId, 'string');
  assert.deepEqual(context.betaAllowedProjects, ['AISYNC']);
  assert.equal(w.ctx.ascIsBetaActor_(context), true);
  assert.equal(w.ctx.ascBetaCanAccessProject_('AISYNC', context), true);
  assert.equal(w.ctx.ascBetaCanAccessProject_('BETA2', context), false);

  const state = plain(w.ctx.getBetaAccessState());
  assert.equal(state.access, 'BETA');
  assert.equal(state.authorized, true);
  assert.deepEqual(state.allowed_projects, ['AISYNC']);
}

// Same invitation is idempotent for the same enrolled user.
{
  const again = plain(w.ctx.claimBetaInvitation({ invite_token: token }));
  assert.equal(again.ok, true);
  assert.equal(again.status, 'ALREADY_ENROLLED');
}

// Same one-time invitation cannot be claimed by another user.
w.setUser('', 'temporary-user-key-2');
{
  const second = plain(w.ctx.claimBetaInvitation({ invite_token: token }));
  assert.equal(second.ok, false);
  assert.equal(second.error.code, 'INVITATION_ALREADY_CLAIMED');
}

// Beta participant cannot use owner-only administration.
assert.throws(() => w.ctx.listBetaAccessParticipants(), /BETA_ACCESS_OWNER_REQUIRED/);

// Owner can list sanitized participants and revoke by participant_id.
w.setUser(OWNER, 'owner-temp-key');
{
  const listed = plain(w.ctx.listBetaAccessParticipants());
  assert.equal(listed.ok, true);
  assert.equal(listed.participants.length, 1);
  assert.equal(listed.participants[0].label, 'BETA-01');
  const serialized = JSON.stringify(listed);
  assert.equal(serialized.includes(userFingerprint), false);
  assert.equal(serialized.includes('temporary-user-key-1'), false);
  assert.equal(serialized.includes(token), false);

  const revoked = plain(w.ctx.revokeBetaParticipant({
    participant_id: listed.participants[0].participant_id
  }));
  assert.equal(revoked.ok, true);
  assert.equal(revoked.status, 'PARTICIPANT_REVOKED');
}

// Revoked user immediately loses beta access.
w.setUser('', 'temporary-user-key-1');
assert.equal(plain(w.ctx.getBetaAccessState()).authorized, false);

// Project scope is checked against the production registry before invitation issuance.
w.setUser(OWNER, 'owner-temp-key');
{
  const bad = plain(w.ctx.createBetaInvitation({
    label: 'BETA-BAD',
    allowed_projects: ['NOT_REGISTERED']
  }));
  assert.equal(bad.ok, false);
  assert.equal(bad.error.code, 'BETA_ACCESS_PROJECT_NOT_AUTHORIZED');
}

// Invalid/partial invitation tokens fail without mutation.
w.setUser('', 'temporary-invalid-token-user');
{
  const before = JSON.stringify(w.store);
  const bad = plain(w.ctx.claimBetaInvitation({ invite_token: 'bta_bad' }));
  assert.equal(bad.ok, false);
  assert.equal(bad.error.code, 'INVALID_INVITATION');
  assert.equal(JSON.stringify(w.store), before);
}

// Expired invitation and expired participant both fail closed.
{
  const x = makeWorld();
  const invite = plain(x.ctx.createBetaInvitation({
    label: 'BETA-EXPIRY',
    allowed_projects: ['AISYNC'],
    invite_hours: 1,
    participant_days: 1
  }));
  const inviteToken = decodeURIComponent(invite.invite_url.split('invite=')[1]);
  const inviteKey = Object.keys(x.store).find(key => key.startsWith('asc.beta.invite.v1.'));
  const inviteRecord = JSON.parse(x.store[inviteKey]);
  inviteRecord.expires_at = new Date(Date.now() - 1000).toISOString();
  x.store[inviteKey] = JSON.stringify(inviteRecord);
  x.setUser('', 'temporary-expired-invite-user');
  const expiredInvite = plain(x.ctx.claimBetaInvitation({ invite_token: inviteToken }));
  assert.equal(expiredInvite.ok, false);
  assert.equal(expiredInvite.error.code, 'INVITATION_EXPIRED');

  x.setUser(OWNER, 'owner-temp-key');
  const invite2 = plain(x.ctx.createBetaInvitation({
    label: 'BETA-PARTICIPANT-EXPIRY',
    allowed_projects: ['AISYNC'],
    invite_hours: 1,
    participant_days: 1
  }));
  const token2 = decodeURIComponent(invite2.invite_url.split('invite=')[1]);
  x.setUser('', 'temporary-expired-participant-user');
  const claimed2 = plain(x.ctx.claimBetaInvitation({ invite_token: token2 }));
  assert.equal(claimed2.ok, true);
  const participantKey2 = Object.keys(x.store).find(key =>
    key === 'asc.beta.participant.v1.' + hash('temporary-expired-participant-user')
  );
  const participantRecord = JSON.parse(x.store[participantKey2]);
  participantRecord.expires_at = new Date(Date.now() - 1000).toISOString();
  x.store[participantKey2] = JSON.stringify(participantRecord);
  const expiredState = plain(x.ctx.getBetaAccessState());
  assert.equal(expiredState.authorized, false);
  assert.equal(expiredState.access, 'NOT_ALLOWLISTED');
}

console.log('T-020A1 beta access gate: PASS');
console.log('signed-in invitation -> hashed user allowlist -> project scope -> revoke: PASS');
console.log('raw invitation/user keys are not persisted or returned by admin listing: PASS');
