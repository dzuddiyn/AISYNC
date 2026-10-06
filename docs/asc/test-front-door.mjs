import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const clientCode = fs.readFileSync(new URL('./client.js', import.meta.url), 'utf8');
const frontDoorHtml = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');

assert.match(frontDoorHtml, /Continue a SAVE request/);
assert.match(frontDoorHtml, /Start a standalone AI conversation/);
assert.match(frontDoorHtml, /not linked to a CrossAI project/);
assert.match(frontDoorHtml, /OPEN PROJECT DASHBOARD/);
assert.match(frontDoorHtml, /id="signIn" type="button" disabled/);
assert.match(frontDoorHtml, /SIGN IN TO CONTINUE/);
assert.match(frontDoorHtml, /CONTINUE SAVE REQUEST/);
assert.match(clientCode, /signInButton\.disabled = true/);
assert.match(clientCode, /No pending project SAVE request/);
assert.match(clientCode, /NO REQUEST.*expected/s);
assert.match(frontDoorHtml, /HOW SHOULD THE AI HELP/);
assert.match(frontDoorHtml, /Automatic suggestion/);
assert.match(frontDoorHtml, /DUMP — talk it out/);
assert.match(frontDoorHtml, /DECIDE — compare and choose/);
assert.match(frontDoorHtml, /DESIGN — structure and build/);
assert.match(frontDoorHtml, /PREPARE FOR AI/);
assert.match(frontDoorHtml, /Technical handoff details/);
assert.doesNotMatch(frontDoorHtml, /ROUTE OVERRIDE|USER DRAFT|PREPARE HANDOFF|COPY HANDOFF|OPEN PROVIDER/);

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
let routingDom = null;
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
      if (routingDom && routingDom[id]) {
        return routingDom[id];
      }
      return id === 'status' ? ui.status : ui.continueButton;
    }
  },
  sessionStorage: new FakeStorage(),
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
  'Access check opened in a new tab. If that tab says NO REQUEST, that is expected: return here and choose CONTINUE SAVE REQUEST to replay the pending project SAVE.'
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

const providerConfigs = {
  ChatGPT: {
    provider: 'ChatGPT',
    url: 'https://chatgpt.com/',
    handoffMode: 'copy_open'
  },
  Gemini: {
    provider: 'Gemini',
    url: 'https://gemini.google.com/app',
    handoffMode: 'copy_open'
  },
  Copilot: {
    provider: 'Copilot',
    url: 'https://copilot.microsoft.com/',
    handoffMode: 'copy_open'
  }
};
for (const provider of ['ChatGPT', 'Gemini', 'Copilot']) {
  assert.equal(
    JSON.stringify(sandbox.getProviderConfig(provider)),
    JSON.stringify(providerConfigs[provider])
  );
}

const prepared = sandbox.createPreparedHandoff({
  draft: 'bina architecture untuk sistem AISYNC',
  provider: 'Gemini',
  route: 'DESIGN'
});
assert.equal(prepared.providerConfig.handoffMode, 'copy_open');
assert.equal(prepared.bootstrap.includes('Target route: DESIGN'), true);
assert.equal(prepared.bootstrap.includes('Target method: ZASSIMPLE'), true);
assert.equal(
  prepared.bootstrap.includes('https://dzuddiyn.github.io/AISYNC/method/zassimple/my/'),
  true
);
assert.equal(prepared.bootstrap.includes('bina architecture untuk sistem AISYNC'), true);
assert.equal(prepared.bootstrap.includes('Read the method from this exact Method Gateway URL.'), true);
assert.equal(prepared.bootstrap.includes('If you cannot fetch the exact URL, report the failure'), true);
assert.equal(prepared.bootstrap.includes('do not substitute repository search, raw GitHub'), true);
assert.equal(prepared.bootstrap.includes('#asc='), false);
assert.equal(prepared.bootstrap.includes(signInUrl), false);
assert.equal(prepared.bootstrap.includes('FULL METHOD CONTENT'), false);
assert.equal(prepared.bootstrap.includes('asc.github-pages.pending.fragment.v0.1'), false);
assert.equal(prepared.bootstrap.includes('asc.front-door.draft.v0.1'), false);

