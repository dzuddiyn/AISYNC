# CrossAI Sync — Future Product Direction

**Status:** LOCKED PRODUCT DIRECTION  
**Date:** 2026-10-06  
**Owner:** Project Owner  
**Scope:** Future CrossAI product experience, multi-channel gateway, cross-AI orchestration, continuity, route promotion, and user-owned durable storage direction  
**Activation:** Future productization; non-blocking for the current T-020/T-021 critical path

## 1. Product identity

```text
CrossAI Sync = public product
CrossAI      = ordinary user shorthand
AISYNC       = engine / internal architecture
ASC          = internal engineering shorthand
```

The repository and engineering identity remain AISYNC/ASC. Public-facing product surfaces should prefer CrossAI Sync / CrossAI.

## 2. Core user mental model

LOCKED:

> **“Saya punya kerja ada di CrossAI. AI mana saya nak gunakan, saya pilih.”**

LOCKED product principle:

> **CrossAI owns the continuity. The user chooses the intelligence.**

Interpretation:
- CrossAI owns the continuity authority that the user intentionally creates, saves, promotes, or brings into CrossAI;
- CrossAI does not claim ownership over the user's content;
- provider-held account/profile/personal memory is not silently imported;
- the AI/model may change without forcing the user to abandon the working context.

LOCKED product boundary:

> **CrossAI is a continuity and orchestration platform, not another AI provider.**

CrossAI may route work to capable AI providers. It does not need to rebuild every reasoning, vision, image, document, search, or generation capability itself.

## 2A. Core product thesis — thinking over context management

**Status:** LOCKED PRODUCT THESIS

CrossAI exists so the user can spend attention on the quality of thinking rather than on manually managing AI context.

LOCKED thesis:

> **Humans should be immersed in the depth of thinking, not in the mess of global context management across AI chat apps.**

The ordinary user should be able to begin with a natural request such as:

> **“Saya nak fikir marketing Kerani AI. Hasilkan gerak kerja matang dan bijak, bukan ulang kerja.”**

The user may then dump whatever they already have:
- raw ideas;
- prior decisions;
- theories;
- observations;
- constraints;
- partial plans;
- files or references;
- things already tried;
- uncertainties and questions.

CrossAI's job is to turn that material into progressively better understanding without forcing the user to manually manage method files, chat threads, versions, or context transfer.

The intended reasoning flow is **bidirectional**, not a rigid wizard:

```text
ZASSPILL
    ↕
ZASSELECTION
    ↕
ZASSIMPLE
    ↕
FULL ZASS
```

Interpretation:

- **ZASSPILL** captures and preserves useful semantic continuity;
- **ZASSELECTION** helps compare and choose when alternatives emerge;
- **ZASSIMPLE** shapes coherent plans/designs from the current understanding;
- **Full ZASS** is an escalation path when the work requires deeper evidence, architecture, risk, dependency, privacy/security, investment, or execution governance;
- new evidence or understanding may legitimately move work back toward DUMP, DECIDE, or DESIGN rather than forcing a one-way lifecycle.

LOCKED experience principle:

> **The user should not need to ask: “Which file do I open?”, “Which method am I in?”, “Where is the old context?”, or “Which version is latest?”**

Those are system responsibilities.

CrossAI should manage, within explicit authority boundaries:

```text
context
history
latest state
method state
decision lineage
authority
receipts
handoff
retrieval
```

The human should remain responsible for:

```text
intent
ideas
judgement
values
taste
trade-offs
final decisions
```

This leads to a stronger product goal than simple memory preservation:

> **ZASS should not only preserve understanding; through disciplined routing, comparison, design and challenge, it should help the user produce better understanding. CrossAI should make that process feel natural rather than procedural.**

CrossAI therefore must not make ordinary users feel that they are “operating ZASS”. The desirable experience is simply:

```text
think
↕
choose
↕
design
↕
challenge / deepen when needed
↕
act
```

while the underlying ZASS methods, continuity, lineage, receipts, and authority controls remain available beneath the surface.

### Product-strength implication

The primary differentiation is not “many AI providers in one interface”.

