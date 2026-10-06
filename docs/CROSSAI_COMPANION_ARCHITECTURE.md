# CrossAI Companion + CrossAI Compatible Architecture

**Status:** LOCKED FUTURE ARCHITECTURE DIRECTION  
**Date:** 2026-10-07  
**Owner:** Project Owner  
**Scope:** Optional conversational companion, multi-user channel serving, CrossAI Compatible boundary, and narrow CrossAI Core intelligence  
**Critical-path effect:** Non-blocking for current T-020/T-021 unless explicitly promoted later

## 1. Core decision

LOCKED:

> **CrossAI Core is not the chatbot. CrossAI Companion is an optional conversational add-on that is CrossAI-compatible.**

CrossAI Core remains focused on idea continuity, Decisions, Projects, lineage, SAVE truth, handoff/return, and project tracking.

CrossAI Companion provides general conversational AI for ordinary users who do not already have another personal assistant such as Temaya.

## 2. Product relationship

```text
                       USER
                        │
          ┌─────────────┴─────────────┐
          ↓                           ↓
       TEMAYA                 CROSSAI COMPANION
 personal/family AI              generic AI chat
          │                           │
          └─────────────┬─────────────┘
                        ↓
              CrossAI Compatible
                        ↓
                   CROSSAI CORE
           Ideas / Decisions / Projects
            SAVE / lineage / handoff
```

Temaya and CrossAI Companion sit at the same integration level.

Temaya is not a feature of CrossAI Companion.
CrossAI Companion is not a public version of Temaya.

## 3. Separate runtime / deployment

LOCKED direction:

CrossAI Companion should run as a separate application/runtime/deployment from CrossAI Core.

For the small/beta phase, Apps Script may be used as a separate deployment.

Reasons:

- high-volume conversation traffic must not consume the same runtime path as Core continuity;
- model/provider failures must not bring down Core SAVE/continuity;
- Companion can evolve commercially without changing Core;
- channel-specific webhook load can scale independently;
- Companion can later move to another runtime without changing the CrossAI Compatible contract.

Illustrative:

```text
CrossAI Core
→ deployment/runtime A

CrossAI Companion
→ deployment/runtime B
```

The exact hosting platform remains future implementation work.

## 4. One channel endpoint can serve many users

LOCKED:

> **A personal experience does not require one physical bot per user.**

For Telegram, one CrossAI Companion bot may serve many users.

For WhatsApp, one CrossAI Companion business/account endpoint may serve many users, subject to the final WhatsApp product/account architecture and platform rules.

```text
              ONE COMPANION SERVICE
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
       User A        User B        User C
```

Personal separation comes from identity and scope, not from separate executable bots.

Required logical isolation:

```text
channel_user_id
      ↓
crossai_user_id
      ↓
private conversation scope
      ↓
authorized CrossAI Ideas/Projects
```

No user may inherit another user's conversation or CrossAI context.

## 5. Channel adapters belong to Companion for general chat

LOCKED direction:

General conversational channel adapters are part of the Companion side, not the CrossAI Core semantic engine.

```text
WhatsApp ─┐
Telegram ─┼→ CrossAI Companion → CrossAI Compatible → CrossAI Core
Web Chat ─┘
```

This does not prohibit non-Companion clients from integrating directly with the CrossAI Compatible boundary for capture, SAVE, handoff, or other permitted capabilities.

Examples:

```text
Temaya ────────────────→ CrossAI Compatible → Core
Kerani AI ─────────────→ CrossAI Compatible → Core
third-party assistant ─→ CrossAI Compatible → Core
```

## 6. CrossAI Compatible boundary

LOCKED:

> **CrossAI Compatible is the stable integration boundary between assistants/apps and CrossAI Core.**

Candidate capability family:

- identify/bind authorized user;
- submit idea candidate;
- SAVE confirmed idea;
- submit decision candidate;
- link to existing project;
- read explicitly scoped project/idea context;
- prepare handoff;
- return result;
- receive factual SAVE/receipt status.

Exact endpoint names/schema/auth remain implementation work.

An integration does not need to implement every capability to be CrossAI-compatible.

## 7. Two different uses of AI

LOCKED distinction:

### A. Companion AI

Purpose:
- talk to the human;
- brainstorm;
- answer general questions;
- support multimodal conversation where the chosen provider permits;
- surface possible idea signals.

This is high-volume conversational inference.

### B. CrossAI Intelligence

Purpose:
- detect whether content is an idea/decision/project candidate;
- classify and summarize;
- identify likely related project/context;
- suggest duplicates/relationships;
- determine minimum relevant context for handoff;
- suggest semantic promotion;
- assist retrieval/screening.

This is low-volume semantic/governance inference.

```text
                    AI USE
             ┌────────┴────────┐
             ↓                 ↓
       Companion AI      CrossAI Intelligence
        conversation      semantic screening
        brainstorming     relate / classify
        general answer    dedupe / summarize
                          propose promotion
```

## 8. CrossAI Core may use AI API

LOCKED:

> **CrossAI Core may use an AI API/model for narrow semantic intelligence, but not as its general-purpose chatbot.**

CrossAI Intelligence may use a small/economical model for routine screening and selectively use a stronger model when justified.

Model/provider selection is a runtime concern and is not the semantic authority.

AI output is advisory/propositional unless an explicitly authorized rule says otherwise.

## 9. Governance rule

LOCKED:

> **AI interprets. ASC governs. User decides.**

Default semantic promotion flow:

```text
AI detects/suggests
        ↓
ASC validates current state
        ↓
user confirms / authorized deterministic rule
        ↓
SAVE
        ↓
receipt
```

The AI must not silently create canonical Ideas, Decisions or Projects merely because it inferred them.

## 10. Idea detection in Companion

Companion may observe a conversational signal such as:

```text
User:
"If this workflow was offline-first, technicians could still work during an outage."
```

Companion may surface:

```text
💡 Possible idea:
Offline-first technician workflow

[ SAVE IDEA ]
[ ADD TO PROJECT ]
[ KEEP CHATTING ]
```

On confirmation, Companion sends the candidate/confirmed action through CrossAI Compatible.

The full ZASS method does not need to execute on every ordinary chat turn.

## 11. Ordinary-user onboarding

LOCKED product direction:

A new CrossAI user may use CrossAI Core without Companion.

After CrossAI onboarding, the product may offer an optional companion:

```text
Welcome to CrossAI

Your ideas have a home.

[ OPEN IDEAS ]
[ ADD AI COMPANION ]
```

If chosen:

```text
Choose chat channel

[ WEB CHAT ]
[ TELEGRAM ]
[ WHATSAPP ]
```

Then the user is bound to the shared Companion service with private per-user scope.

Exact provider/model and commercial choices remain open.

## 12. User with another assistant

CrossAI Companion is optional.

A user who already has a personal assistant can connect that assistant through CrossAI Compatible.

Example:

```text
Temaya
  ↓
CrossAI Compatible
  ↓
CrossAI Core
```

The same principle applies to future assistants or third-party products.

## 13. Cost isolation

LOCKED direction:

Conversation cost belongs to Companion/provider usage.
Semantic screening cost belongs to CrossAI Intelligence.
Continuity/SAVE cost belongs to CrossAI Core/runtime/storage.

These concerns must remain separable.

```text
Companion unavailable/quota exhausted
        ≠
CrossAI Core unavailable
```

A user must still be able to access Ideas/Decisions/Projects and continuity even if Companion AI is unavailable.

## 14. Architecture invariant

```text
Companion changes
≠ Core continuity changes

channel changes
≠ semantic authority changes

AI provider changes
≠ idea ownership changes

bot scaling changes
≠ user identity changes
```

## 15. Still open

Future DESIGN work must decide:

- exact CrossAI Compatible contract;
- authentication/authorization;
- cross-channel identity binding;
- Telegram bot implementation;
- WhatsApp account/provider model;
- web-chat implementation;
- Companion provider/model roster;
- free/premium/BYOK policy;
- CrossAI Intelligence model/provider;
- screening thresholds;
- duplicate/relationship detection policy;
- privacy rules for content sent to CrossAI Intelligence;
- runtime scaling/migration;
- queueing/backpressure;
- abuse controls;
- observability and billing telemetry.
