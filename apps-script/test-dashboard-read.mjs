// T-009A — read layer test with fake, mutation-trapping SpreadsheetApp. No live Sheet.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const SOURCE = fs.readFileSync(new URL('./DashboardRead.gs', import.meta.url), 'utf8');
const SHEET_ID = '11pWE0E-jEZhigVAYGcsfVXW0TODRcNMgOZHFfUQIHKw';

const H = {
  PROJECTS: ['project_id', 'project_name', 'ui_entry', 'source_method', 'lifecycle_stage', 'progress_percent', 'progress_summary', 'next_action_plan', 'next_stage', 'latest_update', 'github_repo', 'source_ref', 'source_artifact', 'source_commit', 'updated_at', 'authority'],
  RECORDS: ['project_id', 'record_type', 'record_id', 'status', 'summary', 'lineage_json', 'source_artifact', 'source_commit', 'canonical_url', 'updated_at', 'authority'],
  ACTION_PLAN: ['project_id', 'ap_id', 'status', 'action', 'dependencies', 'pass_condition', 'source_lineage', 'source_artifact', 'source_commit', 'updated_at'],
  HISTORY: ['request_id', 'project_id', 'operation', 'destination', 'status', 'affected_resource', 'commit_or_record_id', 'source_commit', 'timestamp', 'failure_reason', 'receipt_json']
};
const row = (tab, obj) => H[tab].map((h) => (h in obj ? obj[h] : ''));

function baseTabs() {
  return {
    PROJECTS: [H.PROJECTS,
      row('PROJECTS', { project_id: 'AISYNC', project_name: 'AISYNC', ui_entry: 'DESIGN', source_method: 'ZASSIMPLE', lifecycle_stage: 'DO IT', progress_percent: '', progress_summary: 'Current T-004 front door', next_action_plan: 'AP-003', next_stage: 'T-004', latest_update: '2026-10-02 T-004 preview', github_repo: 'dzuddiyn/AISYNC', source_ref: 'main', source_artifact: 'TASKS.md', source_commit: 'abc123', updated_at: '2026-10-02', authority: 'OPERATIONAL_INDEX' }),
      row('PROJECTS', { project_id: 'AISYNC-2', project_name: 'Lookalike', ui_entry: 'DECIDE', progress_percent: '40', latest_update: '  spaced  value  ' }),
      row('PROJECTS', { project_id: 'DUMP-1', project_name: 'Dump Project', ui_entry: 'DUMP', source_method: 'ZASSPILL', progress_percent: '' }),
      row('PROJECTS', { project_id: 'ODD', project_name: 'Odd', ui_entry: 'BUILD', progress_percent: 'about half' }),
      H.PROJECTS.map(() => ''),
      row('PROJECTS', { project_id: 'PCT', project_name: 'Pct', ui_entry: 'DECIDE', progress_percent: '75%' }),
      row('PROJECTS', { project_id: 'ZERO', project_name: 'Zero', ui_entry: 'DESIGN', progress_percent: '0' })
    ],
    RECORDS: [H.RECORDS,
      row('RECORDS', { project_id: 'AISYNC', record_type: 'decision', record_id: 'D-015', status: 'LOCKED', summary: 'Sites + Apps Script', lineage_json: '["D-006"]', canonical_url: 'https://github.com/dzuddiyn/AISYNC/blob/main/ZASSIM-AISYNC.md' }),
      row('RECORDS', { project_id: 'AISYNC-2', record_type: 'decision', record_id: 'X-1', status: 'OPEN' }),
      row('RECORDS', { project_id: 'aisync', record_type: 'decision', record_id: 'X-2', status: 'OPEN' })
    ],
    ACTION_PLAN: [H.ACTION_PLAN,
      row('ACTION_PLAN', { project_id: 'AISYNC', ap_id: 'AP-003', status: 'OPEN', action: 'UI flow' }),
      row('ACTION_PLAN', { project_id: 'AISYNC', ap_id: 'AP-001', status: 'DONE', action: 'Contract' }),
      row('ACTION_PLAN', { project_id: 'AISYNC ', ap_id: 'AP-999', status: 'OPEN' })
    ],
    HISTORY: [H.HISTORY,
      row('HISTORY', { request_id: 'TEST_ONLY_T008B_LIVE_20261003_0415', project_id: 'AISYNC', operation: 'SAVE', destination: 'GitHub', status: 'SUCCESS', commit_or_record_id: 'fb1da42abaac61d5568548ec254e48c1a1b5aa6b', timestamp: '2026-10-03T04:20:00Z', receipt_json: '{"verified":true}' }),
      row('HISTORY', { request_id: 'r-fail', project_id: 'AISYNC', status: 'FAILED', failure_reason: 'x' }),
      row('HISTORY', { request_id: 'r-other', project_id: 'AISYNC-2', status: 'SUCCESS' })
    ]
  };
}

