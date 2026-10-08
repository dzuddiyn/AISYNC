# CrossAI Intelligence & Agent Compatibility — Future Work

**Status:** AGREED FUTURE WORK — NOT YET IMPLEMENTATION LOCK  
**Date:** 2026-10-08  
**Owner:** Project Owner  
**Scope:** Intent resolution, interaction-mode context, unresolved-work projections, digest, external AI agent/bot compatibility, and product differentiation.  
**Critical-path effect:** NON-BLOCKING for current Production v1 work unless explicitly promoted later.

## 1. Existing foundations — do not duplicate

This future work builds on existing CrossAI architecture rather than creating a second semantic system.

### CrossAI Intelligence already exists as a narrow Core-side role

Existing product direction assigns CrossAI Intelligence to screening, classification, relation/deduplication, summarization, retrieval assistance, and semantic promotion suggestions.

Governance remains:

> **AI interprets. ASC governs. User decides.**

### Retrieval substrate work already covers Cognee / Graphiti / Zep / Mem0

`docs/CROSSAI_RETRIEVAL_ARCHITECTURE.md` already locks a layered future retrieval architecture:

```text
ZASSPILL semantic contract
        ↓
ASC Canonical Memory
        ↓
pluggable derived retrieval substrate
Native ASC / Cognee / Graphiti-Zep / Mem0
        ↓
ASC Retrieval Intelligence
        ↓
Context Assembly
        ↓
Target AI
```

These providers are implementation candidates for derived retrieval/graph/temporal assistance. They are **not** semantic authority and do not replace Core/ASC continuity.

### Continuity Packet is not a new subsystem

The desired thread-continuity behavior is already covered by native CrossAI continuity plus retrieval/context assembly:

- stable conversation/thread identity;
- current state and lineage;
- relevant decisions/open questions;
- minimum authorized context;
- provenance;
- token/context budget;
- scoped handoff/return.

Do not create a second `Continuity Packet` authority unless later evidence proves a missing contract.

### User actions already have an ownership rule

CrossAI may expose actions such as REVIEW, SAVE, HISTORY, RESUME, SPLIT, or promotion actions, but the relevant domain method owns their semantics. Core/ASC must not reimplement ZASS/ZASSELECTION/ZASSPILL meaning.

## 2. AC-001 — Intent Resolution Pipeline

**Status:** AGREED FUTURE CANDIDATE

CrossAI should evolve toward a staged **Intent Resolution Pipeline**, not a monolithic Intent Engine with unilateral authority.

Preferred conceptual flow:

```text
user input
   ↓
deterministic explicit-intent checks
   ↓
optional Companion/channel signal
   ↓
CrossAI Intelligence screening
classify / normalize / relate / ambiguity check
   ↓
Core route candidate
   ↓
user confirmation where inference would create/promote structure
   ↓
Core enacts authorized route/lifecycle action
```

Principles:

- explicit user intent should avoid unnecessary AI classification;
- inferred intent remains advisory until the applicable governance/user-confirmation rule is satisfied;
- no single LLM/model owns routing truth;
- Intent Resolution may use retrieval/context evidence, but retrieval score is not authority;
- the pipeline should be replaceable/testable stage by stage;
- future supported intents may expand beyond current DUMP / DECIDE / DESIGN, but new canonical object types require explicit architecture decisions.

This candidate preserves the existing Companion/Core split and avoids a Core god-object.

## 3. AC-002 — Relationship / Interaction Mode

**Status:** AGREED FUTURE CANDIDATE — REQUIRED FUTURE WORK

CrossAI should support per-conversation **interaction preference/context** so the assistant can respond in the relationship mode the user currently needs.

Examples:

```text
user: "saya penat"
assistant may suggest:
"Awak nampak perlukan ruang sembang. Mahu saya jadi kawan sembang untuk chat ini?"
        ↓
user explicitly or contextually/unambiguously accepts
        ↓
interaction_mode = friend
```

```text
user: "saya nak siapkan master!"
assistant may suggest:
"Biar saya jadi personal SV + study partner untuk chat ini."
        ↓
user accepts
        ↓
interaction_mode = personal_sv_study_partner
```

Possible future modes include:

- friend / conversational companion;
- professor / personal SV;
- study partner;
- engineer reviewer;
- project manager;
- concise Malay helper;
- other user-defined modes.

Guardrails:

- mode is **conversation-scoped by default**, not a silent permanent global profile;
- suggestion may be inferred, but activation requires explicit or contextually unambiguous user acceptance;
- mode changes interaction style/context, not semantic authority;
- provider/model personality is not continuity authority;
- user must be able to inspect/change/reset the active mode;
- cross-conversation reuse, persistence duration, inheritance, deletion and conflict rules remain future DESIGN questions;
- sensitive personal inference must not be promoted into a permanent profile merely because a user uttered one sentence.

This future work should be evaluated for false-positive persona switching and unwanted emotional overreach before implementation lock.

## 4. AC-003 — Intelligence-managed Unresolved Inbox and CrossAI Digest

**Status:** AGREED FUTURE CANDIDATE

CrossAI Intelligence may derive user-facing projections of unresolved/active work from authorized canonical state.

Candidate unresolved categories:

- decisions awaiting user choice or SAVE;
- ideas not yet promoted;
- stalled DESIGN/project work;
- pending/failed/UNKNOWN operations;
- tasks waiting on user action;
- explicit follow-up items;
- other future lifecycle objects with unresolved state.

