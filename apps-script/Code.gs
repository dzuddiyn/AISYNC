// Default route = T-008 preview / CONFIRM & SYNC.
// ?view=dashboard = project dashboard.
// ?view=beta-enroll = one-time closed-beta enrollment.
// ?view=beta-access = owner-only invitation/participant administration.
function doGet(e) {
  const view = e && e.parameter ? e.parameter.view : undefined;

  if (view === 'beta-enroll') {
    const template = HtmlService.createTemplateFromFile('BetaEnroll');
    template.inviteToken = e && e.parameter && typeof e.parameter.invite === 'string'
      ? e.parameter.invite
      : '';
    template.dashboardUrl = ScriptApp.getService().getUrl() + '?view=dashboard';
    return template
      .evaluate()
      .setTitle('AISYNC — Join Closed Beta')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  const authorization = ascAuthorizationContext_();

  if (view === 'beta-access') {
    if (!ascIsOwner_(authorization)) {
      return HtmlService
        .createTemplateFromFile('BetaAccessRequired')
        .evaluate()
        .setTitle('AISYNC — Access Required')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    return HtmlService
      .createTemplateFromFile('BetaAccessAdmin')
      .evaluate()
      .setTitle('AISYNC — Beta Access')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  if (!ascIsBetaActor_(authorization)) {
    return HtmlService
      .createTemplateFromFile('BetaAccessRequired')
      .evaluate()
      .setTitle('AISYNC — Access Required')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  if (view === 'dashboard') {
    return HtmlService
      .createTemplateFromFile('Dashboard')
      .evaluate()
      .setTitle('ASC — Dashboard')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  return HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle('ASC — Confirm & Sync')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include_(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Apps Script binding for the confirmed sync flow.
// T-016 replaces the proof-only TEST_ONLY destination with a server-side
// production registry + GitHub App installation credential boundary.
const ASC_MAIN_UI_PREFIX_ = 'https://sites.google.com/';
const ASC_RESULT_CACHE_PREFIX_ = 'asc.t008.result.';
const ASC_RESULT_CACHE_SECONDS_ = 600;
// T-010 (D-029): replay authority = Script Properties under a script lock. CacheService is
// result delivery only. Key = prefix + SHA-256(request_id): bounded and collision-safe.
const ASC_REPLAY_PROPERTY_PREFIX_ = 'asc.replay.v1.';
const ASC_REPLAY_LOCK_TIMEOUT_MS_ = 10000;
const ASC_REPLAY_RETENTION_MS_ = 24 * 60 * 60 * 1000;
const ASC_REPLAY_LEGACY_MAX_LIFETIME_MS_ = 30 * 60 * 1000;

// Server clock (ISO). Single clock for expiry checks and receipt timestamps.
function ascNow_() {
  return new Date().toISOString();
}

function ascScriptProperty_(name) {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  return typeof value === 'string' && value.length > 0 ? value : null;
}

// Redirect target is server-side configuration only, and only a Google Sites URL is accepted.
function ascMainUiUrl_() {
  const value = ascScriptProperty_('ASC_MAIN_UI_URL');
  if (!value || value.indexOf(ASC_MAIN_UI_PREFIX_) !== 0 || /\s/.test(value) ||
      value.length <= ASC_MAIN_UI_PREFIX_.length) {
    return null;
  }
  return value;
}

function getBootstrapState() {
  const authorization = ascAuthorizationContext_();
  return {
    authenticated: true,
    accessRole: ascIsOwner_(authorization)
      ? 'OWNER'
      : (ascIsBetaActor_(authorization) ? 'BETA' : 'NONE'),
    writeEnabled: ascIsBetaActor_(authorization) &&
      ascGitHubAppConfigured_() &&
      ascProductionRegistryConfigured_(),
    redirectConfigured: ascMainUiUrl_() !== null,
    destinationPolicy: 'PRODUCTION_REGISTRY',
    destinationAuth: 'GITHUB_APP',
    appVersion: '1.0-t020a1'
  };
}

// Google Account remains the outer sign-in gate. In USER_DEPLOYING mode,
// external-user email can be unavailable, so T-020A1 enriches this server-created
// context with a hashed temporary-user-key allowlist. Privileged owner identity
// remains the active/effective-user equality check below.
function ascAuthorizationContext_() {
  const base = {
    activeUser: Session.getActiveUser().getEmail() || '',
    effectiveUser: Session.getEffectiveUser().getEmail() || ''
  };
  if (typeof ascBetaAuthorizationContext_ === 'function') {
    return ascBetaAuthorizationContext_(base);
  }
  return base;
}

// Current protected deployment remains owner-only. T-018 may broaden the human
// allowlist without weakening the production project/path registry.
function ascIsOwner_(context) {
  if (!context || typeof context !== 'object') return false;
  if (context.owner === true) return true;
  return typeof context.activeUser === 'string' && context.activeUser.length > 0 &&
    context.activeUser === context.effectiveUser;
}

function ascFailed_(stage, code, message, requestId) {
  return {
    state: 'FAILED',
    stage: stage,
    redirect: null,
    writePerformed: false,
    requestId: requestId || null,
    error: { code: code, message: message }
  };
}

function ascOutcomeUnknown_(stage, code, message, requestId) {
  return {
    state: 'OUTCOME_UNKNOWN',
    stage: stage,
    redirect: null,
    writePerformed: null,
    requestId: requestId || null,
    error: { code: code, message: message }
  };
}

function ascResultKey_(requestId) {
  return ASC_RESULT_CACHE_PREFIX_ + Utilities.base64EncodeWebSafe(String(requestId));
}

// Remove any earlier result for this request ID so a previous SUCCESS can never be
// returned for a new attempt. Returns false if the cache cannot be cleared.
function ascClearResult_(requestId) {
  try {
    CacheService.getUserCache().remove(ascResultKey_(requestId));
    return true;
  } catch (error) {
    return false;
  }
}

function ascStoreResult_(requestId, result) {
  try {
    CacheService.getUserCache().put(ascResultKey_(requestId), JSON.stringify(result), ASC_RESULT_CACHE_SECONDS_);
  } catch (error) {
    // Result stays unknown (cache was cleared before the attempt); getConfirmSyncResult
    // reports it as not confirmed saved.
  }
}

function ascDecodeFragment_(fragment) {
  if (typeof fragment !== 'string' || !/^#asc=[A-Za-z0-9_-]+$/.test(fragment)) {
    throw new Error('Invalid ASC fragment.');
  }
  return ascRuntime_().transport.decodeEnvelope(fragment.slice('#asc='.length));
}

function ascReplayKey_(requestId) {
  return ASC_REPLAY_PROPERTY_PREFIX_ + ascSha256Hex_(String(requestId));
}

function ascReplayIsoMs_(value) {
  if (typeof value !== 'string' || value.length === 0) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

function ascReplayPurgeAfter_(expiresAt) {
  const expiresMs = ascReplayIsoMs_(expiresAt);
  if (expiresMs === null) throw new Error('REPLAY_MARKER_INVALID_EXPIRY');
  return new Date(expiresMs + ASC_REPLAY_RETENTION_MS_).toISOString();
}

// Marker v0.2 retains a transport claim for 24h after the already-verified envelope expiry.
// Legacy T-010 markers had only claimed_at; because all v0.1 envelopes are <=30 minutes,
// they become safely purgeable after claimed_at + 30m + the same 24h retention window.
function ascReplayMarkerPurgeAtMs_(raw) {
  let marker;
  try {
    marker = JSON.parse(raw);
  } catch (error) {
    throw new Error('REPLAY_MARKER_MALFORMED');
  }
  if (!marker || typeof marker !== 'object' || Array.isArray(marker) || marker.state !== 'CLAIMED') {
    throw new Error('REPLAY_MARKER_INVALID');
  }

  const keys = Object.keys(marker).sort();
  const legacyKeys = ['claimed_at', 'state'];
  const currentKeys = ['claimed_at', 'expires_at', 'purge_after', 'state'];
  const sameKeys = function (expected) {
    return keys.length === expected.length && keys.every(function (key, index) {
      return key === expected[index];
    });
  };

  const claimedMs = ascReplayIsoMs_(marker.claimed_at);
  if (claimedMs === null) throw new Error('REPLAY_MARKER_INVALID_CLAIMED_AT');

  if (sameKeys(legacyKeys)) {
    return claimedMs + ASC_REPLAY_LEGACY_MAX_LIFETIME_MS_ + ASC_REPLAY_RETENTION_MS_;
  }
  if (!sameKeys(currentKeys)) {
    throw new Error('REPLAY_MARKER_INVALID_SHAPE');
  }

  const expiresMs = ascReplayIsoMs_(marker.expires_at);
  const purgeMs = ascReplayIsoMs_(marker.purge_after);
  if (expiresMs === null || purgeMs === null || claimedMs > expiresMs) {
    throw new Error('REPLAY_MARKER_INVALID_TIMING');
  }
  if (marker.purge_after !== new Date(expiresMs + ASC_REPLAY_RETENTION_MS_).toISOString()) {
    throw new Error('REPLAY_MARKER_INVALID_RETENTION');
  }
  return purgeMs;
}

function ascCleanupReplayMarkers_(props, nowIso) {
  const nowMs = ascReplayIsoMs_(nowIso);
  if (nowMs === null || !props || typeof props.getProperties !== 'function' ||
      typeof props.deleteProperty !== 'function') {
    throw new Error('REPLAY_LIFECYCLE_UNAVAILABLE');
  }

  const all = props.getProperties();
  if (!all || typeof all !== 'object' || Array.isArray(all)) {
    throw new Error('REPLAY_LIFECYCLE_UNAVAILABLE');
  }

  let purged = 0;
  let retained = 0;
  Object.keys(all).forEach(function (key) {
    if (key.indexOf(ASC_REPLAY_PROPERTY_PREFIX_) !== 0) return;
    const purgeAtMs = ascReplayMarkerPurgeAtMs_(all[key]);
    if (purgeAtMs > nowMs) {
      retained += 1;
      return;
    }
    props.deleteProperty(key);
    if (props.getProperty(key) !== null) {
      throw new Error('REPLAY_LIFECYCLE_DELETE_UNVERIFIED');
    }
    purged += 1;
  });
  return { purged: purged, retained: retained };
}

// Atomic one-time claim: lock → lifecycle cleanup → inspect → reject if claimed → persist claim.
// Any uncertainty (lock/property/lifecycle/read/write verification) fails closed before destination I/O.
function ascClaimReplay_(requestId, expiresAt) {
  let lock;
  try {
    lock = LockService.getScriptLock();
  } catch (error) {
    return { claimed: false, code: 'REPLAY_STORE_UNAVAILABLE' };
  }
  let locked = false;
  try {
    locked = lock.tryLock(ASC_REPLAY_LOCK_TIMEOUT_MS_) === true;
  } catch (error) {
    locked = false;
  }
  if (!locked) {
    return { claimed: false, code: 'REPLAY_STORE_UNAVAILABLE' };
  }

  try {
    const claimedAt = ascNow_();
    const claimedMs = ascReplayIsoMs_(claimedAt);
    const expiresMs = ascReplayIsoMs_(expiresAt);
    if (claimedMs === null || expiresMs === null || expiresMs <= claimedMs) {
      return { claimed: false, code: 'REPLAY_STORE_UNAVAILABLE' };
    }

    const props = PropertiesService.getScriptProperties();
    ascCleanupReplayMarkers_(props, claimedAt);

    const key = ascReplayKey_(requestId);
    if (props.getProperty(key) !== null) {
      return { claimed: false, code: 'REPLAY_REJECTED' };
    }

    const marker = JSON.stringify({
      state: 'CLAIMED',
      claimed_at: claimedAt,
      expires_at: expiresAt,
      purge_after: ascReplayPurgeAfter_(expiresAt)
    });
    props.setProperty(key, marker);
    if (props.getProperty(key) !== marker) {
      return { claimed: false, code: 'REPLAY_STORE_UNAVAILABLE' };
    }
    return { claimed: true };
  } catch (error) {
    return { claimed: false, code: 'REPLAY_STORE_UNAVAILABLE' };
  } finally {
    try { lock.releaseLock(); } catch (error) { /* lock expires on its own */ }
  }
}

// T-010 server-side preview security check. Never claims replay state, never writes.
// Returns only safe, non-credential fields; CONFIRM & SYNC may be enabled only when
// securityValid and writeEnabled are both true.
function previewAscRequest(request) {
  if (!ascIsBetaActor_(ascAuthorizationContext_())) {
    return ascPreviewResult_(ascFailed_(
      'ACCESS',
      'BETA_ACCESS_REQUIRED',
      'Invited beta access is required.'
    ));
  }
  let envelope;
  try {
    envelope = ascDecodeFragment_(request && request.fragment);
  } catch (error) {
    return ascPreviewResult_(ascFailed_('PREVIEW', 'INVALID_FRAGMENT', 'Pending ASC request could not be decoded.'));
  }
  try {
    const result = ascRuntime_().flow.previewRequest(envelope, {
      now: ascNow_,
      sha256Hex: ascSha256Hex_,
      authorizationContext: ascAuthorizationContext_(),
      verifyOwner: ascIsBetaActor_
    });
    return ascPreviewResult_(result);
  } catch (error) {
    return ascPreviewResult_(ascFailed_('PREVIEW', 'PREVIEW_VALIDATION_FAILED', 'Request could not be validated. CONFIRM & SYNC stays disabled.'));
  }
}

function ascPreviewResult_(result) {
  const securityValid = Boolean(result) && result.state === 'AWAITING_CONFIRMATION' &&
    Boolean(result.security) && result.security.verified === true;
  return {
    state: securityValid ? 'SECURITY_VALID' : 'REJECTED',
    stage: result && result.stage ? result.stage : 'PREVIEW',
    requestId: result && typeof result.requestId === 'string' ? result.requestId : null,
    securityValid: securityValid,
    writeEnabled: securityValid && ascGitHubAppConfigured_() && ascProductionRegistryConfigured_(),
    issuedAt: securityValid ? result.security.issuedAt : null,
    expiresAt: securityValid ? result.security.expiresAt : null,
    writePerformed: false,
    error: securityValid ? null : {
      code: result && result.error && result.error.code ? result.error.code : 'UNKNOWN',
      message: result && result.error && result.error.message ? result.error.message : 'Request was rejected.'
    }
  };
}

// Server entry for CONFIRM & SYNC. The T-008A flow enforces the explicit confirmation gate.
// Apps Script I/O is synchronous but the reused flow is async; the settled result is stored
// in the owner's user cache and collected by getConfirmSyncResult(requestId).
function confirmAndSync(request) {
  if (!ascIsBetaActor_(ascAuthorizationContext_())) {
    return ascFailed_('ACCESS', 'BETA_ACCESS_REQUIRED', 'Invited beta access is required.');
  }
  let envelope;
  try {
    envelope = ascDecodeFragment_(request && request.fragment);
  } catch (error) {
    return ascFailed_('PREVIEW', 'INVALID_FRAGMENT', 'Pending ASC request could not be decoded. Nothing was saved.');
  }

  const requestId = envelope && typeof envelope.request_id === 'string' ? envelope.request_id : null;
  if (!requestId) {
    return ascFailed_('PREVIEW', 'MISSING_REQUEST_ID', 'Envelope request_id is required. Nothing was saved.');
  }

  if (!ascGitHubAppConfigured_()) {
    return ascFailed_(
      'CONFIG',
      'GITHUB_APP_CONFIG_MISSING',
      'Server GitHub App credential is not configured. Nothing was saved.',
      requestId
    );
  }

  const registry = ascProductionRegistry_();
  if (!registry.ok) {
    return ascFailed_(
      'CONFIG',
      registry.error && registry.error.code ? registry.error.code : 'PRODUCTION_REGISTRY_INVALID',
      'Production GitHub project registry is not configured or is invalid. Nothing was saved.',
      requestId
    );
  }

  // Fail closed: without a cleared result slot, a stale result could be mistaken for this attempt.
  if (!ascClearResult_(requestId)) {
    return ascFailed_('RESULT', 'RESULT_CACHE_UNAVAILABLE', 'Result cache could not be reset. Sync was not started; nothing was saved.', requestId);
  }

  const runtime = ascRuntime_();
  const pending = {
    state: 'RESULT_PENDING',
    stage: 'SYNC',
    redirect: null,
    requestId: requestId,
    error: null
  };
  let settled = null;

  runtime.flow.confirmAndSyncRequest({
    envelope: envelope,
    confirmation: request.confirmation,
    authorizationContext: ascAuthorizationContext_(),
    authorizationPolicy: ascProductionAuthorizationPolicy_,
    resolveGitHubWriteSpec: ascProductionWriteSpec_,
    githubClient: ascCreateGitHubAppRestClient_(),
    historyWriter: { appendHistory: appendHistory_ },
    now: ascNow_,
    sha256Hex: ascSha256Hex_,
    verifyOwner: ascIsBetaActor_,
    claimReplay: ascClaimReplay_,
    sourceCommit: null,
    mainUiUrl: ascMainUiUrl_()
  }).then(function (result) {
    settled = result;
    ascStoreResult_(requestId, result);
  }, function () {
    settled = ascOutcomeUnknown_(
      'SYNC',
      'FLOW_EXCEPTION',
      'Sync flow failed unexpectedly after CONFIRM & SYNC may have started. Reconcile the result before retrying.',
      requestId
    );
    ascStoreResult_(requestId, settled);
  });

  return settled || pending;
}

function getConfirmSyncResult(requestId) {
  if (!ascIsBetaActor_(ascAuthorizationContext_())) {
    return ascFailed_('ACCESS', 'BETA_ACCESS_REQUIRED', 'Invited beta access is required.');
  }
  if (typeof requestId !== 'string' || requestId.length === 0) {
    return ascFailed_('RESULT', 'INVALID_REQUEST_ID', 'Request ID is required.');
  }
  let cached;
  try {
    cached = CacheService.getUserCache().get(ascResultKey_(requestId));
  } catch (error) {
    return ascOutcomeUnknown_(
      'RESULT',
      'SYNC_RESULT_UNREADABLE',
      'Sync result could not be read. Reconcile against HISTORY and the authoritative destination before retrying.',
      requestId
    );
  }
  if (!cached) {
    return ascOutcomeUnknown_(
      'RESULT',
      'SYNC_RESULT_UNAVAILABLE',
      'Sync result is not available. Reconcile against HISTORY and the authoritative destination before retrying.',
      requestId
    );
  }
  try {
    return JSON.parse(cached);
  } catch (error) {
    return ascOutcomeUnknown_(
      'RESULT',
      'SYNC_RESULT_UNREADABLE',
      'Sync result could not be read. Reconcile against HISTORY and the authoritative destination before retrying.',
      requestId
    );
  }
}
