import assert from 'node:assert/strict';
import { createGitHubRestClient } from './github-rest-client.mjs';

const token = 'test-token-never-returned';
const repository = 'dzuddiyn/AISYNC';
const readInput = {
  repository,
  path: 'proofs/nested/t006b special+file.md',
  branch: 'release/v1'
};
const content = '# T-006B\nHujan turun — UTF-8 ✓\n';
const contentBase64 = Buffer.from(content, 'utf8').toString('base64');

function response(status, data) {
  return {
    status,
    async json() {
      return data;
    }
  };
}

function assertNoSecret(value) {
  assert.equal(JSON.stringify(value).includes(token), false);
}

const readCalls = [];
const readClient = createGitHubRestClient({
  token,
  fetchImpl: async (url, options) => {
    readCalls.push({ url, options });
    return response(200, {
      type: 'file',
      sha: 'read-content-sha',
      content: contentBase64.match(/.{1,8}/g).join('\n')
    });
  }
});
assert.deepStrictEqual(Object.keys(readClient).sort(), ['readFile', 'writeFile']);
const existing = await readClient.readFile(readInput);
assert.deepStrictEqual(existing, {
  ok: true,
  found: true,
  sha: 'read-content-sha',
  content
});
assert.equal(
  readCalls[0].url,
  'https://api.github.com/repos/dzuddiyn/AISYNC/contents/proofs/nested/t006b%20special%2Bfile.md?ref=release%2Fv1'
);
assert.equal(readCalls[0].options.headers.Authorization, 'Bearer ' + token);
assert.equal(readCalls[0].options.headers.Accept, 'application/vnd.github+json');
assert.equal(readCalls[0].options.headers['X-GitHub-Api-Version'], '2022-11-28');
assert.equal(readCalls[0].options.method, 'GET');
assertNoSecret(existing);

const missingClient = createGitHubRestClient({
  token,
  fetchImpl: async () => response(404, { message: 'Not Found' })
});
assert.deepStrictEqual(await missingClient.readFile(readInput), {
  ok: true,
  found: false,
  sha: null,
  content: null
});

for (const status of [401, 403, 500]) {
  const errorResult = await createGitHubRestClient({
    token,
    fetchImpl: async () => response(status, { message: 'secret should not escape' })
  }).readFile(readInput);
  assert.equal(errorResult.ok, false);
  assert.equal(errorResult.error.status, status);
  assertNoSecret(errorResult);
}

for (const malformed of [
  { type: 'file', content: contentBase64 },
  { type: 'directory', sha: 'directory-sha', content: contentBase64 },
  { type: 'file', sha: 'file-sha', content: '%%%not-base64%%%' }
]) {
  const malformedResult = await createGitHubRestClient({
    token,
    fetchImpl: async () => response(200, malformed)
  }).readFile(readInput);
  assert.equal(malformedResult.ok, false);
  assert.equal(malformedResult.error.code.startsWith('MALFORMED_'), true);
  assertNoSecret(malformedResult);
}

const malformedJson = await createGitHubRestClient({
  token,
  fetchImpl: async () => ({
    status: 200,
    async json() {
      throw new Error('malformed JSON body');
    }
  })
}).readFile(readInput);
assert.equal(malformedJson.ok, false);
assert.equal(malformedJson.error.code, 'MALFORMED_READ_RESPONSE');
assertNoSecret(malformedJson);

const createCalls = [];
const createClient = createGitHubRestClient({
  token,
  fetchImpl: async (url, options) => {
    createCalls.push({ url, options });
    return response(201, {
      commit: { sha: 'created-commit-sha' },
      content: { sha: 'created-content-sha' }
    });
  }
});
const createResult = await createClient.writeFile({
  ...readInput,
  branch: 'main',
  content,
  commitMessage: 'add T-006B proof'
});
assert.deepStrictEqual(createResult, {
  ok: true,
  commitSha: 'created-commit-sha',
  contentSha: 'created-content-sha'
});
const createBody = JSON.parse(createCalls[0].options.body);
assert.deepStrictEqual(createBody, {
  message: 'add T-006B proof',
  content: contentBase64,
  branch: 'main'
});
assert.equal(Object.prototype.hasOwnProperty.call(createBody, 'sha'), false);
assert.equal(createCalls[0].options.method, 'PUT');
assertNoSecret(createResult);

