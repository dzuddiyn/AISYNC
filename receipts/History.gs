const HISTORY_WRITER_CONFIG = Object.freeze({
  legacySpreadsheetId: '11pWE0E-jEZhigVAYGcsfVXW0TODRcNMgOZHFfUQIHKw',
  sheetName: 'HISTORY'
});

function historySpreadsheetId_() {
  if (typeof ascDbSpreadsheetId_ === 'function') {
    return ascDbSpreadsheetId_();
  }
  return HISTORY_WRITER_CONFIG.legacySpreadsheetId;
}

const HISTORY_WRITER_HEADERS = Object.freeze([
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
]);

function appendHistory(historyEntry) {
  const validation = validateHistoryEntry_(historyEntry);
  if (!validation.valid) {
    return {
      ok: false,
      outcome: 'HISTORY_WRITE_FAILED',
      error: {
        code: 'INVALID_HISTORY_ENTRY',
        message: validation.errors.join('; ')
      }
    };
  }

  try {
    const sheet = SpreadsheetApp
      .openById(historySpreadsheetId_())
      .getSheetByName(HISTORY_WRITER_CONFIG.sheetName);

    if (!sheet) {
      return {
        ok: false,
        outcome: 'HISTORY_WRITE_FAILED',
        error: { code: 'HISTORY_SHEET_MISSING', message: 'HISTORY sheet is missing.' }
      };
    }

    const headers = sheet
      .getRange(1, 1, 1, HISTORY_WRITER_HEADERS.length)
      .getValues()[0];

    if (!HISTORY_WRITER_HEADERS.every(function (header, index) {
      return headers[index] === header;
    })) {
      return {
        ok: false,
        outcome: 'HISTORY_WRITE_FAILED',
        error: { code: 'HISTORY_HEADER_MISMATCH', message: 'HISTORY headers do not match.' }
      };
    }

    const row = HISTORY_WRITER_HEADERS.map(function (header) {
      return historyEntry[header];
    });
    sheet.appendRow(row);

    return {
      ok: true,
      outcome: 'HISTORY_PERSISTED',
      rowNumber: sheet.getLastRow()
    };
  } catch (error) {
    return {
      ok: false,
      outcome: 'HISTORY_WRITE_FAILED',
      error: { code: 'HISTORY_WRITER_EXCEPTION', message: 'HISTORY writer failed.' }
    };
  }
}

function validateHistoryEntry_(historyEntry) {
  const errors = [];
  const requiredStrings = [
    'request_id',
    'project_id',
    'operation',
    'timestamp',
    'receipt_json'
  ];

  if (!historyEntry || typeof historyEntry !== 'object') {
    return { valid: false, errors: ['History entry must be an object.'] };
  }

  requiredStrings.forEach(function (field) {
    if (typeof historyEntry[field] !== 'string' || historyEntry[field].length === 0) {
      errors.push(field + ' must be a non-empty string');
    }
  });

  if (historyEntry.status !== 'SUCCESS' && historyEntry.status !== 'FAILED') {
    errors.push('status must be SUCCESS or FAILED');
  }

  return { valid: errors.length === 0, errors: errors };
}