const READ_METHODS = new Set(['getSheetByName', 'getDataRange', 'getDisplayValues']);
function trap(name, impl, log) {
  return new Proxy(impl, {
    get(target, prop) {
      if (typeof prop === 'symbol' || prop === 'then') return target[prop];
      if (!READ_METHODS.has(prop)) {
        return () => { log.push(name + '.' + String(prop)); throw new Error('mutation/unsupported call ' + String(prop)); };
      }
      return target[prop];
    }
  });
}

function world(tabs = baseTabs(), { throwOnOpen = false } = {}) {
  const calls = [];
  const forbidden = [];
  const spreadsheet = trap('Spreadsheet', {
    getSheetByName(name) {
      calls.push('getSheetByName:' + name);
      if (!(name in tabs)) return null;
      const values = tabs[name];
      return trap('Sheet', {
        getDataRange() {
          return trap('Range', { getDisplayValues: () => values.map((r) => r.slice()) }, forbidden);
        }
      }, forbidden);
    }
  }, forbidden);
  const ctx = {
    SpreadsheetApp: trap('SpreadsheetApp', {}, forbidden),
    ascAttachProjectIndexFreshness_(project) {
      project.index_metadata.freshness = 'UNVERIFIED';
      project.index_metadata.freshness_evidence = { status: 'UNVERIFIED', reason: 'TEST_STUB' };
      return project;
    },
    console
  };
  ctx.SpreadsheetApp = new Proxy({}, {
    get(_t, prop) {
      if (prop === 'openById') return (id) => { assert.equal(id, SHEET_ID); if (throwOnOpen) throw new Error('denied'); return spreadsheet; };
      return () => { forbidden.push('SpreadsheetApp.' + String(prop)); throw new Error('forbidden'); };
    }
  });
  vm.createContext(ctx);
  vm.runInContext(SOURCE, ctx);
  return { ctx, calls, forbidden };
}
const plain = (v) => JSON.parse(JSON.stringify(v));