The stronger product proposition is:

> **CrossAI is a reasoning workspace that preserves continuity and moves human thinking from ambiguity → understanding → decision → design → execution without forcing the human to manually carry global context between AI systems.**

Provider choice remains valuable, but it serves this larger continuity-and-reasoning thesis.

### Governance guardrail

Automatic routing, escalation, retrieval, and context assembly do **not** give CrossAI authority to invent decisions, silently promote state, or rewrite user-confirmed truth.

The governing pattern remains:

```text
AI interprets
→ CrossAI organizes and routes
→ ZASS structures/challenges
→ human decides
→ ASC records authoritative continuity
```

## 3. Human-facing surfaces vs internal method routing

LOCKED UX principle:

> **Hide method mechanics from ordinary users. Let CrossAI route them internally.**

Ordinary users should not need to choose or understand `DUMP / DECIDE / DESIGN` at the main entry surface.

Public concepts are expressed in human language:

```text
💬 AI CHAT      → talk naturally
💭 Ideas        → saved ideas
⚖ Decisions    → saved selections/decisions
🏗 Projects     → project work and progress
❓ HELP         → ask CrossAI for help
```

Internal semantic routing remains available behind the product surface:

```text
AI CHAT / idea-like intent      → DUMP → ZASSPILL
decision/comparison intent      → DECIDE → ZASSELECTION
project/design/build intent     → DESIGN → ZASSIMPLE
```

CrossAI may infer the internal route from the user's natural request and may ask a plain-language clarification when intent is genuinely ambiguous. The internal method names may appear in diagnostics, developer documentation, advanced review, or other technical surfaces, but are not required ordinary-user navigation labels.

### AI CHAT — human-facing conversational entry

LOCKED UX rule:

- ordinary users see **💬 AI CHAT**, not DUMP, as the conversational entry;
- internally the route may remain canonical `DUMP → ZASSPILL` when that is the correct semantic route;
- documentation/diagnostics may expose the internal route when useful.

AI CHAT is the low-friction place to think, talk, explore, and capture ideas.

Direction:
- no GitHub account prerequisite merely to chat or keep an idea;
- continuity remains ASC-native/private according to the applicable continuity authority;
- selected ideas can be indexed into an Idea Inbox;
- not every chat message becomes a saved idea automatically.

A candidate idea may be surfaced as:

```text
💡 This looks worth keeping.

[ SAVE IDEA ]
[ KEEP CHATTING ]
```

A lightweight saved-idea record may include:

```text
idea_id
title
summary
tags
source_thread
created_at
updated_at
state = DUMP
```

Exact schema remains an implementation detail.

### DECIDE — Decisions / Selection History

LOCKED storage direction:

- Decisions / Selection History are durably stored in the user's Google Drive by default;
- no GitHub account or repository is required merely to use DECIDE;
- many historical selections may coexist inside the user's CrossAI Drive space;
- GitHub may be connected later only when the user explicitly needs Git-oriented capabilities.

The previous candidate of one consolidated GitHub Selection History repository is **SUPERSEDED as the default model**. It may survive only as an optional export/integration pattern for users who deliberately choose GitHub.

### DESIGN — Projects

LOCKED storage direction:

> **One DESIGN project = one durable project space. GitHub is optional.**

Default:

```text
DESIGN project
→ user-owned Google Drive
→ durable project space
```

GitHub appears only when it is useful for:

- version control;
- coding workflow;
- collaboration;
- CI;
- public repositories;
- technical provenance.

Optional Git-enabled mode:

```text
DESIGN project
→ Google Drive project space
→ [ CONNECT GITHUB ]
→ create or link GitHub repository
```

When GitHub is explicitly enabled for a project, GitHub may become canonical for the selected Git-backed artifacts while Google Drive remains the durable home for non-Git files/attachments and other ordinary user-owned content. CrossAI must keep the authority boundary explicit and must not silently maintain two editable semantic masters.

The previous locked direction `one project = one GitHub repository` is **SUPERSEDED** as a universal requirement.

## 4. Explicit promotion

LOCKED:

