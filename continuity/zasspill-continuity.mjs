const ULID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const METHOD = 'ZASSPILL';
const METHOD_VERSION = '1.0.0';
const PACKET_FORMAT_VERSION = 2;
const RESULT_STATUSES = new Set(['CONFIRMED_RESULT', 'UNCONFIRMED_RESULT', 'NO_CHANGE', 'CANCELLED']);
const PACKET_STATES = new Set(['SYNCED', 'LOCAL_CHANGES', 'STANDALONE']);
const THREAD_STATES = new Set(['ACTIVE', 'DORMANT', 'ARCHIVED']);
const RETRIEVAL_OPS = new Set(['GET_BY_ID', 'RESOLVE_THREAD', 'LIST_THREADS']);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]';
}

function cloneJson(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function canonicalJson(value) {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('Non-finite number is not supported.');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  if (isPlainObject(value)) {
    return '{' + Object.keys(value).sort().map(key => {
      if (value[key] === undefined || typeof value[key] === 'function' || typeof value[key] === 'symbol') {
        throw new TypeError('Unsupported JSON value.');
      }
      return JSON.stringify(key) + ':' + canonicalJson(value[key]);
    }).join(',') + '}';
  }
  throw new TypeError('Only JSON-compatible values are supported.');
}

function assertProjectId(projectId) {
  if (typeof projectId !== 'string' || projectId.length < 1 || projectId.length > 128 ||
      /[\u0000-\u001f]/.test(projectId)) {
    throw new TypeError('projectId must be a non-empty stable identifier.');
  }
}

function assertPrefixedUlid(value, prefix, field) {
  if (typeof value !== 'string' || !value.startsWith(prefix) || !ULID_RE.test(value.slice(prefix.length))) {
    throw new TypeError(field + ' must use ' + prefix + '<ULID>.');
  }
}

function assertThreadId(threadId) { assertPrefixedUlid(threadId, 'th_', 'threadId'); }
function assertHandoffId(handoffId) { assertPrefixedUlid(handoffId, 'ho_', 'handoffId'); }
function assertReferenceId(referenceId) { assertPrefixedUlid(referenceId, 'cr_', 'referenceId'); }

function assertRevision(revision, field = 'revision') {
  if (!Number.isSafeInteger(revision) || revision < 1) {
    throw new TypeError(field + ' must be a positive integer.');
  }
}

function nonEmptyString(value, field, max = 256) {
  if (typeof value !== 'string' || value.trim().length < 1 || value.length > max) {
    throw new TypeError(field + ' must be a non-empty string.');
  }
  return value.trim();
}

function encodeTime(timeMs) {
  let value = Math.floor(timeMs);
  let output = '';
  for (let i = 0; i < 10; i += 1) {
    output = ULID_ALPHABET[value % 32] + output;
    value = Math.floor(value / 32);
  }
  return output;
}

function randomUlidPart(random) {
  let output = '';
  for (let i = 0; i < 16; i += 1) {
    const value = Math.floor(random() * 32);
    if (value < 0 || value > 31 || !Number.isFinite(value)) throw new Error('Random source returned invalid value.');
    output += ULID_ALPHABET[value];
  }
  return output;
}

function defaultUlid(prefix, nowMs, random) {
  return prefix + encodeTime(nowMs()) + randomUlidPart(random);
}

function safeNow(now) {
  const value = now();
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) throw new Error('now() must return ISO date-time.');
  return value;
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}_-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function flattenText(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(flattenText).join(' ');
  if (isPlainObject(value)) return Object.values(value).map(flattenText).join(' ');
  return '';
}

function semanticRecordFromWrapper(wrapper) {
  return wrapper && isPlainObject(wrapper.semantic_record) ? wrapper.semantic_record : {};
}

function candidateFields(wrapper) {
  const semantic = semanticRecordFromWrapper(wrapper);
  const continuity = isPlainObject(semantic.continuity) ? semantic.continuity : {};
  const lineage = isPlainObject(semantic.lineage) ? semantic.lineage : {};
  return {
    title: flattenText(semantic.title),
    resume_cues: flattenText(semantic.resume_cues),
    about: flattenText(continuity.about),
    current: flattenText(continuity.current),
    matters: flattenText(continuity.matters),
    open: flattenText(continuity.open),
    lineage: flattenText(lineage),
    state: flattenText(semantic.state)
  };
}

function candidateProjection(wrapper, matchBasis) {
  const semantic = semanticRecordFromWrapper(wrapper);
  const continuity = isPlainObject(semantic.continuity) ? semantic.continuity : {};
  return {
    thread_id: wrapper.thread_id,
    title: typeof semantic.title === 'string' ? semantic.title : '',
    state: THREAD_STATES.has(semantic.state) ? semantic.state : null,
    current: cloneJson(continuity.current ?? null),
    revision: wrapper.revision,
    match_basis: matchBasis || null
  };
}