// Static: no mutation API names in the read layer.
assert.doesNotMatch(SOURCE, /\.(setValue|setValues|appendRow|insertRow|deleteRow|clear|setFormula|getRange\(|insertSheet|deleteSheet|setName|sort|flush)\b/);

// 1. Project list: DUMP / DECIDE / DESIGN grouping from ui_entry only; blank row skipped; unrecognized kept visible.
{
  const w = world();
  const r = plain(w.ctx.getDashboardProjects());
  assert.equal(r.ok, true);
  assert.deepStrictEqual(r.groups.DUMP.map((p) => p.project_id), ['DUMP-1']);
  assert.deepStrictEqual(r.groups.DECIDE.map((p) => p.project_id), ['AISYNC-2', 'PCT']);
  assert.deepStrictEqual(r.groups.DESIGN.map((p) => p.project_id), ['AISYNC', 'ZERO']);
  assert.deepStrictEqual(r.unrecognized_ui_entry.map((p) => p.project_id), ['ODD']);
  assert.equal(r.source.freshness, 'UNVERIFIED');
  assert.equal(r.source.spreadsheet_id, SHEET_ID);
  const aisync = r.groups.DESIGN[0];
  // blank progress stays not-provided (null), never 0
  assert.deepStrictEqual(aisync.progress, { state: 'NOT_PROVIDED', value: null, raw: '' });
  // stale index values are passed through exactly, not refreshed or derived
  assert.equal(aisync.latest_update, '2026-10-02 T-004 preview');
  assert.equal(aisync.next_stage, 'T-004');
  assert.equal(aisync.index_metadata.source_ref, 'main');
  assert.equal(aisync.index_metadata.source_commit, 'abc123');
  assert.equal(aisync.index_metadata.freshness, 'UNVERIFIED');
  // semantic strings preserved exactly (no trim)
  assert.equal(r.groups.DECIDE[0].latest_update, '  spaced  value  ');
  assert.deepStrictEqual(r.groups.DECIDE[0].progress, { state: 'PROVIDED', value: 40, raw: '40' });
  assert.equal(r.groups.DECIDE[1].progress.value, 75);
  assert.deepStrictEqual(r.groups.DESIGN[1].progress, { state: 'PROVIDED', value: 0, raw: '0' });
  assert.equal(r.unrecognized_ui_entry[0].progress.state, 'UNREADABLE');
  assert.deepStrictEqual(w.calls, ['getSheetByName:PROJECTS']);
  assert.deepStrictEqual(w.forbidden, []);
}

// 2. Valid four-tab detail read with exact project_id filtering.
{
  const w = world();
  const r = plain(w.ctx.getDashboardProject('AISYNC'));
  assert.equal(r.ok, true);
  assert.deepStrictEqual(w.calls, ['getSheetByName:PROJECTS', 'getSheetByName:RECORDS', 'getSheetByName:ACTION_PLAN', 'getSheetByName:HISTORY']);
  assert.equal(r.project.project_id, 'AISYNC');
  assert.deepStrictEqual(r.records.map((x) => x.record_id), ['D-015']);
  assert.deepStrictEqual(r.action_plan.map((x) => x.ap_id), ['AP-003', 'AP-001'], 'sheet order kept; "AISYNC " excluded');
  assert.deepStrictEqual(r.history.map((x) => x.request_id), ['TEST_ONLY_T008B_LIVE_20261003_0415', 'r-fail']);
  assert.equal(r.history[0].status, 'SUCCESS');
  assert.equal(r.history[1].status, 'FAILED');
  assert.equal(r.history[0].receipt_json, '{"verified":true}', 'receipt not reinterpreted');
  assert.equal(r.records[0].lineage_json, '["D-006"]');
  // no progress calculation from completed tasks/history
  assert.deepStrictEqual(r.project.progress, { state: 'NOT_PROVIDED', value: null, raw: '' });
  assert.equal(r.project.latest_update, '2026-10-02 T-004 preview', 'not derived from HISTORY');
  assert.equal(r.source.freshness, 'UNVERIFIED');
  assert.deepStrictEqual(r.source.tabs, ['PROJECTS', 'RECORDS', 'ACTION_PLAN', 'HISTORY']);
  assert.deepStrictEqual(w.forbidden, []);

  const other = plain(world().ctx.getDashboardProject('AISYNC-2'));
  assert.deepStrictEqual(other.records.map((x) => x.record_id), ['X-1']);
  assert.deepStrictEqual(other.action_plan, []);
  assert.deepStrictEqual(other.history.map((x) => x.request_id), ['r-other']);
}

// 3. Not found / case / invalid id / duplicate project rows.
{
  assert.equal(plain(world().ctx.getDashboardProject('aisync')).error.code, 'PROJECT_NOT_FOUND');
  assert.equal(plain(world().ctx.getDashboardProject('')).error.code, 'INVALID_PROJECT_ID');
  assert.equal(plain(world().ctx.getDashboardProject(undefined)).error.code, 'INVALID_PROJECT_ID');
  const tabs = baseTabs();
  tabs.PROJECTS.push(row('PROJECTS', { project_id: 'AISYNC', project_name: 'dup', ui_entry: 'DESIGN' }));
  const dup = plain(world(tabs).ctx.getDashboardProject('AISYNC'));
  assert.equal(dup.error.code, 'DUPLICATE_PROJECT_ID');
  assert.deepStrictEqual(dup.sheet_rows, [2, 9]);
}

// 4. Schema failures are structural and visible.
{
  const missingHeader = baseTabs();
  missingHeader.RECORDS[0] = H.RECORDS.filter((h) => h !== 'canonical_url');
  const a = plain(world(missingHeader).ctx.getDashboardProject('AISYNC'));
  assert.equal(a.ok, false);
  assert.equal(a.error.code, 'SCHEMA_INCOMPATIBLE');
  assert.equal(a.tab, 'RECORDS');
  assert.deepStrictEqual(a.missing, ['canonical_url']);

  const dupHeader = baseTabs();
  dupHeader.PROJECTS[0] = H.PROJECTS.concat(['ui_entry']);
  const b = plain(world(dupHeader).ctx.getDashboardProjects());
  assert.equal(b.error.code, 'SCHEMA_INCOMPATIBLE');
  assert.deepStrictEqual(b.duplicate, ['ui_entry']);

  const missingTab = baseTabs();
  delete missingTab.HISTORY;
  const c = plain(world(missingTab).ctx.getDashboardProject('AISYNC'));
  assert.equal(c.error.code, 'TAB_MISSING');
  assert.equal(c.tab, 'HISTORY');

  const empty = baseTabs();
  empty.ACTION_PLAN = [];
  assert.equal(plain(world(empty).ctx.getDashboardProject('AISYNC')).error.code, 'SCHEMA_INCOMPATIBLE');

  // reordered columns with an extra column still map by header name
  const reordered = baseTabs();
  reordered.HISTORY = reordered.HISTORY.map((r) => ['extra'].concat(r.slice().reverse()));
  const d = plain(world(reordered).ctx.getDashboardProject('AISYNC'));
  assert.equal(d.ok, true);
  assert.equal(d.history[0].commit_or_record_id, 'fb1da42abaac61d5568548ec254e48c1a1b5aa6b');

  const denied = plain(world(baseTabs(), { throwOnOpen: true }).ctx.getDashboardProjects());
  assert.equal(denied.error.code, 'ASC_DB_READ_FAILED');
}

// 5. Empty data tabs (headers only) return empty arrays, not errors.
{
  const tabs = baseTabs();
  tabs.RECORDS = [H.RECORDS];
  tabs.ACTION_PLAN = [H.ACTION_PLAN];
  tabs.HISTORY = [H.HISTORY];
  const r = plain(world(tabs).ctx.getDashboardProject('AISYNC'));
  assert.equal(r.ok, true);
  assert.deepStrictEqual([r.records, r.action_plan, r.history], [[], [], []]);
}

console.log('T-009A dashboard read layer test: PASS');
console.log('Sheet mutation calls: none');