let providerOpenCall;
sandbox.openProvider('Gemini', (...args) => {
  providerOpenCall = args;
});
assert.deepEqual(providerOpenCall, [
  'https://gemini.google.com/app',
  '_blank',
  'noopener'
]);
assert.equal(providerOpenCall[0].includes('?'), false);
assert.equal(providerOpenCall[0].includes('#'), false);
assert.equal(providerOpenCall[0].includes('bina architecture'), false);
assert.equal(providerOpenCall[0].includes('zassimple/my'), false);
assert.equal(openCount, 1);

const copied = [];
await sandbox.copyHandoffText({
  writeText(value) {
    copied.push(value);
    return Promise.resolve();
  }
}, prepared.bootstrap);
assert.equal(copied[0], prepared.bootstrap);
assert.equal(openCount, 1);
await assert.rejects(
  sandbox.copyHandoffText({
    writeText() {
      return Promise.reject(new Error('clipboard denied'));
    }
  }, prepared.bootstrap)
);

assert.equal(sandbox.isPreparedHandoffCurrent(prepared, {
  draft: 'bina architecture untuk sistem AISYNC',
  provider: 'Gemini',
  route: 'DESIGN'
}), true);
assert.equal(sandbox.isPreparedHandoffCurrent(prepared, {
  draft: 'bandingkan ChatGPT dengan Gemini',
  provider: 'Gemini',
  route: 'DESIGN'
}), false);
assert.equal(sandbox.isPreparedHandoffCurrent(prepared, {
  draft: 'bina architecture untuk sistem AISYNC',
  provider: 'Copilot',
  route: 'DESIGN'
}), false);
assert.equal(sandbox.isPreparedHandoffCurrent(prepared, {
  draft: 'bina architecture untuk sistem AISYNC',
  provider: 'Gemini',
  route: 'DECIDE'
}), false);

routingDom = {
  draft: { value: 'bina architecture untuk sistem AISYNC' },
  provider: { value: 'Gemini' },
  routeOverride: { value: 'DESIGN' },
  suggestedRoute: { textContent: '' },
  activeRoute: { textContent: '' },
  prepareHandoff: { disabled: true },
  handoffPreview: { hidden: true },
  previewProvider: { textContent: '' },
  previewRoute: { textContent: '' },
  previewMethod: { textContent: '' },
  previewGateway: { textContent: '', href: '' },
  previewDraft: { textContent: '' },
  receiverBootstrap: { textContent: '' },
  handoffStatus: { textContent: '' },
  copyHandoff: { disabled: true },
  openProvider: { disabled: true }
};
sandbox.handlePrepareHandoff();
assert.equal(openCount, 1);
assert.equal(routingDom.copyHandoff.disabled, false);
assert.equal(routingDom.openProvider.disabled, false);

routingDom.draft.value = 'changed draft';
sandbox.handleRoutingChange();
assert.equal(routingDom.copyHandoff.disabled, true);
assert.equal(routingDom.openProvider.disabled, true);
assert.equal(routingDom.handoffPreview.hidden, true);

routingDom.draft.value = 'bina architecture untuk sistem AISYNC';
sandbox.handleRoutingChange();
assert.equal(routingDom.copyHandoff.disabled, true);
assert.equal(routingDom.openProvider.disabled, true);
assert.equal(routingDom.handoffPreview.hidden, true);

sandbox.handlePrepareHandoff();
assert.equal(routingDom.copyHandoff.disabled, false);
assert.equal(routingDom.openProvider.disabled, false);
assert.equal(routingDom.handoffPreview.hidden, false);
routingDom = null;

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
