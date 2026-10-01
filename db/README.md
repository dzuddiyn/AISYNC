# AISYNC ASC DB v0.1

**Status:** IMPLEMENTED FOR T-003  
**Role:** Google Sheets operational/index database  
**Canonical project artifacts:** GitHub  
**Native Google Sheet:** https://docs.google.com/spreadsheets/d/1x_VS4ddakojIO6h48HjBmNY66UFKU0PbUvXVarnduiI/edit

## Authority boundary

Google Sheets is **not** a competing editable master for canonical ZASS/AISYNC project artifacts.

- GitHub = canonical Markdown artifacts + Git lineage
- Google Sheets = normalized operational/index views for ASC UI, Action Plan views, project state, and write/history receipts

Semantic project state such as lifecycle stage/progress is method-owned. ASC stores/displays it; ASC Core must not invent it.

## Tabs

### PROJECTS

Purpose: project registry + ASC UI summary.

Columns:
- project_id
- project_name
- ui_entry
- source_method
- lifecycle_stage
- progress_percent
- progress_summary
- next_action_plan
- next_stage
- latest_update
- github_repo
- source_artifact
- source_commit
- updated_at
- authority

Notes:
- `ui_entry` is constrained to `DECIDE` / `DESIGN`.
- `progress_percent` may remain blank until the source method explicitly provides a semantic value.

### RECORDS

Purpose: normalized index of ZASS-family/project records.

Columns:
- project_id
- record_type
- record_id
- status
- summary
- lineage_json
- source_artifact
- source_commit
- canonical_url
- updated_at
- authority

### ACTION_PLAN

Purpose: operational Action Plan view sourced from canonical project artifacts.

Columns:
- project_id
- ap_id
- status
- action
- dependencies
- pass_condition
- source_lineage
- source_artifact
- source_commit
- updated_at

Status validation:
- OPEN
- DONE
- BLOCKED
- DEFERRED

### HISTORY

Purpose: factual ASC write/operation history and receipt index.

Columns:
- request_id
- project_id
- operation
- destination
- status
- affected_resource
- commit_or_record_id
- source_commit
- timestamp
- failure_reason
- receipt_json

Status validation:
- SUCCESS
- FAILED

## T-003 verification

Verified on the native Google Sheet:
- all four tabs exist;
- frozen header row exists on all four tabs;
- filters are active;
- AISYNC bootstrap data is readable;
- DECIDE / DESIGN validation exists;
- Action Plan status validation exists;
- HISTORY SUCCESS / FAILED validation exists;
- timezone is `Asia/Kuala_Lumpur`;
- bootstrap rows include GitHub source artifact / commit lineage and explicit authority labels.

Result: PASS — one AISYNC project is representable in Sheets without making Sheets the canonical project-artifact master.
