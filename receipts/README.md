# Factual Write Receipt — T-007

Status: T-007 PASS — local receipt boundary plus externally verified live HISTORY persistence.

## Boundary

```text
verified adapter result
        ↓
create factual receipt
        ↓
map to ASC DB HISTORY entry
        ↓
injected HISTORY writer
```

The receipt layer consumes factual T-006 adapter results. It does not perform GitHub/Sheets I/O itself, invent identifiers, create timestamps, or infer persistence from a write attempt.

## Receipt semantics

- `VERIFIED_WRITE` and `NO_CHANGE` become `SUCCESS`.
- `READ_ERROR`, `WRITE_ERROR`, `WRITE_UNVERIFIED`, and `INVALID_INPUT` become `FAILED`.
- A captured adapter `commitSha` is retained even when the write is `WRITE_UNVERIFIED`.
- `affected_resource` is derived only from factual adapter `repository` and `path` values.
- `request_id`, `project_id`, `operation`, and `timestamp` are supplied by the caller and are not fabricated.
- `receipt_json` contains the factual receipt representation.

HISTORY uses the existing T-003 columns:

```text
request_id
project_id
operation
destination
status
affected_resource
commit_or_record_id
source_commit
timestamp
failure_reason
receipt_json
```

## HISTORY writer boundary

`persistHistory(receiptResult, historyWriter)` requires an injected writer exposing:

```js
historyWriter.appendHistory(historyEntry)
```

The writer receives an isolated copy. Writer mutation cannot change the receipt or original HISTORY entry. Writer failure remains `HISTORY_WRITE_FAILED` and does not rewrite a successful receipt into a false failure.

A real Google Sheets writer is not executed by the local test suite. External live verification separately confirmed the persisted HISTORY row described below.

`History.gs` is the separate Apps Script HISTORY writer boundary for the existing ASC DB. It validates the locked eleven-column shape and header row before appending a row. It is not included in the protected preview and has not been run against the live Sheet in this slice.

## Verification

Run:

```text
node receipts/test-write-receipt.mjs
```

The test covers verified writes, no-change, read failure, unverified writes with preserved commit IDs, factual HISTORY shape, injected persistence, writer failure, and no fabricated receipt claims.

The Apps Script writer boundary is tested with a fake `SpreadsheetApp` runtime:

```text
node receipts/test-history-writer.mjs
```

## External live verification

The active ASC DB HISTORY tab was externally re-read after one controlled TEST_ONLY write:

```text
request_id: TEST_ONLY_T007_HISTORY_20261003_01
row: 3
status: SUCCESS
destination: GitHub
affected_resource: dzuddiyn/AISYNC/proofs/t006b-github-adapter-live.md
commit_or_record_id: 95e019604e6edd778acd0ee252c506d2729f2d09
timestamp: 2026-10-02T19:03:32.135Z
```

The persisted scalar fields matched the embedded `receipt_json`, confirming `adapter_outcome=VERIFIED_WRITE`, `write_performed=true`, and `verified=true`. This is factual external evidence for T-007; no T-008 behavior was started.
