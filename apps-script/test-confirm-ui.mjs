import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const clientCode = fs.readFileSync(new URL('./Client.html', import.meta.url), 'utf8');

class FakeStorage {
  constructor() { this.map = new Map(); }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
}

function fakeDocument() {
  const els = {};
  for (const id of ['status', 'save-state', 'receipt', 'receipt-summary', 'receipt-json', 'confirm-sync', 'main-ui-link']) {
    els[id] = { id, textContent: '', className: '', hidden: true, disabled: false, href: '' };
  }
  return { els, getElementById: (id) => els[id] || null };
}

const sandbox = { TextDecoder, Uint8Array, atob: s => Buffer.from(s, 'base64').toString('binary'), console };
vm.createContext(sandbox);
vm.runInContext(clientCode, sandbox);

const verifiedReceipt = {
  status: 'SUCCESS',
  verified: true,
  write_performed: true,
  adapter_outcome: 'VERIFIED_WRITE',
  affected_resource: 'dzuddiyn/AISYNC/records/R-1.md',
  commit_or_record_id: 'commit-sha-1',
  request_id: 'req-1',
  timestamp: '2026-10-04T00:00:00Z',
  failure_reason: null
};
const synced = {
  state: 'SYNCED', redirect: 'https://sites.google.com/view/aisync-asc',
  receipt: verifiedReceipt, historyOutcome: 'HISTORY_PERSISTED', error: null
};

// Confirmation object is explicit and request-bound.
assert.equal(
  JSON.stringify(sandbox.buildConfirmation('req-1')),
  JSON.stringify({ confirmed: true, action: 'CONFIRM_AND_SYNC', requestId: 'req-1' })
);

// Only a verified SUCCESS receipt + persisted HISTORY redirects.
assert.equal(sandbox.canRedirectAfterSync(synced), true);
const nonRedirecting = [
  null,
  undefined,
  {},
  { ...synced, state: 'FAILED' },
  { ...synced, state: 'SYNCED_REDIRECT_UNAVAILABLE', redirect: null },
  { ...synced, state: 'AWAITING_CONFIRMATION' },
  { ...synced, receipt: { ...verifiedReceipt, status: 'FAILED' } },
  { ...synced, receipt: { ...verifiedReceipt, verified: false } },
  { ...synced, receipt: undefined },
  { ...synced, historyOutcome: 'HISTORY_WRITE_FAILED' },
  { ...synced, redirect: 'javascript:alert(1)' },
  { ...synced, redirect: 'http://insecure.test' },
  { ...synced, redirect: 'https://example.test/asc-main-ui' },
  { ...synced, redirect: 'https://sites.google.com.evil.test/x' },
  { ...synced, redirect: 'https://sites.google.com/' }
];
for (const result of nonRedirecting) {
  assert.equal(sandbox.canRedirectAfterSync(result), false, JSON.stringify(result));
}

// Success path: SAVED is rendered factually before a delayed return to main UI.
{
  const doc = fakeDocument();
  const storage = new FakeStorage();
  storage.setItem('asc.pending.fragment.v0.1', '#asc=abc');
  const navigations = [];
  const scheduled = [];
  const outcome = sandbox.renderSyncResult(synced, {
    document: doc,
    storage,
    navigate: (u) => navigations.push(u),
    schedule: (fn, ms) => scheduled.push({ fn, ms })
  });
  assert.equal(outcome, 'REDIRECT_SCHEDULED');
  assert.equal(navigations.length, 0, 'navigation is delayed so SAVED is visible');
  assert.equal(scheduled.length, 1);
  assert.equal(scheduled[0].ms, 3000);
  assert.equal(storage.getItem('asc.pending.fragment.v0.1'), null);
  assert.equal(doc.els.receipt.hidden, false);
  assert.equal(doc.els['save-state'].textContent, 'SAVED');
  assert.match(doc.els['receipt-json'].textContent, /commit-sha-1/);
  assert.match(doc.els['receipt-summary'].textContent, /State: SAVED/);
  assert.match(doc.els['receipt-summary'].textContent, /Outcome: VERIFIED_WRITE/);
  assert.match(doc.els['receipt-summary'].textContent, /Commit \/ record: commit-sha-1/);
  assert.match(doc.els.status.textContent, /^SAVED/);
  scheduled[0].fn();
  assert.deepStrictEqual(navigations, ['https://sites.google.com/view/aisync-asc']);
}

