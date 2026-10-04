// T-018A — protected project/thread continuation handoff.
//
// This binding exposes only the minimum owner-visible continuity needed to continue
// a known private thread. It does not expose provider memory, full transcripts,
// bearer tokens, arbitrary semantic records, or any new persistence path.

const ASC_DASHBOARD_HANDOFF_ROUTES_ = Object.freeze({
  DUMP: Object.freeze({
    route: 'DUMP',
    method: 'ZASSPILL',
    expectedMethodVersion: '1.0.0',
    methodGatewayUrl: 'https://dzuddiyn.github.io/AISYNC/method/zasspill/my/'
  }),
  DECIDE: Object.freeze({
    route: 'DECIDE',
    method: 'ZASSELECTION',
    expectedMethodVersion: '0.2.2',
    methodGatewayUrl: 'https://dzuddiyn.github.io/AISYNC/method/zasselection/my/'
  }),
  DESIGN: Object.freeze({
    route: 'DESIGN',
    method: 'ZASSIMPLE',
    expectedMethodVersion: '0.3.0',
    methodGatewayUrl: 'https://dzuddiyn.github.io/AISYNC/method/zassimple/my/'
  })
});

const ASC_DASHBOARD_HANDOFF_PROVIDERS_ = Object.freeze({
  ChatGPT: 'https://chatgpt.com/',
  Gemini: 'https://gemini.google.com/app',
  Copilot: 'https://copilot.microsoft.com/'
});

const ASC_DASHBOARD_FRONT_DOOR_URL_ = 'https://dzuddiyn.github.io/AISYNC/asc/';
const ASC_METHOD_RESULT_BEGIN_ = 'ASC_METHOD_RESULT_BEGIN';
const ASC_METHOD_RESULT_END_ = 'ASC_METHOD_RESULT_END';
const ASC_DASHBOARD_SAVE_LIFETIME_MS_ = 15 * 60 * 1000;

function ascDashboardHandoffError_(code, message) {
  return { ok: false, error: { code: code, message: message } };
}

function ascDashboardHandoffOwner_() {
  try {
    return ascIsOwner_(ascAuthorizationContext_());
  } catch (error) {
    return false;
  }
}

function ascDashboardHandoffRoute_(route) {
  return ASC_DASHBOARD_HANDOFF_ROUTES_[String(route || '').toUpperCase()] || null;
}

function ascDashboardRequestId_() {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let value = new Date().getTime();
  let timePart = '';
  for (let i = 0; i < 10; i += 1) {
    timePart = alphabet[value % 32] + timePart;
    value = Math.floor(value / 32);
  }
  const hex = Utilities.getUuid().replace(/-/g, '').toUpperCase();
  let randomPart = '';
  for (let i = 0; i < 16; i += 1) {
    const byte = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    randomPart += alphabet[byte % 32];
  }
  return 'req_' + timePart + randomPart;
}

function ascDashboardMinimumContinuity_(readResult) {
  const record = readResult && readResult.record;
  const semantic = record && record.semantic_record && typeof record.semantic_record === 'object'
    ? record.semantic_record
    : {};
  const continuity = semantic.continuity && typeof semantic.continuity === 'object'
    ? semantic.continuity
    : {};

  const minimum = {};
  if (typeof semantic.title === 'string' && semantic.title.trim()) minimum.title = semantic.title;
  if (continuity.current !== undefined && continuity.current !== null) minimum.current = continuity.current;
  if (continuity.matters !== undefined && continuity.matters !== null) minimum.matters = continuity.matters;
  if (continuity.open !== undefined && continuity.open !== null) minimum.open = continuity.open;
  return minimum;
}