function explicitThreadId(text) {
  const match = String(text || '').toUpperCase().match(/\bTH_[0-9A-HJKMNP-TV-Z]{26}\b/);
  return match ? match[0].toLowerCase().replace(/^th_/, 'th_').replace(/[a-z]/g, c => c.toUpperCase()).replace(/^TH_/, 'th_') : null;
}

function meaningfulTokens(text) {
  const stop = new Set(['yang','dan','atau','untuk','dengan','ini','itu','the','and','for','with','this','that','dari','pasal','sambung']);
  return normalizeText(text).split(' ').filter(token => token.length >= 3 && !stop.has(token));
}

function minimalCandidateList(candidates) {
  return candidates.map(item => candidateProjection(item.wrapper, item.match_basis));
}

export function createZasspillRetrievalService({ continuityService } = {}) {
  if (!continuityService || typeof continuityService.getThread !== 'function' ||
      typeof continuityService.listThreadRecords !== 'function') {
    throw new TypeError('continuityService must provide getThread() and listThreadRecords().');
  }

  function getById({ projectId, threadId }) {
    assertProjectId(projectId);
    assertThreadId(threadId);
    const result = continuityService.getThread({ projectId, threadId });
    if (!result || typeof result.status !== 'string') throw new Error('Invalid continuity read result.');
    if (result.status === 'FOUND') {
      return {
        operation: 'GET_BY_ID',
        status: 'FOUND',
        project_id: projectId,
        thread_id: threadId,
        revision: result.revision,
        record: cloneJson(result.record)
      };
    }
    if (result.status === 'THREAD_TOMBSTONED') {
      return {
        operation: 'GET_BY_ID',
        status: 'THREAD_TOMBSTONED',
        project_id: projectId,
        thread_id: threadId
      };
    }
    return {
      operation: 'GET_BY_ID',
      status: 'NOT_FOUND',
      project_id: projectId,
      thread_id: threadId
    };
  }

  function listThreads({ projectId }) {
    assertProjectId(projectId);
    const records = continuityService.listThreadRecords({ projectId });
    return {
      operation: 'LIST_THREADS',
      status: 'LIST_RESULT',
      project_id: projectId,
      threads: records.map(wrapper => candidateProjection(wrapper, null))
    };
  }

  function resolveThread({ projectId, cue, exclude = [], lifecycleIntent = null } = {}) {
    assertProjectId(projectId);
    const cueText = nonEmptyString(cue, 'cue', 2000);
    if (!Array.isArray(exclude) || exclude.some(item => typeof item !== 'string')) {
      throw new TypeError('exclude must be a string array.');
    }
    if (lifecycleIntent !== null && !THREAD_STATES.has(lifecycleIntent)) {
      throw new TypeError('lifecycleIntent must be ACTIVE, DORMANT, ARCHIVED, or null.');
    }

    const embeddedId = explicitThreadId(cueText);
    if (embeddedId) {
      const exact = getById({ projectId, threadId: embeddedId });
      if (exact.status === 'FOUND') {
        return {
          operation: 'RESOLVE_THREAD',
          status: 'UNIQUE_MATCH',
          project_id: projectId,
          thread_id: embeddedId,
          candidate: candidateProjection(exact.record, 'exact thread_id')
        };
      }
      if (exact.status === 'THREAD_TOMBSTONED') {
        return {
          operation: 'RESOLVE_THREAD',
          status: 'NO_MATCH',
          project_id: projectId,
          reason: 'exact identity is tombstoned'
        };
      }
      return {
        operation: 'RESOLVE_THREAD',
        status: 'NO_MATCH',
        project_id: projectId,
        reason: 'exact identity not found'
      };
    }

    const records = continuityService.listThreadRecords({ projectId });
    const cueNorm = normalizeText(cueText);
    const excludes = exclude.map(normalizeText).filter(Boolean);
    const eligible = [];

    for (const wrapper of records) {
      const semantic = semanticRecordFromWrapper(wrapper);
      if (lifecycleIntent && semantic.state !== lifecycleIntent) continue;

      const fields = candidateFields(wrapper);
      const allText = normalizeText(Object.values(fields).join(' '));
      if (excludes.some(term => term && allText.includes(term))) continue;

      const titleNorm = normalizeText(fields.title);
      const cues = Array.isArray(semantic.resume_cues) ? semantic.resume_cues.map(normalizeText).filter(Boolean) : [];
      if (titleNorm && titleNorm === cueNorm) {
        eligible.push({ wrapper, strength: 'EXACT_TITLE', match_basis: 'exact title reference' });
        continue;
      }
      if (cues.includes(cueNorm)) {
        eligible.push({ wrapper, strength: 'EXACT_RESUME_CUE', match_basis: 'exact resume cue' });
        continue;
      }

      const cueTokens = meaningfulTokens(cueText);
      const matchedFields = [];
      const distinctMatchedTokens = new Set();
      let phraseMatched = false;
      for (const [field, text] of Object.entries(fields)) {
        const norm = normalizeText(text);
        if (!norm) continue;
        if (cueTokens.length >= 2 && cueNorm.length >= 6 && norm.includes(cueNorm)) {
          matchedFields.push(field + ': phrase');
          phraseMatched = true;
          continue;
        }
        const fieldTokens = new Set(meaningfulTokens(norm));
        const matches = cueTokens.filter(token => fieldTokens.has(token));
        if (matches.length > 0) {
          matches.forEach(token => distinctMatchedTokens.add(token));
          matchedFields.push(field + ': ' + matches.join(', '));
        }
      }
      if (matchedFields.length > 0) {
        eligible.push({
          wrapper,
          strength: phraseMatched || distinctMatchedTokens.size >= 2 ? 'COHERENT_MULTI_FIELD' : 'WEAK',
          match_basis: matchedFields.join('; ')
        });
      }
    }

    const exact = eligible.filter(item => item.strength === 'EXACT_TITLE' || item.strength === 'EXACT_RESUME_CUE');
    if (exact.length === 1) {
      return {
        operation: 'RESOLVE_THREAD',
        status: 'UNIQUE_MATCH',
        project_id: projectId,
        thread_id: exact[0].wrapper.thread_id,
        candidate: candidateProjection(exact[0].wrapper, exact[0].match_basis)
      };
    }
    if (exact.length > 1) {
      return {
        operation: 'RESOLVE_THREAD',
        status: 'MULTIPLE_MATCHES',
        project_id: projectId,
        candidates: minimalCandidateList(exact)
      };
    }

    const coherent = eligible.filter(item => item.strength === 'COHERENT_MULTI_FIELD');
    if (coherent.length === 1) {
      return {
        operation: 'RESOLVE_THREAD',
        status: 'UNIQUE_MATCH',
        project_id: projectId,
        thread_id: coherent[0].wrapper.thread_id,
        candidate: candidateProjection(coherent[0].wrapper, coherent[0].match_basis)
      };
    }
    if (coherent.length > 1 || eligible.length > 1) {
      const candidates = coherent.length > 1 ? coherent : eligible;
      return {
        operation: 'RESOLVE_THREAD',
        status: 'MULTIPLE_MATCHES',
        project_id: projectId,
        candidates: minimalCandidateList(candidates)
      };
    }

    // One weak lexical candidate is deliberately not promoted to identity.
    return {
      operation: 'RESOLVE_THREAD',
      status: 'NO_MATCH',
      project_id: projectId,
      reason: eligible.length === 1 ? 'evidence too weak for identity resolution' : 'no authorized candidate evidence'
    };
  }

  return Object.freeze({ getById, resolveThread, listThreads });
}

