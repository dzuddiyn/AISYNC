// T-019F — production secret rotation.
//
// Rotation is owner-only and server-private. Secret values are never returned.
// The active GitHub App key remains in GITHUB_APP_PRIVATE_KEY for compatibility.
// A candidate is staged separately, validated against GitHub, promoted under a
// script lock, verified, and only finalized after the operator confirms that the
// old GitHub-side key has been revoked.

var ASC_SECRET_ROTATION_CANDIDATE_PROPERTY_ = 'ASC_GITHUB_APP_PRIVATE_KEY_CANDIDATE';
var ASC_SECRET_ROTATION_PREVIOUS_PROPERTY_ = 'ASC_GITHUB_APP_PRIVATE_KEY_PREVIOUS';
var ASC_SECRET_ROTATION_META_PROPERTY_ = 'ASC_GITHUB_APP_KEY_ROTATION_META';
var ASC_SECRET_ROTATION_LOCK_TIMEOUT_MS_ = 30000;

function ascSecretRotationRequireOwner_() {
  if (!ascIsOwner_(ascAuthorizationContext_())) {
    throw new Error('SECRET_ROTATION_OWNER_REQUIRED');
  }
}

function ascSecretRotationHex_(bytes) {
  return bytes.map(function (byte) {
    var value = byte < 0 ? byte + 256 : byte;
    return ('0' + value.toString(16)).slice(-2);
  }).join('');
}

function ascSecretFingerprint_(value) {
  if (typeof value !== 'string' || !value) return null;
  return ascSecretRotationHex_(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    value,
    Utilities.Charset.UTF_8
  ));
}

function ascSecretRotationMetaRead_(properties) {
  var raw = properties.getProperty(ASC_SECRET_ROTATION_META_PROPERTY_);
  if (!raw) return null;
  try {
    var parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    return null;
  }
}

function ascSecretRotationMetaWrite_(properties, meta) {
  properties.setProperty(
    ASC_SECRET_ROTATION_META_PROPERTY_,
    JSON.stringify(meta)
  );
}

function ascSecretRotationSafeMeta_(meta) {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return null;
  var allowed = [
    'rotation_id', 'state', 'promoted_at', 'verified_at', 'rolled_back_at',
    'finalized_at', 'old_fingerprint', 'new_fingerprint',
    'attempted_fingerprint', 'failure_code', 'active_fingerprint',
    'candidate_fingerprint', 'old_github_key_revoked'
  ];
  var out = {};
  allowed.forEach(function (key) {
    if (!Object.prototype.hasOwnProperty.call(meta, key)) return;
    var value = meta[key];
    if (typeof value === 'string' || typeof value === 'boolean' || value === null) {
      out[key] = value;
    }
  });
  return out;
}

function ascSecretRotationConfigForKey_(privateKey) {
  var clientId = ascScriptProperty_('GITHUB_APP_CLIENT_ID');
  var installationId = ascScriptProperty_('GITHUB_APP_INSTALLATION_ID');

  if (!clientId || !installationId || !/^\d+$/.test(installationId) ||
      typeof privateKey !== 'string' || privateKey.indexOf('PRIVATE KEY') < 0) {
    return {
      ok: false,
      error: {
        code: 'SECRET_ROTATION_KEY_CONFIG_INVALID',
        message: 'GitHub App client ID, installation ID, and candidate private key are required.'
      }
    };
  }

  try {
    ascNormalizeGitHubAppPrivateKey_(privateKey);
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'SECRET_ROTATION_KEY_FORMAT_INVALID',
        message: 'Candidate GitHub App private key format is invalid.'
      }
    };
  }

  return {
    ok: true,
    clientId: clientId,
    installationId: installationId,
    privateKey: privateKey
  };
}

function ascSecretRotationValidateKey_(privateKey) {
  var config = ascSecretRotationConfigForKey_(privateKey);
  if (!config.ok) return config;

  var result = ascGitHubAppInstallationTokenForConfig_(config);
  if (!result || result.ok !== true) {
    return {
      ok: false,
      error: result && result.error ? result.error : {
        code: 'SECRET_ROTATION_TOKEN_VALIDATION_FAILED',
        message: 'GitHub App candidate key could not obtain an installation token.'
      }
    };
  }

  return {
    ok: true,
    fingerprint: ascSecretFingerprint_(privateKey),
    token_expires_at: result.expiresAt || null
  };
}