function getDashboardProjectContinuity(projectId) {
  if (!ascDashboardHandoffOwner_()) {
    return ascDashboardHandoffError_('OWNER_REQUIRED', 'Protected project continuity requires the owner session.');
  }
  if (typeof projectId !== 'string' || !projectId.trim()) {
    return ascDashboardHandoffError_('INVALID_PROJECT_ID', 'A project_id string is required.');
  }

  try {
    const projectResult = getDashboardProject(projectId);
    if (!projectResult || projectResult.ok !== true) return projectResult;

    const list = ascZasspillListThreads_(projectId);
    if (!list || list.status !== 'LIST_RESULT' || !Array.isArray(list.threads)) {
      return ascDashboardHandoffError_('CONTINUITY_READ_FAILED', 'Private project threads could not be listed.');
    }

    return {
      ok: true,
      project_id: projectId,
      threads: list.threads.map(function (thread) {
        return {
          thread_id: thread.thread_id,
          revision: thread.revision,
          title: thread.title || '',
          state: thread.state || null,
          current: thread.current == null ? null : thread.current
        };
      })
    };
  } catch (error) {
    return ascDashboardHandoffError_('CONTINUITY_READ_FAILED', 'Private project threads could not be listed.');
  }
}

function createDashboardProjectThread(input) {
  if (!ascDashboardHandoffOwner_()) {
    return ascDashboardHandoffError_('OWNER_REQUIRED', 'Starting a private project thread requires the owner session.');
  }

  const request = input && typeof input === 'object' ? input : {};
  const projectId = typeof request.project_id === 'string' ? request.project_id.trim() : '';
  const title = typeof request.title === 'string' ? request.title.trim() : '';
  const current = typeof request.current === 'string' ? request.current.trim() : '';

  if (!projectId) return ascDashboardHandoffError_('INVALID_PROJECT_ID', 'A project_id string is required.');
  if (!title || title.length > 200) {
    return ascDashboardHandoffError_('INVALID_THREAD_TITLE', 'Thread title must be 1–200 characters.');
  }
  if (!current || current.length > 4000) {
    return ascDashboardHandoffError_('INVALID_THREAD_CURRENT', 'Current context must be 1–4000 characters.');
  }

  try {
    const projectResult = getDashboardProject(projectId);
    if (!projectResult || projectResult.ok !== true) return projectResult;

    const existing = ascZasspillListThreads_(projectId);
    if (!existing || existing.status !== 'LIST_RESULT' || !Array.isArray(existing.threads)) {
      return ascDashboardHandoffError_('CONTINUITY_READ_FAILED', 'Private project threads could not be checked before creation.');
    }
    if (existing.threads.length > 0) {
      return ascDashboardHandoffError_('THREADS_ALREADY_EXIST', 'A private project thread already exists. Reload the project and choose it instead.');
    }

    const created = ascBootstrapPrivateContinuityThread_({
      projectId: projectId,
      requestId: ascDashboardRequestId_(),
      resolution: { status: 'NO_MATCH' },
      semanticRecord: {
        title: title,
        continuity: { current: current }
      }
    });

    if (!created || (created.status !== 'CREATED' && created.status !== 'ALREADY_APPLIED')) {
      return ascDashboardHandoffError_(
        created && created.status ? created.status : 'THREAD_CREATE_FAILED',
        'The private project thread could not be created.'
      );
    }

    return {
      ok: true,
      project_id: projectId,
      thread_id: created.thread_id || (created.original_result && created.original_result.thread_id) || null,
      revision: created.revision || (created.original_result && created.original_result.revision) || 1,
      title: title,
      current: current
    };
  } catch (error) {
    return ascDashboardHandoffError_('THREAD_CREATE_FAILED', 'The private project thread could not be created.');
  }
}

