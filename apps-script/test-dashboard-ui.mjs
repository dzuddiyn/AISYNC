// T-009B/C — dashboard rendering + routing test. No live Apps Script.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = (f) => fs.readFileSync(new URL('./' + f, import.meta.url), 'utf8');
const CLIENT_FILE = read('DashboardClient.html');
const CLIENT = CLIENT_FILE.replace(/^\s*<script>\s*/, '').replace(/\s*<\/script>\s*$/, '');
const CODE = read('Code.gs');
const DASH_HTML = read('Dashboard.html');
const INDEX_HTML = read('Index.html');

// ---- routing: default/preview unchanged; ?view=dashboard → Dashboard --------------------
{
  const served = [];
  const output = { setTitle() { return this; }, setXFrameOptionsMode() { return this; } };
  const ctx = {
    HtmlService: {
      createTemplateFromFile(name) { served.push(name); return { evaluate: () => output }; },
      XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' }
    }
  };
  vm.createContext(ctx);
  vm.runInContext(CODE, ctx);
  ctx.doGet();
  ctx.doGet({ parameter: {} });
  ctx.doGet({ parameter: { view: 'sync' } });
  ctx.doGet({ parameter: { view: 'Dashboard' } });
  ctx.doGet({ parameter: { view: 'dashboard' } });
  assert.deepStrictEqual(served, ['Index', 'Index', 'Index', 'Index', 'Dashboard']);
  assert.match(DASH_HTML, /include\('DashboardClient'\)/);
  assert.match(CLIENT_FILE, /^\s*<script>/);
  assert.match(CLIENT_FILE, /<\/script>\s*$/);
  assert.match(INDEX_HTML, /include\('Client'\)/, 'T-008 preview page still includes its own client');
  assert.doesNotMatch(DASH_HTML, /include\('Client'\)/);
  assert.doesNotMatch(CLIENT, /confirmAndSync|getConfirmSyncResult|SpreadsheetApp|UrlFetchApp|GITHUB_TOKEN/);
  assert.match(CLIENT, /getDashboardZassCiStatus\(repository, commitSha\)/, 'project detail requests factual commit-linked CI status');
  assert.doesNotMatch(CLIENT, /\bZ(?:0\d{2}|10[01])\b/, 'dashboard client contains no ZASS rule-code logic');
}

// ---- rendering --------------------------------------------------------------------------
const sb = { console };
vm.createContext(sb);
vm.runInContext(CLIENT, sb);

const meta = { source_artifact: 'TASKS.md', source_commit: 'abc123', updated_at: '2026-10-02', authority: 'OPERATIONAL_INDEX', freshness: 'UNVERIFIED' };
const project = (o) => ({
  project_id: 'AISYNC', project_name: 'AISYNC', ui_entry: 'DESIGN', source_method: 'ZASSIMPLE', lifecycle_stage: 'DO IT',
  progress: { state: 'NOT_PROVIDED', value: null, raw: '' }, progress_summary: 'Current T-004', next_action_plan: 'AP-003',
  next_stage: 'T-004', latest_update: '2026-10-02 T-004 preview', github_repo: 'dzuddiyn/AISYNC', index_metadata: meta, ...o
});

// Progress: bar only when provided; blank shows Not provided, never 0%.
{
  const none = sb.renderProgress({ state: 'NOT_PROVIDED', value: null, raw: '' });
  assert.match(none, /Not provided/);
  assert.doesNotMatch(none, /role="progressbar"|0%/);
  const forty = sb.renderProgress({ state: 'PROVIDED', value: 40, raw: '40' });
  assert.match(forty, /role="progressbar"/);
  assert.match(forty, /width:40%/);
  const zero = sb.renderProgress({ state: 'PROVIDED', value: 0, raw: '0' });
  assert.match(zero, /width:0%/, 'explicitly provided 0 is shown as provided');
  const odd = sb.renderProgress({ state: 'UNREADABLE', value: null, raw: 'about half' });
  assert.match(odd, /not displayable: about half/);
  assert.doesNotMatch(odd, /role="progressbar"/);
  assert.match(sb.renderProgress(undefined), /Not provided/);
}

