// T-020A1 — closed-beta access gate.
//
// Production v1 remains owner-executed so Apps Script can reach the owner's private
// continuity store, ASC DB, Script Properties and GitHub App configuration. Invited
// beta humans are identified with Session.getTemporaryActiveUserKey(), hashed before
// persistence. Raw temporary user keys and raw invite tokens are never stored.
//
// Beta access is intentionally separate from privileged owner access:
// - ascIsBetaActor_() = owner OR active, unexpired invited participant.
// - ascIsOwner_() remains unchanged and continues to guard DR/secret rotation/admin.
// - participant records can be scoped to specific project IDs.

var ASC_BETA_SCHEMA_VERSION_ = '0.1';
var ASC_BETA_INVITE_PROPERTY_PREFIX_ = 'asc.beta.invite.v1.';
var ASC_BETA_PARTICIPANT_PROPERTY_PREFIX_ = 'asc.beta.participant.v1.';
var ASC_BETA_INVITE_DEFAULT_HOURS_ = 72;
var ASC_BETA_INVITE_MAX_HOURS_ = 168;
var ASC_BETA_PARTICIPANT_DEFAULT_DAYS_ = 21;
var ASC_BETA_PARTICIPANT_MAX_DAYS_ = 29;
var ASC_BETA_LOCK_TIMEOUT_MS_ = 10000;

function ascBetaHex_(bytes) {
  return bytes.map(function (byte) {
    var value = byte < 0 ? byte + 256 : byte;
    return ('0' + value.toString(16)).slice(-2);
  }).join('');
}

function ascBetaSha256_(value) {
  return ascBetaHex_(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value),
    Utilities.Charset.UTF_8
  ));
}

function ascBetaNow_() {
  return new Date().toISOString();
}

function ascBetaParseJson_(value) {
  if (typeof value !== 'string' || !value) return null;
  try {
    var parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    return null;
  }
}

function ascBetaTemporaryUserKey_() {
  try {
    if (!Session || typeof Session.getTemporaryActiveUserKey !== 'function') return null;
    var value = Session.getTemporaryActiveUserKey();
    return typeof value === 'string' && value ? value : null;
  } catch (error) {
    return null;
  }
}

function ascBetaTemporaryUserFingerprint_() {
  var key = ascBetaTemporaryUserKey_();
  return key ? ascBetaSha256_(key) : null;
}

function ascBetaParticipantPropertyName_(fingerprint) {
  return ASC_BETA_PARTICIPANT_PROPERTY_PREFIX_ + String(fingerprint || '');
}

function ascBetaInvitePropertyName_(tokenHash) {
  return ASC_BETA_INVITE_PROPERTY_PREFIX_ + String(tokenHash || '');
}

function ascBetaRecordActive_(record, nowMs) {
  if (!record || record.schema_version !== ASC_BETA_SCHEMA_VERSION_ || record.state !== 'ACTIVE') return false;
  var expiry = Date.parse(record.expires_at || '');
  return Number.isFinite(expiry) && expiry > nowMs;
}

function ascBetaParticipantForFingerprint_(fingerprint) {
  if (!fingerprint) return null;
  try {
    var raw = PropertiesService.getScriptProperties().getProperty(
      ascBetaParticipantPropertyName_(fingerprint)
    );
    var record = ascBetaParseJson_(raw);
    return ascBetaRecordActive_(record, Date.now()) ? record : null;
  } catch (error) {
    return null;
  }
}

// Enriches the existing server-created authorization context. This function never
// accepts client-provided identity material.
function ascBetaAuthorizationContext_(baseContext) {
  var base = baseContext && typeof baseContext === 'object' ? baseContext : {};
  var owner = Boolean(base.activeUser) && base.activeUser === base.effectiveUser;
  var fingerprint = ascBetaTemporaryUserFingerprint_();
  var participant = owner ? null : ascBetaParticipantForFingerprint_(fingerprint);
  return {
    activeUser: typeof base.activeUser === 'string' ? base.activeUser : '',
    effectiveUser: typeof base.effectiveUser === 'string' ? base.effectiveUser : '',
    owner: owner,
    betaAuthorized: owner || Boolean(participant),
    betaParticipantId: participant ? participant.participant_id : null,
    betaAllowedProjects: owner ? ['*'] : (participant ? participant.allowed_projects.slice() : []),
    betaAccessExpiresAt: participant ? participant.expires_at : null
  };
}