function prepareDashboardProjectHandoff(input) {
  if (!ascDashboardHandoffOwner_()) {
    return ascDashboardHandoffError_('OWNER_REQUIRED', 'Protected project handoff requires the owner session.');
  }

  const request = input && typeof input === 'object' ? input : {};
  const projectId = typeof request.project_id === 'string' ? request.project_id.trim() : '';
  const threadId = typeof request.thread_id === 'string' ? request.thread_id.trim() : '';
  const provider = typeof request.provider === 'string' ? request.provider.trim() : '';
  const route = ascDashboardHandoffRoute_(request.route);
  const draft = typeof request.draft === 'string' ? request.draft.trim() : '';

  if (!projectId) return ascDashboardHandoffError_('INVALID_PROJECT_ID', 'A project_id string is required.');
  if (!threadId) return ascDashboardHandoffError_('INVALID_THREAD_ID', 'Choose a project thread before preparing a handoff.');
  if (!ASC_DASHBOARD_HANDOFF_PROVIDERS_[provider]) {
    return ascDashboardHandoffError_('INVALID_PROVIDER', 'Choose ChatGPT, Gemini, or Copilot.');
  }
  if (!route) return ascDashboardHandoffError_('INVALID_ROUTE', 'Choose DUMP, DECIDE, or DESIGN.');
  if (!draft || draft.length > 4000) {
    return ascDashboardHandoffError_('INVALID_DRAFT', 'Tell ASC what changed or what you want to do next (1–4000 characters).');
  }

  try {
    const projectResult = getDashboardProject(projectId);
    if (!projectResult || projectResult.ok !== true) return projectResult;

    const read = ascZasspillGetById_(projectId, threadId);
    if (!read || read.status !== 'FOUND') {
      return ascDashboardHandoffError_(
        read && read.status ? read.status : 'THREAD_NOT_FOUND',
        'The selected private thread is not available.'
      );
    }

    const minimum = ascDashboardMinimumContinuity_(read);
    const handoff = ascZasspillCreateMethodHandoff_({
      projectId: projectId,
      threadId: threadId,
      sourceMethod: projectResult.project.source_method || 'ZASSPILL',
      targetMethod: route.method,
      transition: route.route,
      minimumRelevantContinuity: minimum,
      methodLineage: []
    });
    if (!handoff || handoff.status !== 'HANDOFF_CREATED') {
      return ascDashboardHandoffError_('HANDOFF_CREATE_FAILED', 'The project handoff could not be created.');
    }

    const reference = ascZasspillIssueScopedReference_({
      projectId: projectId,
      threadId: threadId,
      revision: read.revision,
      targetProvider: provider,
      targetMethod: route.method,
      handoffId: handoff.handoff.handoff_id,
      ttlSeconds: 600
    });
    if (!reference || reference.status !== 'REFERENCE_ISSUED') {
      return ascDashboardHandoffError_(
        reference && reference.status ? reference.status : 'REFERENCE_ISSUE_FAILED',
        'The scoped continuity reference could not be issued.'
      );
    }

    const bootstrap = ascZasspillBuildScopedTransferBootstrap_({
      threadId: threadId,
      sourceRevision: read.revision,
      targetProvider: provider,
      targetMethod: route.method,
      methodGatewayUrl: route.methodGatewayUrl,
      expectedMethodVersion: route.expectedMethodVersion,
      handoffId: handoff.handoff.handoff_id,
      referenceId: reference.reference_id,
      minimumRelevantContinuity: minimum
    }) + '\nUser request:\n' + draft + ascDashboardMethodResultInstruction_(handoff.handoff, route);

    return {
      ok: true,
      project_id: projectId,
      provider: provider,
      provider_url: ASC_DASHBOARD_HANDOFF_PROVIDERS_[provider],
      route: route.route,
      method: route.method,
      thread_title: minimum.title || '',
      expires_at: reference.expires_at,
      bootstrap: bootstrap
    };
  } catch (error) {
    return ascDashboardHandoffError_('HANDOFF_PREPARE_FAILED', 'The protected project handoff could not be prepared.');
  }
}

