import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { buildRuntime } from './build-runtime.mjs';

const read = (f) => fs.readFileSync(new URL('./' + f, import.meta.url), 'utf8');
const SHIMS = read('RuntimeShims.gs');
const RUNTIME = read('AscRuntime.gs');
const BINDING = read('DashboardCiRead.gs');

const repository = 'dzuddiyn/ZASS-Zero-to-Architecture-Structured-Sprint';
const commitSha = '7cdbd6818198f22245ebcaf107a3cc87611a3d72';
const runId = 37084823055;
const NOW = '2026-10-03T01:30:00.000Z';

assert.equal(RUNTIME, buildRuntime(), 'AscRuntime.gs is stale');
assert.match(RUNTIME, /ci\/zass-ci-status\.mjs/);
assert.doesNotMatch(BINDING, /\bZ(?:0\d{2}|10[01])\b/);
assert.doesNotMatch(BINDING, /\b(?:put|post|patch|delete)\b/i);
assert.doesNotMatch(BINDING, /SpreadsheetApp|PropertiesService|CacheService|appendRow|setValue|setValues/);

function response(status, data, rawText) {
  return {
    getResponseCode: () => status,
    getContentText: () => rawText === undefined ? JSON.stringify(data) : rawText
  };
}
function createWorld(sequence) {
  const calls = [];
  const queue = sequence.slice();
  class FakeDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [NOW]));
    }
    static now() { return new Date(NOW).getTime(); }
  }

  const context = {
    console,
    Uint8Array,
    Date: FakeDate,
    Utilities: {
      newBlob() { throw new Error('encoding shim should not be used by T-012B read'); },
      base64Decode() { throw new Error('base64 shim should not be used'); },
      base64Encode() { throw new Error('base64 shim should not be used'); },
      computeDigest() { throw new Error('digest shim should not be used'); },
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      Charset: { UTF_8: 'UTF_8' }
    },
    UrlFetchApp: {
      fetch(url, options) {
        calls.push({ url, options: structuredClone(options) });
        const next = queue.shift();
        if (next instanceof Error) throw next;
        if (!next) throw new Error('unexpected extra fetch');
        return next;
      }
    }
  };

  vm.createContext(context);
  vm.runInContext(SHIMS, context, { filename: 'RuntimeShims.gs' });
  vm.runInContext(RUNTIME, context, { filename: 'AscRuntime.gs' });
  vm.runInContext(BINDING, context, { filename: 'DashboardCiRead.gs' });
  return { context, calls };
}

function runs(status = 'completed', conclusion = 'success') {
  return response(200, {
    workflow_runs: [{
      id: runId,
      name: 'ZASS CI',
      head_sha: commitSha,
      status,
      conclusion,
      html_url: 'https://github.com/' + repository + '/actions/runs/' + runId,
      run_attempt: 1
    }]
  });
}
function jobs(status = 'completed', conclusion = 'success') {
  return response(200, {
    jobs: [{
      id: 111092795540,
      name: 'zass-check',
      status,
      conclusion,
      html_url: 'https://github.com/' + repository + '/actions/runs/' + runId + '/job/111092795540'
    }]
  });
}

{
  const w = createWorld([runs(), jobs()]);
  const result = w.context.getDashboardZassCiStatus(repository, commitSha);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(result)), {
    ok: true,
    repository,
    commit_sha: commitSha,
    workflow_name: 'ZASS CI',
    job_name: 'zass-check',
    run_id: runId,
    status: 'SUCCESS',
    conclusion: 'success',
    run_url: 'https://github.com/' + repository + '/actions/runs/' + runId,
    fetched_at: NOW
  });
  assert.equal(w.calls.length, 2);
  assert.deepStrictEqual(w.calls.map((c) => c.options.method), ['get', 'get']);
  assert.equal(w.calls.every((c) => c.options.payload === undefined), true);
  assert.equal(w.calls.every((c) => c.options.muteHttpExceptions === true), true);
  assert.equal(w.calls.every((c) => c.options.followRedirects === false), true);
  assert.equal(w.calls.every((c) => !('Authorization' in c.options.headers)), true);
  assert.equal(w.calls[0].url,
    'https://api.github.com/repos/dzuddiyn/ZASS-Zero-to-Architecture-Structured-Sprint/actions/runs?head_sha=' +
    commitSha + '&per_page=100');
  assert.equal(w.calls[1].url,
    'https://api.github.com/repos/dzuddiyn/ZASS-Zero-to-Architecture-Structured-Sprint/actions/runs/' +
    runId + '/jobs?filter=latest&per_page=100');
}
{
  const w = createWorld([runs('in_progress', null), jobs('in_progress', null)]);
  const result = w.context.getDashboardZassCiStatus(repository, commitSha);
  assert.equal(result.status, 'IN_PROGRESS');
  assert.equal(result.conclusion, null);
}

{
  const w = createWorld([response(200, { workflow_runs: [] })]);
  const result = w.context.getDashboardZassCiStatus(repository, commitSha);
  assert.equal(result.ok, true);
  assert.equal(result.status, 'NOT_FOUND');
  assert.equal(w.calls.length, 1);
}

{
  const w = createWorld([response(500, { message: 'server error' })]);
  const result = w.context.getDashboardZassCiStatus(repository, commitSha);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'READ_ERROR');
  assert.equal(result.error.code, 'GITHUB_READ_FAILED');
  assert.equal(result.error.http_status, 500);
}

{
  const w = createWorld([response(200, null, '{not-json')]);
  const result = w.context.getDashboardZassCiStatus(repository, commitSha);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'READ_ERROR');
  assert.equal(result.error.code, 'MALFORMED_JSON_RESPONSE');
}

{
  const w = createWorld([]);
  const result = w.context.getDashboardZassCiStatus(repository, 'short-sha');
  assert.equal(result.ok, false);
  assert.equal(result.status, 'READ_ERROR');
  assert.equal(result.error.code, 'INVALID_COMMIT_SHA');
  assert.equal(w.calls.length, 0);
}

console.log('T-012B Apps Script/dashboard CI read binding: PASS');
console.log('GitHub Actions transport: GET-only');
console.log('dashboard UI changes: none');
console.log('real network / persistence writes: none');
