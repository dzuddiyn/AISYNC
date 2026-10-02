import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const clientCode = fs.readFileSync(new URL('./Client.html', import.meta.url), 'utf8');
const codeGs = fs.readFileSync(new URL('./Code.gs', import.meta.url), 'utf8');

class FakeStorage {
  constructor() { this.map = new Map(); }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
}

function fakeDocument() {
  const els = {};
  for (const id of ['status', 'receipt', 'receipt-json', 'confirm-sync', 'main-ui-link']) {
    els[id] = { id, textContent: '', className: '', hidden: true, disabled: false, href: '' };
  }
  return { els, getElementById: (id) => els[id] || null };
}

const sandbox = { TextDecoder, Uint8Array, atob: s => Buffer.from(s, 'base64').toString('binary'), console };
vm.createContext(sandbox);
vm.runInContext(clientCode, sandbox);

const verifiedReceipt = {
  status: 'SUCCESS', verified: true, write_performed: true,
  adapter_outcome: 'VERIFIED_WRITE', commit_or_record_id: 'commit-sha-1'
};
const synced = {
  state: 'SYNCED', redirect: 'https://example.test/asc-main-ui',
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
  { ...synced, redirect: 'http://insecure.test' }
];
for (const result of nonRedirecting) {
  assert.equal(sandbox.canRedirectAfterSync(result), false, JSON.stringify(result));
}

// Success path: renders receipt, clears pending request, navigates once.
{
  const doc = fakeDocument();
  const storage = new FakeStorage();
  storage.setItem('asc.pending.fragment.v0.1', '#asc=abc');
  const navigations = [];
  const outcome = sandbox.renderSyncResult(synced, { document: doc, storage, navigate: (u) => navigations.push(u) });
  assert.equal(outcome, 'REDIRECTED');
  assert.deepStrictEqual(navigations, ['https://example.test/asc-main-ui']);
  assert.equal(storage.getItem('asc.pending.fragment.v0.1'), null);
  assert.equal(doc.els.receipt.hidden, false);
  assert.match(doc.els['receipt-json'].textContent, /commit-sha-1/);
  assert.match(doc.els.status.textContent, /^SUCCESS/);
}

// Failure paths: visibly FAILED, receipt shown when present, pending request kept, no navigation.
for (const result of [
  { state: 'FAILED', stage: 'WRITE', redirect: null, error: { code: 'WRITE_NOT_VERIFIED', message: 'Adapter write was not verified as persisted.' }, receipt: { status: 'FAILED', verified: false, commit_or_record_id: 'commit-sha-1' } },
  { state: 'FAILED', stage: 'HISTORY', redirect: 'https://example.test/asc-main-ui', error: { code: 'HISTORY_NOT_PERSISTED', message: 'x' }, receipt: verifiedReceipt, historyOutcome: 'HISTORY_WRITE_FAILED' },
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
  assert.match(doc.els.status.textContent, /^SUCCESS/);
}

// Client never writes directly: no client-side GitHub/Sheets/token calls.
assert.doesNotMatch(clientCode, /api\.github\.com|UrlFetchApp|SpreadsheetApp|GITHUB_TOKEN/);
assert.equal(typeof sandbox.writeToGitHub, 'undefined');

// Current Apps Script server binding fails closed (T-008B pending).
const gs = { HtmlService: {} };
vm.createContext(gs);
vm.runInContext(codeGs, gs);
assert.equal(gs.getBootstrapState().writeEnabled, false);
const serverResult = gs.confirmAndSync({ fragment: '#asc=abc', confirmation: sandbox.buildConfirmation('req-1') });
assert.equal(serverResult.state, 'FAILED');
assert.equal(serverResult.writePerformed, false);
assert.equal(serverResult.redirect, null);
assert.equal(sandbox.canRedirectAfterSync(serverResult), false);

console.log('T-008A confirm UI test: PASS');
