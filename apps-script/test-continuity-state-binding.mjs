import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';
import { buildRuntime } from './build-runtime.mjs';

const read = (f) => fs.readFileSync(new URL('./' + f, import.meta.url), 'utf8');
const SHIMS = read('RuntimeShims.gs');
const RUNTIME = read('AscRuntime.gs');
const STORE = read('PrivateContinuityDriveStore.gs');
const BINDING = read('ContinuityState.gs');

assert.equal(RUNTIME, buildRuntime(), 'AscRuntime.gs is stale');
assert.match(RUNTIME, /continuity\/private-continuity-state\.mjs/);
assert.match(RUNTIME, /continuity\/zasspill-continuity\.mjs/);
assert.match(RUNTIME, /continuity\/index-freshness\.mjs/);

function signed(bytes) {
  return Array.from(bytes, b => b > 127 ? b - 256 : b);
}

function createWorld() {
  const properties = new Map();
  const folders = new Map();
  const files = new Map();
  let folderSeq = 0;
  let fileSeq = 0;
  let lockHeld = false;

  class Blob {
    constructor(bytes = []) {
      this.bytes = Array.from(bytes);
    }
    setDataFromString(text) {
      this.bytes = signed(Buffer.from(String(text), 'utf8'));
      return this;
    }
    getBytes() {
      return this.bytes.slice();
    }
    getDataAsString() {
      return Buffer.from(this.bytes.map(b => b & 0xff)).toString('utf8');
    }
  }

  class FakeFile {
    constructor(name, content) {
      this.id = 'file-' + (++fileSeq);
      this.name = name;
      this.content = content;
      this.trashed = false;
      this.createdAt = new Date(1700000000000 + fileSeq);
    }
    getId() { return this.id; }
    getName() { return this.name; }
    getSharingAccess() { return 'PRIVATE'; }
    getBlob() { return { getDataAsString: () => this.content }; }
    setContent(text) { this.content = String(text); return this; }
    setTrashed(value) { this.trashed = Boolean(value); return this; }
    isTrashed() { return this.trashed; }
    getDateCreated() { return new Date(this.createdAt.getTime()); }
  }

  class FakeFolder {
    constructor(name) {
      this.id = 'folder-' + (++folderSeq);
      this.name = name;
      this.fileIds = [];
    }
    getId() { return this.id; }
    getSharingAccess() { return 'PRIVATE'; }
    createFile(name, content) {
      const f = new FakeFile(name, content);
      this.fileIds.push(f.id);
      files.set(f.id, f);
      return f;
    }
    getFiles() {
      const ids = this.fileIds.slice();
      let index = 0;
      return {
        hasNext() {
          while (index < ids.length && files.get(ids[index]).isTrashed()) index += 1;
          return index < ids.length;
        },
        next() {
          if (!this.hasNext()) throw new Error('no more files');
          return files.get(ids[index++]);
        }
      };
    }
  }

  const scriptProperties = {
    getProperty(key) { return properties.has(key) ? properties.get(key) : null; },
    setProperty(key, value) { properties.set(key, String(value)); }
  };

  const context = {
    console,
    Buffer,
    Uint8Array,
    TextEncoder,
    TextDecoder,
    Date,
    Math,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    Error,
    TypeError,
    MimeType: { PLAIN_TEXT: 'text/plain' },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      Charset: { UTF_8: 'UTF_8' },
      newBlob(value) {
        if (Array.isArray(value)) return new Blob(value);
        if (typeof value === 'string') return new Blob(signed(Buffer.from(value, 'utf8')));
        return new Blob();
      },
      base64Decode(value) {
        return signed(Buffer.from(String(value), 'base64'));
      },
      base64Encode(value) {
        return Buffer.from(Array.from(value, b => b & 0xff)).toString('base64');
      },
      computeDigest(_alg, text) {
        return signed(crypto.createHash('sha256').update(String(text), 'utf8').digest());
      },
      getUuid() {
        return '12345678-1234-1234-1234-123456789abc';
      }
    },
    UrlFetchApp: {
      fetch() { throw new Error('network not expected'); }
    },
    PropertiesService: {
      getScriptProperties() { return scriptProperties; }
    },
    LockService: {
      getScriptLock() {
        return {
          tryLock() {
            if (lockHeld) return false;
            lockHeld = true;
            return true;
          },
          releaseLock() { lockHeld = false; }
        };
      }
    },
    DriveApp: {
      Access: { PRIVATE: 'PRIVATE' },
      Permission: { NONE: 'NONE' },
      createFolder(name) {
        const f = new FakeFolder(name);
        folders.set(f.id, f);
        return f;
      },
      getFolderById(id) {
        if (!folders.has(id)) throw new Error('missing folder');
        return folders.get(id);
      },
      getFileById(id) {
        if (!files.has(id)) throw new Error('missing file');
        return files.get(id);
      }
    }
  };

  vm.createContext(context);
  vm.runInContext(SHIMS, context, { filename: 'RuntimeShims.gs' });
  vm.runInContext(RUNTIME, context, { filename: 'AscRuntime.gs' });
  vm.runInContext(STORE, context, { filename: 'PrivateContinuityDriveStore.gs' });
  vm.runInContext(BINDING, context, { filename: 'ContinuityState.gs' });

  return { context, properties, folders, files };
}

