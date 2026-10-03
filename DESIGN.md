# AISYNC — ZASSIMPLE DESIGN

**Version:** 1.0.12
**Status:** CONFIRMED  
**Design Progress:** 4/4 — purpose / main flow / main components / relevant LOCKED decisions  
**Method:** ZASSIMPLE v0.3.0  
**Authority:** Derived from LOCKED owner decisions D-002 through D-034 and recorded Action Plan findings.

> Confirmed by the Project Owner on 2026-10-01 using the exact phrase `YA, CONFIRM ARCHITECTURE`.
>
> Method baseline note: ZASSIMPLE v0.3.0 treats architecture as a technical subtype of DESIGN. This document remains the confirmed technical design/architecture artifact; the historical confirmation above remains valid and is not reopened.
>
> **ZASSIMPLE v0.3 migration:** this artifact was renamed from `ARCHITECTURE.md` to `DESIGN.md` on 2026-10-02. Content/decision authority is preserved.

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
- DUMP uses the current frozen upstream ZASSPILL v1.0 semantic contract; ASC consumes/routes it without redefining its semantics.
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
show verified SUCCESS + receipt, then expose user-activated Return to main ASC UI
(automatic top-level navigation is optional when the platform permits it)
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

Current product routes, aligned with D-020:
- DUMP → ZASSPILL
- DECIDE → ZASSELECTION / PICKS
- DESIGN → ZASSIMPLE / IDEA

Full ZASS is not a peer landing route; it remains an explicit stronger-governance escalation from DESIGN.

The dashboard/read projection may group indexed projects by these three operational `ui_entry` values. DUMP also provides a path to the public ASC Front Door; ASC does not copy ZASSPILL method semantics into the dashboard.

Project list shows:
- project progress bar
- latest update

Project detail uses progressive disclosure:

```text
[ Workspace ] [ Review ] [ History ]

Workspace
├── Project Pulse
├── Continue naturally → ASC Front Door
└── one factual contextual card when supported

Review
├── commit-linked ZASS CI
├── progress / next-action / next-stage evidence
├── Action Plan
└── ZASS / project records

History
└── factual audit trail
```

Workspace is the default project surface. Internal IDs, lineage JSON, full Action Plan rows, record tables, CI detail, and History stay out of the default view and remain available on demand.

Contextual cards are projections only:
- Current Task comes from explicit open/current Action Plan status;
- Ready to Lock requires explicit ready/proposed decision state;
- Design Forming requires explicit DESIGN stage plus factual progress/summary;
- Delivered requires explicit delivered/complete lifecycle state;
- STALE project index state suppresses current-action claims and instead shows a refresh warning.

The dashboard does not infer method semantics or add a write path.

### 6. Apps Script Web App

Interactive ASC surface/engine for:
- payload parsing
- preview
- authentication/authorization handoff
- explicit confirmation
- ASC Core invocation
- receipt display
- user-activated `Return to main ASC UI` link/button after successful verified update; automatic top-level navigation is optional (D-030)

A failure must remain visible as failure and must not be presented as a successful sync.

### 7. Google Account authentication

- Google Account is the v0.1 login/identity mechanism.
- access is owner-only for v0.1.
- pending ASC Link requests survive sign-in.
- sign-in does not itself authorize persistence; explicit CONFIRM & SYNC remains required.
- successful sync exposes a user-activated return control to the main ASC UI; automatic top-level navigation is optional (D-030).

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
- Successful confirmed update exposes a user-activated return control to the main ASC UI; automatic top-level navigation is optional (D-030).

## D-030 successful return refinement

For ASC v0.1, the guaranteed post-sync return mechanism is a **user-activated `Return to main ASC UI` link/button** rendered only after verified SUCCESS + persisted HISTORY. Automatic top-level navigation may be attempted when the hosting/browser platform allows it, but it is not required for PASS and must not be the only return path. Failure/unverified states remain on the ASC surface and must not be presented as successful persistence.

This refines D-015 / D-017 wording without reopening the confirmed design.

## Production v1 delivery gate — D-031 LOCKED

