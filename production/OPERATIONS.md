# AISYNC Production Operations Runbook

Status: **T-019 IN PROGRESS — T-019A LOCAL PASS / LIVE PROOF PENDING**

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

It is **not yet** account-wide disaster recovery. Backups remain within the same owner Drive environment. Broader disaster recovery, replay-marker lifecycle, degraded/offline behavior, telemetry, secret rotation, deployment/rollback, and final operator acceptance remain T-019 work.

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
