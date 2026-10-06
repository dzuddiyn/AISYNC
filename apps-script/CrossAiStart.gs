// CrossAI user-first start path.
// Public landing owns only draft/provider capture + auth preservation.
// This protected binding owns intent routing, private conversation creation,
// scoped provider handoff, and private CrossAI continuity checkpointing.

var CROSSAI_PUBLIC_URL_ = 'https://dzuddiyn.github.io/AISYNC/asc/';
var CROSSAI_START_MAX_DRAFT_ = 4000;

var CROSSAI_PROVIDER_URLS_ = Object.freeze({
  ChatGPT: 'https://chatgpt.com/',
  Gemini: 'https://gemini.google.com/app',
  Copilot: 'https://copilot.microsoft.com/'
});

var CROSSAI_ROUTES_ = Object.freeze({
  DUMP: Object.freeze({
    route: 'DUMP',
    method: 'ZASSPILL',
    version: '1.0.0',
    gateway: 'https://dzuddiyn.github.io/AISYNC/method/zasspill/my/'
  }),
  DECIDE: Object.freeze({
    route: 'DECIDE',
    method: 'ZASSELECTION',
    version: '0.2.2',
    gateway: 'https://dzuddiyn.github.io/AISYNC/method/zasselection/my/'
  }),
  DESIGN: Object.freeze({
    route: 'DESIGN',
    method: 'ZASSIMPLE',
    version: '0.3.0',
    gateway: 'https://dzuddiyn.github.io/AISYNC/method/zassimple/my/'
  })
});

function ascCrossAiError_(code, message) {
  return { ok: false, error: { code: code, message: message } };
}

function ascCrossAiActorContext_() {
  var context = ascAuthorizationContext_();
  return ascIsBetaActor_(context) ? context : null;
}

function ascCrossAiPrivateProjectId_(context) {
  var seed = context && context.betaParticipantId
    ? 'participant:' + context.betaParticipantId
    : 'owner:' + String(ascBetaTemporaryUserFingerprint_() || context.activeUser || context.effectiveUser || 'owner');
  return 'CROSSAI-' + ascSha256Hex_(seed).slice(0, 24).toUpperCase();
}

function ascCrossAiRequestId_(startId) {
  if (typeof startId !== 'string' || !/^cs_[A-Za-z0-9]{8,128}$/.test(startId)) {
    throw new Error('INVALID_START_ID');
  }
  return 'req_' + ascSha256Hex_(startId).slice(0, 26).toUpperCase();
}

function ascCrossAiRoute_(route) {
  return CROSSAI_ROUTES_[String(route || '').toUpperCase()] || null;
}

function ascCrossAiClassify_(draft) {
  var text = String(draft || '').toLowerCase();
  var decide = /bandingkan|banding|compare|comparison|choice|choose|pilih|pilihan|antara|\bvs\b/.test(text);
  var design = /bina|buat|cipta|reka|design|build|create|architecture|architect|sistem|system/.test(text);
  if (decide && design) {
    return {
      status: 'AMBIGUOUS',
      choices: ['DUMP', 'DECIDE', 'DESIGN']
    };
  }
  if (decide) return { status: 'ROUTED', route: 'DECIDE' };
  if (design) return { status: 'ROUTED', route: 'DESIGN' };
  return { status: 'ROUTED', route: 'DUMP' };
}

function ascCrossAiTitle_(draft) {
  var compact = String(draft || '').replace(/\s+/g, ' ').trim();
  return compact.length <= 80 ? compact : compact.slice(0, 77) + '...';
}

function ascCrossAiMinimumContinuity_(read) {
  var semantic = read && read.record && read.record.semantic_record &&
    typeof read.record.semantic_record === 'object'
    ? read.record.semantic_record
    : {};
  var continuity = semantic.continuity && typeof semantic.continuity === 'object'
    ? semantic.continuity
    : {};
  var minimum = {};
  if (semantic.title) minimum.title = semantic.title;
  if (continuity.current != null) minimum.current = continuity.current;
  if (continuity.matters != null) minimum.matters = continuity.matters;
  if (continuity.open != null) minimum.open = continuity.open;
  return minimum;
}

