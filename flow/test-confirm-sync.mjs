import assert from 'node:assert/strict';
import {
  CONFIRM_ACTION,
  confirmAndSyncRequest,
  isExplicitConfirmation,
  previewRequest
} from './confirm-sync.mjs';

const REPO = 'dzuddiyn/AISYNC';
const PATH = 'proofs/TEST_ONLY_t008a.md';
const MAIN_UI = 'https://example.test/asc-main-ui';
const TIMESTAMP = '2026-10-03T03:00:00.000Z';

const contract = {
  Project: 'AISYNC',
  'Source method': 'ZASSIMPLE',
  Operation: 'SAVE',
  'Record type': 'proof',
  'Record ID': 'TEST_ONLY_T008A',
  'Content/change': '# TEST_ONLY T-008A\n',
  Lineage: ['T-005', 'T-006', 'T-007'],
  Destination: ['GitHub']
};

function envelopeFor(c, requestId = 'TEST_ONLY_T008A_001') {
  return {
    envelope_version: '0.1',
    request_id: requestId,
    expires_at: '2026-10-04T00:00:00Z',
    integrity: { algorithm: 'SHA-256', digest: null },
    contract: c
  };
}

const confirm = (requestId = 'TEST_ONLY_T008A_001') => ({
  confirmed: true,
  action: CONFIRM_ACTION,
  requestId
});

const ownerPolicy = (_c, ctx) => ({ authorized: ctx && ctx.owner === true });
const resolveSpec = (invocation) => ({
  repository: REPO,
  path: PATH,
  branch: 'main',
  content: invocation.contract['Content/change'],
  commitMessage: 'TEST_ONLY T-008A'
});

function fakeGitHub({ initial = null, writeOk = true, corruptPersist = false, readFails = false } = {}) {
  const calls = { read: 0, write: 0 };
  let file = initial;
  return {
    calls,
    readFile: async () => {
      calls.read += 1;
      if (readFails) return { ok: false, error: { code: 'GITHUB_READ_FAILED', message: 'read failed' } };
      return file === null
        ? { ok: true, found: false, sha: null, content: null }
        : { ok: true, found: true, sha: file.sha, content: file.content };
    },
    writeFile: async (input) => {
      calls.write += 1;
      if (!writeOk) return { ok: false, error: { code: 'GITHUB_WRITE_FAILED', message: 'write failed', status: 409 } };
      file = { sha: 'blob-sha-1', content: corruptPersist ? input.content + 'x' : input.content };
      return { ok: true, commitSha: 'commit-sha-1', contentSha: 'blob-sha-1' };
    }
  };
}

function fakeHistory({ mode = 'ok' } = {}) {
  const rows = [];
  return {
    rows,
    appendHistory: async (entry) => {
      if (mode === 'throw') throw new Error('sheet down');
      if (mode === 'okFalse') return { ok: false, outcome: 'HISTORY_WRITE_FAILED' };
      rows.push(entry);
      return { ok: true, outcome: 'HISTORY_PERSISTED', rowNumber: rows.length + 1 };
    }
  };
}

function deps(overrides = {}) {
  const github = overrides.github || fakeGitHub();
  const history = overrides.history || fakeHistory();
  return {
    github,
    history,
    args: {
      envelope: envelopeFor(contract),
      confirmation: confirm(),
      authorizationContext: { owner: true },
      authorizationPolicy: ownerPolicy,
      resolveGitHubWriteSpec: resolveSpec,
      githubClient: github,
      historyWriter: history,
      now: () => TIMESTAMP,
      mainUiUrl: MAIN_UI,
      ...(overrides.args || {})
    }
  };
}

// 1. Preview is pure and awaits confirmation.
{
  const p = previewRequest(envelopeFor(contract));
  assert.equal(p.state, 'AWAITING_CONFIRMATION');
  assert.equal(p.writePerformed, false);
  assert.equal(p.redirect, null);
  assert.deepStrictEqual(p.contract, contract);
}

// 2. No persistence before explicit, request-bound confirmation.
for (const confirmation of [
  undefined,
  null,
  {},
  { confirmed: 'true', action: CONFIRM_ACTION, requestId: 'TEST_ONLY_T008A_001' },
  { confirmed: true, action: 'PREVIEW', requestId: 'TEST_ONLY_T008A_001' },
  { confirmed: true, action: CONFIRM_ACTION, requestId: 'OTHER_REQUEST' },
  { confirmed: true, action: CONFIRM_ACTION }
]) {
  const d = deps({ args: { confirmation } });
  const r = await confirmAndSyncRequest(d.args);
  assert.equal(r.state, 'AWAITING_CONFIRMATION');
  assert.equal(r.error.code, 'CONFIRMATION_REQUIRED');
  assert.equal(r.redirect, null);
  assert.equal(d.github.calls.read + d.github.calls.write, 0, 'no GitHub I/O before confirmation');
  assert.equal(d.history.rows.length, 0, 'no HISTORY before confirmation');
}
assert.equal(isExplicitConfirmation(confirm(), 'TEST_ONLY_T008A_001'), true);

// 3. Confirmed verified CREATE → receipt → HISTORY → redirect.
{
  const d = deps();
  const r = await confirmAndSyncRequest(d.args);
  assert.equal(r.state, 'SYNCED');
  assert.equal(r.redirect, MAIN_UI);
  assert.equal(r.receipt.status, 'SUCCESS');
  assert.equal(r.receipt.verified, true);
  assert.equal(r.receipt.adapter_outcome, 'VERIFIED_WRITE');
  assert.equal(r.receipt.commit_or_record_id, 'commit-sha-1');
  assert.equal(r.receipt.affected_resource, REPO + '/' + PATH);
  assert.equal(r.receipt.request_id, 'TEST_ONLY_T008A_001');
  assert.equal(r.receipt.timestamp, TIMESTAMP);
  assert.equal(r.historyOutcome, 'HISTORY_PERSISTED');
  assert.equal(d.github.calls.write, 1);
  assert.equal(d.history.rows.length, 1);
  assert.equal(d.history.rows[0].status, 'SUCCESS');
  assert.equal(JSON.parse(d.history.rows[0].receipt_json).commit_or_record_id, 'commit-sha-1');
}

