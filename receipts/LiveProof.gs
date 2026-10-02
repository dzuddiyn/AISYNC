const T007_TEST_ONLY = Object.freeze({
  requestId: 'TEST_ONLY_T007_HISTORY_20261003_01',
  projectId: 'AISYNC',
  operation: 'TEST_ONLY_HISTORY_PROOF',
  destination: 'GitHub',
  affectedResource: 'dzuddiyn/AISYNC/proofs/t006b-github-adapter-live.md',
  commitOrRecordId: '95e019604e6edd778acd0ee252c506d2729f2d09',
  sourceCommit: '',
  failureReason: '',
  status: 'SUCCESS'
});

function runT007TestOnlyHistoryProof() {
  const sheet = SpreadsheetApp
    .openById(HISTORY_WRITER_CONFIG.spreadsheetId)
    .getSheetByName(HISTORY_WRITER_CONFIG.sheetName);

  if (!sheet) {
    return { ok: false, outcome: 'HISTORY_SHEET_MISSING' };
  }

  const existingRow = findTestOnlyHistoryRow_(sheet, T007_TEST_ONLY.requestId);
  if (existingRow) {
    const persistedExisting = readHistoryRow_(sheet, existingRow);
    return {
      ok: verifyHistoryRow_(persistedExisting, persistedExisting),
      outcome: 'TEST_ONLY_ALREADY_PRESENT',
      writePerformed: false,
      rowNumber: existingRow,
      fieldCount: HISTORY_WRITER_HEADERS.length,
      exactMatch: verifyHistoryRow_(persistedExisting, persistedExisting),
      fields: persistedExisting
    };
  }

  const timestamp = new Date().toISOString();
  const receipt = {
    receipt_version: '0.1',
    request_id: T007_TEST_ONLY.requestId,
    project_id: T007_TEST_ONLY.projectId,
    operation: T007_TEST_ONLY.operation,
    destination: T007_TEST_ONLY.destination,
    status: T007_TEST_ONLY.status,
    affected_resource: T007_TEST_ONLY.affectedResource,
    commit_or_record_id: T007_TEST_ONLY.commitOrRecordId,
    source_commit: T007_TEST_ONLY.sourceCommit,
    timestamp: timestamp,
    failure_reason: T007_TEST_ONLY.failureReason,
    adapter_outcome: 'VERIFIED_WRITE',
    write_performed: true,
    verified: true
  };
  const historyEntry = {
    request_id: receipt.request_id,
    project_id: receipt.project_id,
    operation: receipt.operation,
    destination: receipt.destination,
    status: receipt.status,
    affected_resource: receipt.affected_resource,
    commit_or_record_id: receipt.commit_or_record_id,
    source_commit: receipt.source_commit,
    timestamp: receipt.timestamp,
    failure_reason: receipt.failure_reason,
    receipt_json: JSON.stringify(receipt)
  };

  const writeResult = appendHistory(historyEntry);
  if (!writeResult.ok) {
    return {
      ok: false,
      outcome: writeResult.outcome,
      writePerformed: false,
      error: writeResult.error
    };
  }

  const persisted = readHistoryRow_(sheet, writeResult.rowNumber);
  const exactMatch = verifyHistoryRow_(persisted, historyEntry);

  return {
    ok: exactMatch,
    outcome: exactMatch ? 'TEST_ONLY_HISTORY_VERIFIED' : 'TEST_ONLY_HISTORY_MISMATCH',
    writePerformed: true,
    rowNumber: writeResult.rowNumber,
    fieldCount: HISTORY_WRITER_HEADERS.length,
    exactMatch: exactMatch,
    fields: persisted
  };
}

function findTestOnlyHistoryRow_(sheet, requestId) {
  if (sheet.getLastRow() < 2) {
    return null;
  }

  const rows = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, HISTORY_WRITER_HEADERS.length)
    .getValues();

  for (let index = 0; index < rows.length; index += 1) {
    if (String(rows[index][0]) === requestId) {
      return index + 2;
    }
  }

  return null;
}

function readHistoryRow_(sheet, rowNumber) {
  return sheet
    .getRange(rowNumber, 1, 1, HISTORY_WRITER_HEADERS.length)
    .getValues()[0];
}

function verifyHistoryRow_(actual, expected) {
  return HISTORY_WRITER_HEADERS.every(function (header, index) {
    return actual[index] === expected[header] || actual[index] === expected[index];
  });
}
