# T-012A — Read-only ZASS CI status consumer

Purpose: consume factual GitHub Actions status for the authoritative ZASS CI workflow without implementing ZASS validation semantics inside ASC.

Boundary:

```text
repository + commit SHA
        ↓
GitHub Actions workflow runs
        ↓ exact workflow: ZASS CI
latest factual matching run
        ↓
run jobs
        ↓ exact job: zass-check
        ↓
small read-only status model
```

Normalized status values:
- SUCCESS
- FAILURE
- IN_PROGRESS
- QUEUED
- NOT_FOUND
- READ_ERROR

The consumer never interprets ZASS rule codes and never infers PASS from project files. It performs GET-only transport reads and exposes no mutation API.

Run:

```text
node ci/test-zass-ci-status.mjs
```

T-012A is a local boundary proof only. Dashboard / Apps Script presentation belongs to the next slice after this boundary passes.
