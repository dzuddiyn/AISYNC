import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';

const DASHBOARD = fs.readFileSync(new URL('./DashboardRead.gs', import.meta.url), 'utf8');
const DR = fs.readFileSync(new URL('./DisasterRecovery.gs', import.meta.url), 'utf8');

const schema = {
  PROJECTS: [
    'project_id', 'project_name', 'ui_entry', 'source_method', 'lifecycle_stage',
    'progress_percent', 'progress_summary', 'next_action_plan', 'next_stage',
    'latest_update', 'github_repo', 'source_ref', 'source_artifact', 'source_commit', 'updated_at', 'authority'
  ],
  RECORDS: [
    'project_id', 'record_type', 'record_id', 'status', 'summary', 'lineage_json',
    'source_artifact', 'source_commit', 'canonical_url', 'updated_at', 'authority'
  ],
  ACTION_PLAN: [
    'project_id', 'ap_id', 'status', 'action', 'dependencies', 'pass_condition',
    'source_lineage', 'source_artifact', 'source_commit', 'updated_at'
  ],
  HISTORY: [
    'request_id', 'project_id', 'operation', 'destination', 'status', 'affected_resource',
    'commit_or_record_id', 'source_commit', 'timestamp', 'failure_reason', 'receipt_json'
  ]
};

function sampleDb() {
  return {
    PROJECTS: [
      schema.PROJECTS,
      ['AISYNC', 'AISYNC', 'DESIGN', 'ZASSIMPLE', 'DO IT', '80', 'working', 'AP-013', 'T-019', 'now',
       'dzuddiyn/AISYNC', 'main', 'TASKS.md', '1111111111111111111111111111111111111111', 'now', 'OPERATIONAL_INDEX']
    ],
    RECORDS: [
      schema.RECORDS,
      ['AISYNC', 'DECISION', 'D-031', 'LOCKED', 'production gate', '{}', 'DESIGN.md',
       '1111111111111111111111111111111111111111', '', 'now', 'INDEX']
    ],
    ACTION_PLAN: [
      schema.ACTION_PLAN,
      ['AISYNC', 'AP-013', 'CURRENT', 'reliability', '', 'pass', 'D-031', 'ACTION_PLAN.md',
       '1111111111111111111111111111111111111111', 'now']
    ],
    HISTORY: [
      schema.HISTORY,
      ['req-1', 'AISYNC', 'SAVE', 'GITHUB', 'SUCCESS', 'dzuddiyn/AISYNC/a.md',
       'abc', '1111111111111111111111111111111111111111', 'now', '', '{"status":"SUCCESS"}']
    ]
  };
}

class FakeSheet {
  constructor(name, values = [['']]) {
    this.name = name;
    this.values = values.map(r => r.slice());
  }
  getName() { return this.name; }
  setName(name) { this.name = name; return this; }
  getDataRange() {
    return {
      getDisplayValues: () => this.values.map(r => r.map(v => String(v))),
      getValues: () => this.values.map(r => r.slice())
    };
  }
  getRange(row, col, rows, cols) {
    return {
      setValues: (values) => {
        this.values = values.map(r => r.slice());
        return this;
      }
    };
  }
}

class FakeSpreadsheet {
  constructor(id, title, tabs = null) {
    this.id = id;
    this.title = title;
    this.sheets = [];
    if (tabs) {
      for (const [name, values] of Object.entries(tabs)) {
        this.sheets.push(new FakeSheet(name, values));
      }
    } else {
      this.sheets.push(new FakeSheet('Sheet1', [['']]));
    }
  }
  getId() { return this.id; }
  getSheetByName(name) { return this.sheets.find(s => s.name === name) || null; }
  getSheets() { return this.sheets.slice(); }
  insertSheet(name) {
    const sheet = new FakeSheet(name, [['']]);
    this.sheets.push(sheet);
    return sheet;
  }
}

class FakeDriveFile {
  constructor(id, name, content, shared = false) {
    this.id = id;
    this.name = name;
    this.content = String(content ?? '');
    this.shared = shared;
    this.trashed = false;
  }
  getId() { return this.id; }
  getName() { return this.name; }
  getBlob() { return { getDataAsString: () => this.content }; }
  getSharingAccess() { return this.shared ? 'ANYONE' : 'PRIVATE'; }
  isTrashed() { return this.trashed; }
  setTrashed(v) { this.trashed = Boolean(v); }
}

