import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

const source = fs.readFileSync(new URL('./CrossAiStart.gs', import.meta.url), 'utf8');
const threadId = 'th_01ARZ3NDEKTSV4RRFFQ69G5FAV';
const handoffId = 'ho_01ARZ3NDEKTSV4RRFFQ69G5FB6';
const referenceId = 'cr_01ARZ3NDEKTSV4RRFFQ69G5FB8';

function sha(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
}

function makeContext(overrides = {}) {
  const calls = { create: [], handoff: [], ref: [], bootstrap: [], apply: [], record: [] };
  let revision = 1;
  let current = 'bina sistem kebun';

  const context = {
    calls,
    ASC_METHOD_RESULT_BEGIN_: 'ASC_METHOD_RESULT_BEGIN',
    ASC_METHOD_RESULT_END_: 'ASC_METHOD_RESULT_END',
    ascAuthorizationContext_: () => ({
      betaParticipantId: 'bp_test123',
      betaAuthorized: true,
      activeUser: '',
      effectiveUser: ''
    }),
    ascIsBetaActor_: () => true,
    ascBetaTemporaryUserFingerprint_: () => 'f'.repeat(64),
    ascSha256Hex_: sha,
    ascBootstrapPrivateContinuityThread_: (input) => {
      calls.create.push(input);
      return {
        status: 'CREATED',
        project_id: input.projectId,
        request_id: input.requestId,
        thread_id: threadId,
        revision: 1,
        event_id: 'ev_01ARZ3NDEKTSV4RRFFQ69G5FC9'
      };
    },
    ascZasspillGetById_: (projectId, selectedThreadId) => ({
      status: 'FOUND',
      project_id: projectId,
      thread_id: selectedThreadId,
      revision,
      record: {
        semantic_record: {
          title: 'bina sistem kebun',
          route: 'DESIGN',
          method: 'ZASSIMPLE',
          continuity: { current, matters: [], open: [] }
        }
      }
    }),
    ascZasspillCreateMethodHandoff_: (input) => {
      calls.handoff.push(input);
      return {
        status: 'HANDOFF_CREATED',
        handoff: {
          handoff_id: handoffId,
          thread_id: input.threadId,
          source_revision: 1,
          target_method: input.targetMethod
        }
      };
    },
    ascZasspillIssueScopedReference_: (input) => {
      calls.ref.push(input);
      return {
        status: 'REFERENCE_ISSUED',
        reference_id: referenceId,
        token: 'ct_SECRET_NOT_RETURNED',
        expires_at: '2026-10-06T05:30:00.000Z'
      };
    },
    ascZasspillBuildScopedTransferBootstrap_: (input) => {
      calls.bootstrap.push(input);
      return [
        'Target method: ' + input.targetMethod,
        'Target provider: ' + input.targetProvider,
        'Method Gateway URL: ' + input.methodGatewayUrl,
        'expected_method_version: ' + input.expectedMethodVersion,
        'thread_id: ' + input.threadId,
        'source_revision: ' + input.sourceRevision,
        'handoff_id: ' + input.handoffId,
        'continuity_reference: ' + input.referenceId
      ].join('\n');
    },
    ascDashboardParseMethodResult_: () => ({
      handoff_id: handoffId,
      thread_id: threadId,
      source_revision: 1,
      producing_method: 'ZASSIMPLE',
      result_status: 'CONFIRMED_RESULT',
      confirmed_outcome: 'Architecture ringkas dipilih.',
      still_open: ['detail sensor'],
      artifact_refs: []
    }),
    ascZasspillCrossMethodService_: () => ({
      getHandoff: () => ({
        status: 'HANDOFF_FOUND',
        handoff: {
          handoff_id: handoffId,
          thread_id: threadId,
          source_revision: 1,
          target_method: 'ZASSIMPLE'
        }
      })
    }),
    ascZasspillReconcileMethodResult_: () => ({ status: 'SAFE_TO_APPLY' }),
    ascZasspillRecordMethodResult_: (input) => {
      calls.record.push(input);
      return { status: 'METHOD_RESULT_RECORDED', handoff_id: handoffId };
    },
    ascApplyPrivateContinuityMutation_: (input) => {
      calls.apply.push(input);
      revision = 2;
      current = input.changes.current;
      return { status: 'APPLIED', revision: 2 };
    },
    ...overrides
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

{
  const ctx = makeContext();
  assert.equal(ctx.ascCrossAiClassify_('saya nak sembang pasal idea ni').route, 'DUMP');
  assert.equal(ctx.ascCrossAiClassify_('bandingkan dua pilihan').route, 'DECIDE');
  assert.equal(ctx.ascCrossAiClassify_('bina architecture sistem baru').route, 'DESIGN');
  assert.equal(ctx.ascCrossAiClassify_('bandingkan dua architecture untuk saya bina').status, 'AMBIGUOUS');
}

{
  const ctx = makeContext();
  const ambiguous = ctx.prepareCrossAiConversation({
    start_id: 'cs_TESTSTART123',
    draft: 'bandingkan dua architecture untuk saya bina',
    provider: 'Gemini'
  });
  assert.equal(ambiguous.ok, true);
  assert.equal(ambiguous.status, 'NEEDS_ROUTE_CHOICE');
  assert.equal(ctx.calls.create.length, 0, 'ambiguous intent must ask before creating the thread');
}

{
  const ctx = makeContext();
  const result = ctx.prepareCrossAiConversation({
    start_id: 'cs_TESTSTART123',
    draft: 'bina sistem kebun',
    provider: 'Gemini'
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, 'READY');
  assert.equal(result.route, 'DESIGN');
  assert.equal(result.provider, 'Gemini');
  assert.equal(result.saved_before_handoff, true);
  assert.equal(result.thread_id, threadId);
  assert.match(result.bootstrap, /Target method: ZASSIMPLE/);
  assert.match(result.bootstrap, /SAVE TO CROSSAI/);
  assert.match(result.bootstrap, /MOVE TO ANOTHER AI/);
  assert.match(result.bootstrap, /Return from AI/);
  assert.doesNotMatch(JSON.stringify(result), /ct_SECRET_NOT_RETURNED/);

  assert.equal(ctx.calls.create.length, 1);
  assert.match(ctx.calls.create[0].projectId, /^CROSSAI-[0-9A-F]{24}$/);
  assert.equal(ctx.calls.create[0].semanticRecord.route, 'DESIGN');
  assert.equal(ctx.calls.create[0].semanticRecord.method, 'ZASSIMPLE');
  assert.equal(ctx.calls.handoff[0].targetMethod, 'ZASSIMPLE');
  assert.equal(ctx.calls.handoff[0].transition, 'START_DESIGN');
  assert.equal(ctx.calls.ref[0].targetProvider, 'Gemini');
}

{
  const ctx = makeContext();
  const result = ctx.prepareCrossAiConversation({
    start_id: 'cs_TESTSTART123',
    draft: 'hello',
    provider: 'Other'
  });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_PROVIDER');
}

{
  const ctx = makeContext({ ascIsBetaActor_: () => false });
  assert.equal(ctx.prepareCrossAiConversation({
    start_id: 'cs_TESTSTART123',
    draft: 'hello',
    provider: 'ChatGPT'
  }).error.code, 'BETA_ACCESS_REQUIRED');
}

{
  const ctx = makeContext();
  const saved = ctx.saveCrossAiCheckpoint({ return_text: 'AI RESULT BLOCK' });
  assert.equal(saved.ok, true);
  assert.equal(saved.status, 'SAVED');
  assert.equal(saved.revision, 2);
  assert.equal(saved.current, 'Architecture ringkas dipilih.');
  assert.equal(ctx.calls.record.length, 1);
  assert.equal(ctx.calls.apply.length, 1);
  assert.equal(ctx.calls.apply[0].expectedRevision, 1);
  assert.equal(ctx.calls.apply[0].changes.handoff_id, handoffId);
}

console.log('CrossAI protected new-conversation runtime test: PASS');
console.log('blank-account private thread creation: PASS');
console.log('ambiguous intent asks user before creation: PASS');
console.log('private checkpoint save without GitHub project dependency: PASS');
