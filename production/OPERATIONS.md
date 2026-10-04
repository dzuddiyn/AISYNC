# AISYNC Production Operations Runbook

Status: **T-019 IN PROGRESS — T-019A LIVE PASS / T-019B LIVE PASS / T-019C LOCAL PASS**

This runbook covers Production v1 reliability and recovery operations. It must preserve the existing authority boundaries:

- GitHub remains canonical for project artifacts.
- The ASC Private Continuity Store remains the authority for private project/thread continuity.
- Sheets remains operational/index state, not a competing canonical master.
- Server credentials remain server-side.
- Recovery must fail closed when the current state, schema, or write outcome cannot be established truthfully.

## T-019A — Private continuity backup / restore

### Recovery model

The authoritative private continuity state is still selected by the Script Property:

`ASC_CONTINUITY_STATE_FILE_ID`

Backup files never become authority merely because they exist. A restore always creates and verifies a **new** authoritative state file, then moves the Script Property pointer to that new file.

Backup envelope version: `0.1`

Backup retention: **20 active snapshots**

Automatic behavior for every changed private-continuity transaction:

1. read and validate the current authoritative state;
2. create a private `PRE_WRITE` backup snapshot of that current state;
3. read the backup back and verify the exact serialized envelope;
4. apply retention;
5. create and verify the next authoritative state file;
6. move `ASC_CONTINUITY_STATE_FILE_ID` to the verified next file;
7. retire the prior authoritative file.

If backup creation / validation / retention fails, the state mutation fails **before** the authoritative pointer moves.

Read-only transactions do not create a backup or new state version.

### Manual checkpoint

Server-private helper:

`ascContinuityCreateBackup_(reason)`

It returns:

- `status: BACKUP_CREATED`
- opaque `backup_id`
- `created_at`
- source authoritative file ID
- state schema version
- reason
- retained backup count

The snapshot contains only private continuity state. It does not contain GitHub credentials, provider memory, or Sheets state.

### Inspect backups

Server-private helper:

`ascContinuityListBackups_()`

It returns the current authoritative file ID plus backup metadata. Each backup is validated independently. Invalid snapshots are surfaced as invalid rather than silently treated as recoverable.

Before any restore, record the returned `current_state_file_id`.

### Restore

Server-private helper:

`ascContinuityRestoreBackup_({ backupId, expectedCurrentFileId })`

Required safety gates:

1. backup ID must exist and identify a recognized private backup;
2. backup envelope version must be supported;
3. backup state schema must exactly match the currently supported continuity schema;
4. `expectedCurrentFileId` must still equal the authoritative pointer under the store lock;
5. the current state must be readable and valid;
6. a verified `PRE_RESTORE` safety backup of current state must be created first;
7. the selected backup and safety backup are protected from retention during that restore;
8. restore writes a new authoritative state file;
9. the pointer must move;
10. the newly authoritative state is read back and must exactly match the selected backup state.

If the current pointer changed after the operator inspected backups, restore fails with:

`PRIVATE_CONTINUITY_RESTORE_CURRENT_CHANGED`

Do not retry blindly. Re-list backups/current state and re-evaluate.

### Migration safety

T-019A does **not** perform implicit schema migration.

A backup whose state schema differs from the current supported schema fails closed with:

`PRIVATE_CONTINUITY_BACKUP_UNSUPPORTED_STATE_VERSION`

Migration must be an explicit later T-019 operation with its own transformer, backup, verification, and rollback proof. Never edit a backup JSON manually to bypass the version gate.

### Roll back a restore

Every restore creates a `PRE_RESTORE` safety backup and returns its `safety_backup_id`.

To roll back the restore:

1. list backups again;
2. record the new current state file ID;
3. select the returned safety backup;
4. restore using that new current file ID as `expectedCurrentFileId`;
5. verify the read-back state.

This is still an explicit restore; the safety backup never becomes authority automatically.

