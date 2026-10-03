// Default route = T-008 preview / CONFIRM & SYNC (unchanged).
// ?view=dashboard = T-009 read-only dashboard.
function doGet(e) {
  const view = e && e.parameter ? e.parameter.view : undefined;
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

function include(filename) {
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
  return {
    authenticated: true,
    ownerOnly: true,
    writeEnabled: ascGitHubAppConfigured_() && ascProductionRegistryConfigured_(),
    redirectConfigured: ascMainUiUrl_() !== null,
    destinationPolicy: 'PRODUCTION_REGISTRY',
    destinationAuth: 'GITHUB_APP',
    appVersion: '1.0-t016'
  };
}

// Owner-only identity remains the T-016 closed-beta authorization gate.
// Project/repository/path authorization is a separate server-side registry decision.
function ascAuthorizationContext_() {
  return {
    activeUser: Session.getActiveUser().getEmail() || '',
    effectiveUser: Session.getEffectiveUser().getEmail() || ''
  };
}

// Current protected deployment remains owner-only. T-018 may broaden the human
// allowlist without weakening the production project/path registry.
function ascIsOwner_(context) {
  return Boolean(context) && typeof context.activeUser === 'string' && context.activeUser.length > 0 &&
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

// Atomic one-time claim: lock → inspect → reject if claimed → persist claim → release.
// Any uncertainty (no lock, property read/write error, unverifiable write) fails closed.
function ascClaimReplay_(requestId) {
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
    const props = PropertiesService.getScriptProperties();
    const key = ascReplayKey_(requestId);
    if (props.getProperty(key) !== null) {
      return { claimed: false, code: 'REPLAY_REJECTED' };
    }
    const marker = JSON.stringify({ state: 'CLAIMED', claimed_at: ascNow_() });
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
      verifyOwner: ascIsOwner_
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
    historyWriter: { appendHistory: appendHistory },
    now: ascNow_,
    sha256Hex: ascSha256Hex_,
    verifyOwner: ascIsOwner_,
    claimReplay: ascClaimReplay_,
    sourceCommit: null,
    mainUiUrl: ascMainUiUrl_()
  }).then(function (result) {
    settled = result;
    ascStoreResult_(requestId, result);
  }, function () {
    settled = ascFailed_('SYNC', 'FLOW_EXCEPTION', 'Sync flow failed unexpectedly. Check HISTORY; nothing is reported as saved.', requestId);
    settled.writePerformed = null; // unknown — not claimed either way
    ascStoreResult_(requestId, settled);
  });

  return settled || pending;
}

function getConfirmSyncResult(requestId) {
  if (typeof requestId !== 'string' || requestId.length === 0) {
    return ascFailed_('RESULT', 'INVALID_REQUEST_ID', 'Request ID is required.');
  }
  let cached;
  try {
    cached = CacheService.getUserCache().get(ascResultKey_(requestId));
  } catch (error) {
    const unknown = ascFailed_('RESULT', 'SYNC_RESULT_UNREADABLE',
      'Sync result could not be read. Check HISTORY; nothing is reported as saved.', requestId);
    unknown.writePerformed = null; // unknown — not claimed either way
    return unknown;
  }
  if (!cached) {
    const unknown = ascFailed_('RESULT', 'SYNC_RESULT_UNAVAILABLE',
      'Sync result is not available. Check HISTORY; nothing is reported as saved.', requestId);
    unknown.writePerformed = null;
    return unknown;
  }
  try {
    return JSON.parse(cached);
  } catch (error) {
    const unknown = ascFailed_('RESULT', 'SYNC_RESULT_UNREADABLE',
      'Sync result could not be read. Check HISTORY; nothing is reported as saved.', requestId);
    unknown.writePerformed = null;
    return unknown;
  }
}