function ascSecretRotationStatus_() {
  ascSecretRotationRequireOwner_();
  var properties = PropertiesService.getScriptProperties();
  var active = properties.getProperty('GITHUB_APP_PRIVATE_KEY');
  var candidate = properties.getProperty(ASC_SECRET_ROTATION_CANDIDATE_PROPERTY_);
  var previous = properties.getProperty(ASC_SECRET_ROTATION_PREVIOUS_PROPERTY_);

  return {
    active_present: Boolean(active),
    active_fingerprint: ascSecretFingerprint_(active),
    candidate_present: Boolean(candidate),
    candidate_fingerprint: ascSecretFingerprint_(candidate),
    previous_present: Boolean(previous),
    previous_fingerprint: ascSecretFingerprint_(previous),
    legacy_github_token_present: Boolean(properties.getProperty('GITHUB_TOKEN')),
    metadata: ascSecretRotationSafeMeta_(ascSecretRotationMetaRead_(properties)),
    secret_values_exposed: false
  };
}

function ascValidateGitHubAppKeyCandidate_() {
  ascSecretRotationRequireOwner_();
  var properties = PropertiesService.getScriptProperties();
  var active = properties.getProperty('GITHUB_APP_PRIVATE_KEY');
  var candidate = properties.getProperty(ASC_SECRET_ROTATION_CANDIDATE_PROPERTY_);

  if (!active) {
    return {
      ok: false,
      status: 'ACTIVE_KEY_MISSING',
      secret_values_exposed: false
    };
  }
  if (!candidate) {
    return {
      ok: false,
      status: 'CANDIDATE_KEY_MISSING',
      secret_values_exposed: false
    };
  }

  var activeFingerprint = ascSecretFingerprint_(active);
  var candidateFingerprint = ascSecretFingerprint_(candidate);
  if (activeFingerprint === candidateFingerprint) {
    return {
      ok: false,
      status: 'CANDIDATE_EQUALS_ACTIVE',
      active_fingerprint: activeFingerprint,
      candidate_fingerprint: candidateFingerprint,
      secret_values_exposed: false
    };
  }

  var validated = ascSecretRotationValidateKey_(candidate);
  if (!validated.ok) {
    return {
      ok: false,
      status: 'CANDIDATE_VALIDATION_FAILED',
      active_fingerprint: activeFingerprint,
      candidate_fingerprint: candidateFingerprint,
      error: validated.error || null,
      secret_values_exposed: false
    };
  }

  return {
    ok: true,
    status: 'CANDIDATE_VALID',
    active_fingerprint: activeFingerprint,
    candidate_fingerprint: candidateFingerprint,
    token_expires_at: validated.token_expires_at,
    secret_values_exposed: false
  };
}

