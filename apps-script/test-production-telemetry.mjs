import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const SOURCE = fs.readFileSync(new URL('./ProductionTelemetry.gs', import.meta.url), 'utf8');

function projectResult({
  freshness = 'CURRENT',
  canonicalOk = true,
  save = 'SUCCESS'
} = {}) {
  const canonical = canonicalOk
    ? {
        ok: true,
        repository: 'dzuddiyn/AISYNC',
        ref: 'main',
        commit_sha: 'abc123',
        fetched_at: '2026-10-04T12:00:00.000Z'
      }
    : {
        ok: false,
        repository: 'dzuddiyn/AISYNC',
        ref: null,
        commit_sha: null,
        fetched_at: '2026-10-04T12:00:00.000Z',
        error: { code: 'GITHUB_READ_FAILED', message: 'GitHub read request failed.' }
      };

  const history = [];
  if (save === 'SUCCESS') {
    history.push({
      operation: 'SAVE',
      status: 'SUCCESS',
      timestamp: '2026-10-04T11:00:00Z',
      failure_reason: '',
      receipt_json: JSON.stringify({
        status: 'SUCCESS',
        verified: true,
        write_performed: false,
        adapter_outcome: 'NO_CHANGE'
      })
    });
  } else if (save === 'FAILED') {
    history.push({
      operation: 'SAVE',
      status: 'FAILED',
      timestamp: '2026-10-04T11:00:00Z',
      failure_reason: 'write failed',
      receipt_json: JSON.stringify({
        status: 'FAILED',
        verified: false,
        write_performed: false,
        adapter_outcome: 'WRITE_ERROR'
      })
    });
  } else if (save === 'MALFORMED') {
    history.push({
      operation: 'SAVE',
      status: 'SUCCESS',
      timestamp: '2026-10-04T11:00:00Z',
      failure_reason: '',
      receipt_json: '{bad'
    });
  }

  return {
    ok: true,
    source: {
      read_at: '2026-10-04T12:00:01.000Z',
      tabs: ['PROJECTS', 'RECORDS', 'ACTION_PLAN', 'HISTORY'],
      authority: 'OPERATIONAL_INDEX'
    },
    project: {
      project_id: 'AISYNC',
      github_repo: 'dzuddiyn/AISYNC',
      index_metadata: {
        source_ref: 'main',
        source_commit: 'abc123',
        freshness,
        freshness_evidence: {
          status: freshness,
          reason: freshness === 'STALE' ? 'CANONICAL_HEAD_DIFFERS_FROM_INDEXED_COMMIT' : 'MATCH',
          canonical
        }
      }
    },
    history
  };
}

function world({
  owner = true,
  project = projectResult(),
  continuityPointer = 'file-1',
  continuityState = { schema_version: '0.1', projects: { AISYNC: { threads: {} } } },
  appConfigured = true,
  registryConfigured = true,
  tokenResult = { ok: true, token: 'SECRET_TOKEN_MUST_NOT_LEAK', expiresAt: '2026-10-04T13:00:00Z' }
} = {}) {
  const calls = [];
  const ctx = {
    console,
    ASC_CONTINUITY_FILE_PROPERTY_: 'ASC_CONTINUITY_STATE_FILE_ID',
    ascAuthorizationContext_: () => ({ activeUser: 'owner', effectiveUser: 'owner' }),
    ascIsOwner_: () => owner,
    getDashboardProject: (projectId) => {
      calls.push('getDashboardProject:' + projectId);
      return project;
    },
    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty(name) {
            calls.push('getProperty:' + name);
            return continuityPointer;
          }
        };
      }
    },
    DriveApp: {
      getFileById(id) {
        calls.push('getFileById:' + id);
        return {
          getBlob() {
            return {
              getDataAsString() {
                return JSON.stringify(continuityState);
              }
            };
          }
        };
      }
    },
    ascContinuityRequirePrivate_: () => calls.push('continuityPrivateCheck'),
    ascContinuityValidateState_: (state) => {
      calls.push('continuityValidate');
      if (!state || state.schema_version !== '0.1' || !state.projects) {
        throw new Error('PRIVATE_CONTINUITY_STORE_INVALID_STATE');
      }
      return state;
    },
    ascGitHubAppConfigured_: () => appConfigured,
    ascProductionRegistryConfigured_: () => registryConfigured,
    ascGitHubAppInstallationToken_: () => {
      calls.push('githubAppTokenProbe');
      return tokenResult;
    }
  };
  vm.createContext(ctx);
  vm.runInContext(SOURCE, ctx);
  return { ctx, calls };
}

const plain = (v) => JSON.parse(JSON.stringify(v));

