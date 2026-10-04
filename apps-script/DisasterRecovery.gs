// T-019E — cross-component disaster recovery + migration safety.
//
// Recovery bundle is intentionally portable JSON and intentionally excludes secret
// credential values. It can be kept private in Drive and exported out-of-band by
// the owner. GitHub remains canonical for project artifacts; ASC DB is a recoverable
// operational/index projection; private continuity remains its own authority.

var ASC_DR_BUNDLE_VERSION_ = '0.1';
var ASC_DR_DB_SCHEMA_VERSION_ = '0.1';
var ASC_DR_BUNDLE_PREFIX_ = 'AISYNC-disaster-recovery-v0.1-';
var ASC_DR_RECOVERY_DB_PREFIX_ = 'AISYNC ASC DB recovery ';
var ASC_DR_LOCK_TIMEOUT_MS_ = 30000;

function ascDrRequireOwner_() {
  if (!ascIsOwner_(ascAuthorizationContext_())) {
    throw new Error('DR_OWNER_REQUIRED');
  }
}

function ascDrHex_(bytes) {
  return bytes.map(function (byte) {
    var value = byte < 0 ? byte + 256 : byte;
    return ('0' + value.toString(16)).slice(-2);
  }).join('');
}

function ascDrSha256_(value) {
  return ascDrHex_(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value),
    Utilities.Charset.UTF_8
  ));
}

function ascDrClone_(value) {
  return JSON.parse(JSON.stringify(value));
}

function ascDrSortedJson_(value) {
  function normalize(node) {
    if (Array.isArray(node)) return node.map(normalize);
    if (!node || typeof node !== 'object') return node;
    var copy = {};
    Object.keys(node).sort().forEach(function (key) {
      copy[key] = normalize(node[key]);
    });
    return copy;
  }
  return JSON.stringify(normalize(value));
}

function ascDrFingerprint_(value) {
  return ascDrSha256_(ascDrSortedJson_(value));
}

