import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import { TextEncoder } from 'node:util';

const clientCode = fs.readFileSync(new URL('./client.js', import.meta.url), 'utf8');
const frontDoorHtml = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');

assert.match(frontDoorHtml, /<title>CrossAI<\/title>/);
assert.match(frontDoorHtml, /Dump a thought, compare choices, or build something/);
assert.match(frontDoorHtml, /data-provider="ChatGPT"/);
assert.match(frontDoorHtml, /data-provider="Gemini"/);
assert.match(frontDoorHtml, /data-provider="Copilot"/);
assert.match(frontDoorHtml, /id="go"/);
assert.match(frontDoorHtml, /No project setup first/);
assert.match(frontDoorHtml, /id="saveRecovery" class="save-recovery" hidden/);
assert.doesNotMatch(frontDoorHtml, /Start or continue with AISYNC|OPEN PROJECT DASHBOARD|Start a standalone AI conversation/);
assert.doesNotMatch(frontDoorHtml, /ZASSPILL|ZASSELECTION|ZASSIMPLE|Automatic suggestion|HOW SHOULD THE AI HELP/);

class FakeStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

const sandbox = {
  console,
  TextEncoder,
  btoa(value) { return Buffer.from(value, 'binary').toString('base64'); },
  atob(value) { return Buffer.from(value, 'base64').toString('binary'); },
  URLSearchParams,
  Date,
  Math,
  crypto: { randomUUID: () => '11111111-2222-4333-8444-555555555555' }
};
vm.createContext(sandbox);
vm.runInContext(clientCode, sandbox);

assert.deepEqual(
  JSON.parse(JSON.stringify(sandbox.getSupportedProviders())),
  ['ChatGPT', 'Gemini', 'Copilot']
);

const store = new FakeStorage();
sandbox.writeStartState(store, { draft: 'Saya nak bina sistem kebun', provider: 'Gemini' });
assert.deepEqual(
  JSON.parse(JSON.stringify(sandbox.readStartState(store))),
  { draft: 'Saya nak bina sistem kebun', provider: 'Gemini' }
);

assert.equal(sandbox.validateStartState({ draft: '', provider: 'Gemini' }).code, 'DRAFT_REQUIRED');
assert.equal(sandbox.validateStartState({ draft: 'hello', provider: '' }).code, 'PROVIDER_REQUIRED');
assert.equal(sandbox.validateStartState({ draft: ' hello ', provider: 'ChatGPT' }).ok, true);

const startId = sandbox.ensureStartId(store, { draft: 'Saya nak bina sistem kebun', provider: 'Gemini' }, () => 'cs_TESTSTART123');
assert.equal(startId, 'cs_TESTSTART123');
assert.equal(
  sandbox.ensureStartId(store, { draft: 'Saya nak bina sistem kebun', provider: 'Gemini' }, () => 'cs_OTHER'),
  'cs_TESTSTART123'
);
assert.equal(
  sandbox.ensureStartId(store, { draft: 'Saya nak banding dua pilihan', provider: 'Gemini' }, () => 'cs_NEWSTART123'),
  'cs_NEWSTART123'
);

const startUrl = sandbox.buildCrossAiStartUrl(
  { draft: 'Saya nak banding dua pilihan', provider: 'Gemini' },
  'cs_NEWSTART123'
);
assert.match(startUrl, /\?view=crossai-start#start=/);
assert.equal(startUrl.includes('Saya nak banding'), false);
assert.equal(startUrl.includes('DECIDE'), false, 'public landing does not route before protected start');

assert.equal(sandbox.CROSSAI_AUTH_URL, undefined, 'top-level const is not exported into vm global');
assert.match(clientCode, /\?view=crossai-auth/);
assert.match(clientCode, /Complete Google sign-in in the new tab, then return here and press GO again/);
assert.match(clientCode, /buildCrossAiStartUrl/);
assert.doesNotMatch(clientCode, /function suggestRoute|ZASSPILL|ZASSELECTION|ZASSIMPLE/);

const payload = Buffer.from(JSON.stringify({
  envelope_version: '0.1',
  request_id: 'req-github-pages-front-door-test'
}), 'utf8').toString('base64url');
const fragment = '#asc=' + payload;
const pendingStore = new FakeStorage();
const captured = sandbox.preservePendingRequest({ hash: fragment }, pendingStore);
assert.equal(captured.source, 'url');
assert.equal(captured.fragment, fragment);
assert.equal(sandbox.preservePendingRequest({ hash: '' }, pendingStore).source, 'session');
assert.equal(
  sandbox.buildProtectedReplayUrl(
    'https://script.google.com/macros/s/example/exec',
    fragment
  ),
  'https://script.google.com/macros/s/example/exec' + fragment
);

assert.equal(typeof sandbox.confirmAndSync, 'undefined');
assert.equal(typeof sandbox.writeToGitHub, 'undefined');
assert.equal(typeof sandbox.routeRequest, 'undefined');
assert.equal(typeof sandbox.providerHandoff, 'undefined');

console.log('CrossAI public user-first front door test: PASS');
console.log('public route inference before login: none');
console.log('draft/provider preservation: PASS');
console.log('legacy pending SAVE replay: preserved');