// Landing: DUMP / DECIDE / DESIGN tabs; grouping from read result only; latest_update exact.
{
  const list = {
    ok: true,
    source: { freshness: 'UNVERIFIED' },
    groups: {
      DUMP: [project({ project_id: 'P0', project_name: 'Dump One', ui_entry: 'DUMP', source_method: 'ZASSPILL' })],
      DECIDE: [project({ project_id: 'P2', project_name: 'Decide <b>One</b>', ui_entry: 'DECIDE', progress: { state: 'PROVIDED', value: 40, raw: '40' } })],
      DESIGN: [project()]
    },
    unrecognized_ui_entry: [project({ project_id: 'ODD', ui_entry: 'BUILD' })]
  };
  const dump = sb.renderProjectList(list, 'DUMP');
  assert.match(dump, /data-entry="DUMP" aria-pressed="true"/);
  assert.match(dump, /data-entry="DECIDE" aria-pressed="false"/);
  assert.match(dump, /data-entry="DESIGN" aria-pressed="false"/);
  assert.match(dump, /data-project-id="P0"/);
  assert.match(dump, /DUMP → ZASSPILL/);
  assert.match(dump, /https:\/\/dzuddiyn\.github\.io\/AISYNC\/asc\//);
  assert.doesNotMatch(dump, /confirmAndSync|writeToGitHub|writeToSheets/);

  const decide = sb.renderProjectList(list, 'DECIDE');
  assert.match(decide, /data-entry="DUMP" aria-pressed="false"/);
  assert.match(decide, /data-entry="DECIDE" aria-pressed="true"/);
  assert.match(decide, /data-entry="DESIGN" aria-pressed="false"/);
  assert.match(decide, /data-project-id="P2"/);
  assert.doesNotMatch(decide, /data-project-id="AISYNC"/);
  assert.match(decide, /Decide &lt;b&gt;One&lt;\/b&gt;/, 'escaped');
  assert.match(decide, /1 project row\(s\) have a ui_entry other than DUMP\/DECIDE\/DESIGN/);
  const design = sb.renderProjectList(list, 'DESIGN');
  assert.match(design, /data-project-id="AISYNC"/);
  assert.match(design, /Latest update: 2026-10-02 T-004 preview/);
  assert.match(design, /Progress: Not provided/);
  assert.match(design, /freshness UNVERIFIED/);
  const emptyDump = sb.renderProjectList({ ok: true, groups: { DUMP: [], DECIDE: [], DESIGN: [] }, unrecognized_ui_entry: [] }, 'DUMP');
  assert.match(emptyDump, /No DUMP projects in ASC DB/);
  assert.match(emptyDump, /Open ASC Front Door/);
  const empty = sb.renderProjectList({ ok: true, groups: { DUMP: [], DECIDE: [], DESIGN: [] }, unrecognized_ui_entry: [] }, 'DECIDE');
  assert.match(empty, /No DECIDE projects in ASC DB/);
  const failed = sb.renderProjectList({ ok: false, error: { code: 'SCHEMA_INCOMPATIBLE', message: 'Required headers are missing or duplicated.' }, tab: 'PROJECTS', missing: ['ui_entry'] }, 'DECIDE');
  assert.match(failed, /FAILED \(SCHEMA_INCOMPATIBLE\)/);
  assert.match(failed, /Missing: ui_entry/);
  assert.match(sb.renderProjectList(null, 'DECIDE'), /FAILED/);
}

// Gate 3 project workspace: Workspace default; Review/History explicit; contextual cards factual.
{
  const currentMeta = { ...meta, freshness: 'CURRENT' };
  const detail = {
    ok: true,
    project: project({ index_metadata: currentMeta, next_action_plan: 'Deploy owner preview', next_stage: 'DO IT' }),
    records: [
      { project_id: 'AISYNC', record_type: 'decision', record_id: 'D-015', status: 'LOCKED', summary: 's', lineage_json: '["D-006"]', source_artifact: 'ZASSIM-AISYNC.md', source_commit: 'c1', canonical_url: 'https://github.com/dzuddiyn/AISYNC', updated_at: 'u' },
      { project_id: 'AISYNC', record_type: 'x', record_id: 'J', status: 'OPEN', canonical_url: 'javascript:alert(1)' }
    ],
    action_plan: [
      { project_id: 'AISYNC', ap_id: 'AP-003', status: 'OPEN', action: 'UI <flow>', pass_condition: 'Owner preview renders correctly.' }
    ],
    history: [
      { request_id: 'TEST_ONLY_T008B_LIVE_20261003_0415', status: 'SUCCESS', commit_or_record_id: 'fb1da42abaac61d5568548ec254e48c1a1b5aa6b', receipt_json: '{"verified":true}' },
      { request_id: 'r-fail', status: 'FAILED', failure_reason: 'Adapter write was not verified as persisted.' }
    ]
  };

  const workspace = sb.renderProjectDetail(detail);
  assert.match(workspace, /data-project-view="WORKSPACE" aria-pressed="true"/);
  assert.match(workspace, /Project Pulse/);
  assert.match(workspace, /Current stage/);
  assert.match(workspace, /Next stage/);
  assert.match(workspace, /Index freshness/);
  assert.match(workspace, /Save \/ sync health/);
  assert.match(workspace, /No qualifying SAVE receipt is indexed/);
  assert.match(workspace, /Continue naturally/);
  assert.match(workspace, /Open ASC Front Door/);
  assert.match(workspace, /🚀 Current Task/);
  assert.match(workspace, /UI &lt;flow&gt;/);
  assert.match(workspace, /Owner preview renders correctly/);
  assert.match(workspace, /Then/);
  assert.doesNotMatch(workspace, /AP-003/);
  assert.doesNotMatch(workspace, /D-015/);
  assert.doesNotMatch(workspace, /Commit-linked ZASS CI/);
  assert.doesNotMatch(workspace, /TEST_ONLY_T008B/);
  assert.doesNotMatch(workspace, /confirmAndSync|writeToGitHub|writeToSheets/);

  const stale = sb.renderProjectDetail({
    ...detail,
    project: project({ index_metadata: { ...meta, freshness: 'STALE' } })
  });
  assert.match(stale, /Save \/ sync health/);
  assert.match(stale, /<strong>STALE<\/strong>/);
  assert.match(stale, /Project index is behind the canonical source/);
  assert.match(stale, /Project state needs refresh/);
  assert.doesNotMatch(stale, /🚀 Current Task/);



  const savedHealth = sb.projectSaveSyncHealth(
    project({ index_metadata: currentMeta }),
    [{
      operation: 'SAVE',
      status: 'SUCCESS',
      commit_or_record_id: 'commit-1',
      receipt_json: JSON.stringify({
        status: 'SUCCESS',
        verified: true,
        adapter_outcome: 'VERIFIED_WRITE',
        commit_or_record_id: 'commit-1'
      })
    }]
  );
  assert.equal(savedHealth.state, 'SAVED');
  assert.match(savedHealth.detail, /VERIFIED_WRITE/);
  assert.match(savedHealth.detail, /commit-1/);

  const noChangeHealth = sb.projectSaveSyncHealth(
    project({ index_metadata: currentMeta }),
    [{
      operation: 'SAVE',
      status: 'SUCCESS',
      commit_or_record_id: '',
      receipt_json: JSON.stringify({
        status: 'SUCCESS',
        verified: true,
        adapter_outcome: 'NO_CHANGE',
        commit_or_record_id: null
      })
    }]
  );
  assert.equal(noChangeHealth.state, 'SAVED');
  assert.match(noChangeHealth.detail, /no new commit required/);

  const failedHealth = sb.projectSaveSyncHealth(
    project({ index_metadata: currentMeta }),
    [{ operation: 'SAVE', status: 'FAILED', failure_reason: 'GitHub write conflict.', receipt_json: '' }]
  );
  assert.equal(failedHealth.state, 'FAILED');
  assert.match(failedHealth.detail, /GitHub write conflict/);

  const unverifiedHealth = sb.projectSaveSyncHealth(
    project({ index_metadata: currentMeta }),
    [{
      operation: 'SAVE',
      status: 'SUCCESS',
      receipt_json: JSON.stringify({ status: 'SUCCESS', verified: false, adapter_outcome: 'WRITE_UNVERIFIED' })
    }]
  );
  assert.equal(unverifiedHealth.state, 'Not provided');
  assert.match(unverifiedHealth.detail, /not sufficient to prove/);

  const staleBeatsOldSuccess = sb.projectSaveSyncHealth(
    project({ index_metadata: { ...meta, freshness: 'STALE' } }),
    [{
      operation: 'SAVE',
      status: 'SUCCESS',
      receipt_json: JSON.stringify({ status: 'SUCCESS', verified: true, adapter_outcome: 'VERIFIED_WRITE', commit_or_record_id: 'old-commit' })
    }]
  );
  assert.equal(staleBeatsOldSuccess.state, 'STALE');

  const ready = sb.renderProjectDetail({
    ...detail,
    records: [
      { project_id: 'AISYNC', record_type: 'decision', record_id: 'D-099', status: 'READY_TO_LOCK', summary: 'Use the protected production route.' }
    ],
    action_plan: []
  });
  assert.match(ready, /🔒 Ready to lock/);
  assert.match(ready, /Use the protected production route/);
  assert.doesNotMatch(ready, /D-099/);
  assert.match(ready, /does not lock automatically/);

  const forming = sb.renderProjectDetail({
    ...detail,
    project: project({
      lifecycle_stage: 'DESIGN',
      progress: { state: 'PROVIDED', value: 60, raw: '60' },
      progress_summary: 'Design coverage is explicit.',
      index_metadata: currentMeta
    }),
    action_plan: [],
    records: [
      { record_type: 'decision', record_id: 'D-001', status: 'LOCKED' },
      { record_type: 'decision', record_id: 'D-002', status: 'LOCKED' }
    ]
  });
  assert.match(forming, /🎨 Design forming/);
  assert.match(forming, /width:60%/);
  assert.match(forming, /Locked decisions in current index: 2/);
  assert.doesNotMatch(forming, /D-001|D-002/);

  const delivered = sb.renderProjectDetail({
    ...detail,
    project: project({
      lifecycle_stage: 'DELIVERED',
      progress_summary: 'Production outcome verified.',
      index_metadata: currentMeta
    }),
    action_plan: []
  });
  assert.match(delivered, /✅ DELIVERED !!/);
  assert.match(delivered, /Production outcome verified/);

  const ciProject = project({
    github_repo: 'dzuddiyn/ZASS-Zero-to-Architecture-Structured-Sprint',
    index_metadata: {
      ...currentMeta,
      source_commit: '7cdbd6818198f22245ebcaf107a3cc87611a3d72'
    }
  });
  const ciDetail = { ...detail, project: ciProject };
  const ciSuccess = {
    ok: true,
    repository: ciProject.github_repo,
    commit_sha: ciProject.index_metadata.source_commit,
    workflow_name: 'ZASS CI',
    job_name: 'zass-check',
    run_id: 37084823055,
    status: 'SUCCESS',
    conclusion: 'success',
    run_url: 'https://github.com/dzuddiyn/ZASS-Zero-to-Architecture-Structured-Sprint/actions/runs/37084823055',
    fetched_at: '2026-10-03T01:30:00.000Z'
  };

  const review = sb.renderProjectDetail(ciDetail, ciSuccess, 'REVIEW');
  assert.match(review, /data-project-view="REVIEW" aria-pressed="true"/);
  assert.match(review, /Commit-linked ZASS CI/);
  assert.match(review, /Status: <strong>SUCCESS<\/strong>/);
  assert.match(review, /Action Plan/);
  assert.match(review, /ZASS \/ project records/);
  assert.match(review, /AP-003/);
  assert.match(review, /D-015/);
  assert.match(review, /<a href="https:\/\/github.com\/dzuddiyn\/AISYNC"/);
  assert.doesNotMatch(review, /href="javascript:/);
  assert.doesNotMatch(review, /TEST_ONLY_T008B/);
  assert.doesNotMatch(review, /Z001|Z101|project valid|validation PASS/i);

  const notFoundHtml = sb.renderProjectDetail(ciDetail, {
    ...ciSuccess,
    run_id: null,
    status: 'NOT_FOUND',
    conclusion: null,
    run_url: null
  }, 'REVIEW');
  assert.match(notFoundHtml, /NOT_FOUND/);
  assert.match(notFoundHtml, /This is not a PASS result/);

  const readErrorHtml = sb.renderProjectDetail(ciDetail, {
    ...ciSuccess,
    ok: false,
    run_id: null,
    status: 'READ_ERROR',
    conclusion: null,
    run_url: null,
    error: { code: 'GITHUB_READ_FAILED', message: 'GitHub read request failed.' }
  }, 'REVIEW');
  assert.match(readErrorHtml, /READ_ERROR/);
  assert.match(readErrorHtml, /GITHUB_READ_FAILED/);

  const history = sb.renderProjectDetail(detail, null, 'HISTORY');
  assert.match(history, /data-project-view="HISTORY" aria-pressed="true"/);
  assert.match(history, /<h2>History<\/h2>/);
  assert.match(history, /TEST_ONLY_T008B_LIVE_20261003_0415/);
  assert.match(history, /<td>SUCCESS<\/td>/);
  assert.match(history, /<td>FAILED<\/td>/);
  assert.doesNotMatch(history, /Action Plan/);
  assert.doesNotMatch(history, /Commit-linked ZASS CI/);

  const empty = sb.renderProjectDetail({
    ok: true,
    project: project({ progress_summary: '', next_action_plan: '', next_stage: '', index_metadata: currentMeta }),
    records: [],
    action_plan: [],
    history: []
  });
  assert.match(empty, /No protected action needed right now/);
  assert.match(empty, /Not provided/);
  assert.doesNotMatch(empty, /<table>/);

  const emptyReview = sb.renderProjectDetail({
    ok: true,
    project: project({ progress_summary: '', next_action_plan: '', next_stage: '', index_metadata: currentMeta }),
    records: [],
    action_plan: [],
    history: []
  }, null, 'REVIEW');
  assert.match(emptyReview, /No ACTION_PLAN rows for this project\./);
  assert.match(emptyReview, /No RECORDS rows for this project\./);

  const emptyHistory = sb.renderProjectDetail({
    ok: true,
    project: project({ index_metadata: currentMeta }),
    records: [],
    action_plan: [],
    history: []
  }, null, 'HISTORY');
  assert.match(emptyHistory, /No HISTORY rows for this project\./);

  assert.match(sb.renderProjectDetail(undefined), /FAILED/);
  assert.match(sb.renderProjectDetail({ ok: false, error: { code: 'PROJECT_NOT_FOUND', message: 'No PROJECTS row has this exact project_id.' } }), /PROJECT_NOT_FOUND/);
  assert.match(sb.renderTable(['a'], undefined, 'Empty.'), /Empty\./);
}


console.log('T-009B/C dashboard UI + routing test: PASS');