### Failure handling

Treat these as fail-closed conditions:

- store/folder/file unavailable;
- malformed current JSON;
- unsupported current schema;
- backup write/read/verification failure;
- backup retention failure;
- malformed or unsupported backup;
- current authoritative pointer changed;
- restored pointer did not move;
- restored read-back mismatch;
- lock unavailable.

Do not repair the pointer or JSON manually unless a later locked recovery procedure explicitly requires it.

### Scope / limitation

T-019A protects against state-file corruption, bad mutation, operator mistake, and schema-incompatible restore attempts inside the owner-private Drive store.

It is **not yet** account-wide disaster recovery. Backups remain within the same owner Drive environment. Broader disaster recovery, degraded/offline behavior, telemetry, secret rotation, deployment/rollback, and final operator acceptance remain T-019 work.

## Evidence

Local T-019A regression coverage proves:

- automatic pre-write backup contains the pre-mutation state;
- read-only transaction creates no backup/version;
- backup failure prevents the authoritative pointer/state from changing;
- manual backup/list works;
- restore recreates the selected prior state through a new authoritative file;
- restore creates a safety backup of the state being replaced;
- stale expected-current pointer is rejected;
- unsupported backup state schema is rejected without moving authority;
- retention is bounded to 20 active backups;
- continuity integration still preserves one active authority while all changed transactions retain backups;
- no GitHub/Sheets/provider-specific logic enters the private continuity store.

Fresh-clone full repository proof on canonical base `7f8cced5a2672cf4462674d7cd3450c2452e988e`: **28/28 test files PASS, git diff --check = 0**.

Live Drive backup/restore proof is still pending canonical SAVE/merge/deployment.


### Live production proof — PASS

Protected production: Apps Script v32 `T019A-private-continuity-recovery`.

Controlled owner-only proof used the real private continuity store but restored the exact same semantic state, so no project/thread meaning changed.

Observed sequence:

- authoritative state before restore: `1LC5xtpMVc0TBP69b6Ael5COo5tBrBSlK`;
- manual baseline backup: `14dAnxbSqF4zN55loZ_lZ6f7n66iH4KBu`, reason `T019A_LIVE_PROOF_BASELINE`;
- PRE_RESTORE safety backup: `1EE6FUFLVYQ2NB_iU1UsAb6sKTdF2nfOB`;
- authoritative state after restore: `1Tengb02h3dbadqNP2d53vsBkVYc3UGYb`;
- schema remained `0.1`;
- project count remained `2`;
- pointer moved: true;
- state_equal: true;
- active private backups after proof: `2`.

Independent Google Drive reads confirmed:

- restored authority exists and is private (`shared=false`);
- both proof backups exist and are private;
- both backup envelopes reference the original authoritative file;
- both embedded backup states are exactly equal to the restored authoritative JSON state;
- AISYNC thread remained revision `2`, with the same saved `continuity.current` and `open: []`.

Proof infrastructure cleanup was also verified:

- temporary owner-only operator deployment was deleted;
- Apps Script development HEAD was restored to its pre-proof snapshot and hash-verified `16/16`;
- protected production deployment remained pinned to v32;
- temporary operator wrappers are not live on production.

T-019A is therefore LIVE PASS. This does not close T-019 as a whole.


## T-019B — Replay / idempotency lifecycle

Status: **LIVE PASS - canonical source merged, protected production v35, live proof complete**

### Transport replay marker lifecycle

Transport replay authority remains Apps Script Script Properties under the existing script lock. Replay keys remain hashed:

`asc.replay.v1.<sha256(request_id)>`

A confirmed sync now passes the already-verified envelope expiry into the replay claim. New markers contain:

- `state: CLAIMED`
- `claimed_at`
- verified `expires_at`
- `purge_after = expires_at + 24 hours`

The extra 24-hour retention is operational duplicate/retry evidence. It does not extend envelope validity.

