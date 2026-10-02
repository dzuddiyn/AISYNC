import assert from 'node:assert/strict';
import {
  HISTORY_FIELDS,
  createHistoryEntry,
  createWriteReceipt,
  persistHistory
} from './write-receipt.mjs';

const baseInput = {
  requestId: 'req-t007-001',
  projectId: 'AISYNC',
  operation: 'SAVE',
  sourceCommit: '95e019604e6edd778acd0ee252c506d2729f2d09',
  timestamp: '2026-10-03T12:00:00+08:00'
};

const verifiedAdapterResult = {
  outcome: 'VERIFIED_WRITE',
  adapterId: 'github',
  destination: 'GitHub',
  repository: 'dzuddiyn/AISYNC',
  path: 'proofs/t006b-github-adapter-live.md',
  branch: 'main',
  writePerformed: true,
  commitSha: '95e019604e6edd778acd0ee252c506d2729f2d09',
  contentSha: '3be4eed97840c9414207f1cb4f33e7f5021847bf',
  persistedSha: '3be4eed97840c9414207f1cb4f33e7f5021847bf',
  verified: true
};

const success = createWriteReceipt({
  ...baseInput,
  adapterResult: verifiedAdapterResult
});
assert.equal(success.ok, true);
assert.equal(success.receipt.status, 'SUCCESS');
assert.equal(success.receipt.destination, 'GitHub');
assert.equal(success.receipt.affected_resource, 'dzuddiyn/AISYNC/proofs/t006b-github-adapter-live.md');
assert.equal(success.receipt.commit_or_record_id, verifiedAdapterResult.commitSha);
assert.equal(success.receipt.request_id, baseInput.requestId);
assert.equal(success.receipt.timestamp, baseInput.timestamp);
assert.equal(success.receipt.failure_reason, null);
assert.deepStrictEqual(Object.keys(success.historyEntry).sort(), [...HISTORY_FIELDS].sort());
assert.equal(JSON.parse(success.historyEntry.receipt_json).status, 'SUCCESS');

const unchanged = createWriteReceipt({
  ...baseInput,
  requestId: 'req-t007-no-change',
  adapterResult: {
    outcome: 'NO_CHANGE',
    adapterId: 'github',
    destination: 'GitHub',
    repository: 'dzuddiyn/AISYNC',
    path: 'proofs/t006b-github-adapter-live.md',
    writePerformed: false,
    commitSha: null,
    existingSha: 'existing-sha',
    verified: true
  }
});
assert.equal(unchanged.receipt.status, 'SUCCESS');
assert.equal(unchanged.receipt.commit_or_record_id, null);
assert.equal(unchanged.receipt.adapter_outcome, 'NO_CHANGE');

const unverified = createWriteReceipt({
  ...baseInput,
  requestId: 'req-t007-unverified',
  adapterResult: {
    ...verifiedAdapterResult,
    outcome: 'WRITE_UNVERIFIED',
    verified: false,
    error: { code: 'VERIFY_READ_ERROR', message: 'Persisted-state read failed.' }
  }
});
assert.equal(unverified.receipt.status, 'FAILED');
assert.equal(unverified.receipt.commit_or_record_id, verifiedAdapterResult.commitSha);
assert.equal(unverified.receipt.failure_reason, 'Persisted-state read failed.');
assert.equal(unverified.receipt.verified, false);

const readFailed = createWriteReceipt({
  ...baseInput,
  requestId: 'req-t007-read-failed',
  adapterResult: {
    outcome: 'READ_ERROR',
    adapterId: 'github',
    destination: 'GitHub',
    repository: 'dzuddiyn/AISYNC',
    path: 'proofs/t006b-github-adapter-live.md',
    writePerformed: false,
    commitSha: null,
    verified: false,
    error: { code: 'GITHUB_READ_FAILED', message: 'GitHub read request failed.' }
  }
});
assert.equal(readFailed.receipt.status, 'FAILED');
assert.equal(readFailed.receipt.commit_or_record_id, null);
assert.equal(readFailed.receipt.failure_reason, 'GitHub read request failed.');

const invalid = createWriteReceipt({
  ...baseInput,
  adapterResult: { outcome: 'UNKNOWN' }
});
assert.equal(invalid.ok, false);
assert.equal(invalid.outcome, 'INVALID_RECEIPT_INPUT');

const receiptSnapshot = structuredClone(success.receipt);
const historyCalls = [];
const historyResult = await persistHistory(success, {
  async appendHistory(entry) {
    historyCalls.push(entry);
    entry.status = 'MUTATED_BY_WRITER';
  }
});
assert.equal(historyResult.ok, true);
assert.equal(historyResult.outcome, 'HISTORY_PERSISTED');
assert.equal(historyCalls.length, 1);
assert.equal(historyCalls[0].status, 'MUTATED_BY_WRITER');
assert.deepStrictEqual(historyResult.receipt, receiptSnapshot);
assert.equal(success.historyEntry.status, 'SUCCESS');

const historyFailure = await persistHistory(success, {
  appendHistory() {
    throw new Error('Sheets unavailable');
  }
});
assert.equal(historyFailure.ok, false);
assert.equal(historyFailure.outcome, 'HISTORY_WRITE_FAILED');
assert.equal(historyFailure.receipt.status, 'SUCCESS');
assert.equal(historyFailure.error.message, 'HISTORY writer failed.');

const noWriter = await persistHistory(success, null);
assert.equal(noWriter.ok, false);
assert.equal(noWriter.outcome, 'HISTORY_WRITE_FAILED');

assert.equal(typeof success.receipt.commit_id, 'undefined');
assert.equal(Object.prototype.hasOwnProperty.call(success.receipt, 'SUCCESS'), false);
assert.equal(Object.prototype.hasOwnProperty.call(success.receipt, 'FAILED'), false);

console.log('T-007 factual receipt and HISTORY boundary test: PASS');
console.log('SUCCESS/FAILED mapping, factual identifiers, and HISTORY shape: PASS');
console.log('injected HISTORY persistence and failure truthfulness: PASS');