// Failure paths: visibly FAILED, receipt shown when present, pending request kept, no navigation.
for (const result of [
  { state: 'FAILED', stage: 'WRITE', redirect: null, error: { code: 'WRITE_NOT_VERIFIED', message: 'Adapter write was not verified as persisted.' }, receipt: { status: 'FAILED', verified: false, commit_or_record_id: 'commit-sha-1' } },
  { state: 'FAILED', stage: 'HISTORY', redirect: 'https://sites.google.com/view/aisync-asc', error: { code: 'HISTORY_NOT_PERSISTED', message: 'x' }, receipt: verifiedReceipt, historyOutcome: 'HISTORY_WRITE_FAILED' },
  { state: 'FAILED', stage: 'CONFIG', redirect: null, writePerformed: false, error: { code: 'SYNC_RUNTIME_NOT_BOUND', message: 'Nothing was saved.' } },
  null
]) {
  const doc = fakeDocument();
  const storage = new FakeStorage();
  storage.setItem('asc.pending.fragment.v0.1', '#asc=abc');
  const navigations = [];
  const outcome = sandbox.renderSyncResult(result, { document: doc, storage, navigate: (u) => navigations.push(u) });
  assert.equal(outcome, 'STAYED');
  assert.equal(navigations.length, 0);
  assert.equal(storage.getItem('asc.pending.fragment.v0.1'), '#asc=abc');
  assert.equal(doc.els['save-state'].textContent, 'FAILED');
  assert.match(doc.els.status.textContent, /^FAILED/);
  assert.match(doc.els.status.className, /error/);
}

// Verified sync without a main UI URL: factual success message, no redirect, not labelled FAILED.
{
  const doc = fakeDocument();
  const navigations = [];
  const outcome = sandbox.renderSyncResult(
    { ...synced, state: 'SYNCED_REDIRECT_UNAVAILABLE', redirect: null, error: { code: 'MAIN_UI_URL_MISSING' } },
    { document: doc, storage: new FakeStorage(), navigate: (u) => navigations.push(u) }
  );
  assert.equal(outcome, 'STAYED');
  assert.equal(navigations.length, 0);
  assert.equal(doc.els['save-state'].textContent, 'SAVED');
  assert.match(doc.els.status.textContent, /^SAVED/);
}


// Gate 4 factual state classifier never labels unverified/incomplete results SAVED.
assert.equal(sandbox.classifySaveState({ state: 'AWAITING_CONFIRMATION' }), 'UNSAVED');
assert.equal(sandbox.classifySaveState({ state: 'RESULT_PENDING' }), 'SYNCING');
assert.equal(sandbox.classifySaveState(synced), 'SAVED');
assert.equal(sandbox.classifySaveState({ ...synced, receipt: { ...verifiedReceipt, verified: false } }), 'FAILED');
assert.equal(sandbox.classifySaveState({ ...synced, historyOutcome: 'HISTORY_WRITE_FAILED' }), 'FAILED');
assert.equal(sandbox.classifySaveState({ state: 'FAILED', error: { code: 'WRITE_ERROR' } }), 'FAILED');

// NO_CHANGE and reconciled verified persistence are factual SAVED outcomes without invented commit SHA.
{
  const noChange = {
    ...synced,
    receipt: {
      ...verifiedReceipt,
      adapter_outcome: 'NO_CHANGE',
      write_performed: false,
      commit_or_record_id: null
    }
  };
  assert.equal(sandbox.classifySaveState(noChange), 'SAVED');
  assert.match(sandbox.describeReceipt(noChange), /No new commit/);

  const reconciled = {
    ...synced,
    receipt: {
      ...verifiedReceipt,
      adapter_outcome: 'VERIFIED_WRITE_RECONCILED',
      write_performed: null,
      commit_or_record_id: null
    }
  };
  assert.equal(sandbox.classifySaveState(reconciled), 'SAVED');
  assert.match(sandbox.describeReceipt(reconciled), /No attributable commit SHA/);
}

// RESULT_PENDING description remains SYNCING and never SAVED.
{
  const view = sandbox.describeSyncResult({ state: 'RESULT_PENDING', requestId: 'req-1' });
  assert.equal(view.state, 'SYNCING');
  assert.match(view.message, /^SYNCING/);
}

// Client never writes directly: no client-side GitHub/Sheets/token calls.
assert.doesNotMatch(clientCode, /api\.github\.com|UrlFetchApp|SpreadsheetApp|GITHUB_TOKEN/);
assert.equal(typeof sandbox.writeToGitHub, 'undefined');