function validatePacketSemanticShape(packet) {
  if (typeof packet.title !== 'string') throw new TypeError('packet.title must be a string.');
  if (!THREAD_STATES.has(packet.state)) throw new TypeError('packet.state is invalid.');
  if (!isPlainObject(packet.continuity)) throw new TypeError('packet.continuity must be an object.');
  if (!Array.isArray(packet.resume_cues)) throw new TypeError('packet.resume_cues must be an array.');
  if (!isPlainObject(packet.lineage)) throw new TypeError('packet.lineage must be an object.');
  if (!isPlainObject(packet.provenance)) throw new TypeError('packet.provenance must be an object.');
  canonicalJson(packet.continuity);
  canonicalJson(packet.resume_cues);
  canonicalJson(packet.lineage);
  canonicalJson(packet.provenance);
}

export function validatePortablePacketV2(packet) {
  if (!isPlainObject(packet)) return { valid: false, error: 'PACKET_NOT_OBJECT' };
  if (packet.method !== METHOD || packet.method_version !== METHOD_VERSION ||
      packet.packet_format_version !== PACKET_FORMAT_VERSION) {
    return { valid: false, error: 'PACKET_VERSION_MISMATCH' };
  }
  if (!PACKET_STATES.has(packet.packet_state)) return { valid: false, error: 'PACKET_STATE_INVALID' };

  try {
    validatePacketSemanticShape(packet);
    if (packet.packet_state === 'STANDALONE') {
      if (packet.thread_id != null || packet.base_revision != null) {
        return { valid: false, error: 'STANDALONE_IDENTITY_MUST_BE_OMITTED' };
      }
    } else {
      assertThreadId(packet.thread_id);
      assertRevision(packet.base_revision, 'base_revision');
    }
    if (packet.exported_at != null && (typeof packet.exported_at !== 'string' || Number.isNaN(Date.parse(packet.exported_at)))) {
      return { valid: false, error: 'EXPORTED_AT_INVALID' };
    }
  } catch (error) {
    return { valid: false, error: 'PACKET_SCHEMA_INVALID', message: error.message };
  }
  return { valid: true };
}

