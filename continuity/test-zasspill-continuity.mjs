import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import {
  createEmptyPrivateContinuityState,
  createInMemoryPrivateContinuityStore,
  createPrivateContinuityService
} from './private-continuity-state.mjs';
import {
  createZasspillRetrievalService,
  exportPortablePacketV2,
  renderPortablePacketV2,
  parsePortablePacketV2,
  markPortablePacketLocalChanges,
  reconcilePortablePacket,
  createCrossMethodContinuityService,
  createScopedContinuityReferenceService,
  buildScopedTransferBootstrap,
  validatePortablePacketV2
} from './zasspill-continuity.mjs';

const projectId = 'AISYNC';
const ids = {
  a: 'th_01ARZ3NDEKTSV4RRFFQ69G5FAV',
  b: 'th_01ARZ3NDEKTSV4RRFFQ69G5FB0',
  c: 'th_01ARZ3NDEKTSV4RRFFQ69G5FB1',
  ev1: 'ev_01ARZ3NDEKTSV4RRFFQ69G5FAW',
  ev2: 'ev_01ARZ3NDEKTSV4RRFFQ69G5FAX',
  ev3: 'ev_01ARZ3NDEKTSV4RRFFQ69G5FB2',
  ev4: 'ev_01ARZ3NDEKTSV4RRFFQ69G5FB3',
  ev5: 'ev_01ARZ3NDEKTSV4RRFFQ69G5FB4',
  ev6: 'ev_01ARZ3NDEKTSV4RRFFQ69G5FB5',
  ho1: 'ho_01ARZ3NDEKTSV4RRFFQ69G5FB6',
  ref1: 'cr_01ARZ3NDEKTSV4RRFFQ69G5FB7',
  ref2: 'cr_01ARZ3NDEKTSV4RRFFQ69G5FB8'
};
const requests = [
  'req_01ARZ3NDEKTSV4RRFFQ69G5FC0',
  'req_01ARZ3NDEKTSV4RRFFQ69G5FC1',
  'req_01ARZ3NDEKTSV4RRFFQ69G5FC2',
  'req_01ARZ3NDEKTSV4RRFFQ69G5FC3',
  'req_01ARZ3NDEKTSV4RRFFQ69G5FC4',
  'req_01ARZ3NDEKTSV4RRFFQ69G5FC5'
];

const semanticA = {
  title: 'Rumah Kulai',
  state: 'ACTIVE',
  continuity: {
    who: 'family',
    about: 'rumah sewa di Kulai',
    current: 'pilih rumah Taman Putri berdekatan sekolah',
    matters: ['sewa keluarga', 'sekolah anak'],
    open: ['deposit rumah'],
    origin: 'user'
  },
  resume_cues: ['rumah tepi sekolah', 'pindah kulai'],
  lineage: {}
};
const semanticB = {
  title: 'Kerja Data Centre',
  state: 'ACTIVE',
  continuity: {
    who: 'worker',
    about: 'kerja data centre di Kulai',
    current: 'shift 2-2 dan handover operasi',
    matters: ['kerja Kulai', 'safety'],
    open: ['orientasi shift'],
    origin: 'user'
  },
  resume_cues: ['shift 2-2', 'data centre kulai'],
  lineage: {}
};
const semanticC = {
  title: 'Rumah Perlis',
  state: 'ARCHIVED',
  continuity: {
    who: 'family',
    about: 'rumah lama Perlis',
    current: 'historical plan',
    matters: ['Perlis'],
    open: [],
    origin: 'user'
  },
  resume_cues: ['rumah perlis'],
  lineage: {}
};

