import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const clientCode = fs.readFileSync(new URL('./client.js', import.meta.url), 'utf8');

class FakeStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

const payload = Buffer.from(JSON.stringify({
  envelope_version: '0.1',
  request_id: 'req-github-pages-front-door-test'
}), 'utf8')
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/g, '');

const fragment = '#asc=' + payload;
const storage = new FakeStorage();
const ui = {
  status: { textContent: 'Pending ASC request detected.', className: '' },
  continueButton: { disabled: false }
};
let signInCall;
let openCount = 0;
let networkCalls = 0;
const sandbox = {
  console,
  window: {
    addEventListener() {},
    open(url, target, features) {
      openCount += 1;
      signInCall = { url, target, features };
      return null;
    }
  },
  document: {
    getElementById(id) {
      return id === 'status' ? ui.status : ui.continueButton;
    }
  },
  fetch() {
    networkCalls += 1;
  }
};
vm.createContext(sandbox);
vm.runInContext(clientCode, sandbox);

const captured = sandbox.preservePendingRequest({ hash: fragment }, storage);
assert.equal(captured.source, 'url');
assert.equal(captured.fragment, fragment);
assert.equal(storage.getItem('asc.github-pages.pending.fragment.v0.1'), fragment);

const restored = sandbox.preservePendingRequest({ hash: '' }, storage);
assert.equal(restored.source, 'session');
assert.equal(restored.fragment, fragment);

const signInUrl = sandbox.getProtectedSignInUrl();
assert.equal(
  signInUrl,
  'https://script.google.com/macros/s/AKfycbwueOtAmw_QKpWGfHHuX-dss4TSpyhnRGLj4Y6LcEW3KR2f4tAROR8ECjlCVP1JuEm07w/exec'
);
assert.equal(signInUrl.includes('#asc='), false);
assert.equal(signInUrl.includes('?'), false);
assert.equal(signInUrl.includes(payload), false);

sandbox.handleSignIn();
assert.deepEqual(signInCall, {
  url: signInUrl,
  target: '_blank',
  features: 'noopener'
});
assert.equal(ui.continueButton.disabled, false);
assert.equal(
  ui.status.textContent,
  'Sign-in opened in a new tab. Complete Google sign-in, return here, then press CONTINUE.'
);

const replayUrl = sandbox.buildProtectedReplayUrl(signInUrl, restored.fragment);
assert.equal(replayUrl, signInUrl + fragment);

assert.equal(
  JSON.stringify(sandbox.getSupportedProviders()),
  JSON.stringify(['ChatGPT', 'Gemini', 'Copilot'])
);
assert.equal(sandbox.canPrepareHandoff({ draft: '', provider: 'ChatGPT', route: 'DUMP' }), false);
assert.equal(sandbox.canPrepareHandoff({ draft: '   \t\n', provider: 'ChatGPT', route: 'DUMP' }), false);
assert.equal(sandbox.canPrepareHandoff({ draft: 'hello', provider: '', route: 'DUMP' }), false);
assert.equal(sandbox.canPrepareHandoff({ draft: 'hello', provider: 'ChatGPT', route: '' }), false);

assert.equal(sandbox.suggestRoute('aku nak sembang pasal idea kebun aku'), 'DUMP');
assert.equal(sandbox.suggestRoute('bandingkan ChatGPT dengan Gemini untuk projek ini'), 'DECIDE');
assert.equal(sandbox.suggestRoute('bina architecture untuk sistem AISYNC'), 'DESIGN');
assert.equal(sandbox.suggestRoute('hello, apa khabar?'), 'DUMP');

assert.equal(
  JSON.stringify(sandbox.getRouteConfig('DUMP')),
  JSON.stringify({
    route: 'DUMP',
    method: 'ZASSPILL',
    methodGatewayUrl: 'https://dzuddiyn.github.io/AISYNC/method/zasspill/my/'
  })
);
assert.equal(
  JSON.stringify(sandbox.getRouteConfig('DECIDE')),
  JSON.stringify({
    route: 'DECIDE',
    method: 'ZASSELECTION',
    methodGatewayUrl: 'https://dzuddiyn.github.io/AISYNC/method/zasselection/my/'
  })
);
assert.equal(
  JSON.stringify(sandbox.getRouteConfig('DESIGN')),
  JSON.stringify({
    route: 'DESIGN',
    method: 'ZASSIMPLE',
    methodGatewayUrl: 'https://dzuddiyn.github.io/AISYNC/method/zassimple/my/'
  })
);

assert.equal(sandbox.getActiveRoute('DESIGN', 'DUMP'), 'DUMP');
assert.equal(sandbox.getActiveRoute('DUMP', ''), 'DUMP');
const changedDraftSuggestion = sandbox.suggestRoute('bina architecture untuk sistem AISYNC');
assert.equal(changedDraftSuggestion, 'DESIGN');
assert.equal(sandbox.getActiveRoute(changedDraftSuggestion, 'DECIDE'), 'DECIDE');

const routingStorage = new FakeStorage();
sandbox.writeRoutingState(routingStorage, {
  draft: 'bina architecture',
  provider: 'Gemini',
  routeOverride: 'DECIDE'
});
assert.equal(
  JSON.stringify(sandbox.readRoutingState(routingStorage)),
  JSON.stringify({
    draft: 'bina architecture',
    provider: 'Gemini',
    routeOverride: 'DECIDE'
  })
);

const handoffPreview = sandbox.createHandoffPreview({
  draft: '  bina architecture untuk sistem AISYNC  ',
  provider: 'Copilot',
  route: 'DESIGN'
});
assert.equal(
  JSON.stringify(handoffPreview),
  JSON.stringify({
    provider: 'Copilot',
    route: 'DESIGN',
    method: 'ZASSIMPLE',
    methodGatewayUrl: 'https://dzuddiyn.github.io/AISYNC/method/zassimple/my/',
    draft: 'bina architecture untuk sistem AISYNC'
  })
);
assert.equal(openCount, 1);
assert.equal(networkCalls, 0);

assert.equal(typeof sandbox.confirmAndSync, 'undefined');
assert.equal(typeof sandbox.writeToGitHub, 'undefined');
assert.equal(typeof sandbox.writeToSheets, 'undefined');
assert.equal(typeof sandbox.persistRequest, 'undefined');
assert.equal(typeof sandbox.routeRequest, 'undefined');
assert.equal(typeof sandbox.providerHandoff, 'undefined');

console.log('GitHub Pages front-door preserve/login/replay test: PASS');
console.log('sign-in URL is clean: yes');
console.log('replay URL is exact: yes');
console.log('persistence/write/routing functions exposed: none');
