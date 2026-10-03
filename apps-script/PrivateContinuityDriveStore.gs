var ASC_CONTINUITY_STORE_VERSION_ = '0.1';
var ASC_CONTINUITY_FOLDER_PROPERTY_ = 'ASC_CONTINUITY_FOLDER_ID';
var ASC_CONTINUITY_FILE_PROPERTY_ = 'ASC_CONTINUITY_STATE_FILE_ID';
var ASC_CONTINUITY_FOLDER_NAME_ = 'AISYNC Private Continuity Store';
var ASC_CONTINUITY_FILE_NAME_ = 'continuity-state-v0.1.json';
var ASC_CONTINUITY_LOCK_TIMEOUT_MS_ = 30000;

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

function ascContinuityWriteState_(file, state) {
  ascContinuityValidateState_(state);
  var serialized = JSON.stringify(state);
  try {
    file.setContent(serialized);
  } catch (error) {
    throw new Error('PRIVATE_CONTINUITY_STORE_WRITE_FAILED');
  }

  var verifiedText;
  try {
    verifiedText = file.getBlob().getDataAsString();
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
