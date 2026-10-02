// T-008B — local Apps Script binding test.
// Loads RuntimeShims.gs + generated AscRuntime.gs + Code.gs into one VM context with fake
// Apps Script services (Utilities, UrlFetchApp → in-memory GitHub Contents API, SpreadsheetApp,
// PropertiesService, Session, CacheService). No network, no real GitHub, no real Sheet.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { buildRuntime } from './build-runtime.mjs';

const read = (f) => fs.readFileSync(new URL('./' + f, import.meta.url), 'utf8');
const SHIMS = read('RuntimeShims.gs');
const RUNTIME = read('AscRuntime.gs');
const CODE = read('Code.gs');
const CLIENT = read('Client.html');

const FAKE_TOKEN = 'FAKE_TEST_TOKEN_value_1234567890';
const SITES_URL = 'https://sites.google.com/view/aisync-asc';
const OWNER = 'owner@example.test';
const TEST_PATH = 'proofs/t008-confirm-sync-live.md';
const HISTORY_HEADERS = [
  'request_id', 'project_id', 'operation', 'destination', 'status', 'affected_resource',
  'commit_or_record_id', 'source_commit', 'timestamp', 'failure_reason', 'receipt_json'
];

// 0. Generated bundle is exactly the mechanical build of the current sources.
assert.equal(RUNTIME, buildRuntime(), 'AscRuntime.gs is stale; run node apps-script/build-runtime.mjs');

// 0b. No credential material is hard-coded in the Apps Script project.
for (const [name, src] of [['RuntimeShims.gs', SHIMS], ['AscRuntime.gs', RUNTIME], ['Code.gs', CODE], ['Client.html', CLIENT]]) {
  assert.doesNotMatch(src, /ghp_[A-Za-z0-9]{10,}|github_pat_[A-Za-z0-9_]{10,}/, name + ' contains a token-like literal');
}
assert.doesNotMatch(CLIENT, /GITHUB_TOKEN|api\.github\.com|UrlFetchApp|PropertiesService/);

// ---- fake Apps Script services -------------------------------------------------------------
const signed = (buf) => Array.from(buf, (b) => (b > 127 ? b - 256 : b));
const unsigned = (arr) => Buffer.from(Array.from(arr, (b) => b & 0xff));

function makeBlob(bytes) {
  return {
    bytes,
    setDataFromString(str, charset) { assert.equal(charset, 'UTF-8'); this.bytes = signed(Buffer.from(str, 'utf8')); return this; },
    getBytes() { return this.bytes.slice(); },
    getDataAsString(charset) { assert.equal(charset, 'UTF-8'); return unsigned(this.bytes).toString('utf8'); }
  };
}

const Utilities = {
  base64Encode(bytes) { return unsigned(bytes).toString('base64'); },
  base64Decode(text) {
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(text) || text.length % 4 === 1) throw new Error('Could not decode string.');
    return signed(Buffer.from(text, 'base64'));
  },
  base64EncodeWebSafe(str) { return Buffer.from(String(str), 'utf8').toString('base64url'); },
  newBlob(data) { return makeBlob(typeof data === 'string' ? signed(Buffer.from(data, 'utf8')) : Array.from(data)); }
};

