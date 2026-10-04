var ASC_CONTINUITY_STORE_VERSION_ = '0.1';
var ASC_CONTINUITY_FOLDER_PROPERTY_ = 'ASC_CONTINUITY_FOLDER_ID';
var ASC_CONTINUITY_FILE_PROPERTY_ = 'ASC_CONTINUITY_STATE_FILE_ID';
var ASC_CONTINUITY_FOLDER_NAME_ = 'AISYNC Private Continuity Store';
var ASC_CONTINUITY_FILE_NAME_ = 'continuity-state-v0.1.json';
var ASC_CONTINUITY_LOCK_TIMEOUT_MS_ = 30000;
var ASC_CONTINUITY_BACKUP_VERSION_ = '0.1';
var ASC_CONTINUITY_BACKUP_PREFIX_ = 'continuity-backup-v0.1-';
var ASC_CONTINUITY_BACKUP_RETENTION_ = 20;

function ascContinuityEmptyState_() {
  return {
    schema_version: ASC_CONTINUITY_STORE_VERSION_,
    projects: {}
  };
}

function ascContinuityClone_(value) {
  return JSON.parse(JSON.stringify(value));
}

function ascContinuityValidateState_(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    throw new Error('PRIVATE_CONTINUITY_STORE_INVALID_STATE');
  }
  if (state.schema_version !== ASC_CONTINUITY_STORE_VERSION_) {
    throw new Error('PRIVATE_CONTINUITY_STORE_UNSUPPORTED_VERSION');
  }
  if (!state.projects || typeof state.projects !== 'object' || Array.isArray(state.projects)) {
    throw new Error('PRIVATE_CONTINUITY_STORE_INVALID_PROJECTS');
  }
  return state;
}

function ascContinuityRequirePrivate_(item) {
  if (!item || typeof item.getSharingAccess !== 'function') {
    throw new Error('PRIVATE_CONTINUITY_STORE_SHARING_UNAVAILABLE');
  }
  if (item.getSharingAccess() !== DriveApp.Access.PRIVATE) {
    throw new Error('PRIVATE_CONTINUITY_STORE_NOT_PRIVATE');
  }
}

function ascContinuityResolveStoreFile_() {
  var properties = PropertiesService.getScriptProperties();
  var fileId = properties.getProperty(ASC_CONTINUITY_FILE_PROPERTY_);

  if (fileId) {
    var existingFile;
    try {
      existingFile = DriveApp.getFileById(fileId);
    } catch (error) {
      throw new Error('PRIVATE_CONTINUITY_STORE_FILE_UNAVAILABLE');
    }
    ascContinuityRequirePrivate_(existingFile);
    return existingFile;
  }

  var folderId = properties.getProperty(ASC_CONTINUITY_FOLDER_PROPERTY_);
  var folder = null;

  if (folderId) {
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (error) {
      throw new Error('PRIVATE_CONTINUITY_STORE_FOLDER_UNAVAILABLE');
    }
  } else {
    folder = DriveApp.createFolder(ASC_CONTINUITY_FOLDER_NAME_);
    ascContinuityRequirePrivate_(folder);
    properties.setProperty(ASC_CONTINUITY_FOLDER_PROPERTY_, folder.getId());
  }

  ascContinuityRequirePrivate_(folder);
  var initial = JSON.stringify(ascContinuityEmptyState_());
  var file = folder.createFile(ASC_CONTINUITY_FILE_NAME_, initial, MimeType.PLAIN_TEXT);
  ascContinuityRequirePrivate_(file);
  properties.setProperty(ASC_CONTINUITY_FILE_PROPERTY_, file.getId());
  return file;
}

function ascContinuityReadState_() {
  var file = ascContinuityResolveStoreFile_();
  var text;
  try {
    text = file.getBlob().getDataAsString();
  } catch (error) {
    throw new Error('PRIVATE_CONTINUITY_STORE_READ_FAILED');
  }

  var state;
  try {
    state = JSON.parse(text);
  } catch (error) {
    throw new Error('PRIVATE_CONTINUITY_STORE_MALFORMED_JSON');
  }
  return ascContinuityClone_(ascContinuityValidateState_(state));
}

