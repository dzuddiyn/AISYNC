// T-019D — truthful production telemetry.
//
// Ephemeral, owner-only, read-mostly operational snapshot. The snapshot is never
// persisted as telemetry and does not write GitHub, Sheets, or continuity state.
// GitHub App auth is actively probed by requesting a short-lived installation
// token, but the token value is never returned.

var ASC_TELEMETRY_VERSION_ = '0.1';

function ascTelemetryError_(code, message) {
  return { code: code, message: message };
}

function ascTelemetryProbe_(state, source, observedAt, details, error) {
  var probe = {
    state: state,
    source: source,
    observed_at: observedAt || new Date().toISOString()
  };
  if (details && typeof details === 'object') probe.details = details;
  if (error && typeof error === 'object') {
    probe.error = {
      code: error.code || 'UNKNOWN',
      message: error.message || 'Telemetry probe failed.'
    };
  }
  return probe;
}

function ascTelemetryOwner_() {
  try {
    return ascIsOwner_(ascAuthorizationContext_());
  } catch (error) {
    return false;
  }
}

function ascTelemetryParseReceipt_(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    var parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    return null;
  }
}

function ascTelemetryLatestSave_(history, observedAt) {
  var rows = Array.isArray(history) ? history : [];
  var row = null;
  for (var i = rows.length - 1; i >= 0; i -= 1) {
    if (String(rows[i].operation || '').toUpperCase() === 'SAVE') {
      row = rows[i];
      break;
    }
  }

  if (!row) {
    return ascTelemetryProbe_(
      'NOT_OBSERVED',
      'ASC_DB.HISTORY',
      observedAt,
      { note: 'No indexed SAVE row exists for this project.' }
    );
  }

  var receipt = ascTelemetryParseReceipt_(row.receipt_json);
  var details = {
    event_timestamp: row.timestamp || null,
    row_status: row.status || null,
    adapter_outcome: receipt && receipt.adapter_outcome ? receipt.adapter_outcome : null,
    verified: receipt && receipt.verified === true,
    write_performed: receipt && Object.prototype.hasOwnProperty.call(receipt, 'write_performed')
      ? receipt.write_performed
      : null
  };

  if (String(row.status || '').toUpperCase() === 'FAILED') {
    details.failure_reason = row.failure_reason || null;
    return ascTelemetryProbe_('FAILED', 'ASC_DB.HISTORY', observedAt, details);
  }

  if (
    String(row.status || '').toUpperCase() === 'SUCCESS' &&
    receipt &&
    receipt.status === 'SUCCESS' &&
    receipt.verified === true
  ) {
    return ascTelemetryProbe_('SUCCESS', 'ASC_DB.HISTORY', observedAt, details);
  }

  return ascTelemetryProbe_(
    'UNKNOWN',
    'ASC_DB.HISTORY',
    observedAt,
    details,
    ascTelemetryError_(
      'SAVE_EVIDENCE_INSUFFICIENT',
      'The latest indexed SAVE row is insufficient to prove a verified outcome.'
    )
  );
}

function ascTelemetryContinuityProbe_(projectId, observedAt) {
  var properties;
  var fileId;
  try {
    properties = PropertiesService.getScriptProperties();
    fileId = properties.getProperty(ASC_CONTINUITY_FILE_PROPERTY_);
  } catch (error) {
    return ascTelemetryProbe_(
      'ERROR',
      'PRIVATE_CONTINUITY',
      observedAt,
      null,
      ascTelemetryError_('CONTINUITY_POINTER_READ_FAILED', 'Private continuity pointer could not be read.')
    );
  }

  if (!fileId) {
    return ascTelemetryProbe_(
      'NOT_CONFIGURED',
      'PRIVATE_CONTINUITY',
      observedAt,
      { note: 'No authoritative continuity file pointer is configured.' }
    );
  }

  try {
    var file = DriveApp.getFileById(fileId);
    ascContinuityRequirePrivate_(file);
    var raw = file.getBlob().getDataAsString();
    var state = JSON.parse(raw);
    ascContinuityValidateState_(state);
    var projects = state.projects && typeof state.projects === 'object' ? state.projects : {};
    var projectState = Object.prototype.hasOwnProperty.call(projects, projectId)
      ? projects[projectId]
      : null;
    return ascTelemetryProbe_(
      'OK',
      'PRIVATE_CONTINUITY',
      observedAt,
      {
        schema_version: state.schema_version,
        project_count: Object.keys(projects).length,
        project_present: projectState !== null
      }
    );
  } catch (error) {
    return ascTelemetryProbe_(
      'ERROR',
      'PRIVATE_CONTINUITY',
      observedAt,
      null,
      ascTelemetryError_(
        String(error && error.message || 'CONTINUITY_READ_FAILED'),
        'Private continuity authority could not be read and validated.'
      )
    );
  }
}

