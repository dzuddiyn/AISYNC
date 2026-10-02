# AISYNC — ZASSIMPLE ARCHITECTURE

**Version:** 1.0.7  
**Status:** CONFIRMED  
**Architecture Progress:** 4/4 — purpose / main flow / main components / relevant LOCKED decisions  
**Method:** ZASSIMPLE v0.3.0  
**Authority:** Derived from LOCKED owner decisions D-002 through D-026 and recorded Action Plan findings.

> Confirmed by the Project Owner on 2026-10-01 using the exact phrase `YA, CONFIRM ARCHITECTURE`.
>
> Method baseline note: ZASSIMPLE v0.3.0 now treats architecture as a technical subtype of DESIGN. This document remains the confirmed technical design/architecture artifact; the historical confirmation above remains valid and is not reopened.

## Purpose

ASC is shared transport/write infrastructure between reasoning/selection methods and authoritative persistence destinations.

Methods own meaning and decisions. ASC owns transport, validation, destination translation, persistence, verification, and factual receipts.


## Front-door AI handoff flow

D-020 adds an entry/orchestration flow before the existing ASC persistence flow. It does **not** replace the confirmed write/verification pipeline.

```text
User types first message
        ↓
User MUST choose AI provider
        ↓
GO / START
        ↓
provider selected?
  ├─ NO → red warning below arrow → STOP
  └─ YES
        ↓
check ASC login/session
  ├─ authenticated → continue
  └─ not authenticated
        ↓
preserve draft locally
        ↓
attempt login in new tab
  ├─ success → continue after login
  └─ blocked/unavailable
        ↓
red warning:
copy draft first
        ↓
user presses again
        ↓
redirect to login page
        ↓
ASC Intent Router
  ├─ unclear / casual / scattered → DUMP
  ├─ choice / comparison → DECIDE
  └─ build / create / design → DESIGN
        ↓
select ZASS sub-system + current contract/instructions
  ├─ DUMP   → ZASSPILL
  ├─ DECIDE → ZASSELECTION / PICKS
  └─ DESIGN → ZASSIMPLE / IDEA
        ↓
selected AI provider handoff
  ├─ supported prefill/deep-link
  │      → open AI chat with ASC bootstrap prompt
  └─ unsupported
         → show copy/paste prompt + provider link
```

Rules:
- DUMP is the safe default for ambiguous intent.
- The chosen route remains visible and user-overridable.
- Later intent changes produce a switch suggestion; ASC does not silently change the active mode.
- ASC selects the appropriate ZASS subsystem/contract but does not duplicate its semantic rules.
- ZASSPILL remains an external dependency until its ZASS SYSTEM definition is complete.
- Provider-specific prefill is capability-dependent; copy/paste is the required fallback.
- Authentication/routing/handoff does not itself imply persistence.

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
Google Account gate → preserve pending request → preview → CONFIRM & SYNC
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
- DESIGN

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

### 7. Google Account authentication

- Google Account is the v0.1 login/identity mechanism.
- access is owner-only for v0.1.
- pending ASC Link requests survive sign-in.
- sign-in does not itself authorize persistence; explicit CONFIRM & SYNC remains required.
- successful sync returns the user to the main ASC UI.

### 8. ASC Core

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

### 9. Google Sheets = ASC DB

Operational/index store, not a competing editable master for canonical GitHub artifacts.

Minimum logical tables/tabs:
- PROJECTS
- RECORDS
- ACTION_PLAN
- HISTORY

Method-owned semantic fields such as lifecycle stage/progress are stored/displayed by ASC, not invented by ASC Core.

### 10. GitHub adapter

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

### 11. Write Receipt

Must distinguish proposed state from persisted state.

Minimum intent:
- SUCCESS / FAILED
- destination
- affected resource
- commit/record identifier where applicable
- timestamp/request ID
- failure reason when unsuccessful

Exact receipt schema remains an implementation detail.

### 12. External integration targets

Primary locked targets:
- Obsidian
- Notion
- OneNote
- Logseq
- Joplin

Airtable remains a candidate.

These integrations are adapters/consumers around ASC Core, not part of method semantics.


## Cross-system validation boundary

```text
                    ZASS SYSTEM
                         │
                    ZASS Core
              parser / validator / rules
                    ┌────┴────┐
                    │         │
               Local CLI   GitHub CI
               zass check   future runner
                    │         │
                    └────┬────┘
                         │
                      GitHub
                  canonical project SoT
                         │
                         ▼
                       ASC
              consume / display results
```

Rules:
- ZASS Core owns validation semantics and rule codes.
- Local CLI and future GitHub CI must use the same core semantics.
- ASC must not implement a second validator.
- ASC may consume/display validation results associated with Git commits.
- ZASS remains usable without ASC.
- GitHub CI is a locked architecture direction, not a claim of current implementation.

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
- D-012 — original UI information architecture
- D-019 — DECIDE / DESIGN terminology refinement
- D-013 — canonical JSON + transport envelope
- D-014 — GitHub/Sheets authority model
- D-015 — Sites + Apps Script + post-sync redirect
- D-016 — fine-grained PAT v0.1 → GitHub App later
- D-017 — Google Account owner-only authentication
- D-018 — ZASS Core / CLI / CI / ASC cross-system validation boundary

Action Plan lineage:
- AP-001 through AP-007

## Confirmed patch record

Architecture patch version: **1.0.1**  
Patch: top-level ASC UI wording changed from **DECIDE / BUILD** to **DECIDE / DESIGN**.  
Classification: terminology/UX refinement only; architecture semantics unchanged.

