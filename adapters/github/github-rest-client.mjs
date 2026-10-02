const API_ROOT = 'https://api.github.com';
const API_HEADERS = Object.freeze({
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'AISYNC-T006B-GitHub-REST-Client'
});

function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

function errorResult(code, message, status) {
  return {
    ok: false,
    error: {
      code,
      message,
      ...(typeof status === 'number' ? { status } : {})
    }
  };
}

function validateRepository(repository) {
  return typeof repository === 'string' && /^[^/\s]+\/[^/\s]+$/.test(repository);
}

function validateReadInput(input) {
  if (!input || !validateRepository(input.repository)) {
    return errorResult('INVALID_REPOSITORY', 'Repository must use owner/repository form.');
  }

  if (!isNonEmptyString(input.path)) {
    return errorResult('INVALID_PATH', 'Path must be a non-empty string.');
  }

  if (!isNonEmptyString(input.branch)) {
    return errorResult('INVALID_BRANCH', 'Branch must be a non-empty string.');
  }

  return null;
}

function validateWriteInput(input) {
  const readError = validateReadInput(input);
  if (readError) {
    return readError;
  }

  if (typeof input.content !== 'string') {
    return errorResult('INVALID_CONTENT', 'Content must be a string.');
  }

  if (!isNonEmptyString(input.commitMessage)) {
    return errorResult('INVALID_COMMIT_MESSAGE', 'Commit message must be a non-empty string.');
  }

  if (Object.prototype.hasOwnProperty.call(input, 'sha') && !isNonEmptyString(input.sha)) {
    return errorResult('INVALID_SHA', 'SHA must be a non-empty string when supplied.');
  }

  return null;
}

function buildFileUrl(input) {
  const encodedPath = input.path
    .split('/')
    .map(encodeURIComponent)
    .join('/');

  return API_ROOT + '/repos/' + input.repository + '/contents/' + encodedPath +
    '?ref=' + encodeURIComponent(input.branch);
}

function createHeaders(token) {
  return {
    ...API_HEADERS,
    Authorization: 'Bearer ' + token
  };
}

async function readJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

function decodeBase64Utf8(value) {
  if (typeof value !== 'string') {
    throw new Error('Base64 content is not a string.');
  }

  const compact = value.replace(/\s/g, '');
  if (!compact || compact.length % 4 === 1 || !/^[A-Za-z0-9+/]*={0,2}$/.test(compact)) {
    throw new Error('Base64 content is malformed.');
  }

  const paddingIndex = compact.indexOf('=');
  if (paddingIndex >= 0 && paddingIndex < compact.length - 2) {
    throw new Error('Base64 padding is malformed.');
  }

  const bytes = Buffer.from(compact, 'base64');
  const canonical = bytes.toString('base64').replace(/=+$/, '');
  if (canonical !== compact.replace(/=+$/, '')) {
    throw new Error('Base64 content is malformed.');
  }

  return bytes.toString('utf8');
}

function validateConfig(token, fetchImpl) {
  if (!isNonEmptyString(token)) {
    return errorResult('MISSING_TOKEN', 'GitHub token configuration is missing.');
  }

  if (typeof fetchImpl !== 'function') {
    return errorResult('MISSING_FETCH', 'Fetch implementation is missing.');
  }

  return null;
}

function fetchFailure(errorCode, message) {
  return errorResult(errorCode, message);
}

export function createGitHubRestClient({ token, fetchImpl = globalThis.fetch } = {}) {
  const configError = validateConfig(token, fetchImpl);

  async function readFile(input) {
    const inputError = configError || validateReadInput(input);
    if (inputError) {
      return inputError;
    }

    try {
      const response = await fetchImpl(buildFileUrl(input), {
        method: 'GET',
        headers: createHeaders(token)
      });

      if (response.status === 404) {
        return { ok: true, found: false, sha: null, content: null };
      }

      if (response.status < 200 || response.status >= 300) {
        return errorResult('GITHUB_READ_FAILED', 'GitHub read request failed.', response.status);
      }

      const data = await readJson(response);
      if (!data || data.type !== 'file' || !isNonEmptyString(data.sha) || typeof data.content !== 'string') {
        return errorResult('MALFORMED_READ_RESPONSE', 'GitHub read response was not a valid file.');
      }

      let content;
      try {
        content = decodeBase64Utf8(data.content);
      } catch (error) {
        return errorResult('MALFORMED_FILE_CONTENT', 'GitHub file content was not valid Base64.');
      }

      return {
        ok: true,
        found: true,
        sha: data.sha,
        content
      };
    } catch (error) {
      return fetchFailure('GITHUB_FETCH_ERROR', 'GitHub request could not be completed.');
    }
  }

  async function writeFile(input) {
    const inputError = configError || validateWriteInput(input);
    if (inputError) {
      return inputError;
    }

    const body = {
      message: input.commitMessage,
      content: Buffer.from(input.content, 'utf8').toString('base64'),
      branch: input.branch
    };

    if (Object.prototype.hasOwnProperty.call(input, 'sha')) {
      body.sha = input.sha;
    }

    try {
      const response = await fetchImpl(buildFileUrl(input), {
        method: 'PUT',
        headers: createHeaders(token),
        body: JSON.stringify(body)
      });

      if (response.status < 200 || response.status >= 300) {
        return errorResult('GITHUB_WRITE_FAILED', 'GitHub write request failed.', response.status);
      }

      const data = await readJson(response);
      if (!data || !data.commit || !isNonEmptyString(data.commit.sha) ||
        !data.content || !isNonEmptyString(data.content.sha)) {
        return errorResult('MALFORMED_WRITE_RESPONSE', 'GitHub write response lacked valid identifiers.');
      }

      return {
        ok: true,
        commitSha: data.commit.sha,
        contentSha: data.content.sha
      };
    } catch (error) {
      return fetchFailure('GITHUB_FETCH_ERROR', 'GitHub request could not be completed.');
    }
  }

  return { readFile, writeFile };
}
