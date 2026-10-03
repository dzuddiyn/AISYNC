const INVOCATION_FIELDS = Object.freeze(['destination', 'adapterId', 'contract']);
const WRITE_SPEC_FIELDS = Object.freeze([
  'repository',
  'path',
  'branch',
  'content',
  'commitMessage'
]);

function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map(cloneValue);
  }

  if (value !== null && typeof value === 'object') {
    return Object.keys(value).reduce(function (copy, key) {
      copy[key] = cloneValue(value[key]);
      return copy;
    }, {});
  }

  return value;
}

function errorResult(code, message, field) {
  return { code, message, ...(field ? { field } : {}) };
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

function hasOnlyFields(value, fields) {
  return Object.keys(value).every(function (key) {
    return fields.includes(key);
  });
}

export function validateGitHubInvocation(invocation) {
  const errors = [];

  if (invocation === null || typeof invocation !== 'object' || Array.isArray(invocation)) {
    return {
      valid: false,
      errors: [errorResult('INVALID_INVOCATION', 'Invocation must be an object.')]
    };
  }

  if (invocation.destination !== 'GitHub') {
    errors.push(errorResult('INVALID_DESTINATION', 'Invocation destination must be GitHub.', 'destination'));
  }

  if (invocation.adapterId !== 'github') {
    errors.push(errorResult('INVALID_ADAPTER', 'Invocation adapterId must be github.', 'adapterId'));
  }

  if (invocation.contract === null || typeof invocation.contract !== 'object' || Array.isArray(invocation.contract)) {
    errors.push(errorResult('INVALID_CONTRACT', 'Invocation contract must be an object.', 'contract'));
  }

  return { valid: errors.length === 0, errors };
}

export function validateGitHubWriteSpec(writeSpec) {
  const errors = [];

  if (writeSpec === null || typeof writeSpec !== 'object' || Array.isArray(writeSpec)) {
    return {
      valid: false,
      errors: [errorResult('INVALID_WRITE_SPEC', 'Write spec must be an object.')]
    };
  }

  if (!hasOnlyFields(writeSpec, WRITE_SPEC_FIELDS)) {
    errors.push(errorResult('EXTRA_WRITE_SPEC_FIELD', 'Write spec contains an unsupported field.'));
  }

  ['repository', 'path', 'branch', 'commitMessage'].forEach(function (field) {
    if (!isNonEmptyString(writeSpec[field])) {
      errors.push(errorResult('INVALID_WRITE_SPEC_FIELD', 'Write spec field must be a non-empty string.', field));
    }
  });

  if (typeof writeSpec.content !== 'string') {
    errors.push(errorResult('INVALID_WRITE_SPEC_FIELD', 'Write spec content must be a string.', 'content'));
  }

  return { valid: errors.length === 0, errors };
}

function invalidInputResult(validation, writeSpecValidation) {
  return {
    outcome: 'INVALID_INPUT',
    writePerformed: false,
    verified: false,
    validation,
    writeSpecValidation
  };
}

function clientError(code, message) {
  return {
    ok: false,
    error: errorResult(code, message)
  };
}

async function callClient(method, input) {
  try {
    return await method(cloneValue(input));
  } catch (error) {
    return clientError('CLIENT_EXCEPTION', 'Injected GitHub client call failed.');
  }
}

function isValidReadResult(readResult) {
  if (!readResult || typeof readResult !== 'object' || typeof readResult.ok !== 'boolean') {
    return false;
  }

  if (!readResult.ok || typeof readResult.found !== 'boolean') {
    return false;
  }

  if (!readResult.found) {
    return readResult.sha === null && readResult.content === null;
  }

  return isNonEmptyString(readResult.sha) && typeof readResult.content === 'string';
}

function readFailure(readResult, code, message) {
  return {
    outcome: 'READ_ERROR',
    writePerformed: false,
    verified: false,
    error: cloneValue(readResult && readResult.error) || errorResult(
      code || 'READ_ERROR',
      message || 'GitHub read failed.'
    )
  };
}

function writeUnverifiedResult(writeSpec, commitSha, contentSha, persistedSha, error) {
  return {
    outcome: 'WRITE_UNVERIFIED',
    adapterId: 'github',
    destination: 'GitHub',
    repository: writeSpec.repository,
    path: writeSpec.path,
    branch: writeSpec.branch,
    writePerformed: true,
    commitSha,
    contentSha,
    persistedSha,
    verified: false,
    error: cloneValue(error)
  };
}

function isValidWriteResult(writeResult) {
  return writeResult !== null &&
    typeof writeResult === 'object' &&
    typeof writeResult.ok === 'boolean' &&
    (!writeResult.ok || isNonEmptyString(writeResult.commitSha));
}

export async function runGitHubAdapter(invocation, writeSpec, githubClient) {
  const validation = validateGitHubInvocation(invocation);
  const writeSpecValidation = validateGitHubWriteSpec(writeSpec);

  if (!validation.valid || !writeSpecValidation.valid) {
    return invalidInputResult(validation, writeSpecValidation);
  }

  if (!githubClient || typeof githubClient.readFile !== 'function' || typeof githubClient.writeFile !== 'function') {
    return invalidInputResult(
      validation,
      {
        valid: false,
        errors: [errorResult('INVALID_CLIENT', 'Injected GitHub client must expose readFile and writeFile.')]
      }
    );
  }

  const readInput = {
    repository: writeSpec.repository,
    path: writeSpec.path,
    branch: writeSpec.branch
  };
  const currentRead = await callClient(githubClient.readFile.bind(githubClient), readInput);

  if (!currentRead || currentRead.ok !== true) {
    return readFailure(currentRead || clientError('READ_ERROR', 'GitHub read failed.'));
  }

  if (!isValidReadResult(currentRead)) {
    return readFailure(
      currentRead,
      'MALFORMED_READ_RESULT',
      'GitHub read result was malformed.'
    );
  }

  if (currentRead.found === true && currentRead.content === writeSpec.content) {
    return {
      outcome: 'NO_CHANGE',
      adapterId: 'github',
      destination: 'GitHub',
      repository: writeSpec.repository,
      path: writeSpec.path,
      branch: writeSpec.branch,
      writePerformed: false,
      commitSha: null,
      existingSha: currentRead.sha || null,
      contentSha: currentRead.sha || null,
      verified: true
    };
  }

  const writeInput = {
    repository: writeSpec.repository,
    path: writeSpec.path,
    branch: writeSpec.branch,
    content: writeSpec.content,
    commitMessage: writeSpec.commitMessage
  };

  if (currentRead.found === true) {
    if (!isNonEmptyString(currentRead.sha)) {
      return readFailure(
        currentRead,
        'MISSING_CURRENT_SHA',
        'Existing GitHub file did not provide a current SHA.'
      );
    }
    writeInput.sha = currentRead.sha;
  }

  const writeResult = await callClient(githubClient.writeFile.bind(githubClient), writeInput);

  if (!writeResult || writeResult.ok !== true) {
    const writeError = cloneValue(writeResult && writeResult.error) ||
      errorResult('WRITE_ERROR', 'GitHub write failed.');

    if (writeError && writeError.code === 'GITHUB_WRITE_CONFLICT') {
      return {
        outcome: 'WRITE_CONFLICT',
        adapterId: 'github',
        destination: 'GitHub',
        repository: writeSpec.repository,
        path: writeSpec.path,
        branch: writeSpec.branch,
        writePerformed: false,
        commitSha: null,
        verified: false,
        error: writeError
      };
    }

    if (!writeError || writeError.outcomeKnown !== false) {
      return {
        outcome: 'WRITE_ERROR',
        adapterId: 'github',
        destination: 'GitHub',
        repository: writeSpec.repository,
        path: writeSpec.path,
        branch: writeSpec.branch,
        writePerformed: false,
        commitSha: writeResult && writeResult.commitSha ? writeResult.commitSha : null,
        verified: false,
        error: writeError
      };
    }

    // Unknown write outcome: do not blindly retry. Re-read the deterministic
    // destination and reconcile against the exact desired content.
    const reconciliationRead = await callClient(githubClient.readFile.bind(githubClient), readInput);
    if (reconciliationRead && reconciliationRead.ok === true &&
        isValidReadResult(reconciliationRead)) {
      if (reconciliationRead.found === true &&
          reconciliationRead.content === writeSpec.content) {
        return {
          outcome: 'VERIFIED_WRITE_RECONCILED',
          adapterId: 'github',
          destination: 'GitHub',
          repository: writeSpec.repository,
          path: writeSpec.path,
          branch: writeSpec.branch,
          writePerformed: null,
          commitSha: null,
          contentSha: reconciliationRead.sha,
          persistedSha: reconciliationRead.sha,
          verified: true,
          reconciliation: 'DESIRED_CONTENT_PRESENT'
        };
      }
      return {
        outcome: 'WRITE_ERROR',
        adapterId: 'github',
        destination: 'GitHub',
        repository: writeSpec.repository,
        path: writeSpec.path,
        branch: writeSpec.branch,
        writePerformed: false,
        commitSha: null,
        verified: false,
        error: writeError,
        reconciliation: 'DESIRED_CONTENT_ABSENT'
      };
    }

    return {
      outcome: 'WRITE_OUTCOME_UNKNOWN',
      adapterId: 'github',
      destination: 'GitHub',
      repository: writeSpec.repository,
      path: writeSpec.path,
      branch: writeSpec.branch,
      writePerformed: null,
      commitSha: null,
      verified: false,
      error: writeError,
      reconciliationError: cloneValue(reconciliationRead && reconciliationRead.error) ||
        errorResult('RECONCILIATION_READ_FAILED', 'GitHub write outcome could not be reconciled.')
    };
  }

  const commitSha = isNonEmptyString(writeResult.commitSha) ? writeResult.commitSha : null;
  const writeResponseValid = isValidWriteResult(writeResult);
  const persistedRead = await callClient(githubClient.readFile.bind(githubClient), readInput);

  if (!persistedRead || persistedRead.ok !== true) {
    return writeUnverifiedResult(
      writeSpec,
      commitSha,
      null,
      null,
      cloneValue(persistedRead && persistedRead.error) || errorResult('VERIFY_READ_ERROR', 'Persisted-state read failed.')
    );
  }

  if (!isValidReadResult(persistedRead)) {
    return writeUnverifiedResult(
      writeSpec,
      commitSha,
      null,
      null,
      errorResult('MALFORMED_VERIFY_RESULT', 'Persisted-state read result was malformed.')
    );
  }

  if (!writeResponseValid || persistedRead.found !== true || persistedRead.content !== writeSpec.content) {
    return writeUnverifiedResult(
      writeSpec,
      commitSha,
      null,
      persistedRead.sha,
      errorResult('CONTENT_MISMATCH', 'Persisted content or write response did not verify the proposed write.')
    );
  }

  return {
    outcome: 'VERIFIED_WRITE',
    adapterId: 'github',
    destination: 'GitHub',
    repository: writeSpec.repository,
    path: writeSpec.path,
    branch: writeSpec.branch,
    writePerformed: true,
    commitSha,
    contentSha: persistedRead.sha,
    persistedSha: persistedRead.sha,
    verified: true
  };
}
