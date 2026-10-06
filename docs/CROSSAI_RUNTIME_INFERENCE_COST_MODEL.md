# CrossAI Runtime & AI Inference Cost Model

**Status:** SAVED ARCHITECTURE IDEA — AGREED, NOT YET IMPLEMENTATION LOCK  
**Date:** 2026-10-06  
**Owner:** Project Owner  
**Scope:** AI inference layer, free-first service, BYOK/premium paths, multimodal cost separation, throughput/backpressure, and runtime migration

## Core idea

CrossAI should separate four independent cost domains:

```text
1. Channel / messaging cost
2. Runtime / gateway cost
3. AI inference cost
4. Durable storage cost
```

These costs must not be fused into ASC continuity semantics.

## AI inference layer

AI that answers the user sits after ASC at the AI Router / inference layer:

```text
WhatsApp / Telegram / Web
          ↓
   Channel Gateway
          ↓
        ASC Core
identity / continuity / retrieval
          ↓
       AI Router
          ↓
 ┌────────┼───────────┐
 ↓        ↓           ↓
Free AI  BYOK/User   CrossAI Paid
         Provider       AI
```

ASC remains responsible for continuity, routing context, lineage and SAVE truth. The AI provider performs inference.

## Service modes

Candidate commercial/runtime model:

### FREE
- economical/free-tier model;
- suitable for ordinary chat and light tasks;
- quota may apply;
- no “free unlimited” promise.

### POWER / BYOK
- user supplies or authorizes a stronger provider/API;
- provider usage cost belongs to the user/provider account where applicable;
- CrossAI preserves the same continuity.

### CROSSAI PREMIUM
- CrossAI funds paid inference;
- user pays CrossAI through a future plan/credits model;
- continuity architecture remains unchanged.

### EXTERNAL HANDOFF
If CrossAI-provided inference is unavailable or quota-limited:

```text
CrossAI continuity
      ↓
scoped handoff
      ↓
external AI app/provider
      ↓
return/reconcile
      ↓
same CrossAI continuity
```

## No-AI path

CrossAI should avoid AI inference when the requested operation does not require it.

Examples:

- save file to Drive;
- move/tag/link a file;
- attach an item to a project;
- retrieve a known factual record;
- perform deterministic routing already resolved by explicit user action.

This reduces cost and latency.

## Multimodal / image / PDF handling

File transport, durable storage and AI processing are separate:

```text
media arrives
   ↓
channel transport
   ↓
user-owned Google Drive
   ↓
optional AI analysis only when requested/required
```

Examples:

- “Save this image to Project X” → no vision inference required.
- “Read and compare these quotations” → multimodal AI required.
- “Extract key facts from this PDF” → document/vision inference required.

Heavy vision, long-context analysis and deep reasoning may consume higher quota/cost than ordinary text chat.

## Throughput

Throughput means how much work arrives concurrently, not only total users.

The system should account for:

- requests per minute;
- tokens per minute;
- requests per day;
- concurrent runtime executions;
- media/file processing load;
- provider-specific rate limits.

A service may have low monthly cost but still become overloaded during traffic spikes.

## Backpressure / queueing

When inference or runtime capacity is unavailable:

```text
request
  ↓
accepted / pending / failed truthfully
  ↓
queue / retry / alternate provider / handoff
```

Required properties:

- request identity;
- safe retry;
- idempotency;
- no duplicate semantic promotion;
- no false SAVE receipt;
- visible pending/failed state.

## Runtime portability

Current Apps Script is suitable for beta/small deployment but should not be assumed to be the forever high-volume backend.

Candidate evolution:

```text
Phase 1
Channel Gateway
→ Apps Script
→ ASC
```

```text
Phase 2
Channel Gateway
→ scalable runtime such as Cloud Run
→ same ASC contracts/continuity
```

The runtime may change without changing:

- ASC continuity semantics;
- channel contract;
- AI Router semantics;
- Google Drive durable storage model;
- optional GitHub model.

## Cost responsibility model

Candidate responsibility split:

| Cost meter | Typical payer |
| --- | --- |
| Channel / messaging | CrossAI or business user |
| Runtime / gateway | CrossAI |
| AI inference | free pool / user / CrossAI premium |
| Durable storage | user via Google Drive |

Exact pricing and billing remain future DESIGN decisions.

## Privacy / free-tier caution

“Free model” must not automatically mean “acceptable for all private content”.

Future AI Router policy may need to consider:

- provider data-use terms;
- privacy tier;
- user consent;
- sensitive/private project classification;
- BYOK or paid privacy-preserving provider option.

## Architecture invariant

```text
AI provider changes
≠ continuity changes

runtime changes
≠ continuity changes

channel pricing changes
≠ continuity changes

storage quota changes
≠ semantic authority changes
```

CrossAI should keep continuity stable while runtime, provider and commercial choices remain interchangeable.

## Still open

Future DESIGN work must decide:

- exact free-model/provider roster;
- free-user quota;
- BYOK credential handling;
- premium pricing/credits;
- provider failover;
- privacy policy by provider/tier;
- queue implementation;
- runtime migration trigger;
- media processing limits;
- billing telemetry;
- abuse controls;
- plan limits and fair-use rules.