function ascPromoteGitHubAppKeyCandidate_() {
  ascSecretRotationRequireOwner_();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(ASC_SECRET_ROTATION_LOCK_TIMEOUT_MS_)) {
    throw new Error('SECRET_ROTATION_LOCK_UNAVAILABLE');
  }

  try {
    var properties = PropertiesService.getScriptProperties();
    var active = properties.getProperty('GITHUB_APP_PRIVATE_KEY');
    var candidate = properties.getProperty(ASC_SECRET_ROTATION_CANDIDATE_PROPERTY_);
    var previous = properties.getProperty(ASC_SECRET_ROTATION_PREVIOUS_PROPERTY_);

    if (!active) throw new Error('SECRET_ROTATION_ACTIVE_KEY_MISSING');
    if (!candidate) throw new Error('SECRET_ROTATION_CANDIDATE_KEY_MISSING');
    if (previous) throw new Error('SECRET_ROTATION_PREVIOUS_KEY_NOT_FINALIZED');

    var oldFingerprint = ascSecretFingerprint_(active);
    var newFingerprint = ascSecretFingerprint_(candidate);
    if (oldFingerprint === newFingerprint) {
      throw new Error('SECRET_ROTATION_CANDIDATE_EQUALS_ACTIVE');
    }

    var candidateValidation = ascSecretRotationValidateKey_(candidate);
    if (!candidateValidation.ok) {
      return {
        ok: false,
        status: 'CANDIDATE_VALIDATION_FAILED',
        old_fingerprint: oldFingerprint,
        new_fingerprint: newFingerprint,
        error: candidateValidation.error || null,
        secret_values_exposed: false
      };
    }

    var rotationId = 'rot_' + Utilities.getUuid();
    var promotedAt = new Date().toISOString();

    properties.setProperty(ASC_SECRET_ROTATION_PREVIOUS_PROPERTY_, active);
    properties.setProperty('GITHUB_APP_PRIVATE_KEY', candidate);
    properties.deleteProperty(ASC_SECRET_ROTATION_CANDIDATE_PROPERTY_);

    ascSecretRotationMetaWrite_(properties, {
      rotation_id: rotationId,
      state: 'PROMOTED_PENDING_VERIFY',
      promoted_at: promotedAt,
      old_fingerprint: oldFingerprint,
      new_fingerprint: newFingerprint
    });

    var activeVerification = ascGitHubAppInstallationToken_();
    if (!activeVerification || activeVerification.ok !== true) {
      properties.setProperty('GITHUB_APP_PRIVATE_KEY', active);
      properties.setProperty(ASC_SECRET_ROTATION_CANDIDATE_PROPERTY_, candidate);
      properties.deleteProperty(ASC_SECRET_ROTATION_PREVIOUS_PROPERTY_);
      ascSecretRotationMetaWrite_(properties, {
        rotation_id: rotationId,
        state: 'AUTO_ROLLED_BACK',
        promoted_at: promotedAt,
        rolled_back_at: new Date().toISOString(),
        old_fingerprint: oldFingerprint,
        attempted_fingerprint: newFingerprint,
        failure_code: activeVerification && activeVerification.error
          ? activeVerification.error.code
          : 'ACTIVE_KEY_VERIFY_FAILED'
      });
      return {
        ok: false,
        status: 'AUTO_ROLLED_BACK',
        active_fingerprint: oldFingerprint,
        candidate_fingerprint: newFingerprint,
        error: activeVerification && activeVerification.error
          ? activeVerification.error
          : null,
        secret_values_exposed: false
      };
    }

    var verifiedAt = new Date().toISOString();
    ascSecretRotationMetaWrite_(properties, {
      rotation_id: rotationId,
      state: 'ACTIVE_VERIFIED',
      promoted_at: promotedAt,
      verified_at: verifiedAt,
      old_fingerprint: oldFingerprint,
      new_fingerprint: newFingerprint
    });

    return {
      ok: true,
      status: 'ACTIVE_VERIFIED',
      rotation_id: rotationId,
      old_fingerprint: oldFingerprint,
      new_fingerprint: newFingerprint,
      token_expires_at: activeVerification.expiresAt || null,
      previous_retained_for_rollback: true,
      secret_values_exposed: false
    };
  } finally {
    lock.releaseLock();
  }
}

function ascRollbackGitHubAppKeyRotation_() {
  ascSecretRotationRequireOwner_();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(ASC_SECRET_ROTATION_LOCK_TIMEOUT_MS_)) {
    throw new Error('SECRET_ROTATION_LOCK_UNAVAILABLE');
  }

  try {
    var properties = PropertiesService.getScriptProperties();
    var current = properties.getProperty('GITHUB_APP_PRIVATE_KEY');
    var previous = properties.getProperty(ASC_SECRET_ROTATION_PREVIOUS_PROPERTY_);
    if (!current || !previous) throw new Error('SECRET_ROTATION_ROLLBACK_NOT_AVAILABLE');

    var previousValidation = ascSecretRotationValidateKey_(previous);
    if (!previousValidation.ok) {
      return {
        ok: false,
        status: 'ROLLBACK_KEY_VALIDATION_FAILED',
        error: previousValidation.error || null,
        secret_values_exposed: false
      };
    }

    var currentFingerprint = ascSecretFingerprint_(current);
    var previousFingerprint = ascSecretFingerprint_(previous);

    properties.setProperty('GITHUB_APP_PRIVATE_KEY', previous);
    properties.setProperty(ASC_SECRET_ROTATION_CANDIDATE_PROPERTY_, current);
    properties.deleteProperty(ASC_SECRET_ROTATION_PREVIOUS_PROPERTY_);

    var verify = ascGitHubAppInstallationToken_();
    if (!verify || verify.ok !== true) {
      // Restore the promoted state if rollback verification unexpectedly fails.
      properties.setProperty('GITHUB_APP_PRIVATE_KEY', current);
      properties.setProperty(ASC_SECRET_ROTATION_PREVIOUS_PROPERTY_, previous);
      properties.deleteProperty(ASC_SECRET_ROTATION_CANDIDATE_PROPERTY_);
      return {
        ok: false,
        status: 'ROLLBACK_VERIFY_FAILED',
        error: verify && verify.error ? verify.error : null,
        secret_values_exposed: false
      };
    }

    ascSecretRotationMetaWrite_(properties, {
      state: 'MANUAL_ROLLBACK_VERIFIED',
      rolled_back_at: new Date().toISOString(),
      active_fingerprint: previousFingerprint,
      candidate_fingerprint: currentFingerprint
    });

    return {
      ok: true,
      status: 'MANUAL_ROLLBACK_VERIFIED',
      active_fingerprint: previousFingerprint,
      candidate_fingerprint: currentFingerprint,
      secret_values_exposed: false
    };
  } finally {
    lock.releaseLock();
  }
}

