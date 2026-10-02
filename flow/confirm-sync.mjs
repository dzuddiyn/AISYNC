// T-008A — runtime-neutral preview → CONFIRM & SYNC → write/verify → receipt → HISTORY → redirect decision.
//
// This module only composes existing owners:
//   - ASC Core (T-005)          validate / authorize / route
//   - GitHub adapter (T-006)    read → write → read verification
//   - Receipt + HISTORY (T-007) factual receipt and injected HISTORY persistence
// It performs no I/O itself. All destination clients, HISTORY writers, clocks,
// authorization policies, write-spec resolution, and the main ASC UI URL are injected.

import { processCoreRequest } from '../core/asc-core.mjs';
import { runGitHubAdapter } from '../adapters/github/github-adapter.mjs';
import { createWriteReceipt, persistHistory } from '../receipts/write-receipt.mjs';

export const CONFIRM_ACTION = 'CONFIRM_AND_SYNC';

// v0.1 slice: only the GitHub adapter exists. Any other destination set fails closed
// before any write so no partial persistence can occur.
const SUPPORTED_DESTINATION_SETS = Object.freeze([['GitHub']]);

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

function failed(stage, code, message, extra) {
  return {
    state: 'FAILED',
    stage,
    redirect: null,
    error: { code, message },
    ...(extra || {})
  };
}

function readEnvelope(envelope) {
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
    return { error: failed('PREVIEW', 'INVALID_ENVELOPE', 'A decoded ASC envelope is required.') };
  }

  if (!isNonEmptyString(envelope.request_id)) {
    return { error: failed('PREVIEW', 'MISSING_REQUEST_ID', 'Envelope request_id is required.') };
  }

  return { requestId: envelope.request_id, contract: envelope.contract };
}

// Explicit confirmation must be an affirmative CONFIRM & SYNC action bound to this request.
export function isExplicitConfirmation(confirmation, requestId) {
  return Boolean(confirmation) &&
    typeof confirmation === 'object' &&
    confirmation.confirmed === true &&
    confirmation.action === CONFIRM_ACTION &&
    confirmation.requestId === requestId;
}

// Preview is pure: it never touches a destination client or HISTORY writer.
export function previewRequest(envelope) {
  const read = readEnvelope(envelope);
  if (read.error) {
    return read.error;
  }

  return {
    state: 'AWAITING_CONFIRMATION',
    stage: 'PREVIEW',
    redirect: null,
    requestId: read.requestId,
    contract: cloneValue(read.contract),
    confirmAction: CONFIRM_ACTION,
    writePerformed: false
  };
}

function isSupportedDestinationSet(routes) {
  const destinations = routes.map(function (route) { return route.destination; });
  return SUPPORTED_DESTINATION_SETS.some(function (set) {
    return set.length === destinations.length && set.every(function (d, i) { return destinations[i] === d; });
  });
}

// T-007 persistHistory treats only a thrown error as writer failure, while the Apps Script
// History.gs writer reports failure as a returned { ok: false } value. Bridge both without
// changing either owner: an explicit ok:false result is surfaced as a writer failure.
function strictHistoryWriter(historyWriter) {
  if (!historyWriter || typeof historyWriter.appendHistory !== 'function') {
    return historyWriter;
  }

  return {
    appendHistory: async function (entry) {
      const result = await historyWriter.appendHistory(entry);
      if (result && typeof result === 'object' && result.ok === false) {
        throw new Error('HISTORY writer reported failure.');
      }
      return result;
    }
  };
}

function isValidRedirectUrl(url) {
  return isNonEmptyString(url) && /^https:\/\/[^\s]+$/.test(url);
}