export function exportPortablePacketV2({ readResult, exportedAt, provenance = { source: 'ASC' } } = {}) {
  if (!readResult || readResult.status !== 'FOUND' || !readResult.record) {
    throw new TypeError('FOUND readResult is required.');
  }
  const wrapper = readResult.record;
  const semantic = semanticRecordFromWrapper(wrapper);
  const packet = {
    method: METHOD,
    method_version: METHOD_VERSION,
    packet_format_version: PACKET_FORMAT_VERSION,
    thread_id: wrapper.thread_id,
    title: typeof semantic.title === 'string' ? semantic.title : '',
    state: THREAD_STATES.has(semantic.state) ? semantic.state : 'ACTIVE',
    base_revision: wrapper.revision,
    packet_state: 'SYNCED',
    exported_at: exportedAt || null,
    continuity: cloneJson(isPlainObject(semantic.continuity) ? semantic.continuity : {
      who: null, about: null, current: null, matters: null, open: null, origin: null
    }),
    resume_cues: cloneJson(Array.isArray(semantic.resume_cues) ? semantic.resume_cues : []),
    lineage: cloneJson(isPlainObject(semantic.lineage) ? semantic.lineage : {}),
    provenance: cloneJson(provenance)
  };
  const validation = validatePortablePacketV2(packet);
  if (!validation.valid) throw new Error(validation.error);
  return packet;
}

const PACKET_FRONT_KEYS = [
  'method', 'method_version', 'packet_format_version', 'thread_id', 'title', 'state',
  'base_revision', 'packet_state', 'exported_at', 'continuity', 'resume_cues', 'lineage', 'provenance'
];

function yamlScalar(value) {
  return JSON.stringify(value);
}