// 4. NO_CHANGE is a verified SUCCESS receipt with no write and still returns to the main UI.
{
  const d = deps({ github: fakeGitHub({ initial: { sha: 'existing', content: contract['Content/change'] } }) });
  const r = await confirmAndSyncRequest(d.args);
  assert.equal(r.state, 'SYNCED');
  assert.equal(r.receipt.adapter_outcome, 'NO_CHANGE');
  assert.equal(r.receipt.write_performed, false);
  assert.equal(d.github.calls.write, 0);
  assert.equal(d.history.rows.length, 1);
}

// 5. Failures remain visibly FAILED, are recorded factually, and never redirect.
const failureCases = [
  ['WRITE_ERROR', fakeGitHub({ writeOk: false })],
  ['WRITE_UNVERIFIED', fakeGitHub({ corruptPersist: true })],
  ['READ_ERROR', fakeGitHub({ readFails: true })]
];
for (const [outcome, github] of failureCases) {
  const d = deps({ github });
  const r = await confirmAndSyncRequest(d.args);
  assert.equal(r.state, 'FAILED', outcome);
  assert.equal(r.stage, 'WRITE');
  assert.equal(r.redirect, null, outcome + ' must not redirect');
  assert.equal(r.receipt.status, 'FAILED');
  assert.equal(r.receipt.adapter_outcome, outcome);
  assert.equal(d.history.rows.length, 1, outcome + ' FAILED receipt recorded in HISTORY');
  assert.equal(d.history.rows[0].status, 'FAILED');
  if (outcome === 'WRITE_UNVERIFIED') {
    assert.equal(r.receipt.commit_or_record_id, 'commit-sha-1', 'captured commit preserved without upgrade');
    assert.equal(r.receipt.verified, false);
  }
}

// 6. Verified write but HISTORY failure (thrown or ok:false) stays FAILED with factual receipt; no redirect.
for (const mode of ['throw', 'okFalse']) {
  const d = deps({ history: fakeHistory({ mode }) });
  const r = await confirmAndSyncRequest(d.args);
  assert.equal(r.state, 'FAILED', mode);
  assert.equal(r.stage, 'HISTORY');
  assert.equal(r.redirect, null);
  assert.equal(r.receipt.status, 'SUCCESS', 'GitHub receipt itself is not rewritten as failure');
  assert.equal(r.receipt.commit_or_record_id, 'commit-sha-1');
  assert.equal(r.historyOutcome, 'HISTORY_WRITE_FAILED');
}

// 7. Core rejection / unsupported destinations / authorization denial stop before any I/O.
const rejectCases = [
  ['validation', { envelope: envelopeFor({ ...contract, 'Record ID': '' }) }],
  ['authorization', { authorizationContext: { owner: false } }],
  ['no policy', { authorizationPolicy: undefined }],
  ['unknown destination', { envelope: envelopeFor({ ...contract, Destination: ['Notion'] }) }],
  ['mixed destinations', { envelope: envelopeFor({ ...contract, Destination: ['GitHub', 'ASC_DB'] }) }]
];
for (const [label, args] of rejectCases) {
  const d = deps({ args });
  const r = await confirmAndSyncRequest(d.args);
  assert.equal(r.state, 'FAILED', label);
  assert.equal(r.redirect, null, label);
  assert.equal(r.writePerformed, false, label);
  assert.equal(d.github.calls.read + d.github.calls.write, 0, label + ': no GitHub I/O');
  assert.equal(d.history.rows.length, 0, label + ': no HISTORY');
}

// 8. Missing server config fails closed before I/O; no fabricated timestamp.
for (const args of [{ now: undefined }, { resolveGitHubWriteSpec: undefined }]) {
  const d = deps({ args });
  const r = await confirmAndSyncRequest(d.args);
  assert.equal(r.state, 'FAILED');
  assert.equal(r.stage, 'CONFIG');
  assert.equal(d.github.calls.read + d.github.calls.write, 0);
}

// 9. Verified sync without a configured main UI URL is not relabelled FAILED and not redirected.
for (const mainUiUrl of [undefined, '', 'javascript:alert(1)', 'http://insecure.test']) {
  const d = deps({ args: { mainUiUrl } });
  const r = await confirmAndSyncRequest(d.args);
  assert.equal(r.state, 'SYNCED_REDIRECT_UNAVAILABLE');
  assert.equal(r.redirect, null);
  assert.equal(r.receipt.status, 'SUCCESS');
}

// 10. Throwing write-spec resolver becomes a factual INVALID_INPUT failure with no write.
{
  const d = deps({ args: { resolveGitHubWriteSpec: () => { throw new Error('no mapping'); } } });
  const r = await confirmAndSyncRequest(d.args);
  assert.equal(r.state, 'FAILED');
  assert.equal(r.receipt.adapter_outcome, 'INVALID_INPUT');
  assert.equal(d.github.calls.write, 0);
  assert.equal(r.redirect, null);
}

// 11. Input envelope/contract is not mutated.
{
  const env = envelopeFor(contract);
  const snapshot = JSON.stringify(env);
  await confirmAndSyncRequest(deps({ args: { envelope: env } }).args);
  assert.equal(JSON.stringify(env), snapshot);
}

console.log('T-008A confirm/sync flow test: PASS');