class FakeFolder {
  constructor(id, name, world) {
    this.id = id;
    this.name = name;
    this.world = world;
    this.shared = false;
  }
  getId() { return this.id; }
  getSharingAccess() { return this.shared ? 'ANYONE' : 'PRIVATE'; }
  createFile(name, content) {
    return this.world.newDriveFile(name, content);
  }
}

function world() {
  const db = sampleDb();
  const props = new Map([
    ['ASC_DB_SPREADSHEET_ID', 'legacy-db'],
    ['ASC_CONTINUITY_FOLDER_ID', 'folder-current'],
    ['ASC_CONTINUITY_STATE_FILE_ID', 'continuity-current'],
    ['ASC_MAIN_UI_URL', 'https://sites.google.com/view/aisync-asc'],
    ['ASC_GITHUB_PROJECT_REGISTRY', '{"AISYNC":{"repository":"dzuddiyn/AISYNC"}}'],
    ['GITHUB_APP_CLIENT_ID', 'Iv1.client'],
    ['GITHUB_APP_INSTALLATION_ID', '12345'],
    ['GITHUB_APP_PRIVATE_KEY', '-----BEGIN PRIVATE KEY-----\\nSECRET\\n-----END PRIVATE KEY-----'],
    ['GITHUB_TOKEN', 'ghp_SECRET']
  ]);

  const continuityState = {
    schema_version: '0.1',
    projects: { AISYNC: { threads: { th_1: { revision: 2 } } } }
  };

  const files = new Map();
  const folders = new Map();
  const spreadsheets = new Map();
  let fileSeq = 1;
  let sheetSeq = 1;
  let folderSeq = 1;

  const w = {
    files, folders, spreadsheets, props,
    newDriveFile(name, content) {
      const id = 'file-' + fileSeq++;
      const f = new FakeDriveFile(id, name, content);
      files.set(id, f);
      return f;
    }
  };

  files.set('continuity-current', new FakeDriveFile(
    'continuity-current',
    'continuity-state-v0.1.json',
    JSON.stringify(continuityState)
  ));
  folders.set('folder-current', new FakeFolder('folder-current', 'continuity', w));
  spreadsheets.set('legacy-db', new FakeSpreadsheet('legacy-db', 'ASC DB', db));

  const ctx = {
    console,
    Date,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Math,
    RegExp,
    Error,
    isNaN,
    parseInt,
    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty: key => props.has(key) ? props.get(key) : null,
          setProperty: (key, value) => { props.set(key, String(value)); },
          deleteProperty: key => { props.delete(key); }
        };
      }
    },
    SpreadsheetApp: {
      openById(id) {
        if (!spreadsheets.has(id)) throw new Error('spreadsheet missing');
        return spreadsheets.get(id);
      },
      create(title) {
        const id = 'sheet-' + sheetSeq++;
        const s = new FakeSpreadsheet(id, title);
        spreadsheets.set(id, s);
        files.set(id, new FakeDriveFile(id, title, 'spreadsheet'));
        return s;
      }
    },
    DriveApp: {
      Access: { PRIVATE: 'PRIVATE' },
      getFileById(id) {
        if (!files.has(id) || files.get(id).trashed) throw new Error('file missing');
        return files.get(id);
      },
      getFolderById(id) {
        if (!folders.has(id)) throw new Error('folder missing');
        return folders.get(id);
      },
      createFolder(name) {
        const id = 'folder-' + folderSeq++;
        const f = new FakeFolder(id, name, w);
        folders.set(id, f);
        return f;
      },
      createFile(name, content) {
        return w.newDriveFile(name, content);
      }
    },
    MimeType: { PLAIN_TEXT: 'text/plain' },
    LockService: {
      getScriptLock() {
        return { tryLock: () => true, releaseLock: () => {} };
      }
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      Charset: { UTF_8: 'UTF_8' },
      computeDigest(_alg, text) {
        return [...crypto.createHash('sha256').update(String(text)).digest()];
      },
      formatDate(date) {
        const d = new Date(date);
        return d.toISOString().replace(/[-:]/g, '').slice(0, 15).replace('T', '-');
      }
    },
    ascAuthorizationContext_: () => ({ owner: true }),
    ascIsOwner_: () => true,
    ascContinuityRequirePrivate_(item) {
      if (!item || item.getSharingAccess() !== 'PRIVATE') {
        throw new Error('PRIVATE_CONTINUITY_STORE_NOT_PRIVATE');
      }
    },
    ascContinuityValidateState_(state) {
      if (!state || state.schema_version !== '0.1' ||
          !state.projects || typeof state.projects !== 'object' || Array.isArray(state.projects)) {
        throw new Error('PRIVATE_CONTINUITY_STORE_UNSUPPORTED_VERSION');
      }
      return state;
    },
    ascContinuityClone_: value => JSON.parse(JSON.stringify(value)),
    ascContinuityReadState_() {
      const id = props.get('ASC_CONTINUITY_STATE_FILE_ID');
      const f = files.get(id);
      if (!f) throw new Error('PRIVATE_CONTINUITY_STORE_FILE_UNAVAILABLE');
      const state = JSON.parse(f.content);
      ctx.ascContinuityValidateState_(state);
      return JSON.parse(JSON.stringify(state));
    },
    ASC_CONTINUITY_STORE_VERSION_: '0.1',
    ASC_CONTINUITY_FILE_PROPERTY_: 'ASC_CONTINUITY_STATE_FILE_ID',
    ASC_CONTINUITY_FOLDER_PROPERTY_: 'ASC_CONTINUITY_FOLDER_ID',
    ASC_CONTINUITY_FOLDER_NAME_: 'AISYNC Private Continuity Store',
    getDashboardProject(projectId) {
      if (projectId !== 'AISYNC') return { ok: false };
      return {
        ok: true,
        project: {
          index_metadata: {
            freshness_evidence: {
              canonical: {
                ok: true,
                repository: 'dzuddiyn/AISYNC',
                ref: 'main',
                commit_sha: '2222222222222222222222222222222222222222',
                fetched_at: '2026-10-04T12:00:00Z'
              }
            }
          }
        }
      };
    }
  };

  vm.createContext(ctx);
  vm.runInContext(DASHBOARD, ctx);
  // DashboardRead defines the real getDashboardProject binding; replace only that
  // external canonical-read boundary for this synthetic DR unit world.
  ctx.getDashboardProject = (projectId) => {
    if (projectId !== 'AISYNC') return { ok: false };
    return {
      ok: true,
      project: {
        index_metadata: {
          freshness_evidence: {
            canonical: {
              ok: true,
              repository: 'dzuddiyn/AISYNC',
              ref: 'main',
              commit_sha: '2222222222222222222222222222222222222222',
              fetched_at: '2026-10-04T12:00:00Z'
            }
          }
        }
      }
    };
  };
  vm.runInContext(DR, ctx);

  return { ctx, w, props, files, folders, spreadsheets, continuityState };
}