function ascIsBetaActor_(context) {
  if (ascIsOwner_(context)) return true;
  return Boolean(context) && context.betaAuthorized === true &&
    typeof context.betaParticipantId === 'string' && context.betaParticipantId.length > 0;
}

function ascBetaCanAccessProject_(projectId, context) {
  if (ascIsOwner_(context)) return true;
  if (!ascIsBetaActor_(context)) return false;
  var allowed = Array.isArray(context.betaAllowedProjects) ? context.betaAllowedProjects : [];
  return allowed.indexOf(String(projectId || '')) >= 0;
}

function ascBetaCanAccessRepository_(repository, context) {
  if (ascIsOwner_(context)) return true;
  if (!ascIsBetaActor_(context) || typeof repository !== 'string' || !repository) return false;
  var registry = ascProductionRegistry_();
  if (!registry || registry.ok !== true || !registry.registry || !registry.registry.projects) return false;
  var allowed = Array.isArray(context.betaAllowedProjects) ? context.betaAllowedProjects : [];
  return allowed.some(function (projectId) {
    var project = registry.registry.projects[projectId];
    return project && project.repository === repository;
  });
}

function ascBetaAccessError_(code, message) {
  return { ok: false, error: { code: code, message: message } };
}

function getBetaAccessState() {
  var context = ascAuthorizationContext_();
  if (ascIsOwner_(context)) {
    return {
      ok: true,
      access: 'OWNER',
      authorized: true,
      participant_id: null,
      allowed_projects: ['*'],
      expires_at: null
    };
  }
  if (ascIsBetaActor_(context)) {
    return {
      ok: true,
      access: 'BETA',
      authorized: true,
      participant_id: context.betaParticipantId,
      allowed_projects: context.betaAllowedProjects.slice(),
      expires_at: context.betaAccessExpiresAt
    };
  }
  return {
    ok: true,
    access: 'NOT_ALLOWLISTED',
    authorized: false,
    participant_id: null,
    allowed_projects: [],
    expires_at: null
  };
}

function ascBetaRequireOwner_() {
  if (!ascIsOwner_(ascAuthorizationContext_())) {
    throw new Error('BETA_ACCESS_OWNER_REQUIRED');
  }
}

function ascBetaNormalizeProjects_(projectIds) {
  if (!Array.isArray(projectIds) || projectIds.length === 0) {
    throw new Error('BETA_ACCESS_PROJECTS_REQUIRED');
  }
  var unique = [];
  projectIds.forEach(function (value) {
    var id = typeof value === 'string' ? value.trim() : '';
    if (!id || id.length > 128) throw new Error('BETA_ACCESS_INVALID_PROJECT');
    if (unique.indexOf(id) < 0) unique.push(id);
  });

  var registry = ascProductionRegistry_();
  if (!registry || registry.ok !== true || !registry.registry || !registry.registry.projects) {
    throw new Error('BETA_ACCESS_REGISTRY_UNAVAILABLE');
  }
  unique.forEach(function (id) {
    if (!Object.prototype.hasOwnProperty.call(registry.registry.projects, id)) {
      throw new Error('BETA_ACCESS_PROJECT_NOT_AUTHORIZED');
    }
  });
  return unique;
}

function ascBetaNewToken_() {
  return 'bta_' +
    Utilities.getUuid().replace(/-/g, '') +
    Utilities.getUuid().replace(/-/g, '');
}

function ascBetaNewId_(prefix) {
  return prefix + '_' + Utilities.getUuid().replace(/-/g, '').slice(0, 20);
}

