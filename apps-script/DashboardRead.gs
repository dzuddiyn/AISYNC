// T-009A — read-only ASC DB adapter / dashboard read model.
//
// Reads the four ASC DB operational/index tabs with SpreadsheetApp read calls only
// (openById → getSheetByName → getDataRange → getDisplayValues). No mutation calls.
// Values are returned as display strings exactly as stored. ASC does not calculate,
// infer, or refresh method-owned semantics (stage, progress, latest update). Index
// freshness is attached from exact GitHub source evidence by T-015; method-owned semantics are never inferred.

const ASC_DB_READ_CONFIG_ = Object.freeze({
  spreadsheetId: '11pWE0E-jEZhigVAYGcsfVXW0TODRcNMgOZHFfUQIHKw'
});

const ASC_DB_SCHEMA_ = Object.freeze({
  PROJECTS: Object.freeze([
    'project_id', 'project_name', 'ui_entry', 'source_method', 'lifecycle_stage',
    'progress_percent', 'progress_summary', 'next_action_plan', 'next_stage',
    'latest_update', 'github_repo', 'source_ref', 'source_artifact', 'source_commit', 'updated_at', 'authority'
  ]),
  RECORDS: Object.freeze([
    'project_id', 'record_type', 'record_id', 'status', 'summary', 'lineage_json',
    'source_artifact', 'source_commit', 'canonical_url', 'updated_at', 'authority'
  ]),
  ACTION_PLAN: Object.freeze([
    'project_id', 'ap_id', 'status', 'action', 'dependencies', 'pass_condition',
    'source_lineage', 'source_artifact', 'source_commit', 'updated_at'
  ]),
  HISTORY: Object.freeze([
    'request_id', 'project_id', 'operation', 'destination', 'status', 'affected_resource',
    'commit_or_record_id', 'source_commit', 'timestamp', 'failure_reason', 'receipt_json'
  ])
});

const ASC_DB_FRESHNESS_ = 'UNVERIFIED';
const ASC_UI_ENTRIES_ = Object.freeze(['DUMP', 'DECIDE', 'DESIGN']);

function ascDbReadError_(code, message, extra) {
  return Object.assign({ ok: false, error: { code: code, message: message } }, extra || {});
}

function ascDbSourceInfo_(tabs) {
  return {
    spreadsheet_id: ASC_DB_READ_CONFIG_.spreadsheetId,
    tabs: tabs.slice(),
    authority: 'OPERATIONAL_INDEX',
    freshness: ASC_DB_FRESHNESS_,
    read_at: new Date().toISOString()
  };
}

// Reads one tab and maps rows to plain objects keyed by the required headers.
function ascDbReadTab_(spreadsheet, tabName) {
  const required = ASC_DB_SCHEMA_[tabName];
  const sheet = spreadsheet.getSheetByName(tabName);
  if (!sheet) {
    return ascDbReadError_('TAB_MISSING', 'Required ASC DB tab is missing.', { tab: tabName });
  }

  const values = sheet.getDataRange().getDisplayValues();
  if (!Array.isArray(values) || values.length === 0) {
    return ascDbReadError_('SCHEMA_INCOMPATIBLE', 'Header row is missing.', { tab: tabName, missing: required.slice() });
  }

  const header = values[0].map(function (cell) { return String(cell); });
  const index = {};
  const duplicate = [];
  header.forEach(function (name, i) {
    if (Object.prototype.hasOwnProperty.call(index, name)) {
      duplicate.push(name);
    } else {
      index[name] = i;
    }
  });
  const missing = required.filter(function (name) { return !Object.prototype.hasOwnProperty.call(index, name); });
  const duplicateRequired = duplicate.filter(function (name) { return required.indexOf(name) >= 0; });

  if (missing.length > 0 || duplicateRequired.length > 0) {
    return ascDbReadError_('SCHEMA_INCOMPATIBLE', 'Required headers are missing or duplicated.', {
      tab: tabName,
      missing: missing,
      duplicate: duplicateRequired
    });
  }

  const rows = [];
  for (let r = 1; r < values.length; r += 1) {
    const raw = values[r];
    const isBlank = required.every(function (name) { return String(raw[index[name]] === undefined ? '' : raw[index[name]]) === ''; });
    if (isBlank) {
      continue;
    }
    const row = { sheet_row: r + 1 };
    required.forEach(function (name) {
      const cell = raw[index[name]];
      row[name] = cell === undefined || cell === null ? '' : String(cell);
    });
    rows.push(row);
  }

  return { ok: true, tab: tabName, rows: rows };
}