export async function confirmAndSyncRequest({
  envelope,
  confirmation,
  authorizationContext,
  authorizationPolicy,
  resolveGitHubWriteSpec,
  githubClient,
  historyWriter,
  now,
  sourceCommit = null,
  mainUiUrl
} = {}) {
  const read = readEnvelope(envelope);
  if (read.error) {
    return read.error;
  }

  // Gate 1: no persistence of any kind without explicit, request-bound confirmation.
  if (!isExplicitConfirmation(confirmation, read.requestId)) {
    return {
      ...previewRequest(envelope),
      error: { code: 'CONFIRMATION_REQUIRED', message: 'Explicit CONFIRM & SYNC is required before persistence.' }
    };
  }

  // Gate 2: ASC Core validate / authorize / route. Rejection stops before any write.
  const core = processCoreRequest({
    contract: read.contract,
    authorizationContext,
    authorizationPolicy
  });

  if (core.status !== 'ACCEPTED') {
    return failed('CORE', 'CORE_REJECTED', 'ASC Core rejected the request at ' + core.stage + '.', {
      requestId: read.requestId,
      writePerformed: false,
      core: cloneValue(core)
    });
  }

  if (!isSupportedDestinationSet(core.routes)) {
    return failed('ROUTING', 'UNSUPPORTED_DESTINATION_SET', 'This v0.1 flow supports only Destination ["GitHub"].', {
      requestId: read.requestId,
      writePerformed: false
    });
  }

  if (typeof now !== 'function') {
    return failed('CONFIG', 'MISSING_CLOCK', 'A server clock is required for factual receipt timestamps.', {
      requestId: read.requestId,
      writePerformed: false
    });
  }

  if (typeof resolveGitHubWriteSpec !== 'function') {
    return failed('CONFIG', 'MISSING_WRITE_SPEC_RESOLVER', 'A server-side GitHub write-spec resolver is required.', {
      requestId: read.requestId,
      writePerformed: false
    });
  }

  const invocation = core.adapterInvocations[0];
  let writeSpec;
  try {
    writeSpec = resolveGitHubWriteSpec(cloneValue(invocation));
  } catch (error) {
    writeSpec = null;
  }

  // Gate 3: GitHub adapter owns read → write → read verification.
  const adapterResult = await runGitHubAdapter(invocation, writeSpec, githubClient);

  // Gate 4: T-007 factual receipt.
  const receiptResult = createWriteReceipt({
    requestId: read.requestId,
    projectId: read.contract.Project,
    operation: read.contract.Operation,
    sourceCommit,
    timestamp: now(),
    adapterResult
  });

  if (!receiptResult.ok) {
    return failed('RECEIPT', 'RECEIPT_NOT_CREATED', 'A factual receipt could not be created.', {
      requestId: read.requestId,
      writePerformed: adapterResult.writePerformed === true,
      adapterOutcome: adapterResult.outcome,
      receiptErrors: cloneValue(receiptResult.errors)
    });
  }

  // Gate 5: T-007 HISTORY persistence for both SUCCESS and FAILED receipts.
  const history = await persistHistory(receiptResult, strictHistoryWriter(historyWriter));
  const receipt = cloneValue(receiptResult.receipt);
  const base = {
    requestId: read.requestId,
    receipt,
    historyOutcome: history.outcome,
    writePerformed: receipt.write_performed
  };

  if (receipt.status !== 'SUCCESS' || receipt.verified !== true) {
    return failed('WRITE', 'WRITE_NOT_VERIFIED', receipt.failure_reason || 'Write was not verified.', base);
  }

  if (history.ok !== true) {
    return failed('HISTORY', 'HISTORY_NOT_PERSISTED', 'Verified write receipt exists but HISTORY was not persisted.', base);
  }

  if (!isValidRedirectUrl(mainUiUrl)) {
    // The write and HISTORY are factual successes; only the return path is unavailable.
    // Do not relabel persisted state as FAILED and do not invent a redirect target.
    return {
      state: 'SYNCED_REDIRECT_UNAVAILABLE',
      stage: 'REDIRECT',
      redirect: null,
      error: { code: 'MAIN_UI_URL_MISSING', message: 'Sync verified but the main ASC UI URL is not configured.' },
      ...base
    };
  }

  return {
    state: 'SYNCED',
    stage: 'REDIRECT',
    redirect: mainUiUrl,
    error: null,
    ...base
  };
}