CrossAI should allow informal work to gain structure only when it deserves structure.

```text
AI CHAT / DUMP
      ↓
saved idea
      ↓
 ┌──────────────┐
 ↓              ↓
DECIDE         DESIGN
 ↓              ↓
selection     project
                ↓
     Google Drive project space
                ↓
       optional GitHub connection
```

Promotion must be explicit.

Example:

```text
Ready to turn this idea into a project?

Carrying:
✓ original idea
✓ useful discussion
✓ relevant decisions
✓ open questions

[ REVIEW ]
[ CREATE PROJECT ]
```

After explicit confirmation, CrossAI creates the durable project space in the user's Google Drive. GitHub is not required.

LOCKED refinement:

> **Every DESIGN project starts with a user-owned Google Drive project space. CrossAI should offer GitHub creation or linking when the project begins or when Git-oriented capabilities become useful. GitHub remains optional.**

Recommended project-start UX:

```text
[ CREATE NEW REPO ]
[ LINK EXISTING REPO ]
[ NOT NOW ]
```

The GitHub offer is therefore proactive at DESIGN/project start, while remaining optional. If the user skips it, CrossAI may offer it again later when version control, coding workflow, collaboration, CI, a public repository, or technical provenance becomes useful.

Lineage should remain traceable from source idea/decision into the resulting project regardless of whether GitHub is enabled.

## 5. CrossAI Channel Gateway

LOCKED:

> **CrossAI channels are interchangeable gateways into the same ASC continuity. No channel owns semantic memory. WhatsApp, Telegram and Web should converge on one normalized channel contract and the same ASC Core.**

```text
WhatsApp ─┐
Telegram ─┼→ Channel Gateway → ASC Core
Web ──────┘
```

Each channel adapter is transport infrastructure only. It handles channel-specific message/event parsing, sender/chat/thread identity, attachments, reply targets, delivery state, retry and capability metadata.

A channel adapter must not create its own semantic memory, project database, selection history, SAVE authority or competing continuity master.

WhatsApp is a first-class future target alongside Telegram and Web. The ordinary-user value is low-friction capture: send/forward text, link, image, file or voice note to CrossAI, discuss with AI, save meaningful state, then inspect the same Ideas / Decisions / Projects through CrossAI Web.

CrossAI Web is the browse/organize/inspect surface over the same ASC continuity; it is not a separate backend.

### Cost and scale guardrail

LOCKED:

> **CrossAI must not promise “free unlimited.”**

Messaging channels, AI providers and runtime infrastructure can have quotas, rate limits or monetary cost as usage grows. CrossAI continuity must survive changes in commercial mode, including future free-first quotas, BYOK/user-authorized provider credentials, user-paid provider usage, CrossAI paid plans, paid messaging capacity, or alternative/self-hosted runtime.

Channel cost, AI inference cost and durable-storage cost are separate concerns.

When a channel/runtime is busy or rate-limited, CrossAI must degrade truthfully with explicit pending/failed state and safe retry rather than silently losing work or issuing false SAVE receipts. Exact queue/backpressure mechanics remain future DESIGN work.

See [`CROSSAI_CHANNEL_GATEWAY.md`](CROSSAI_CHANNEL_GATEWAY.md).

## 6. CrossAI Companion = optional conversational add-on

LOCKED:

> **CrossAI Core is not the chatbot. CrossAI Companion is an optional conversational add-on that is CrossAI-compatible.**

Ordinary users may choose Companion for general AI conversation and low-friction idea discovery/capture. Users who already have another assistant, such as Temaya, do not need Companion.

General conversational channel adapters belong to the Companion side:

```text
WhatsApp ─┐
Telegram ─┼→ CrossAI Companion → CrossAI Compatible → CrossAI Core
Web Chat ─┘
```

One shared Telegram bot/service may serve many users. One shared WhatsApp Companion endpoint/account may also serve many users subject to the final WhatsApp account/provider architecture. Personal experience comes from identity binding and private scope, not one executable bot per user.

CrossAI Compatible is the stable integration boundary for Companion, Temaya, Kerani AI and future third-party assistants.

