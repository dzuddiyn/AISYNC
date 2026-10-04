import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const SOURCE = fs.readFileSync(new URL('./PrivateContinuityDriveStore.gs', import.meta.url), 'utf8');

function createWorld({ lockAvailable = true, failBackupWrite = false } = {}) {
  const properties = new Map();
  const folders = new Map();
  const files = new Map();
  let folderSeq = 0;
  let fileSeq = 0;
  let lockHeld = false;
  let lockReleases = 0;

  class FakeBlob {
    constructor(file) { this.file = file; }
    getDataAsString() { return this.file.content; }
  }

  class FakeFile {
    constructor(name, content) {
      this.id = 'file-' + (++fileSeq);
      this.name = name;
      this.content = content;
      this.sharingAccess = 'PRIVATE';
      this.trashed = false;
      this.createdAt = new Date(1700000000000 + fileSeq);
    }
    getId() { return this.id; }
    getName() { return this.name; }
    getBlob() { return new FakeBlob(this); }
    setContent(value) { this.content = value; return this; }
    setTrashed(value) { this.trashed = Boolean(value); return this; }
    isTrashed() { return this.trashed; }
    getSharingAccess() { return this.sharingAccess; }
    getDateCreated() { return new Date(this.createdAt.getTime()); }
  }

  class FakeFolder {
    constructor(name) {
      this.id = 'folder-' + (++folderSeq);
      this.name = name;
      this.sharingAccess = 'PRIVATE';
      this.files = [];
    }
    getId() { return this.id; }
    getSharingAccess() { return this.sharingAccess; }
    createFile(name, content) {
      if (failBackupWrite && String(name).startsWith('continuity-backup-v0.1-')) {
        throw new Error('simulated backup write failure');
      }
      const file = new FakeFile(name, content);
      this.files.push(file.id);
      files.set(file.id, file);
      return file;
    }
    getFiles() {
      const ids = this.files.slice();
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
    JSON,
    Object,
    Array,
    Date,
    MimeType: { PLAIN_TEXT: 'text/plain' },
    PropertiesService: {
      getScriptProperties() { return scriptProperties; }
    },
    LockService: {
      getScriptLock() {
        return {
          tryLock(timeout) {
            assert.equal(timeout, 30000);
            if (!lockAvailable || lockHeld) return false;
            lockHeld = true;
            return true;
          },
          releaseLock() {
            assert.equal(lockHeld, true);
            lockHeld = false;
            lockReleases += 1;
          }
        };
      }
    },
    DriveApp: {
      Access: { PRIVATE: 'PRIVATE' },
      Permission: { NONE: 'NONE' },
      createFolder(name) {
        const folder = new FakeFolder(name);
        folders.set(folder.id, folder);
        return folder;
      },
      getFolderById(id) {
        if (!folders.has(id)) throw new Error('folder missing');
        return folders.get(id);
      },
      getFileById(id) {
        if (!files.has(id)) throw new Error('file missing');
        return files.get(id);
      }
    }
  };

  vm.createContext(context);
  vm.runInContext(SOURCE, context, { filename: 'PrivateContinuityDriveStore.gs' });

  return {
    context,
    properties,
    folders,
    files,
    get lockReleases() { return lockReleases; }
  };
}

{
  const w = createWorld();
  const initial = w.context.ascContinuityStoreRead_();
  assert.deepStrictEqual(JSON.parse(JSON.stringify(initial)), {
    schema_version: '0.1',
    projects: {}
  });
  assert.equal(w.folders.size, 1);
  assert.equal(w.files.size, 1);

  const folderId = w.properties.get('ASC_CONTINUITY_FOLDER_ID');
  const fileId = w.properties.get('ASC_CONTINUITY_STATE_FILE_ID');
  assert.ok(folderId);
  assert.ok(fileId);
  assert.equal(w.folders.get(folderId).getSharingAccess(), 'PRIVATE');
  assert.equal(w.files.get(fileId).getSharingAccess(), 'PRIVATE');

  const result = w.context.ascContinuityStoreTransact_(function (state) {
    state.projects.ALPHA = {
      project_id: 'ALPHA',
      threads: {},
      events: {},
      tombstones: {},
      requests: {}
    };
    return {
      changed: true,
      result: { status: 'WROTE', project_id: 'ALPHA' }
    };
  });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(result)), {
    status: 'WROTE',
    project_id: 'ALPHA'
  });
  assert.equal(w.lockReleases, 1);

  const reread = w.context.ascContinuityStoreRead_();
  assert.equal(reread.projects.ALPHA.project_id, 'ALPHA');
  assert.equal(w.folders.size, 1, 'store folder must be reused');
  assert.equal(w.files.size, 3, 'changed transaction must create a verified backup plus next version');
  const nextFileId = w.properties.get('ASC_CONTINUITY_STATE_FILE_ID');
  assert.notEqual(nextFileId, fileId, 'authoritative pointer must move to the verified next version');
  assert.equal(w.files.get(fileId).isTrashed(), true, 'previous version is retired after pointer swap');
  assert.equal(w.files.get(nextFileId).isTrashed(), false);

  const backupFiles = Array.from(w.files.values()).filter(file =>
    file.getName().startsWith('continuity-backup-v0.1-') && !file.isTrashed()
  );
  assert.equal(backupFiles.length, 1);
  const automaticBackup = JSON.parse(backupFiles[0].content);
  assert.equal(automaticBackup.backup_version, '0.1');
  assert.equal(automaticBackup.reason, 'PRE_WRITE');
  assert.equal(automaticBackup.source_state_file_id, fileId);
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(automaticBackup.state)),
    { schema_version: '0.1', projects: {} },
    'automatic backup must preserve the pre-mutation state'
  );

  const noChange = w.context.ascContinuityStoreTransact_(function (state) {
    assert.equal(state.projects.ALPHA.project_id, 'ALPHA');
    return { changed: false, result: { status: 'READ_ONLY_RESULT' } };
  });
  assert.equal(noChange.status, 'READ_ONLY_RESULT');
  assert.equal(w.lockReleases, 2);
  assert.equal(w.files.size, 3, 'read-only transaction must not create backup or version');
}