function ascContinuityWriteState_(file, state, options) {
  ascContinuityValidateState_(state);
  var serialized = JSON.stringify(state);
  var properties = PropertiesService.getScriptProperties();
  var folder = ascContinuityGetConfiguredFolder_();
  var settings = options && typeof options === 'object' ? options : {};

  if (settings.skipBackup !== true) {
    var currentForBackup = ascContinuityReadJsonFile_(
      file,
      'PRIVATE_CONTINUITY_STORE_READ_FAILED',
      'PRIVATE_CONTINUITY_STORE_MALFORMED_JSON'
    );
    ascContinuityValidateState_(currentForBackup);
    ascContinuityCreateVerifiedBackup_(
      folder,
      file,
      currentForBackup,
      settings.backupReason || 'PRE_WRITE'
    );
    ascContinuityPruneBackups_(folder);
  }

  var nextFile;
  try {
    nextFile = folder.createFile(
      'continuity-state-v0.1-' + new Date().getTime() + '.json',
      serialized,
      MimeType.PLAIN_TEXT
    );
  } catch (error) {
    throw new Error('PRIVATE_CONTINUITY_STORE_WRITE_FAILED');
  }
  ascContinuityRequirePrivate_(nextFile);

  var verifiedText;
  try {
    verifiedText = nextFile.getBlob().getDataAsString();
  } catch (error) {
    throw new Error('PRIVATE_CONTINUITY_STORE_VERIFY_READ_FAILED');
  }

  var verified;
  try {
    verified = JSON.parse(verifiedText);
  } catch (error) {
    throw new Error('PRIVATE_CONTINUITY_STORE_VERIFY_MALFORMED_JSON');
  }
  ascContinuityValidateState_(verified);

  if (JSON.stringify(verified) !== serialized) {
    throw new Error('PRIVATE_CONTINUITY_STORE_VERIFY_MISMATCH');
  }

  properties.setProperty(ASC_CONTINUITY_FILE_PROPERTY_, nextFile.getId());
  try {
    file.setTrashed(true);
  } catch (error) {
    // The Script Property switch above is the authoritative commit point.
    // A trash failure leaves an orphaned prior version, not two authorities.
  }
}

function ascContinuityStoreRead_() {
  return ascContinuityReadState_();
}

function ascContinuityStoreTransact_(mutator) {
  if (typeof mutator !== 'function') {
    throw new Error('PRIVATE_CONTINUITY_STORE_MUTATOR_REQUIRED');
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(ASC_CONTINUITY_LOCK_TIMEOUT_MS_)) {
    throw new Error('PRIVATE_CONTINUITY_STORE_LOCK_UNAVAILABLE');
  }

  try {
    var file = ascContinuityResolveStoreFile_();
    var currentText;
    try {
      currentText = file.getBlob().getDataAsString();
    } catch (error) {
      throw new Error('PRIVATE_CONTINUITY_STORE_READ_FAILED');
    }

    var current;
    try {
      current = JSON.parse(currentText);
    } catch (error) {
      throw new Error('PRIVATE_CONTINUITY_STORE_MALFORMED_JSON');
    }
    ascContinuityValidateState_(current);

    var working = ascContinuityClone_(current);
    var outcome = mutator(working);
    if (!outcome || typeof outcome !== 'object' || !Object.prototype.hasOwnProperty.call(outcome, 'result')) {
      throw new Error('PRIVATE_CONTINUITY_STORE_BAD_TRANSACTION_RESULT');
    }

    if (outcome.changed === true) {
      ascContinuityWriteState_(file, working);
    }

    return ascContinuityClone_(outcome.result);
  } finally {
    lock.releaseLock();
  }
}

function ascContinuityReadJsonFile_(file, readErrorCode, malformedErrorCode) {
  var text;
  try {
    text = file.getBlob().getDataAsString();
  } catch (error) {
    throw new Error(readErrorCode);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(malformedErrorCode);
  }
}

function ascContinuityGetConfiguredFolder_() {
  var properties = PropertiesService.getScriptProperties();
  var folderId = properties.getProperty(ASC_CONTINUITY_FOLDER_PROPERTY_);
  if (!folderId) {
    throw new Error('PRIVATE_CONTINUITY_STORE_FOLDER_UNAVAILABLE');
  }
  var folder;
  try {
    folder = DriveApp.getFolderById(folderId);
  } catch (error) {
    throw new Error('PRIVATE_CONTINUITY_STORE_FOLDER_UNAVAILABLE');
  }
  ascContinuityRequirePrivate_(folder);
  return folder;
}

