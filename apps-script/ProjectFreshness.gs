// T-015 — factual GitHub -> ASC DB/index freshness.
//
// This layer compares exact source evidence only. It does not refresh or infer
// method-owned lifecycle/progress semantics.

function ascProjectIndexFreshness_(project) {
  const repository = project && typeof project.github_repo === 'string'
    ? project.github_repo
    : '';
  const meta = project && project.index_metadata && typeof project.index_metadata === 'object'
    ? project.index_metadata
    : {};

  let canonical;
  try {
    canonical = ascRuntime_().sourceHead.readGitHubDefaultHeadWithJsonReader({
      repository: repository,
      readJson: ascReadGitHubJson_,
      now: function () { return new Date().toISOString(); }
    });
  } catch (error) {
    canonical = {
      ok: false,
      repository: repository || null,
      ref: null,
      commit_sha: null,
      fetched_at: new Date().toISOString(),
      error: {
        code: 'CANONICAL_HEAD_BINDING_ERROR',
        message: 'Canonical GitHub head could not be read.'
      }
    };
  }

  if (!canonical || canonical.ok !== true) {
    return {
      status: 'UNVERIFIED',
      reason: 'CANONICAL_HEAD_READ_FAILED',
      canonical: canonical || null,
      indexed_repository: repository || null,
      indexed_ref: typeof meta.source_ref === 'string' ? meta.source_ref : null,
      indexed_commit: typeof meta.source_commit === 'string' ? meta.source_commit : null
    };
  }

  const freshness = ascRuntime_().indexFreshness.assessIndexFreshness({
    canonicalRepository: canonical.repository,
    canonicalRef: canonical.ref,
    canonicalCommit: canonical.commit_sha,
    indexedRepository: repository,
    indexedRef: typeof meta.source_ref === 'string' ? meta.source_ref : '',
    indexedCommit: typeof meta.source_commit === 'string' ? meta.source_commit : '',
    checkedAt: canonical.fetched_at
  });

  return {
    ...freshness,
    canonical: canonical
  };
}

function ascAttachProjectIndexFreshness_(project) {
  const result = ascProjectIndexFreshness_(project);
  if (!project.index_metadata || typeof project.index_metadata !== 'object') {
    project.index_metadata = {};
  }
  project.index_metadata.freshness = result.status;
  project.index_metadata.freshness_evidence = result;
  return project;
}