function ascDrReadProperty_(properties, key) {
  var value = properties.getProperty(key);
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function ascDrSafeConfig_() {
  var properties = PropertiesService.getScriptProperties();
  return {
    asc_db_spreadsheet_id: ascDbSpreadsheetId_(),
    main_ui_url: ascDrReadProperty_(properties, 'ASC_MAIN_UI_URL'),
    production_registry_json: ascDrReadProperty_(properties, 'ASC_GITHUB_PROJECT_REGISTRY'),
    github_app_client_id: ascDrReadProperty_(properties, 'GITHUB_APP_CLIENT_ID'),
    github_app_installation_id: ascDrReadProperty_(properties, 'GITHUB_APP_INSTALLATION_ID'),
    credential_presence: {
      github_app_private_key: Boolean(ascDrReadProperty_(properties, 'GITHUB_APP_PRIVATE_KEY')),
      legacy_github_read_token: Boolean(ascDrReadProperty_(properties, 'GITHUB_TOKEN'))
    }
  };
}

function ascDrContainsSecretMaterial_(value) {
  var forbiddenKeys = {
    GITHUB_APP_PRIVATE_KEY: true,
    GITHUB_TOKEN: true,
    github_app_private_key_value: true,
    github_token_value: true,
    private_key: true,
    privateKey: true,
    token: true,
    authorization: true,
    client_secret: true
  };

  function visit(node) {
    if (node === null || node === undefined) return false;
    if (typeof node === 'string') {
      return /-----BEGIN (?:RSA )?PRIVATE KEY-----|Bearer\s+[A-Za-z0-9._-]+/i.test(node);
    }
    if (typeof node !== 'object') return false;
    if (Array.isArray(node)) return node.some(visit);
    return Object.keys(node).some(function (key) {
      if (forbiddenKeys[key]) return true;
      return visit(node[key]);
    });
  }

  return visit(value);
}

function ascDrValidateTabValues_(tabName, values) {
  var required = ASC_DB_SCHEMA_[tabName];
  if (!Array.isArray(required)) throw new Error('DR_DB_UNKNOWN_TAB');
  if (!Array.isArray(values) || values.length < 1 || !Array.isArray(values[0])) {
    throw new Error('DR_DB_SCHEMA_INCOMPATIBLE');
  }

  var header = values[0].map(function (cell) { return String(cell); });
  var seen = {};
  var duplicates = {};
  header.forEach(function (name) {
    if (seen[name]) duplicates[name] = true;
    seen[name] = true;
  });

  var missing = required.filter(function (name) { return !seen[name]; });
  var duplicateRequired = required.filter(function (name) { return duplicates[name] === true; });
  if (missing.length || duplicateRequired.length) {
    throw new Error('DR_DB_SCHEMA_INCOMPATIBLE');
  }

  var width = header.length;
  for (var r = 1; r < values.length; r += 1) {
    if (!Array.isArray(values[r]) || values[r].length !== width) {
      throw new Error('DR_DB_ROW_WIDTH_MISMATCH');
    }
  }

  return {
    header: header,
    row_count: Math.max(0, values.length - 1),
    column_count: width
  };
}

function ascDrReadDbSnapshot_(spreadsheetId) {
  var id = typeof spreadsheetId === 'string' && spreadsheetId
    ? spreadsheetId
    : ascDbSpreadsheetId_();
  var spreadsheet = SpreadsheetApp.openById(id);
  var tabs = {};
  ['PROJECTS', 'RECORDS', 'ACTION_PLAN', 'HISTORY'].forEach(function (tabName) {
    var sheet = spreadsheet.getSheetByName(tabName);
    if (!sheet) throw new Error('DR_DB_TAB_MISSING_' + tabName);
    var values = sheet.getDataRange().getDisplayValues();
    var shape = ascDrValidateTabValues_(tabName, values);
    tabs[tabName] = {
      values: values,
      row_count: shape.row_count,
      column_count: shape.column_count,
      sha256: ascDrFingerprint_(values)
    };
  });

  return {
    schema_version: ASC_DR_DB_SCHEMA_VERSION_,
    spreadsheet_id: id,
    tabs: tabs,
    sha256: ascDrFingerprint_(tabs)
  };
}

function ascDrReadContinuitySnapshot_() {
  var properties = PropertiesService.getScriptProperties();
  var fileId = properties.getProperty(ASC_CONTINUITY_FILE_PROPERTY_);
  if (!fileId) throw new Error('DR_CONTINUITY_POINTER_MISSING');

  var file = DriveApp.getFileById(fileId);
  ascContinuityRequirePrivate_(file);
  var raw = file.getBlob().getDataAsString();
  var state = JSON.parse(raw);
  ascContinuityValidateState_(state);

  return {
    schema_version: state.schema_version,
    source_state_file_id: fileId,
    state: ascContinuityClone_(state),
    sha256: ascDrFingerprint_(state)
  };
}

function ascDrReadCanonicalRecoveryPoint_() {
  var project = getDashboardProject('AISYNC');
  if (!project || project.ok !== true || !project.project) {
    throw new Error('DR_CANONICAL_PROJECT_READ_FAILED');
  }
  var freshness = project.project.index_metadata &&
    project.project.index_metadata.freshness_evidence;
  var canonical = freshness && freshness.canonical;
  if (!canonical || canonical.ok !== true ||
      !canonical.repository || !canonical.ref || !canonical.commit_sha) {
    throw new Error('DR_CANONICAL_GITHUB_UNVERIFIED');
  }
  return {
    repository: canonical.repository,
    ref: canonical.ref,
    commit_sha: canonical.commit_sha,
    fetched_at: canonical.fetched_at || new Date().toISOString()
  };
}

function ascDrBundleBody_(createdAt) {
  var db = ascDrReadDbSnapshot_();
  var continuity = ascDrReadContinuitySnapshot_();
  var canonical = ascDrReadCanonicalRecoveryPoint_();
  var config = ascDrSafeConfig_();

  var body = {
    bundle_version: ASC_DR_BUNDLE_VERSION_,
    created_at: createdAt,
    source: {
      canonical_github: canonical,
      asc_db_spreadsheet_id: db.spreadsheet_id,
      continuity_state_file_id: continuity.source_state_file_id
    },
    asc_db: db,
    private_continuity: continuity,
    nonsecret_config: config,
    recovery_notes: {
      github_artifacts: 'Recover from canonical Git history at source.canonical_github.',
      asc_db: 'Create a staged recovery spreadsheet from this snapshot, validate it, then migrate the ASC_DB_SPREADSHEET_ID pointer.',
      private_continuity: 'Use the embedded validated state only when the current continuity authority is unavailable; healthy current authority must not be overwritten by disaster recovery.',
      secrets: 'Credential values are intentionally excluded. Re-provision or rotate credentials separately.'
    }
  };

  if (ascDrContainsSecretMaterial_(body)) {
    throw new Error('DR_BUNDLE_SECRET_MATERIAL_DETECTED');
  }
  return body;
}

function ascDrFinalizeBundle_(body) {
  var copy = ascDrClone_(body);
  delete copy.bundle_sha256;
  copy.bundle_sha256 = ascDrFingerprint_(copy);
  return copy;
}

function ascDrValidateBundleObject_(bundle) {
  if (!bundle || typeof bundle !== 'object' || Array.isArray(bundle)) {
    throw new Error('DR_BUNDLE_INVALID');
  }
  if (bundle.bundle_version !== ASC_DR_BUNDLE_VERSION_) {
    throw new Error('DR_BUNDLE_UNSUPPORTED_VERSION');
  }
  if (typeof bundle.created_at !== 'string' || isNaN(Date.parse(bundle.created_at))) {
    throw new Error('DR_BUNDLE_INVALID_CREATED_AT');
  }
  if (typeof bundle.bundle_sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(bundle.bundle_sha256)) {
    throw new Error('DR_BUNDLE_CHECKSUM_MISSING');
  }

  var checksumCopy = ascDrClone_(bundle);
  var claimed = checksumCopy.bundle_sha256;
  delete checksumCopy.bundle_sha256;
  if (ascDrFingerprint_(checksumCopy) !== claimed) {
    throw new Error('DR_BUNDLE_CHECKSUM_MISMATCH');
  }
  if (ascDrContainsSecretMaterial_(bundle)) {
    throw new Error('DR_BUNDLE_SECRET_MATERIAL_DETECTED');
  }

  if (!bundle.asc_db || bundle.asc_db.schema_version !== ASC_DR_DB_SCHEMA_VERSION_) {
    throw new Error('DR_DB_UNSUPPORTED_SCHEMA');
  }
  var tabs = bundle.asc_db.tabs;
  if (!tabs || typeof tabs !== 'object') throw new Error('DR_DB_TABS_MISSING');
  ['PROJECTS', 'RECORDS', 'ACTION_PLAN', 'HISTORY'].forEach(function (tabName) {
    var tab = tabs[tabName];
    if (!tab || !Array.isArray(tab.values)) throw new Error('DR_DB_TAB_MISSING_' + tabName);
    var shape = ascDrValidateTabValues_(tabName, tab.values);
    if (shape.row_count !== tab.row_count || shape.column_count !== tab.column_count) {
      throw new Error('DR_DB_TAB_SHAPE_MISMATCH');
    }
    if (ascDrFingerprint_(tab.values) !== tab.sha256) {
      throw new Error('DR_DB_TAB_CHECKSUM_MISMATCH');
    }
  });
  if (ascDrFingerprint_(tabs) !== bundle.asc_db.sha256) {
    throw new Error('DR_DB_CHECKSUM_MISMATCH');
  }

  if (!bundle.private_continuity ||
      bundle.private_continuity.schema_version !== ASC_CONTINUITY_STORE_VERSION_) {
    throw new Error('DR_CONTINUITY_UNSUPPORTED_SCHEMA');
  }
  ascContinuityValidateState_(bundle.private_continuity.state);
  if (ascDrFingerprint_(bundle.private_continuity.state) !==
      bundle.private_continuity.sha256) {
    throw new Error('DR_CONTINUITY_CHECKSUM_MISMATCH');
  }

  var canonical = bundle.source && bundle.source.canonical_github;
  if (!canonical || typeof canonical.repository !== 'string' || !canonical.repository ||
      typeof canonical.ref !== 'string' || !canonical.ref ||
      typeof canonical.commit_sha !== 'string' || !/^[0-9a-f]{40}$/.test(canonical.commit_sha)) {
    throw new Error('DR_CANONICAL_RECOVERY_POINT_INVALID');
  }

  return ascDrClone_(bundle);
}

function ascDrReadBundleFile_(bundleFileId) {
  if (typeof bundleFileId !== 'string' || !bundleFileId.trim()) {
    throw new Error('DR_BUNDLE_FILE_ID_REQUIRED');
  }
  var file = DriveApp.getFileById(bundleFileId.trim());
  ascContinuityRequirePrivate_(file);
  if (typeof file.isTrashed === 'function' && file.isTrashed()) {
    throw new Error('DR_BUNDLE_FILE_NOT_FOUND');
  }
  var name = typeof file.getName === 'function' ? file.getName() : '';
  if (name.indexOf(ASC_DR_BUNDLE_PREFIX_) !== 0) {
    throw new Error('DR_BUNDLE_FILE_NOT_RECOGNIZED');
  }

  var parsed;
  try {
    parsed = JSON.parse(file.getBlob().getDataAsString());
  } catch (error) {
    throw new Error('DR_BUNDLE_MALFORMED_JSON');
  }
  return {
    file: file,
    bundle: ascDrValidateBundleObject_(parsed)
  };
}

function ascCreateDisasterRecoveryBundle_() {
  ascDrRequireOwner_();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(ASC_DR_LOCK_TIMEOUT_MS_)) throw new Error('DR_LOCK_UNAVAILABLE');

  try {
    var createdAt = new Date().toISOString();
    var bundle = ascDrFinalizeBundle_(ascDrBundleBody_(createdAt));
    var serialized = JSON.stringify(bundle, null, 2);
    var name = ASC_DR_BUNDLE_PREFIX_ +
      Utilities.formatDate(new Date(createdAt), 'UTC', 'yyyyMMdd-HHmmss') + '.json';
    var file = DriveApp.createFile(name, serialized, MimeType.PLAIN_TEXT);
    ascContinuityRequirePrivate_(file);

    var reread;
    try {
      reread = JSON.parse(file.getBlob().getDataAsString());
    } catch (error) {
      throw new Error('DR_BUNDLE_VERIFY_READ_FAILED');
    }
    ascDrValidateBundleObject_(reread);
    if (JSON.stringify(reread) !== JSON.stringify(bundle)) {
      throw new Error('DR_BUNDLE_VERIFY_MISMATCH');
    }

    return {
      status: 'DR_BUNDLE_CREATED',
      bundle_file_id: file.getId(),
      file_name: name,
      created_at: createdAt,
      bundle_version: bundle.bundle_version,
      bundle_sha256: bundle.bundle_sha256,
      asc_db_spreadsheet_id: bundle.asc_db.spreadsheet_id,
      continuity_state_file_id: bundle.private_continuity.source_state_file_id,
      canonical_github: ascDrClone_(bundle.source.canonical_github),
      secrets_included: false
    };
  } finally {
    lock.releaseLock();
  }
}