Before every new replay claim, the replay store performs lifecycle cleanup under the same script lock:

1. enumerate replay properties;
2. validate every replay marker shape/timing;
3. retain current markers until `purge_after`;
4. delete markers whose retention has elapsed;
5. re-read each deleted property and require it to be absent;
6. only then inspect/persist the new request claim.

Any uncertainty in property listing, marker parsing, deletion, or delete verification returns `REPLAY_STORE_UNAVAILABLE` and stops before GitHub/HISTORY I/O.

### Legacy T-010 markers

Legacy markers contain only `state` + `claimed_at`.

Because the locked v0.1 transport contract allows envelope lifetime of at most 30 minutes, a legacy marker is not purgeable until:

`claimed_at + 30 minutes + 24 hours`

This preserves the old maximum replay-security window plus the same operational retention period.

### Cleanup cannot reopen replay

Purging a marker does not make its old envelope usable again. Envelope expiry/security validation runs before replay claim. Regression proves that after an old marker is purged by a later valid claim, replaying the old envelope returns `REQUEST_EXPIRED` with zero GitHub/HISTORY I/O.

### Transport identity vs semantic idempotency

The D-034 boundary remains unchanged:

- same transport request ID → `REPLAY_REJECTED`, zero extra destination/HISTORY work;
- new transport request ID + identical GitHub semantic content → normal adapter path → `NO_CHANGE`, no second PUT/commit;
- private ZASSPILL semantic `req_<ULID>` idempotency remains a separate continuity concern.

Transport replay cleanup never substitutes for semantic idempotency and never deletes semantic continuity request/event lineage.

### Local evidence

Focused flow + Apps Script binding regressions prove:

- confirmed flow passes verified envelope expiry into replay authority;
- new marker retention metadata is exact;
- active current markers survive cleanup;
- expired current markers purge only after expiry + 24 hours;
- expired legacy markers purge only after claimed_at + 30 minutes + 24 hours;
- lifecycle corruption/delete uncertainty fails closed;
- successful same-request replay produces no duplicate GitHub/HISTORY work;
- a new transport request with identical semantic content produces `NO_CHANGE` with no second PUT;
- purged marker does not resurrect an expired envelope;
- generated `AscRuntime.gs` matches the mechanical runtime build.

### Live evidence

Canonical T-019B implementation merged through PR #40 at `e4f37e652847dc170c0876ab9b246c62cb21c23f` and protected production is pinned to Apps Script v35 (`T019B-replay-idempotency-lifecycle`).

Deterministic live proof `T019B-LIVE-DET-20261004-103536-a317023f` used the real production Script Properties/lock, production registry, GitHub App installation credential boundary, and canonical existing target `records/T016-LIVE-20261003181842.md`. It proved current-marker cleanup, legacy-marker cleanup, active-marker retention, exact `expires_at + 24h` retention, same-request `REPLAY_REJECTED`, and fresh-request identical-content `NO_CHANGE`.

The live proof performed 2 GitHub reads and 0 GitHub PUTs. Independent GitHub verification after the proof confirmed `main` still at `e4f37e652847dc170c0876ab9b246c62cb21c23f`, target blob SHA still `5427b6cc4aa0c2a87a9532121e1cb8a4bc0a7e22`, and exact target content unchanged. No duplicate commit was created.

The proof ran through a temporary owner-only deployment built from immutable v35 source plus proof-only wrappers. The protected production deployment itself remained pinned to v35. After proof completion the temporary deployment was removed, Apps Script development HEAD was restored/verified 16/16, and the temporary deployment ID was absent.

Canonical evidence: [`proofs/t019b-replay-idempotency-live.md`](../proofs/t019b-replay-idempotency-live.md).

T-019B is therefore **LIVE PASS**. This does not close T-019 as a whole.


## T-019C — Degraded / offline behavior

Status: **LOCAL PASS / protected deploy + live outage proof pending**