function ascTelemetryGitHubAppProbe_(observedAt) {
  var configured = false;
  try {
    configured = ascGitHubAppConfigured_() === true && ascProductionRegistryConfigured_() === true;
  } catch (error) {
    configured = false;
  }

  if (!configured) {
    return ascTelemetryProbe_(
      'NOT_CONFIGURED',
      'GITHUB_APP_AUTH',
      observedAt,
      { credential_values_exposed: false },
      ascTelemetryError_(
        'PRODUCTION_WRITE_CONFIG_MISSING',
        'GitHub App or production project registry is not fully configured.'
      )
    );
  }

  var tokenResult;
  try {
    tokenResult = ascGitHubAppInstallationToken_();
  } catch (error) {
    return ascTelemetryProbe_(
      'ERROR',
      'GITHUB_APP_AUTH',
      observedAt,
      { credential_values_exposed: false },
      ascTelemetryError_('GITHUB_APP_AUTH_PROBE_FAILED', 'GitHub App auth probe failed.')
    );
  }

  if (!tokenResult || tokenResult.ok !== true) {
    return ascTelemetryProbe_(
      'ERROR',
      'GITHUB_APP_AUTH',
      observedAt,
      { credential_values_exposed: false },
      tokenResult && tokenResult.error
        ? tokenResult.error
        : ascTelemetryError_('GITHUB_APP_TOKEN_UNAVAILABLE', 'GitHub App installation token is unavailable.')
    );
  }

  return ascTelemetryProbe_(
    'OK',
    'GITHUB_APP_AUTH',
    observedAt,
    {
      token_issued: true,
      token_expires_at: tokenResult.expiresAt || null,
      credential_values_exposed: false,
      repository_write_performed: false
    }
  );
}

function ascTelemetryProjectEvidence_(projectResult, observedAt) {
  if (!projectResult || projectResult.ok !== true || !projectResult.project) {
    var error = projectResult && projectResult.error
      ? projectResult.error
      : ascTelemetryError_('ASC_DB_READ_FAILED', 'ASC DB project evidence could not be read.');
    return {
      asc_db: ascTelemetryProbe_('ERROR', 'ASC_DB', observedAt, null, error),
      canonical_github: ascTelemetryProbe_('NOT_OBSERVED', 'GITHUB_CANONICAL_HEAD', observedAt),
      index_freshness: ascTelemetryProbe_('NOT_OBSERVED', 'ASC_DB_INDEX', observedAt),
      latest_save: ascTelemetryProbe_('NOT_OBSERVED', 'ASC_DB.HISTORY', observedAt)
    };
  }

  var project = projectResult.project;
  var meta = project.index_metadata && typeof project.index_metadata === 'object'
    ? project.index_metadata
    : {};
  var freshness = meta.freshness_evidence && typeof meta.freshness_evidence === 'object'
    ? meta.freshness_evidence
    : {};
  var canonical = freshness.canonical && typeof freshness.canonical === 'object'
    ? freshness.canonical
    : null;

  var githubProbe;
  if (canonical && canonical.ok === true) {
    githubProbe = ascTelemetryProbe_(
      'OK',
      'GITHUB_CANONICAL_HEAD',
      canonical.fetched_at || observedAt,
      {
        repository: canonical.repository || project.github_repo || null,
        ref: canonical.ref || null,
        commit_sha: canonical.commit_sha || null
      }
    );
  } else if (canonical && canonical.ok === false) {
    githubProbe = ascTelemetryProbe_(
      'ERROR',
      'GITHUB_CANONICAL_HEAD',
      canonical.fetched_at || observedAt,
      { repository: project.github_repo || null },
      canonical.error || ascTelemetryError_('CANONICAL_HEAD_READ_FAILED', 'Canonical GitHub head could not be read.')
    );
  } else {
    githubProbe = ascTelemetryProbe_(
      'NOT_OBSERVED',
      'GITHUB_CANONICAL_HEAD',
      observedAt,
      { repository: project.github_repo || null }
    );
  }

  var freshnessState = String(meta.freshness || 'UNVERIFIED').toUpperCase();
  var freshnessDetails = {
    indexed_ref: meta.source_ref || null,
    indexed_commit: meta.source_commit || null,
    reason: freshness.reason || null
  };
  var freshnessProbe;
  if (freshnessState === 'CURRENT') {
    freshnessProbe = ascTelemetryProbe_('CURRENT', 'ASC_DB_INDEX', observedAt, freshnessDetails);
  } else if (freshnessState === 'STALE') {
    freshnessProbe = ascTelemetryProbe_('STALE', 'ASC_DB_INDEX', observedAt, freshnessDetails);
  } else {
    freshnessProbe = ascTelemetryProbe_('UNVERIFIED', 'ASC_DB_INDEX', observedAt, freshnessDetails);
  }

  return {
    asc_db: ascTelemetryProbe_(
      'OK',
      'ASC_DB',
      projectResult.source && projectResult.source.read_at
        ? projectResult.source.read_at
        : observedAt,
      {
        tabs_read: projectResult.source && Array.isArray(projectResult.source.tabs)
          ? projectResult.source.tabs.slice()
          : [],
        authority: projectResult.source && projectResult.source.authority
          ? projectResult.source.authority
          : 'OPERATIONAL_INDEX'
      }
    ),
    canonical_github: githubProbe,
    index_freshness: freshnessProbe,
    latest_save: ascTelemetryLatestSave_(projectResult.history, observedAt)
  };
}