const plain = v => JSON.parse(JSON.stringify(v));

// 1. Bundle includes all critical non-secret recovery state and excludes credential values.
{
  const x = world();
  const created = plain(x.ctx.ascCreateDisasterRecoveryBundle_());
  assert.equal(created.status, 'DR_BUNDLE_CREATED');
  assert.equal(created.secrets_included, false);
  const file = x.files.get(created.bundle_file_id);
  assert.equal(file.getSharingAccess(), 'PRIVATE');
  const bundle = JSON.parse(file.content);
  assert.equal(bundle.bundle_version, '0.1');
  assert.equal(bundle.asc_db.schema_version, '0.1');
  assert.equal(bundle.private_continuity.schema_version, '0.1');
  assert.equal(bundle.source.canonical_github.commit_sha, '2222222222222222222222222222222222222222');
  assert.equal(bundle.nonsecret_config.credential_presence.github_app_private_key, true);
  assert.equal(bundle.nonsecret_config.credential_presence.legacy_github_read_token, true);
  assert.equal(file.content.includes('ghp_SECRET'), false);
  assert.equal(file.content.includes('BEGIN PRIVATE KEY'), false);

  const valid = plain(x.ctx.ascValidateDisasterRecoveryBundle_(created.bundle_file_id));
  assert.equal(valid.status, 'DR_BUNDLE_VALID');
  assert.equal(valid.bundle_sha256, created.bundle_sha256);
}

