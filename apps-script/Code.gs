function doGet() {
  return HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle('ASC — Confirm & Sync')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// T-008B — Apps Script binding for the T-008A flow (flow/confirm-sync.mjs, bundled in AscRuntime.gs).
// Owner-locked TEST_ONLY destination policy. This is NOT the production Record ID → GitHub path rule.
const ASC_T008B_TEST_ONLY_DESTINATION_ = Object.freeze({
  repository: 'dzuddiyn/AISYNC',
  branch: 'main',
  path: 'proofs/t008-confirm-sync-live.md'
});
const ASC_TEST_ONLY_RECORD_PREFIX_ = 'TEST_ONLY_';
const ASC_MAIN_UI_PREFIX_ = 'https://sites.google.com/';
const ASC_RESULT_CACHE_PREFIX_ = 'asc.t008.result.';
const ASC_RESULT_CACHE_SECONDS_ = 600;

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

function ascHasGitHubToken_() {
  return ascScriptProperty_('GITHUB_TOKEN') !== null;
}

function getBootstrapState() {
  return {
    authenticated: true,
    ownerOnly: true,
    writeEnabled: ascHasGitHubToken_(),
    redirectConfigured: ascMainUiUrl_() !== null,
    destinationPolicy: 'TEST_ONLY',
    appVersion: '0.1-t008b'
  };
}

// Owner-only authorization policy injected into ASC Core, plus the TEST_ONLY scope guard.
function ascAuthorizationContext_() {
  return {
    activeUser: Session.getActiveUser().getEmail() || '',
    effectiveUser: Session.getEffectiveUser().getEmail() || ''
  };
}

function ascTestOnlyAuthorizationPolicy_(contract, context) {
  const owner = Boolean(context) && context.activeUser.length > 0 &&
    context.activeUser === context.effectiveUser;
  const testOnly = typeof contract['Record ID'] === 'string' &&
    contract['Record ID'].indexOf(ASC_TEST_ONLY_RECORD_PREFIX_) === 0;
  const githubOnly = Array.isArray(contract.Destination) &&
    contract.Destination.length === 1 && contract.Destination[0] === 'GitHub';
  return { authorized: owner && testOnly && githubOnly };
}

// TEST_ONLY write-spec: fixed destination; content must already be a string.
function ascTestOnlyWriteSpec_(invocation) {
  const content = invocation.contract['Content/change'];
  if (typeof content !== 'string') {
    throw new Error('TEST_ONLY policy requires string Content/change.');
  }
  return {
    repository: ASC_T008B_TEST_ONLY_DESTINATION_.repository,
    path: ASC_T008B_TEST_ONLY_DESTINATION_.path,
    branch: ASC_T008B_TEST_ONLY_DESTINATION_.branch,
    content: content,
    commitMessage: 'TEST_ONLY T-008B confirm sync ' + invocation.contract['Record ID']
  };
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

function ascStoreResult_(requestId, result) {
  try {
    CacheService.getUserCache().put(ascResultKey_(requestId), JSON.stringify(result), ASC_RESULT_CACHE_SECONDS_);
  } catch (error) {
    // Result stays unknown; getConfirmSyncResult reports it as not confirmed saved.
  }
}

function ascDecodeFragment_(fragment) {
  if (typeof fragment !== 'string' || !/^#asc=[A-Za-z0-9_-]+$/.test(fragment)) {
    throw new Error('Invalid ASC fragment.');
  }
  return ascRuntime_().transport.decodeEnvelope(fragment.slice('#asc='.length));
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

  const token = ascScriptProperty_('GITHUB_TOKEN');
  if (!token) {
    return ascFailed_('CONFIG', 'GITHUB_TOKEN_MISSING', 'Server GitHub credential is not configured. Nothing was saved.', requestId);
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
    authorizationPolicy: ascTestOnlyAuthorizationPolicy_,
    resolveGitHubWriteSpec: ascTestOnlyWriteSpec_,
    githubClient: runtime.githubRest.createGitHubRestClient({ token: token, fetchImpl: ascUrlFetchImpl_ }),
    historyWriter: { appendHistory: appendHistory },
    now: function () { return new Date().toISOString(); },
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
  const cached = CacheService.getUserCache().get(ascResultKey_(requestId));
  if (!cached) {
    return ascFailed_('RESULT', 'SYNC_RESULT_UNAVAILABLE',
      'Sync result is not available. Check HISTORY; nothing is reported as saved.', requestId);
  }
  try {
    return JSON.parse(cached);
  } catch (error) {
    return ascFailed_('RESULT', 'SYNC_RESULT_UNREADABLE', 'Sync result could not be read. Nothing is reported as saved.', requestId);
  }
}