function ascDashboardMethodResultInstruction_(handoff, route) {
  const template = {
    handoff_id: handoff.handoff_id,
    thread_id: handoff.thread_id,
    source_revision: handoff.source_revision,
    producing_method: route.method,
    result_status: 'CONFIRMED_RESULT',
    confirmed_outcome: '<brief owner-confirmed outcome/current checkpoint>',
    still_open: [],
    artifact_refs: []
  };
  return [
    '',
    'SAVE / return-to-ASC instruction:',
    'If the user issues SAVE, do NOT claim local/provider/repository persistence.',
    'Return exactly one result block in this shape:',
    ASC_METHOD_RESULT_BEGIN_,
    JSON.stringify(template),
    ASC_METHOD_RESULT_END_,
    'Use CONFIRMED_RESULT only for the checkpoint the user explicitly asks to SAVE. Do not invent artifact_refs.',
    'Then tell the user to return to ASC Workspace and paste the block into Return from AI.',
    'Persistence is not complete until ASC preview + CONFIRM & SYNC succeeds.'
  ].join('\n');
}

function ascDashboardParseMethodResult_(text) {
  if (typeof text !== 'string' || !text.trim() || text.length > 12000) {
    throw new Error('METHOD_RESULT_TEXT_INVALID');
  }
  const first = text.indexOf(ASC_METHOD_RESULT_BEGIN_);
  const last = text.indexOf(ASC_METHOD_RESULT_END_);
  if (first < 0 || last < 0 || last <= first) throw new Error('METHOD_RESULT_BLOCK_MISSING');
  if (text.indexOf(ASC_METHOD_RESULT_BEGIN_, first + ASC_METHOD_RESULT_BEGIN_.length) >= 0 ||
      text.indexOf(ASC_METHOD_RESULT_END_, last + ASC_METHOD_RESULT_END_.length) >= 0) {
    throw new Error('METHOD_RESULT_BLOCK_AMBIGUOUS');
  }

  const result = JSON.parse(text.slice(first + ASC_METHOD_RESULT_BEGIN_.length, last).trim());
  if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('METHOD_RESULT_JSON_INVALID');

  const allowed = [
    'handoff_id', 'thread_id', 'source_revision', 'producing_method',
    'result_status', 'confirmed_outcome', 'still_open', 'artifact_refs'
  ];
  const keys = Object.keys(result).sort();
  if (keys.length !== allowed.length || allowed.some(function (key) { return keys.indexOf(key) < 0; })) {
    throw new Error('METHOD_RESULT_FIELDS_INVALID');
  }
  if (result.result_status !== 'CONFIRMED_RESULT') throw new Error('METHOD_RESULT_NOT_CONFIRMED');
  if (typeof result.confirmed_outcome !== 'string' || !result.confirmed_outcome.trim() ||
      result.confirmed_outcome.length > 8000) {
    throw new Error('METHOD_RESULT_OUTCOME_INVALID');
  }
  if (!Array.isArray(result.still_open) || result.still_open.length > 50 ||
      result.still_open.some(function (item) { return typeof item !== 'string' || item.length > 1000; })) {
    throw new Error('METHOD_RESULT_STILL_OPEN_INVALID');
  }
  if (!Array.isArray(result.artifact_refs) || result.artifact_refs.length > 50 ||
      result.artifact_refs.some(function (item) { return typeof item !== 'string' || item.length > 500; })) {
    throw new Error('METHOD_RESULT_ARTIFACT_REFS_INVALID');
  }
  return result;
}

function ascDashboardMethodResultIdentity_(projectId, resultEnvelope) {
  const lookup = ascZasspillCrossMethodService_().getHandoff({
    projectId: projectId,
    handoffId: resultEnvelope.handoff_id
  });
  if (!lookup || lookup.status !== 'HANDOFF_FOUND') {
    return ascDashboardHandoffError_('HANDOFF_NOT_FOUND', 'The returned handoff does not exist in this project.');
  }
  const handoff = lookup.handoff;
  if (handoff.thread_id !== resultEnvelope.thread_id ||
      handoff.source_revision !== resultEnvelope.source_revision ||
      handoff.target_method !== resultEnvelope.producing_method) {
    return ascDashboardHandoffError_(
      'METHOD_RESULT_IDENTITY_MISMATCH',
      'Returned method-result identity does not match the protected handoff.'
    );
  }
  return { ok: true, handoff: handoff };
}

