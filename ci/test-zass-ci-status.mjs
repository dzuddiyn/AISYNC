import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createZassCiStatusConsumer,
  ZASS_CI_IDENTITY
} from './zass-ci-status.mjs';

const repository = 'dzuddiyn/ZASS-Zero-to-Architecture-Structured-Sprint';
const commitSha = '7cdbd6818198f22245ebcaf107a3cc87611a3d72';
const fetchedAt = '2026-10-03T01:00:00.000Z';

function response(status, data) {
  return {
    status,
    async json() {
      return data;
    }
  };
}

function makeFetch(responses, calls) {
  return async function (url, options) {
    calls.push({ url, options });
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return next;
  };
}

function runData({
  id = 37084823055,
  status = 'completed',
  conclusion = 'success'
} = {}) {
  return {
    id,
    name: 'ZASS CI',
    head_sha: commitSha,
    status,
    conclusion,
    html_url: 'https://github.com/' + repository + '/actions/runs/' + id,
    run_attempt: 1
  };
}

function jobData({
  status = 'completed',
  conclusion = 'success'
} = {}) {
  return {
    id: 111092795540,
    name: 'zass-check',
    status,
    conclusion,
    html_url: 'https://github.com/' + repository + '/actions/jobs/111092795540'
  };
}

async function readWith(responses, calls = []) {
  const consumer = createZassCiStatusConsumer({
    fetchImpl: makeFetch(responses.slice(), calls),
    now: () => fetchedAt
  });
  const result = await consumer.readStatus({ repository, commitSha });
  return { result, calls };
}

assert.deepStrictEqual(ZASS_CI_IDENTITY, {
  workflow_name: 'ZASS CI',
  job_name: 'zass-check'
});

const success = await readWith([
  response(200, { workflow_runs: [runData()] }),
  response(200, { jobs: [jobData()] })
]);
assert.deepStrictEqual(success.result, {
  ok: true,
  repository,
  commit_sha: commitSha,
  workflow_name: 'ZASS CI',
  job_name: 'zass-check',
  run_id: 37084823055,
  status: 'SUCCESS',
  conclusion: 'success',
  run_url: 'https://github.com/' + repository + '/actions/runs/37084823055',
  fetched_at: fetchedAt
});
assert.deepStrictEqual(success.calls.map(call => call.options.method), ['GET', 'GET']);
assert.equal(success.calls.every(call => call.options.body === undefined), true);
assert.equal(
  success.calls[0].url,
  'https://api.github.com/repos/dzuddiyn/ZASS-Zero-to-Architecture-Structured-Sprint/actions/runs?head_sha=' +
    commitSha + '&per_page=100'
);
assert.equal(
  success.calls[1].url,
  'https://api.github.com/repos/dzuddiyn/ZASS-Zero-to-Architecture-Structured-Sprint/actions/runs/37084823055/jobs?filter=latest&per_page=100'
);

const failed = await readWith([
  response(200, { workflow_runs: [runData({ conclusion: 'failure' })] }),
  response(200, { jobs: [jobData({ conclusion: 'failure' })] })
]);
assert.equal(failed.result.status, 'FAILURE');
assert.equal(failed.result.conclusion, 'failure');
assert.equal(failed.result.ok, true);

const inProgress = await readWith([
  response(200, { workflow_runs: [runData({ status: 'in_progress', conclusion: null })] }),
  response(200, { jobs: [jobData({ status: 'in_progress', conclusion: null })] })
]);
assert.equal(inProgress.result.status, 'IN_PROGRESS');
assert.equal(inProgress.result.conclusion, null);

const queued = await readWith([
  response(200, { workflow_runs: [runData({ status: 'queued', conclusion: null })] }),
  response(200, { jobs: [jobData({ status: 'queued', conclusion: null })] })
]);
assert.equal(queued.result.status, 'QUEUED');
assert.equal(queued.result.conclusion, null);

