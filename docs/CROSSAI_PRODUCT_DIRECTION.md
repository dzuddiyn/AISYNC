# CrossAI Sync — Future Product Direction

**Status:** LOCKED PRODUCT DIRECTION  
**Date:** 2026-10-06  
**Owner:** Project Owner  
**Scope:** Future CrossAI product experience, Telegram client, cross-AI orchestration, continuity, route promotion, and user-owned file storage direction  
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

After explicit confirmation, CrossAI creates the durable project space in the user's Google Drive. GitHub is not required. If the user later needs version control, coding workflow, collaboration, CI, a public repository, or technical provenance, CrossAI may offer an explicit `CONNECT GITHUB` step.

Lineage should remain traceable from source idea/decision into the resulting project regardless of whether GitHub is enabled.

## 5. CrossAI Telegram = alternate client, not another backend

LOCKED direction:

```text
CrossAI Web ─────┐
                 │
                 ▼
              ASC Core
                 ▲
                 │
CrossAI Telegram ┘
```

Telegram and Web must use the same authority, continuity, retrieval, routing, and persistence boundaries.

Telegram must not create a parallel semantic database or a second continuity master.

### /start

LOCKED user-facing menu direction:

```text
Welcome to CrossAI

[ 💬 AI CHAT ]
just talk, I am here to hear.

[ ❓ HELP ]
just ask.
```

The Telegram start surface deliberately hides `DUMP / DECIDE / DESIGN`.

`💬 AI CHAT` starts a natural conversation. ASC determines the appropriate internal semantic route from the conversation when needed.

`❓ HELP` is the direct support/guide entry. The user can simply ask a question without learning CrossAI/AISYNC/ZASS internals first.

### Browse view

LOCKED direction:

```text
💭 Ideas       18
⚖ Decisions     6
🏗 Projects      4
❓ Help
```

There is no separate `💬 New Chat` browse item. New conversation behavior belongs naturally inside AI CHAT.

## 6. Telegram as real AI chat

LOCKED direction:

Telegram may act as a full conversational CrossAI client backed by selectable AI APIs/models.

```text
Telegram
   ↓
ASC continuity + retrieval
   ↓
AI Router
   ├─ provider/model A
   ├─ provider/model B
   ├─ provider/model C
   └─ future/BYOK providers
```

Users may change the selected intelligence while preserving the same CrossAI continuity.

Example user intents:
- “Tukar AI.”
- “Saya nak reasoning lain.”
- “Ask another AI.”

CrossAI supplies the relevant factual/scoped context to the selected AI rather than relying on the new provider's ambient memory.

Provider availability, free tiers, quotas, pricing, and supported modalities are runtime/provider concerns and must not be hard-coded as permanent product promises.

## 7. CrossAI Guide / Help

LOCKED direction:

The Telegram bot may act as a CrossAI/ZASS support guide.

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
CrossAI / Telegram
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

Telegram/Web users may ask natural-language questions about:
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
              ┌──────────┴──────────┐
              ↓                     ↓
        CrossAI Web           CrossAI Telegram
              │                     │
              └──────────┬──────────┘
                         ↓
                simple public surface
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
          │              │               │
          └──────────────┼───────────────┘
                         ↓
                      AI Router
                         │
             user-selected intelligence
                         │
                         ↓
                       RETURN
                         │
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

## 15A. Topic / Temporal Retrieval Index — architecture candidate

**Status:** ARCHITECTURE CANDIDATE — NOT SEMANTIC AUTHORITY

CrossAI may later use a derived retrieval layer combining:

- LLM-assisted topic-change detection;
- temporal indexing / timeline markers;
- keyword/full-text search;
- vector embeddings / similarity search;
- topic summaries or retrieval hints.

Candidate technologies may include PostgreSQL + `pgvector`, Qdrant, or an equivalent vector/search store.

Hard guardrail:

> **Topic / Temporal Retrieval Index is derived retrieval infrastructure, never semantic authority.**

The retrieval index may help locate relevant continuity, ideas, decisions, or project records. It must not silently overwrite, replace, or become the authoritative source for:

- ASC private continuity;
- Google Drive-backed durable Ideas, Decisions, Projects, files, and exports by default;
- GitHub-backed artifacts only where the user explicitly enables GitHub;
- confirmed decisions;
- factual SAVE/receipt state.

If the derived index is stale, unavailable, rebuilt, or changed, canonical/private authority must remain intact.

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

Current T-020/T-021 work remains governed by its existing acceptance contracts. Future Telegram, multi-AI routing, route-specific storage expansion, and per-user Drive storage are separate productization work unless explicitly promoted later.


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