function ascDashboardMethodResultMarkdown_(projectId, resultEnvelope) {
  const lines = [
    '# AI-SYNC Method Result',
    '',
    'Project: ' + projectId,
    'Thread ID: ' + resultEnvelope.thread_id,
    'Source revision: ' + resultEnvelope.source_revision,
    'Handoff ID: ' + resultEnvelope.handoff_id,
    'Producing method: ' + resultEnvelope.producing_method,
    'Result status: ' + resultEnvelope.result_status,
    '',
    '## Confirmed outcome',
    resultEnvelope.confirmed_outcome.trim(),
    '',
    '## Still open'
  ];
  if (resultEnvelope.still_open.length) {
    resultEnvelope.still_open.forEach(function (item) { lines.push('- ' + item); });
  } else {
    lines.push('- None declared');
  }
  lines.push('', '## Artifact refs');
  if (resultEnvelope.artifact_refs.length) {
    resultEnvelope.artifact_refs.forEach(function (item) { lines.push('- ' + item); });
  } else {
    lines.push('- None declared');
  }
  lines.push('', 'Persistence authority: AI-SYNC owner-confirmed SAVE.');
  return lines.join('\n');
}

function ascDashboardMethodResultRecordId_(handoffId) {
  return 'METHOD-RESULT-' + String(handoffId).replace(/^ho_/, '');
}

function ascDashboardSecureSaveLink_(contract) {
  const now = new Date();
  const issuedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + ASC_DASHBOARD_SAVE_LIFETIME_MS_).toISOString();
  const requestId = 'ASC-T018B-' + ascDashboardRequestId_().slice(4);
  const envelope = ascRuntime_().transport.createEnvelope(contract, {
    requestId: requestId,
    issuedAt: issuedAt,
    expiresAt: expiresAt
  });
  const sealed = ascRuntime_().security.sealEnvelope(envelope, ascSha256Hex_);
  return {
    request_id: requestId,
    expires_at: expiresAt,
    save_link: ASC_DASHBOARD_FRONT_DOOR_URL_ + '#asc=' + ascRuntime_().transport.encodeEnvelope(sealed)
  };
}

function previewDashboardMethodReturn(input) {
  if (!ascDashboardHandoffOwner_()) {
    return ascDashboardHandoffError_('OWNER_REQUIRED', 'Previewing a provider return requires the owner session.');
  }
  const request = input && typeof input === 'object' ? input : {};
  const projectId = typeof request.project_id === 'string' ? request.project_id.trim() : '';
  const returnText = typeof request.return_text === 'string' ? request.return_text : '';
  if (!projectId) return ascDashboardHandoffError_('INVALID_PROJECT_ID', 'A project_id string is required.');

  try {
    const projectResult = getDashboardProject(projectId);
    if (!projectResult || projectResult.ok !== true) return projectResult;

    const resultEnvelope = ascDashboardParseMethodResult_(returnText);
    const identity = ascDashboardMethodResultIdentity_(projectId, resultEnvelope);
    if (identity.ok !== true) return identity;

    const reconcile = ascZasspillReconcileMethodResult_({
      projectId: projectId,
      resultEnvelope: resultEnvelope
    });
    if (!reconcile || reconcile.status !== 'SAFE_TO_APPLY') {
      return ascDashboardHandoffError_(
        reconcile && reconcile.status ? reconcile.status : 'METHOD_RESULT_RECONCILE_FAILED',
        'The returned result is not safe to save against the current private-thread revision.'
      );
    }

    return {
      ok: true,
      project_id: projectId,
      handoff_id: resultEnvelope.handoff_id,
      thread_id: resultEnvelope.thread_id,
      source_revision: resultEnvelope.source_revision,
      producing_method: resultEnvelope.producing_method,
      result_status: resultEnvelope.result_status,
      confirmed_outcome: resultEnvelope.confirmed_outcome,
      still_open: resultEnvelope.still_open,
      artifact_refs: resultEnvelope.artifact_refs,
      record_id: ascDashboardMethodResultRecordId_(resultEnvelope.handoff_id),
      reconciliation: reconcile.status
    };
  } catch (error) {
    return ascDashboardHandoffError_(
      error && error.message ? error.message : 'METHOD_RESULT_PREVIEW_FAILED',
      'Provider return could not be parsed or validated.'
    );
  }
}

