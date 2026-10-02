# AISYNC

> Shared transport and persistence infrastructure for meaningful AI/project records.

**Status:** ARCHITECTURE CONFIRMED — DO IT ready; implementation not started  
**Method used to develop this project:** ZASSIMPLE v0.2.4  
**Repository:** AISYNC

AISYNC separates **how information is reasoned about** from **how that information is transported and persisted**.

It is designed as common infrastructure that can be reused by ZASS Full, ZASSIMPLE, ZASSELECTION, Dzuddiyn Library, and other projects.

---


## ZASSIMPLE project workflow

AISYNC is currently developed with **ZASSIMPLE v0.2.4**.

```text
DUMP → DISTILL → DECIDE → DESIGN → DO IT → DELIVERED !!
```

Current stage: **DO IT** — architecture v1.0 is confirmed; implementation has not started.

The project keeps the user-facing flow light while preserving lineage from decisions into hidden action planning, architecture, executable tasks, verification, and delivery.

Primary command surface:

```text
[🔬 ZASS!!] -- [📌 PROCEED/LOCK] -- [📚 SAVE]
```

Legacy `LOCK` / `LOCK DECISION` and `COMMIT` remain compatible aliases.

---

## Official boundary

```text
ZASS Full
ZASSIMPLE
ZASSELECTION
        │
        ▼
  Method / reasoning layer
  ────────────────────────
  structures & records:
  • reasoning logs
  • selection logs
  • evidence
  • rationale
  • decision lineage
  • architecture provenance
        │
        ▼
      AI-SYNC
  transport / write layer
        │
   ┌────┼───────────────┐
   ▼    ▼               ▼
GitHub   Google Sheets
           (= ASC DB)
        │
        ▼
 Source of Truth records
```

### Method / reasoning layer

**ZASS Full / ZASSIMPLE / ZASSELECTION** are methods for structuring and recording thinking and selection.

They deal with meaning:

- reasoning logs
- selection logs
- evidence
- rationale
- decision lineage
- architecture provenance

They should not need to understand the mechanics of GitHub, Google Sheets, or a database.

### AI-SYNC

**AI-SYNC is the transport / write layer.**

It handles:

```text
meaningful structured information
        ↓
move
        ↓
translate to destination format
        ↓
write
        ↓
verify
```

AI-SYNC is **not part of ZASS or ZASSELECTION**.

It is shared infrastructure.

### Source of Truth records

The current boundary recognizes these destination classes:

- GitHub
- Google Sheets (**ASC DB** for v0.1)

They may hold Source of Truth records for the origin and lineage of reasoning, selection, decisions, and architecture.

The exact authority rules for each record class are still an architecture question.

---

## Why this separation matters

Without this boundary, every method could end up learning how to write to every destination:

```text
ZASS → GitHub logic
ZASS → Sheets logic
ZASSIMPLE → GitHub logic
ZASSELECTION → Sheets logic
...
```

The locked model is instead:

```text
METHOD
   │
   ▼
meaningful structured record
   │
   ▼
AI-SYNC
   │
   ├──► GitHub
   └──► Google Sheets (= ASC DB)
```

The method owns the **meaning**.

AI-SYNC owns the **movement, destination translation, write, and verification**.

The destination owns the persisted **Source of Truth record** according to the authority model defined later.

---

## Shared consumers

AISYNC may be used by:

- **ZASS Full**
- **ZASSIMPLE**
- **ZASSELECTION**
- **Dzuddiyn Library**
- **other projects**

This makes AISYNC reusable infrastructure rather than a feature embedded inside one method.

---

## Dzuddiyn Library relationship

Dzuddiyn Library can use AISYNC as a consumer of the shared infrastructure.

The earlier idea that AISYNC might become a DL-specific subsystem is no longer the primary boundary. AISYNC is now defined more generally as shared transport/write infrastructure.

This does not force DL to automate anything in its current phase.

---

## What is LOCKED

**D-002 — Official Method → AI-SYNC → Source of Truth boundary**

> ZASS Full / ZASSIMPLE / ZASSELECTION = the way reasoning and selection are structured and recorded.