const emptyContentCalls = [];
const emptyContentClient = createGitHubRestClient({
  token,
  fetchImpl: async (url, options) => {
    emptyContentCalls.push({ url, options });
    return response(201, {
      commit: { sha: 'empty-content-commit' },
      content: { sha: 'empty-content-sha' }
    });
  }
});
const emptyContentResult = await emptyContentClient.writeFile({
  ...readInput,
  content: '',
  commitMessage: 'write empty content'
});
assert.equal(emptyContentResult.ok, true);
assert.equal(JSON.parse(emptyContentCalls[0].options.body).content, '');

const updateCalls = [];
const updateClient = createGitHubRestClient({
  token,
  fetchImpl: async (url, options) => {
    updateCalls.push({ url, options });
    return response(200, {
      commit: { sha: 'updated-commit-sha' },
      content: { sha: 'updated-content-sha' }
    });
  }
});
await updateClient.writeFile({
  ...readInput,
  branch: 'main',
  content,
  commitMessage: 'update T-006B proof',
  sha: 'current-file-sha'
});
assert.equal(JSON.parse(updateCalls[0].options.body).sha, 'current-file-sha');

const writeError = await createGitHubRestClient({
  token,
  fetchImpl: async () => response(409, { message: 'conflict' })
}).writeFile({ ...readInput, content, commitMessage: 'write' });
assert.equal(writeError.ok, false);
assert.equal(writeError.error.code, 'GITHUB_WRITE_CONFLICT');
assert.equal(writeError.error.status, 409);
assert.equal(writeError.error.outcomeKnown, true);
assertNoSecret(writeError);

const malformedWrite = await createGitHubRestClient({
  token,
  fetchImpl: async () => response(200, { commit: {}, content: { sha: 'content-sha' } })
}).writeFile({ ...readInput, content, commitMessage: 'write' });
assert.equal(malformedWrite.ok, false);
assert.equal(malformedWrite.error.code, 'MALFORMED_WRITE_RESPONSE');
assert.equal(malformedWrite.error.outcomeKnown, false);
assertNoSecret(malformedWrite);

for (const method of ['readFile', 'writeFile']) {
  const rejected = await createGitHubRestClient({
    token,
    fetchImpl: async () => Promise.reject(new Error('token=' + token))
  })[method](method === 'readFile'
    ? readInput
    : { ...readInput, content, commitMessage: 'write' });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.error.code, 'GITHUB_FETCH_ERROR');
  if (method === 'writeFile') {
    assert.equal(rejected.error.outcomeKnown, false);
  } else {
    assert.equal(Object.prototype.hasOwnProperty.call(rejected.error, 'outcomeKnown'), false);
  }
  assertNoSecret(rejected);
}

const missingTokenCalls = [];
const missingToken = createGitHubRestClient({
  token: '',
  fetchImpl: async () => {
    missingTokenCalls.push('fetch');
    return response(200, {});
  }
});
const missingTokenResult = await missingToken.readFile(readInput);
assert.equal(missingTokenResult.error.code, 'MISSING_TOKEN');
assert.deepStrictEqual(missingTokenCalls, []);
assertNoSecret(missingTokenResult);

const invalidInput = await createGitHubRestClient({ token }).writeFile({
  repository: 'invalid repository form',
  path: '',
  branch: '',
  content: 42,
  commitMessage: ''
});
assert.equal(invalidInput.error.code, 'INVALID_REPOSITORY');
assertNoSecret(invalidInput);

console.log('T-006B GitHub REST client fake-fetch test: PASS');
console.log('read/create/update/error/secret-boundary flows: PASS');
console.log('real network requests: none');