// progress_percent is method-owned. Blank stays NOT_PROVIDED (null), never 0.
// A non-blank value is only represented numerically if it is a plain number (optionally
// with a trailing %) in 0..100; otherwise it is shown raw as UNREADABLE. No inference.
function ascProgressView_(rawValue) {
  const raw = String(rawValue);
  if (raw.trim() === '') {
    return { state: 'NOT_PROVIDED', value: null, raw: raw };
  }
  const match = /^\s*(-?\d+(?:\.\d+)?)\s*%?\s*$/.exec(raw);
  if (!match) {
    return { state: 'UNREADABLE', value: null, raw: raw };
  }
  const value = Number(match[1]);
  if (!isFinite(value) || value < 0 || value > 100) {
    return { state: 'UNREADABLE', value: null, raw: raw };
  }
  return { state: 'PROVIDED', value: value, raw: raw };
}

function ascProjectView_(row) {
  return {
    project_id: row.project_id,
    project_name: row.project_name,
    ui_entry: row.ui_entry,
    source_method: row.source_method,
    lifecycle_stage: row.lifecycle_stage,
    progress: ascProgressView_(row.progress_percent),
    progress_summary: row.progress_summary,
    next_action_plan: row.next_action_plan,
    next_stage: row.next_stage,
    latest_update: row.latest_update,
    github_repo: row.github_repo,
    index_metadata: {
      source_ref: row.source_ref,
      source_artifact: row.source_artifact,
      source_commit: row.source_commit,
      updated_at: row.updated_at,
      authority: row.authority,
      freshness: ASC_DB_FRESHNESS_,
      sheet_row: row.sheet_row
    }
  };
}

function ascOpenAscDb_() {
  return SpreadsheetApp.openById(ASC_DB_READ_CONFIG_.spreadsheetId);
}

function getDashboardProjects() {
  try {
    const projects = ascDbReadTab_(ascOpenAscDb_(), 'PROJECTS');
    if (!projects.ok) {
      return projects;
    }
    const groups = { DUMP: [], DECIDE: [], DESIGN: [] };
    const unrecognized = [];
    projects.rows.forEach(function (row) {
      const view = ascAttachProjectIndexFreshness_(ascProjectView_(row));
      if (ASC_UI_ENTRIES_.indexOf(row.ui_entry) >= 0) {
        groups[row.ui_entry].push(view);
      } else {
        unrecognized.push(view);
      }
    });
    return {
      ok: true,
      source: ascDbSourceInfo_(['PROJECTS']),
      groups: groups,
      unrecognized_ui_entry: unrecognized
    };
  } catch (error) {
    return ascDbReadError_('ASC_DB_READ_FAILED', 'ASC DB could not be read.');
  }
}

function getDashboardProject(projectId) {
  if (typeof projectId !== 'string' || projectId.length === 0) {
    return ascDbReadError_('INVALID_PROJECT_ID', 'A project_id string is required.');
  }
  try {
    const spreadsheet = ascOpenAscDb_();
    const tabs = ['PROJECTS', 'RECORDS', 'ACTION_PLAN', 'HISTORY'];
    const read = {};
    for (let i = 0; i < tabs.length; i += 1) {
      const result = ascDbReadTab_(spreadsheet, tabs[i]);
      if (!result.ok) {
        return result;
      }
      read[tabs[i]] = result.rows;
    }

    const exact = function (row) { return row.project_id === projectId; };
    const matches = read.PROJECTS.filter(exact);
    if (matches.length === 0) {
      return ascDbReadError_('PROJECT_NOT_FOUND', 'No PROJECTS row has this exact project_id.', { project_id: projectId });
    }
    if (matches.length > 1) {
      return ascDbReadError_('DUPLICATE_PROJECT_ID', 'More than one PROJECTS row has this project_id; none is chosen.', {
        project_id: projectId,
        sheet_rows: matches.map(function (row) { return row.sheet_row; })
      });
    }

    return {
      ok: true,
      source: ascDbSourceInfo_(tabs),
      project: ascAttachProjectIndexFreshness_(ascProjectView_(matches[0])),
      records: read.RECORDS.filter(exact),
      action_plan: read.ACTION_PLAN.filter(exact),
      history: read.HISTORY.filter(exact)
    };
  } catch (error) {
    return ascDbReadError_('ASC_DB_READ_FAILED', 'ASC DB could not be read.');
  }
}