function createWorld({ props = {}, putMode = 'ok', headerOk = true, activeUser = OWNER } = {}) {
  const github = { file: null, calls: [], commitCounter: 0, putMode, getMode: 'ok' };
  const cacheFaults = { remove: false, put: false, get: false };
  const rows = [];
  const cache = new Map();
  const logs = [];

  const UrlFetchApp = {
    fetch(url, options) {
      github.calls.push({ url, options: JSON.parse(JSON.stringify(options)) });
      const expectedUrl = 'https://api.github.com/repos/dzuddiyn/AISYNC/contents/' + TEST_PATH + '?ref=main';
      assert.equal(url, expectedUrl, 'only the TEST_ONLY destination is addressed');
      assert.equal(options.muteHttpExceptions, true);
      const respond = (status, body) => ({ getResponseCode: () => status, getContentText: () => JSON.stringify(body || {}) });
      if (options.method === 'get') {
        if (github.getMode === 'error') return respond(500, { message: 'server error' });
        if (!github.file) return respond(404, { message: 'Not Found' });
        const b64 = Buffer.from(github.file.content, 'utf8').toString('base64').replace(/(.{60})/g, '$1\n');
        return respond(200, { type: 'file', sha: github.file.sha, content: b64 });
      }
      if (options.method === 'put') {
        if (github.putMode === 'throw') throw new Error('network');
        if (github.putMode === 'conflict') return respond(409, { message: 'conflict' });
        const body = JSON.parse(options.payload);
        assert.equal(body.branch, 'main');
        if (github.file) assert.equal(body.sha, github.file.sha, 'current SHA enforced');
        let content = Buffer.from(body.content, 'base64').toString('utf8');
        if (github.putMode === 'corrupt') content += 'CORRUPTED';
        github.commitCounter += 1;
        github.file = { sha: 'blobsha' + github.commitCounter, content };
        return respond(github.commitCounter === 1 ? 201 : 200, {
          commit: { sha: 'commitsha' + github.commitCounter }, content: { sha: github.file.sha }
        });
      }
      throw new Error('unexpected method ' + options.method);
    }
  };

  const sheet = {
    getRange(r, c, nr, nc) {
      return { getValues: () => [headerOk ? HISTORY_HEADERS.slice(0, nc) : ['wrong'].concat(HISTORY_HEADERS.slice(1, nc))] };
    },
    appendRow(row) { rows.push(row.slice()); },
    getLastRow() { return rows.length + 1; }
  };

  const context = {
    console: { log: (...a) => logs.push(a.join(' ')), error: (...a) => logs.push(a.join(' ')), warn: (...a) => logs.push(a.join(' ')) },
    Utilities,
    UrlFetchApp,
    HtmlService: {},
    SpreadsheetApp: { openById: () => ({ getSheetByName: (n) => (n === 'HISTORY' ? sheet : null) }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k in props ? props[k] : null) }) },
    Session: {
      getActiveUser: () => ({ getEmail: () => activeUser }),
      getEffectiveUser: () => ({ getEmail: () => OWNER })
    },
    CacheService: {
      getUserCache: () => ({
        put: (k, v) => { if (cacheFaults.put) throw new Error('cache put'); cache.set(k, v); },
        get: (k) => { if (cacheFaults.get) throw new Error('cache get'); return cache.has(k) ? cache.get(k) : null; },
        remove: (k) => { if (cacheFaults.remove) throw new Error('cache remove'); cache.delete(k); }
      })
    },
    Uint8Array
  };
  vm.createContext(context);
  vm.runInContext(SHIMS, context, { filename: 'RuntimeShims.gs' });
  vm.runInContext(RUNTIME, context, { filename: 'AscRuntime.gs' });
  vm.runInContext(CODE, context, { filename: 'Code.gs' });
  return { context, github, rows, cache, logs, cacheFaults };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

function encodeFragment(envelope) {
  return '#asc=' + Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64url');
}

function contractWith(overrides = {}) {
  return {
    Project: 'AISYNC',
    'Source method': 'ZASSIMPLE',
    Operation: 'SAVE',
    'Record type': 'proof',
    'Record ID': 'TEST_ONLY_T008B_LOCAL',
    'Content/change': '# T-008B TEST_ONLY\n\nSimpan rekod — ujian ✓\n',
    Lineage: ['T-008A'],
    Destination: ['GitHub'],
    ...overrides
  };
}

function envelopeWith(contract, requestId = 'TEST_ONLY_T008B_LOCAL_001') {
  return { envelope_version: '0.1', request_id: requestId, expires_at: '2026-10-04T00:00:00Z', integrity: { algorithm: 'SHA-256', digest: null }, contract };
}

const confirmFor = (requestId = 'TEST_ONLY_T008B_LOCAL_001') => ({ confirmed: true, action: 'CONFIRM_AND_SYNC', requestId });
const fullProps = { GITHUB_TOKEN: FAKE_TOKEN, ASC_MAIN_UI_URL: SITES_URL };

async function run(world, envelope, confirmation) {
  const immediate = world.context.confirmAndSync({ fragment: encodeFragment(envelope), confirmation });
  await settle();
  const final = immediate.state === 'RESULT_PENDING'
    ? world.context.getConfirmSyncResult(envelope.request_id)
    : immediate;
  return { immediate, final: JSON.parse(JSON.stringify(final)) };
}

function assertNoTokenLeak(world, ...values) {
  const blob = JSON.stringify([values, world.rows, [...world.cache.values()], world.logs]);
  assert.equal(blob.includes(FAKE_TOKEN), false, 'token leaked');
}