function ascValidateDisasterRecoveryBundle_(bundleFileId) {
  ascDrRequireOwner_();
  var read = ascDrReadBundleFile_(bundleFileId);
  return {
    status: 'DR_BUNDLE_VALID',
    bundle_file_id: read.file.getId(),
    bundle_version: read.bundle.bundle_version,
    bundle_sha256: read.bundle.bundle_sha256,
    canonical_github: ascDrClone_(read.bundle.source.canonical_github),
    asc_db_schema_version: read.bundle.asc_db.schema_version,
    continuity_schema_version: read.bundle.private_continuity.schema_version,
    secrets_included: false
  };
}

function ascValidateAscDbCandidate_(spreadsheetId) {
  if (typeof spreadsheetId !== 'string' || !spreadsheetId.trim()) {
    throw new Error('DR_DB_CANDIDATE_ID_REQUIRED');
  }
  var id = spreadsheetId.trim();

  var driveFile = DriveApp.getFileById(id);
  ascContinuityRequirePrivate_(driveFile);
  var snapshot = ascDrReadDbSnapshot_(id);

  return {
    status: 'DR_DB_CANDIDATE_VALID',
    spreadsheet_id: id,
    schema_version: snapshot.schema_version,
    sha256: snapshot.sha256,
    tab_shapes: Object.keys(snapshot.tabs).reduce(function (out, tabName) {
      out[tabName] = {
        row_count: snapshot.tabs[tabName].row_count,
        column_count: snapshot.tabs[tabName].column_count,
        sha256: snapshot.tabs[tabName].sha256
      };
      return out;
    }, {})
  };
}

