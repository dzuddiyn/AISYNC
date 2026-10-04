// T-018A — protected project/thread → route/provider handoff binding.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('./DashboardContinuity.gs', import.meta.url), 'utf8');

const threadId = 'th_01ARZ3NDEKTSV4RRFFQ69G5FAV';
const handoffId = 'ho_01ARZ3NDEKTSV4RRFFQ69G5FB6';
const referenceId = 'cr_01ARZ3NDEKTSV4RRFFQ69G5FB8';

function makeContext(overrides = {}) {
  const calls = { handoff: [], reference: [], bootstrap: [], createThread: [] };
  const context = {
    calls,
    Utilities: {
      getUuid: () => '12345678-90ab-cdef-1234-567890abcdef'
    },
    ascAuthorizationContext_: () => ({ activeUser: 'owner@example.com', effectiveUser: 'owner@example.com' }),
    ascIsOwner_: () => true,
    getDashboardProject: (projectId) => ({
      ok: true,
      project: { project_id: projectId, source_method: 'ZASSPILL' }
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
      return { status: 'HANDOFF_CREATED', handoff: { handoff_id: handoffId } };
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
  assert.equal(ctx.getDashboardProjectContinuity('AISYNC').error.code, 'OWNER_REQUIRED');
  assert.equal(ctx.prepareDashboardProjectHandoff({}).error.code, 'OWNER_REQUIRED');
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
assert.match(source, /ascDashboardHandoffOwner_/);

console.log('T-018A dashboard continuity handoff binding: PASS');
console.log('owner-only project/thread -> route/provider -> scoped handoff: PASS');
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
  assert.equal(ctx.createDashboardProjectThread({ project_id: 'AISYNC', title: 'Thread', current: 'context' }).error.code, 'OWNER_REQUIRED');
}

assert.doesNotMatch(source, /state:\s*['\"]ACTIVE['\"]/);