const noRunCalls = [];
const noRun = await readWith([
  response(200, { workflow_runs: [] })
], noRunCalls);
assert.equal(noRun.result.status, 'NOT_FOUND');
assert.equal(noRun.result.ok, true);
assert.equal(noRunCalls.length, 1);

const noJob = await readWith([
  response(200, { workflow_runs: [runData()] }),
  response(200, { jobs: [{ name: 'unrelated-job', status: 'completed', conclusion: 'success' }] })
]);
assert.equal(noJob.result.status, 'NOT_FOUND');
assert.equal(noJob.result.ok, true);

const httpError = await readWith([
  response(500, { message: 'server error' })
]);
assert.equal(httpError.result.ok, false);
assert.equal(httpError.result.status, 'READ_ERROR');
assert.equal(httpError.result.error.code, 'GITHUB_READ_FAILED');
assert.equal(httpError.result.error.http_status, 500);

const malformedJson = await readWith([{
  status: 200,
  async json() {
    throw new Error('bad json');
  }
}]);
assert.equal(malformedJson.result.status, 'READ_ERROR');
assert.equal(malformedJson.result.error.code, 'MALFORMED_JSON_RESPONSE');

const malformedRuns = await readWith([
  response(200, { workflow_runs: 'not-an-array' })
]);
assert.equal(malformedRuns.result.status, 'READ_ERROR');
assert.equal(malformedRuns.result.error.code, 'MALFORMED_RUNS_RESPONSE');

const malformedJobs = await readWith([
  response(200, { workflow_runs: [runData()] }),
  response(200, { jobs: 'not-an-array' })
]);
assert.equal(malformedJobs.result.status, 'READ_ERROR');
assert.equal(malformedJobs.result.error.code, 'MALFORMED_JOBS_RESPONSE');

const fetchRejected = await readWith([
  new Error('network failed')
]);
assert.equal(fetchRejected.result.status, 'READ_ERROR');
assert.equal(fetchRejected.result.error.code, 'GITHUB_FETCH_ERROR');

const unsupportedState = await readWith([
  response(200, { workflow_runs: [runData()] }),
  response(200, { jobs: [jobData({ status: 'mystery', conclusion: null })] })
]);
assert.equal(unsupportedState.result.status, 'READ_ERROR');
assert.equal(unsupportedState.result.error.code, 'UNSUPPORTED_JOB_STATE');

const input = { repository, commitSha };
const inputBefore = structuredClone(input);
const mutationCalls = [];
const mutationConsumer = createZassCiStatusConsumer({
  fetchImpl: makeFetch([
    response(200, { workflow_runs: [] })
  ], mutationCalls),
  now: () => fetchedAt
});
await mutationConsumer.readStatus(input);
assert.deepStrictEqual(input, inputBefore);
assert.deepStrictEqual(mutationCalls.map(call => call.options.method), ['GET']);
assert.equal(mutationCalls.every(call => call.options.body === undefined), true);

const source = await readFile(new URL('./zass-ci-status.mjs', import.meta.url), 'utf8');
assert.doesNotMatch(source, /\bZ(?:0\d{2}|10[01])\b/);
assert.doesNotMatch(source, /\b(?:POST|PUT|PATCH|DELETE)\b/);
assert.equal(source.includes('zass check'), false);
assert.equal(source.includes('validateProject'), false);

const token = 'test-token-must-not-leak';
const tokenCalls = [];
const tokenConsumer = createZassCiStatusConsumer({
  token,
  fetchImpl: makeFetch([
    response(403, { message: 'forbidden' })
  ], tokenCalls),
  now: () => fetchedAt
});
const tokenResult = await tokenConsumer.readStatus({ repository, commitSha });
assert.equal(JSON.stringify(tokenResult).includes(token), false);
assert.equal(tokenCalls[0].options.headers.Authorization, 'Bearer ' + token);

console.log('T-012A read-only ZASS CI status consumer: PASS');
console.log('success/failure/pending/not-found/read-error states: PASS');
console.log('mutation/write calls: none');
console.log('ZASS rule-code logic in consumer: none');
