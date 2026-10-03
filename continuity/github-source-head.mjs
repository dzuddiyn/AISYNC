const API_ROOT = 'https://api.github.com';

function validRepository(repository) {
  return typeof repository === 'string' && /^[^/\s]+\/[^/\s]+$/.test(repository);
}

function validCommit(commit) {
  return typeof commit === 'string' && /^[0-9a-f]{40}$/i.test(commit);
}

function fetchedAt(now) {
  try {
    const value = now();
    return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : null;
  } catch (_error) {
    return null;
  }
}

function readError(repository, now, code, message, extra) {
  return {
    ok: false,
    repository: validRepository(repository) ? repository : null,
    ref: null,
    commit_sha: null,
    fetched_at: fetchedAt(now),
    error: {
      code,
      message,
      ...(extra || {})
    }
  };
}

export function readGitHubDefaultHeadWithJsonReader({
  repository,
  readJson,
  now = () => new Date().toISOString()
} = {}) {
  if (!validRepository(repository)) {
    return readError(repository, now, 'INVALID_REPOSITORY', 'Repository must use owner/repository form.');
  }
  if (typeof readJson !== 'function') {
    return readError(repository, now, 'MISSING_READER', 'A JSON reader is required.');
  }

  const encoded = repository.split('/').map(encodeURIComponent).join('/');
  const repoResult = readJson(API_ROOT + '/repos/' + encoded);
  if (!repoResult || repoResult.ok !== true) {
    const error = repoResult || {};
    return readError(
      repository,
      now,
      error.code || 'GITHUB_READ_FAILED',
      error.message || 'Repository metadata could not be read.',
      typeof error.httpStatus === 'number' ? { http_status: error.httpStatus } : undefined
    );
  }

  const defaultBranch = repoResult.data && repoResult.data.default_branch;
  if (typeof defaultBranch !== 'string' || defaultBranch.length === 0) {
    return readError(repository, now, 'MALFORMED_REPOSITORY_RESPONSE', 'Repository default_branch is missing.');
  }

  const commitResult = readJson(
    API_ROOT + '/repos/' + encoded + '/commits/' + encodeURIComponent(defaultBranch)
  );
  if (!commitResult || commitResult.ok !== true) {
    const error = commitResult || {};
    const result = readError(
      repository,
      now,
      error.code || 'GITHUB_READ_FAILED',
      error.message || 'Canonical branch head could not be read.',
      typeof error.httpStatus === 'number' ? { http_status: error.httpStatus } : undefined
    );
    result.ref = defaultBranch;
    return result;
  }

  const sha = commitResult.data && commitResult.data.sha;
  if (!validCommit(sha)) {
    const result = readError(repository, now, 'MALFORMED_COMMIT_RESPONSE', 'Canonical branch head SHA is missing or invalid.');
    result.ref = defaultBranch;
    return result;
  }

  return {
    ok: true,
    repository,
    ref: defaultBranch,
    commit_sha: sha.toLowerCase(),
    fetched_at: fetchedAt(now)
  };
}
