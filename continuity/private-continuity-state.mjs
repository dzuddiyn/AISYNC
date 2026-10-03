const ULID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.prototype.toString.call(value) === '[object Object]';
}

function cloneJson(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function canonicalJson(value) {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('Non-finite numbers are not supported.');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJson).join(',') + ']';
  }
  if (isPlainObject(value)) {
    return '{' + Object.keys(value).sort().map(function (key) {
      const item = value[key];
      if (item === undefined || typeof item === 'function' || typeof item === 'symbol') {
        throw new TypeError('Unsupported JSON value.');
      }
      return JSON.stringify(key) + ':' + canonicalJson(item);
    }).join(',') + '}';
  }
  throw new TypeError('Only JSON-compatible values are supported.');
}

function assertProjectId(projectId) {
  if (typeof projectId !== 'string' || projectId.length < 1 || projectId.length > 128 || /[\u0000-\u001f]/.test(projectId)) {
    throw new TypeError('projectId must be a non-empty stable identifier.');
  }
}

function assertPrefixedUlid(value, prefix, fieldName) {
  if (typeof value !== 'string' || !value.startsWith(prefix) || !ULID_RE.test(value.slice(prefix.length))) {
    throw new TypeError(fieldName + ' must use ' + prefix + '<ULID>.');
  }
}

function assertRequestId(requestId) {
  assertPrefixedUlid(requestId, 'req_', 'requestId');
}

function assertThreadId(threadId) {
  assertPrefixedUlid(threadId, 'th_', 'threadId');
}

function assertRevision(revision) {
  if (!Number.isSafeInteger(revision) || revision < 1) {
    throw new TypeError('expectedRevision must be a positive integer.');
  }
}

function assertOperation(operation) {
  if (typeof operation !== 'string' || operation.length < 1 || operation.length > 128) {
    throw new TypeError('operation must be a non-empty string.');
  }
}

function assertSemanticRecord(record) {
  if (!isPlainObject(record)) {
    throw new TypeError('semanticRecord must be a plain JSON object.');
  }
  canonicalJson(record);
}

function assertChanges(changes) {
  if (!isPlainObject(changes)) {
    throw new TypeError('changes must be a plain JSON object.');
  }
  canonicalJson(changes);
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
    if (value < 0 || value > 31 || !Number.isFinite(value)) {
      throw new Error('Random source returned an invalid value.');
    }
    output += ULID_ALPHABET[value];
  }
  return output;
}

function defaultIdFactory(prefix, nowMs, random) {
  return prefix + encodeTime(nowMs()) + randomUlidPart(random);
}

export function createEmptyPrivateContinuityState() {
  return {
    schema_version: '0.1',
    projects: {}
  };
}

export function createInMemoryPrivateContinuityStore(initialState = createEmptyPrivateContinuityState()) {
  let state = cloneJson(initialState);

  return {
    read() {
      return cloneJson(state);
    },
    transact(mutator) {
      if (typeof mutator !== 'function') throw new TypeError('mutator is required.');
      const working = cloneJson(state);
      const outcome = mutator(working);
      if (!outcome || typeof outcome !== 'object' || !('result' in outcome)) {
        throw new Error('Transaction mutator must return { result, changed }.');
      }
      if (outcome.changed === true) {
        state = working;
      }
      return cloneJson(outcome.result);
    }
  };
}

function projectState(state, projectId) {
  return state.projects[projectId] || null;
}

function ensureProject(state, projectId) {
  if (!state.projects[projectId]) {
    state.projects[projectId] = {
      project_id: projectId,
      threads: {},
      events: {},
      tombstones: {},
      requests: {}
    };
  }
  return state.projects[projectId];
}

function requestFingerprint(fingerprint, payload) {
  const digest = fingerprint(canonicalJson(payload));
  if (typeof digest !== 'string' || digest.length < 8) {
    throw new Error('fingerprint() must return a stable non-empty string.');
  }
  return digest;
}