function ascCrossAiMethodResultInstruction_(handoff, route) {
  var template = {
    handoff_id: handoff.handoff_id,
    thread_id: handoff.thread_id,
    source_revision: handoff.source_revision,
    producing_method: route.method,
    result_status: 'CONFIRMED_RESULT',
    confirmed_outcome: '<brief user-confirmed current checkpoint>',
    still_open: [],
    artifact_refs: []
  };
  return [
    '',
    'CrossAI continuity instruction:',
    'This conversation was started and saved by CrossAI before provider handoff.',
    'User command SAVE TO CROSSAI (legacy alias: SAVE) means: prepare the latest useful checkpoint for CrossAI private continuity.',
    'User command MOVE TO ANOTHER AI means: prepare the latest useful checkpoint for CrossAI first; after CrossAI saves it, the user may continue with another provider.',
    'Do not claim CrossAI persistence yourself.',
    'For either command, return exactly one result block in this shape:',
    ASC_METHOD_RESULT_BEGIN_,
    JSON.stringify(template),
    ASC_METHOD_RESULT_END_,
    'Use CONFIRMED_RESULT only for a checkpoint the user explicitly asked to preserve or transfer. Do not invent artifact_refs.',
    'Then tell the user to return to the CrossAI start page, paste the block into Return from AI, and press SAVE CHECKPOINT.',
    'This path saves private CrossAI conversation continuity. It does not claim a GitHub/project-artifact SAVE.'
  ].join('\n');
}

