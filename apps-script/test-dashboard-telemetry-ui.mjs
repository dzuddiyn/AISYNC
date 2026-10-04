import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const FILE = fs.readFileSync(new URL('./DashboardClient.html', import.meta.url), 'utf8');
const CLIENT = FILE.replace(/^\s*<script>\s*/, '').replace(/\s*<\/script>\s*$/, '');

const sb = { console };
vm.createContext(sb);
vm.runInContext(CLIENT, sb);

assert.match(CLIENT, /\.getProductionTelemetry\(projectId\)/);
assert.match(CLIENT, /data-telemetry-action="refresh"/);
assert.doesNotMatch(CLIENT, /SpreadsheetApp|UrlFetchApp|GITHUB_TOKEN|PRIVATE_KEY/);

// Loading is neutral and makes no health claim.
{
  const html = sb.renderProductionTelemetry(null);
  assert.match(html, /Operator telemetry/);
  assert.match(html, /Loading a fresh read-only telemetry snapshot/);
  assert.doesNotMatch(html, />OK</);
}

// Truthful OK snapshot renders each direct probe and the anti-inference caveat.
{
  const html = sb.renderProductionTelemetry({
    ok: true,
    observed_at: '2026-10-04T12:00:00Z',
    overall: {
      state: 'OK',
      reason: 'All required probes returned direct acceptable evidence in this snapshot.'
    },
    probes: {
      asc_db: {
        state: 'OK', source: 'ASC_DB', observed_at: '2026-10-04T12:00:00Z',
        details: { authority: 'OPERATIONAL_INDEX', tabs_read: ['PROJECTS', 'RECORDS', 'ACTION_PLAN', 'HISTORY'] }
      },
      canonical_github: {
        state: 'OK', source: 'GITHUB_CANONICAL_HEAD', observed_at: '2026-10-04T12:00:00Z',
        details: { repository: 'dzuddiyn/AISYNC', ref: 'main', commit_sha: 'abc123' }
      },
      index_freshness: {
        state: 'CURRENT', source: 'ASC_DB_INDEX', observed_at: '2026-10-04T12:00:00Z',
        details: { indexed_ref: 'main', indexed_commit: 'abc123', reason: 'MATCH' }
      },
      private_continuity: {
        state: 'OK', source: 'PRIVATE_CONTINUITY', observed_at: '2026-10-04T12:00:00Z',
        details: { schema_version: '0.1', project_count: 2, project_present: true }
      },
      github_app_auth: {
        state: 'OK', source: 'GITHUB_APP_AUTH', observed_at: '2026-10-04T12:00:00Z',
        details: { token_issued: true, token_expires_at: '2026-10-04T13:00:00Z', repository_write_performed: false }
      },
      latest_save: {
        state: 'SUCCESS', source: 'ASC_DB.HISTORY', observed_at: '2026-10-04T12:00:00Z',
        details: { event_timestamp: '2026-10-04T11:00:00Z', row_status: 'SUCCESS', adapter_outcome: 'NO_CHANGE', verified: true, write_performed: false }
      }
    }
  });
  assert.match(html, /<strong>OK<\/strong>/);
  assert.match(html, /ASC DB · OK/);
  assert.match(html, /Canonical GitHub · OK/);
  assert.match(html, /Index freshness · CURRENT/);
  assert.match(html, /Private continuity · OK/);
  assert.match(html, /GitHub App auth · OK/);
  assert.match(html, /Latest SAVE evidence · SUCCESS/);
  assert.match(html, /Ephemeral and read-only/);
  assert.match(html, /UNKNOWN \/ UNVERIFIED \/ NOT_OBSERVED are never treated as PASS/);
  assert.match(html, /Repository write performed<\/span>false/);
  assert.doesNotMatch(html, /SECRET_TOKEN_MUST_NOT_LEAK|BEGIN (?:RSA )?PRIVATE KEY|Bearer\s+[A-Za-z0-9._-]+/i);
  assert.match(html, /REFRESH TELEMETRY/);
}

// ERROR/UNKNOWN evidence remains visible and never collapses to a green-looking success claim.
{
  const html = sb.renderProductionTelemetry({
    ok: true,
    observed_at: '2026-10-04T12:00:00Z',
    overall: { state: 'ERROR', reason: 'At least one required telemetry probe failed or is not configured.' },
    probes: {
      asc_db: { state: 'ERROR', source: 'ASC_DB', observed_at: 'x', error: { code: 'ASC_DB_READ_FAILED', message: 'db failed' } },
      canonical_github: { state: 'NOT_OBSERVED', source: 'GITHUB_CANONICAL_HEAD', observed_at: 'x' },
      index_freshness: { state: 'UNVERIFIED', source: 'ASC_DB_INDEX', observed_at: 'x' },
      private_continuity: { state: 'NOT_CONFIGURED', source: 'PRIVATE_CONTINUITY', observed_at: 'x' },
      github_app_auth: { state: 'ERROR', source: 'GITHUB_APP_AUTH', observed_at: 'x', error: { code: 'TOKEN_FAILED', message: 'auth failed' } },
      latest_save: { state: 'NOT_OBSERVED', source: 'ASC_DB.HISTORY', observed_at: 'x' }
    }
  });
  assert.match(html, /<strong>ERROR<\/strong>/);
  assert.match(html, /ASC_DB_READ_FAILED/);
  assert.match(html, /Canonical GitHub · NOT_OBSERVED/);
  assert.match(html, /Index freshness · UNVERIFIED/);
  assert.match(html, /Private continuity · NOT_CONFIGURED/);
  assert.match(html, /TOKEN_FAILED/);
  assert.match(html, /Latest SAVE evidence · NOT_OBSERVED/);
}

// Server-call failure is explicit FAILED and refreshable.
{
  const html = sb.renderProductionTelemetry({
    ok: false,
    error: { code: 'SERVER_CALL_FAILED', message: 'Production telemetry could not be loaded.' }
  });
  assert.match(html, /FAILED \(SERVER_CALL_FAILED\)/);
  assert.match(html, /REFRESH TELEMETRY/);
}

console.log('T-019D dashboard telemetry UI test: PASS');
