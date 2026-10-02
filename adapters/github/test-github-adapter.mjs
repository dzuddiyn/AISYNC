import assert from 'node:assert/strict';
import * as adapter from './github-adapter.mjs';

const contract = {
  Project: 'AISYNC',
  'Source method': 'ZASSIMPLE',
  Operation: 'SAVE',
  'Record type': 'note',
  'Record ID': 'T006A-001',
  'Content/change': {
    status: 'LOCKED',
    text: 'Adapter mechanics proof'
  },
  Lineage: ['D-002', 'D-014'],
  Destination: ['GitHub']
};

const invocation = {
  destination: 'GitHub',
  adapterId: 'github',
  contract
};

const writeSpec = {
  repository: 'dzuddiyn/AISYNC',
  path: 'proofs/t006-github-adapter.md',
  branch: 'main',
  content: '# T-006A\nproposed content\n',
  commitMessage: 'test T-006A adapter write'
};

function makeClient(readResults, writeResult, calls, mutateInputs = false) {
  return {
    readFile(input) {
      calls.push({ method: 'read', input });
      if (mutateInputs) {
        input.path = 'mutated-by-client';
      }
      return readResults.shift();
    },
    writeFile(input) {
      calls.push({ method: 'write', input });
      if (mutateInputs) {
        input.content = 'mutated-by-client';
        input.sha = 'mutated-by-client';
      }
      return writeResult;
    }
  };
}

assert.equal(adapter.validateGitHubInvocation(invocation).valid, true);
assert.equal(adapter.validateGitHubInvocation({ ...invocation, adapterId: 'other' }).valid, false);
assert.equal(adapter.validateGitHubInvocation({ ...invocation, destination: 'ASC_DB' }).valid, false);
assert.equal(adapter.validateGitHubWriteSpec(writeSpec).valid, true);
assert.equal(adapter.validateGitHubWriteSpec({ ...writeSpec, token: 'must-not-be-here' }).valid, false);

const createCalls = [];
const createResult = await adapter.runGitHubAdapter(
  invocation,
  writeSpec,
  makeClient([
    { ok: true, found: false, sha: null, content: null },
    { ok: true, found: true, sha: 'persisted-file-sha', contentSha: 'persisted-content-sha', content: writeSpec.content }
  ], {
    ok: true,
    commitSha: 'create-commit-sha',
    contentSha: 'created-content-sha'
  }, createCalls)
);
assert.equal(createResult.outcome, 'VERIFIED_WRITE');
assert.equal(createResult.writePerformed, true);
assert.equal(createResult.verified, true);
assert.equal(createResult.commitSha, 'create-commit-sha');
assert.equal(createResult.contentSha, 'persisted-file-sha');
assert.equal(createResult.persistedSha, 'persisted-file-sha');
assert.deepStrictEqual(createCalls.map(call => call.method), ['read', 'write', 'read']);
assert.equal(Object.prototype.hasOwnProperty.call(createCalls[1].input, 'sha'), false);

const updateCalls = [];
const updateResult = await adapter.runGitHubAdapter(
  invocation,
  writeSpec,
  makeClient([
    { ok: true, found: true, sha: 'current-file-sha', content: 'old content\n' },
    { ok: true, found: true, sha: 'updated-file-sha', contentSha: 'updated-persisted-content-sha', content: writeSpec.content }
  ], {
    ok: true,
    commitSha: 'update-commit-sha',
    contentSha: 'updated-content-sha'
  }, updateCalls)
);
assert.equal(updateResult.outcome, 'VERIFIED_WRITE');
assert.equal(updateCalls[1].input.sha, 'current-file-sha');
assert.deepStrictEqual(updateCalls.map(call => call.method), ['read', 'write', 'read']);

const noChangeCalls = [];
const noChangeResult = await adapter.runGitHubAdapter(
  invocation,
  writeSpec,
  makeClient([
    { ok: true, found: true, sha: 'existing-file-sha', contentSha: 'existing-content-sha', content: writeSpec.content }
  ], {
    ok: true,
    commitSha: 'must-not-be-used',
    contentSha: 'must-not-be-used'
  }, noChangeCalls)
);
assert.equal(noChangeResult.outcome, 'NO_CHANGE');
assert.equal(noChangeResult.writePerformed, false);
assert.equal(noChangeResult.commitSha, null);
assert.equal(noChangeResult.existingSha, 'existing-file-sha');
assert.equal(noChangeResult.contentSha, 'existing-file-sha');
assert.equal(noChangeResult.verified, true);
assert.deepStrictEqual(noChangeCalls.map(call => call.method), ['read']);

const readErrorCalls = [];
const readErrorResult = await adapter.runGitHubAdapter(
  invocation,
  writeSpec,
  makeClient([
    { ok: false, error: { code: 'RATE_LIMIT', message: 'read unavailable' } }
  ], { ok: true, commitSha: 'unused' }, readErrorCalls)
);
assert.equal(readErrorResult.outcome, 'READ_ERROR');
assert.deepStrictEqual(readErrorCalls.map(call => call.method), ['read']);