function ascCreateAscDbRecoveryCopy_(bundleFileId) {
  ascDrRequireOwner_();
  var read = ascDrReadBundleFile_(bundleFileId);
  var bundle = read.bundle;
  var title = ASC_DR_RECOVERY_DB_PREFIX_ +
    Utilities.formatDate(new Date(), 'UTC', 'yyyyMMdd-HHmmss');
  var spreadsheet = SpreadsheetApp.create(title);
  var driveFile = DriveApp.getFileById(spreadsheet.getId());
  ascContinuityRequirePrivate_(driveFile);

  var names = ['PROJECTS', 'RECORDS', 'ACTION_PLAN', 'HISTORY'];
  var first = spreadsheet.getSheets()[0];
  first.setName(names[0]);

  names.forEach(function (tabName, index) {
    var sheet = index === 0 ? first : spreadsheet.insertSheet(tabName);
    var values = bundle.asc_db.tabs[tabName].values;
    var rows = values.length;
    var cols = values[0].length;
    sheet.getRange(1, 1, rows, cols).setValues(values);
  });

  var validated = ascValidateAscDbCandidate_(spreadsheet.getId());
  if (validated.sha256 !== bundle.asc_db.sha256) {
    try { driveFile.setTrashed(true); } catch (error) {}
    throw new Error('DR_DB_RECOVERY_COPY_VERIFY_MISMATCH');
  }

  return {
    status: 'DR_DB_RECOVERY_COPY_CREATED',
    bundle_file_id: read.file.getId(),
    spreadsheet_id: spreadsheet.getId(),
    sha256: validated.sha256,
    source_spreadsheet_id: bundle.asc_db.spreadsheet_id
  };
}