function ascContinuityValidateBackupEnvelope_(backup) {
  if (!backup || typeof backup !== 'object' || Array.isArray(backup)) {
    throw new Error('PRIVATE_CONTINUITY_BACKUP_INVALID');
  }
  if (backup.backup_version !== ASC_CONTINUITY_BACKUP_VERSION_) {
    throw new Error('PRIVATE_CONTINUITY_BACKUP_UNSUPPORTED_VERSION');
  }
  if (typeof backup.created_at !== 'string' || isNaN(Date.parse(backup.created_at))) {
    throw new Error('PRIVATE_CONTINUITY_BACKUP_INVALID_CREATED_AT');
  }
  if (typeof backup.source_state_file_id !== 'string' || !backup.source_state_file_id) {
    throw new Error('PRIVATE_CONTINUITY_BACKUP_INVALID_SOURCE');
  }
  if (typeof backup.reason !== 'string' || !backup.reason) {
    throw new Error('PRIVATE_CONTINUITY_BACKUP_INVALID_REASON');
  }
  if (backup.state_schema_version !== ASC_CONTINUITY_STORE_VERSION_) {
    throw new Error('PRIVATE_CONTINUITY_BACKUP_UNSUPPORTED_STATE_VERSION');
  }
  ascContinuityValidateState_(backup.state);
  if (backup.state.schema_version !== backup.state_schema_version) {
    throw new Error('PRIVATE_CONTINUITY_BACKUP_STATE_VERSION_MISMATCH');
  }
  return backup;
}

function ascContinuityBackupName_(timestamp) {
  return ASC_CONTINUITY_BACKUP_PREFIX_ + String(timestamp) + '.json';
}

function ascContinuityCreateVerifiedBackup_(folder, sourceFile, state, reason) {
  ascContinuityValidateState_(state);
  var now = new Date();
  var envelope = {
    backup_version: ASC_CONTINUITY_BACKUP_VERSION_,
    created_at: now.toISOString(),
    source_state_file_id: sourceFile.getId(),
    state_schema_version: state.schema_version,
    reason: reason,
    state: ascContinuityClone_(state)
  };
  var serialized = JSON.stringify(envelope);
  var backupFile;
  try {
    backupFile = folder.createFile(
      ascContinuityBackupName_(now.getTime()),
      serialized,
      MimeType.PLAIN_TEXT
    );
  } catch (error) {
    throw new Error('PRIVATE_CONTINUITY_BACKUP_WRITE_FAILED');
  }
  ascContinuityRequirePrivate_(backupFile);

  var verified = ascContinuityReadJsonFile_(
    backupFile,
    'PRIVATE_CONTINUITY_BACKUP_VERIFY_READ_FAILED',
    'PRIVATE_CONTINUITY_BACKUP_VERIFY_MALFORMED_JSON'
  );
  ascContinuityValidateBackupEnvelope_(verified);
  if (JSON.stringify(verified) !== serialized) {
    throw new Error('PRIVATE_CONTINUITY_BACKUP_VERIFY_MISMATCH');
  }

  return {
    backup_id: backupFile.getId(),
    created_at: envelope.created_at,
    source_state_file_id: envelope.source_state_file_id,
    state_schema_version: envelope.state_schema_version,
    reason: envelope.reason
  };
}