// 2. Bundle checksum/version/schema corruption fails closed.
{
  const x = world();
  const created = x.ctx.ascCreateDisasterRecoveryBundle_();
  const file = x.files.get(created.bundle_file_id);
  const original = JSON.parse(file.content);

  const checksumBad = structuredClone(original);
  checksumBad.asc_db.tabs.PROJECTS.values[1][0] = 'MUTATED';
  file.content = JSON.stringify(checksumBad);
  assert.throws(
    () => x.ctx.ascValidateDisasterRecoveryBundle_(file.id),
    /DR_BUNDLE_CHECKSUM_MISMATCH/
  );

  const versionBad = structuredClone(original);
  versionBad.bundle_version = '9.9';
  delete versionBad.bundle_sha256;
  versionBad.bundle_sha256 = x.ctx.ascDrFingerprint_(versionBad);
  file.content = JSON.stringify(versionBad);
  assert.throws(
    () => x.ctx.ascValidateDisasterRecoveryBundle_(file.id),
    /DR_BUNDLE_UNSUPPORTED_VERSION/
  );

  const schemaBad = structuredClone(original);
  schemaBad.private_continuity.schema_version = '9.9';
  schemaBad.private_continuity.state.schema_version = '9.9';
  schemaBad.private_continuity.sha256 = x.ctx.ascDrFingerprint_(schemaBad.private_continuity.state);
  delete schemaBad.bundle_sha256;
  schemaBad.bundle_sha256 = x.ctx.ascDrFingerprint_(schemaBad);
  file.content = JSON.stringify(schemaBad);
  assert.throws(
    () => x.ctx.ascValidateDisasterRecoveryBundle_(file.id),
    /DR_CONTINUITY_UNSUPPORTED_SCHEMA/
  );
}

// 3. Recovery copy recreates all four tabs and must verify exact snapshot checksum.
{
  const x = world();
  const bundle = x.ctx.ascCreateDisasterRecoveryBundle_();
  const copy = plain(x.ctx.ascCreateAscDbRecoveryCopy_(bundle.bundle_file_id));
  assert.equal(copy.status, 'DR_DB_RECOVERY_COPY_CREATED');
  const candidate = plain(x.ctx.ascValidateAscDbCandidate_(copy.spreadsheet_id));
  assert.equal(candidate.sha256, copy.sha256);
  for (const name of Object.keys(schema)) {
    assert.ok(x.spreadsheets.get(copy.spreadsheet_id).getSheetByName(name));
  }
}

// 4. Migration switches only after expected-current + checksum + private/schema validation.
{
  const x = world();
  const bundle = x.ctx.ascCreateDisasterRecoveryBundle_();
  const copy = x.ctx.ascCreateAscDbRecoveryCopy_(bundle.bundle_file_id);

  assert.throws(() => x.ctx.ascMigrateAscDb_({
    expectedCurrentSpreadsheetId: 'wrong-current',
    candidateSpreadsheetId: copy.spreadsheet_id,
    expectedCandidateSha256: copy.sha256
  }), /DR_DB_CURRENT_CHANGED/);

  assert.throws(() => x.ctx.ascMigrateAscDb_({
    expectedCurrentSpreadsheetId: 'legacy-db',
    candidateSpreadsheetId: copy.spreadsheet_id,
    expectedCandidateSha256: '0'.repeat(64)
  }), /DR_DB_CANDIDATE_CHECKSUM_MISMATCH/);

  const migrated = plain(x.ctx.ascMigrateAscDb_({
    expectedCurrentSpreadsheetId: 'legacy-db',
    candidateSpreadsheetId: copy.spreadsheet_id,
    expectedCandidateSha256: copy.sha256
  }));
  assert.equal(migrated.status, 'DR_DB_MIGRATED');
  assert.equal(x.props.get('ASC_DB_SPREADSHEET_ID'), copy.spreadsheet_id);
  assert.equal(x.ctx.ascDbSpreadsheetId_(), copy.spreadsheet_id);
}