// 1. Bootstrap reflects configuration without exposing it.
{
  const none = createWorld();
  const b = none.context.getBootstrapState();
  assert.equal(b.writeEnabled, false);
  assert.equal(b.redirectConfigured, false);
  const full = createWorld({ props: fullProps });
  const b2 = full.context.getBootstrapState();
  assert.equal(b2.writeEnabled, true);
  assert.equal(b2.redirectConfigured, true);
  assert.equal(JSON.stringify(b2).includes(FAKE_TOKEN), false);
}

// 2. No persistence before explicit confirmation (T-008A gate preserved through the binding).
for (const confirmation of [undefined, {}, { confirmed: true, action: 'CONFIRM_AND_SYNC', requestId: 'OTHER' }]) {
  const w = createWorld({ props: fullProps });
  const { immediate, final } = await run(w, envelopeWith(contractWith()), confirmation);
  assert.equal(immediate.state, 'RESULT_PENDING');
  assert.equal(final.state, 'AWAITING_CONFIRMATION');
  assert.equal(final.redirect, null);
  assert.equal(w.github.calls.length, 0);
  assert.equal(w.rows.length, 0);
}

// 3. Confirmed TEST_ONLY CREATE: GET → PUT → GET, verified receipt, HISTORY row, Sites redirect.
{
  const w = createWorld({ props: fullProps });
  const contract = contractWith();
  const { immediate, final } = await run(w, envelopeWith(contract), confirmFor());
  assert.equal(immediate.state, 'RESULT_PENDING', 'immediate reply is never success');
  assert.equal(immediate.redirect, null);
  assert.equal(final.state, 'SYNCED');
  assert.equal(final.redirect, SITES_URL);
  assert.equal(final.receipt.status, 'SUCCESS');
  assert.equal(final.receipt.verified, true);
  assert.equal(final.receipt.adapter_outcome, 'VERIFIED_WRITE');
  assert.equal(final.receipt.commit_or_record_id, 'commitsha1');
  assert.equal(final.receipt.affected_resource, 'dzuddiyn/AISYNC/' + TEST_PATH);
  assert.equal(final.historyOutcome, 'HISTORY_PERSISTED');
  assert.deepStrictEqual(w.github.calls.map((c) => c.options.method), ['get', 'put', 'get']);
  for (const c of w.github.calls) {
    assert.equal(c.options.headers.Authorization, 'Bearer ' + FAKE_TOKEN);
    assert.equal(c.options.followRedirects, false);
    assert.equal('User-Agent' in c.options.headers, false);
  }
  assert.equal(w.github.file.content, contract['Content/change'], 'UTF-8 content persisted exactly');
  assert.equal(w.rows.length, 1);
  assert.equal(w.rows[0].length, 11);
  assert.equal(w.rows[0][HISTORY_HEADERS.indexOf('status')], 'SUCCESS');
  assert.equal(w.rows[0][HISTORY_HEADERS.indexOf('commit_or_record_id')], 'commitsha1');
  assert.equal(JSON.parse(w.rows[0][10]).verified, true);
  assertNoTokenLeak(w, immediate, final);

  // 3b. Same request again → NO_CHANGE verified SUCCESS, no second PUT.
  const again = await run(w, envelopeWith(contract, 'TEST_ONLY_T008B_LOCAL_002'), confirmFor('TEST_ONLY_T008B_LOCAL_002'));
  assert.equal(again.final.state, 'SYNCED');
  assert.equal(again.final.receipt.adapter_outcome, 'NO_CHANGE');
  assert.equal(w.github.calls.filter((c) => c.options.method === 'put').length, 1);

  // 3c. Changed content → UPDATE with current SHA.
  const upd = await run(w, envelopeWith(contractWith({ 'Content/change': '# updated\n' }), 'TEST_ONLY_T008B_LOCAL_003'), confirmFor('TEST_ONLY_T008B_LOCAL_003'));
  assert.equal(upd.final.state, 'SYNCED');
  assert.equal(upd.final.receipt.commit_or_record_id, 'commitsha2');
}

// 4. Redirect accepted only for https://sites.google.com/ from Script Properties.
for (const url of [null, '', 'https://example.test/ui', 'http://sites.google.com/view/x', 'https://sites.google.com.evil.test/x', 'https://sites.google.com/', 'https://sites.google.com/view/x y']) {
  const props = { GITHUB_TOKEN: FAKE_TOKEN };
  if (url !== null) props.ASC_MAIN_UI_URL = url;
  const w = createWorld({ props });
  const { final } = await run(w, envelopeWith(contractWith()), confirmFor());
  assert.equal(final.state, 'SYNCED_REDIRECT_UNAVAILABLE', String(url));
  assert.equal(final.redirect, null);
  assert.equal(final.receipt.status, 'SUCCESS');
}