function ascContinuityPruneBackups_(folder, protectedIds) {
  if (!folder || typeof folder.getFiles !== 'function') {
    throw new Error('PRIVATE_CONTINUITY_BACKUP_LIST_UNAVAILABLE');
  }
  var iterator;
  try {
    iterator = folder.getFiles();
  } catch (error) {
    throw new Error('PRIVATE_CONTINUITY_BACKUP_LIST_UNAVAILABLE');
  }
  var protectedSet = {};
  (Array.isArray(protectedIds) ? protectedIds : []).forEach(function (id) {
    if (typeof id === 'string' && id) protectedSet[id] = true;
  });

  var backups = [];
  while (iterator.hasNext()) {
    var file = iterator.next();
    var name = typeof file.getName === 'function' ? file.getName() : '';
    if (name.indexOf(ASC_CONTINUITY_BACKUP_PREFIX_) !== 0) continue;
    if (typeof file.isTrashed === 'function' && file.isTrashed()) continue;
    var match = name.match(/^continuity-backup-v0\.1-(\d+)\.json$/);
    if (!match) continue;
    var timestamp = Number(match[1]);
    if (typeof file.getDateCreated === 'function') {
      try {
        var created = file.getDateCreated();
        if (created && !isNaN(created.getTime())) timestamp = created.getTime();
      } catch (error) {
        // Filename timestamp remains the deterministic fallback.
      }
    }
    backups.push({
      file: file,
      id: typeof file.getId === 'function' ? file.getId() : '',
      timestamp: timestamp
    });
  }
  backups.sort(function (a, b) { return b.timestamp - a.timestamp; });
  var keep = {};
  var kept = 0;

  backups.forEach(function (item) {
    if (protectedSet[item.id] && !keep[item.id]) {
      keep[item.id] = true;
      kept += 1;
    }
  });
  if (kept > ASC_CONTINUITY_BACKUP_RETENTION_) {
    throw new Error('PRIVATE_CONTINUITY_BACKUP_RETENTION_PROTECTED_OVERFLOW');
  }

  backups.forEach(function (item) {
    if (kept >= ASC_CONTINUITY_BACKUP_RETENTION_ || keep[item.id]) return;
    keep[item.id] = true;
    kept += 1;
  });

  backups.forEach(function (item) {
    if (keep[item.id]) return;
    try {
      item.file.setTrashed(true);
    } catch (error) {
      throw new Error('PRIVATE_CONTINUITY_BACKUP_RETENTION_FAILED');
    }
  });
  return kept;
}

function ascContinuityReadBackup_(backupId) {
  var file;
  try {
    file = DriveApp.getFileById(backupId);
  } catch (error) {
    throw new Error('PRIVATE_CONTINUITY_BACKUP_NOT_FOUND');
  }
  ascContinuityRequirePrivate_(file);
  if (typeof file.isTrashed === 'function' && file.isTrashed()) {
    throw new Error('PRIVATE_CONTINUITY_BACKUP_NOT_FOUND');
  }
  if (typeof file.getName !== 'function' ||
      file.getName().indexOf(ASC_CONTINUITY_BACKUP_PREFIX_) !== 0) {
    throw new Error('PRIVATE_CONTINUITY_BACKUP_NOT_RECOGNIZED');
  }
  var backup = ascContinuityReadJsonFile_(
    file,
    'PRIVATE_CONTINUITY_BACKUP_READ_FAILED',
    'PRIVATE_CONTINUITY_BACKUP_MALFORMED_JSON'
  );
  return {
    file: file,
    envelope: ascContinuityClone_(ascContinuityValidateBackupEnvelope_(backup))
  };
}

function ascContinuityCreateBackup_(reason) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(ASC_CONTINUITY_LOCK_TIMEOUT_MS_)) {
    throw new Error('PRIVATE_CONTINUITY_STORE_LOCK_UNAVAILABLE');
  }
  try {
    var file = ascContinuityResolveStoreFile_();
    var state = ascContinuityReadJsonFile_(
      file,
      'PRIVATE_CONTINUITY_STORE_READ_FAILED',
      'PRIVATE_CONTINUITY_STORE_MALFORMED_JSON'
    );
    ascContinuityValidateState_(state);
    var folder = ascContinuityGetConfiguredFolder_();
    var backup = ascContinuityCreateVerifiedBackup_(
      folder,
      file,
      state,
      typeof reason === 'string' && reason ? reason : 'MANUAL'
    );
    var retained = ascContinuityPruneBackups_(folder);
    return {
      status: 'BACKUP_CREATED',
      backup_id: backup.backup_id,
      created_at: backup.created_at,
      source_state_file_id: backup.source_state_file_id,
      state_schema_version: backup.state_schema_version,
      reason: backup.reason,
      retained_backups: retained
    };
  } finally {
    lock.releaseLock();
  }
}