CrossAI Core may still use its own narrow **CrossAI Intelligence** model/API for idea screening, classification, relation/deduplication, summarization, retrieval assistance and semantic promotion suggestions. That intelligence is not the general conversational AI.

LOCKED governance:

> **AI interprets. ASC governs. User decides.**

See [`CROSSAI_COMPANION_ARCHITECTURE.md`](CROSSAI_COMPANION_ARCHITECTURE.md).

## 7. CrossAI Guide / Help

LOCKED direction:

Messaging-channel adapters may expose CrossAI/ZASS support-guide behavior over the same ASC knowledge and continuity.

Example questions:
- how to SAVE;
- difference between AI CHAT / DECIDE / DESIGN;
- why a project did not sync;
- how ZASSELECTION works;
- current factual project/idea/decision status.

Preferred retrieval order:

```text
CrossAI / AISYNC knowledge
        ↓
ZASS knowledge
        ↓
authorized user/project factual state
        ↓
external knowledge when actually required
```

System-status answers must come from factual retrieval/state, not LLM memory or guesses.

## 8. Cross-AI handoff

LOCKED:

Users may request that the current information/context be carried to another AI, including providers/apps without native integration.

CrossAI prepares a scoped handoff.

Locked review pattern:

```text
Move to another AI

Carrying:
✓ Idea: Telegram CrossAI Bot
✓ Current discussion
✓ 2 relevant decisions
✓ Open question

Not carrying:
– unrelated chats
– account/profile memory
– other projects

[ CONTINUE ]
[ REVIEW ]
```

Rules:
- carry only relevant, intentional scope;
- provider-held account/profile/personal memory is excluded unless the user intentionally introduces it;
- unrelated chats/projects are excluded by default;
- REVIEW is available before transfer.

Capability-aware delivery:

```text
native/deep-link supported
→ OPEN / GO to selected AI

not reliably supported
→ SHOW HANDOFF TEXT
→ COPY
→ paste into any AI app
```

Copy/paste is the universal fallback and remains a first-class supported path.

## 9. Return journey

LOCKED direction:

Handoff should support a return/reconciliation journey.

```text
CrossAI / messaging channel
      ↓
External AI
      ↓
answer/result
      ↓
CrossAI Return
      ↓
validate / reconcile
      ↓
same idea / decision / project
```

When direct provider return integration is unavailable, manual paste/import is an acceptable universal fallback.

A returned result must be reconciled against the correct source thread/handoff before it can advance saved continuity or canonical project state.

## 10. Telegram Group = scoped context space

LOCKED direction:

A Telegram Group containing the CrossAI bot may become a dedicated context space for one topic/project.

Example:

```text
Telegram Group: CrossAI — Projek Kebun
        ↓
CrossAI scoped space
        ↓
continuity scoped to that group/topic
```

### Response behavior

LOCKED:

- if the group contains only the **creator + CrossAI bot**, the bot responds to the creator's ordinary messages like a personal bot chat;
- if **one or more additional human members** join the group, the bot becomes quiet by default;
- in a multi-human group, the bot responds only when explicitly tagged/mentioned (for example `@bot`) or through an equivalent explicit invocation.

This prevents CrossAI from intruding into ordinary human conversation.

### Memory/continuity guardrail

The bot must not treat every group message as canonical memory merely because it can read it.

Persistence/promotion should require an appropriate explicit signal such as:
- direct bot interaction;
- SAVE / SAVE IDEA;
- confirmed decision;
- project update;
- another explicit action defined by the product.

Group context is shared context. It must not be misclassified as one participant's private personal memory.

### Private threaded topics for a single user

LOCKED future direction:

For a single user, **Telegram private threaded topics are preferred over creating a creator+bot group merely to separate personal contexts**, where Telegram capabilities and final implementation permit it.

Example:

```text
CrossAI Bot — private chat

Topics:
💬 General
☕ Coffee Business
🌱 Projek Kebun
🏠 Rumah
🤖 Temaya
```

Each private topic may map to a distinct CrossAI context space while continuing to use the same ASC authority and continuity rules.

The existing Telegram Group direction remains LOCKED for shared/group use.

