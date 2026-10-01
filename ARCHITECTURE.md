# AISYNC — ZASSIMPLE ARCHITECTURE

**Version:** Draft 0.1  
**Status:** READY FOR CONFIRMATION — NOT YET CONFIRMED  
**Architecture Progress:** 4/4 — purpose / main flow / main components / relevant LOCKED decisions  
**Method:** ZASSIMPLE v0.2.4  
**Authority:** Derived from LOCKED owner decisions D-002 through D-016 and recorded Action Plan findings.

> This file is a working architecture draft. It becomes confirmed only after the owner replies exactly: `YA, CONFIRM ARCHITECTURE`.

## Purpose

ASC is shared transport/write infrastructure between reasoning/selection methods and authoritative persistence destinations.

Methods own meaning and decisions. ASC owns transport, validation, destination translation, persistence, verification, and factual receipts.

## Main flow

```text
METHOD / PROJECT
ZASS / ZASSIMPLE / ZASSELECTION / other consumer
        ↓
ASC Write Contract
canonical JSON semantic payload
        ↓
ASC transport/security envelope
        ↓
native direct write when available
        OR
ASC Link universal fallback
        ↓
Apps Script Web App
parse → preview → authenticate → CONFIRM & SYNC
        ↓
ASC Core
validate → authorize → translate → route
        ↓
Destination Adapter
        ├─ GitHub first
        └─ Google Sheets = ASC DB
        ↓
verify persisted result
        ↓
ASC Write Receipt
        ↓
HISTORY
        ↓
after successful update:
redirect user to main Google Sites ASC UI
```

## Main components

### 1. Method / consumer layer

Consumers include:
- ZASS Full
- ZASSIMPLE
- ZASSELECTION
- Dzuddiyn Library
- other projects

They produce meaningful records. They do not need destination-specific GitHub/Sheets implementation knowledge.

### 2. ASC Write Contract

Canonical representation: JSON.

Locked semantic fields:
- Project
- Source method
- Operation
- Record type
- Record ID
- Content/change
- Lineage
- Destination

### 3. ASC transport/security envelope

Separate from the semantic contract.

May carry implementation metadata such as:
- contract version
- request ID
- expiry
- nonce / replay-control information
- payload hash / integrity metadata

Exact encoding remains an implementation detail.

### 4. ASC Link

Universal write fallback when native/direct write is unavailable or fails.

For small payloads, prefer client-side fragment transport rather than exposing record content in ordinary query parameters.

### 5. Google Sites ASC UI

Main dashboard/navigation shell.

Top-level routes:
- DECIDE
- BUILD

Project list shows:
- project progress bar
- latest update

Project detail shows:
1. Project progress bar
2. Progress summary
3. Next Action Plan summary
4. Next stage summary
5. Action Plan table
6. ZASS table
7. History

### 6. Apps Script Web App

Interactive ASC surface/engine for:
- payload parsing
- preview
- authentication/authorization handoff
- explicit confirmation
- ASC Core invocation
- receipt display
- redirect to main Google Sites ASC UI after successful update

A failure must remain visible as failure and must not be presented as a successful sync.

### 7. ASC Core

Responsibilities:
- validate request
- authorize write
- preserve semantic meaning
- translate to destination-specific format
- route to adapter
- verify result
- issue factual receipt

Non-responsibilities:
- reasoning
- choosing decisions
- inventing progress
- silently changing LOCKED method decisions

### 8. Google Sheets = ASC DB

Operational/index store, not a competing editable master for canonical GitHub artifacts.

Minimum logical tables/tabs:
- PROJECTS
- RECORDS
- ACTION_PLAN
- HISTORY

Method-owned semantic fields such as lifecycle stage/progress are stored/displayed by ASC, not invented by ASC Core.

### 9. GitHub adapter

First persistence proof and canonical artifact destination.

v0.1 write path:
- repo-scoped fine-grained PAT
- minimum required Contents write permission
- secret stored server-side
- fetch current file/SHA
- create/update content
- obtain commit result
- verify persisted state
- issue receipt

Later multi-user/public deployment migrates to GitHub App authentication.

### 10. Write Receipt

Must distinguish proposed state from persisted state.

Minimum intent:
- SUCCESS / FAILED
- destination
- affected resource
- commit/record identifier where applicable
- timestamp/request ID
- failure reason when unsuccessful

Exact receipt schema remains an implementation detail.

### 11. External integration targets

Primary locked targets:
- Obsidian
- Notion
- OneNote
- Logseq
- Joplin

Airtable remains a candidate.

These integrations are adapters/consumers around ASC Core, not part of method semantics.

## Source-of-Truth authority

### GitHub

Canonical for:
- project Markdown artifacts
- decision/action/architecture/task files where applicable
- Git commit lineage/history

### Google Sheets / ASC DB

Operational structured/index store for:
- project registry
- normalized record views
- progress/current-state views
- Action Plan views
- write/history receipts

It must not silently become a second editable authority for the same canonical artifact.

## Constraints from LOCKED decisions

- ASC is shared infrastructure, not part of ZASS/ZASSELECTION.
- Native integrations are optional fast paths.
- ASC Link is the universal fallback.
- Google Sheets is ASC DB for v0.1.
- Google Sites is the main ASC UI.
- GitHub is the first persistence adapter.
- Contract meaning remains method-owned.
- Explicit user confirmation precedes fallback persistence.
- Credentials must not be exposed in ASC Link payload/browser-visible data.
- Successful confirmed update returns user to main ASC UI.

## Open implementation details

These do not block architecture confirmation:
- exact JSON data types and validation schema
- exact ASC envelope encoding/compression
- exact receipt JSON schema
- retry/conflict strategy
- progress field conventions emitted by different methods
- large-payload fallback
- integration adapter order after GitHub
- multi-user authorization beyond the later GitHub App direction

## Lineage

Core decisions:
- D-002 — Method / ASC / SoT boundary
- D-003 — ASC Link fallback
- D-004 — ASC v0.1 framework
- D-005 — Google Sheets = ASC DB
- D-006 — Google Sites = ASC UI
- D-007 — GitHub first adapter
- D-010 — external integration targets
- D-011 — Write Contract field set
- D-012 — UI information architecture
- D-013 — canonical JSON + transport envelope
- D-014 — GitHub/Sheets authority model
- D-015 — Sites + Apps Script + post-sync redirect
- D-016 — fine-grained PAT v0.1 → GitHub App later

Action Plan lineage:
- AP-001 through AP-007

## Confirmation gate

Architecture is ready for owner confirmation.

Required exact owner reply:

`YA, CONFIRM ARCHITECTURE`