function duplicateResult(existing, fingerprintValue) {
  if (!existing) return null;
  if (existing.payload_fingerprint !== fingerprintValue) {
    return {
      status: 'IDEMPOTENCY_KEY_REUSE_CONFLICT',
      request_id: existing.request_id
    };
  }
  return {
    status: 'ALREADY_APPLIED',
    request_id: existing.request_id,
    original_result: cloneJson(existing.result)
  };
}

function makeRecord({ projectId, threadId, revision, createdAt, updatedAt, semanticRecord }) {
  return {
    project_id: projectId,
    thread_id: threadId,
    revision,
    created_at: createdAt,
    semantic_updated_at: updatedAt,
    semantic_record: cloneJson(semanticRecord)
  };
}

function makeEvent({ eventId, threadId, revision, operation, occurredAt, change }) {
  return {
    event_id: eventId,
    thread_id: threadId,
    revision,
    event_type: operation,
    occurred_at: occurredAt,
    change: cloneJson(change)
  };
}

function safeNow(now) {
  const value = now();
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new Error('now() must return an ISO date-time string.');
  }
  return value;
}

export function createPrivateContinuityService({
  store,
  fingerprint,
  now = () => new Date().toISOString(),
  nowMs = () => Date.now(),
  random = () => Math.random(),
  newThreadId,
  newEventId
} = {}) {
  if (!store || typeof store.read !== 'function' || typeof store.transact !== 'function') {
    throw new TypeError('store must provide read() and transact().');
  }
  if (typeof fingerprint !== 'function') {
    throw new TypeError('fingerprint function is required.');
  }

  const threadIdFactory = typeof newThreadId === 'function'
    ? newThreadId
    : () => defaultIdFactory('th_', nowMs, random);
  const eventIdFactory = typeof newEventId === 'function'
    ? newEventId
    : () => defaultIdFactory('ev_', nowMs, random);

  function getThread({ projectId, threadId }) {
    assertProjectId(projectId);
    assertThreadId(threadId);
    const state = store.read();
    const project = projectState(state, projectId);
    if (!project) {
      return { status: 'NOT_FOUND', project_id: projectId, thread_id: threadId };
    }
    if (project.tombstones[threadId]) {
      return {
        status: 'THREAD_TOMBSTONED',
        project_id: projectId,
        thread_id: threadId,
        tombstone: cloneJson(project.tombstones[threadId])
      };
    }
    const record = project.threads[threadId];
    if (!record) {
      return { status: 'NOT_FOUND', project_id: projectId, thread_id: threadId };
    }
    return {
      status: 'FOUND',
      project_id: projectId,
      thread_id: threadId,
      revision: record.revision,
      record: cloneJson(record)
    };
  }

  function listThreads({ projectId }) {
    assertProjectId(projectId);
    const state = store.read();
    const project = projectState(state, projectId);
    if (!project) return [];
    return Object.values(project.threads)
      .map(function (record) {
        return {
          project_id: projectId,
          thread_id: record.thread_id,
          revision: record.revision,
          created_at: record.created_at,
          semantic_updated_at: record.semantic_updated_at
        };
      })
      .sort(function (a, b) {
        return a.thread_id.localeCompare(b.thread_id);
      });
  }

  function readEvents({ projectId, threadId }) {
    assertProjectId(projectId);
    assertThreadId(threadId);
    const state = store.read();
    const project = projectState(state, projectId);
    if (!project) return [];
    if (project.tombstones[threadId]) return [];
    return cloneJson(project.events[threadId] || []);
  }

  function bootstrap({
    projectId,
    requestId,
    resolution,
    semanticRecord
  }) {
    assertProjectId(projectId);
    if (!resolution || typeof resolution !== 'object' || typeof resolution.status !== 'string') {
      throw new TypeError('resolution with explicit status is required.');
    }

    if (resolution.status === 'MULTIPLE_MATCHES') {
      return {
        status: 'NEEDS_CLARIFICATION',
        project_id: projectId,
        candidate_thread_ids: Array.isArray(resolution.candidate_thread_ids)
          ? cloneJson(resolution.candidate_thread_ids)
          : []
      };
    }

    if (resolution.status === 'UNIQUE_MATCH') {
      assertThreadId(resolution.thread_id);
      const current = getThread({ projectId, threadId: resolution.thread_id });
      if (current.status === 'FOUND') {
        return {
          status: 'ATTACHED_EXISTING',
          project_id: projectId,
          thread_id: resolution.thread_id,
          revision: current.revision
        };
      }
      return current.status === 'THREAD_TOMBSTONED'
        ? current
        : {
            status: 'RESOLUTION_TARGET_NOT_FOUND',
            project_id: projectId,
            thread_id: resolution.thread_id
          };
    }

    if (resolution.status !== 'NO_MATCH') {
      return {
        status: 'UNSUPPORTED_RESOLUTION',
        project_id: projectId,
        resolution_status: resolution.status
      };
    }

    assertRequestId(requestId);
    assertSemanticRecord(semanticRecord);

    const payload = {
      project_id: projectId,
      request_id: requestId,
      resolution: { status: 'NO_MATCH' },
      semantic_record: semanticRecord
    };
    const payloadFingerprint = requestFingerprint(fingerprint, payload);

    return store.transact(function (state) {
      const project = ensureProject(state, projectId);
      const duplicate = duplicateResult(project.requests[requestId], payloadFingerprint);
      if (duplicate) return { result: duplicate, changed: false };

      const threadId = threadIdFactory();
      assertThreadId(threadId);
      if (project.threads[threadId] || project.tombstones[threadId]) {
        throw new Error('Generated thread identity collision.');
      }

      const eventId = eventIdFactory();
      assertPrefixedUlid(eventId, 'ev_', 'eventId');
      const timestamp = safeNow(now);
      const record = makeRecord({
        projectId,
        threadId,
        revision: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
        semanticRecord
      });
      const event = makeEvent({
        eventId,
        threadId,
        revision: 1,
        operation: 'CREATE',
        occurredAt: timestamp,
        change: semanticRecord
      });

      project.threads[threadId] = record;
      project.events[threadId] = [event];

      const result = {
        status: 'CREATED',
        project_id: projectId,
        request_id: requestId,
        thread_id: threadId,
        revision: 1,
        event_id: eventId
      };
      project.requests[requestId] = {
        request_id: requestId,
        thread_id: threadId,
        payload_fingerprint: payloadFingerprint,
        result: cloneJson(result)
      };

      return { result, changed: true };
    });
  }

  function applyMutation({
    projectId,
    requestId,
    threadId,
    expectedRevision,
    operation,
    changes,
    nextSemanticRecord
  }) {
    assertProjectId(projectId);
    assertRequestId(requestId);
    assertThreadId(threadId);
    assertRevision(expectedRevision);
    assertOperation(operation);
    assertChanges(changes);
    assertSemanticRecord(nextSemanticRecord);

    const payload = {
      project_id: projectId,
      request_id: requestId,
      thread_id: threadId,
      expected_revision: expectedRevision,
      operation,
      changes,
      next_semantic_record: nextSemanticRecord
    };
    const payloadFingerprint = requestFingerprint(fingerprint, payload);

    return store.transact(function (state) {
      const project = projectState(state, projectId);
      if (!project) {
        return {
          result: { status: 'NOT_FOUND', project_id: projectId, thread_id: threadId },
          changed: false
        };
      }

      const duplicate = duplicateResult(project.requests[requestId], payloadFingerprint);
      if (duplicate) return { result: duplicate, changed: false };

      if (project.tombstones[threadId]) {
        return {
          result: {
            status: 'THREAD_TOMBSTONED',
            project_id: projectId,
            thread_id: threadId,
            tombstone: cloneJson(project.tombstones[threadId])
          },
          changed: false
        };
      }

      const current = project.threads[threadId];
      if (!current) {
        return {
          result: { status: 'NOT_FOUND', project_id: projectId, thread_id: threadId },
          changed: false
        };
      }

      if (current.revision !== expectedRevision) {
        return {
          result: {
            status: 'REVISION_CONFLICT',
            project_id: projectId,
            thread_id: threadId,
            expected_revision: expectedRevision,
            current_revision: current.revision
          },
          changed: false
        };
      }

      const revision = current.revision + 1;
      const timestamp = safeNow(now);
      const eventId = eventIdFactory();
      assertPrefixedUlid(eventId, 'ev_', 'eventId');

      project.threads[threadId] = makeRecord({
        projectId,
        threadId,
        revision,
        createdAt: current.created_at,
        updatedAt: timestamp,
        semanticRecord: nextSemanticRecord
      });
      if (!Array.isArray(project.events[threadId])) project.events[threadId] = [];
      project.events[threadId].push(makeEvent({
        eventId,
        threadId,
        revision,
        operation,
        occurredAt: timestamp,
        change: changes
      }));

      const result = {
        status: 'APPLIED',
        project_id: projectId,
        request_id: requestId,
        thread_id: threadId,
        revision,
        event_id: eventId,
        operation
      };
      project.requests[requestId] = {
        request_id: requestId,
        thread_id: threadId,
        payload_fingerprint: payloadFingerprint,
        result: cloneJson(result)
      };

      return { result, changed: true };
    });
  }

  function deleteThread({
    projectId,
    requestId,
    threadId,
    expectedRevision
  }) {
    assertProjectId(projectId);
    assertRequestId(requestId);
    assertThreadId(threadId);
    assertRevision(expectedRevision);

    const payload = {
      project_id: projectId,
      request_id: requestId,
      thread_id: threadId,
      expected_revision: expectedRevision,
      operation: 'DELETE_THREAD'
    };
    const payloadFingerprint = requestFingerprint(fingerprint, payload);

    return store.transact(function (state) {
      const project = projectState(state, projectId);
      if (!project) {
        return {
          result: { status: 'NOT_FOUND', project_id: projectId, thread_id: threadId },
          changed: false
        };
      }

      const duplicate = duplicateResult(project.requests[requestId], payloadFingerprint);
      if (duplicate) return { result: duplicate, changed: false };

      if (project.tombstones[threadId]) {
        return {
          result: {
            status: 'THREAD_TOMBSTONED',
            project_id: projectId,
            thread_id: threadId,
            tombstone: cloneJson(project.tombstones[threadId])
          },
          changed: false
        };
      }

      const current = project.threads[threadId];
      if (!current) {
        return {
          result: { status: 'NOT_FOUND', project_id: projectId, thread_id: threadId },
          changed: false
        };
      }

      if (current.revision !== expectedRevision) {
        return {
          result: {
            status: 'REVISION_CONFLICT',
            project_id: projectId,
            thread_id: threadId,
            expected_revision: expectedRevision,
            current_revision: current.revision
          },
          changed: false
        };
      }

      const timestamp = safeNow(now);
      delete project.threads[threadId];
      delete project.events[threadId];

      Object.keys(project.requests).forEach(function (key) {
        if (project.requests[key] && project.requests[key].thread_id === threadId) {
          delete project.requests[key];
        }
      });

      project.tombstones[threadId] = {
        thread_id: threadId,
        deleted_at: timestamp,
        deletion_request_id: requestId
      };

      const result = {
        status: 'DELETED',
        project_id: projectId,
        request_id: requestId,
        thread_id: threadId,
        deleted_at: timestamp
      };
      project.requests[requestId] = {
        request_id: requestId,
        thread_id: threadId,
        payload_fingerprint: payloadFingerprint,
        result: cloneJson(result)
      };

      return { result, changed: true };
    });
  }

  return Object.freeze({
    getThread,
    listThreads,
    readEvents,
    bootstrap,
    applyMutation,
    deleteThread
  });
}

export const PRIVATE_CONTINUITY_STATE_VERSION = '0.1';
