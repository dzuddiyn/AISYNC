const METHOD_GATEWAY_CONFIG = Object.freeze({
  spreadsheetId: '11pWE0E-jEZhigVAYGcsfVXW0TODRcNMgOZHFfUQIHKw',
  sheetName: 'METHODS',
  routes: {
    'method/zasspill/my': 'zasspill-my',
    'method/zassimple/my': 'zassimple-my',
    'method/zasselection/my': 'zasselection-my'
  }
});

function doGet(e) {
  const routeParam = e && e.parameter && e.parameter.route
    ? e.parameter.route
    : '';
  const path = normalizePath_(routeParam || (e && e.pathInfo ? e.pathInfo : ''));
  const metaRequested = path.endsWith('/meta');
  const basePath = metaRequested ? path.slice(0, -5) : path;
  const methodKey = METHOD_GATEWAY_CONFIG.routes[basePath];

  if (!methodKey) {
    return text_(
      'AI-SYNC Method Gateway v0.1\n' +
      'Available routes:\n' +
      '?route=method/zasspill/my\n' +
      '?route=method/zassimple/my\n' +
      '?route=method/zasselection/my\n'
    );
  }

  const snapshot = readSnapshot_(methodKey);

  if (!snapshot) {
    return text_('ERROR: METHOD_SNAPSHOT_NOT_FOUND\n');
  }

  if (metaRequested) {
    return ContentService
      .createTextOutput(JSON.stringify({
        method: snapshot.method,
        language: snapshot.language,
        version: snapshot.version,
        source_repo: snapshot.source_repo,
        source_path: snapshot.source_path,
        source_commit: snapshot.source_commit,
        synced_at: snapshot.synced_at
      }, null, 2))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return text_(snapshot.content);
}

function normalizePath_(path) {
  return String(path || '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .toLowerCase();
}

const METHOD_CONTENT_GZIP_PREFIX = 'gzip+base64:';

function decodeMethodSnapshotContent_(stored) {
  const value = String(stored || '');
  if (!value.startsWith(METHOD_CONTENT_GZIP_PREFIX)) {
    return value;
  }

  const encoded = value.slice(METHOD_CONTENT_GZIP_PREFIX.length);
  const bytes = Utilities.base64Decode(encoded);
  return Utilities.ungzip(
    Utilities.newBlob(bytes)
  ).getDataAsString('UTF-8');
}

function readSnapshot_(methodKey) {
  const sheet = SpreadsheetApp
    .openById(METHOD_GATEWAY_CONFIG.spreadsheetId)
    .getSheetByName(METHOD_GATEWAY_CONFIG.sheetName);

  if (!sheet || sheet.getLastRow() < 2) {
    return null;
  }

  const rows = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, 9)
    .getValues();

  for (let i = 0; i < rows.length; i += 1) {
    if (String(rows[i][0]) === methodKey) {
      return {
        method_key: rows[i][0],
        method: rows[i][1],
        language: rows[i][2],
        version: rows[i][3],
        source_repo: rows[i][4],
        source_path: rows[i][5],
        source_commit: rows[i][6],
        synced_at: rows[i][7],
        content: decodeMethodSnapshotContent_(rows[i][8])
      };
    }
  }

  return null;
}

function text_(value) {
  return ContentService
    .createTextOutput(String(value))
    .setMimeType(ContentService.MimeType.TEXT);
}