D-031 | LOCKED — **technical proof is not project delivery**.

The completed ASC v0.1 core/fallback and T-001 through T-012 proofs establish that the architecture can work. They do **not** by themselves satisfy ZASSIMPLE `DELIVERED !!`.

The first production target is **AISYNC Production v1 closed beta**, not a public multi-tenant SaaS release.

Production v1 scope:
- invited human users only; minimum three distinct non-developer participants, target 3–5;
- Google Account remains the user identity gate with an explicit production allowlist;
- GitHub remains the canonical project/method Source of Truth;
- Google Sheets remains the operational/index ASC DB;
- GitHub is the only production write destination required for Production v1;
- production destination authentication migrates from the proof PAT path to a GitHub App boundary;
- DUMP → ZASSPILL v1.0, DECIDE → ZASSELECTION, DESIGN → ZASSIMPLE remain the visible routing contract;
- private project/thread continuity must be controlled and must not become a permanent public URL;
- ordinary users must not need to understand raw ASC contracts, raw GitHub paths, or long handover packets to complete the normal flow.

Production v1 can reach `DELIVERED !!` only when all of the following are proven:
1. canonical project/thread state has stable identity, revision/event lineage, duplicate/bootstrap protection, tombstone/delete behavior, and truthful GitHub→ASC index freshness;
2. the write path no longer depends on `TEST_ONLY`; production Record ID → authorized repository/branch/path mapping, optimistic concurrency, idempotency, unknown-write reconciliation, and GitHub App authorization are proven;
3. private continuity/retrieval follows the frozen upstream ZASSPILL v1 contract, including retrieval results, Packet ↔ ASC reconciliation, Portable Packet v2, cross-method handoff/result envelopes, and stale-result reconciliation;
4. one integrated human UX works end-to-end: login → project/thread → DUMP/DECIDE/DESIGN → provider handoff → SAVE → factual receipt/HISTORY → CI status → reopen/transfer;
5. production reliability is proven for backup/restore, migration safety, degraded/offline behavior, replay/idempotency lifecycle, truthful telemetry, secret rotation, deployment, and rollback;
6. the closed beta is completed by at least three distinct human participants without developer-side data repair or hidden manual patching of canonical/project state;
7. a release checkpoint records the production commit/deployment, known limitations, operator runbook, rollback point, and owner acceptance.

Until those gates pass, the AISYNC project lifecycle remains **DO IT**. A subsystem or technical proof may be described as delivered, but the project must not claim `DELIVERED !!`.

Production v1 non-goals:
- public anonymous/multi-tenant SaaS;
- production destinations beyond GitHub;
- broad external connector rollout (Obsidian/Notion/OneNote/Logseq/Joplin remain later integration work);
- EN method expansion or broad Method Gateway productization unless separately promoted.

## Production continuity authority refinements — D-032 to D-034 LOCKED

### D-032 — Private continuity authority/store

The authoritative private thread continuity state does **not** live in a normal GitHub project repository and does **not** live in the derived ASC DB/index projection.

Locked authority split:

```text
GitHub
= canonical project/method artifacts + Git lineage

ASC Private Continuity Store
= authoritative private Current Thread Records
+ semantic event lineage
+ tombstones / deletion authority

ASC DB / Sheets
= derived operational/index projection
+ dashboard views
+ factual write/history receipts
```

Rules:
- one authoritative private Current Thread Record exists per `thread_id`;
- semantic events and tombstones belong to the private continuity authority;
- the ASC DB may project continuity metadata for UI/index purposes but must not become a second semantic master;
- private continuity must not be published as a permanent public URL;
- the exact Production v1 backing technology for the ASC Private Continuity Store remains an implementation detail for T-015, provided this authority boundary is preserved.

### D-033 — Native ZASSPILL continuity contract boundary

The existing eight-field **ASC Write Contract v0.1 remains unchanged** for project/artifact writes that already use it.

Frozen ZASSPILL v1 continuity semantics are **not forced into that eight-field shape**. In particular, ASC must not invent a `Record ID` / `thread_id` during bootstrap merely to satisfy the older contract.

