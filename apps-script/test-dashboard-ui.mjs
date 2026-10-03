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

// Detail: seven locked sections in order; empty tables graceful; values exact.
{
  const detail = {
    ok: true,
    project: project(),
    records: [{ project_id: 'AISYNC', record_type: 'decision', record_id: 'D-015', status: 'LOCKED', summary: 's', lineage_json: '["D-006"]', source_artifact: 'ZASSIM-AISYNC.md', source_commit: 'c1', canonical_url: 'https://github.com/dzuddiyn/AISYNC', updated_at: 'u' },
      { project_id: 'AISYNC', record_type: 'x', record_id: 'J', status: 'OPEN', canonical_url: 'javascript:alert(1)' }],
    action_plan: [{ project_id: 'AISYNC', ap_id: 'AP-003', status: 'OPEN', action: 'UI <flow>' }],
    history: [{ request_id: 'TEST_ONLY_T008B_LIVE_20261003_0415', status: 'SUCCESS', commit_or_record_id: 'fb1da42abaac61d5568548ec254e48c1a1b5aa6b', receipt_json: '{"verified":true}' },
      { request_id: 'r-fail', status: 'FAILED', failure_reason: 'Adapter write was not verified as persisted.' }]
  };
  const html = sb.renderProjectDetail(detail);
  const titles = ['1. Project progress bar', '2. Progress summary', '3. Next Action Plan summary', '4. Next stage summary', '5. Action Plan table', '6. ZASS table', '7. History'];
  let last = -1;
  for (const t of titles) {
    const i = html.indexOf('<h2>' + t + '</h2>');
    assert.ok(i > last, t + ' present and in order');
    last = i;
  }
  assert.equal((html.match(/<section class="card">/g) || []).length, 7);
  assert.match(html, /Progress: Not provided/);
  assert.match(html, /<p>Current T-004<\/p>/);
  assert.match(html, /<p>AP-003<\/p>/);
  assert.match(html, /<p>T-004<\/p>/);
  assert.match(html, /UI &lt;flow&gt;/);
  assert.match(html, /<a href="https:\/\/github.com\/dzuddiyn\/AISYNC"/);
  assert.doesNotMatch(html, /href="javascript:/);
  assert.match(html, /<td>SUCCESS<\/td>/);
  assert.match(html, /<td>FAILED<\/td>/);
  assert.match(html, /fb1da42abaac61d5568548ec254e48c1a1b5aa6b/);
  assert.match(html, /freshness UNVERIFIED/);
  assert.match(html, /Commit-linked ZASS CI/);
  assert.match(html, /Loading factual GitHub CI status/);

  const ciProject = project({
    github_repo: 'dzuddiyn/ZASS-Zero-to-Architecture-Structured-Sprint',
    index_metadata: {
      ...meta,
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
  const ciHtml = sb.renderProjectDetail(ciDetail, ciSuccess);
  assert.match(ciHtml, /Status: <strong>SUCCESS<\/strong>/);
  assert.match(ciHtml, /Workflow \/ job: ZASS CI \/ zass-check/);
  assert.match(ciHtml, /Run ID: 37084823055/);
  assert.match(ciHtml, /7cdbd6818198f22245ebcaf107a3cc87611a3d72/);
  assert.match(ciHtml, /Open GitHub Actions run/);
  assert.doesNotMatch(ciHtml, /Z001|Z101|project valid|validation PASS/i);

  const notFoundHtml = sb.renderProjectDetail(ciDetail, {
    ...ciSuccess,
    run_id: null,
    status: 'NOT_FOUND',
    conclusion: null,
    run_url: null
  });
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
  });
  assert.match(readErrorHtml, /READ_ERROR/);
  assert.match(readErrorHtml, /GITHUB_READ_FAILED/);

  const emptyHtml = sb.renderProjectDetail({ ok: true, project: project({ progress_summary: '', next_action_plan: '', next_stage: '' }), records: [], action_plan: [], history: [] });
  assert.match(emptyHtml, /No ACTION_PLAN rows for this project\./);
  assert.match(emptyHtml, /No RECORDS rows for this project\./);
  assert.match(emptyHtml, /No HISTORY rows for this project\./);
  assert.equal((emptyHtml.match(/Not provided/g) || []).length >= 4, true);
  assert.doesNotMatch(emptyHtml, /<table>/);
  assert.match(sb.renderProjectDetail(undefined), /FAILED/);
  assert.match(sb.renderProjectDetail({ ok: false, error: { code: 'PROJECT_NOT_FOUND', message: 'No PROJECTS row has this exact project_id.' } }), /PROJECT_NOT_FOUND/);
  assert.match(sb.renderTable(['a'], undefined, 'Empty.'), /Empty\./);
}

console.log('T-009B/C dashboard UI + routing test: PASS');