function ascContinuityListBackups_() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(ASC_CONTINUITY_LOCK_TIMEOUT_MS_)) {
    throw new Error('PRIVATE_CONTINUITY_STORE_LOCK_UNAVAILABLE');
  }
  try {
    var current = ascContinuityResolveStoreFile_();
    var folder = ascContinuityGetConfiguredFolder_();
    if (typeof folder.getFiles !== 'function') {
      throw new Error('PRIVATE_CONTINUITY_BACKUP_LIST_UNAVAILABLE');
    }
    var iterator = folder.getFiles();
    var backups = [];
    while (iterator.hasNext()) {
      var file = iterator.next();
      var name = typeof file.getName === 'function' ? file.getName() : '';
      if (name.indexOf(ASC_CONTINUITY_BACKUP_PREFIX_) !== 0) continue;
      if (typeof file.isTrashed === 'function' && file.isTrashed()) continue;
      try {
        ascContinuityRequirePrivate_(file);
        var parsed = ascContinuityReadJsonFile_(
          file,
          'PRIVATE_CONTINUITY_BACKUP_READ_FAILED',
          'PRIVATE_CONTINUITY_BACKUP_MALFORMED_JSON'
        );
        var envelope = ascContinuityValidateBackupEnvelope_(parsed);
        backups.push({
          backup_id: file.getId(),
          valid: true,
          created_at: envelope.created_at,
          source_state_file_id: envelope.source_state_file_id,
          state_schema_version: envelope.state_schema_version,
          reason: envelope.reason,
          project_count: Object.keys(envelope.state.projects).length
        });
      } catch (error) {
        backups.push({
          backup_id: typeof file.getId === 'function' ? file.getId() : null,
          valid: false,
          error_code: error && error.message ? error.message : 'PRIVATE_CONTINUITY_BACKUP_INVALID'
        });
      }
    }
    backups.sort(function (a, b) {
      return Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0);
    });
    return {
      status: 'BACKUP_LIST',
      current_state_file_id: current.getId(),
      state_schema_version: ASC_CONTINUITY_STORE_VERSION_,
      backups: backups
    };
  } finally {
    lock.releaseLock();
  }
}

function ascContinuityRestoreBackup_(input) {
  var request = input && typeof input === 'object' ? input : {};
  var backupId = typeof request.backupId === 'string' ? request.backupId.trim() : '';
  var expectedCurrentFileId = typeof request.expectedCurrentFileId === 'string'
    ? request.expectedCurrentFileId.trim()
    : '';
  if (!backupId) throw new Error('PRIVATE_CONTINUITY_BACKUP_ID_REQUIRED');
  if (!expectedCurrentFileId) throw new Error('PRIVATE_CONTINUITY_RESTORE_EXPECTED_CURRENT_REQUIRED');

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(ASC_CONTINUITY_LOCK_TIMEOUT_MS_)) {
    throw new Error('PRIVATE_CONTINUITY_STORE_LOCK_UNAVAILABLE');
  }

  try {
    var currentFile = ascContinuityResolveStoreFile_();
    if (currentFile.getId() !== expectedCurrentFileId) {
      throw new Error('PRIVATE_CONTINUITY_RESTORE_CURRENT_CHANGED');
    }

    var currentState = ascContinuityReadJsonFile_(
      currentFile,
      'PRIVATE_CONTINUITY_STORE_READ_FAILED',
      'PRIVATE_CONTINUITY_STORE_MALFORMED_JSON'
    );
    ascContinuityValidateState_(currentState);

    var backupRecord = ascContinuityReadBackup_(backupId);
    var backupState = backupRecord.envelope.state;
    ascContinuityValidateState_(backupState);

    var folder = ascContinuityGetConfiguredFolder_();
    var safetyBackup = ascContinuityCreateVerifiedBackup_(
      folder,
      currentFile,
      currentState,
      'PRE_RESTORE'
    );
    ascContinuityPruneBackups_(folder, [backupId, safetyBackup.backup_id]);

    ascContinuityWriteState_(currentFile, ascContinuityClone_(backupState), {
      skipBackup: true
    });

    var restoredFileId = PropertiesService
      .getScriptProperties()
      .getProperty(ASC_CONTINUITY_FILE_PROPERTY_);
    if (!restoredFileId || restoredFileId === currentFile.getId()) {
      throw new Error('PRIVATE_CONTINUITY_RESTORE_POINTER_NOT_MOVED');
    }

    var reread = ascContinuityReadState_();
    if (JSON.stringify(reread) !== JSON.stringify(backupState)) {
      throw new Error('PRIVATE_CONTINUITY_RESTORE_VERIFY_MISMATCH');
    }

    return {
      status: 'RESTORED',
      backup_id: backupId,
      previous_state_file_id: currentFile.getId(),
      restored_state_file_id: restoredFileId,
      safety_backup_id: safetyBackup.backup_id,
      state_schema_version: reread.schema_version,
      project_count: Object.keys(reread.projects).length
    };
  } finally {
    lock.releaseLock();
  }
}