function prepareCrossAiConversation(input) {
  var context = ascCrossAiActorContext_();
  if (!context) return ascCrossAiError_('BETA_ACCESS_REQUIRED', 'CrossAI beta access is required.');

  var request = input && typeof input === 'object' ? input : {};
  var startId = typeof request.start_id === 'string' ? request.start_id.trim() : '';
  var draft = typeof request.draft === 'string' ? request.draft.trim() : '';
  var provider = typeof request.provider === 'string' ? request.provider.trim() : '';
  var explicitRoute = typeof request.route === 'string' ? request.route.trim().toUpperCase() : '';

  if (!draft || draft.length > CROSSAI_START_MAX_DRAFT_) {
    return ascCrossAiError_('INVALID_DRAFT', 'Write a message between 1 and 4000 characters.');
  }
  if (!Object.prototype.hasOwnProperty.call(CROSSAI_PROVIDER_URLS_, provider)) {
    return ascCrossAiError_('INVALID_PROVIDER', 'Choose a supported AI provider.');
  }

  var route = ascCrossAiRoute_(explicitRoute);
  if (!route) {
    var classified = ascCrossAiClassify_(draft);
    if (classified.status === 'AMBIGUOUS') {
      return {
        ok: true,
        status: 'NEEDS_ROUTE_CHOICE',
        question: 'What do you want CrossAI to help with?',
        choices: classified.choices
      };
    }
    route = ascCrossAiRoute_(classified.route);
  }

  try {
    var projectId = ascCrossAiPrivateProjectId_(context);
    var requestId = ascCrossAiRequestId_(startId);
    var created = ascBootstrapPrivateContinuityThread_({
      projectId: projectId,
      requestId: requestId,
      resolution: { status: 'NO_MATCH' },
      semanticRecord: {
        title: ascCrossAiTitle_(draft),
        route: route.route,
        method: route.method,
        continuity: {
          current: draft,
          matters: [],
          open: []
        }
      }
    });

    if (!created || (created.status !== 'CREATED' && created.status !== 'ALREADY_APPLIED')) {
      return ascCrossAiError_(
        created && created.status ? created.status : 'THREAD_CREATE_FAILED',
        'CrossAI could not save this new conversation.'
      );
    }

    var original = created.status === 'ALREADY_APPLIED' ? created.original_result : created;
    var threadId = original.thread_id;
    var revision = original.revision || 1;
    var read = ascZasspillGetById_(projectId, threadId);
    if (!read || read.status !== 'FOUND') {
      return ascCrossAiError_('THREAD_READ_FAILED', 'The saved CrossAI conversation could not be reopened.');
    }

    var minimum = ascCrossAiMinimumContinuity_(read);
    var handoff = ascZasspillCreateMethodHandoff_({
      projectId: projectId,
      threadId: threadId,
      sourceMethod: route.method,
      targetMethod: route.method,
      transition: 'START_' + route.route,
      minimumRelevantContinuity: minimum,
      methodLineage: []
    });
    if (!handoff || handoff.status !== 'HANDOFF_CREATED') {
      return ascCrossAiError_('HANDOFF_CREATE_FAILED', 'CrossAI could not prepare the AI handoff.');
    }

    var reference = ascZasspillIssueScopedReference_({
      projectId: projectId,
      threadId: threadId,
      revision: revision,
      targetProvider: provider,
      targetMethod: route.method,
      handoffId: handoff.handoff.handoff_id,
      ttlSeconds: 600
    });
    if (!reference || reference.status !== 'REFERENCE_ISSUED') {
      return ascCrossAiError_(
        reference && reference.status ? reference.status : 'REFERENCE_ISSUE_FAILED',
        'CrossAI could not issue the temporary continuity reference.'
      );
    }

    var bootstrap = ascZasspillBuildScopedTransferBootstrap_({
      threadId: threadId,
      sourceRevision: revision,
      targetProvider: provider,
      targetMethod: route.method,
      methodGatewayUrl: route.gateway,
      expectedMethodVersion: route.version,
      handoffId: handoff.handoff.handoff_id,
      referenceId: reference.reference_id,
      minimumRelevantContinuity: minimum
    }) + '\nUser request:\n' + draft + ascCrossAiMethodResultInstruction_(handoff.handoff, route);

    return {
      ok: true,
      status: created.status === 'ALREADY_APPLIED' ? 'READY_EXISTING_START' : 'READY',
      provider: provider,
      provider_url: CROSSAI_PROVIDER_URLS_[provider],
      route: route.route,
      route_label: route.route === 'DUMP' ? 'Talk it out' : (route.route === 'DECIDE' ? 'Choose / compare' : 'Build / design'),
      thread_id: threadId,
      revision: revision,
      handoff_id: handoff.handoff.handoff_id,
      bootstrap: bootstrap,
      expires_at: reference.expires_at,
      saved_before_handoff: true
    };
  } catch (error) {
    return ascCrossAiError_(
      error && error.message ? error.message : 'CROSSAI_START_FAILED',
      'CrossAI could not start this conversation.'
    );
  }
}