{
  const w = createWorld({ lockAvailable: false });
  assert.throws(
    () => w.context.ascContinuityStoreTransact_(function () {
      return { changed: false, result: {} };
    }),
    /PRIVATE_CONTINUITY_STORE_LOCK_UNAVAILABLE/
  );
}

{
  const w = createWorld();
  w.context.ascContinuityStoreRead_();
  const fileId = w.properties.get('ASC_CONTINUITY_STATE_FILE_ID');
  w.files.get(fileId).content = '{not-json';
  assert.throws(
    () => w.context.ascContinuityStoreRead_(),
    /PRIVATE_CONTINUITY_STORE_MALFORMED_JSON/
  );
}

{
  const w = createWorld();
  w.context.ascContinuityStoreRead_();
  const fileId = w.properties.get('ASC_CONTINUITY_STATE_FILE_ID');
  w.files.get(fileId).content = JSON.stringify({
    schema_version: '9.9',
    projects: {}
  });
  assert.throws(
    () => w.context.ascContinuityStoreRead_(),
    /PRIVATE_CONTINUITY_STORE_UNSUPPORTED_VERSION/
  );
}

{
  const w = createWorld();
  w.context.ascContinuityStoreRead_();
  const fileId = w.properties.get('ASC_CONTINUITY_STATE_FILE_ID');
  w.files.get(fileId).sharingAccess = 'ANYONE';
  assert.throws(
    () => w.context.ascContinuityStoreRead_(),
    /PRIVATE_CONTINUITY_STORE_NOT_PRIVATE/
  );
}


{
  const w = createWorld();
  w.context.ascContinuityStoreRead_();

  w.context.ascContinuityStoreTransact_(function (state) {
    state.projects.ALPHA = { project_id: 'ALPHA', checkpoint: 'v1' };
    return { changed: true, result: { status: 'V1' } };
  });
  const v1FileId = w.properties.get('ASC_CONTINUITY_STATE_FILE_ID');

  const manual = w.context.ascContinuityCreateBackup_('OPERATOR_CHECKPOINT');
  assert.equal(manual.status, 'BACKUP_CREATED');
  assert.equal(manual.source_state_file_id, v1FileId);
  assert.equal(manual.state_schema_version, '0.1');
  assert.equal(manual.reason, 'OPERATOR_CHECKPOINT');

  const listed = w.context.ascContinuityListBackups_();
  assert.equal(listed.status, 'BACKUP_LIST');
  assert.equal(listed.current_state_file_id, v1FileId);
  const manualListed = listed.backups.find(item => item.backup_id === manual.backup_id);
  assert.ok(manualListed);
  assert.equal(manualListed.valid, true);
  assert.equal(manualListed.project_count, 1);

  w.context.ascContinuityStoreTransact_(function (state) {
    state.projects.ALPHA.checkpoint = 'v2';
    return { changed: true, result: { status: 'V2' } };
  });
  const v2FileId = w.properties.get('ASC_CONTINUITY_STATE_FILE_ID');
  assert.notEqual(v2FileId, v1FileId);
  assert.equal(w.context.ascContinuityStoreRead_().projects.ALPHA.checkpoint, 'v2');

  const restored = w.context.ascContinuityRestoreBackup_({
    backupId: manual.backup_id,
    expectedCurrentFileId: v2FileId
  });
  assert.equal(restored.status, 'RESTORED');
  assert.equal(restored.backup_id, manual.backup_id);
  assert.equal(restored.previous_state_file_id, v2FileId);
  assert.notEqual(restored.restored_state_file_id, v2FileId);
  assert.ok(restored.safety_backup_id);
  assert.equal(restored.state_schema_version, '0.1');
  assert.equal(restored.project_count, 1);
  assert.equal(w.context.ascContinuityStoreRead_().projects.ALPHA.checkpoint, 'v1');

  const safety = JSON.parse(w.files.get(restored.safety_backup_id).content);
  assert.equal(safety.reason, 'PRE_RESTORE');
  assert.equal(safety.source_state_file_id, v2FileId);
  assert.equal(safety.state.projects.ALPHA.checkpoint, 'v2');

  assert.throws(
    () => w.context.ascContinuityRestoreBackup_({
      backupId: manual.backup_id,
      expectedCurrentFileId: v2FileId
    }),
    /PRIVATE_CONTINUITY_RESTORE_CURRENT_CHANGED/
  );
}

