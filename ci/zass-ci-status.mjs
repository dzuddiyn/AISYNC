const API_ROOT = 'https://api.github.com';
const API_HEADERS = Object.freeze({
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'AISYNC-T012A-ZASS-CI-Consumer'
});

const WORKFLOW_NAME = 'ZASS CI';
const JOB_NAME = 'zass-check';

function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

function validateRepository(repository) {
  return typeof repository === 'string' &&
    /^[^/\s]+\/[^/\s]+$/.test(repository);
}

function validateCommitSha(commitSha) {
  return typeof commitSha === 'string' && /^[0-9a-f]{40}$/i.test(commitSha);
}

function encodeRepository(repository) {
  return repository.split('/').map(encodeURIComponent).join('/');
}

function fetchedAt(now) {
  try {
    return now();
  } catch (error) {
    return null;
  }
}
function baseModel(repository, commitSha, now) {
  return {
    repository: repository || null,
    commit_sha: commitSha || null,
    workflow_name: WORKFLOW_NAME,
    job_name: JOB_NAME,
    run_id: null,
    status: null,
    conclusion: null,
    run_url: null,
    fetched_at: fetchedAt(now)
  };
}

function readError(repository, commitSha, now, code, message, httpStatus) {
  return {
    ok: false,
    ...baseModel(repository, commitSha, now),
    status: 'READ_ERROR',
    error: {
      code,
      message,
      ...(typeof httpStatus === 'number' ? { http_status: httpStatus } : {})
    }
  };
}

function notFound(repository, commitSha, now) {
  return {
    ok: true,
    ...baseModel(repository, commitSha, now),
    status: 'NOT_FOUND'
  };
}
function createHeaders(token) {
  const headers = { ...API_HEADERS };
  if (isNonEmptyString(token)) {
    headers.Authorization = 'Bearer ' + token;
  }
  return headers;
}

async function readJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function fetchJson(fetchImpl, url, headers) {
  let response;
  try {
    response = await fetchImpl(url, {
      method: 'GET',
      headers
    });
  } catch (error) {
    return { ok: false, code: 'GITHUB_FETCH_ERROR', message: 'GitHub request could not be completed.' };
  }

  if (!response || typeof response.status !== 'number') {
    return { ok: false, code: 'MALFORMED_HTTP_RESPONSE', message: 'GitHub response was malformed.' };
  }

  if (response.status < 200 || response.status >= 300) {
    return {
      ok: false,
      code: 'GITHUB_READ_FAILED',
      message: 'GitHub read request failed.',
      httpStatus: response.status
    };
  }
  const data = await readJson(response);
  if (data === null) {
    return { ok: false, code: 'MALFORMED_JSON_RESPONSE', message: 'GitHub response JSON was malformed.' };
  }

  return { ok: true, data };
}

function selectWorkflowRun(workflowRuns, commitSha) {
  const matches = workflowRuns.filter(function (run) {
    return run &&
      run.name === WORKFLOW_NAME &&
      run.head_sha === commitSha &&
      Number.isSafeInteger(run.id);
  });

  if (matches.length === 0) {
    return null;
  }

  return matches.slice().sort(function (a, b) {
    const attemptA = Number.isSafeInteger(a.run_attempt) ? a.run_attempt : 0;
    const attemptB = Number.isSafeInteger(b.run_attempt) ? b.run_attempt : 0;
    if (attemptA !== attemptB) return attemptB - attemptA;
    return b.id - a.id;
  })[0];
}

function normalizeJobStatus(job) {
  if (job.status === 'completed') {
    if (!isNonEmptyString(job.conclusion)) return null;
    return job.conclusion === 'success' ? 'SUCCESS' : 'FAILURE';
  }
  if (job.status === 'in_progress') {
    return 'IN_PROGRESS';
  }

  if (['queued', 'waiting', 'pending', 'requested'].includes(job.status)) {
    return 'QUEUED';
  }

  return null;
}

function successfulModel(repository, commitSha, run, job, now, status) {
  return {
    ok: true,
    repository,
    commit_sha: commitSha,
    workflow_name: WORKFLOW_NAME,
    job_name: JOB_NAME,
    run_id: run.id,
    status,
    conclusion: job.conclusion ?? null,
    run_url: isNonEmptyString(run.html_url) ? run.html_url : null,
    fetched_at: fetchedAt(now)
  };
}

