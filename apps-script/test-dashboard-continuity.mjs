// T-018A — protected project/thread → route/provider handoff binding.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('./DashboardContinuity.gs', import.meta.url), 'utf8');

const threadId = 'th_01ARZ3NDEKTSV4RRFFQ69G5FAV';
const handoffId = 'ho_01ARZ3NDEKTSV4RRFFQ69G5FB6';
const referenceId = 'cr_01ARZ3NDEKTSV4RRFFQ69G5FB8';

function makeContext(overrides = {}) {
  const calls = { handoff: [], reference: [], bootstrap: [], createThread: [], resultRecord: [], saveContracts: [], continuityAdvance: [] };
  const context = {
    calls,
    Utilities: {
      getUuid: () => '12345678-90ab-cdef-1234-567890abcdef'
    },
    ascAuthorizationContext_: () => ({ activeUser: 'owner@example.com', effectiveUser: 'owner@example.com' }),
    ascIsOwner_: () => true,
    getDashboardProject: (projectId) => ({
      ok: true,
      project: { project_id: projectId, source_method: 'ZASSPILL' },
      history: []
    }),
    ascPrivateContinuityStore_: () => ({
      read: () => ({ schema_version: '0.1', projects: {} })
    }),
    ascZasspillListThreads_: (projectId) => ({
      operation: 'LIST_THREADS',
      status: 'LIST_RESULT',
      project_id: projectId,
      threads: [{
        thread_id: threadId,
        revision: 3,
        title: 'Valve calibration proof',
        state: 'ACTIVE',
        current: 'Valve calibration checkpoint is row 18 with target marker 42.'
      }]
    }),
    ascBootstrapPrivateContinuityThread_: (input) => {
      calls.createThread.push(input);
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
      operation: 'GET_BY_ID',
      status: 'FOUND',
      project_id: projectId,
      thread_id: selectedThreadId,
      revision: 3,
      record: {
        semantic_record: {
          title: 'Valve calibration proof',
          continuity: {
            current: 'Valve calibration checkpoint is row 18 with target marker 42.',
            matters: ['preserve exact checkpoint and marker'],
            open: ['continue from this checkpoint']
          }
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
          source_revision: 3,
          target_method: input.targetMethod
        }
      };
    },
    ascZasspillIssueScopedReference_: (input) => {
      calls.reference.push(input);
      return {
        status: 'REFERENCE_ISSUED',
        reference_id: referenceId,
        token: 'ct_PRIVATE_BEARER_MUST_NOT_ESCAPE_0123456789',
        expires_at: '2026-10-04T02:10:00.000Z'
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
        'continuity_reference: ' + input.referenceId,
        'Current: ' + input.minimumRelevantContinuity.current
      ].join('\n');
    },
    ascZasspillCrossMethodService_: () => ({
      getHandoff: ({ projectId, handoffId: requested }) => requested === handoffId
        ? {
            status: 'HANDOFF_FOUND',
            project_id: projectId,
            handoff: {
              handoff_id: handoffId,
              thread_id: threadId,
              source_revision: 3,
              target_method: 'ZASSELECTION'
            }
          }
        : { status: 'HANDOFF_NOT_FOUND', project_id: projectId, handoff_id: requested }
    }),
    ascZasspillReconcileMethodResult_: () => ({ status: 'SAFE_TO_APPLY', expected_revision: 3 }),
    ascZasspillRecordMethodResult_: (input) => {
      calls.resultRecord.push(input);
      return { status: 'METHOD_RESULT_RECORDED', handoff_id: input.resultEnvelope.handoff_id };
    },
    ascProductionAuthorizationPolicy_: (contract) => {
      calls.saveContracts.push(contract);
      return { authorized: true };
    },
    ascSha256Hex_: () => 'a'.repeat(64),
    ascRuntime_: () => ({
      transport: {
        createEnvelope: (contract, options) => ({
          envelope_version: '0.1',
          request_id: options.requestId,
          issued_at: options.issuedAt,
          expires_at: options.expiresAt,
          integrity: { algorithm: 'SHA-256', digest: null },
          contract
        }),
        encodeEnvelope: () => 'SEALED_TEST_PAYLOAD'
      },
      security: {
        sealEnvelope: (envelope) => ({
          ...envelope,
          integrity: { algorithm: 'SHA-256', digest: 'a'.repeat(64) }
        })
      }
    }),
    ...overrides
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

{
  const ctx = makeContext();
  const result = ctx.getDashboardProjectContinuity('AISYNC');
  assert.equal(result.ok, true);
  assert.equal(result.project_id, 'AISYNC');
  assert.equal(result.threads.length, 1);
  assert.equal(result.threads[0].thread_id, threadId);
  assert.equal(result.threads[0].revision, 3);
  assert.equal(result.threads[0].title, 'Valve calibration proof');
  assert.equal(result.threads[0].current, 'Valve calibration checkpoint is row 18 with target marker 42.');
}

{
  const ctx = makeContext();
  const result = ctx.prepareDashboardProjectHandoff({
    project_id: 'AISYNC',
    thread_id: threadId,
    provider: 'Gemini',
    route: 'DECIDE',
    draft: 'Bandingkan dua cara sambung kalibrasi ini.'
  });

  assert.equal(result.ok, true);
  assert.equal(result.provider, 'Gemini');
  assert.equal(result.route, 'DECIDE');
  assert.equal(result.method, 'ZASSELECTION');
  assert.equal(result.provider_url, 'https://gemini.google.com/app');
  assert.match(result.bootstrap, /expected_method_version: 0\.2\.2/);
  assert.match(result.bootstrap, new RegExp(threadId));
  assert.match(result.bootstrap, /source_revision: 3/);
  assert.match(result.bootstrap, new RegExp(handoffId));
  assert.match(result.bootstrap, new RegExp(referenceId));
  assert.match(result.bootstrap, /Bandingkan dua cara sambung kalibrasi ini\./);
  assert.doesNotMatch(JSON.stringify(result), /ct_PRIVATE_BEARER/);

  assert.equal(ctx.calls.handoff.length, 1);
  assert.equal(ctx.calls.handoff[0].targetMethod, 'ZASSELECTION');
  assert.equal(ctx.calls.handoff[0].transition, 'DECIDE');
  assert.equal(ctx.calls.reference.length, 1);
  assert.equal(ctx.calls.reference[0].revision, 3);
  assert.equal(ctx.calls.reference[0].targetProvider, 'Gemini');
  assert.equal(ctx.calls.reference[0].handoffId, handoffId);
  assert.equal(ctx.calls.bootstrap[0].referenceId, referenceId);
}

{
  const ctx = makeContext({ ascIsOwner_: () => false });
  assert.equal(ctx.getDashboardProjectContinuity('AISYNC').error.code, 'BETA_ACCESS_REQUIRED');
  assert.equal(ctx.prepareDashboardProjectHandoff({}).error.code, 'BETA_ACCESS_REQUIRED');
}

{
  const ctx = makeContext();
  assert.equal(ctx.prepareDashboardProjectHandoff({
    project_id: 'AISYNC', thread_id: threadId, provider: 'Other', route: 'DUMP', draft: 'continue'
  }).error.code, 'INVALID_PROVIDER');
  assert.equal(ctx.prepareDashboardProjectHandoff({
    project_id: 'AISYNC', thread_id: threadId, provider: 'ChatGPT', route: 'OTHER', draft: 'continue'
  }).error.code, 'INVALID_ROUTE');
  assert.equal(ctx.prepareDashboardProjectHandoff({
    project_id: 'AISYNC', thread_id: threadId, provider: 'ChatGPT', route: 'DUMP', draft: ''
  }).error.code, 'INVALID_DRAFT');
}

{
  const ctx = makeContext({
    ascZasspillGetById_: () => ({ status: 'THREAD_TOMBSTONED' })
  });
  assert.equal(ctx.prepareDashboardProjectHandoff({
    project_id: 'AISYNC', thread_id: threadId, provider: 'ChatGPT', route: 'DUMP', draft: 'continue'
  }).error.code, 'THREAD_TOMBSTONED');
}

assert.doesNotMatch(source, /token:\s*reference\.token|bootstrap[^\n]*reference\.token/);
assert.match(source, /ttlSeconds:\s*600/);
assert.match(source, /expectedMethodVersion/);
assert.match(source, /ascDashboardHandoffActor_/);

console.log('T-018A dashboard continuity handoff binding: PASS');
console.log('authorized beta/owner project-thread -> route/provider -> scoped handoff: PASS');
console.log('bearer token remains server-side: PASS');

{
  const ctx = makeContext({
    ascZasspillListThreads_: (projectId) => ({ operation: 'LIST_THREADS', status: 'LIST_RESULT', project_id: projectId, threads: [] })
  });
  const result = ctx.createDashboardProjectThread({
    project_id: 'AISYNC',
    title: 'AISYNC integrated UX',
    current: 'Continue T-018 from the production Workspace.'
  });
  assert.equal(result.ok, true);
  assert.equal(result.thread_id, threadId);
  assert.equal(result.revision, 1);
  assert.equal(ctx.calls.createThread.length, 1);
  assert.match(ctx.calls.createThread[0].requestId, /^req_[0-9A-HJKMNP-TV-Z]{26}$/);
  assert.deepEqual(JSON.parse(JSON.stringify(ctx.calls.createThread[0].resolution)), { status: 'NO_MATCH' });
  assert.deepEqual(JSON.parse(JSON.stringify(ctx.calls.createThread[0].semanticRecord)), {
    title: 'AISYNC integrated UX',
    continuity: { current: 'Continue T-018 from the production Workspace.' }
  });
  assert.equal(Object.prototype.hasOwnProperty.call(ctx.calls.createThread[0].semanticRecord, 'state'), false);
}

{
  const ctx = makeContext();
  const result = ctx.createDashboardProjectThread({
    project_id: 'AISYNC', title: 'Second thread', current: 'Do not create when one already exists.'
  });
  assert.equal(result.error.code, 'THREADS_ALREADY_EXIST');
  assert.equal(ctx.calls.createThread.length, 0);
}

{
  const emptyList = (projectId) => ({ operation: 'LIST_THREADS', status: 'LIST_RESULT', project_id: projectId, threads: [] });
  const ctx = makeContext({ ascZasspillListThreads_: emptyList });
  assert.equal(ctx.createDashboardProjectThread({ project_id: 'AISYNC', title: '', current: 'context' }).error.code, 'INVALID_THREAD_TITLE');
  assert.equal(ctx.createDashboardProjectThread({ project_id: 'AISYNC', title: 'Thread', current: '' }).error.code, 'INVALID_THREAD_CURRENT');
}

{
  const ctx = makeContext({ ascIsOwner_: () => false });
  assert.equal(ctx.createDashboardProjectThread({ project_id: 'AISYNC', title: 'Thread', current: 'context' }).error.code, 'BETA_ACCESS_REQUIRED');
}

assert.doesNotMatch(source, /state:\s*['\"]ACTIVE['\"]/);

{
  const ctx = makeContext();
  const handoff = ctx.prepareDashboardProjectHandoff({
    project_id: 'AISYNC',
    thread_id: threadId,
    provider: 'Gemini',
    route: 'DECIDE',
    draft: 'Continue this checkpoint.'
  });
  assert.equal(handoff.ok, true);
  assert.match(handoff.bootstrap, /SAVE \/ return-to-ASC instruction:/);
  assert.match(handoff.bootstrap, /ASC_METHOD_RESULT_BEGIN/);
  assert.match(handoff.bootstrap, /ASC_METHOD_RESULT_END/);
  assert.match(handoff.bootstrap, /CONFIRM & SYNC/);
}

function validMethodResultText(overrides = {}) {
  const result = {
    handoff_id: handoffId,
    thread_id: threadId,
    source_revision: 3,
    producing_method: 'ZASSELECTION',
    result_status: 'CONFIRMED_RESULT',
    confirmed_outcome: 'Option B selected for the next calibration step.',
    still_open: ['verify field timing'],
    artifact_refs: [],
    ...overrides
  };
  return 'ASC_METHOD_RESULT_BEGIN\n' + JSON.stringify(result) + '\nASC_METHOD_RESULT_END';
}

{
  const ctx = makeContext();
  const preview = ctx.previewDashboardMethodReturn({
    project_id: 'AISYNC',
    return_text: validMethodResultText()
  });
  assert.equal(preview.ok, true);
  assert.equal(preview.reconciliation, 'SAFE_TO_APPLY');
  assert.equal(preview.record_id, 'METHOD-RESULT-' + handoffId.slice(3));
  assert.equal(preview.confirmed_outcome, 'Option B selected for the next calibration step.');
  assert.equal(ctx.calls.resultRecord.length, 0, 'preview must not record the method result');
  assert.equal(ctx.calls.saveContracts.length, 0, 'preview must not prepare a production write');
}

{
  const ctx = makeContext();
  const prepared = ctx.prepareDashboardMethodReturnSave({
    project_id: 'AISYNC',
    return_text: validMethodResultText()
  });
  assert.equal(prepared.ok, true);
  assert.equal(prepared.persistence_state, 'NOT_SAVED_YET');
  assert.match(prepared.request_id, /^ASC-T018B-[0-9A-HJKMNP-TV-Z]{26}$/);
  assert.equal(prepared.record_id, 'METHOD-RESULT-' + handoffId.slice(3));
  assert.match(prepared.save_link, /^https:\/\/dzuddiyn\.github\.io\/AISYNC\/asc\/#asc=SEALED_TEST_PAYLOAD$/);
  assert.equal(ctx.calls.resultRecord.length, 1);
  assert.equal(ctx.calls.saveContracts.length, 1);
  const contract = ctx.calls.saveContracts[0];
  assert.equal(contract.Project, 'AISYNC');
  assert.equal(contract['Source method'], 'ZASSELECTION');
  assert.equal(contract.Operation, 'SAVE');
  assert.equal(contract['Record type'], 'method_result');
  assert.equal(contract['Record ID'], 'METHOD-RESULT-' + handoffId.slice(3));
  assert.match(contract['Content/change'], /Option B selected for the next calibration step\./);
  assert.deepEqual(
    JSON.parse(JSON.stringify(contract.Lineage)),
    ['thread:' + threadId, 'handoff:' + handoffId, 'source_revision:3']
  );
  assert.deepEqual(JSON.parse(JSON.stringify(contract.Destination)), ['GitHub']);
}

{
  const ctx = makeContext();
  const proseOnly = ctx.previewDashboardMethodReturn({
    project_id: 'AISYNC',
    return_text: 'State checkpoint updated locally. Files are ready to push.'
  });
  assert.equal(proseOnly.ok, false);
  assert.equal(proseOnly.error.code, 'METHOD_RESULT_BLOCK_MISSING');

  const wrongMethod = ctx.previewDashboardMethodReturn({
    project_id: 'AISYNC',
    return_text: validMethodResultText({ producing_method: 'ZASSIMPLE' })
  });
  assert.equal(wrongMethod.ok, false);
  assert.equal(wrongMethod.error.code, 'METHOD_RESULT_IDENTITY_MISMATCH');
}

{
  const ctx = makeContext({
    ascZasspillReconcileMethodResult_: () => ({
      status: 'RECONCILIATION_REQUIRED',
      source_revision: 3,
      current_revision: 4
    })
  });
  const stale = ctx.previewDashboardMethodReturn({
    project_id: 'AISYNC',
    return_text: validMethodResultText()
  });
  assert.equal(stale.ok, false);
  assert.equal(stale.error.code, 'RECONCILIATION_REQUIRED');
}

{
  const ctx = makeContext({
    ascProductionAuthorizationPolicy_: () => ({ authorized: false })
  });
  const denied = ctx.prepareDashboardMethodReturnSave({
    project_id: 'AISYNC',
    return_text: validMethodResultText()
  });
  assert.equal(denied.ok, false);
  assert.equal(denied.error.code, 'SAVE_NOT_AUTHORIZED');
  assert.equal(ctx.calls.resultRecord.length, 0);
}

console.log('T-018B provider return -> protected ASC SAVE bridge: PASS');
console.log('provider prose cannot masquerade as persistence: PASS');
console.log('preview is non-mutating; secure SAVE still requires CONFIRM & SYNC: PASS');

function t018cResultEnvelope() {
  return {
    handoff_id: handoffId,
    thread_id: threadId,
    source_revision: 3,
    producing_method: 'ZASSELECTION',
    result_status: 'CONFIRMED_RESULT',
    confirmed_outcome: 'Option B selected for the next calibration step.',
    still_open: ['verify field timing'],
    artifact_refs: []
  };
}

function t018cReceiptRow() {
  const recordId = 'METHOD-RESULT-' + handoffId.slice(3);
  const resource = 'dzuddiyn/AISYNC/records/' + recordId + '.md';
  return {
    request_id: 'ASC-T018C-01ARZ3NDEKTSV4RRFFQ69G5FD1',
    project_id: 'AISYNC',
    operation: 'SAVE',
    destination: 'GitHub',
    status: 'SUCCESS',
    affected_resource: resource,
    commit_or_record_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    source_commit: '',
    timestamp: '2026-10-04T07:08:44.048Z',
    failure_reason: '',
    receipt_json: JSON.stringify({
      status: 'SUCCESS',
      affected_resource: resource,
      commit_or_record_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      adapter_outcome: 'VERIFIED_WRITE',
      write_performed: true,
      verified: true
    })
  };
}

function t018cStoreState() {
  return {
    schema_version: '0.1',
    projects: {
      AISYNC: {
        project_id: 'AISYNC',
        threads: {
          [threadId]: {
            project_id: 'AISYNC',
            thread_id: threadId,
            revision: 3,
            semantic_record: {
              title: 'Valve calibration proof',
              continuity: {
                current: 'Valve calibration checkpoint is row 18 with target marker 42.',
                matters: ['preserve exact checkpoint and marker'],
                open: ['continue from this checkpoint']
              }
            }
          }
        },
        handoffs: {
          [handoffId]: {
            handoff_id: handoffId,
            thread_id: threadId,
            source_revision: 3,
            target_method: 'ZASSELECTION',
            result: t018cResultEnvelope(),
            result_recorded_at: '2026-10-04T07:00:00.000Z'
          }
        }
      }
    }
  };
}
{
  const ctx = makeContext({
    getDashboardProject: (projectId) => ({
      ok: true,
      project: { project_id: projectId, source_method: 'ZASSPILL' },
      history: [t018cReceiptRow()]
    }),
    ascPrivateContinuityStore_: () => ({ read: () => t018cStoreState() })
  });
  const result = ctx.getDashboardProjectContinuity('AISYNC');
  assert.equal(result.ok, true);
  assert.equal(result.pending_saved_results.length, 1);
  assert.equal(result.pending_saved_results[0].handoff_id, handoffId);
  assert.equal(result.pending_saved_results[0].source_revision, 3);
  assert.equal(result.pending_saved_results[0].record_id, 'METHOD-RESULT-' + handoffId.slice(3));
  assert.equal(result.pending_saved_results[0].confirmed_outcome, 'Option B selected for the next calibration step.');
}

{
  const ctx = makeContext({
    getDashboardProject: (projectId) => ({
      ok: true,
      project: { project_id: projectId, source_method: 'ZASSPILL' },
      history: [t018cReceiptRow()]
    }),
    ascZasspillCrossMethodService_: () => ({
      getHandoff: () => ({
        status: 'HANDOFF_FOUND',
        project_id: 'AISYNC',
        handoff: {
          handoff_id: handoffId,
          thread_id: threadId,
          source_revision: 3,
          target_method: 'ZASSELECTION',
          result: t018cResultEnvelope()
        }
      })
    }),
    ascApplyPrivateContinuityMutation_: (input) => {
      ctx.calls.continuityAdvance.push(input);
      return {
        status: 'APPLIED',
        project_id: input.projectId,
        request_id: input.requestId,
        thread_id: input.threadId,
        revision: 4,
        event_id: 'ev_01ARZ3NDEKTSV4RRFFQ69G5FC9',
        operation: input.operation
      };
    }
  });
  const result = ctx.advanceDashboardSavedMethodResult({
    project_id: 'AISYNC',
    handoff_id: handoffId
  });
  assert.equal(result.ok, true);
  assert.equal(result.status, 'ADVANCED');
  assert.equal(result.revision, 4);
  assert.equal(result.current, 'Option B selected for the next calibration step.');
  assert.equal(ctx.calls.continuityAdvance.length, 1);
  const mutation = ctx.calls.continuityAdvance[0];
  assert.equal(mutation.requestId, 'req_' + handoffId.slice(3));
  assert.equal(mutation.expectedRevision, 3);
  assert.equal(mutation.operation, 'UPDATE');
  assert.equal(mutation.changes.method_result, 'METHOD-RESULT-' + handoffId.slice(3));
  assert.equal(mutation.changes.handoff_id, handoffId);
  assert.equal(mutation.changes.save_commit, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  assert.equal(mutation.nextSemanticRecord.continuity.current, 'Option B selected for the next calibration step.');
  assert.deepEqual(JSON.parse(JSON.stringify(mutation.nextSemanticRecord.continuity.matters)), ['preserve exact checkpoint and marker']);
  assert.deepEqual(JSON.parse(JSON.stringify(mutation.nextSemanticRecord.continuity.open)), ['verify field timing']);
  assert.deepEqual(JSON.parse(JSON.stringify(mutation.changes.open)), ['verify field timing']);
}
{
  const ctx = makeContext({
    getDashboardProject: (projectId) => ({
      ok: true,
      project: { project_id: projectId, source_method: 'ZASSPILL' },
      history: []
    }),
    ascZasspillCrossMethodService_: () => ({
      getHandoff: () => ({
        status: 'HANDOFF_FOUND',
        project_id: 'AISYNC',
        handoff: {
          handoff_id: handoffId,
          thread_id: threadId,
          source_revision: 3,
          target_method: 'ZASSELECTION',
          result: t018cResultEnvelope()
        }
      })
    }),
    ascApplyPrivateContinuityMutation_: (input) => {
      ctx.calls.continuityAdvance.push(input);
      return { status: 'APPLIED', revision: 4 };
    }
  });
  const denied = ctx.advanceDashboardSavedMethodResult({ project_id: 'AISYNC', handoff_id: handoffId });
  assert.equal(denied.ok, false);
  assert.equal(denied.error.code, 'VERIFIED_SAVE_REQUIRED');
  assert.equal(ctx.calls.continuityAdvance.length, 0);
}

{
  const ctx = makeContext({
    getDashboardProject: (projectId) => ({
      ok: true,
      project: { project_id: projectId, source_method: 'ZASSPILL' },
      history: [t018cReceiptRow()]
    }),
    ascZasspillCrossMethodService_: () => ({
      getHandoff: () => ({
        status: 'HANDOFF_FOUND',
        project_id: 'AISYNC',
        handoff: {
          handoff_id: handoffId,
          thread_id: threadId,
          source_revision: 3,
          target_method: 'ZASSELECTION',
          result: t018cResultEnvelope()
        }
      })
    }),
    ascZasspillGetById_: () => ({
      operation: 'GET_BY_ID',
      status: 'FOUND',
      project_id: 'AISYNC',
      thread_id: threadId,
      revision: 4,
      record: {
        semantic_record: {
          title: 'Valve calibration proof',
          continuity: { current: 'Different newer checkpoint.' }
        }
      }
    }),
    ascReadPrivateContinuityEvents_: () => []
  });
  const stale = ctx.advanceDashboardSavedMethodResult({ project_id: 'AISYNC', handoff_id: handoffId });
  assert.equal(stale.ok, false);
  assert.equal(stale.error.code, 'REVISION_CONFLICT');
}

{
  const ctx = makeContext({
    getDashboardProject: (projectId) => ({
      ok: true,
      project: { project_id: projectId, source_method: 'ZASSPILL' },
      history: [t018cReceiptRow()]
    }),
    ascZasspillCrossMethodService_: () => ({
      getHandoff: () => ({
        status: 'HANDOFF_FOUND',
        project_id: 'AISYNC',
        handoff: {
          handoff_id: handoffId,
          thread_id: threadId,
          source_revision: 3,
          target_method: 'ZASSELECTION',
          result: t018cResultEnvelope()
        }
      })
    }),
    ascZasspillGetById_: () => ({
      operation: 'GET_BY_ID',
      status: 'FOUND',
      project_id: 'AISYNC',
      thread_id: threadId,
      revision: 4,
      record: {
        semantic_record: {
          title: 'Valve calibration proof',
          continuity: { current: 'Option B selected for the next calibration step.' }
        }
      }
    }),
    ascReadPrivateContinuityEvents_: () => [{
      event_id: 'ev_01ARZ3NDEKTSV4RRFFQ69G5FC9',
      thread_id: threadId,
      revision: 4,
      operation: 'UPDATE',
      change: {
        current: 'Option B selected for the next calibration step.',
        method_result: 'METHOD-RESULT-' + handoffId.slice(3),
        handoff_id: handoffId,
        save_commit: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      }
    }]
  });
  const again = ctx.advanceDashboardSavedMethodResult({ project_id: 'AISYNC', handoff_id: handoffId });
  assert.equal(again.ok, true);
  assert.equal(again.status, 'ALREADY_ADVANCED');
  assert.equal(again.revision, 4);
}

console.log('T-018C saved result -> private continuity advance: PASS');
console.log('verified SAVE required; stale revision fails closed; retry idempotent: PASS');
