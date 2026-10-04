// T-015 — factual GitHub -> ASC DB/index freshness.
//
// This layer compares exact source evidence only. It does not refresh or infer
// method-owned lifecycle/progress semantics.

// Project/index freshness may need to read private repositories and must not depend
// on either the shared anonymous GitHub API rate limit or a separate legacy PAT.
// T-019F reuses the short-lived GitHub App installation credential boundary already
// required by production writes; the installation token is never returned in
// freshness evidence.
function ascReadGitHubProjectJson_(url) {
  if (typeof url !== 'string' || url.indexOf(ASC_ZASS_CI_GITHUB_API_PREFIX_) !== 0) {
    return ascZassCiTransportError_('INVALID_GITHUB_API_URL', 'Only the GitHub API origin is allowed.');
  }

  var tokenResult = ascGitHubAppInstallationToken_();
  if (!tokenResult || tokenResult.ok !== true) {
    return ascZassCiTransportError_(
      tokenResult && tokenResult.error && tokenResult.error.code
        ? tokenResult.error.code
        : 'GITHUB_APP_TOKEN_UNAVAILABLE',
      'GitHub App installation credential is unavailable.'
    );
  }
  var token = tokenResult.token;

  var response;
  try {
    response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: 'Bearer ' + token
      },
      muteHttpExceptions: true,
      followRedirects: false
    });
  } catch (error) {
    return ascZassCiTransportError_('GITHUB_FETCH_ERROR', 'GitHub request could not be completed.');
  }

  var status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    return ascZassCiTransportError_('GITHUB_READ_FAILED', 'GitHub read request failed.', status);
  }

  var data;
  try {
    data = JSON.parse(response.getContentText());
  } catch (error) {
    return ascZassCiTransportError_('MALFORMED_JSON_RESPONSE', 'GitHub response JSON was malformed.');
  }

  return { ok: true, data: data };
}

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
      readJson: ascReadGitHubProjectJson_,
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
