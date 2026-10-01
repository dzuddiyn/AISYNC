# AISYNC

> Shared transport and persistence infrastructure for meaningful AI/project records.

**Status:** Boundary locked; implementation architecture pending  
**Method used to develop this project:** ZASSIMPLE v0.1.6  
**Repository:** AISYNC

AISYNC separates **how information is reasoned about** from **how that information is transported and persisted**.

It is designed as common infrastructure that can be reused by ZASS Full, ZASSIMPLE, ZASSELECTION, Dzuddiyn Library, and other projects.

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
GitHub Google Sheets  AI-SYNC DB
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
- Google Sheets
- AI-SYNC Database

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
   ├──► Google Sheets
   └──► AI-SYNC DB
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

## What is not decided yet

The boundary is locked. The implementation architecture is not.

Not yet selected:

- AISYNC common record/protocol format
- AISYNC Database technology
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
- ASC Web implementation technology

These should be decided from evidence, not assumed.

---

## Project Source of Truth

The working project record is:

**[ZASSIM-AISYNC.md](./ZASSIM-AISYNC.md)**

It contains the current decisions, risks, open questions, and project history.

---

## Current project state

```text
BOUNDARY + ASC LINK FALLBACK LOCKED
      ↓
define minimum information contract
      ↓
test transport + write behavior
      ↓
collect evidence
      ↓
select implementation architecture later
```

AISYNC should remain small, reusable, and independent of any one reasoning method or persistence destination.