function createBetaInvitation(input) {
  ascBetaRequireOwner_();
  var request = input && typeof input === 'object' ? input : {};
  var label = typeof request.label === 'string' ? request.label.trim() : '';
  if (!label || label.length > 80) {
    return ascBetaAccessError_('INVALID_LABEL', 'Beta participant label must be 1-80 characters.');
  }

  var allowedProjects;
  try {
    allowedProjects = ascBetaNormalizeProjects_(request.allowed_projects);
  } catch (error) {
    return ascBetaAccessError_(error.message || 'INVALID_PROJECTS', 'Invitation project scope is invalid.');
  }

  var inviteHours = Number(request.invite_hours || ASC_BETA_INVITE_DEFAULT_HOURS_);
  var participantDays = Number(request.participant_days || ASC_BETA_PARTICIPANT_DEFAULT_DAYS_);
  if (!Number.isInteger(inviteHours) || inviteHours < 1 || inviteHours > ASC_BETA_INVITE_MAX_HOURS_) {
    return ascBetaAccessError_('INVALID_INVITE_TTL', 'Invitation lifetime must be 1-168 hours.');
  }
  if (!Number.isInteger(participantDays) || participantDays < 1 || participantDays > ASC_BETA_PARTICIPANT_MAX_DAYS_) {
    return ascBetaAccessError_('INVALID_PARTICIPANT_TTL', 'Participant access lifetime must be 1-29 days.');
  }

  var token = ascBetaNewToken_();
  var tokenHash = ascBetaSha256_(token);
  var nowMs = Date.now();
  var record = {
    schema_version: ASC_BETA_SCHEMA_VERSION_,
    invite_id: ascBetaNewId_('bi'),
    label: label,
    allowed_projects: allowedProjects,
    issued_at: new Date(nowMs).toISOString(),
    expires_at: new Date(nowMs + inviteHours * 60 * 60 * 1000).toISOString(),
    participant_days: participantDays,
    state: 'ISSUED',
    claimed_at: null,
    participant_id: null
  };

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(ASC_BETA_LOCK_TIMEOUT_MS_)) {
    return ascBetaAccessError_('BETA_ACCESS_LOCK_UNAVAILABLE', 'Invitation store is busy. Try again.');
  }
  try {
    var properties = PropertiesService.getScriptProperties();
    var propertyName = ascBetaInvitePropertyName_(tokenHash);
    if (properties.getProperty(propertyName)) {
      return ascBetaAccessError_('INVITE_COLLISION', 'Invitation could not be created.');
    }
    properties.setProperty(propertyName, JSON.stringify(record));
    var verify = ascBetaParseJson_(properties.getProperty(propertyName));
    if (!verify || verify.invite_id !== record.invite_id || verify.state !== 'ISSUED') {
      properties.deleteProperty(propertyName);
      return ascBetaAccessError_('INVITE_STORE_FAILED', 'Invitation could not be verified after creation.');
    }
  } finally {
    try { lock.releaseLock(); } catch (error) { /* expires automatically */ }
  }

  var baseUrl = ScriptApp.getService().getUrl();
  return {
    ok: true,
    status: 'INVITATION_CREATED',
    invite_id: record.invite_id,
    label: record.label,
    allowed_projects: record.allowed_projects.slice(),
    expires_at: record.expires_at,
    participant_access_days: participantDays,
    invite_url: baseUrl + '?view=beta-enroll&invite=' + encodeURIComponent(token),
    secret_values_persisted: false
  };
}