// Static boundary: this telemetry file contains no business-state mutation API.
assert.doesNotMatch(
  SOURCE,
  /\.(appendRow|setValue|setValues|setContent|createFile|writeFile|deleteFile|moveTo|setTrashed)\s*\(/
);

// 1. Owner-only.
{
  const w = world({ owner: false });
  const r = plain(w.ctx.getProductionTelemetry('AISYNC'));
  assert.equal(r.ok, false);
  assert.equal(r.error.code, 'OWNER_REQUIRED');
  assert.deepStrictEqual(w.calls, []);
}

// 2. Happy snapshot: all required evidence observed directly -> OK.
{
  const w = world();
  const r = plain(w.ctx.getProductionTelemetry('AISYNC'));
  assert.equal(r.ok, true);
  assert.equal(r.telemetry_version, '0.1');
  assert.equal(r.persisted, false);
  assert.equal(r.secrets_exposed, false);
  assert.equal(r.overall.state, 'OK');
  assert.equal(r.probes.asc_db.state, 'OK');
  assert.equal(r.probes.canonical_github.state, 'OK');
  assert.equal(r.probes.index_freshness.state, 'CURRENT');
  assert.equal(r.probes.private_continuity.state, 'OK');
  assert.equal(r.probes.private_continuity.details.project_present, true);
  assert.equal(r.probes.github_app_auth.state, 'OK');
  assert.equal(r.probes.github_app_auth.details.token_issued, true);
  assert.equal(r.probes.github_app_auth.details.repository_write_performed, false);
  assert.equal(r.probes.latest_save.state, 'SUCCESS');
  assert.equal(r.probes.latest_save.details.adapter_outcome, 'NO_CHANGE');
  assert.equal(JSON.stringify(r).includes('SECRET_TOKEN_MUST_NOT_LEAK'), false);
  assert.deepStrictEqual(w.calls, [
    'getDashboardProject:AISYNC',
    'getProperty:ASC_CONTINUITY_STATE_FILE_ID',
    'getFileById:file-1',
    'continuityPrivateCheck',
    'continuityValidate',
    'githubAppTokenProbe'
  ]);
}

// 3. STALE index is DEGRADED, not OK and not ERROR.
{
  const w = world({ project: projectResult({ freshness: 'STALE' }) });
  const r = plain(w.ctx.getProductionTelemetry('AISYNC'));
  assert.equal(r.probes.index_freshness.state, 'STALE');
  assert.equal(r.overall.state, 'DEGRADED');
}

// 4. No SAVE observation -> UNKNOWN; absence is never treated as success.
{
  const w = world({ project: projectResult({ save: 'NONE' }) });
  const r = plain(w.ctx.getProductionTelemetry('AISYNC'));
  assert.equal(r.probes.latest_save.state, 'NOT_OBSERVED');
  assert.equal(r.overall.state, 'UNKNOWN');
}

// 5. Latest SAVE failure is factual DEGRADED.
{
  const w = world({ project: projectResult({ save: 'FAILED' }) });
  const r = plain(w.ctx.getProductionTelemetry('AISYNC'));
  assert.equal(r.probes.latest_save.state, 'FAILED');
  assert.equal(r.probes.latest_save.details.failure_reason, 'write failed');
  assert.equal(r.overall.state, 'DEGRADED');
}

// 6. A SUCCESS row with malformed/insufficient receipt stays UNKNOWN.
{
  const w = world({ project: projectResult({ save: 'MALFORMED' }) });
  const r = plain(w.ctx.getProductionTelemetry('AISYNC'));
  assert.equal(r.probes.latest_save.state, 'UNKNOWN');
  assert.equal(r.probes.latest_save.error.code, 'SAVE_EVIDENCE_INSUFFICIENT');
  assert.equal(r.overall.state, 'UNKNOWN');
}

// 7. Canonical GitHub read failure is ERROR and preserves its factual error code.
{
  const w = world({ project: projectResult({ canonicalOk: false, freshness: 'UNVERIFIED' }) });
  const r = plain(w.ctx.getProductionTelemetry('AISYNC'));
  assert.equal(r.probes.canonical_github.state, 'ERROR');
  assert.equal(r.probes.canonical_github.error.code, 'GITHUB_READ_FAILED');
  assert.equal(r.probes.index_freshness.state, 'UNVERIFIED');
  assert.equal(r.overall.state, 'ERROR');
}

// 8. Missing continuity authority is NOT_CONFIGURED -> overall ERROR; telemetry never creates it.
{
  const w = world({ continuityPointer: null });
  const r = plain(w.ctx.getProductionTelemetry('AISYNC'));
  assert.equal(r.probes.private_continuity.state, 'NOT_CONFIGURED');
  assert.equal(r.overall.state, 'ERROR');
  assert.equal(w.calls.includes('getFileById:file-1'), false);
}

// 9. GitHub App auth failure is ERROR; no credential material is surfaced.
{
  const w = world({
    tokenResult: {
      ok: false,
      error: { code: 'GITHUB_APP_TOKEN_REQUEST_FAILED', message: 'token request failed' }
    }
  });
  const r = plain(w.ctx.getProductionTelemetry('AISYNC'));
  assert.equal(r.probes.github_app_auth.state, 'ERROR');
  assert.equal(r.probes.github_app_auth.error.code, 'GITHUB_APP_TOKEN_REQUEST_FAILED');
  assert.equal(r.overall.state, 'ERROR');
  assert.equal(JSON.stringify(r).includes('token request failed'), true);
}

// 10. DB failure makes downstream project evidence NOT_OBSERVED, never fabricated.
{
  const w = world({
    project: { ok: false, error: { code: 'ASC_DB_READ_FAILED', message: 'db unavailable' } }
  });
  const r = plain(w.ctx.getProductionTelemetry('AISYNC'));
  assert.equal(r.probes.asc_db.state, 'ERROR');
  assert.equal(r.probes.canonical_github.state, 'NOT_OBSERVED');
  assert.equal(r.probes.index_freshness.state, 'NOT_OBSERVED');
  assert.equal(r.probes.latest_save.state, 'NOT_OBSERVED');
  assert.equal(r.overall.state, 'ERROR');
}

// 11. Invalid project ID is explicit and performs no probes.
{
  const w = world();
  const r = plain(w.ctx.getProductionTelemetry(''));
  assert.equal(r.ok, false);
  assert.equal(r.error.code, 'INVALID_PROJECT_ID');
  assert.deepStrictEqual(w.calls, []);
}

console.log('T-019D truthful telemetry test: PASS');
console.log('telemetry persistence/write calls: none');