function saveCrossAiCheckpoint(input) {
  var context = ascCrossAiActorContext_();
  if (!context) return ascCrossAiError_('BETA_ACCESS_REQUIRED', 'CrossAI beta access is required.');

  var request = input && typeof input === 'object' ? input : {};
  var returnText = typeof request.return_text === 'string' ? request.return_text : '';
  var projectId = ascCrossAiPrivateProjectId_(context);

  try {
    var resultEnvelope = ascDashboardParseMethodResult_(returnText);
    var lookup = ascZasspillCrossMethodService_().getHandoff({
      projectId: projectId,
      handoffId: resultEnvelope.handoff_id
    });
    if (!lookup || lookup.status !== 'HANDOFF_FOUND') {
      return ascCrossAiError_('HANDOFF_NOT_FOUND', 'This CrossAI handoff was not found for the signed-in user.');
    }
    var handoff = lookup.handoff;
    if (handoff.thread_id !== resultEnvelope.thread_id ||
        handoff.source_revision !== resultEnvelope.source_revision ||
        handoff.target_method !== resultEnvelope.producing_method) {
      return ascCrossAiError_('METHOD_RESULT_IDENTITY_MISMATCH', 'Returned AI checkpoint does not match this CrossAI conversation.');
    }

    var read = ascZasspillGetById_(projectId, resultEnvelope.thread_id);
    if (!read || read.status !== 'FOUND') {
      return ascCrossAiError_('THREAD_NOT_FOUND', 'This CrossAI conversation is unavailable.');
    }
    var semantic = read.record && read.record.semantic_record &&
      typeof read.record.semantic_record === 'object'
      ? JSON.parse(JSON.stringify(read.record.semantic_record))
      : {};
    var continuity = semantic.continuity && typeof semantic.continuity === 'object'
      ? semantic.continuity
      : {};

    if (read.revision === resultEnvelope.source_revision + 1 &&
        continuity.current === resultEnvelope.confirmed_outcome) {
      return {
        ok: true,
        status: 'ALREADY_SAVED',
        thread_id: resultEnvelope.thread_id,
        revision: read.revision,
        current: continuity.current
      };
    }
    if (read.revision !== resultEnvelope.source_revision) {
      return ascCrossAiError_('REVISION_CONFLICT', 'This CrossAI conversation changed after the AI checkpoint was created.');
    }

    var reconcile = ascZasspillReconcileMethodResult_({
      projectId: projectId,
      resultEnvelope: resultEnvelope
    });
    if (!reconcile || reconcile.status !== 'SAFE_TO_APPLY') {
      return ascCrossAiError_(
        reconcile && reconcile.status ? reconcile.status : 'METHOD_RESULT_RECONCILE_FAILED',
        'The AI checkpoint is not safe to apply to this CrossAI conversation.'
      );
    }

    var recorded = ascZasspillRecordMethodResult_({
      projectId: projectId,
      resultEnvelope: resultEnvelope
    });
    if (!recorded ||
        (recorded.status !== 'METHOD_RESULT_RECORDED' &&
         recorded.status !== 'METHOD_RESULT_ALREADY_RECORDED')) {
      return ascCrossAiError_(
        recorded && recorded.status ? recorded.status : 'METHOD_RESULT_RECORD_FAILED',
        'CrossAI could not record the AI checkpoint.'
      );
    }

    var nextSemantic = JSON.parse(JSON.stringify(semantic));
    nextSemantic.continuity = Object.assign({}, continuity, {
      current: resultEnvelope.confirmed_outcome,
      open: JSON.parse(JSON.stringify(resultEnvelope.still_open))
    });

    var applied = ascApplyPrivateContinuityMutation_({
      projectId: projectId,
      requestId: 'req_' + resultEnvelope.handoff_id.slice(3),
      threadId: resultEnvelope.thread_id,
      expectedRevision: resultEnvelope.source_revision,
      operation: 'UPDATE',
      changes: {
        current: resultEnvelope.confirmed_outcome,
        open: JSON.parse(JSON.stringify(resultEnvelope.still_open)),
        handoff_id: resultEnvelope.handoff_id,
        producing_method: resultEnvelope.producing_method
      },
      nextSemanticRecord: nextSemantic
    });

    if (!applied || (applied.status !== 'APPLIED' && applied.status !== 'ALREADY_APPLIED')) {
      return ascCrossAiError_(
        applied && applied.status ? applied.status : 'CONTINUITY_SAVE_FAILED',
        'CrossAI could not save the returned checkpoint.'
      );
    }

    return {
      ok: true,
      status: applied.status === 'ALREADY_APPLIED' ? 'ALREADY_SAVED' : 'SAVED',
      thread_id: resultEnvelope.thread_id,
      revision: applied.revision || (resultEnvelope.source_revision + 1),
      current: resultEnvelope.confirmed_outcome
    };
  } catch (error) {
    return ascCrossAiError_(
      error && error.message ? error.message : 'CHECKPOINT_SAVE_FAILED',
      'CrossAI could not parse or save the returned AI checkpoint.'
    );
  }
}