const w = createWorld();
const reqCreate = 'req_01ARZ3NDEKTSV4RRFFQ69G5FAY';
const reqUpdate = 'req_01ARZ3NDEKTSV4RRFFQ69G5FAZ';
const reqDelete = 'req_01ARZ3NDEKTSV4RRFFQ69G5FB1';

const created = w.context.ascBootstrapPrivateContinuityThread_({
  projectId: 'ALPHA',
  requestId: reqCreate,
  resolution: { status: 'NO_MATCH' },
  semanticRecord: { arbitrary_method_payload: { value: 1 } }
});
assert.equal(created.status, 'CREATED');
assert.match(created.thread_id, /^th_[0-9A-HJKMNP-TV-Z]{26}$/);
assert.match(created.event_id, /^ev_[0-9A-HJKMNP-TV-Z]{26}$/);
assert.equal(created.revision, 1);

const found = w.context.ascReadPrivateContinuityThread_('ALPHA', created.thread_id);
assert.equal(found.status, 'FOUND');
assert.equal(found.revision, 1);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(found.record.semantic_record)),
  { arbitrary_method_payload: { value: 1 } }
);

const applied = w.context.ascApplyPrivateContinuityMutation_({
  projectId: 'ALPHA',
  requestId: reqUpdate,
  threadId: created.thread_id,
  expectedRevision: 1,
  operation: 'UPSTREAM_DEFINED_OPERATION',
  changes: { arbitrary: 'delta' },
  nextSemanticRecord: { arbitrary_method_payload: { value: 2 } }
});
assert.equal(applied.status, 'APPLIED');
assert.equal(applied.revision, 2);

const stale = w.context.ascApplyPrivateContinuityMutation_({
  projectId: 'ALPHA',
  requestId: 'req_01ARZ3NDEKTSV4RRFFQ69G5FB2',
  threadId: created.thread_id,
  expectedRevision: 1,
  operation: 'UPSTREAM_DEFINED_OPERATION',
  changes: { arbitrary: 'stale' },
  nextSemanticRecord: { arbitrary_method_payload: { value: 3 } }
});
assert.equal(stale.status, 'REVISION_CONFLICT');
assert.equal(stale.current_revision, 2);

const deleted = w.context.ascDeletePrivateContinuityThread_({
  projectId: 'ALPHA',
  requestId: reqDelete,
  threadId: created.thread_id,
  expectedRevision: 2
});
assert.equal(deleted.status, 'DELETED');

const tombstone = w.context.ascReadPrivateContinuityThread_('ALPHA', created.thread_id);
assert.equal(tombstone.status, 'THREAD_TOMBSTONED');
assert.deepStrictEqual(
  Object.keys(JSON.parse(JSON.stringify(tombstone.tombstone))).sort(),
  ['deleted_at', 'deletion_request_id', 'thread_id']
);

const current = w.context.ascAssessProjectIndexFreshness_({
  canonicalRepository: 'dzuddiyn/AISYNC',
  canonicalRef: 'main',
  canonicalCommit: '889bf7d66643e779d59d340a691bf07b0d8e8f06',
  indexedRepository: 'dzuddiyn/AISYNC',
  indexedRef: 'main',
  indexedCommit: '889bf7d66643e779d59d340a691bf07b0d8e8f06',
  checkedAt: '2026-10-03T04:00:00.000Z'
});
assert.equal(current.status, 'CURRENT');

// T-017: private ZASSPILL retrieval / Packet v2 / handoff / scoped-reference bindings.
const zReq = 'req_01ARZ3NDEKTSV4RRFFQ69G5FB3';
const zCreated = w.context.ascBootstrapPrivateContinuityThread_({
  projectId: 'ALPHA',
  requestId: zReq,
  resolution: { status: 'NO_MATCH' },
  semanticRecord: {
    title: 'T-017 Binding Thread',
    state: 'ACTIVE',
    continuity: {
      who: 'private user context',
      about: 'cross AI continuity',
      current: 'binding proof state',
      matters: ['retrieval', 'handoff'],
      open: ['provider continuation'],
      origin: 'user'
    },
    resume_cues: ['binding proof', 'cross ai'],
    lineage: {}
  }
});
assert.equal(zCreated.status, 'CREATED');

const zFound = w.context.ascZasspillGetById_('ALPHA', zCreated.thread_id);
assert.equal(zFound.status, 'FOUND');
assert.equal(zFound.operation, 'GET_BY_ID');

const zResolved = w.context.ascZasspillResolveThread_(
  'ALPHA',
  'T-017 Binding Thread',
  [],
  null
);
assert.equal(zResolved.status, 'UNIQUE_MATCH');
assert.equal(zResolved.thread_id, zCreated.thread_id);

const zList = w.context.ascZasspillListThreads_('ALPHA');
assert.equal(zList.status, 'LIST_RESULT');
assert.equal(zList.threads.length, 1);
assert.equal(Object.prototype.hasOwnProperty.call(zList.threads[0], 'who'), false);

