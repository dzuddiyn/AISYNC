import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readGitHubDefaultHeadWithJsonReader } from './github-source-head.mjs';

const repository = 'dzuddiyn/AISYNC';
const sha = '889bf7d66643e779d59d340a691bf07b0d8e8f06';
const now = '2026-10-03T04:15:00.000Z';

function reader(sequence, calls) {
  const queue = sequence.slice();
  return function (url) {
    calls.push(url);
    const next = queue.shift();
    if (next instanceof Error) throw next;
    return next;
  };
}

{
  const calls = [];
  const result = readGitHubDefaultHeadWithJsonReader({
    repository,
    now: () => now,
    readJson: reader([
      { ok: true, data: { default_branch: 'main' } },
      { ok: true, data: { sha } }
    ], calls)
  });
  assert.deepStrictEqual(result, {
    ok: true,
    repository,
    ref: 'main',
    commit_sha: sha,
    fetched_at: now
  });
  assert.deepStrictEqual(calls, [
    'https://api.github.com/repos/dzuddiyn/AISYNC',
    'https://api.github.com/repos/dzuddiyn/AISYNC/commits/main'
  ]);
}

{
  const calls = [];
  const result = readGitHubDefaultHeadWithJsonReader({
    repository,
    now: () => now,
    readJson: reader([
      { ok: true, data: { default_branch: 'release/v1' } },
      { ok: true, data: { sha: sha.toUpperCase() } }
    ], calls)
  });
  assert.equal(result.ok, true);
  assert.equal(result.ref, 'release/v1');
  assert.equal(result.commit_sha, sha);
  assert.equal(calls[1].endsWith('/commits/release%2Fv1'), true);
}

{
  const result = readGitHubDefaultHeadWithJsonReader({
    repository: 'bad repo',
    now: () => now,
    readJson() { throw new Error('must not be called'); }
  });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_REPOSITORY');
}

{
  const result = readGitHubDefaultHeadWithJsonReader({
    repository,
    now: () => now,
    readJson: () => ({ ok: false, code: 'GITHUB_READ_FAILED', message: 'failed', httpStatus: 503 })
  });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'GITHUB_READ_FAILED');
  assert.equal(result.error.http_status, 503);
}

{
  const result = readGitHubDefaultHeadWithJsonReader({
    repository,
    now: () => now,
    readJson: reader([{ ok: true, data: {} }], [])
  });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'MALFORMED_REPOSITORY_RESPONSE');
}

{
  const result = readGitHubDefaultHeadWithJsonReader({
    repository,
    now: () => now,
    readJson: reader([
      { ok: true, data: { default_branch: 'main' } },
      { ok: true, data: { sha: 'short' } }
    ], [])
  });
  assert.equal(result.ok, false);
  assert.equal(result.ref, 'main');
  assert.equal(result.error.code, 'MALFORMED_COMMIT_RESPONSE');
}

const source = await readFile(new URL('./github-source-head.mjs', import.meta.url), 'utf8');
assert.doesNotMatch(source, /\b(?:POST|PUT|PATCH|DELETE)\b/);
assert.doesNotMatch(source, /lifecycle|progress|semantic|ZASSPILL|ZASSIMPLE|ZASSELECTION/);

console.log('T-015 canonical GitHub source-head reader: PASS');
console.log('default branch + exact head SHA evidence: PASS');
console.log('write/semantic inference: none');