// Synchronous transport-binding surface for runtimes such as Apps Script.
// The injected reader performs GET-only JSON transport and returns the same small
// {ok,data|error} boundary used below. ZASS validation semantics remain outside ASC.
export function readZassCiStatusWithJsonReader({
  repository,
  commitSha,
  readJson: jsonReader,
  now = () => new Date().toISOString()
} = {}) {
  if (typeof jsonReader !== 'function') {
    return readError(repository, commitSha, now, 'MISSING_READER', 'A JSON reader is required.');
  }

  if (!validateRepository(repository)) {
    return readError(repository, commitSha, now, 'INVALID_REPOSITORY', 'Repository must use owner/repository form.');
  }

  if (!validateCommitSha(commitSha)) {
    return readError(repository, commitSha, now, 'INVALID_COMMIT_SHA', 'Commit SHA must be a full 40-character hexadecimal SHA.');
  }

  const encodedRepository = encodeRepository(repository);
  const runsUrl = API_ROOT + '/repos/' + encodedRepository +
    '/actions/runs?head_sha=' + encodeURIComponent(commitSha) + '&per_page=100';

  const runsResult = jsonReader(runsUrl);
  if (!runsResult || runsResult.ok !== true) {
    const error = runsResult || {};
    return readError(repository, commitSha, now,
      error.code || 'GITHUB_READ_FAILED',
      error.message || 'GitHub workflow-runs read failed.',
      error.httpStatus);
  }

  if (!runsResult.data || !Array.isArray(runsResult.data.workflow_runs)) {
    return readError(repository, commitSha, now, 'MALFORMED_RUNS_RESPONSE', 'GitHub workflow-runs response was malformed.');
  }

  const run = selectWorkflowRun(runsResult.data.workflow_runs, commitSha);
  if (!run) {
    return notFound(repository, commitSha, now);
  }

  const jobsUrl = API_ROOT + '/repos/' + encodedRepository +
    '/actions/runs/' + run.id + '/jobs?filter=latest&per_page=100';
  const jobsResult = jsonReader(jobsUrl);

  if (!jobsResult || jobsResult.ok !== true) {
    const error = jobsResult || {};
    return readError(repository, commitSha, now,
      error.code || 'GITHUB_READ_FAILED',
      error.message || 'GitHub jobs read failed.',
      error.httpStatus);
  }

  if (!jobsResult.data || !Array.isArray(jobsResult.data.jobs)) {
    return readError(repository, commitSha, now, 'MALFORMED_JOBS_RESPONSE', 'GitHub jobs response was malformed.');
  }

  const matchingJobs = jobsResult.data.jobs.filter(function (job) {
    return job && job.name === JOB_NAME;
  });

  if (matchingJobs.length === 0) {
    return notFound(repository, commitSha, now);
  }

  if (matchingJobs.length !== 1) {
    return readError(repository, commitSha, now, 'AMBIGUOUS_ZASS_CI_JOB', 'Multiple matching ZASS CI jobs were returned.');
  }

  const job = matchingJobs[0];
  const status = normalizeJobStatus(job);
  if (!status) {
    return readError(repository, commitSha, now, 'UNSUPPORTED_JOB_STATE', 'ZASS CI job state could not be normalized safely.');
  }

  return successfulModel(repository, commitSha, run, job, now, status);
}

export function createZassCiStatusConsumer({
  fetchImpl = globalThis.fetch,
  token = null,
  now = () => new Date().toISOString()
} = {}) {
  async function readStatus({ repository, commitSha } = {}) {
    if (typeof fetchImpl !== 'function') {
      return readError(repository, commitSha, now, 'MISSING_FETCH', 'Fetch implementation is missing.');
    }
    if (!validateRepository(repository)) {
      return readError(repository, commitSha, now, 'INVALID_REPOSITORY', 'Repository must use owner/repository form.');
    }

    if (!validateCommitSha(commitSha)) {
      return readError(repository, commitSha, now, 'INVALID_COMMIT_SHA', 'Commit SHA must be a full 40-character hexadecimal SHA.');
    }

    const headers = createHeaders(token);
    const encodedRepository = encodeRepository(repository);
    const runsUrl = API_ROOT + '/repos/' + encodedRepository +
      '/actions/runs?head_sha=' + encodeURIComponent(commitSha) + '&per_page=100';

    const runsResult = await fetchJson(fetchImpl, runsUrl, headers);
    if (!runsResult.ok) {
      return readError(
        repository,
        commitSha,
        now,
        runsResult.code,
        runsResult.message,
        runsResult.httpStatus
      );
    }

    if (!runsResult.data || !Array.isArray(runsResult.data.workflow_runs)) {
      return readError(repository, commitSha, now, 'MALFORMED_RUNS_RESPONSE', 'GitHub workflow-runs response was malformed.');
    }

    const run = selectWorkflowRun(runsResult.data.workflow_runs, commitSha);
    if (!run) {
      return notFound(repository, commitSha, now);
    }

    const jobsUrl = API_ROOT + '/repos/' + encodedRepository +
      '/actions/runs/' + run.id + '/jobs?filter=latest&per_page=100';
    const jobsResult = await fetchJson(fetchImpl, jobsUrl, headers);

    if (!jobsResult.ok) {
      return readError(
        repository,
        commitSha,
        now,
        jobsResult.code,
        jobsResult.message,
        jobsResult.httpStatus
      );
    }

    if (!jobsResult.data || !Array.isArray(jobsResult.data.jobs)) {
      return readError(repository, commitSha, now, 'MALFORMED_JOBS_RESPONSE', 'GitHub jobs response was malformed.');
    }

    const matchingJobs = jobsResult.data.jobs.filter(function (job) {
      return job && job.name === JOB_NAME;
    });

    if (matchingJobs.length === 0) {
      return notFound(repository, commitSha, now);
    }

    if (matchingJobs.length !== 1) {
      return readError(repository, commitSha, now, 'AMBIGUOUS_ZASS_CI_JOB', 'Multiple matching ZASS CI jobs were returned.');
    }

    const job = matchingJobs[0];
    const status = normalizeJobStatus(job);
    if (!status) {
      return readError(repository, commitSha, now, 'UNSUPPORTED_JOB_STATE', 'ZASS CI job state could not be normalized safely.');
    }

    return successfulModel(repository, commitSha, run, job, now, status);
  }

  return Object.freeze({ readStatus });
}

export const ZASS_CI_IDENTITY = Object.freeze({
  workflow_name: WORKFLOW_NAME,
  job_name: JOB_NAME
});
