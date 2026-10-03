import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import {
  createEmptyPrivateContinuityState,
  createInMemoryPrivateContinuityStore,
  createPrivateContinuityService
} from './private-continuity-state.mjs';

const projectId = 'PROJ-ALPHA';
const threadId = 'th_01ARZ3NDEKTSV4RRFFQ69G5FAV';
const event1 = 'ev_01ARZ3NDEKTSV4RRFFQ69G5FAW';
const event2 = 'ev_01ARZ3NDEKTSV4RRFFQ69G5FAX';
const requestCreate = 'req_01ARZ3NDEKTSV4RRFFQ69G5FAY';
const requestMutate = 'req_01ARZ3NDEKTSV4RRFFQ69G5FAZ';
const requestConflict = 'req_01ARZ3NDEKTSV4RRFFQ69G5FB0';
const requestDelete = 'req_01ARZ3NDEKTSV4RRFFQ69G5FB1';
const requestStaleDelete = 'req_01ARZ3NDEKTSV4RRFFQ69G5FB2';

const times = [
  '2026-10-03T03:00:00.000Z',
  '2026-10-03T03:01:00.000Z',
  '2026-10-03T03:02:00.000Z'
];
let timeIndex = 0;
const eventIds = [event1, event2];
let eventIndex = 0;

const fingerprint = text => createHash('sha256').update(text, 'utf8').digest('hex');
const store = createInMemoryPrivateContinuityStore(createEmptyPrivateContinuityState());
const service = createPrivateContinuityService({
  store,
  fingerprint,
  now: () => times[Math.min(timeIndex++, times.length - 1)],
  newThreadId: () => threadId,
  newEventId: () => eventIds[eventIndex++]
});

assert.deepStrictEqual(service.getThread({ projectId, threadId }), {
  status: 'NOT_FOUND',
  project_id: projectId,
  thread_id: threadId
});

const semanticV1 = {
  title: 'Private thread',
  state: 'ACTIVE',
  continuity: {
    current: 'first persisted state'
  }
};

const created = service.bootstrap({
  projectId,
  requestId: requestCreate,
  resolution: { status: 'NO_MATCH' },
  semanticRecord: semanticV1
});
assert.deepStrictEqual(created, {
  status: 'CREATED',
  project_id: projectId,
  request_id: requestCreate,
  thread_id: threadId,
  revision: 1,
  event_id: event1
});

const found1 = service.getThread({ projectId, threadId });
assert.equal(found1.status, 'FOUND');
assert.equal(found1.revision, 1);
assert.deepStrictEqual(found1.record.semantic_record, semanticV1);
assert.equal(found1.record.created_at, '2026-10-03T03:00:00.000Z');
assert.equal(found1.record.semantic_updated_at, '2026-10-03T03:00:00.000Z');

const createEvents = service.readEvents({ projectId, threadId });
assert.equal(createEvents.length, 1);
assert.deepStrictEqual(createEvents[0], {
  event_id: event1,
  thread_id: threadId,
  revision: 1,
  event_type: 'CREATE',
  occurred_at: '2026-10-03T03:00:00.000Z',
  change: semanticV1
});

// Same semantic request and same JSON meaning is idempotent even if key order differs.
const createRetry = service.bootstrap({
  projectId,
  requestId: requestCreate,
  resolution: { status: 'NO_MATCH' },
  semanticRecord: {
    continuity: { current: 'first persisted state' },
    state: 'ACTIVE',
    title: 'Private thread'
  }
});
assert.equal(createRetry.status, 'ALREADY_APPLIED');
assert.equal(createRetry.original_result.thread_id, threadId);
assert.equal(service.getThread({ projectId, threadId }).revision, 1);
assert.equal(service.readEvents({ projectId, threadId }).length, 1);

// Same idempotency key with a different semantic payload is rejected.
const createReuseConflict = service.bootstrap({
  projectId,
  requestId: requestCreate,
  resolution: { status: 'NO_MATCH' },
  semanticRecord: {
    title: 'Different payload',
    state: 'ACTIVE'
  }
});
assert.equal(createReuseConflict.status, 'IDEMPOTENCY_KEY_REUSE_CONFLICT');
assert.equal(service.getThread({ projectId, threadId }).revision, 1);

// Explicit UNIQUE_MATCH attaches; ASC does not create a duplicate.
const attached = service.bootstrap({
  projectId,
  resolution: { status: 'UNIQUE_MATCH', thread_id: threadId }
});
assert.deepStrictEqual(attached, {
  status: 'ATTACHED_EXISTING',
  project_id: projectId,
  thread_id: threadId,
  revision: 1
});
assert.equal(service.listThreads({ projectId }).length, 1);

// Explicit ambiguity remains ambiguity; ASC does not choose.
const ambiguous = service.bootstrap({
  projectId,
  resolution: {
    status: 'MULTIPLE_MATCHES',
    candidate_thread_ids: [threadId, 'th_01ARZ3NDEKTSV4RRFFQ69G5FB3']
  }
});
assert.equal(ambiguous.status, 'NEEDS_CLARIFICATION');
assert.equal(ambiguous.candidate_thread_ids.length, 2);
assert.equal(service.listThreads({ projectId }).length, 1);

