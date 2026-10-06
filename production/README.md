# T-016 Production GitHub Write Boundary

Status: **PASS / CANONICAL / PROTECTED PRODUCTION DEPLOYED**

T-016 replaces the proof-only TEST_ONLY destination policy with a deterministic,
server-authorized Production v1 GitHub write boundary.

## Authority

The semantic ASC Write Contract stays unchanged. GitHub destination mechanics remain
server-side and are selected only after ASC Core accepts the semantic contract.

Production registry shape:

```json
{
  "schema_version": "0.1",
  "projects": {
    "AISYNC": {
      "repository": "dzuddiyn/AISYNC",
      "branch": "main",
      "path_prefix": "records",
      "extension": ".md",
      "allowed_operations": ["SAVE"]
    }
  }
}
```

The registry is supplied at runtime through the Apps Script Script Property
`ASC_GITHUB_PROJECT_REGISTRY`.

For the example above:

```text
Project: AISYNC
Record ID: PROD-001
Operation: SAVE

→ dzuddiyn/AISYNC
→ main
→ records/PROD-001.md
```

The caller never supplies a GitHub repository, branch, or path. Record IDs are
restricted to a safe semantic identifier alphabet; slash/path traversal is rejected.

## GitHub App authentication

Production writes use a GitHub App installation token, not the proof PAT path.

Required server-only Script Properties:

- `GITHUB_APP_CLIENT_ID`
- `GITHUB_APP_INSTALLATION_ID`
- `GITHUB_APP_PRIVATE_KEY`

The private key must never be committed, logged, returned to the browser, written to
HISTORY, or placed in an ASC Link.

Apps Script creates an RS256 GitHub App JWT and exchanges it for a short-lived
installation access token. The installation token is acquired lazily only after the
existing security, owner, replay, Core authorization, and deterministic mapping gates
have passed.

The GitHub App should be installed only on authorized repositories and should have the
minimum Production v1 repository permission required by the Contents write endpoint:
**Contents: Read and write**.

## Concurrency and idempotency

The GitHub adapter reads the current file first. For updates, its exact current blob
SHA is passed to the GitHub Contents API. A GitHub conflict is surfaced as
`WRITE_CONFLICT`; ASC does not last-write-win over a changed target.

Artifact SAVE idempotency is state-based: deterministic target + exact desired content
returns `NO_CHANGE` and produces no second commit.

Transport replay identity remains separate from private ZASSPILL semantic idempotency
(D-034).

## Unknown write outcome

A transport failure after a GitHub write request is not blindly retried.

The adapter performs one reconciliation read:

- exact desired content present → `VERIFIED_WRITE_RECONCILED`;
- desired content confirmed absent → `WRITE_ERROR`;
- reconciliation unavailable → `WRITE_OUTCOME_UNKNOWN`.

A reconciled success does not invent a commit SHA and records
`write_performed: null` when attribution to this exact attempt cannot be proven.

## Current T-016 local proof

Local tests cover:

- registry validation;
- deterministic mapping and traversal rejection;
- owner/project/operation/destination authorization;
- GitHub App RS256 JWT + installation-token exchange;
- optimistic concurrency conflict;
- exact-content idempotency;
- unknown-write reconciliation;
- receipt truthfulness for reconciled/unknown outcomes;
- no credential in semantic contract/write spec/browser output.


## Controlled live proof — PASS

Owner-confirmed production SAVE:

```text
request_id: ASC-T016-20261003181842
Record ID:  T016-LIVE-20261003181842
repository: dzuddiyn/AISYNC
branch:     main
path:       records/T016-LIVE-20261003181842.md
commit:     6da32a0a36c74abc2640d55f6195b56217e0e2ca
author:     aisync-production-writer-dzuddiyn[bot]
outcome:    VERIFIED_WRITE
receipt:    SUCCESS / write_performed=true / verified=true
HISTORY:    row 7, one matching request
```

Independent GitHub read-back matched the exact intended content. The commit changed only the deterministic target file. Independent Sheets read-back matched the receipt/request/commit/resource exactly.

Canonical T-016 source merged through PR #13 at `cfbc379408080ee22b4eaf47835455829858b949` and protected Apps Script production was updated from merged `main` to version 17 (`T016-production-write-canonical`). Final protected-production request `ASC-T016-FINAL-20261003185851` returned `NO_CHANGE`, `write_performed=false`, `verified=true`; independent HISTORY row 8 re-read matched exactly and GitHub `main` remained unchanged, proving deterministic idempotent behavior without a duplicate commit. T-016 is PASS.


## T-019 Production reliability / operations

Production reliability work is tracked in [OPERATIONS.md](./OPERATIONS.md).

Current state: **T-019 PASS / T-020 CURRENT — T-020A READINESS BLOCKED ON UX ONLY**. T-020A1 Beta Access Gate is LIVE PASS and BETA-AUTH-001 is CLOSED. Protected production is immutable v50 `T020A1-beta-access-gate-final`; a real non-owner Google-account canary enrolled through a single-use project-scoped invitation, opened the protected AISYNC Workspace, and lost access immediately after owner revocation without hidden repair. Focused security tests cover forbidden-project and privileged-owner negative paths; full regression is 33/33 PASS. Major ordinary-user wording/entry issues from T-020A still remain before the first counted external beta journey.
