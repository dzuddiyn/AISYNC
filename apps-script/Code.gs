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

// T-008A: the confirm/sync orchestration is implemented and tested in flow/confirm-sync.mjs.
// The Apps Script runtime binding (bundled Core/adapter/receipt, UrlFetchApp GitHub transport,
// History.gs writer, main ASC UI URL) is T-008B. Until then this deployment stays preview-only.
function getBootstrapState() {
  return {
    authenticated: true,
    ownerOnly: true,
    writeEnabled: false,
    appVersion: '0.1-t008a'
  };
}

// Fail closed: no persistence, no fabricated receipt, no redirect.
function confirmAndSync(request) {
  return {
    state: 'FAILED',
    stage: 'CONFIG',
    redirect: null,
    writePerformed: false,
    error: {
      code: 'SYNC_RUNTIME_NOT_BOUND',
      message: 'CONFIRM & SYNC runtime is not bound on this deployment. Nothing was saved.'
    }
  };
}