// 5. Failed / unverified writes stay FAILED, are recorded in HISTORY, and never redirect.
for (const [putMode, outcome] of [['conflict', 'WRITE_ERROR'], ['throw', 'WRITE_ERROR'], ['corrupt', 'WRITE_UNVERIFIED']]) {
  const w = createWorld({ props: fullProps, putMode });
  const { final } = await run(w, envelopeWith(contractWith()), confirmFor());
  assert.equal(final.state, 'FAILED', putMode);
  assert.equal(final.stage, 'WRITE');
  assert.equal(final.redirect, null);
  assert.equal(final.receipt.status, 'FAILED');
  assert.equal(final.receipt.adapter_outcome, outcome);
  assert.equal(w.rows.length, 1);
  assert.equal(w.rows[0][HISTORY_HEADERS.indexOf('status')], 'FAILED');
  if (putMode === 'corrupt') {
    assert.equal(final.receipt.commit_or_record_id, 'commitsha1');
    assert.equal(final.receipt.verified, false);
  }
  assertNoTokenLeak(w, final);
}

// 6. Verified write but HISTORY header mismatch → FAILED (stage HISTORY), no redirect.
{
  const w = createWorld({ props: fullProps, headerOk: false });
  const { final } = await run(w, envelopeWith(contractWith()), confirmFor());
  assert.equal(final.state, 'FAILED');
  assert.equal(final.stage, 'HISTORY');
  assert.equal(final.redirect, null);
  assert.equal(final.receipt.status, 'SUCCESS');
  assert.equal(w.rows.length, 0);
}

// 7. TEST_ONLY scope, owner, and destination guards reject before any I/O.
for (const [label, contract, opts] of [
  ['non TEST_ONLY record', contractWith({ 'Record ID': 'D-030' }), {}],
  ['mixed destination', contractWith({ Destination: ['GitHub', 'ASC_DB'] }), {}],
  ['non-owner session', contractWith(), { activeUser: 'someone@example.test' }],
  ['empty active user', contractWith(), { activeUser: '' }]
]) {
  const w = createWorld({ props: fullProps, ...opts });
  const { final } = await run(w, envelopeWith(contract), confirmFor());
  assert.equal(final.state, 'FAILED', label);
  assert.equal(final.redirect, null, label);
  assert.equal(w.github.calls.length, 0, label);
  assert.equal(w.rows.length, 0, label);
}

// 8. Non-string content under TEST_ONLY policy → factual INVALID_INPUT FAILED, no GitHub I/O.
{
  const w = createWorld({ props: fullProps });
  const { final } = await run(w, envelopeWith(contractWith({ 'Content/change': { a: 1 } })), confirmFor());
  assert.equal(final.state, 'FAILED');
  assert.equal(final.receipt.adapter_outcome, 'INVALID_INPUT');
  assert.equal(w.github.calls.length, 0);
  assert.equal(final.redirect, null);
}

// 9. Config / input failures before the flow.
{
  const noToken = createWorld({ props: { ASC_MAIN_UI_URL: SITES_URL } });
  const r = noToken.context.confirmAndSync({ fragment: encodeFragment(envelopeWith(contractWith())), confirmation: confirmFor() });
  assert.equal(r.state, 'FAILED');
  assert.equal(r.error.code, 'GITHUB_TOKEN_MISSING');
  await settle();
  assert.equal(noToken.github.calls.length, 0);

  const w = createWorld({ props: fullProps });
  for (const fragment of [undefined, '', '#asc=', '#asc=not valid!', 'asc=abc']) {
    const bad = w.context.confirmAndSync({ fragment, confirmation: confirmFor() });
    assert.equal(bad.state, 'FAILED');
    assert.equal(bad.redirect, null);
  }
  const wrongVersion = w.context.confirmAndSync({ fragment: encodeFragment({ ...envelopeWith(contractWith()), envelope_version: '9' }), confirmation: confirmFor() });
  assert.equal(wrongVersion.error.code, 'INVALID_FRAGMENT');
  await settle();
  assert.equal(w.github.calls.length, 0);

  const unknown = w.context.getConfirmSyncResult('never-submitted');
  assert.equal(unknown.state, 'FAILED');
  assert.equal(unknown.error.code, 'SYNC_RESULT_UNAVAILABLE');
}