function claimBetaInvitation(input) {
  if (ascIsOwner_(ascAuthorizationContext_())) {
    return ascBetaAccessError_('OWNER_ALREADY_AUTHORIZED', 'The owner account does not need a beta invitation.');
  }
  var request = input && typeof input === 'object' ? input : {};
  var token = typeof request.invite_token === 'string' ? request.invite_token.trim() : '';
  if (!/^bta_[A-Za-z0-9]{64}$/.test(token)) {
    return ascBetaAccessError_('INVALID_INVITATION', 'Invitation link is invalid.');
  }

  var fingerprint = ascBetaTemporaryUserFingerprint_();
  if (!fingerprint) {
    return ascBetaAccessError_('GOOGLE_SESSION_REQUIRED', 'A signed-in Google session is required.');
  }

  var tokenHash = ascBetaSha256_(token);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(ASC_BETA_LOCK_TIMEOUT_MS_)) {
    return ascBetaAccessError_('BETA_ACCESS_LOCK_UNAVAILABLE', 'Enrollment store is busy. Try again.');
  }

  try {
    var properties = PropertiesService.getScriptProperties();
    var inviteName = ascBetaInvitePropertyName_(tokenHash);
    var inviteRaw = properties.getProperty(inviteName);
    var invite = ascBetaParseJson_(inviteRaw);
    if (!invite || invite.schema_version !== ASC_BETA_SCHEMA_VERSION_) {
      return ascBetaAccessError_('INVITATION_NOT_FOUND', 'Invitation is not recognized.');
    }

    var participantName = ascBetaParticipantPropertyName_(fingerprint);
    var participantRaw = properties.getProperty(participantName);
    var existing = ascBetaParseJson_(participantRaw);
    if (invite.state === 'CLAIMED') {
      if (existing && Array.isArray(existing.invite_ids) && existing.invite_ids.indexOf(invite.invite_id) >= 0 &&
          ascBetaRecordActive_(existing, Date.now())) {
        return {
          ok: true,
          status: 'ALREADY_ENROLLED',
          participant_id: existing.participant_id,
          label: existing.label,
          allowed_projects: existing.allowed_projects.slice(),
          expires_at: existing.expires_at
        };
      }
      return ascBetaAccessError_('INVITATION_ALREADY_CLAIMED', 'Invitation has already been used.');
    }
    if (invite.state !== 'ISSUED') {
      return ascBetaAccessError_('INVITATION_NOT_ACTIVE', 'Invitation is not active.');
    }

    var inviteExpiry = Date.parse(invite.expires_at || '');
    if (!Number.isFinite(inviteExpiry) || inviteExpiry <= Date.now()) {
      invite.state = 'EXPIRED';
      properties.setProperty(inviteName, JSON.stringify(invite));
      return ascBetaAccessError_('INVITATION_EXPIRED', 'Invitation has expired.');
    }

    var nowMs = Date.now();
    var participantExpiry = new Date(
      nowMs + Number(invite.participant_days || ASC_BETA_PARTICIPANT_DEFAULT_DAYS_) * 24 * 60 * 60 * 1000
    ).toISOString();

    var participant;
    if (existing && ascBetaRecordActive_(existing, nowMs)) {
      participant = existing;
      invite.allowed_projects.forEach(function (id) {
        if (participant.allowed_projects.indexOf(id) < 0) participant.allowed_projects.push(id);
      });
      participant.invite_ids = Array.isArray(participant.invite_ids) ? participant.invite_ids : [];
      if (participant.invite_ids.indexOf(invite.invite_id) < 0) participant.invite_ids.push(invite.invite_id);
      if (Date.parse(participant.expires_at) < Date.parse(participantExpiry)) {
        participant.expires_at = participantExpiry;
      }
    } else {
      participant = {
        schema_version: ASC_BETA_SCHEMA_VERSION_,
        participant_id: ascBetaNewId_('bp'),
        label: invite.label,
        allowed_projects: invite.allowed_projects.slice(),
        invite_ids: [invite.invite_id],
        enrolled_at: new Date(nowMs).toISOString(),
        expires_at: participantExpiry,
        state: 'ACTIVE'
      };
    }

    properties.setProperty(participantName, JSON.stringify(participant));
    var verifyParticipant = ascBetaParseJson_(properties.getProperty(participantName));
    if (!verifyParticipant || verifyParticipant.participant_id !== participant.participant_id ||
        !ascBetaRecordActive_(verifyParticipant, Date.now())) {
      if (participantRaw !== null) properties.setProperty(participantName, participantRaw);
      else properties.deleteProperty(participantName);
      return ascBetaAccessError_('PARTICIPANT_STORE_FAILED', 'Beta access could not be verified after enrollment.');
    }

    invite.state = 'CLAIMED';
    invite.claimed_at = new Date(nowMs).toISOString();
    invite.participant_id = participant.participant_id;
    properties.setProperty(inviteName, JSON.stringify(invite));
    var verifyInvite = ascBetaParseJson_(properties.getProperty(inviteName));
    if (!verifyInvite || verifyInvite.state !== 'CLAIMED' ||
        verifyInvite.participant_id !== participant.participant_id) {
      if (participantRaw !== null) properties.setProperty(participantName, participantRaw);
      else properties.deleteProperty(participantName);
      properties.setProperty(inviteName, inviteRaw);
      return ascBetaAccessError_('INVITE_CLAIM_STORE_FAILED', 'Invitation claim could not be verified.');
    }

    return {
      ok: true,
      status: 'ENROLLED',
      participant_id: participant.participant_id,
      label: participant.label,
      allowed_projects: participant.allowed_projects.slice(),
      expires_at: participant.expires_at
    };
  } finally {
    try { lock.releaseLock(); } catch (error) { /* expires automatically */ }
  }
}