For continuity writes, ASC consumes the frozen upstream ZASSPILL write semantics natively:

```text
request_id
thread_id
expected_revision
operation
changes
```

Bootstrap may legitimately arrive without `thread_id`; ASC resolves identity according to the frozen bootstrap/import contract and generates a new `th_<ULID>` only when the semantic result is NO_MATCH → CREATE.

ASC owns transport, persistence, protected metadata, verification, authorization mechanics, and generated technical identities. ZASSPILL retains semantic-contract authority.

### D-034 — Transport request identity ≠ semantic idempotency identity

The D-029 ASC envelope `request_id` is a **transport/security attempt identity**. It is not the frozen ZASSPILL logical semantic idempotency key.

Locked separation:

```text
ASC envelope request_id
= transport attempt / replay-security identity

ZASSPILL request_id = req_<ULID>
= logical semantic mutation / idempotency identity
```

Consequences:
- D-029 replay protection remains valid for transport attempts;
- retrying the same logical semantic mutation may use a new transport envelope attempt while preserving the same ZASSPILL `req_<ULID>`;
- same semantic request ID + same semantic payload returns the original result / ALREADY_APPLIED rather than executing again;
- same semantic request ID + different semantic payload is IDEMPOTENCY_KEY_REUSE_CONFLICT;
- WRITE_OUTCOME_UNKNOWN recovery preserves the same semantic request ID;
- transport replay handling must not be used as a substitute for semantic idempotency.

## Open production implementation details

These are the current production parameters to resolve through the locked delivery track:
- canonical GitHub → ASC DB/index refresh and freshness rules;
- production project/thread/revision/event persistence mapping;
- production Record ID → authorized GitHub repository/branch/path mapping;
- GitHub App installation/authorization mechanics;
- controlled/private continuity protection and retrieval mechanics;
- degraded/offline, restore, migration, telemetry, deployment, rollback, and operator procedures;
- closed-beta onboarding/allowlist and acceptance evidence;
- integration adapter order after GitHub and broader multi-user/public product scope remain later work.

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
- D-015 — Sites + Apps Script + post-sync return pattern (refined by D-030)
- D-016 — fine-grained PAT v0.1 → GitHub App later
- D-017 — Google Account owner-only authentication
- D-018 — ZASS Core / CLI / CI / ASC cross-system validation boundary
- D-029 — v0.1 envelope security / replay controls
- D-030 — v0.1 verified-success return path: user-activated main-ASC link/button; automatic top-level navigation optional
- D-031 — Production v1 delivery gate: technical proof ≠ DELIVERED; closed-beta human/operations acceptance required
- D-032 — private continuity authority: dedicated ASC Private Continuity Store; GitHub project repos and ASC DB are not the semantic thread master
- D-033 — frozen native ZASSPILL continuity contract remains separate from the eight-field ASC Write Contract v0.1
- D-034 — transport request identity is distinct from ZASSPILL semantic idempotency identity

Action Plan lineage:
- AP-001 through AP-015

## Confirmed patch record

Architecture patch version: **1.0.1**  
Patch: top-level ASC UI wording changed from **DECIDE / BUILD** to **DECIDE / DESIGN**.  
Classification: terminology/UX refinement only; architecture semantics unchanged.

## Confirmation record

Confirmed architecture version: **1.0**  
Confirmed by: **Project Owner**  
Date: **2026-10-01**  
Confirmation phrase: `YA, CONFIRM ARCHITECTURE`

Implementation status: **ASC v0.1 TECHNICAL PROOF BASELINE COMPLETE**. T-001 through T-012 and T-013A/B are PASS. Production v1 is **NOT YET DELIVERED**; T-014 production baseline/definition gate is complete and execution advances to T-015 canonical project/thread/index state.


## Confirmed architecture patch record

### v1.0.2 — D-020 front-door orchestration addendum

**D-020 — ASC Start / Intent Routing / AI Handoff** is LOCKED.

