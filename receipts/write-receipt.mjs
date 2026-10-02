const SUCCESS_OUTCOMES = new Set(['VERIFIED_WRITE', 'NO_CHANGE']);
const FAILURE_OUTCOMES = new Set([
  'READ_ERROR',
  'WRITE_ERROR',
  'WRITE_UNVERIFIED',
  'INVALID_INPUT'
]);
const HISTORY_FIELDS = Object.freeze([
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

function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map(cloneValue);
  }

  if (value !== null && typeof value === 'object') {
    return Object.keys(value).reduce(function (copy, key) {
      copy[key] = cloneValue(value[key]);
      return copy;
    }, {});
  }

  return value;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

function invalidResult(errors) {
  return {
    ok: false,
    outcome: 'INVALID_RECEIPT_INPUT',
    errors
  };
}

function validateReceiptInput(input) {
  const errors = [];

  if (!input || typeof input !== 'object') {
    return invalidResult([{ code: 'INVALID_INPUT', message: 'Receipt input must be an object.' }]);
  }

  ['requestId', 'projectId', 'operation', 'timestamp'].forEach(function (field) {
    if (!isNonEmptyString(input[field])) {
      errors.push({ code: 'INVALID_' + field.toUpperCase(), message: field + ' must be a non-empty string.' });
    }
  });

  const adapterResult = input.adapterResult;
  if (!adapterResult || typeof adapterResult !== 'object') {
    errors.push({ code: 'INVALID_ADAPTER_RESULT', message: 'Adapter result is required.' });
  } else if (!SUCCESS_OUTCOMES.has(adapterResult.outcome) && !FAILURE_OUTCOMES.has(adapterResult.outcome)) {
    errors.push({ code: 'UNKNOWN_ADAPTER_OUTCOME', message: 'Adapter outcome is not recognized.' });
  }

  return errors.length === 0 ? null : invalidResult(errors);
}

function affectedResource(adapterResult) {
  if (isNonEmptyString(adapterResult.repository) && isNonEmptyString(adapterResult.path)) {
    return adapterResult.repository + '/' + adapterResult.path;
  }

  return null;
}

function failureReason(adapterResult) {
  if (adapterResult.error && isNonEmptyString(adapterResult.error.message)) {
    return adapterResult.error.message;
  }

  if (adapterResult.outcome === 'WRITE_UNVERIFIED') {
    return 'Adapter write was not verified as persisted.';
  }

  return adapterResult.outcome;
}

function buildReceipt(input) {
  const adapterResult = cloneValue(input.adapterResult);
  const status = SUCCESS_OUTCOMES.has(adapterResult.outcome) ? 'SUCCESS' : 'FAILED';
  const receipt = {
    receipt_version: '0.1',
    request_id: input.requestId,
    project_id: input.projectId,
    operation: input.operation,
    destination: adapterResult.destination || null,
    status,
    affected_resource: affectedResource(adapterResult),
    commit_or_record_id: adapterResult.commitSha || null,
    source_commit: input.sourceCommit || null,
    timestamp: input.timestamp,
    failure_reason: status === 'FAILED' ? failureReason(adapterResult) : null,
    adapter_outcome: adapterResult.outcome,
    write_performed: adapterResult.writePerformed === true,
    verified: adapterResult.verified === true
  };

  return receipt;
}

export function createWriteReceipt(input) {
  const validation = validateReceiptInput(input);
  if (validation) {
    return validation;
  }

  const receipt = buildReceipt(input);
  return {
    ok: true,
    outcome: 'RECEIPT_CREATED',
    receipt: cloneValue(receipt),
    historyEntry: createHistoryEntry(receipt)
  };
}

export function createHistoryEntry(receipt) {
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

  return HISTORY_FIELDS.reduce(function (entry, field) {
    entry[field] = historyEntry[field];
    return entry;
  }, {});
}

export async function persistHistory(receiptResult, historyWriter) {
  if (!receiptResult || receiptResult.ok !== true || !receiptResult.historyEntry) {
    return {
      ok: false,
      outcome: 'HISTORY_NOT_ATTEMPTED',
      error: { code: 'INVALID_RECEIPT', message: 'A created receipt is required.' }
    };
  }

  if (!historyWriter || typeof historyWriter.appendHistory !== 'function') {
    return {
      ok: false,
      outcome: 'HISTORY_WRITE_FAILED',
      error: { code: 'INVALID_HISTORY_WRITER', message: 'An injected HISTORY writer is required.' }
    };
  }

  try {
    await historyWriter.appendHistory(cloneValue(receiptResult.historyEntry));
    return {
      ok: true,
      outcome: 'HISTORY_PERSISTED',
      receipt: cloneValue(receiptResult.receipt),
      historyEntry: cloneValue(receiptResult.historyEntry)
    };
  } catch (error) {
    return {
      ok: false,
      outcome: 'HISTORY_WRITE_FAILED',
      receipt: cloneValue(receiptResult.receipt),
      error: { code: 'HISTORY_WRITER_ERROR', message: 'HISTORY writer failed.' }
    };
  }
}

export { HISTORY_FIELDS };