function listBetaAccessParticipants() {
  ascBetaRequireOwner_();
  var all = PropertiesService.getScriptProperties().getProperties();
  var nowMs = Date.now();
  var rows = [];
  Object.keys(all).forEach(function (key) {
    if (key.indexOf(ASC_BETA_PARTICIPANT_PROPERTY_PREFIX_) !== 0) return;
    var record = ascBetaParseJson_(all[key]);
    if (!record || record.schema_version !== ASC_BETA_SCHEMA_VERSION_) return;
    rows.push({
      participant_id: record.participant_id,
      label: record.label,
      allowed_projects: Array.isArray(record.allowed_projects) ? record.allowed_projects.slice() : [],
      enrolled_at: record.enrolled_at || null,
      expires_at: record.expires_at || null,
      state: ascBetaRecordActive_(record, nowMs) ? 'ACTIVE' : 'EXPIRED'
    });
  });
  rows.sort(function (a, b) { return String(a.participant_id).localeCompare(String(b.participant_id)); });
  return { ok: true, participants: rows };
}

function listBetaInvitations() {
  ascBetaRequireOwner_();
  var all = PropertiesService.getScriptProperties().getProperties();
  var rows = [];
  Object.keys(all).forEach(function (key) {
    if (key.indexOf(ASC_BETA_INVITE_PROPERTY_PREFIX_) !== 0) return;
    var record = ascBetaParseJson_(all[key]);
    if (!record || record.schema_version !== ASC_BETA_SCHEMA_VERSION_) return;
    var state = record.state;
    if (state === 'ISSUED' && Date.parse(record.expires_at || '') <= Date.now()) state = 'EXPIRED';
    rows.push({
      invite_id: record.invite_id,
      label: record.label,
      allowed_projects: Array.isArray(record.allowed_projects) ? record.allowed_projects.slice() : [],
      issued_at: record.issued_at || null,
      expires_at: record.expires_at || null,
      state: state,
      participant_id: record.participant_id || null
    });
  });
  rows.sort(function (a, b) { return String(b.issued_at).localeCompare(String(a.issued_at)); });
  return { ok: true, invitations: rows };
}

function revokeBetaParticipant(input) {
  ascBetaRequireOwner_();
  var participantId = input && typeof input.participant_id === 'string'
    ? input.participant_id.trim()
    : '';
  if (!participantId) return ascBetaAccessError_('INVALID_PARTICIPANT_ID', 'participant_id is required.');

  var properties = PropertiesService.getScriptProperties();
  var all = properties.getProperties();
  var match = null;
  Object.keys(all).some(function (key) {
    if (key.indexOf(ASC_BETA_PARTICIPANT_PROPERTY_PREFIX_) !== 0) return false;
    var record = ascBetaParseJson_(all[key]);
    if (record && record.participant_id === participantId) {
      match = key;
      return true;
    }
    return false;
  });
  if (!match) return ascBetaAccessError_('PARTICIPANT_NOT_FOUND', 'Beta participant was not found.');

  properties.deleteProperty(match);
  if (properties.getProperty(match) !== null) {
    return ascBetaAccessError_('PARTICIPANT_REVOKE_FAILED', 'Beta participant revocation could not be verified.');
  }
  return { ok: true, status: 'PARTICIPANT_REVOKED', participant_id: participantId };
}