### Contract

T-019C does not add an offline writer. It defines truthful behavior when the existing ASC surfaces lose connectivity, service availability, or a trustworthy response.

The state model is:

- `UNSAVED` — request exists locally; persistence has not started.
- `SYNCING` — a confirmed attempt is resolving; never imply SAVED.
- `SAVED` — destination persistence is verified and HISTORY is persisted.
- `FAILED` — a factual non-success that is safe to report as failure.
- `DEGRADED` — some persistence/audit evidence exists but end-to-end integrity is incomplete; blind retry is forbidden.
- `OUTCOME UNKNOWN` — CONFIRM may have started but ASC cannot prove whether persistence happened.

### Pre-confirm outage

If protected server preview is unavailable:

1. keep the pending `#asc=` fragment in browser session storage;
2. show `DEGRADED / SERVER_PREVIEW_UNAVAILABLE`;
3. keep CONFIRM disabled;
4. expose **RETRY SERVER CHECK**;
5. retry only security/owner/config preview; do not start persistence.

`RESULT_CACHE_UNAVAILABLE` remains a separate safe same-transport retry because the server proves the cache clear failed before replay claim and before sync began.

### Post-confirm response loss

Once CONFIRM & SYNC has been sent, connection loss is not treated as ordinary failure.

Browser transport loss, flow exception, missing/unreadable result cache, or adapter `WRITE_OUTCOME_UNKNOWN` is surfaced as `OUTCOME UNKNOWN` with `writePerformed=null`.

Required operator behavior:

1. disable duplicate CONFIRM for that transport request;
2. expose **CHECK RESULT**;
3. CHECK RESULT calls only `getConfirmSyncResult(request_id)`;
4. if a factual final result appears, render it;
5. if outcome remains unknown, reconcile against HISTORY and the authoritative destination before creating a new transport attempt.

D-034 remains authoritative: a later transport attempt may use a new ASC envelope request ID while preserving any upstream semantic idempotency identity required by ZASSPILL.

### Degraded persisted states

- `WRITE_UNVERIFIED` is DEGRADED: a write was attempted/accepted but persisted state could not be fully verified.
- verified destination persistence + HISTORY failure is DEGRADED: do not repeat the write because destination persistence is already factual; repair/reconcile the audit path instead.
- `WRITE_OUTCOME_UNKNOWN` is OUTCOME UNKNOWN, not FAILED.
- no degraded/unknown state is allowed to redirect or claim SAVED.

### Front Door offline-safe boundary

The existing Public Front Door already:

- stores draft, provider, and route override in browser session storage;
- prepares the receiver bootstrap client-side;
- supports visible manual copy when clipboard integration fails;
- opens the provider without any ASC persistence write.

This local fallback can preserve work during an ASC service interruption, but it does not create an ASC revision, semantic event, receipt, or SAVED state. Frozen upstream ZASSPILL `LOCAL_CHANGES` and reconciliation semantics remain the semantic authority for genuinely offline continuity edits.

### Local evidence

Focused regressions prove:

- server-preview outage → DEGRADED, pending request preserved, CONFIRM disabled, retry-preview exposed;
- post-confirm network loss → OUTCOME UNKNOWN, one CONFIRM call only, duplicate CONFIRM disabled;
- CHECK RESULT performs result lookup only and can recover to factual SAVED/FAILED state;
- missing/unreadable result cache → canonical server `OUTCOME_UNKNOWN` + `writePerformed=null`;
- verified destination write + HISTORY failure → DEGRADED and no retry;
- `WRITE_UNVERIFIED` → DEGRADED;
- `WRITE_OUTCOME_UNKNOWN` → OUTCOME UNKNOWN;
- Front Door draft/handoff fallback remains local and exposes no persistence writer.

No live outage injection has been performed yet. T-019C remains LOCAL PASS until protected deployment and live response-loss/outage proof complete.
