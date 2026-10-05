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
    },
    Session: {
      getActiveUser: () => ({ getEmail: () => 'owner@example.test' }),
      getEffectiveUser: () => ({ getEmail: () => 'owner@example.test' })
    },
    ascIsBetaActor_: () => true
  };
  vm.createContext(ctx);
  vm.runInContext(CODE, ctx);
  ctx.doGet();
  ctx.doGet({ parameter: {} });
  ctx.doGet({ parameter: { view: 'sync' } });
  ctx.doGet({ parameter: { view: 'Dashboard' } });
  ctx.doGet({ parameter: { view: 'dashboard' } });
  assert.deepStrictEqual(served, ['Index', 'Index', 'Index', 'Index', 'Dashboard']);
  assert.match(DASH_HTML, /include_\('DashboardClient'\)/);
  assert.match(CLIENT_FILE, /^\s*<script>/);
  assert.match(CLIENT_FILE, /<\/script>\s*$/);
  assert.match(INDEX_HTML, /include_\('Client'\)/, 'T-008 preview page still includes its own client');
  assert.doesNotMatch(DASH_HTML, /include_\('Client'\)/);
  assert.doesNotMatch(CLIENT, /confirmAndSync|getConfirmSyncResult|SpreadsheetApp|UrlFetchApp|GITHUB_TOKEN/);
  assert.match(CLIENT, /getDashboardZassCiStatus\(repository, commitSha\)/, 'project detail requests factual commit-linked CI status');
  assert.match(CLIENT, /getDashboardProjectContinuity\(projectId\)/, 'workspace loads protected private thread summaries');
  assert.match(CLIENT, /prepareDashboardProjectHandoff\(/, 'workspace prepares protected scoped handoff server-side');
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
  assert.match(workspace, /Continue this project/);
  assert.match(workspace, /Loading private threads/);
  assert.match(workspace, /Choose AI provider/);
  assert.match(workspace, /DUMP — just talk/);
  assert.match(workspace, /DECIDE — help me choose/);
  assert.match(workspace, /DESIGN — help me build/);
  assert.match(workspace, /PREPARE HANDOFF/);
  assert.match(workspace, /Provider-held memory\/profile is not imported/);
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

  const continuation = sb.renderProjectContinuation(
    detail.project,
    {
      ok: true,
      threads: [
        { thread_id: 'th_01ARZ3NDEKTSV4RRFFQ69G5FAV', title: 'Valve proof', current: 'row 18 marker 42', revision: 3 },
        { thread_id: 'th_01ARZ3NDEKTSV4RRFFQ69G5FB0', title: 'Other thread', current: 'waiting', revision: 1 }
      ]
    },
    {
      threadId: 'th_01ARZ3NDEKTSV4RRFFQ69G5FAV',
      provider: 'Gemini',
      route: 'DECIDE',
      draft: 'Banding <dua> pilihan.'
    },
    {
      ok: true,
      provider: 'Gemini',
      bootstrap: 'PRIVATE BOOTSTRAP MUST NOT RENDER',
      provider_url: 'https://gemini.google.com/app'
    }
  );
  assert.match(continuation, /Valve proof — row 18 marker 42/);
  assert.match(continuation, /value="Gemini" selected/);
  assert.match(continuation, /value="DECIDE" selected/);
  assert.match(continuation, /Banding &lt;dua&gt; pilihan\./);
  assert.match(continuation, /COPY HANDOFF/);
  assert.match(continuation, /SHOW HANDOFF TEXT/);
  assert.match(continuation, /OPEN GEMINI/);
  assert.doesNotMatch(continuation, /PRIVATE BOOTSTRAP MUST NOT RENDER/);
  assert.doesNotMatch(continuation, /continuity_reference:/);

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
  assert.match(review, /Review overview/);
  assert.match(review, /Decisions/);
  assert.match(review, /Design \/ architecture/);
  assert.match(review, /Selection state/);
  assert.match(review, /Action Plan/);
  assert.match(review, /Lineage \/ sources/);
  assert.match(review, /Commit \/ version trail/);
  assert.match(review, /Raw project records/);
  assert.match(review, /AP-003/);
  assert.match(review, /D-015/);
  assert.match(review, /No design\/architecture records indexed/);
  assert.match(review, /No selection state indexed/);
  assert.match(review, /<a href="https:\/\/github.com\/dzuddiyn\/AISYNC"/);
  assert.doesNotMatch(review, /href="javascript:/);
  assert.doesNotMatch(review, /<h2>History<\/h2>|Adapter write was not verified as persisted/);
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
  assert.match(history, /<span class="badge">SUCCESS<\/span>/);
  assert.match(history, /<span class="badge">FAILED<\/span>/);
  assert.match(history, /Verified: <strong>true<\/strong>/);
  assert.match(history, /Raw receipt JSON/);
  assert.match(history, /Failure: Adapter write was not verified as persisted/);
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
  assert.match(emptyReview, /No decisions indexed for this project\./);
  assert.match(emptyReview, /No design\/architecture records indexed\./);
  assert.match(emptyReview, /No selection state indexed\./);
  assert.match(emptyReview, /No ACTION_PLAN rows for this project\./);
  assert.match(emptyReview, /No lineage\/source metadata indexed for this project\./);
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


// Gate 5 Review / History projection: categorized evidence, readable lineage, commit trail, compact receipts.
{
  const c1 = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const c2 = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
  const c3 = 'cccccccccccccccccccccccccccccccccccccccc';

  const gate5 = {
    ok: true,
    project: project({
      github_repo: 'dzuddiyn/AISYNC',
      index_metadata: {
        source_artifact: 'ZASSIM-AISYNC.md',
        source_commit: c1,
        updated_at: '2026-10-04T01:00:00Z',
        authority: 'OPERATIONAL_INDEX',
        freshness: 'CURRENT'
      }
    }),
    records: [
      {
        project_id: 'AISYNC', record_type: 'decision', record_id: 'D-100', status: 'LOCKED',
        summary: 'Use one authoritative write path.', lineage_json: '["D-001","D-002"]',
        source_artifact: 'ZASSIM-AISYNC.md', source_commit: c1,
        canonical_url: 'https://github.com/dzuddiyn/AISYNC/blob/main/ZASSIM-AISYNC.md',
        updated_at: '2026-10-04T01:00:00Z'
      },
      {
        project_id: 'AISYNC', record_type: 'architecture', record_id: 'A-001', status: 'CONFIRMED',
        summary: 'Protected server-side adapter.', lineage_json: '["D-100"]',
        source_artifact: 'DESIGN.md', source_commit: c2,
        canonical_url: 'https://github.com/dzuddiyn/AISYNC/blob/main/DESIGN.md',
        updated_at: '2026-10-04T01:01:00Z'
      },
      {
        project_id: 'AISYNC', record_type: 'selection_matrix', record_id: 'SEL-001', status: 'SAVED',
        summary: 'Provider selection matrix.', lineage_json: '["D-100","A-001"]',
        source_artifact: 'SELECTION.md', source_commit: c2,
        canonical_url: 'https://github.com/dzuddiyn/AISYNC/blob/main/SELECTION.md',
        updated_at: '2026-10-04T01:02:00Z'
      },
      {
        project_id: 'AISYNC', record_type: 'note', record_id: 'R-BAD', status: 'OPEN',
        summary: 'Malformed lineage proof.', lineage_json: 'not-json',
        source_artifact: 'NOTES.md', source_commit: 'not-a-sha',
        canonical_url: 'javascript:alert(1)', updated_at: '2026-10-04T01:03:00Z'
      }
    ],
    action_plan: [{
      project_id: 'AISYNC', ap_id: 'AP-100', status: 'OPEN',
      action: 'Verify review surface.', dependencies: 'None',
      pass_condition: 'Owner can inspect categories.', source_lineage: 'D-100,A-001',
      source_artifact: 'ACTION_PLAN.md', source_commit: c2, updated_at: '2026-10-04T01:04:00Z'
    }],
    history: [
      {
        request_id: 'REQ-G5-SUCCESS', operation: 'SAVE', destination: 'GitHub', status: 'SUCCESS',
        affected_resource: 'dzuddiyn/AISYNC/records/proof.md', commit_or_record_id: c3, source_commit: c2,
        timestamp: '2026-10-04T01:05:00Z', failure_reason: '',
        receipt_json: JSON.stringify({
          status: 'SUCCESS', adapter_outcome: 'VERIFIED_WRITE', verified: true,
          write_performed: true, commit_or_record_id: c3
        })
      },
      {
        request_id: 'REQ-G5-FAIL', operation: 'SAVE', destination: 'GitHub', status: 'FAILED',
        affected_resource: 'dzuddiyn/AISYNC/records/fail.md', commit_or_record_id: '', source_commit: '',
        timestamp: '2026-10-04T01:06:00Z', failure_reason: 'WRITE_CONFLICT',
        receipt_json: JSON.stringify({
          status: 'FAILED', adapter_outcome: 'WRITE_CONFLICT', verified: false,
          write_performed: false, commit_or_record_id: null
        })
      }
    ]
  };

  const ci = {
    ok: true,
    repository: 'dzuddiyn/AISYNC',
    commit_sha: c1,
    workflow_name: 'ZASS CI',
    job_name: 'zass-check',
    run_id: 123,
    status: 'SUCCESS',
    conclusion: 'success',
    run_url: 'https://github.com/dzuddiyn/AISYNC/actions/runs/123',
    fetched_at: '2026-10-04T01:07:00Z'
  };

  const workspace = sb.renderProjectDetail(gate5, ci, 'WORKSPACE');
  assert.doesNotMatch(workspace, /Decisions|Design \/ architecture|Selection state|Lineage \/ sources|Commit \/ version trail|REQ-G5-SUCCESS/);

  const review = sb.renderProjectDetail(gate5, ci, 'REVIEW');
  assert.match(review, /Review overview/);
  assert.match(review, /Decisions/);
  assert.match(review, /D-100/);
  assert.match(review, /Design \/ architecture/);
  assert.match(review, /A-001/);
  assert.match(review, /Selection state/);
  assert.match(review, /SEL-001/);
  assert.match(review, /Lineage \/ sources/);
  assert.match(review, /D-001/);
  assert.match(review, /D-100,A-001/);
  assert.match(review, /Unreadable lineage — show raw/);
  assert.match(review, /not-json/);
  assert.match(review, /Commit \/ version trail/);
  assert.match(review, new RegExp('https:\\/\\/github\\.com\\/dzuddiyn\\/AISYNC\\/commit\\/' + c1));
  assert.match(review, new RegExp('https:\\/\\/github\\.com\\/dzuddiyn\\/AISYNC\\/commit\\/' + c2));
  assert.match(review, new RegExp('https:\\/\\/github\\.com\\/dzuddiyn\\/AISYNC\\/commit\\/' + c3));
  assert.match(review, /Project index/);
  assert.match(review, /History result REQ-G5-SUCCESS/);
  assert.match(review, /Raw project records/);
  assert.doesNotMatch(review, /href="javascript:/);
  assert.doesNotMatch(review, /Outcome: VERIFIED_WRITE|Failure: WRITE_CONFLICT/);

  const trail = sb.collectCommitTrail(gate5);
  assert.equal(trail.filter((row) => row.commit === c1).length, 1, 'duplicate commit is deduplicated');
  assert.match(trail.find((row) => row.commit === c1).provenance.join(' '), /Project index/);
  assert.match(trail.find((row) => row.commit === c1).provenance.join(' '), /Record D-100/);

  const history = sb.renderProjectDetail(gate5, ci, 'HISTORY');
  assert.match(history, /REQ-G5-SUCCESS/);
  assert.match(history, /Outcome: VERIFIED_WRITE/);
  assert.match(history, /Verified: <strong>true<\/strong>/);
  assert.match(history, /Write performed: yes/);
  assert.match(history, new RegExp(c3));
  assert.match(history, /Raw receipt JSON/);
  assert.match(history, /REQ-G5-FAIL/);
  assert.match(history, /Outcome: WRITE_CONFLICT/);
  assert.match(history, /Verified: <strong>false<\/strong>/);
  assert.match(history, /Failure: WRITE_CONFLICT/);
  assert.doesNotMatch(history, /Decisions|Action Plan|Commit-linked ZASS CI/);

  const absent = sb.renderProjectDetail({
    ...gate5,
    records: [],
    action_plan: [],
    history: []
  }, ci, 'REVIEW');
  assert.match(absent, /No decisions indexed for this project/);
  assert.match(absent, /No design\/architecture records indexed/);
  assert.match(absent, /No selection state indexed/);
}


console.log('T-009B/C dashboard UI + routing test: PASS');

{
  const firstThread = sb.renderProjectContinuation(
    project(),
    { ok: true, threads: [] },
    {
      threadId: '',
      threadTitle: 'AISYNC working thread',
      provider: '',
      route: 'DESIGN',
      draft: 'Continue the integrated UX from this production project.'
    },
    null,
    null
  );
  assert.match(firstThread, /No private thread available/);
  assert.match(firstThread, /Thread title/);
  assert.match(firstThread, /AISYNC working thread/);
  assert.match(firstThread, /START PRIVATE THREAD/);
  assert.match(firstThread, /does not write GitHub or Sheets/);
  assert.doesNotMatch(firstThread, /PREPARE HANDOFF/);
}

{
  const emptyReturn = sb.renderProviderReturn('', null, null);
  assert.match(emptyReturn, /Return from AI/);
  assert.match(emptyReturn, /PREVIEW RETURN/);
  assert.doesNotMatch(emptyReturn, /PREPARE ASC SAVE|OPEN ASC SAVE/);

  const previewReturn = sb.renderProviderReturn(
    'ASC_METHOD_RESULT_BEGIN ...',
    {
      ok: true,
      producing_method: 'ZASSIMPLE',
      source_revision: 1,
      record_id: 'METHOD-RESULT-01ABC',
      confirmed_outcome: 'Checkpoint <verified>',
      still_open: ['SAVE proof']
    },
    null
  );
  assert.match(previewReturn, /PREPARE ASC SAVE/);
  assert.match(previewReturn, /Checkpoint &lt;verified&gt;/);
  assert.doesNotMatch(previewReturn, /OPEN ASC SAVE/);
}

{
  const preparedReturn = sb.renderProviderReturn(
    'ASC_METHOD_RESULT_BEGIN ...',
    {
      ok: true,
      producing_method: 'ZASSIMPLE',
      source_revision: 1,
      record_id: 'METHOD-RESULT-01ABC',
      confirmed_outcome: 'Checkpoint verified',
      still_open: []
    },
    {
      ok: true,
      save_link: 'INTERNAL_LINK_VALUE'
    }
  );
  assert.match(preparedReturn, /OPEN ASC SAVE/);
  assert.match(preparedReturn, /Nothing is persisted yet/);
  assert.doesNotMatch(preparedReturn, /INTERNAL_LINK_VALUE/);
}

assert.match(CLIENT, /previewDashboardMethodReturn\(/);
assert.match(CLIENT, /prepareDashboardMethodReturnSave\(/);

{
  const pending = sb.renderPendingSavedResult({
    ok: true,
    threads: [{ thread_id: 'th_TEST', revision: 1, title: 'AISYNC', current: 'old' }],
    pending_saved_results: [{
      handoff_id: 'ho_01M42TNZ3WXJFWFS39EWY581SY',
      thread_id: 'th_TEST',
      source_revision: 1,
      producing_method: 'ZASSIMPLE',
      confirmed_outcome: 'Saved checkpoint <ready>',
      record_id: 'METHOD-RESULT-01M42TNZ3WXJFWFS39EWY581SY',
      save_commit: '11ff6215ecc95f4bfc4e8282d8e82a5206b31ac3',
      saved_at: '2026-10-04T07:08:44.048Z'
    }]
  }, null);
  assert.match(pending, /Saved result ready to continue/);
  assert.match(pending, /source revision 1/);
  assert.match(pending, /Saved checkpoint &lt;ready&gt;/);
  assert.match(pending, /METHOD-RESULT-01M42TNZ3WXJFWFS39EWY581SY/);
  assert.match(pending, /ADVANCE THREAD FROM SAVED RESULT/);
  assert.match(pending, /data-handoff-id="ho_01M42TNZ3WXJFWFS39EWY581SY"/);
  assert.match(pending, /does not create another GitHub\/Sheets write/);
}

{
  const advanced = sb.renderPendingSavedResult(
    { ok: true, threads: [], pending_saved_results: [] },
    {
      ok: true,
      status: 'ADVANCED',
      revision: 2,
      current: 'Saved checkpoint now current.'
    }
  );
  assert.match(advanced, /Saved result applied to private continuity/);
  assert.match(advanced, /revision 2/);
  assert.match(advanced, /Saved checkpoint now current\./);
  assert.match(advanced, /next handoff will use this newer thread revision/);
  assert.doesNotMatch(advanced, /ADVANCE THREAD FROM SAVED RESULT/);
}

assert.match(CLIENT, /advanceDashboardSavedMethodResult\(/);
assert.match(CLIENT, /advance-saved-result/);

{
  const multiple = sb.renderPendingSavedResult({
    ok: true,
    threads: [],
    pending_saved_results: [
      {
        handoff_id: 'ho_01M42TNZ3WXJFWFS39EWY581SY',
        source_revision: 1,
        confirmed_outcome: 'First saved result',
        record_id: 'METHOD-RESULT-FIRST'
      },
      {
        handoff_id: 'ho_01M42TNZ3WXJFWFS39EWY581SZ',
        source_revision: 1,
        confirmed_outcome: 'Second saved result',
        record_id: 'METHOD-RESULT-SECOND'
      }
    ]
  }, null);
  assert.match(multiple, /More than one verified saved result is waiting/);
  assert.match(multiple, /ASC will not choose for you/);
  assert.equal((multiple.match(/ADVANCE THREAD FROM SAVED RESULT/g) || []).length, 2);
  assert.match(multiple, /First saved result/);
  assert.match(multiple, /Second saved result/);
}
