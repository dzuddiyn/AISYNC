# AISYNC ASC DB v0.1

**Status:** IMPLEMENTED FOR T-003  
**Role:** Google Sheets operational/index database  
**Canonical project artifacts:** GitHub  
**Native Google Sheet:** https://docs.google.com/spreadsheets/d/11pWE0E-jEZhigVAYGcsfVXW0TODRcNMgOZHFfUQIHKw/edit  
**Google owner profile:** dzuddiyn Google

## Authority boundary

Google Sheets is **not** a competing editable master for canonical ZASS/AISYNC project artifacts.

- GitHub = canonical Markdown artifacts + Git lineage
- Google Sheets = normalized operational/index views for ASC UI, Action Plan views, project state, and write/history receipts

Semantic project state such as lifecycle stage/progress is method-owned. ASC stores/displays it; ASC Core must not invent it.

## Production private continuity boundary — D-032

The existing Google Sheets ASC DB remains an **operational/index projection**. It is not the authoritative private thread-continuity store.

Production v1 authority is separated as follows:

```text
GitHub
= canonical project/method artifacts

ASC Private Continuity Store
= authoritative Current Thread Records
+ semantic event lineage
+ tombstones

ASC DB / this Sheet
= derived project/thread index + dashboard/receipt views
```

The exact backing technology and schema of the ASC Private Continuity Store are intentionally left to T-015 implementation. Any projected thread metadata added to this Sheet must remain derived and must not create a second semantic master.

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
- source_ref
- source_artifact
- source_commit
- updated_at
- authority

Notes:
- `ui_entry` is constrained to `DECIDE` / `DESIGN`.
- `progress_percent` may remain blank until the source method explicitly provides a semantic value.
- `source_ref` records the exact canonical Git ref used by the index row. T-015 compares `github_repo + source_ref + source_commit` against a live GitHub default-branch head read and reports `CURRENT`, `STALE`, `SOURCE_MISMATCH`, or `UNVERIFIED`; it does not infer lifecycle/progress.

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


## Account migration note

On 2026-10-02 the ASC DB was recreated under the intended Google owner profile **dzuddiyn Google** before live Apps Script deployment. The previous Sheet created under the other connected Google account is no longer the active ASC DB reference.

The migration preserved the T-003 schema and authority model. GitHub remains canonical; the active Sheet remains operational/index storage only.