Conceptual flow:

```text
Core canonical state
+ authorized retrieval
        ↓
CrossAI Intelligence
        ↓
derived unresolved projection
        ├─ Inbox / Needs Attention
        └─ daily / weekly Digest
```

Rules:

- Inbox/Digest are derived views, not new canonical masters;
- Intelligence may summarize/prioritize but must preserve provenance;
- stale/tombstoned/unauthorized state must be excluded;
- a Digest must not silently mutate canonical state;
- user actions from Inbox/Digest route back through the applicable domain method/Core governance;
- schedule/cadence, ranking policy and notification channels remain future product decisions.

## 5. AC-004 — External AI Agent / Bot Compatibility

**Status:** AGREED FUTURE CANDIDATE — REQUIRED FUTURE WORK

CrossAI should be compatible with external AI agents/bots rather than requiring CrossAI to build and maintain its own universal agent runtime.

Target classes include:

- open-source AI agents;
- official/provider-hosted agents;
- AI-provider bots or agent products;
- custom/private agents;
- future agent runtimes that can consume a compatible contract.

Preferred boundary:

```text
External Agent / Bot
        ↓
Agent Compatibility Adapter
        ↓
CrossAI Compatible
        ↓
identity / authorization
        ↓
scoped context + allowed actions
        ↓
Core governance / tools / SAVE truth
        ↓
factual receipts / return / reconciliation
```

Principles:

- the external agent never becomes semantic memory authority;
- CrossAI does not need to rebuild the agent's planning/reasoning/runtime;
- agents receive only authorized scoped context;
- agent actions must be permissioned and receipt-driven;
- deterministic Core operations remain below/outside agent reasoning;
- handoff/return lineage must remain traceable;
- provider-held agent memory is outside CrossAI authority unless intentionally imported through an explicit contract;
- protocol/transport choice remains replaceable.

Potential future adapter surfaces may include MCP, A2A, provider-specific agent APIs, or neutral HTTP/JSON contracts, but **no protocol is locked here**.

A first compatibility proof should use one external agent and a narrow reversible capability rather than attempting a universal agent framework.

## 6. AC-005 — Product differentiator: governed intent-to-lifecycle orchestration

**Status:** AGREED PRODUCT PRINCIPLE CANDIDATE

Candidate statement:

> **CrossAI's differentiator is not merely persistent chat. It is governed intent-to-lifecycle orchestration: helping a user's input become the right thing—conversation, idea, decision, design/project candidate, or other future object—without surrendering user control.**

Interpretation:

```text
AI notices
   ↓
CrossAI interprets
   ↓
Core governs
   ↓
User decides where required
```

Not:

```text
AI notices
   ↓
AI silently reorganizes the user's state
```

This principle is consistent with explicit promotion, Core authority, route separation and user-owned continuity. It remains a candidate until explicitly promoted to a LOCKED product principle.

## 7. Companion Provider Router ownership boundary

A future **Companion Provider Router** is useful for taking advantage of free/provider quotas and selecting an appropriate conversational model, but its implementation ownership belongs to the **CrossAI Companion** project, not AISYNC Core.

AISYNC records only the boundary:

```text
Companion Provider Router
= replaceable inference selection

ASC/Core
= continuity / authorization / governance / SAVE truth
```

A provider-router decision must never become continuity authority.

No Companion implementation task is created by this AISYNC future-work record.

## 8. Experiments required before future implementation lock

Recommended future evidence:

1. **Intent Resolution precision**
   - explicit-intent bypass;
   - inferred candidate accuracy;
   - false-route and unwanted-thread-creation rate;
   - ambiguity handling.

2. **Interaction mode UX**
   - suggestion acceptance/rejection;
   - false persona switches;
   - reset/change behavior;
   - conversation-scoped persistence;
   - user perception of usefulness vs intrusion.

3. **Unresolved Inbox / Digest**
   - signal-to-noise ratio;
   - stale-state suppression;
   - provenance quality;
   - whether prioritization actually helps users.

4. **Agent compatibility proof**
   - one external agent;
   - one narrow authorized capability;
   - scoped context;
   - deterministic permission boundary;
   - factual receipt;
   - return/reconciliation;
   - revoke/failure behavior.

5. **Retrieval substrate reuse**
   - reuse the existing Native/Cognee/Graphiti-Zep/Mem0 bake-off rather than creating a parallel memory stack.

## 9. Non-goals for the current critical path

This future-work record does **not** authorize:

- a new monolithic Intent Engine;
- a new global memory/profile database;
- automatic canonical promotion without user governance;
- a CrossAI-built universal agent runtime;
- protocol lock-in to MCP/A2A/provider-specific APIs;
- implementation of relationship_mode in Production v1;
- Inbox/Digest implementation in Production v1;
- interruption of current Production v1 delivery solely for these candidates.

## 10. Review state

For future owner review:

```text
AC-001 Intent Resolution Pipeline              AGREED CANDIDATE
AC-002 Relationship / Interaction Mode         AGREED CANDIDATE — REQUIRED FUTURE
AC-003 Unresolved Inbox + CrossAI Digest        AGREED CANDIDATE
AC-004 External AI Agent / Bot Compatibility   AGREED CANDIDATE — REQUIRED FUTURE
AC-005 Intent-to-Lifecycle Differentiator       AGREED PRODUCT PRINCIPLE CANDIDATE
```

No candidate above is promoted to a new LOCKED D-xxx decision by this document.