function ascTelemetryOverall_(probes) {
  var required = [
    probes.asc_db,
    probes.canonical_github,
    probes.index_freshness,
    probes.private_continuity,
    probes.github_app_auth,
    probes.latest_save
  ].filter(function (probe) { return probe && typeof probe === 'object'; });

  var states = required.map(function (probe) { return String(probe.state || 'UNKNOWN').toUpperCase(); });

  if (states.some(function (state) {
    return state === 'ERROR' || state === 'NOT_CONFIGURED';
  })) {
    return {
      state: 'ERROR',
      reason: 'At least one required telemetry probe failed or is not configured.'
    };
  }

  if (states.some(function (state) {
    return state === 'STALE' || state === 'FAILED' || state === 'DEGRADED';
  })) {
    return {
      state: 'DEGRADED',
      reason: 'At least one required observation is stale, failed, or degraded.'
    };
  }

  if (states.some(function (state) {
    return state === 'UNKNOWN' || state === 'UNVERIFIED' || state === 'NOT_OBSERVED';
  })) {
    return {
      state: 'UNKNOWN',
      reason: 'Required evidence is incomplete; health is not inferred.'
    };
  }

  return {
    state: 'OK',
    reason: 'All required probes returned direct acceptable evidence in this snapshot.'
  };
}

function getProductionTelemetry(projectId) {
  var observedAt = new Date().toISOString();

  if (!ascTelemetryOwner_()) {
    return {
      ok: false,
      telemetry_version: ASC_TELEMETRY_VERSION_,
      observed_at: observedAt,
      error: ascTelemetryError_('OWNER_REQUIRED', 'Production telemetry requires the owner session.')
    };
  }

  if (typeof projectId !== 'string' || !projectId.trim()) {
    return {
      ok: false,
      telemetry_version: ASC_TELEMETRY_VERSION_,
      observed_at: observedAt,
      error: ascTelemetryError_('INVALID_PROJECT_ID', 'A project_id string is required.')
    };
  }

  var projectResult;
  try {
    projectResult = getDashboardProject(projectId);
  } catch (error) {
    projectResult = {
      ok: false,
      error: ascTelemetryError_('ASC_DB_READ_FAILED', 'ASC DB project evidence could not be read.')
    };
  }

  var projectEvidence = ascTelemetryProjectEvidence_(projectResult, observedAt);
  var probes = {
    asc_db: projectEvidence.asc_db,
    canonical_github: projectEvidence.canonical_github,
    index_freshness: projectEvidence.index_freshness,
    private_continuity: ascTelemetryContinuityProbe_(projectId, observedAt),
    github_app_auth: ascTelemetryGitHubAppProbe_(observedAt),
    latest_save: projectEvidence.latest_save
  };

  return {
    ok: true,
    telemetry_version: ASC_TELEMETRY_VERSION_,
    project_id: projectId,
    observed_at: observedAt,
    persisted: false,
    secrets_exposed: false,
    overall: ascTelemetryOverall_(probes),
    probes: probes
  };
}