const store = createInMemoryPrivateContinuityStore(createEmptyPrivateContinuityState());
const fingerprint = text => createHash('sha256').update(text, 'utf8').digest('hex');
let threadIds = [ids.a, ids.b, ids.c];
let eventIds = [ids.ev1, ids.ev2, ids.ev3, ids.ev4, ids.ev5, ids.ev6];
let nowIndex = 0;
const times = [
  '2026-10-04T00:00:00.000Z',
  '2026-10-04T00:01:00.000Z',
  '2026-10-04T00:02:00.000Z',
  '2026-10-04T00:03:00.000Z',
  '2026-10-04T00:04:00.000Z',
  '2026-10-04T00:05:00.000Z',
  '2026-10-04T00:06:00.000Z',
  '2026-10-04T00:07:00.000Z',
  '2026-10-04T00:08:00.000Z'
];
const continuity = createPrivateContinuityService({
  store,
  fingerprint,
  now: () => times[Math.min(nowIndex++, times.length - 1)],
  newThreadId: () => threadIds.shift(),
  newEventId: () => eventIds.shift()
});

for (const [requestId, semantic] of [
  [requests[0], semanticA],
  [requests[1], semanticB],
  [requests[2], semanticC]
]) {
  const created = continuity.bootstrap({
    projectId,
    requestId,
    resolution: { status: 'NO_MATCH' },
    semanticRecord: semantic
  });
  assert.equal(created.status, 'CREATED');
}

const retrieval = createZasspillRetrievalService({ continuityService: continuity });

const found = retrieval.getById({ projectId, threadId: ids.a });
assert.equal(found.operation, 'GET_BY_ID');
assert.equal(found.status, 'FOUND');
assert.equal(found.thread_id, ids.a);

const missing = retrieval.getById({
  projectId,
  threadId: 'th_01ARZ3NDEKTSV4RRFFQ69G5FD0'
});
assert.equal(missing.status, 'NOT_FOUND');

const exactTitle = retrieval.resolveThread({ projectId, cue: 'Rumah Kulai' });
assert.equal(exactTitle.status, 'UNIQUE_MATCH');
assert.equal(exactTitle.thread_id, ids.a);
assert.equal(exactTitle.candidate.match_basis, 'exact title reference');

const exactCue = retrieval.resolveThread({ projectId, cue: 'shift 2-2' });
assert.equal(exactCue.status, 'UNIQUE_MATCH');
assert.equal(exactCue.thread_id, ids.b);

const strongSemantic = retrieval.resolveThread({
  projectId,
  cue: 'rumah sewa sekolah Taman Putri',
  exclude: ['kerja']
});
assert.equal(strongSemantic.status, 'UNIQUE_MATCH');
assert.equal(strongSemantic.thread_id, ids.a);
assert.match(strongSemantic.candidate.match_basis, /about|current|matters/);

const ambiguous = retrieval.resolveThread({ projectId, cue: 'Kulai' });
assert.equal(ambiguous.status, 'MULTIPLE_MATCHES');
assert.equal(ambiguous.candidates.length, 2);
for (const candidate of ambiguous.candidates) {
  assert.deepStrictEqual(
    Object.keys(candidate).sort(),
    ['current', 'match_basis', 'revision', 'state', 'thread_id', 'title'].sort()
  );
  assert.equal(Object.prototype.hasOwnProperty.call(candidate, 'who'), false);
}

const weak = retrieval.resolveThread({ projectId, cue: 'safety' });
assert.equal(weak.status, 'NO_MATCH');
assert.equal(weak.reason, 'evidence too weak for identity resolution');

const historical = retrieval.resolveThread({
  projectId,
  cue: 'Rumah Perlis',
  lifecycleIntent: 'ARCHIVED'
});
assert.equal(historical.status, 'UNIQUE_MATCH');
assert.equal(historical.thread_id, ids.c);
assert.equal(retrieval.getById({ projectId, threadId: ids.c }).record.semantic_record.state, 'ARCHIVED');

const list = retrieval.listThreads({ projectId });
assert.equal(list.operation, 'LIST_THREADS');
assert.equal(list.status, 'LIST_RESULT');
assert.equal(list.threads.length, 3);
assert.equal(Object.prototype.hasOwnProperty.call(list.threads[0], 'record'), false);

// Portable Packet v2 export -> Markdown -> parse round-trip.
const packet = exportPortablePacketV2({
  readResult: found,
  exportedAt: '2026-10-04T01:00:00.000Z',
  provenance: { source: 'ASC Private Continuity Store' }
});
assert.equal(packet.method, 'ZASSPILL');
assert.equal(packet.method_version, '1.0.0');
assert.equal(packet.packet_format_version, 2);
assert.equal(packet.thread_id, ids.a);
assert.equal(packet.base_revision, 1);
assert.equal(packet.packet_state, 'SYNCED');
assert.equal(validatePortablePacketV2(packet).valid, true);

