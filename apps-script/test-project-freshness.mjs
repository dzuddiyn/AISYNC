import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { buildRuntime } from './build-runtime.mjs';

const read = (f) => fs.readFileSync(new URL('./' + f, import.meta.url), 'utf8');
const SHIMS = read('RuntimeShims.gs');
const RUNTIME = read('AscRuntime.gs');
const GITHUB_READ = read('DashboardCiRead.gs');
const FRESHNESS = read('ProjectFreshness.gs');

const repository = 'dzuddiyn/AISYNC';
const canonical = '889bf7d66643e779d59d340a691bf07b0d8e8f06';
const stale = '97cdd389a5f2173f917ffdb46a6d6ab90b7bc3c4';
const NOW = '2026-10-03T04:30:00.000Z';
const FAKE_TOKEN = 'test-only-github-token';

assert.equal(RUNTIME, buildRuntime(), 'AscRuntime.gs is stale');
assert.match(RUNTIME, /continuity\/github-source-head\.mjs/);

function response(status, data, rawText) {
  return {
    getResponseCode: () => status,
    getContentText: () => rawText === undefined ? JSON.stringify(data) : rawText
  };
}

function world(sequence) {
  const queue = sequence.slice();
  const calls = [];
  class FakeDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [NOW]));
    }
    static now() { return new Date(NOW).getTime(); }
  }
  const context = {
    console,
    ascScriptProperty_(name) {
      return name === 'GITHUB_TOKEN' ? FAKE_TOKEN : null;
    },
    Uint8Array,
    Date: FakeDate,
    Utilities: {
      newBlob() { throw new Error('encoding not expected'); },
      base64Decode() { throw new Error('base64 not expected'); },
      base64Encode() { throw new Error('base64 not expected'); },
      computeDigest() { throw new Error('digest not expected'); },
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      Charset: { UTF_8: 'UTF_8' }
    },
    UrlFetchApp: {
      fetch(url, options) {
        calls.push({ url, options: structuredClone(options) });
        const next = queue.shift();
        if (!next) throw new Error('unexpected extra fetch');
        if (next instanceof Error) throw next;
        return next;
      }
    }
  };
  vm.createContext(context);
  vm.runInContext(SHIMS, context, { filename: 'RuntimeShims.gs' });
  vm.runInContext(RUNTIME, context, { filename: 'AscRuntime.gs' });
  vm.runInContext(GITHUB_READ, context, { filename: 'DashboardCiRead.gs' });
  vm.runInContext(FRESHNESS, context, { filename: 'ProjectFreshness.gs' });
  return { context, calls };
}

function project(indexedCommit = canonical, sourceRef = 'main') {
  return {
    project_id: 'AISYNC',
    github_repo: repository,
    index_metadata: {
      source_ref: sourceRef,
      source_commit: indexedCommit
    }
  };
}

{
  const w = world([
    response(200, { default_branch: 'main' }),
    response(200, { sha: canonical }),
    response(200, { default_branch: 'main' }),
    response(200, { sha: canonical })
  ]);
  const p = project();
  const result = w.context.ascProjectIndexFreshness_(p);
  assert.equal(result.status, 'CURRENT');
  assert.equal(result.reason, 'EXACT_COMMIT_MATCH');
  assert.equal(result.canonical.ref, 'main');
  assert.equal(result.canonical.commit_sha, canonical);
  assert.deepStrictEqual(w.calls.map(x => x.options.method), ['get', 'get']);
  assert.equal(w.calls.every(x => x.options.payload === undefined), true);
  assert.equal(w.calls.every(x => x.options.followRedirects === false), true);
  assert.equal(w.calls.every(x => x.options.headers.Authorization === 'Bearer ' + FAKE_TOKEN), true);
  assert.equal(w.calls[0].url, 'https://api.github.com/repos/dzuddiyn/AISYNC');
  assert.equal(w.calls[1].url, 'https://api.github.com/repos/dzuddiyn/AISYNC/commits/main');

  const attached = w.context.ascAttachProjectIndexFreshness_(p);
  assert.equal(attached.index_metadata.freshness, 'CURRENT');
  assert.equal(attached.index_metadata.freshness_evidence.status, 'CURRENT');
}

{
  const w = world([
    response(200, { default_branch: 'main' }),
    response(200, { sha: canonical })
  ]);
  const result = w.context.ascProjectIndexFreshness_(project(stale));
  assert.equal(result.status, 'STALE');
  assert.equal(result.reason, 'CANONICAL_HEAD_DIFFERS_FROM_INDEXED_COMMIT');
  assert.equal(result.indexed_commit, stale);
}

{
  const w = world([
    response(200, { default_branch: 'main' }),
    response(200, { sha: canonical })
  ]);
  const result = w.context.ascProjectIndexFreshness_(project(canonical, 'release'));
  assert.equal(result.status, 'SOURCE_MISMATCH');
  assert.equal(result.reason, 'INDEX_POINTS_TO_DIFFERENT_SOURCE');
}

{
  const w = world([]);
  w.context.ascScriptProperty_ = () => null;
  const result = w.context.ascProjectIndexFreshness_(project());
  assert.equal(result.status, 'UNVERIFIED');
  assert.equal(result.reason, 'CANONICAL_HEAD_READ_FAILED');
  assert.equal(result.canonical.error.code, 'GITHUB_TOKEN_MISSING');
  assert.equal(w.calls.length, 0);
}

{
  const w = world([response(503, { message: 'unavailable' })]);
  const result = w.context.ascProjectIndexFreshness_(project());
  assert.equal(result.status, 'UNVERIFIED');
  assert.equal(result.reason, 'CANONICAL_HEAD_READ_FAILED');
  assert.equal(result.canonical.ok, false);
  assert.equal(result.canonical.error.code, 'GITHUB_READ_FAILED');
}

assert.doesNotMatch(FRESHNESS, /SpreadsheetApp|setValue|setValues|appendRow|deleteRow/);
assert.doesNotMatch(FRESHNESS, /progress_percent|lifecycle_stage|ZASSPILL|ZASSELECTION|ZASSIMPLE/);
assert.doesNotMatch(FRESHNESS, /console\.log|Logger\.log/);

console.log('T-015 factual project-index freshness Apps Script binding: PASS');
console.log('canonical default-branch head -> exact repo/ref/commit comparison: PASS');
console.log('Sheets mutation / semantic inference: none');
