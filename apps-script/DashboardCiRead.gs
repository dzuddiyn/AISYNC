// T-012B — Apps Script binding for the read-only ZASS CI status consumer.
//
// This file owns transport/runtime mechanics only. The authoritative workflow/job
// identity and status normalization remain in ci/zass-ci-status.mjs, mechanically
// bundled into AscRuntime.gs. No ZASS validation rule is implemented here.

const ASC_ZASS_CI_GITHUB_API_PREFIX_ = 'https://api.github.com/';
const ASC_ZASS_CI_GITHUB_HEADERS_ = Object.freeze({
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28'
});

function ascZassCiTransportError_(code, message, httpStatus) {
  return {
    ok: false,
    code: code,
    message: message,
    ...(typeof httpStatus === 'number' ? { httpStatus: httpStatus } : {})
  };
}

function ascReadGitHubJson_(url) {
  if (typeof url !== 'string' || url.indexOf(ASC_ZASS_CI_GITHUB_API_PREFIX_) !== 0) {
    return ascZassCiTransportError_('INVALID_GITHUB_API_URL', 'Only the GitHub API origin is allowed.');
  }
  let response;
  try {
    response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: ASC_ZASS_CI_GITHUB_HEADERS_,
      muteHttpExceptions: true,
      followRedirects: false
    });
  } catch (error) {
    return ascZassCiTransportError_('GITHUB_FETCH_ERROR', 'GitHub request could not be completed.');
  }

  const status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    return ascZassCiTransportError_(
      'GITHUB_READ_FAILED',
      'GitHub read request failed.',
      status
    );
  }

  let data;
  try {
    data = JSON.parse(response.getContentText());
  } catch (error) {
    return ascZassCiTransportError_('MALFORMED_JSON_RESPONSE', 'GitHub response JSON was malformed.');
  }

  return { ok: true, data: data };
}

function ascReadGitHubActionsJson_(url) {
  return ascReadGitHubJson_(url);
}

function getDashboardZassCiStatus(repository, commitSha) {
  try {
    return ascRuntime_().zassCi.readZassCiStatusWithJsonReader({
      repository: repository,
      commitSha: commitSha,
      readJson: ascReadGitHubActionsJson_,
      now: function () { return new Date().toISOString(); }
    });
  } catch (error) {
    return {
      ok: false,
      repository: typeof repository === 'string' ? repository : null,
      commit_sha: typeof commitSha === 'string' ? commitSha : null,
      workflow_name: 'ZASS CI',
      job_name: 'zass-check',
      run_id: null,
      status: 'READ_ERROR',
      conclusion: null,
      run_url: null,
      fetched_at: new Date().toISOString(),
      error: {
        code: 'ZASS_CI_BINDING_ERROR',
        message: 'ZASS CI status could not be read.'
      }
    };
  }
}