// Mutation operation is method-provided. The persistence layer stores it without
// enumerating or inferring ZASSPILL semantic operation rules.
const semanticV2 = {
  title: 'Private thread',
  state: 'ACTIVE',
  continuity: {
    current: 'second persisted state'
  },
  method_owned_extra: {
    untouched: true
  }
};
const mutationInput = {
  projectId,
  requestId: requestMutate,
  threadId,
  expectedRevision: 1,
  operation: 'METHOD_DEFINED_OPERATION',
  changes: {
    current: 'second persisted state'
  },
  nextSemanticRecord: semanticV2
};
const applied = service.applyMutation(mutationInput);
assert.equal(applied.status, 'APPLIED');
assert.equal(applied.revision, 2);
assert.equal(applied.event_id, event2);
assert.equal(applied.operation, 'METHOD_DEFINED_OPERATION');

const found2 = service.getThread({ projectId, threadId });
assert.equal(found2.revision, 2);
assert.deepStrictEqual(found2.record.semantic_record, semanticV2);
assert.equal(found2.record.created_at, '2026-10-03T03:00:00.000Z');
assert.equal(found2.record.semantic_updated_at, '2026-10-03T03:01:00.000Z');
assert.equal(service.readEvents({ projectId, threadId }).length, 2);

// Retry same logical mutation does not bump revision or add an event.
const mutationRetry = service.applyMutation(mutationInput);
assert.equal(mutationRetry.status, 'ALREADY_APPLIED');
assert.equal(mutationRetry.original_result.revision, 2);
assert.equal(service.getThread({ projectId, threadId }).revision, 2);
assert.equal(service.readEvents({ projectId, threadId }).length, 2);

// Caller mutation after persistence cannot mutate stored authority.
semanticV2.continuity.current = 'caller changed object later';
assert.equal(
  service.getThread({ projectId, threadId }).record.semantic_record.continuity.current,
  'second persisted state'
);

// Same request id + different payload is an idempotency conflict.
const mutationReuse = service.applyMutation({
  ...mutationInput,
  nextSemanticRecord: { different: true }
});
assert.equal(mutationReuse.status, 'IDEMPOTENCY_KEY_REUSE_CONFLICT');
assert.equal(service.getThread({ projectId, threadId }).revision, 2);

// Stale write is factual conflict; no last-write-wins and no event.
const stale = service.applyMutation({
  projectId,
  requestId: requestConflict,
  threadId,
  expectedRevision: 1,
  operation: 'METHOD_DEFINED_OPERATION',
  changes: { stale: true },
  nextSemanticRecord: { stale: true }
});
assert.deepStrictEqual(stale, {
  status: 'REVISION_CONFLICT',
  project_id: projectId,
  thread_id: threadId,
  expected_revision: 1,
  current_revision: 2
});
assert.equal(service.getThread({ projectId, threadId }).revision, 2);
assert.equal(service.readEvents({ projectId, threadId }).length, 2);

// Delete also uses optimistic concurrency.
const staleDelete = service.deleteThread({
  projectId,
  requestId: requestStaleDelete,
  threadId,
  expectedRevision: 1
});
assert.equal(staleDelete.status, 'REVISION_CONFLICT');
assert.equal(service.getThread({ projectId, threadId }).status, 'FOUND');

const deleted = service.deleteThread({
  projectId,
  requestId: requestDelete,
  threadId,
  expectedRevision: 2
});
assert.deepStrictEqual(deleted, {
  status: 'DELETED',
  project_id: projectId,
  request_id: requestDelete,
  thread_id: threadId,
  deleted_at: '2026-10-03T03:02:00.000Z'
});

const tombstoned = service.getThread({ projectId, threadId });
assert.equal(tombstoned.status, 'THREAD_TOMBSTONED');
assert.deepStrictEqual(Object.keys(tombstoned.tombstone).sort(), [
  'deleted_at',
  'deletion_request_id',
  'thread_id'
]);
assert.deepStrictEqual(service.readEvents({ projectId, threadId }), []);
assert.deepStrictEqual(service.listThreads({ projectId }), []);

// Delete retry is idempotent and tombstone prevents resurrection.
const deleteRetry = service.deleteThread({
  projectId,
  requestId: requestDelete,
  threadId,
  expectedRevision: 2
});
assert.equal(deleteRetry.status, 'ALREADY_APPLIED');
assert.equal(deleteRetry.original_result.status, 'DELETED');

const tombstoneBootstrap = service.bootstrap({
  projectId,
  resolution: { status: 'UNIQUE_MATCH', thread_id: threadId }
});
assert.equal(tombstoneBootstrap.status, 'THREAD_TOMBSTONED');

// Private store contains no surviving semantic record/event after deletion.
const raw = store.read();
assert.equal(raw.projects[projectId].threads[threadId], undefined);
assert.equal(raw.projects[projectId].events[threadId], undefined);
assert.deepStrictEqual(Object.keys(raw.projects[projectId].tombstones[threadId]).sort(), [
  'deleted_at',
  'deletion_request_id',
  'thread_id'
]);

// Guardrail: the persistence engine must not duplicate method-specific lifecycle
// operation enums or inspect common semantic Thread Record fields.
const source = await readFile(new URL('./private-continuity-state.mjs', import.meta.url), 'utf8');
assert.doesNotMatch(source, /\b(?:CORRECT|RENAME|DORMANT|RESUME|ARCHIVE|REOPEN|SPLIT|MERGE)\b/);
assert.doesNotMatch(source, /\.title\b|\.state\b|\.continuity\b|\.resume_cues\b|\.lineage\b/);

console.log('T-015 private continuity state mechanics: PASS');
console.log('identity/revision/event/idempotency/concurrency/bootstrap/delete: PASS');
console.log('method-specific semantic inference in persistence engine: none');