// 10. fetchImpl refuses any non-GitHub-API origin (token cannot be sent elsewhere).
{
  const w = createWorld({ props: fullProps });
  await assert.rejects(() => w.context.ascUrlFetchImpl_('https://evil.test/x', { method: 'GET', headers: { Authorization: 'Bearer x' } }));
  assert.equal(w.github.calls.length, 0);
}

// 11. Shims round-trip UTF-8 / Base64 like Node Buffer.
{
  const w = createWorld();
  const shims = w.context.ascRuntimeShims_();
  const text = 'Simpan — ujian ✓ 🚀';
  const b64 = shims.Buffer.from(text, 'utf8').toString('base64');
  assert.equal(b64, Buffer.from(text, 'utf8').toString('base64'));
  assert.equal(shims.Buffer.from(b64, 'base64').toString('utf8'), text);
  assert.equal(new shims.TextDecoder().decode(Uint8Array.from(Buffer.from(text))), text);
  assert.equal(shims.atob(Buffer.from('abc').toString('base64')), 'abc');
}

// 12. Stale-result regression: same requestId twice; first SUCCESS must never leak into the second attempt.
{
  const envelope = envelopeWith(contractWith(), 'TEST_ONLY_T008B_SAME_ID');
  const confirmation = confirmFor('TEST_ONLY_T008B_SAME_ID');

  // 12a. first attempt succeeds and caches SUCCESS; second attempt is forced to fail at read.
  const w = createWorld({ props: fullProps });
  const first = await run(w, envelope, confirmation);
  assert.equal(first.final.state, 'SYNCED');
  assert.equal(first.final.receipt.status, 'SUCCESS');
  w.github.getMode = 'error';
  const second = await run(w, envelope, confirmation);
  assert.equal(second.immediate.state, 'RESULT_PENDING');
  assert.equal(second.final.state, 'FAILED');
  assert.equal(second.final.redirect, null);
  assert.equal(second.final.receipt.status, 'FAILED');
  assert.equal(second.final.receipt.adapter_outcome, 'READ_ERROR');
  assert.notDeepStrictEqual(second.final, first.final);
  assert.equal(JSON.stringify(second.final).includes('"state":"SYNCED"'), false);

  // 12b. second attempt write fails AND its result cannot be cached → unknown FAILED, never the first SUCCESS.
  const w2 = createWorld({ props: fullProps });
  const ok = await run(w2, envelope, confirmation);
  assert.equal(ok.final.state, 'SYNCED');
  w2.github.getMode = 'error';
  w2.cacheFaults.put = true;
  const lost = await run(w2, envelope, confirmation);
  assert.equal(lost.final.state, 'FAILED');
  assert.equal(lost.final.error.code, 'SYNC_RESULT_UNAVAILABLE');
  assert.equal(lost.final.redirect, null);
  assert.equal(lost.final.writePerformed, null);

  // 12c. cache cannot be cleared → attempt is not started (no GitHub I/O, no HISTORY), never SUCCESS.
  const w3 = createWorld({ props: fullProps });
  await run(w3, envelope, confirmation);
  const callsBefore = w3.github.calls.length;
  const rowsBefore = w3.rows.length;
  w3.cacheFaults.remove = true;
  const blocked = w3.context.confirmAndSync({ fragment: encodeFragment(envelope), confirmation });
  await settle();
  assert.equal(blocked.state, 'FAILED');
  assert.equal(blocked.error.code, 'RESULT_CACHE_UNAVAILABLE');
  assert.equal(blocked.redirect, null);
  assert.equal(w3.github.calls.length, callsBefore);
  assert.equal(w3.rows.length, rowsBefore);

  // 12d. cache read failure → factual FAILED/unknown, does not throw, never redirects.
  w3.cacheFaults.get = true;
  let lookup;
  assert.doesNotThrow(() => { lookup = w3.context.getConfirmSyncResult('TEST_ONLY_T008B_SAME_ID'); });
  assert.equal(lookup.state, 'FAILED');
  assert.equal(lookup.error.code, 'SYNC_RESULT_UNREADABLE');
  assert.equal(lookup.redirect, null);
  assert.equal(lookup.writePerformed, null);
}

console.log('T-008B Apps Script binding test: PASS');
console.log('real network / GitHub / Sheets writes: none');
