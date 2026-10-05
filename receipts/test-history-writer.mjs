import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const writerCode = fs.readFileSync(new URL('./History.gs', import.meta.url), 'utf8');
const headers = [
  'request_id',
  'project_id',
  'operation',
  'destination',
  'status',
  'affected_resource',
  'commit_or_record_id',
  'source_commit',
  'timestamp',
  'failure_reason',
  'receipt_json'
];
const rows = [];
let headerValues = headers.slice();
const sheet = {
  getRange(row, column, rowCount, columnCount) {
    assert.deepStrictEqual([row, column, rowCount, columnCount], [1, 1, 1, 11]);
    return { getValues: () => [headerValues] };
  },
  appendRow(row) {
    rows.push(row);
  },
  getLastRow() {
    return rows.length + 1;
  }
};
const sandbox = {
  SpreadsheetApp: {
    openById(id) {
      assert.equal(id, '11pWE0E-jEZhigVAYGcsfVXW0TODRcNMgOZHFfUQIHKw');
      return { getSheetByName: name => name === 'HISTORY' ? sheet : null };
    }
  }
};
vm.createContext(sandbox);
vm.runInContext(writerCode, sandbox);

const successEntry = {
  request_id: 'req-t007-history',
  project_id: 'AISYNC',
  operation: 'SAVE',
  destination: 'GitHub',
  status: 'SUCCESS',
  affected_resource: 'dzuddiyn/AISYNC/proofs/t006b-github-adapter-live.md',
  commit_or_record_id: '95e019604e6edd778acd0ee252c506d2729f2d09',
  source_commit: null,
  timestamp: '2026-10-03T12:00:00+08:00',
  failure_reason: null,
  receipt_json: '{"status":"SUCCESS"}'
};
const persisted = sandbox.appendHistory_(successEntry);
assert.equal(persisted.ok, true);
assert.equal(persisted.outcome, 'HISTORY_PERSISTED');
assert.equal(persisted.rowNumber, 2);
assert.equal(
  JSON.stringify(rows[0]),
  JSON.stringify(headers.map(header => successEntry[header]))
);

const failedEntry = { ...successEntry, request_id: 'req-t007-failed', status: 'FAILED', failure_reason: 'Persisted-state read failed.' };
assert.equal(sandbox.appendHistory_(failedEntry).ok, true);
assert.equal(rows[1][4], 'FAILED');

const invalidEntry = { ...successEntry, status: 'PENDING' };
const invalid = sandbox.appendHistory_(invalidEntry);
assert.equal(invalid.ok, false);
assert.equal(invalid.error.code, 'INVALID_HISTORY_ENTRY');
assert.equal(rows.length, 2);

headerValues = headers.slice(0, 10);
const headerFailure = sandbox.appendHistory_(successEntry);
assert.equal(headerFailure.ok, false);
assert.equal(headerFailure.error.code, 'HISTORY_HEADER_MISMATCH');
assert.equal(rows.length, 2);

console.log('T-007 Apps Script HISTORY writer boundary test: PASS');
console.log('SUCCESS/FAILED validation, header guard, and row mapping: PASS');
console.log('live Google Sheets writes: none');