const zPacket = w.context.ascZasspillExportPacketV2_(
  'ALPHA',
  zCreated.thread_id,
  '2026-10-04T02:00:00.000Z',
  { source: 'ASC Private Continuity Store' }
);
assert.equal(zPacket.packet_format_version, 2);
assert.equal(zPacket.packet_state, 'SYNCED');
const zMarkdown = w.context.ascZasspillRenderPacketV2_(zPacket);
const zParsed = w.context.ascZasspillParsePacketV2_(zMarkdown);
assert.equal(zParsed.ok, true);
assert.equal(zParsed.packet.thread_id, zCreated.thread_id);
const zReconcile = w.context.ascZasspillReconcilePacket_(zPacket, zFound, true);
assert.equal(zReconcile.status, 'IN_SYNC');

const zHandoff = w.context.ascZasspillCreateMethodHandoff_({
  projectId: 'ALPHA',
  threadId: zCreated.thread_id,
  sourceMethod: 'ZASSPILL',
  targetMethod: 'ZASSELECTION',
  transition: 'DECIDE',
  minimumRelevantContinuity: {
    current: 'binding proof state',
    matters: ['retrieval', 'handoff'],
    open: ['provider continuation']
  },
  methodLineage: []
});
assert.equal(zHandoff.status, 'HANDOFF_CREATED');

const zResultEnvelope = {
  handoff_id: zHandoff.handoff.handoff_id,
  thread_id: zCreated.thread_id,
  source_revision: 1,
  producing_method: 'ZASSELECTION',
  result_status: 'CONFIRMED_RESULT',
  confirmed_outcome: 'Option B selected',
  still_open: ['provider continuation'],
  artifact_refs: ['selection_matrix_binding']
};
assert.equal(
  w.context.ascZasspillRecordMethodResult_({
    projectId: 'ALPHA',
    resultEnvelope: zResultEnvelope
  }).status,
  'METHOD_RESULT_RECORDED'
);
const zResultReconcile = w.context.ascZasspillReconcileMethodResult_({
  projectId: 'ALPHA',
  resultEnvelope: zResultEnvelope
});
assert.equal(zResultReconcile.status, 'SAFE_TO_APPLY');
assert.equal(zResultReconcile.requires_second_confirmation, false);

const zRef = w.context.ascZasspillIssueScopedReference_({
  projectId: 'ALPHA',
  threadId: zCreated.thread_id,
  revision: 1,
  targetProvider: 'Gemini',
  targetMethod: 'ZASSPILL',
  handoffId: zHandoff.handoff.handoff_id,
  ttlSeconds: 600
});
assert.equal(zRef.status, 'REFERENCE_ISSUED');
assert.match(zRef.token, /^ct_[A-Za-z0-9_-]{32,128}$/);
const zRedeemed = w.context.ascZasspillRedeemScopedReference_({
  projectId: 'ALPHA',
  referenceId: zRef.reference_id,
  token: zRef.token,
  targetProvider: 'Gemini',
  targetMethod: 'ZASSPILL'
});
assert.equal(zRedeemed.status, 'REFERENCE_REDEEMED');
assert.equal(zRedeemed.thread_id, zCreated.thread_id);
assert.equal(
  w.context.ascZasspillRedeemScopedReference_({
    projectId: 'ALPHA',
    referenceId: zRef.reference_id,
    token: zRef.token,
    targetProvider: 'Gemini',
    targetMethod: 'ZASSPILL'
  }).status,
  'REFERENCE_CONSUMED'
);

assert.equal(w.folders.size, 1);
assert.equal(w.files.size, 17, 'eight state mutations must add eight verified backups plus eight next-authority files');
const activeBackups = Array.from(w.files.values()).filter(file =>
  file.getName().startsWith('continuity-backup-v0.1-') && !file.isTrashed()
);
const activeAuthorities = Array.from(w.files.values()).filter(file =>
  file.getName().startsWith('continuity-state-v0.1') && !file.isTrashed()
);
assert.equal(activeBackups.length, 8, 'every changed transaction must retain one verified backup');
assert.equal(activeAuthorities.length, 1, 'Script Property pointer must remain the single active authority');
assert.equal(activeAuthorities[0].getId(), w.properties.get('ASC_CONTINUITY_STATE_FILE_ID'));
assert.ok(w.properties.get('ASC_CONTINUITY_FOLDER_ID'));
assert.ok(w.properties.get('ASC_CONTINUITY_STATE_FILE_ID'));

assert.doesNotMatch(BINDING, /google\.script\.run|doGet|SpreadsheetApp|UrlFetchApp/);
assert.doesNotMatch(BINDING, /ZASSELECTION|ZASSIMPLE/);
assert.match(BINDING, /ascZasspillResolveThread_/);

console.log('T-015 + T-017 Apps Script continuity runtime binding: PASS');
console.log('private Drive store + ZASSPILL retrieval/Packet/handoff/scoped-reference mechanics: PASS');
console.log('public/client continuity mutation surface added: none');