function prepareDashboardMethodReturnSave(input) {
  if (!ascDashboardHandoffOwner_()) {
    return ascDashboardHandoffError_('OWNER_REQUIRED', 'Preparing an ASC SAVE requires the owner session.');
  }
  const request = input && typeof input === 'object' ? input : {};
  const projectId = typeof request.project_id === 'string' ? request.project_id.trim() : '';
  const returnText = typeof request.return_text === 'string' ? request.return_text : '';
  if (!projectId) return ascDashboardHandoffError_('INVALID_PROJECT_ID', 'A project_id string is required.');

  try {
    const projectResult = getDashboardProject(projectId);
    if (!projectResult || projectResult.ok !== true) return projectResult;
    const resultEnvelope = ascDashboardParseMethodResult_(returnText);
    const identity = ascDashboardMethodResultIdentity_(projectId, resultEnvelope);
    if (identity.ok !== true) return identity;
    const reconcile = ascZasspillReconcileMethodResult_({
      projectId: projectId,
      resultEnvelope: resultEnvelope
    });
    if (!reconcile || reconcile.status !== 'SAFE_TO_APPLY') {
      return ascDashboardHandoffError_(
        reconcile && reconcile.status ? reconcile.status : 'METHOD_RESULT_RECONCILE_FAILED',
        'The returned result is not safe to save against the current private-thread revision.'
      );
    }

    const recordId = ascDashboardMethodResultRecordId_(resultEnvelope.handoff_id);
    const contract = {
      Project: projectId,
      'Source method': resultEnvelope.producing_method,
      Operation: 'SAVE',
      'Record type': 'method_result',
      'Record ID': recordId,
      'Content/change': ascDashboardMethodResultMarkdown_(projectId, resultEnvelope),
      Lineage: [
        'thread:' + resultEnvelope.thread_id,
        'handoff:' + resultEnvelope.handoff_id,
        'source_revision:' + resultEnvelope.source_revision
      ],
      Destination: ['GitHub']
    };
    const authorization = ascProductionAuthorizationPolicy_(contract, ascAuthorizationContext_());
    if (!authorization || authorization.authorized !== true) {
      return ascDashboardHandoffError_(
        'SAVE_NOT_AUTHORIZED',
        'Production SAVE policy did not authorize this method-result artifact.'
      );
    }

    const link = ascDashboardSecureSaveLink_(contract);
    const recorded = ascZasspillRecordMethodResult_({
      projectId: projectId,
      resultEnvelope: resultEnvelope
    });
    if (!recorded ||
        (recorded.status !== 'METHOD_RESULT_RECORDED' &&
         recorded.status !== 'METHOD_RESULT_ALREADY_RECORDED')) {
      return ascDashboardHandoffError_(
        recorded && recorded.status ? recorded.status : 'METHOD_RESULT_RECORD_FAILED',
        'Provider result could not be recorded against the protected handoff.'
      );
    }
    return {
      ok: true,
      project_id: projectId,
      handoff_id: resultEnvelope.handoff_id,
      thread_id: resultEnvelope.thread_id,
      source_revision: resultEnvelope.source_revision,
      producing_method: resultEnvelope.producing_method,
      record_id: recordId,
      request_id: link.request_id,
      expires_at: link.expires_at,
      save_link: link.save_link,
      persistence_state: 'NOT_SAVED_YET',
      next_action: 'Open ASC SAVE, review the preview, then CONFIRM & SYNC.'
    };
  } catch (error) {
    return ascDashboardHandoffError_(
      error && error.message ? error.message : 'METHOD_RESULT_SAVE_PREPARE_FAILED',
      'ASC SAVE could not be prepared from the provider return.'
    );
  }
}
