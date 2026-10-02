const METHOD_SYNC_CONFIG = Object.freeze({
  spreadsheetId: '11pWE0E-jEZhigVAYGcsfVXW0TODRcNMgOZHFfUQIHKw',
  sheetName: 'METHODS',
  sourceRepo: 'dzuddiyn/ZASS-Zero-to-Architecture-Structured-Sprint',
  sourceBranch: 'main',
  methods: [
    {
      method_key: 'zasspill-my',
      method: 'ZASSPILL',
      language: 'my',
      source_path: 'ZASSPILL/ZASSPILL_MY.md'
    },
    {
      method_key: 'zassimple-my',
      method: 'ZASSIMPLE',
      language: 'my',
      source_path: 'ZASSIMPLE/ZASSIMPLE_MY.md'
    },
    {
      method_key: 'zasselection-my',
      method: 'ZASSELECTION',
      language: 'my',
      source_path: 'ZASSELECTION/ZASSELECTION_MY.md'
    }
  ]
});

const METHOD_HEADERS = Object.freeze([
  'method_key',
  'method',
  'language',
  'version',
  'source_repo',
  'source_path',
  'source_commit',
  'synced_at',
  'content'
]);

function syncMethodsFromGitHub() {
  const cfg = METHOD_SYNC_CONFIG;
  const headCommit = getGitHubBranchHead_(cfg.sourceRepo, cfg.sourceBranch);
  const syncedAt = new Date().toISOString();

  const snapshots = cfg.methods.map(function (entry) {
    const content = getGitHubFileAtCommit_(
      cfg.sourceRepo,
      entry.source_path,
      headCommit
    );

    return {
      method_key: entry.method_key,
      method: entry.method,
      language: entry.language,
      version: extractMethodVersion_(content),
      source_repo: cfg.sourceRepo,
      source_path: entry.source_path,
      source_commit: headCommit,
      synced_at: syncedAt,
      content: content
    };
  });

  const sheet = getMethodsSheet_();
  verifyHeaders_(sheet);
  upsertSnapshots_(sheet, snapshots);

  return snapshots.map(function (snapshot) {
    return {
      method_key: snapshot.method_key,
      version: snapshot.version,
      source_commit: snapshot.source_commit,
      synced_at: snapshot.synced_at,
      content_length: snapshot.content.length
    };
  });
}

function installDailyMethodSyncTrigger() {
  removeMethodSyncTriggers_();

  ScriptApp.newTrigger('syncMethodsFromGitHub')
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();
}

function removeMethodSyncTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'syncMethodsFromGitHub') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function getMethodsSheet_() {
  const sheet = SpreadsheetApp
    .openById(METHOD_SYNC_CONFIG.spreadsheetId)
    .getSheetByName(METHOD_SYNC_CONFIG.sheetName);

  if (!sheet) {
    throw new Error('METHODS sheet is missing');
  }

  return sheet;
}

function verifyHeaders_(sheet) {
  const actual = sheet
    .getRange(1, 1, 1, METHOD_HEADERS.length)
    .getValues()[0];

  const matches = METHOD_HEADERS.every(function (header, index) {
    return actual[index] === header;
  });

  if (!matches) {
    throw new Error(
      'METHODS header mismatch. Expected: ' + METHOD_HEADERS.join(', ')
    );
  }
}

function upsertSnapshots_(sheet, snapshots) {
  const lastRow = sheet.getLastRow();
  const existingKeys = {};

  if (lastRow >= 2) {
    sheet.getRange(2, 1, lastRow - 1, 1)
      .getValues()
      .forEach(function (row, index) {
        if (row[0]) {
          existingKeys[String(row[0])] = index + 2;
        }
      });
  }

  snapshots.forEach(function (snapshot) {
    const values = [[
      snapshot.method_key,
      snapshot.method,
      snapshot.language,
      snapshot.version,
      snapshot.source_repo,
      snapshot.source_path,
      snapshot.source_commit,
      snapshot.synced_at,
      snapshot.content
    ]];

    const rowNumber = existingKeys[snapshot.method_key] || (sheet.getLastRow() + 1);
    sheet.getRange(rowNumber, 1, 1, METHOD_HEADERS.length).setValues(values);
  });
}

function getGitHubBranchHead_(repo, branch) {
  const url =
    'https://api.github.com/repos/' +
    repo +
    '/branches/' +
    encodeURIComponent(branch);

  const data = fetchGitHubJson_(url);

  if (!data.commit || !data.commit.sha) {
    throw new Error('GitHub branch response did not include commit SHA');
  }

  return data.commit.sha;
}

function getGitHubFileAtCommit_(repo, path, commit) {
  const encodedPath = path
    .split('/')
    .map(encodeURIComponent)
    .join('/');

  const url =
    'https://api.github.com/repos/' +
    repo +
    '/contents/' +
    encodedPath +
    '?ref=' +
    encodeURIComponent(commit);

  const data = fetchGitHubJson_(url);

  if (data.type !== 'file' || !data.content) {
    throw new Error('GitHub content response was not a file: ' + path);
  }

  const compactBase64 = String(data.content).replace(/\s/g, '');
  return Utilities.newBlob(
    Utilities.base64Decode(compactBase64)
  ).getDataAsString('UTF-8');
}

function fetchGitHubJson_(url) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'AISYNC-Method-Gateway-v0.1'
  };

  const token = PropertiesService
    .getScriptProperties()
    .getProperty('GITHUB_TOKEN');

  if (token) {
    headers.Authorization = 'Bearer ' + token;
  }

  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true,
    headers: headers
  });

  const status = response.getResponseCode();
  const body = response.getContentText();

  if (status < 200 || status >= 300) {
    throw new Error('GitHub request failed (' + status + '): ' + body);
  }

  return JSON.parse(body);
}

function extractMethodVersion_(content) {
  const match = String(content).match(/^\*\*Version:\*\*\s*([^\s]+)\s*$/m);

  if (!match) {
    throw new Error('Method version line not found');
  }

  return match[1];
}