const writeErrorCalls = [];
const writeErrorResult = await adapter.runGitHubAdapter(
  invocation,
  writeSpec,
  makeClient([
    { ok: true, found: false, sha: null, content: null }
  ], { ok: false, error: { code: 'WRITE_FAILED', message: 'write rejected' } }, writeErrorCalls)
);
assert.equal(writeErrorResult.outcome, 'WRITE_ERROR');
assert.deepStrictEqual(writeErrorCalls.map(call => call.method), ['read', 'write']);

const verifyReadErrorCalls = [];
const verifyReadErrorResult = await adapter.runGitHubAdapter(
  invocation,
  writeSpec,
  makeClient([
    { ok: true, found: false, sha: null, content: null },
    { ok: false, error: { code: 'VERIFY_READ_FAILED', message: 'verification unavailable' } }
  ], { ok: true, commitSha: 'unverified-commit-sha', contentSha: 'unverified-content-sha' }, verifyReadErrorCalls)
);
assert.equal(verifyReadErrorResult.outcome, 'WRITE_UNVERIFIED');
assert.equal(verifyReadErrorResult.writePerformed, true);
assert.equal(verifyReadErrorResult.commitSha, 'unverified-commit-sha');
assert.equal(verifyReadErrorResult.verified, false);
assert.deepStrictEqual(verifyReadErrorCalls.map(call => call.method), ['read', 'write', 'read']);

const mismatchCalls = [];
const mismatchResult = await adapter.runGitHubAdapter(
  invocation,
  writeSpec,
  makeClient([
    { ok: true, found: true, sha: 'old-file-sha', content: 'old content\n' },
    { ok: true, found: true, sha: 'persisted-mismatch-sha', content: 'different persisted content\n' }
  ], { ok: true, commitSha: 'mismatch-commit-sha', contentSha: 'mismatch-content-sha' }, mismatchCalls)
);
assert.equal(mismatchResult.outcome, 'WRITE_UNVERIFIED');
assert.equal(mismatchResult.writePerformed, true);
assert.equal(mismatchResult.commitSha, 'mismatch-commit-sha');
assert.equal(mismatchResult.verified, false);
assert.equal(mismatchResult.persistedSha, 'persisted-mismatch-sha');

const missingCurrentShaCalls = [];
const missingCurrentSha = await adapter.runGitHubAdapter(
  invocation,
  writeSpec,
  makeClient([
    { ok: true, found: true, sha: '', content: 'old content\n' }
  ], { ok: true, commitSha: 'must-not-write' }, missingCurrentShaCalls)
);
assert.equal(missingCurrentSha.outcome, 'READ_ERROR');
assert.deepStrictEqual(missingCurrentShaCalls.map(call => call.method), ['read']);

const malformedReadCalls = [];
const malformedRead = await adapter.runGitHubAdapter(
  invocation,
  writeSpec,
  makeClient([
    { ok: true, found: true, sha: 'current-sha' }
  ], { ok: true, commitSha: 'must-not-write' }, malformedReadCalls)
);
assert.equal(malformedRead.outcome, 'READ_ERROR');
assert.deepStrictEqual(malformedReadCalls.map(call => call.method), ['read']);

const missingCommitCalls = [];
const missingCommit = await adapter.runGitHubAdapter(
  invocation,
  writeSpec,
  makeClient([
    { ok: true, found: false, sha: null, content: null },
    { ok: true, found: true, sha: 'missing-commit-persisted-sha', content: writeSpec.content }
  ], { ok: true, contentSha: 'not-a-commit' }, missingCommitCalls)
);
assert.equal(missingCommit.outcome, 'WRITE_UNVERIFIED');
assert.equal(missingCommit.commitSha, null);
assert.equal(missingCommit.verified, false);

const verificationFoundFalse = await adapter.runGitHubAdapter(
  invocation,
  writeSpec,
  makeClient([
    { ok: true, found: false, sha: null, content: null },
    { ok: true, found: false, sha: null, content: null }
  ], { ok: true, commitSha: 'found-false-commit' }, [])
);
assert.equal(verificationFoundFalse.outcome, 'WRITE_UNVERIFIED');
assert.equal(verificationFoundFalse.commitSha, 'found-false-commit');

const verificationMalformed = await adapter.runGitHubAdapter(
  invocation,
  writeSpec,
  makeClient([
    { ok: true, found: false, sha: null, content: null },
    { ok: true, found: true, sha: '', content: writeSpec.content }
  ], { ok: true, commitSha: 'malformed-verify-commit' }, [])
);
assert.equal(verificationMalformed.outcome, 'WRITE_UNVERIFIED');
assert.equal(verificationMalformed.commitSha, 'malformed-verify-commit');