Technical nuance remains open: if a creator+bot-only group should allow ordinary-message responses, but a later multi-human group should require explicit `@bot` invocation, that behavior must be implemented deliberately in the ASC/bot layer. Do not assume Telegram Privacy Mode alone will safely or dynamically enforce the desired participant-count behavior.

### Topic-change assistant signal

LOCKED UX direction:

CrossAI may detect a likely topic shift and **suggest** a new idea/context boundary, but the model does not receive authority to split semantic continuity silently.

Example:

> “Nampaknya perbualan ini sudah beralih daripada Coffee Pilot kepada Packaging. Mahu simpan sebagai idea berasingan?”

```text
[ YES ] [ KEEP TOGETHER ]
```

The pattern is:

```text
AI detects
→ AI suggests
→ human decides
→ ASC records
```

Topic detection is therefore an assistant signal, not a semantic-authority transition.


## 11. Files, images, PDFs, and generated artifacts

LOCKED product boundary:

CrossAI may orchestrate multimodal/file tasks without becoming the provider that implements every capability.

Examples:

```text
user file/image/request
        ↓
CrossAI scopes context + chooses/uses capable provider
        ↓
provider performs reasoning/extraction/edit/generation
        ↓
result returns to CrossAI continuity
```

CrossAI should not become a permanent general-purpose file warehouse merely because AI providers can produce or consume files.

## 12. Durable file storage direction

LOCKED principle:

> **Generate anywhere. Save durably only where the user owns the storage.**

LOCKED default durable-storage direction is the user's Google Drive.

```text
file bytes
   ↓
user-owned Google Drive

ASC
   ↓
file reference
metadata
hash/provenance
lineage / relationship
```

CrossAI/ASC should prefer retaining references/metadata rather than duplicating permanent file bytes in its own storage.

Locked onboarding direction:

> **Login Google → allow Google Drive Access → terus guna CrossAI. GitHub hanya muncul bila memang berguna.**

The exact per-user Google Drive authorization/scopes, folder model, retention, migration, and quota UX remain future design work. This section does not claim the current Production v1 runtime already has per-user Drive write authority.

## 13. Storage failure truthfulness

LOCKED:

If durable user-owned storage fails, CrossAI must not claim the file is saved.

Example:

```text
⚠ File generated successfully
✗ Not saved to Google Drive

Reason:
Google Drive storage quota is full.

[ RETRY SAVE ]
[ DOWNLOAD ]
[ SAVE SUMMARY ONLY ]
```

CrossAI must not silently turn itself into permanent fallback storage simply because the user's Drive is unavailable/full.

## 14. Factual retrieval across CrossAI

LOCKED direction:

WhatsApp/Telegram/Web users may ask natural-language questions about:
- Ideas;
- Decisions;
- Projects;
- current stage/progress;
- saved results;
- relevant continuity.

Answer path:

```text
user question
   ↓
ASC factual retrieval
   ↓
authorized canonical/private state
   ↓
AI explains naturally
```

The LLM is the explanation/reasoning layer, not the source of project status truth.

## 15. Product architecture summary

```text
                         USER
                          │
             ┌────────────┼────────────┐
             ↓            ↓            ↓
         WhatsApp      Telegram       Web
             └────────────┼────────────┘
                          ↓
                CrossAI Channel Gateway
                          ↓
                    AI CHAT / HELP
                          ↓
                         ASC
              identity / continuity
              retrieval / lineage
              routing / orchestration
                          │
               internal semantic router
           ┌──────────────┼───────────────┐
           ↓              ↓               ↓
         DUMP           DECIDE          DESIGN
       ZASSPILL      ZASSELECTION      ZASSIMPLE
           │              │               │
           ↓              ↓               ↓
         Ideas         Decisions        Projects
           └──────────────┼───────────────┘
                          ↓
                       AI Router
                          ↓
              user-selected intelligence
                          ↓
                        RETURN
                          ↓
                 same CrossAI context
```

File persistence is deliberately orthogonal:

```text
uploaded/generated file
        ↓
user-owned storage (Google Drive direction)
        ↓
ASC reference + provenance + lineage
```