function humanText(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

export function renderPortablePacketV2(packet) {
  const validation = validatePortablePacketV2(packet);
  if (!validation.valid) throw new Error(validation.error);
  const lines = ['---'];
  for (const key of PACKET_FRONT_KEYS) {
    if (packet[key] === undefined) continue;
    lines.push(key + ': ' + yamlScalar(packet[key]));
  }
  lines.push('---');
  lines.push('');
  lines.push('# ' + (packet.title || 'Untitled continuity'));
  lines.push('');
  lines.push('## Current');
  lines.push(humanText(packet.continuity.current));
  lines.push('');
  lines.push('## Matters');
  lines.push(humanText(packet.continuity.matters));
  lines.push('');
  lines.push('## Open');
  lines.push(humanText(packet.continuity.open));
  lines.push('');
  lines.push('## Resume cues');
  for (const cue of packet.resume_cues) lines.push('- ' + humanText(cue));
  lines.push('');
  return lines.join('\n');
}

function parseFrontValue(raw) {
  try { return JSON.parse(raw); } catch (_error) { return raw.trim(); }
}

export function parsePortablePacketV2(markdown) {
  if (typeof markdown !== 'string' || !markdown.startsWith('---\n')) {
    return { ok: false, error: 'PACKET_FRONT_MATTER_MISSING' };
  }
  const end = markdown.indexOf('\n---\n', 4);
  if (end < 0) return { ok: false, error: 'PACKET_FRONT_MATTER_UNTERMINATED' };
  const front = markdown.slice(4, end).split('\n');
  const packet = {};
  for (const line of front) {
    if (!line.trim()) continue;
    const idx = line.indexOf(':');
    if (idx < 1) return { ok: false, error: 'PACKET_FRONT_MATTER_INVALID' };
    const key = line.slice(0, idx).trim();
    if (!PACKET_FRONT_KEYS.includes(key)) return { ok: false, error: 'PACKET_FRONT_MATTER_UNKNOWN_KEY' };
    if (Object.prototype.hasOwnProperty.call(packet, key)) return { ok: false, error: 'PACKET_FRONT_MATTER_DUPLICATE_KEY' };
    packet[key] = parseFrontValue(line.slice(idx + 1).trim());
  }
  const validation = validatePortablePacketV2(packet);
  if (!validation.valid) return { ok: false, error: validation.error, message: validation.message };
  return { ok: true, packet };
}

export function markPortablePacketLocalChanges(packet, changes) {
  const validation = validatePortablePacketV2(packet);
  if (!validation.valid) throw new Error(validation.error);
  if (packet.packet_state === 'STANDALONE') throw new Error('STANDALONE packet has no ASC base revision.');
  if (!isPlainObject(changes)) throw new TypeError('changes must be an object.');

  const allowed = new Set(['title', 'state', 'continuity', 'resume_cues', 'lineage']);
  if (Object.keys(changes).some(key => !allowed.has(key))) throw new Error('LOCAL_PACKET_CHANGE_FIELD_NOT_ALLOWED');

  const next = cloneJson(packet);
  for (const key of Object.keys(changes)) next[key] = cloneJson(changes[key]);
  next.packet_state = 'LOCAL_CHANGES';
  const nextValidation = validatePortablePacketV2(next);
  if (!nextValidation.valid) throw new Error(nextValidation.error);
  return next;
}

export function reconcilePortablePacket({ packet, ascReadResult, ascAvailable = true } = {}) {
  const validation = validatePortablePacketV2(packet);
  if (!validation.valid) return { status: validation.error };

  if (!ascAvailable) {
    return {
      status: 'ASC_UNAVAILABLE',
      effective_packet_state: 'LOCAL_CHANGES',
      persistence_confirmed: false
    };
  }
  if (packet.packet_state === 'STANDALONE') {
    return { status: 'BOOTSTRAP_REQUIRED', persistence_confirmed: false };
  }
  if (!ascReadResult || typeof ascReadResult.status !== 'string') {
    return { status: 'ASC_READ_INVALID' };
  }
  if (ascReadResult.status === 'THREAD_TOMBSTONED') return { status: 'THREAD_TOMBSTONED' };
  if (ascReadResult.status !== 'FOUND') return { status: 'REVISION_PROVENANCE_MISMATCH' };

  const currentRevision = ascReadResult.revision;
  if (!Number.isSafeInteger(currentRevision) || currentRevision < 1) return { status: 'ASC_READ_INVALID' };
  if (currentRevision < packet.base_revision) {
    return {
      status: 'REVISION_PROVENANCE_MISMATCH',
      base_revision: packet.base_revision,
      current_revision: currentRevision
    };
  }

  if (packet.packet_state === 'SYNCED') {
    if (currentRevision === packet.base_revision) {
      return { status: 'IN_SYNC', base_revision: packet.base_revision, current_revision: currentRevision };
    }
    return {
      status: 'STALE_PACKET',
      alias: 'STALE_SNAPSHOT',
      base_revision: packet.base_revision,
      current_revision: currentRevision,
      authority: 'ASC'
    };
  }

  if (currentRevision === packet.base_revision) {
    return {
      status: 'SAFE_TO_WRITE',
      expected_revision: packet.base_revision,
      current_revision: currentRevision
    };
  }
  return {
    status: 'DIVERGENCE_DETECTED',
    base_revision: packet.base_revision,
    current_revision: currentRevision,
    action: 'RELOAD_AND_RECONCILE'
  };
}

function assertMinimumContinuity(value) {
  if (!isPlainObject(value)) throw new TypeError('minimumRelevantContinuity must be an object.');
  const forbidden = ['transcript', 'provider_profile', 'all_threads', 'full_artifact'];
  if (Object.keys(value).some(key => forbidden.includes(key))) {
    throw new Error('HANDOFF_CONTEXT_TOO_BROAD');
  }
  canonicalJson(value);
}

function ensureAuxProject(state, projectId) {
  if (!state.projects || !isPlainObject(state.projects)) throw new Error('PRIVATE_CONTINUITY_STATE_INVALID');
  if (!state.projects[projectId]) throw new Error('PROJECT_NOT_FOUND');
  const project = state.projects[projectId];
  if (!isPlainObject(project.handoffs)) project.handoffs = {};
  if (!isPlainObject(project.references)) project.references = {};
  return project;
}

export function createCrossMethodContinuityService({
  continuityService,
  store,
  now = () => new Date().toISOString(),
  nowMs = () => Date.now(),
  random = () => Math.random(),
  newHandoffId
} = {}) {
  if (!continuityService || typeof continuityService.getThread !== 'function') {
    throw new TypeError('continuityService is required.');
  }
  if (!store || typeof store.read !== 'function' || typeof store.transact !== 'function') {
    throw new TypeError('store is required.');
  }
  const handoffFactory = typeof newHandoffId === 'function'
    ? newHandoffId
    : () => defaultUlid('ho_', nowMs, random);

  function createHandoff({
    projectId,
    threadId,
    sourceMethod,
    targetMethod,
    transition,
    minimumRelevantContinuity,
    methodLineage = []
  }) {
    assertProjectId(projectId);
    assertThreadId(threadId);
    nonEmptyString(sourceMethod, 'sourceMethod');
    nonEmptyString(targetMethod, 'targetMethod');
    nonEmptyString(transition, 'transition', 512);
    assertMinimumContinuity(minimumRelevantContinuity);
    if (!Array.isArray(methodLineage)) throw new TypeError('methodLineage must be an array.');

    const current = continuityService.getThread({ projectId, threadId });
    if (current.status !== 'FOUND') return cloneJson(current);

    const handoffId = handoffFactory();
    assertHandoffId(handoffId);
    const createdAt = safeNow(now);
    const record = {
      handoff_id: handoffId,
      thread_id: threadId,
      source_method: sourceMethod,
      target_method: targetMethod,
      source_revision: current.revision,
      transition,
      minimum_relevant_continuity: cloneJson(minimumRelevantContinuity),
      method_lineage: cloneJson(methodLineage),
      created_at: createdAt,
      result: null
    };

    return store.transact(function (state) {
      const project = ensureAuxProject(state, projectId);
      if (project.handoffs[handoffId]) throw new Error('HANDOFF_ID_COLLISION');
      project.handoffs[handoffId] = cloneJson(record);
      return {
        result: {
          status: 'HANDOFF_CREATED',
          project_id: projectId,
          handoff: cloneJson(record)
        },
        changed: true
      };
    });
  }

  function getHandoff({ projectId, handoffId }) {
    assertProjectId(projectId);
    assertHandoffId(handoffId);
    const state = store.read();
    const project = state.projects && state.projects[projectId];
    const handoff = project && project.handoffs && project.handoffs[handoffId];
    return handoff
      ? { status: 'HANDOFF_FOUND', project_id: projectId, handoff: cloneJson(handoff) }
      : { status: 'HANDOFF_NOT_FOUND', project_id: projectId, handoff_id: handoffId };
  }

  function recordMethodResult({ projectId, resultEnvelope }) {
    assertProjectId(projectId);
    if (!isPlainObject(resultEnvelope)) throw new TypeError('resultEnvelope is required.');
    assertHandoffId(resultEnvelope.handoff_id);
    assertThreadId(resultEnvelope.thread_id);
    assertRevision(resultEnvelope.source_revision, 'source_revision');
    nonEmptyString(resultEnvelope.producing_method, 'producing_method');
    if (!RESULT_STATUSES.has(resultEnvelope.result_status)) throw new TypeError('result_status is invalid.');
    canonicalJson(resultEnvelope.confirmed_outcome ?? null);
    canonicalJson(resultEnvelope.still_open ?? null);
    canonicalJson(resultEnvelope.artifact_refs ?? []);

    return store.transact(function (state) {
      const project = ensureAuxProject(state, projectId);
      const handoff = project.handoffs[resultEnvelope.handoff_id];
      if (!handoff) {
        return { result: { status: 'HANDOFF_NOT_FOUND', handoff_id: resultEnvelope.handoff_id }, changed: false };
      }
      if (handoff.thread_id !== resultEnvelope.thread_id ||
          handoff.source_revision !== resultEnvelope.source_revision ||
          handoff.target_method !== resultEnvelope.producing_method) {
        return { result: { status: 'METHOD_RESULT_IDENTITY_MISMATCH', handoff_id: resultEnvelope.handoff_id }, changed: false };
      }
      if (handoff.result) {
        if (canonicalJson(handoff.result) === canonicalJson(resultEnvelope)) {
          return { result: { status: 'METHOD_RESULT_ALREADY_RECORDED', handoff_id: resultEnvelope.handoff_id }, changed: false };
        }
        return { result: { status: 'METHOD_RESULT_CONFLICT', handoff_id: resultEnvelope.handoff_id }, changed: false };
      }
      handoff.result = cloneJson(resultEnvelope);
      handoff.result_recorded_at = safeNow(now);
      return {
        result: {
          status: 'METHOD_RESULT_RECORDED',
          handoff_id: resultEnvelope.handoff_id,
          thread_id: resultEnvelope.thread_id,
          result_status: resultEnvelope.result_status
        },
        changed: true
      };
    });
  }

  function reconcileMethodResult({ projectId, resultEnvelope, compatibility = null }) {
    assertProjectId(projectId);
    if (!isPlainObject(resultEnvelope)) throw new TypeError('resultEnvelope is required.');
    assertThreadId(resultEnvelope.thread_id);
    assertRevision(resultEnvelope.source_revision, 'source_revision');
    if (!RESULT_STATUSES.has(resultEnvelope.result_status)) throw new TypeError('result_status is invalid.');

    const current = continuityService.getThread({ projectId, threadId: resultEnvelope.thread_id });
    if (current.status !== 'FOUND') {
      return current.status === 'THREAD_TOMBSTONED'
        ? { status: 'THREAD_TOMBSTONED', thread_id: resultEnvelope.thread_id }
        : { status: 'METHOD_RESULT_THREAD_NOT_FOUND', thread_id: resultEnvelope.thread_id };
    }

    if (resultEnvelope.result_status === 'UNCONFIRMED_RESULT') {
      return {
        status: 'REFERENCE_ONLY',
        thread_id: resultEnvelope.thread_id,
        current_revision: current.revision,
        confirmed_user_truth: false
      };
    }
    if (resultEnvelope.result_status === 'NO_CHANGE') {
      return { status: 'NO_CHANGE', thread_id: resultEnvelope.thread_id, current_revision: current.revision };
    }
    if (resultEnvelope.result_status === 'CANCELLED') {
      return { status: 'CANCELLED', thread_id: resultEnvelope.thread_id, current_revision: current.revision };
    }

    const proposedMutation = {
      confirmed_outcome: cloneJson(resultEnvelope.confirmed_outcome ?? null),
      still_open: cloneJson(resultEnvelope.still_open ?? null),
      artifact_refs: cloneJson(resultEnvelope.artifact_refs ?? []),
      method_lineage: {
        handoff_id: resultEnvelope.handoff_id,
        producing_method: resultEnvelope.producing_method,
        source_revision: resultEnvelope.source_revision,
        result_status: resultEnvelope.result_status
      }
    };

    if (current.revision === resultEnvelope.source_revision) {
      return {
        status: 'SAFE_TO_APPLY',
        thread_id: resultEnvelope.thread_id,
        expected_revision: current.revision,
        proposed_mutation: proposedMutation,
        requires_second_confirmation: false
      };
    }

    if (current.revision < resultEnvelope.source_revision) {
      return {
        status: 'REVISION_PROVENANCE_MISMATCH',
        thread_id: resultEnvelope.thread_id,
        source_revision: resultEnvelope.source_revision,
        current_revision: current.revision
      };
    }

    if (typeof compatibility !== 'function') {
      return {
        status: 'RECONCILIATION_REQUIRED',
        thread_id: resultEnvelope.thread_id,
        source_revision: resultEnvelope.source_revision,
        current_revision: current.revision
      };
    }

    const compatible = compatibility({
      current_record: cloneJson(current.record),
      result_envelope: cloneJson(resultEnvelope)
    });
    if (compatible === true) {
      return {
        status: 'RECONCILE_LATEST',
        thread_id: resultEnvelope.thread_id,
        expected_revision: current.revision,
        source_revision: resultEnvelope.source_revision,
        proposed_mutation: proposedMutation,
        requires_second_confirmation: false
      };
    }
    return {
      status: 'METHOD_RESULT_DIVERGENCE',
      thread_id: resultEnvelope.thread_id,
      source_revision: resultEnvelope.source_revision,
      current_revision: current.revision
    };
  }

  return Object.freeze({ createHandoff, getHandoff, recordMethodResult, reconcileMethodResult });
}

function assertBearerToken(token) {
  if (typeof token !== 'string' || !/^ct_[A-Za-z0-9_-]{32,128}$/.test(token)) {
    throw new TypeError('token must use ct_<opaque bearer secret>.');
  }
}

export function createScopedContinuityReferenceService({
  continuityService,
  store,
  fingerprint,
  now = () => new Date().toISOString(),
  nowMs = () => Date.now(),
  random = () => Math.random(),
  newReferenceId,
  newBearerToken,
  maxTtlSeconds = 1800
} = {}) {
  if (!continuityService || typeof continuityService.getThread !== 'function') throw new TypeError('continuityService is required.');
  if (!store || typeof store.read !== 'function' || typeof store.transact !== 'function') throw new TypeError('store is required.');
  if (typeof fingerprint !== 'function') throw new TypeError('fingerprint is required.');
  if (!Number.isSafeInteger(maxTtlSeconds) || maxTtlSeconds < 60 || maxTtlSeconds > 3600) {
    throw new TypeError('maxTtlSeconds must be between 60 and 3600.');
  }

  const refFactory = typeof newReferenceId === 'function'
    ? newReferenceId
    : () => defaultUlid('cr_', nowMs, random);
  const tokenFactory = typeof newBearerToken === 'function'
    ? newBearerToken
    : () => 'ct_' + defaultUlid('', nowMs, random) + defaultUlid('', nowMs, random).slice(0, 16);

  function issue({
    projectId,
    threadId,
    revision,
    targetProvider,
    targetMethod,
    handoffId = null,
    ttlSeconds = 600
  }) {
    assertProjectId(projectId);
    assertThreadId(threadId);
    assertRevision(revision);
    nonEmptyString(targetProvider, 'targetProvider', 128);
    nonEmptyString(targetMethod, 'targetMethod', 128);
    if (handoffId !== null) assertHandoffId(handoffId);
    if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds < 60 || ttlSeconds > maxTtlSeconds) {
      throw new TypeError('ttlSeconds is outside allowed scope.');
    }

    const current = continuityService.getThread({ projectId, threadId });
    if (current.status !== 'FOUND') return cloneJson(current);
    if (current.revision !== revision) {
      return {
        status: 'REVISION_CONFLICT',
        thread_id: threadId,
        expected_revision: revision,
        current_revision: current.revision
      };
    }

    const referenceId = refFactory();
    assertReferenceId(referenceId);
    const token = tokenFactory();
    assertBearerToken(token);
    const issuedAt = safeNow(now);
    const expiresAt = new Date(Date.parse(issuedAt) + ttlSeconds * 1000).toISOString();
    const tokenHash = fingerprint(token);
    if (typeof tokenHash !== 'string' || tokenHash.length < 8) throw new Error('fingerprint returned invalid hash.');

    return store.transact(function (state) {
      const project = ensureAuxProject(state, projectId);
      if (project.references[referenceId]) throw new Error('REFERENCE_ID_COLLISION');
      project.references[referenceId] = {
        reference_id: referenceId,
        token_hash: tokenHash,
        thread_id: threadId,
        revision,
        target_provider: targetProvider,
        target_method: targetMethod,
        handoff_id: handoffId,
        issued_at: issuedAt,
        expires_at: expiresAt,
        consumed_at: null
      };
      return {
        result: {
          status: 'REFERENCE_ISSUED',
          project_id: projectId,
          reference_id: referenceId,
          token,
          thread_id: threadId,
          revision,
          target_provider: targetProvider,
          target_method: targetMethod,
          handoff_id: handoffId,
          expires_at: expiresAt
        },
        changed: true
      };
    });
  }

  function redeem({ projectId, referenceId, token, targetProvider, targetMethod }) {
    assertProjectId(projectId);
    assertReferenceId(referenceId);
    assertBearerToken(token);
    nonEmptyString(targetProvider, 'targetProvider', 128);
    nonEmptyString(targetMethod, 'targetMethod', 128);

    return store.transact(function (state) {
      const project = state.projects && state.projects[projectId];
      const ref = project && project.references && project.references[referenceId];
      if (!ref) return { result: { status: 'REFERENCE_NOT_FOUND' }, changed: false };
      if (ref.consumed_at) return { result: { status: 'REFERENCE_CONSUMED' }, changed: false };
      const nowIso = safeNow(now);
      if (Date.parse(nowIso) > Date.parse(ref.expires_at)) {
        return { result: { status: 'REFERENCE_EXPIRED' }, changed: false };
      }
      if (ref.target_provider !== targetProvider || ref.target_method !== targetMethod) {
        return { result: { status: 'REFERENCE_SCOPE_MISMATCH' }, changed: false };
      }
      if (fingerprint(token) !== ref.token_hash) {
        return { result: { status: 'REFERENCE_TOKEN_INVALID' }, changed: false };
      }

      const current = project.threads && project.threads[ref.thread_id];
      if (!current) {
        if (project.tombstones && project.tombstones[ref.thread_id]) {
          return { result: { status: 'THREAD_TOMBSTONED' }, changed: false };
        }
        return { result: { status: 'REFERENCE_THREAD_NOT_FOUND' }, changed: false };
      }
      if (current.revision !== ref.revision) {
        return {
          result: {
            status: 'REFERENCE_STALE',
            thread_id: ref.thread_id,
            reference_revision: ref.revision,
            current_revision: current.revision
          },
          changed: false
        };
      }

      ref.consumed_at = nowIso;
      return {
        result: {
          status: 'REFERENCE_REDEEMED',
          project_id: projectId,
          reference_id: referenceId,
          thread_id: ref.thread_id,
          revision: ref.revision,
          handoff_id: ref.handoff_id,
          target_provider: ref.target_provider,
          target_method: ref.target_method
        },
        changed: true
      };
    });
  }

  return Object.freeze({ issue, redeem });
}