function ascFinalizeGitHubAppKeyRotation_(input) {
  ascSecretRotationRequireOwner_();
  var request = input && typeof input === 'object' ? input : {};
  if (request.oldKeyRevoked !== true) {
    throw new Error('SECRET_ROTATION_OLD_KEY_REVOCATION_CONFIRMATION_REQUIRED');
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(ASC_SECRET_ROTATION_LOCK_TIMEOUT_MS_)) {
    throw new Error('SECRET_ROTATION_LOCK_UNAVAILABLE');
  }

  try {
    var properties = PropertiesService.getScriptProperties();
    var active = properties.getProperty('GITHUB_APP_PRIVATE_KEY');
    var previous = properties.getProperty(ASC_SECRET_ROTATION_PREVIOUS_PROPERTY_);
    var meta = ascSecretRotationMetaRead_(properties);

    if (!active) throw new Error('SECRET_ROTATION_ACTIVE_KEY_MISSING');
    if (!previous) throw new Error('SECRET_ROTATION_PREVIOUS_KEY_MISSING');
    if (!meta || meta.state !== 'ACTIVE_VERIFIED') {
      throw new Error('SECRET_ROTATION_ACTIVE_KEY_NOT_VERIFIED');
    }

    var activeVerification = ascGitHubAppInstallationToken_();
    if (!activeVerification || activeVerification.ok !== true) {
      return {
        ok: false,
        status: 'FINALIZE_ACTIVE_VERIFY_FAILED',
        error: activeVerification && activeVerification.error
          ? activeVerification.error
          : null,
        secret_values_exposed: false
      };
    }

    var previousFingerprint = ascSecretFingerprint_(previous);
    var activeFingerprint = ascSecretFingerprint_(active);
    properties.deleteProperty(ASC_SECRET_ROTATION_PREVIOUS_PROPERTY_);

    ascSecretRotationMetaWrite_(properties, {
      rotation_id: meta.rotation_id || null,
      state: 'FINALIZED',
      promoted_at: meta.promoted_at || null,
      verified_at: meta.verified_at || null,
      finalized_at: new Date().toISOString(),
      old_fingerprint: previousFingerprint,
      new_fingerprint: activeFingerprint,
      old_github_key_revoked: true
    });

    return {
      ok: true,
      status: 'FINALIZED',
      active_fingerprint: activeFingerprint,
      retired_fingerprint: previousFingerprint,
      previous_secret_removed: true,
      secret_values_exposed: false
    };
  } finally {
    lock.releaseLock();
  }
}

function ascRetireLegacyGitHubReadToken_() {
  ascSecretRotationRequireOwner_();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(ASC_SECRET_ROTATION_LOCK_TIMEOUT_MS_)) {
    throw new Error('SECRET_ROTATION_LOCK_UNAVAILABLE');
  }

  try {
    var properties = PropertiesService.getScriptProperties();
    var legacy = properties.getProperty('GITHUB_TOKEN');
    if (!legacy) {
      return {
        ok: true,
        status: 'LEGACY_READ_TOKEN_ALREADY_ABSENT',
        legacy_token_present: false,
        secret_values_exposed: false
      };
    }

    properties.deleteProperty('GITHUB_TOKEN');

    var appVerification = ascGitHubAppInstallationToken_();
    if (!appVerification || appVerification.ok !== true) {
      properties.setProperty('GITHUB_TOKEN', legacy);
      return {
        ok: false,
        status: 'LEGACY_TOKEN_RETIREMENT_ROLLED_BACK',
        error: appVerification && appVerification.error ? appVerification.error : null,
        legacy_token_present: true,
        secret_values_exposed: false
      };
    }

    return {
      ok: true,
      status: 'LEGACY_READ_TOKEN_RETIRED',
      legacy_token_present: false,
      github_app_token_expires_at: appVerification.expiresAt || null,
      secret_values_exposed: false
    };
  } finally {
    lock.releaseLock();
  }
}