## Confirmation record

Confirmed architecture version: **1.0**  
Confirmed by: **Project Owner**  
Date: **2026-10-01**  
Confirmation phrase: `YA, CONFIRM ARCHITECTURE`

Implementation status: **NOT STARTED**. Next lifecycle stage: **DO IT**.


## Confirmed architecture patch record

### v1.0.2 — D-020 front-door orchestration addendum

**D-020 — ASC Start / Intent Routing / AI Handoff** is LOCKED.

This patch adds mandatory AI-provider selection, authentication before intent routing, automatic DUMP/DECIDE/DESIGN routing, ZASS sub-system selection, and provider handoff/fallback behavior. It does not change GitHub/Sheets authority, the ASC Write Contract boundary, adapter semantics, or factual receipt requirements.

Implementation of the DUMP route is intentionally deferred until ZASSPILL's own behavior/contract is available from ZASS SYSTEM.


### User-First UX principle

D-021 locks the front-door experience around the plain user:

```text
type naturally
      ↓
choose AI provider
      ↓
GO
      ↓
ASC handles:
auth → intent → route → ZASS sub-system → contract → AI handoff
```

Default visible modes remain:

- DUMP — just talk
- DECIDE — help me choose
- DESIGN — help me build

Internal method names and contracts remain hidden by default. The DUMP route will adopt ZASSPILL once ZASSPILL is finalized in ZASS SYSTEM.


### Authentication-state preservation — B + A

D-022 locks the v0.1 auth continuation strategy:

```text
PRIMARY B

ASC original tab
↓
preserve draft / pending request
↓
open Google login in new tab
↓
login succeeds
↓
return to original ASC tab
↓
CONTINUE
↓
replay into authenticated Apps Script
↓
preview
```

Fallback:

```text
A

login required
↓
complete login
↓
click ASC link / GO / CONTINUE again
↓
authenticated entry
↓
preview
```

The system must preserve the user's work; the URL fragment itself does not have to survive Google's redirect.

A fully automatic invisible auth-return/recovery flow is deferred beyond v0.1.


## Public Method Gateway / read plane

D-023 adds a read/distribution plane alongside the existing protected write/persistence plane.

```text
PUBLIC METHOD READ PLANE

Official ZASS GitHub repo
(authoritative method SoT)
        ↓
protected Method Registry sync
        ↓
AI-SYNC snapshot store
        ↓
PUBLIC READ-ONLY Method Gateway
        ↓
/method/zasspill/my
/method/zassimple/my
/method/zasselection/my
        ↓
ChatGPT / Meta / Gemini / Copilot / other receiver AI
```

This does not replace the write plane:

```text
PROTECTED WRITE PLANE

method / project
      ↓
ASC Write Contract v0.1
      ↓
ASC envelope / auth / Core
      ↓
GitHub project destination + ASC DB
      ↓
verification / receipt
```

### Authority boundary

- Official ZASS GitHub repository = canonical method content and commit lineage.
- AI-SYNC Method Registry = identifiable operational snapshot index.
- Public Method Gateway = read transport.
- Receiver AI = consumer.
- AI-SYNC must not become a second editable master for method semantics.

### Method Snapshot Record v0.1

Separate read-plane registry representation:

- `method`
- `language`
- `version`
- `source_repo`
- `source_path`
- `source_commit`
- `synced_at`
- `content`

The public Markdown endpoint serves `content` itself. Metadata is inspectable separately so a snapshot can always be traced to its canonical GitHub commit/version.

### Contract relationship

The existing **ASC Write Contract v0.1 remains exactly eight semantic fields**. Method Snapshot metadata is not added to it. This preserves T-001/D-011/D-013 boundaries.

The Method Gateway is a read-plane subsystem, not a new ZASS method and not a replacement for the ASC Write Contract.


## Method Gateway v0.1 implementation topology

D-025 locks the proof topology:

```text
CANONICAL SOURCE
Official ZASS GitHub repo
        ↓
resolve exact main HEAD commit
        ↓
PROTECTED SYNC APP
fetch 3 MY methods at that commit
        ↓
ASC DB / METHODS
snapshot registry
        ↓
PUBLIC READ APP
read-only anonymous GET
        ↓
plain Markdown / text
        ↓
receiver AI
```

### Separation rule

The protected sync app and public read app are separate Apps Script surfaces. Public readers must not gain access to sync, publish, write, configuration, or admin operations.

### Snapshot batch consistency

One sync run resolves a single canonical GitHub commit first. All three method files are then read at that exact commit. This prevents one registry refresh from combining method files from different repository states.

### Existing contracts

The eight-field ASC Write Contract v0.1 remains unchanged. The Method Snapshot Record v0.1 and METHODS table belong to the read plane.

### Execution order

```text
T-013A → T-013B → resume T-004
```

Production domain/URL, EN methods, advanced cache/versioning, webhooks, and broader registry features remain outside the v0.1 proof.


### Receiver format fallback

D-026 locks the T-013B rendering strategy:

```text
PRIMARY
/method/<method>/my
→ clean text / Markdown
→ receiver AI
```

Only if field testing proves the primary surface unreliable for a required receiver:

```text
FALLBACK
/method/<method>/my/view
→ clean HTML compatibility view
→ receiver AI
```

The HTML fallback is transport-only. It must preserve the same method content/semantics and must not become a second editable representation or method authority.
