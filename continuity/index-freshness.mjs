function validRepository(value) {
  return typeof value === 'string' && /^[^/\s]+\/[^/\s]+$/.test(value);
}

function validRef(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 255 && !/[\u0000-\u001f]/.test(value);
}

function validCommit(value) {
  return typeof value === 'string' && /^[0-9a-f]{40}$/i.test(value);
}

function checkedAtValue(checkedAt) {
  if (typeof checkedAt !== 'string' || Number.isNaN(Date.parse(checkedAt))) return null;
  return checkedAt;
}

export function assessIndexFreshness({
  canonicalRepository,
  canonicalRef,
  canonicalCommit,
  indexedRepository,
  indexedRef,
  indexedCommit,
  checkedAt
} = {}) {
  const base = {
    canonical_repository: validRepository(canonicalRepository) ? canonicalRepository : null,
    canonical_ref: validRef(canonicalRef) ? canonicalRef : null,
    canonical_commit: validCommit(canonicalCommit) ? canonicalCommit.toLowerCase() : null,
    indexed_repository: validRepository(indexedRepository) ? indexedRepository : null,
    indexed_ref: validRef(indexedRef) ? indexedRef : null,
    indexed_commit: validCommit(indexedCommit) ? indexedCommit.toLowerCase() : null,
    checked_at: checkedAtValue(checkedAt)
  };

  if (
    !base.canonical_repository ||
    !base.canonical_ref ||
    !base.canonical_commit ||
    !base.indexed_repository ||
    !base.indexed_ref ||
    !base.indexed_commit ||
    !base.checked_at
  ) {
    return {
      ...base,
      status: 'UNVERIFIED',
      reason: 'MISSING_OR_INVALID_SOURCE_EVIDENCE'
    };
  }

  if (
    base.canonical_repository !== base.indexed_repository ||
    base.canonical_ref !== base.indexed_ref
  ) {
    return {
      ...base,
      status: 'SOURCE_MISMATCH',
      reason: 'INDEX_POINTS_TO_DIFFERENT_SOURCE'
    };
  }

  if (base.canonical_commit === base.indexed_commit) {
    return {
      ...base,
      status: 'CURRENT',
      reason: 'EXACT_COMMIT_MATCH'
    };
  }

  return {
    ...base,
    status: 'STALE',
    reason: 'CANONICAL_HEAD_DIFFERS_FROM_INDEXED_COMMIT'
  };
}