const markdown = renderPortablePacketV2(packet);
assert.match(markdown, /^---\nmethod: "ZASSPILL"/);
assert.match(markdown, /# Rumah Kulai/);
const parsed = parsePortablePacketV2(markdown);
assert.equal(parsed.ok, true);
assert.deepStrictEqual(parsed.packet, packet);

assert.equal(
  reconcilePortablePacket({
    packet,
    ascReadResult: retrieval.getById({ projectId, threadId: ids.a })
  }).status,
  'IN_SYNC'
);

const localPacket = markPortablePacketLocalChanges(packet, {
  continuity: {
    ...packet.continuity,
    current: 'local change not yet persisted'
  }
});
assert.equal(localPacket.packet_state, 'LOCAL_CHANGES');
assert.equal(localPacket.base_revision, 1);
assert.equal(
  reconcilePortablePacket({
    packet: localPacket,
    ascReadResult: retrieval.getById({ projectId, threadId: ids.a })
  }).status,
  'SAFE_TO_WRITE'
);
assert.equal(
  reconcilePortablePacket({ packet: localPacket, ascAvailable: false }).effective_packet_state,
  'LOCAL_CHANGES'
);

// Cross-method handoff is a revision-bound snapshot and does not mutate the thread.
const crossMethod = createCrossMethodContinuityService({
  continuityService: continuity,
  store,
  now: () => '2026-10-04T01:05:00.000Z',
  newHandoffId: () => ids.ho1
});
const handoff = crossMethod.createHandoff({
  projectId,
  threadId: ids.a,
  sourceMethod: 'ZASSPILL',
  targetMethod: 'ZASSELECTION',
  transition: 'DECIDE',
  minimumRelevantContinuity: {
    current: semanticA.continuity.current,
    matters: semanticA.continuity.matters,
    open: semanticA.continuity.open
  },
  methodLineage: []
});
assert.equal(handoff.status, 'HANDOFF_CREATED');
assert.equal(handoff.handoff.thread_id, ids.a);
assert.equal(handoff.handoff.source_revision, 1);
assert.equal(continuity.getThread({ projectId, threadId: ids.a }).revision, 1);

const confirmedResult = {
  handoff_id: ids.ho1,
  thread_id: ids.a,
  source_revision: 1,
  producing_method: 'ZASSELECTION',
  result_status: 'CONFIRMED_RESULT',
  confirmed_outcome: 'Option B selected',
  still_open: ['deposit timing'],
  artifact_refs: ['selection_matrix_001']
};
assert.equal(
  crossMethod.recordMethodResult({ projectId, resultEnvelope: confirmedResult }).status,
  'METHOD_RESULT_RECORDED'
);
const safeResult = crossMethod.reconcileMethodResult({
  projectId,
  resultEnvelope: confirmedResult
});
assert.equal(safeResult.status, 'SAFE_TO_APPLY');
assert.equal(safeResult.expected_revision, 1);
assert.equal(safeResult.requires_second_confirmation, false);
assert.deepStrictEqual(safeResult.proposed_mutation.artifact_refs, ['selection_matrix_001']);
assert.equal(Object.prototype.hasOwnProperty.call(safeResult.proposed_mutation, 'full_artifact'), false);

// Persist an independent live-thread update, making the handoff result stale.
const semanticA2 = {
  ...semanticA,
  continuity: {
    ...semanticA.continuity,
    current: 'newer user context while DECIDE was open'
  }
};
const update2 = continuity.applyMutation({
  projectId,
  requestId: requests[3],
  threadId: ids.a,
  expectedRevision: 1,
  operation: 'UPDATE',
  changes: { current: 'newer user context while DECIDE was open' },
  nextSemanticRecord: semanticA2
});
assert.equal(update2.status, 'APPLIED');
assert.equal(update2.revision, 2);

const staleSynced = reconcilePortablePacket({
  packet,
  ascReadResult: retrieval.getById({ projectId, threadId: ids.a })
});
assert.equal(staleSynced.status, 'STALE_PACKET');
assert.equal(staleSynced.authority, 'ASC');

const divergedLocal = reconcilePortablePacket({
  packet: localPacket,
  ascReadResult: retrieval.getById({ projectId, threadId: ids.a })
});
assert.equal(divergedLocal.status, 'DIVERGENCE_DETECTED');

const staleMethod = crossMethod.reconcileMethodResult({
  projectId,
  resultEnvelope: confirmedResult,
  compatibility: () => false
});
assert.equal(staleMethod.status, 'METHOD_RESULT_DIVERGENCE');
assert.equal(staleMethod.current_revision, 2);

const compatibleMethod = crossMethod.reconcileMethodResult({
  projectId,
  resultEnvelope: confirmedResult,
  compatibility: () => true
});
assert.equal(compatibleMethod.status, 'RECONCILE_LATEST');
assert.equal(compatibleMethod.expected_revision, 2);
assert.equal(compatibleMethod.requires_second_confirmation, false);

const unconfirmed = crossMethod.reconcileMethodResult({
  projectId,
  resultEnvelope: {
    ...confirmedResult,
    result_status: 'UNCONFIRMED_RESULT',
    confirmed_outcome: null
  }
});
assert.equal(unconfirmed.status, 'REFERENCE_ONLY');
assert.equal(unconfirmed.confirmed_user_truth, false);

// Packet claiming a revision newer than ASC is rejected.
const futurePacket = { ...packet, base_revision: 99 };
assert.equal(
  reconcilePortablePacket({
    packet: futurePacket,
    ascReadResult: retrieval.getById({ projectId, threadId: ids.a })
  }).status,
  'REVISION_PROVENANCE_MISMATCH'
);

// Scoped private continuity reference: hashed bearer token, provider/method scope,
// revision binding, expiry, and one-time redemption.
let refIds = [ids.ref1, ids.ref2];
let tokenIds = [
  'ct_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef',
  'ct_0123456789ABCDEFGHIJKLMNOPQRSTUV'
];
let refNow = '2026-10-04T02:00:00.000Z';
const refs = createScopedContinuityReferenceService({
  continuityService: continuity,
  store,
  fingerprint,
  now: () => refNow,
  newReferenceId: () => refIds.shift(),
  newBearerToken: () => tokenIds.shift(),
  maxTtlSeconds: 1800
});

const issued = refs.issue({
  projectId,
  threadId: ids.a,
  revision: 2,
  targetProvider: 'Gemini',
  targetMethod: 'ZASSPILL',
  handoffId: ids.ho1,
  ttlSeconds: 600
});
assert.equal(issued.status, 'REFERENCE_ISSUED');
assert.equal(issued.reference_id, ids.ref1);
assert.equal(issued.token.startsWith('ct_'), true);

assert.equal(
  refs.redeem({
    projectId,
    referenceId: ids.ref1,
    token: issued.token,
    targetProvider: 'ChatGPT',
    targetMethod: 'ZASSPILL'
  }).status,
  'REFERENCE_SCOPE_MISMATCH'
);
assert.equal(
  refs.redeem({
    projectId,
    referenceId: ids.ref1,
    token: 'ct_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    targetProvider: 'Gemini',
    targetMethod: 'ZASSPILL'
  }).status,
  'REFERENCE_TOKEN_INVALID'
);

// A newer revision invalidates an unredeemed continuity reference.
const semanticA3 = {
  ...semanticA2,
  continuity: { ...semanticA2.continuity, current: 'revision 3' }
};
const update3 = continuity.applyMutation({
  projectId,
  requestId: requests[4],
  threadId: ids.a,
  expectedRevision: 2,
  operation: 'UPDATE',
  changes: { current: 'revision 3' },
  nextSemanticRecord: semanticA3
});
assert.equal(update3.status, 'APPLIED');
assert.equal(
  refs.redeem({
    projectId,
    referenceId: ids.ref1,
    token: issued.token,
    targetProvider: 'Gemini',
    targetMethod: 'ZASSPILL'
  }).status,
  'REFERENCE_STALE'
);

const issued2 = refs.issue({
  projectId,
  threadId: ids.a,
  revision: 3,
  targetProvider: 'Gemini',
  targetMethod: 'ZASSPILL',
  handoffId: ids.ho1,
  ttlSeconds: 600
});
const redeemed = refs.redeem({
  projectId,
  referenceId: ids.ref2,
  token: issued2.token,
  targetProvider: 'Gemini',
  targetMethod: 'ZASSPILL'
});
assert.equal(redeemed.status, 'REFERENCE_REDEEMED');
assert.equal(redeemed.thread_id, ids.a);
assert.equal(redeemed.revision, 3);
assert.equal(
  refs.redeem({
    projectId,
    referenceId: ids.ref2,
    token: issued2.token,
    targetProvider: 'Gemini',
    targetMethod: 'ZASSPILL'
  }).status,
  'REFERENCE_CONSUMED'
);

const transferBootstrap = buildScopedTransferBootstrap({
  threadId: ids.a,
  sourceRevision: 3,
  targetProvider: 'Gemini',
  targetMethod: 'ZASSPILL',
  methodGatewayUrl: 'https://dzuddiyn.github.io/AISYNC/method/zasspill/my/',
  expectedMethodVersion: '1.0.0',
  handoffId: ids.ho1,
  referenceId: ids.ref2,
  minimumRelevantContinuity: {
    title: 'Rumah Kulai',
    current: 'revision 3',
    matters: ['sewa keluarga', 'sekolah anak'],
    open: ['deposit rumah']
  }
});
assert.match(transferBootstrap, /Target provider: Gemini/);
assert.match(transferBootstrap, /Method Gateway URL: https:\/\/dzuddiyn\.github\.io\/AISYNC\/method\/zasspill\/my\//);
assert.match(transferBootstrap, /expected_method_version: 1\.0\.0/);
assert.match(transferBootstrap, /source_revision: 3/);
assert.match(transferBootstrap, /continuity_reference: cr_/);
assert.match(transferBootstrap, new RegExp(ids.a));
assert.match(transferBootstrap, /STALE_METHOD_GATEWAY/);
assert.match(transferBootstrap, /do not substitute repository search, raw GitHub/);
assert.doesNotMatch(transferBootstrap, /private user context|provider profile|full transcript/i);
assert.ok(transferBootstrap.length < 1800, 'transfer bootstrap stays short');

// Persisted reference stores only a token hash, not bearer secret or semantic packet.
const raw = store.read();
const persistedRef = raw.projects[projectId].references[ids.ref2];
assert.equal(Object.prototype.hasOwnProperty.call(persistedRef, 'token'), false);
assert.equal(typeof persistedRef.token_hash, 'string');
assert.equal(JSON.stringify(persistedRef).includes(issued2.token), false);

// Retrieval does not mutate revision/event lineage.
const beforeReadEvents = continuity.readEvents({ projectId, threadId: ids.a }).length;
retrieval.getById({ projectId, threadId: ids.a });
retrieval.resolveThread({ projectId, cue: 'Rumah Kulai' });
retrieval.listThreads({ projectId });
assert.equal(continuity.getThread({ projectId, threadId: ids.a }).revision, 3);
assert.equal(continuity.readEvents({ projectId, threadId: ids.a }).length, beforeReadEvents);

// Implementation boundary checks: no provider-held memory enrichment and no numeric
// similarity score is used as identity authority.
const source = await readFile(new URL('./zasspill-continuity.mjs', import.meta.url), 'utf8');
assert.doesNotMatch(source, /embedding|cosine|similarity_score|provider_memory/);
assert.match(source, /evidence too weak for identity resolution/);
assert.match(source, /REFERENCE_SCOPE_MISMATCH/);

console.log('T-017 ZASSPILL continuity/retrieval local contract: PASS');
console.log('retrieval + Packet v2 + reconciliation + method handoff/result + scoped refs: PASS');
console.log('read-only retrieval / provider-memory isolation / no numeric-score authority: PASS');