function ascMigrateAscDb_(input) {
  ascDrRequireOwner_();
  var request = input && typeof input === 'object' ? input : {};
  var expectedCurrent = typeof request.expectedCurrentSpreadsheetId === 'string'
    ? request.expectedCurrentSpreadsheetId.trim()
    : '';
  var candidateId = typeof request.candidateSpreadsheetId === 'string'
    ? request.candidateSpreadsheetId.trim()
    : '';
  var expectedCandidateSha = typeof request.expectedCandidateSha256 === 'string'
    ? request.expectedCandidateSha256.trim()
    : '';

  if (!expectedCurrent) throw new Error('DR_DB_EXPECTED_CURRENT_REQUIRED');
  if (!candidateId) throw new Error('DR_DB_CANDIDATE_ID_REQUIRED');
  if (!/^[0-9a-f]{64}$/.test(expectedCandidateSha)) {
    throw new Error('DR_DB_CANDIDATE_CHECKSUM_REQUIRED');
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(ASC_DR_LOCK_TIMEOUT_MS_)) throw new Error('DR_LOCK_UNAVAILABLE');

  var properties = PropertiesService.getScriptProperties();
  var priorRaw = properties.getProperty(ASC_DB_SPREADSHEET_PROPERTY_);
  var current = ascDbSpreadsheetId_();

  try {
    if (current !== expectedCurrent) throw new Error('DR_DB_CURRENT_CHANGED');
    if (candidateId === current) throw new Error('DR_DB_CANDIDATE_IS_CURRENT');

    var candidate = ascValidateAscDbCandidate_(candidateId);
    if (candidate.sha256 !== expectedCandidateSha) {
      throw new Error('DR_DB_CANDIDATE_CHECKSUM_MISMATCH');
    }

    properties.setProperty(ASC_DB_SPREADSHEET_PROPERTY_, candidateId);

    try {
      if (ascDbSpreadsheetId_() !== candidateId) {
        throw new Error('DR_DB_POINTER_VERIFY_FAILED');
      }
      var verify = ascValidateAscDbCandidate_(candidateId);
      if (verify.sha256 !== expectedCandidateSha) {
        throw new Error('DR_DB_POST_MIGRATION_VERIFY_FAILED');
      }
    } catch (error) {
      if (priorRaw) {
        properties.setProperty(ASC_DB_SPREADSHEET_PROPERTY_, priorRaw);
      } else {
        properties.deleteProperty(ASC_DB_SPREADSHEET_PROPERTY_);
      }
      throw error;
    }

    return {
      status: 'DR_DB_MIGRATED',
      previous_spreadsheet_id: current,
      current_spreadsheet_id: candidateId,
      candidate_sha256: expectedCandidateSha,
      rollback_spreadsheet_id: current
    };
  } finally {
    lock.releaseLock();
  }
}

