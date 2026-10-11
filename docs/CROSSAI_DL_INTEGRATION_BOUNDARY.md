# CrossAI Core ↔ Dzuddiyn Library Integration Boundary

**Status:** LOCKED FUTURE ARCHITECTURE DIRECTION via D-035  
**Date:** 2026-10-11  
**Owner:** Project Owner  
**Source:** Temaya D-058 at commit `3dc06dcd21cf5d7395c057b109af8438ad83aa84` plus CrossAI Companion reconciliation D-030.  
**Critical-path effect:** NON-BLOCKING for current T-020/T-021 Production v1 delivery.

## 1. Authority

CrossAI Core remains canonical semantic/governance authority for CrossAI Idea / Decision / Project state and private continuity according to existing AISYNC/CrossAI contracts.

This direction does **not** move durable content into a new central database or warehouse.

Existing authority remains in force:

- ASC Private Continuity Store for authoritative private thread continuity where applicable;
- Google Drive as the preferred future user-owned durable store for ordinary CrossAI content;
- GitHub where a project explicitly declares Git-backed artifact authority;
- ASC DB / Sheets and other indexes/projections as derived operational state.

## 2. Direct CrossAI ↔ DL pattern

```text
CrossAI Core
canonical semantic/governance authority
        │
        ├─ stable authorized read/event contract
        ▼
DL CrossAI Adapter
        │
        ▼
Dzuddiyn Library
searchable derived projection/reference
```

Dzuddiyn Library is not a second CrossAI master.

A projection may carry minimized discovery metadata such as:

```text
crossai_id
type
title
summary
project_ref
tags / relations
source / provenance
authority = CrossAI
updated_at
```

Exact schema remains future implementation work.

## 3. Projection + live read

When a user/agent needs authoritative detail:

```text
Temaya / DL search
        ↓
finds crossai_id
        ↓
scoped live read
        ↓
CrossAI Core
        ↓
latest authorized authoritative object/state
```

Rules:

- projection result is discovery evidence, not truth authority;
- stale projection must be detectable where practical;
- live read is authorization-scoped;
- a projection failure never changes CrossAI canonical state;
- retries must not create duplicate DL references;
- delete/archive/revoke/privacy semantics must be designed and proven before production sync.

## 4. DL → CrossAI mutation

DL may provide authorized scoped context to CrossAI.

DL must not directly mutate canonical CrossAI state.

```text
DL / Temaya context
        ↓
explicit CrossAI action
        ↓
CrossAI Compatible
        ↓
CrossAI Core governance
        ↓
SAVE / mutation
        ↓
factual receipt
```

Existing idempotency, authorization, factual receipt, and continuity rules remain authoritative.

## 5. Forbidden coupling

Do not build the integration around:

- scraping incidental AISYNC/CrossAI database tables;
- Apps Script internal functions as the public integration contract;
- direct editing of private continuity files from DL;
- CrossAI Companion manually copying canonical records into DL;
- Obsidian or Notion as required middleware;
- a second editable CrossAI master in DL.

The stable external contract must outlive internal runtime/storage migrations.

## 6. Human surfaces

```text
Human
  ↕
Obsidian / Notion / future UI
  ↕
Dzuddiyn Library
```

These are optional DL human surfaces. They are not part of the mandatory CrossAI↔DL transport path.

## 7. Relationship to Temaya

Temaya defaults to family/life/household capture.

If Temaya notices CrossAI-worthy creation work, it may suggest an explicit handoff. No approval means no CrossAI mutation.

Temaya and a separate owner-side CrossAI Personal Agent may coexist as peer clients without altering Core authority.

## 8. Implementation gate

This document does not create a current Production v1 task.

Future implementation should begin only when:

- the relevant CrossAI Compatible/scoped-read contract is stable enough;
- DL practical access exists;
- privacy/deletion/retry/staleness requirements for the intended projection scope are defined;
- the current Production v1 critical path is not silently displaced.

A first proof should use a non-sensitive synthetic or sanitized object and prove:

- projection create/update;
- idempotent retry/no duplicate reference;
- scoped live read;
- stale detection/reconciliation;
- DL cannot directly mutate Core;
- explicit mutation returns through Compatible/Core with factual receipt.