export function buildScopedTransferBootstrap({
  threadId,
  sourceRevision,
  targetProvider,
  targetMethod,
  methodGatewayUrl,
  expectedMethodVersion = null,
  handoffId,
  referenceId,
  minimumRelevantContinuity
} = {}) {
  assertThreadId(threadId);
  assertRevision(sourceRevision, 'sourceRevision');
  nonEmptyString(targetProvider, 'targetProvider', 128);
  nonEmptyString(targetMethod, 'targetMethod', 128);
  if (handoffId !== null && handoffId !== undefined) assertHandoffId(handoffId);
  assertReferenceId(referenceId);
  const gateway = nonEmptyString(methodGatewayUrl, 'methodGatewayUrl', 2048);
  if (!/^https:\/\//i.test(gateway)) throw new TypeError('methodGatewayUrl must use HTTPS.');
  if (expectedMethodVersion !== null) nonEmptyString(expectedMethodVersion, 'expectedMethodVersion', 64);
  assertMinimumContinuity(minimumRelevantContinuity);

  const current = minimumRelevantContinuity.current ?? null;
  const matters = minimumRelevantContinuity.matters ?? null;
  const open = minimumRelevantContinuity.open ?? null;
  const title = minimumRelevantContinuity.title ?? null;

  const lines = [
    'Target method: ' + targetMethod,
    'Target provider: ' + targetProvider,
    'Method Gateway URL: ' + gateway
  ];
  if (expectedMethodVersion !== null) {
    lines.push('expected_method_version: ' + expectedMethodVersion);
  }
  lines.push(
    'thread_id: ' + threadId,
    'source_revision: ' + sourceRevision,
    'continuity_reference: ' + referenceId
  );
  if (handoffId !== null && handoffId !== undefined) {
    lines.splice(5, 0, 'handoff_id: ' + handoffId);
  }
  if (title != null) lines.push('Title: ' + humanText(title));
  if (current != null) lines.push('Current: ' + humanText(current));
  if (matters != null) lines.push('Matters: ' + humanText(matters));
  if (open != null) lines.push('Open: ' + humanText(open));
  lines.push('');
  lines.push('Receiver instruction: Read the method from the exact Method Gateway URL above. If that exact URL cannot be fetched, report the failure and do not substitute repository search, raw GitHub, or another source. If expected_method_version is present and the gateway reports a different version, report STALE_METHOD_GATEWAY and stop instead of continuing. Continue this same thread under the stated method using only the transferred context. Do not import provider-held memory/profile unless the user explicitly brings it into the thread.');
  return lines.join('\n');
}

export const ZASSPILL_CONTINUITY_CONSTANTS = Object.freeze({
  method: METHOD,
  methodVersion: METHOD_VERSION,
  packetFormatVersion: PACKET_FORMAT_VERSION,
  retrievalOperations: Object.freeze(Array.from(RETRIEVAL_OPS)),
  packetStates: Object.freeze(Array.from(PACKET_STATES)),
  resultStatuses: Object.freeze(Array.from(RESULT_STATUSES))
});