This patch adds mandatory AI-provider selection, authentication before intent routing, automatic DUMP/DECIDE/DESIGN routing, ZASS sub-system selection, and provider handoff/fallback behavior. It does not change GitHub/Sheets authority, the ASC Write Contract boundary, adapter semantics, or factual receipt requirements.

Historical note: this addendum originally deferred DUMP until ZASSPILL was available. The upstream dependency is now satisfied by frozen ZASSPILL v1.0; current routing uses that upstream semantic contract without redefinition.


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

Internal method names and contracts remain hidden by default. The DUMP route now uses frozen upstream ZASSPILL v1.0; ASC remains transport/orchestration authority rather than semantic authority.


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


## Receiver-facing host refinement

D-028 | LOCKED

Field testing refined the Method Gateway transport without changing method authority or semantics.

1. **Protected sync remains Apps Script + METHODS.**
   Canonical GitHub method content is still fetched by the protected sync worker, pinned to one exact source commit, and stored/indexed in the METHODS registry.

2. **Apps Script is not the official receiver-facing host for v0.1.**
   Browser access worked, but Gemini and Copilot could not reliably fetch the Apps Script receiver surface, including the evidence-triggered HTML compatibility view.

3. **The v0.1 receiver-facing Method Gateway uses a standard static public host.**
   Current proof host: GitHub Pages under `https://dzuddiyn.github.io/AISYNC/method/<method>/my/`.

4. **GitHub remains the canonical method Source of Truth.**
   The GitHub Pages files are transport snapshots/mirrors only. They do not become a second editable method authority.

5. **The MY receiver surface covers all three methods.**
   - ZASSPILL
   - ZASSIMPLE
   - ZASSELECTION

6. **Receiver-source guardrail.**
   A receiver must use the exact Method Gateway URL supplied by the handoff. If that fetch fails, it must report the failure and must not silently substitute repository search, raw GitHub, or another source as authoritative method content.

7. **Field-evidence interpretation.**
   Gemini passed the end-to-end ZASSPILL → DESIGN → ZASSIMPLE handoff. Copilot passed a dedicated direct-read test but later showed retrieval variability in one end-to-end handoff session. That variability is recorded as a receiver caveat, not as a change to method semantics.

8. **Proof vs hardening boundary.**
   T-013 closes the v0.1 transport proof. Automatic regeneration/publishing of the static receiver pages after every future METHODS refresh is a later hardening concern unless evidence makes it necessary sooner.

## ASC continuity authority and cross-AI transfer

D-027 makes ASC the preferred continuity authority for intentional cross-AI continuation.

### Save path

```text
AI conversation
      ↓ SAVE
ASC save link
      ↓
preview / confirm
      ↓
ASC persistence
```

The user should not need to manually paste a long handover packet as the normal save mechanism.

### Transfer path

```text
ASC Web
      ↓
Project Tree
      ↓
select saved DUMP / DECIDE / DESIGN thread
      ↓
transfer/chat box
      ↓
select target AI
      ↓
Transfer Page
      ├─ short receiving instruction
      ├─ public Method Gateway link
      ├─ controlled continuity reference
      ├─ COPY
      └─ OPEN TARGET AI when supported
```

If provider prefill/deep-link is not supported, the official fallback is short copy/paste plus user-opened target AI/app.

### Authority split

```text
PUBLIC READ PLANE
/method/...
→ method semantics/instructions
→ public, reusable, read-only

CONTROLLED CONTINUITY PLANE
/handoff/... or equivalent
→ project/thread state
→ scoped/private/controlled
```

The exact continuity protection mechanism remains open for implementation and must be chosen with the smallest safe v0.1 design.

### UX acceptance principles

1. If an ordinary user still must paste a long method/continuity packet after ASC is complete, the UX goal is not met.
2. If cross-AI transfer still requires the user to understand ZASS method internals, raw GitHub URLs, fallback URLs, or packet structure, ASC is exposing too much transport complexity.
3. Preferred user flow is: `select thread → select AI → TRANSFER → copy/open → continue`.

This section refines T-004's eventual handoff target without changing the current T-013 execution order.