## 15A. Pluggable Retrieval Architecture — locked future direction

**Status:** LOCKED FUTURE ARCHITECTURE DIRECTION — NON-BLOCKING FOR T-020/T-021

CrossAI retrieval is no longer framed as a single topic/vector index candidate. The future direction is a layered, pluggable retrieval architecture:

~~~text
L0 ZASSPILL v1.0 semantic contract
        ↓
L1 ASC Canonical Memory
        ↓
L2 pluggable Retrieval Substrate
   Native ASC / Cognee / Graphiti-Zep / Mem0
        ↓
L3 ASC Retrieval Intelligence
        ↓
L4 minimum-context assembly
        ↓
target AI
~~~

LOCKED guardrails:

- ZASSPILL v1.0 remains the semantic contract and is not changed by backend selection.
- ASC Canonical Memory remains authoritative for thread identity, revision/event lineage, tombstones, authorization, and current-state verification.
- Retrieval substrates are derived, replaceable, rebuildable, and non-authoritative.
- Native ASC is the control baseline.
- Evaluation order is Native ASC → Cognee → Graphiti/Zep → Mem0; this is not a production dependency lock.
- PostgreSQL + pgvector, Qdrant, or equivalent remain valid lower-level storage/index options.
- Exact-ID, authorization filtering, ambiguity handling, canonical verification, and final retrieval semantics remain ASC responsibilities.
- A retrieval result, graph edge, similarity score, or provider memory never becomes user-confirmed semantic truth.

Provider selection requires one common bake-off over the same sanitized/synthetic corpus and query set, covering current facts, superseded traps, temporal queries, relationships, ambiguity, privacy scope, forget/delete, context efficiency, latency, explainability, operational burden, and rebuildability.

Context assembly is separate from retrieval: retrieve enough to locate evidence, then send only the minimum authorized relevant context after canonical verification.

Derived index lifecycle is deliberately weaker than canonical memory durability. Vector, graph, full-text, embedding, topic-summary, or provider-specific indexes may be discarded and rebuilt. Canonical DELETE / FORGET_CONTEXT / tombstone authority must suppress stale provider results immediately even if provider cleanup is delayed.

Canonical specification: [CROSSAI_RETRIEVAL_ARCHITECTURE.md](CROSSAI_RETRIEVAL_ARCHITECTURE.md).

## 15B. AMP compatibility — candidate, not authority

**Status:** COMPATIBILITY CANDIDATE

CrossAI may later support an external conversation/memory interchange format such as an AMP-compatible export/import adapter where that format is useful and sufficiently mature.

This does **not** replace ZASSPILL, ASC continuity contracts, or CrossAI authority semantics.

Preferred relationship:

```text
ZASSPILL / ASC canonical continuity
              ↓
       compatibility adapter
        ├─ Markdown
        ├─ neutral JSON
        └─ AMP-compatible format (when useful)
```

CrossAI should treat AMP-like formats as interoperability surfaces, not as the architecture authority for internal continuity, decisions, lineage, SAVE truth, or privacy policy.

## 16. Explicitly still open

This lock does not prematurely decide:
- optional GitHub connection UX and authorization details;
- optional GitHub repository ownership/privacy/layout defaults when enabled;
- exact Idea Inbox record schema;
- exact Telegram identity/group-binding implementation;
- exact AI provider/model roster;
- provider pricing/free-tier guarantees;
- exact per-user Google Drive OAuth/scopes/folder structure;
- Drive retention/deletion/migration policy;
- exact multimodal provider adapters.

These are future DESIGN decisions.

## 17. Critical-path boundary

This future product direction must not interrupt or falsify the current Production v1 delivery state.

Current T-020/T-021 work remains governed by its existing acceptance contracts. Future WhatsApp/Telegram channel adapters, multi-AI routing, route-specific storage expansion, and per-user Drive storage are separate productization work unless explicitly promoted later.


## 18. Multi-user ownership model

LOCKED future architecture direction:

- CrossAI remains a centrally maintained application/runtime;
- ordinary users do **not** receive a cloned Apps Script project or per-user `.gs` deployment;
- current owner-executed Apps Script + owner-private Drive continuity is a bounded closed-beta implementation, not the permanent multi-tenant model;
- CrossAI may retain central service state needed for identity, authorization, routing, indexes, references, temporary handoff state, receipts, and operations;
- Google Drive is the default durable store for ordinary CrossAI user content;
- GitHub is optional and appears only when useful for version control, coding workflow, collaboration, CI, public repositories, or technical provenance;
- delegated authorization/OAuth is preferred over per-user script cloning;
- failure/quota/revocation must remain truthful, with no silent fallback to permanent operator-owned storage.

See [`CROSSAI_MULTI_USER_OWNERSHIP.md`](CROSSAI_MULTI_USER_OWNERSHIP.md) for the canonical direction and open implementation questions.


## 19. Generic channel gateway

LOCKED future architecture direction:

- WhatsApp, Telegram and Web are channel adapters over the same ASC continuity;
- channel-specific payloads should normalize into one CrossAI channel contract before semantic processing;
- no channel owns semantic memory or durable SAVE truth;
- WhatsApp is a first-class future target for capture/forward/discuss/save workflows;
- CrossAI Web reflects the same Ideas / Decisions / Projects and serves as the richer browse/organize/inspect surface;
- “free unlimited” is not a product promise;
- quotas, rate limits and monetary cost for messaging, AI inference and runtime are runtime/product concerns;
- busy/rate-limited states must be truthful and retry-safe;
- continuity architecture must remain stable across free-first, BYOK, user-paid, CrossAI-paid, or alternative runtime models.

See [`CROSSAI_CHANNEL_GATEWAY.md`](CROSSAI_CHANNEL_GATEWAY.md).


## 20. Runtime and AI inference cost model — saved idea

SAVED/AGREED direction:

- AI answering happens at the AI Router / inference layer after ASC;
- channel cost, runtime cost, AI inference cost and durable-storage cost remain separable;
- free service may use an economical/free-tier AI with quota rather than promise unlimited inference;
- stronger AI may come from BYOK/user-authorized provider, CrossAI premium inference, or external handoff/return;
- deterministic actions should avoid unnecessary AI calls;
- image/PDF storage and image/PDF AI analysis are separate operations and cost domains;
- Apps Script is acceptable for beta/small deployment but runtime may later migrate to a scalable service without changing ASC continuity;
- throughput/backpressure must be truthful, retry-safe and idempotent.

See [`CROSSAI_RUNTIME_INFERENCE_COST_MODEL.md`](CROSSAI_RUNTIME_INFERENCE_COST_MODEL.md).


## 20A. Companion account binding — locked

LOCKED direction:

> **CrossAI Web is the account-binding authority for Companion channels. A channel identity is linked to a CrossAI user only after an explicit user-driven binding step.**

Telegram baseline:

```text
CrossAI Web
→ show @CrossAI_Companion_bot + short-lived binding code
→ user opens bot
→ /start
→ bot asks for code
→ user enters code
→ backend verifies and links telegram_user_id ↔ crossai_user_id
→ bot confirms registration
```

WhatsApp should reach the same binding result through the best supported mechanism available at implementation time, potentially QR/deep-link or another explicit verification flow.

The binding credential must not become the user's permanent identity/password. Final expiry, single-use/replay protection, revocation and re-binding rules remain implementation work.

## 21. Companion / Core separation — locked

CrossAI Companion is an optional conversational product, not the CrossAI Core semantic engine.

- Companion owns general conversational AI and general chat channel adapters;
- CrossAI Compatible is the integration boundary into Core;
- one shared channel bot/service may serve many privately scoped users;
- CrossAI Core may use narrow AI intelligence for screening/governance;
- Core AI is not the general-purpose chatbot;
- Companion failure/quota exhaustion must not remove access to CrossAI continuity;
- Temaya, Kerani AI and future assistants may integrate without using Companion.

See [`CROSSAI_COMPANION_ARCHITECTURE.md`](CROSSAI_COMPANION_ARCHITECTURE.md).
