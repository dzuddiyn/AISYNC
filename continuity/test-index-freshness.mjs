import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { assessIndexFreshness } from './index-freshness.mjs';

const repo = 'dzuddiyn/AISYNC';
const ref = 'main';
const canonical = '889bf7d66643e779d59d340a691bf07b0d8e8f06';
const stale = '97cdd389a5f2173f917ffdb46a6d6ab90b7bc3c4';
const checkedAt = '2026-10-03T03:10:00.000Z';

const current = assessIndexFreshness({
  canonicalRepository: repo,
  canonicalRef: ref,
  canonicalCommit: canonical,
  indexedRepository: repo,
  indexedRef: ref,
  indexedCommit: canonical.toUpperCase(),
  checkedAt
});
assert.equal(current.status, 'CURRENT');
assert.equal(current.reason, 'EXACT_COMMIT_MATCH');
assert.equal(current.canonical_commit, canonical);
assert.equal(current.indexed_commit, canonical);

const staleResult = assessIndexFreshness({
  canonicalRepository: repo,
  canonicalRef: ref,
  canonicalCommit: canonical,
  indexedRepository: repo,
  indexedRef: ref,
  indexedCommit: stale,
  checkedAt
});
assert.equal(staleResult.status, 'STALE');
assert.equal(staleResult.reason, 'CANONICAL_HEAD_DIFFERS_FROM_INDEXED_COMMIT');
assert.equal(staleResult.canonical_commit, canonical);
assert.equal(staleResult.indexed_commit, stale);

const mismatch = assessIndexFreshness({
  canonicalRepository: repo,
  canonicalRef: ref,
  canonicalCommit: canonical,
  indexedRepository: 'dzuddiyn/OTHER',
  indexedRef: ref,
  indexedCommit: canonical,
  checkedAt
});
assert.equal(mismatch.status, 'SOURCE_MISMATCH');
assert.equal(mismatch.reason, 'INDEX_POINTS_TO_DIFFERENT_SOURCE');

const unverified = assessIndexFreshness({
  canonicalRepository: repo,
  canonicalRef: ref,
  canonicalCommit: canonical,
  indexedRepository: repo,
  indexedRef: ref,
  indexedCommit: '',
  checkedAt
});
assert.equal(unverified.status, 'UNVERIFIED');
assert.equal(unverified.reason, 'MISSING_OR_INVALID_SOURCE_EVIDENCE');

const badTime = assessIndexFreshness({
  canonicalRepository: repo,
  canonicalRef: ref,
  canonicalCommit: canonical,
  indexedRepository: repo,
  indexedRef: ref,
  indexedCommit: canonical,
  checkedAt: 'not-a-time'
});
assert.equal(badTime.status, 'UNVERIFIED');

// Guardrail: freshness is commit evidence only. It must not infer lifecycle,
// progress, semantic validity, or CI success.
const source = await readFile(new URL('./index-freshness.mjs', import.meta.url), 'utf8');
assert.doesNotMatch(source, /progress_percent|lifecycle|semantic|CI|SUCCESS|FAILURE/);

console.log('T-015 GitHub -> ASC index freshness: PASS');
console.log('CURRENT/STALE/SOURCE_MISMATCH/UNVERIFIED are exact evidence states');
console.log('semantic/project-progress inference: none');