> Google Sheets / GitHub / AI-SYNC Database = Source of Truth record destinations for the origin and lineage of reasoning, selection, decisions, and architecture.

> AI-SYNC = the way information moves, is translated to the destination format, is written, and is verified.

> AI-SYNC is not part of ZASS or ZASSELECTION. It is shared infrastructure.

---


## Universal write fallback: ASC Link

Native integration is useful when it exists, but it is **not required** for ASC.

The locked fallback is:

```text
METHOD FILE
(ZASS / ZASSIMPLE / ZASSELECTION)
        │
        │ contains ASC fallback contract
        ▼
      AI APP
        │
        ├──────── direct write works ───────► destination
        │
        └──────── cannot write / write fails
                          │
                          ▼
                 generate ASC Sync Link
                          │
                          ▼
                       ASC Web
                          │
                 login if required
                          │
                        preview
                          │
                   CONFIRM & SYNC
                          │
                          ▼
                       ASC Core
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
           GitHub       Sheets      ASC DB
                          │
                          ▼
                 verification receipt
```

### Why this matters

ASC does not need a custom native integration for every AI application.

An ordinary AI app can participate if it can:

1. understand the ASC fallback instructions from the method file;
2. produce the required structured write request; and
3. generate the ASC Sync Link.

This means:

> **Native integration = convenience / fast path.**

> **ASC Link = universal write escape hatch.**

Universal support therefore means a **common information/write contract and confirmation path**, not one identical integration across every AI vendor.

### Method bootstrap routes

An AI may learn the method and its ASC fallback instructions through:

- attached method file;
- copied/pasted method content;
- accessible repository link.

A public repository is therefore only one bootstrap route, not a requirement.

### Link payload principle

For small link-carried proposals, ASC should prefer client-side URL fragments such as:

```text
https://asc.example/sync#payload=...
```

rather than putting sensitive content directly into normal query parameters.

The ASC Web should open, parse the proposal locally, require authentication when applicable, show a preview, and persist only after explicit confirmation.

Exact payload encoding, encryption, authentication, and large-payload handling remain implementation decisions.

---


## ASC v0.1 locked framework

```text
METHOD / PROJECT
      ↓
ASC Write Contract
      ↓
ASC Link
      ↓
Google Sites (ASC UI)
      ↓
ASC Core
      ↓
Destination Adapter
      ↓
GitHub / Google Sheets (= ASC DB)
      ↓
Write Receipt
```

### ASC Write Contract v0.1

Locked minimum fields:

- Project
- Source method
- Operation
- Record type
- Record ID
- Content/change
- Lineage
- Destination

### Google Sites UI

Landing:

```text
ASC
├── DECIDE
└── DESIGN
```

After entering **DECIDE** or **DESIGN**, show the project list with:

- project progress bar
- latest update

After opening a project, show:

1. Project progress bar
2. Progress summary
3. Next Action Plan summary
4. Next stage summary
5. Action Plan table
6. ZASS table — all applicable ZASS-family record components for that project/method
7. History

### Primary external integrations

Locked primary targets:

- Obsidian
- Notion
- OneNote
- Logseq
- Joplin

Airtable remains a later **candidate**, not a locked primary integration.

### First persistence proof

GitHub is the first persistence adapter for v0.1:

```text
ASC Contract
   ↓
GitHub Adapter
   ↓
Markdown update
   ↓
Commit
   ↓
Verify
   ↓
Receipt
```

---


## Locked v0.1 implementation direction

### Contract and transport

ASC uses **canonical JSON** for the semantic Write Contract. Transport/security metadata lives in a separate **ASC envelope**.

```text
ASC envelope
├─ contract/version metadata
├─ request / expiry / integrity metadata
└─ contract
   ├─ Project
   ├─ Source method
   ├─ Operation
   ├─ Record type
   ├─ Record ID
   ├─ Content/change
   ├─ Lineage
   └─ Destination
```

### Authority model

- **GitHub** — canonical project artifacts and Git lineage.
- **Google Sheets = ASC DB** — structured operational/index data for UI, progress views, normalized records, Action Plan views, and receipts/history.

Minimum logical Sheets tables/tabs:

- PROJECTS
- RECORDS
- ACTION_PLAN
- HISTORY