// 5. A non-private or schema-incompatible candidate can never become current.
{
  const x = world();
  const badId = 'bad-sheet';
  x.spreadsheets.set(badId, new FakeSpreadsheet(badId, 'bad', {
    PROJECTS: [['project_id']],
    RECORDS: [schema.RECORDS],
    ACTION_PLAN: [schema.ACTION_PLAN],
    HISTORY: [schema.HISTORY]
  }));
  x.files.set(badId, new FakeDriveFile(badId, 'bad', 'spreadsheet'));
  assert.throws(() => x.ctx.ascValidateAscDbCandidate_(badId), /DR_DB_SCHEMA_INCOMPATIBLE/);

  const sharedId = 'shared-sheet';
  x.spreadsheets.set(sharedId, new FakeSpreadsheet(sharedId, 'shared', sampleDb()));
  x.files.set(sharedId, new FakeDriveFile(sharedId, 'shared', 'spreadsheet', true));
  assert.throws(() => x.ctx.ascValidateAscDbCandidate_(sharedId), /PRIVATE_CONTINUITY_STORE_NOT_PRIVATE/);
}

// 6. Disaster continuity restore refuses to overwrite healthy authority.
{
  const x = world();
  const bundle = x.ctx.ascCreateDisasterRecoveryBundle_();
  assert.throws(
    () => x.ctx.ascRecoverContinuityFromDisasterBundle_(bundle.bundle_file_id),
    /DR_CONTINUITY_CURRENT_HEALTHY/
  );
}

// 7. If current continuity authority is unavailable, bundle can recreate verified authority.
{
  const x = world();
  const bundle = x.ctx.ascCreateDisasterRecoveryBundle_();
  x.files.delete('continuity-current');

  const recovered = plain(x.ctx.ascRecoverContinuityFromDisasterBundle_(bundle.bundle_file_id));
  assert.equal(recovered.status, 'DR_CONTINUITY_RECOVERED');
  assert.notEqual(recovered.recovered_state_file_id, 'continuity-current');
  const restored = plain(x.ctx.ascContinuityReadState_());
  assert.deepStrictEqual(restored, x.continuityState);
}

// 8. Continuity recovery rolls Script Property pointers back if post-read verification fails.
{
  const x = world();
  const bundle = x.ctx.ascCreateDisasterRecoveryBundle_();
  x.files.delete('continuity-current');
  const originalRead = x.ctx.ascContinuityReadState_;
  x.ctx.ascContinuityReadState_ = () => { throw new Error('forced post-read failure'); };

  assert.throws(
    () => x.ctx.ascRecoverContinuityFromDisasterBundle_(bundle.bundle_file_id),
    /forced post-read failure/
  );
  assert.equal(x.props.get('ASC_CONTINUITY_STATE_FILE_ID'), 'continuity-current');
  assert.equal(x.props.get('ASC_CONTINUITY_FOLDER_ID'), 'folder-current');
  x.ctx.ascContinuityReadState_ = originalRead;
}

// 9. Secret-like material inside a bundle is rejected even with a valid outer checksum.
{
  const x = world();
  const created = x.ctx.ascCreateDisasterRecoveryBundle_();
  const file = x.files.get(created.bundle_file_id);
  const bundle = JSON.parse(file.content);
  bundle.nonsecret_config.GITHUB_TOKEN = 'should-never-exist';
  delete bundle.bundle_sha256;
  bundle.bundle_sha256 = x.ctx.ascDrFingerprint_(bundle);
  file.content = JSON.stringify(bundle);
  assert.throws(
    () => x.ctx.ascValidateDisasterRecoveryBundle_(file.id),
    /DR_BUNDLE_SECRET_MATERIAL_DETECTED/
  );
}

console.log('T-019E disaster recovery + migration safety test: PASS');
console.log('critical recovery bundle / DB staging / pointer migration / continuity disaster recovery: PASS');