// RESULT_PENDING triggers exactly one factual result fetch; other replies render directly.
{
  const rendered = [];
  const calls = [];
  const run = {
    withSuccessHandler(fn) { this.ok = fn; return this; },
    withFailureHandler(fn) { this.fail = fn; return this; },
    getConfirmSyncResult(id) { calls.push(id); this.ok({ state: 'FAILED', error: { code: 'SYNC_RESULT_UNAVAILABLE', message: 'x' } }); }
  };
  const r1 = sandbox.handleConfirmResponse({ state: 'RESULT_PENDING', requestId: 'req-1', redirect: null }, { run, render: (x) => rendered.push(x) });
  assert.equal(r1, 'FETCHING_RESULT');
  assert.deepStrictEqual(calls, ['req-1']);
  assert.equal(rendered[0].state, 'FAILED');
  assert.equal(sandbox.canRedirectAfterSync(rendered[0]), false);
  const r2 = sandbox.handleConfirmResponse({ state: 'FAILED', error: { code: 'X' } }, { run, render: (x) => rendered.push(x) });
  assert.equal(r2, 'RENDERED');
  assert.equal(calls.length, 1);
}

// T-010: CONFIRM & SYNC enabled only after server-side security validation of this exact request.
{
  const env = { request_id: 'req-1' };
  const ok = { securityValid: true, writeEnabled: true, requestId: 'req-1', expiresAt: '2026-10-03T03:20:00Z', error: null };
  assert.equal(sandbox.describeServerPreview(ok, env).enabled, true);
  for (const bad of [
    null,
    undefined,
    { ...ok, securityValid: false, error: { code: 'REQUEST_EXPIRED', message: 'ASC request has expired.' } },
    { ...ok, securityValid: false, error: { code: 'INTEGRITY_MISMATCH', message: 'x' } },
    { ...ok, securityValid: 'true' },
    { ...ok, requestId: 'other' },
    { ...ok, writeEnabled: false }
  ]) {
    assert.equal(sandbox.describeServerPreview(bad, env).enabled, false, JSON.stringify(bad));
  }
  assert.match(sandbox.describeServerPreview({ securityValid: false, error: { code: 'REQUEST_EXPIRED', message: 'ASC request has expired.' } }, env).note, /^REJECTED \(REQUEST_EXPIRED\)/);
  assert.match(sandbox.describeServerPreview(null, env).note, /SERVER_PREVIEW_UNAVAILABLE/);

  const doc = fakeDocument();
  for (const id of ['confirm-controls', 'confirm-note']) doc.els[id] = { id, textContent: '', className: '', hidden: true, disabled: false };
  sandbox.document = doc;
  doc.els['confirm-sync'].disabled = true;
  const rejected = sandbox.showConfirmControls(env, '#asc=abc', { securityValid: false, error: { code: 'INTEGRITY_MISMATCH', message: 'Envelope content does not match its SHA-256 digest.' } });
  assert.equal(rejected.enabled, false);
  assert.equal(doc.els['confirm-sync'].disabled, true, 'bad request never write-enabled');
  assert.equal(doc.els['save-state'].textContent, 'FAILED');
  assert.match(doc.els.status.textContent, /^REJECTED \(INTEGRITY_MISMATCH\)/);
  assert.match(doc.els.status.className, /error/);
  sandbox.showConfirmControls(env, '#asc=abc', ok);
  assert.equal(doc.els['save-state'].textContent, 'UNSAVED');
  assert.equal(doc.els['confirm-sync'].disabled, false);

  // After a confirmed attempt the request_id is consumed: button stays disabled, except pre-claim retryable failures.
  const storage = new FakeStorage();
  sandbox.renderSyncResult({ state: 'FAILED', error: { code: 'REPLAY_REJECTED', message: 'x' } }, { document: doc, storage, navigate: () => {} });
  assert.equal(doc.els['confirm-sync'].disabled, true);
  sandbox.renderSyncResult({ state: 'FAILED', stage: 'WRITE', error: { code: 'WRITE_NOT_VERIFIED', message: 'x' } }, { document: doc, storage, navigate: () => {} });
  assert.equal(doc.els['confirm-sync'].disabled, true);
  sandbox.renderSyncResult({ state: 'FAILED', error: { code: 'REPLAY_STORE_UNAVAILABLE', message: 'x' } }, { document: doc, storage, navigate: () => {} });
  assert.equal(doc.els['confirm-sync'].disabled, true, 'uncertain replay state must require a new request_id');
  sandbox.renderSyncResult({ state: 'FAILED', error: { code: 'RESULT_CACHE_UNAVAILABLE', message: 'x' } }, { document: doc, storage, navigate: () => {} });
  assert.equal(doc.els['confirm-sync'].disabled, false, 'cache clear failure occurs before replay claim and is safe to retry');

  // Without the Apps Script runtime the server preview is unavailable → disabled.
  let got;
  sandbox.loadServerPreview('#asc=abc', (r) => { got = r; });
  assert.equal(got.securityValid, false);
  assert.equal(got.error.code, 'SERVER_PREVIEW_UNAVAILABLE');
  assert.doesNotMatch(clientCode, /getBootstrapState/, 'enablement no longer comes from bootstrap alone');
}

console.log('T-008A/B + T-010B confirm UI test: PASS');
