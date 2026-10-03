import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const SOURCE = fs.readFileSync(new URL('./PrivateContinuityDriveStore.gs', import.meta.url), 'utf8');

function createWorld({ lockAvailable = true } = {}) {
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
    }
    getId() { return this.id; }
    getName() { return this.name; }
    getBlob() { return new FakeBlob(this); }
    setContent(value) { this.content = value; return this; }
    getSharingAccess() { return this.sharingAccess; }
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
      const file = new FakeFile(name, content);
      this.files.push(file.id);
      files.set(file.id, file);
      return file;
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
  assert.equal(w.files.size, 1, 'store file must be reused');

  const noChange = w.context.ascContinuityStoreTransact_(function (state) {
    assert.equal(state.projects.ALPHA.project_id, 'ALPHA');
    return { changed: false, result: { status: 'READ_ONLY_RESULT' } };
  });
  assert.equal(noChange.status, 'READ_ONLY_RESULT');
  assert.equal(w.lockReleases, 2);
  assert.equal(w.files.size, 1);
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

// Guardrail: backing store is private Drive JSON, not GitHub or Sheets, and it
// contains no method-specific semantic logic.
assert.match(SOURCE, /DriveApp/);
assert.match(SOURCE, /PRIVATE/);
assert.doesNotMatch(SOURCE, /setSharing/);
assert.doesNotMatch(SOURCE, /SpreadsheetApp|UrlFetchApp|github\.com|api\.github\.com/i);
assert.doesNotMatch(SOURCE, /ZASSPILL|ZASSELECTION|ZASSIMPLE/);
assert.doesNotMatch(SOURCE, /\b(?:CORRECT|RENAME|DORMANT|RESUME|ARCHIVE|REOPEN|SPLIT|MERGE)\b/);

console.log('T-015 Apps Script private Drive continuity store binding: PASS');
console.log('dedicated private JSON store + script-lock transaction + read-back verification: PASS');
console.log('GitHub/Sheets authority leakage: none');