{
  const w = createWorld();
  w.context.ascContinuityStoreRead_();
  const backup = w.context.ascContinuityCreateBackup_('SCHEMA_GUARD');
  const currentFileId = w.properties.get('ASC_CONTINUITY_STATE_FILE_ID');
  const backupEnvelope = JSON.parse(w.files.get(backup.backup_id).content);
  backupEnvelope.state_schema_version = '9.9';
  backupEnvelope.state.schema_version = '9.9';
  w.files.get(backup.backup_id).content = JSON.stringify(backupEnvelope);

  assert.throws(
    () => w.context.ascContinuityRestoreBackup_({
      backupId: backup.backup_id,
      expectedCurrentFileId: currentFileId
    }),
    /PRIVATE_CONTINUITY_BACKUP_UNSUPPORTED_STATE_VERSION/
  );
  assert.equal(
    w.properties.get('ASC_CONTINUITY_STATE_FILE_ID'),
    currentFileId,
    'unsupported backup schema must not move the authoritative pointer'
  );
}

{
  const w = createWorld();
  w.context.ascContinuityStoreRead_();
  const ids = [];
  for (let i = 0; i < 22; i += 1) {
    ids.push(w.context.ascContinuityCreateBackup_('RETENTION_' + i).backup_id);
  }
  const listed = w.context.ascContinuityListBackups_();
  assert.equal(listed.backups.length, 20);
  assert.equal(listed.backups.every(item => item.valid === true), true);
  assert.equal(w.files.get(ids[0]).isTrashed(), true);
  assert.equal(w.files.get(ids[1]).isTrashed(), true);
  assert.equal(w.files.get(ids[21]).isTrashed(), false);
}


{
  const w = createWorld({ failBackupWrite: true });
  const initial = w.context.ascContinuityStoreRead_();
  const initialFileId = w.properties.get('ASC_CONTINUITY_STATE_FILE_ID');

  assert.throws(
    () => w.context.ascContinuityStoreTransact_(function (state) {
      state.projects.ALPHA = { project_id: 'ALPHA' };
      return { changed: true, result: { status: 'SHOULD_NOT_COMMIT' } };
    }),
    /PRIVATE_CONTINUITY_BACKUP_WRITE_FAILED/
  );

  assert.equal(
    w.properties.get('ASC_CONTINUITY_STATE_FILE_ID'),
    initialFileId,
    'failed backup must not move the authoritative pointer'
  );
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(w.context.ascContinuityStoreRead_())),
    JSON.parse(JSON.stringify(initial)),
    'failed backup must leave authoritative state unchanged'
  );
}

// Guardrail: backing store is private Drive JSON, not GitHub or Sheets, and it
// contains no method-specific semantic logic.
assert.match(SOURCE, /DriveApp/);
assert.match(SOURCE, /PRIVATE/);
assert.doesNotMatch(SOURCE, /setSharing/);
assert.doesNotMatch(SOURCE, /setContent/);
assert.doesNotMatch(SOURCE, /SpreadsheetApp|UrlFetchApp|github\.com|api\.github\.com/i);
assert.doesNotMatch(SOURCE, /ZASSPILL|ZASSELECTION|ZASSIMPLE/);
assert.doesNotMatch(SOURCE, /\b(?:CORRECT|RENAME|DORMANT|RESUME|ARCHIVE|REOPEN|SPLIT|MERGE)\b/);

console.log('T-015 Apps Script private Drive continuity store binding: PASS');
console.log('dedicated private JSON store + script-lock transaction + read-back verification: PASS');
console.log('GitHub/Sheets authority leakage: none');
console.log('T-019A private continuity backup/restore + retention + schema/current guards: PASS');