ASC displays semantic progress/stage produced by the method; it does not invent method progress.

### Google Sites + Apps Script

```text
AI / ASC Link
      ↓
Apps Script Web App
parse → preview → confirm
      ↓
ASC Core
      ↓
write + verify
      ↓
receipt
      ↓
redirect back to main Google Sites ASC UI
```

Google Sites remains the main dashboard/navigation shell. The Apps Script Web App handles interactive payload/confirmation/write behavior.

After a **successful** CONFIRM & SYNC, the user returns to the main ASC UI. Failed writes must surface failure and must not masquerade as success.

### Google Account login

ASC v0.1 uses Google Account sign-in with owner-only access. Pending ASC Link requests must survive sign-in, preview must appear before persistence, successful sync returns to the main ASC UI, and failed writes stay visibly failed.

### GitHub v0.1 authentication

For the personal v0.1 prototype:

- repo-scoped fine-grained PAT
- minimum required Contents write permission
- stored server-side
- never included in ASC Link/browser-visible payload

Later multi-user/public deployment should migrate to a GitHub App.

---

## What is not decided yet

The boundary is locked. The implementation architecture is not.

Not yet selected:

- exact data types / encoding rules inside the locked ASC Write Contract fields
- authentication
- APIs or webhooks
- queues
- retry behavior
- conflict handling
- exact write-receipt format
- which destination is authoritative for each record type
- sync direction/topology
- automation level
- exact ASC Link payload schema / encoding
- large-payload fallback mechanism
- Google Sites dynamic implementation mechanism
- adapter implementation order after GitHub
- implementation details beyond the locked UI boundary

These should be decided from evidence, not assumed.

---

## ZASS SYSTEM cross-system boundary

```text
ZASS Core
   ├── Local CLI (zass check)
   └── GitHub CI (future runner)
            ↓
          GitHub
            ↓
           ASC
   consume / display results
```

- ZASS Core owns parser/validator/rule semantics.
- CLI and future GitHub CI must run the same core logic.
- ASC must not implement a second copy of ZASS validation rules.
- ASC may consume and display commit-linked validation results.
- ZASS remains fully usable without ASC.
- GitHub CI is not yet implemented; it is an architecture direction, not a current capability.

---

## Project Source of Truth

The working project record is:

**[ZASSIM-AISYNC.md](./ZASSIM-AISYNC.md)**

It contains the current decisions, risks, open questions, and project history.

---

## Current project state

```text
ARCHITECTURE v1.0 CONFIRMED
      ↓
DO IT — slice Action Plan into executable tasks
      ↓
implement and validate locked ASC Write Contract
      ↓
test transport + write behavior
      ↓
collect evidence
      ↓
select implementation architecture later
```

AISYNC should remain small, reusable, and independent of any one reasoning method or persistence destination.


## Intended start UX

ASC's user-facing entry is intentionally simple:

```text
Type naturally
      ↓
Choose AI provider (required)
      ↓
GO
      ↓
login if needed
      ↓
ASC auto-routes
  DUMP / DECIDE / DESIGN
      ↓
open selected AI chat with ASC bootstrap prompt when supported
      OR
show copy/paste prompt + provider link
```

DUMP / DECIDE / DESIGN are user-facing modes. Internal mappings are:
- DUMP → ZASSPILL
- DECIDE → ZASSELECTION / PICKS
- DESIGN → ZASSIMPLE / IDEA

The route is visible and user-overridable. Ambiguous intent defaults to DUMP.


### User-first principle

The user should not have to understand ZASS internals before using ASC. The default start experience is: type naturally → choose AI provider → GO. ASC then handles authentication, routing, method/contract selection, and handoff behind the DUMP / DECIDE / DESIGN surface.


### Authentication continuation

ASC v0.1 uses a reliability-first B + A strategy:

- **Primary:** preserve the user's draft/pending request in the original ASC tab, open Google login in a new tab, then return and press **CONTINUE**.
- **Fallback:** after login, click the ASC link / GO / CONTINUE again.
- The user's work must not be lost.
- The URL fragment itself does not need to survive Google's authentication redirect.
- Fully automatic invisible auth recovery is a later enhancement, not a v0.1 requirement.