let thrownReadCalls = [];
const thrownRead = await adapter.runGitHubAdapter(invocation, writeSpec, {
  readFile() {
    thrownReadCalls.push('read');
    throw new Error('read exploded');
  },
  writeFile() {
    thrownReadCalls.push('write');
    return { ok: true, commitSha: 'must-not-write' };
  }
});
assert.equal(thrownRead.outcome, 'READ_ERROR');
assert.deepStrictEqual(thrownReadCalls, ['read']);

const rejectedReadCalls = [];
const rejectedRead = await adapter.runGitHubAdapter(invocation, writeSpec, {
  async readFile() {
    rejectedReadCalls.push('read');
    throw new Error('read rejected');
  },
  writeFile() {
    rejectedReadCalls.push('write');
    return { ok: true, commitSha: 'must-not-write' };
  }
});
assert.equal(rejectedRead.outcome, 'READ_ERROR');
assert.deepStrictEqual(rejectedReadCalls, ['read']);

const thrownWriteCalls = [];
const thrownWrite = await adapter.runGitHubAdapter(invocation, writeSpec, {
  readFile() {
    thrownWriteCalls.push('read');
    return { ok: true, found: false, sha: null, content: null };
  },
  writeFile() {
    thrownWriteCalls.push('write');
    throw new Error('write exploded');
  }
});
assert.equal(thrownWrite.outcome, 'WRITE_ERROR');
assert.deepStrictEqual(thrownWriteCalls, ['read', 'write']);

const rejectedWriteCalls = [];
const rejectedWrite = await adapter.runGitHubAdapter(invocation, writeSpec, {
  readFile() {
    rejectedWriteCalls.push('read');
    return { ok: true, found: false, sha: null, content: null };
  },
  async writeFile() {
    rejectedWriteCalls.push('write');
    throw new Error('write rejected');
  }
});
assert.equal(rejectedWrite.outcome, 'WRITE_ERROR');
assert.deepStrictEqual(rejectedWriteCalls, ['read', 'write']);

const rejectedVerificationCalls = [];
const rejectedVerification = await adapter.runGitHubAdapter(invocation, writeSpec, {
  readFile() {
    rejectedVerificationCalls.push('read');
    if (rejectedVerificationCalls.length === 1) {
      return { ok: true, found: false, sha: null, content: null };
    }
    return Promise.reject(new Error('verification rejected'));
  },
  writeFile() {
    rejectedVerificationCalls.push('write');
    return { ok: true, commitSha: 'rejected-verification-commit' };
  }
});
assert.equal(rejectedVerification.outcome, 'WRITE_UNVERIFIED');
assert.equal(rejectedVerification.commitSha, 'rejected-verification-commit');
assert.deepStrictEqual(rejectedVerificationCalls, ['read', 'write', 'read']);

const originalInvocation = structuredClone(invocation);
const originalWriteSpec = structuredClone(writeSpec);
const mutationCalls = [];
const mutationResult = await adapter.runGitHubAdapter(
  invocation,
  writeSpec,
  makeClient([
    { ok: true, found: false, sha: null, content: null },
    { ok: true, found: true, sha: 'mutation-persisted-sha', contentSha: 'mutation-persisted-content-sha', content: writeSpec.content }
  ], { ok: true, commitSha: 'mutation-commit-sha', contentSha: 'mutation-content-sha' }, mutationCalls, true)
);
assert.equal(mutationResult.outcome, 'VERIFIED_WRITE');
assert.deepStrictEqual(invocation, originalInvocation);
assert.deepStrictEqual(writeSpec, originalWriteSpec);

const githubInvocation = adapter.cloneForTest
  ? adapter.cloneForTest(invocation)
  : structuredClone(invocation);
const isolatedFirst = await adapter.runGitHubAdapter(
  githubInvocation,
  writeSpec,
  makeClient([
    { ok: true, found: false, sha: null, content: null },
    { ok: true, found: true, sha: 'isolated-sha', contentSha: 'isolated-content-sha', content: writeSpec.content }
  ], { ok: true, commitSha: 'isolated-commit', contentSha: 'isolated-content' }, [])
);
assert.equal(isolatedFirst.outcome, 'VERIFIED_WRITE');

let networkCalls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = function () {
  networkCalls += 1;
};
await adapter.runGitHubAdapter(invocation, writeSpec, makeClient([
  { ok: true, found: true, sha: 'network-test-sha', contentSha: 'network-test-content-sha', content: writeSpec.content }
], { ok: true }, []));
globalThis.fetch = originalFetch;
assert.equal(networkCalls, 0);

assert.equal(typeof adapter.fetch, 'undefined');
assert.equal(typeof adapter.writeToGitHub, 'undefined');
assert.equal(typeof adapter.createReceipt, 'undefined');
assert.equal(typeof adapter.historyWrite, 'undefined');

console.log('T-006A GitHub adapter local/mock proof: PASS');
console.log('create/update/no-change/error/verification flows: PASS');
console.log('mock call order: read -> write -> read where write occurs');
console.log('network/PAT/final receipt: none');
