# AISYNC Private Continuity State — T-015

Status: **IN PROGRESS — LOCAL MECHANICS PASS; live Drive/ASC DB proof pending**

This directory implements the smallest Production v1 canonical project/thread state slice required by T-015 while preserving D-032, D-033, and D-034.

## Authority boundary

- GitHub remains canonical for project/method artifacts and Git lineage.
- The **ASC Private Continuity Store** is authoritative for private Current Thread Records, semantic event lineage, and tombstones.
- Google Sheets remains a **derived operational/index projection** only.
- ZASSPILL owns semantic contract meaning. AISYNC owns identity generation, persistence mechanics, revision/concurrency/idempotency mechanics, protected metadata, and factual evidence.
- Native ZASSPILL continuity writes are not coerced into the eight-field ASC Write Contract v0.1.
- ASC envelope `request_id` remains transport/replay identity. ZASSPILL `req_<ULID>` remains logical semantic idempotency identity.

## Files

- `private-continuity-state.mjs` — runtime-neutral persistence state mechanics.
- `index-freshness.mjs` — exact repository/ref/commit freshness comparison; no lifecycle/progress inference.
- `github-source-head.mjs` — read-only GitHub default-branch head evidence reader.
- `test-private-continuity-state.mjs` — identity/revision/event/idempotency/concurrency/bootstrap/delete proof.
- `test-index-freshness.mjs` — CURRENT/STALE/SOURCE_MISMATCH/UNVERIFIED evidence proof.
- `test-github-source-head.mjs` — canonical default-branch/head read proof.

## Private store backing for Production v1 closed beta

T-015 selects a **dedicated private Google Drive JSON state file**, accessed only by the server-side Apps Script runtime.

The Apps Script binding is in:

- `apps-script/PrivateContinuityDriveStore.gs`
- `apps-script/ContinuityState.gs`

The folder/file IDs are technical locators stored in Script Properties. The JSON file, not Script Properties and not Sheets, holds the authoritative continuity state. The store fails closed unless the resolved folder/file has `DriveApp.Access.PRIVATE`; it does not attempt to rewrite sharing permissions at runtime.

A Script Lock serializes read-modify-write transactions. After a changed transaction, the state file is read back and verified before success is returned.

This is intentionally a closed-beta implementation choice, not a claim that a single JSON file is the forever multi-tenant architecture. T-019 owns backup/restore, migration, degraded/offline behavior, telemetry, deployment, rollback, and operational hardening.

## Internal state shape

The store keeps method semantics opaque:

```text
state
└─ projects[project_id]
   ├─ threads[thread_id]
   │  ├─ revision
   │  ├─ created_at
   │  ├─ semantic_updated_at
   │  └─ semantic_record      ← method-owned opaque JSON
   ├─ events[thread_id][]
   │  ├─ event_id
   │  ├─ revision
   │  ├─ event_type           ← method-provided operation
   │  ├─ occurred_at
   │  └─ change               ← method-owned opaque JSON
   ├─ tombstones[thread_id]
   │  ├─ thread_id
   │  ├─ deleted_at
   │  └─ deletion_request_id
   └─ requests[req_<ULID>]
      ├─ payload_fingerprint
      └─ original factual result
```

The persistence engine does not enumerate ZASSPILL lifecycle operations and does not inspect semantic fields such as title/state/continuity/lineage.

## Proven local behavior

- bootstrap NO_MATCH → stable `th_<ULID>`, revision 1, CREATE event;
- explicit UNIQUE_MATCH → attach existing identity, no duplicate;
- MULTIPLE_MATCHES → clarification state, no auto-selection/create;
- same semantic request + same payload → ALREADY_APPLIED, no revision/event bump;
- same semantic request + different payload → IDEMPOTENCY_KEY_REUSE_CONFLICT;
- stale expected revision → REVISION_CONFLICT, no write/event;
- successful mutation → exactly one revision bump + matching event;
- delete → Current Thread Record + event history removed and minimal tombstone retained;
- tombstoned identity cannot silently resurrect;
- thread index is derived on read from authoritative state;
- freshness is CURRENT only for exact repository/ref/commit evidence, otherwise STALE/SOURCE_MISMATCH/UNVERIFIED.

No public/client mutation surface is introduced by T-015. Human-facing continuity/retrieval belongs to T-017/T-018.