function ascRollbackAscDbMigration_(input) {
  ascDrRequireOwner_();
  var request = input && typeof input === 'object' ? input : {};
  var expectedCurrent = typeof request.expectedCurrentSpreadsheetId === 'string'
    ? request.expectedCurrentSpreadsheetId.trim()
    : '';
  var rollbackId = typeof request.rollbackSpreadsheetId === 'string'
    ? request.rollbackSpreadsheetId.trim()
    : '';
  var expectedRollbackSha = typeof request.expectedRollbackSha256 === 'string'
    ? request.expectedRollbackSha256.trim()
    : '';

  if (!expectedCurrent || !rollbackId || !/^[0-9a-f]{64}$/.test(expectedRollbackSha)) {
    throw new Error('DR_DB_ROLLBACK_INPUT_INVALID');
  }

  var candidate = ascValidateAscDbCandidate_(rollbackId);
  if (candidate.sha256 !== expectedRollbackSha) {
    throw new Error('DR_DB_ROLLBACK_CHECKSUM_MISMATCH');
  }

  return ascMigrateAscDb_({
    expectedCurrentSpreadsheetId: expectedCurrent,
    candidateSpreadsheetId: rollbackId,
    expectedCandidateSha256: expectedRollbackSha
  });
}

function ascRecoverContinuityFromDisasterBundle_(bundleFileId) {
  ascDrRequireOwner_();
  var read = ascDrReadBundleFile_(bundleFileId);
  var state = ascContinuityClone_(read.bundle.private_continuity.state);
  ascContinuityValidateState_(state);

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(ASC_DR_LOCK_TIMEOUT_MS_)) throw new Error('DR_LOCK_UNAVAILABLE');
  try {
    var properties = PropertiesService.getScriptProperties();
    var priorFileId = properties.getProperty(ASC_CONTINUITY_FILE_PROPERTY_);
    var priorFolderId = properties.getProperty(ASC_CONTINUITY_FOLDER_PROPERTY_);
    var currentId = priorFileId;
    if (currentId) {
      try {
        var currentFile = DriveApp.getFileById(currentId);
        ascContinuityRequirePrivate_(currentFile);
        var currentState = JSON.parse(currentFile.getBlob().getDataAsString());
        ascContinuityValidateState_(currentState);
        throw new Error('DR_CONTINUITY_CURRENT_HEALTHY');
      } catch (error) {
        if (error && error.message === 'DR_CONTINUITY_CURRENT_HEALTHY') throw error;
        // Current pointer exists but cannot be read/validated: disaster recovery is allowed.
      }
    }

    var folder = null;
    var folderId = properties.getProperty(ASC_CONTINUITY_FOLDER_PROPERTY_);
    if (folderId) {
      try {
        folder = DriveApp.getFolderById(folderId);
        ascContinuityRequirePrivate_(folder);
      } catch (error) {
        folder = null;
      }
    }
    if (!folder) {
      folder = DriveApp.createFolder(ASC_CONTINUITY_FOLDER_NAME_ + ' recovery');
      ascContinuityRequirePrivate_(folder);
    }

    var serialized = JSON.stringify(state);
    var recoveryFile = folder.createFile(
      'continuity-state-v0.1-recovery-' + new Date().getTime() + '.json',
      serialized,
      MimeType.PLAIN_TEXT
    );
    ascContinuityRequirePrivate_(recoveryFile);

    var verified = JSON.parse(recoveryFile.getBlob().getDataAsString());
    ascContinuityValidateState_(verified);
    if (JSON.stringify(verified) !== serialized) {
      throw new Error('DR_CONTINUITY_RECOVERY_VERIFY_MISMATCH');
    }

    properties.setProperty(ASC_CONTINUITY_FOLDER_PROPERTY_, folder.getId());
    properties.setProperty(ASC_CONTINUITY_FILE_PROPERTY_, recoveryFile.getId());

    try {
      var reread = ascContinuityReadState_();
      if (JSON.stringify(reread) !== serialized) {
        throw new Error('DR_CONTINUITY_RECOVERY_POST_READ_MISMATCH');
      }
    } catch (error) {
      if (priorFolderId) {
        properties.setProperty(ASC_CONTINUITY_FOLDER_PROPERTY_, priorFolderId);
      } else {
        properties.deleteProperty(ASC_CONTINUITY_FOLDER_PROPERTY_);
      }
      if (priorFileId) {
        properties.setProperty(ASC_CONTINUITY_FILE_PROPERTY_, priorFileId);
      } else {
        properties.deleteProperty(ASC_CONTINUITY_FILE_PROPERTY_);
      }
      try { recoveryFile.setTrashed(true); } catch (cleanupError) {}
      throw error;
    }

    return {
      status: 'DR_CONTINUITY_RECOVERED',
      bundle_file_id: read.file.getId(),
      recovered_state_file_id: recoveryFile.getId(),
      continuity_folder_id: folder.getId(),
      state_schema_version: state.schema_version,
      project_count: Object.keys(state.projects).length
    };
  } finally {
    lock.releaseLock();
  }
}
