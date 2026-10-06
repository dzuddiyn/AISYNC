# CrossAI Channel Gateway

**Status:** LOCKED FUTURE ARCHITECTURE DIRECTION  
**Date:** 2026-10-06  
**Owner:** Project Owner  
**Scope:** Channel abstraction, WhatsApp/Telegram/Web convergence, normalized ingress, continuity authority, and channel/runtime cost guardrails  
**Critical-path effect:** Non-blocking for current T-020/T-021 unless explicitly promoted later

## 1. Core decision

LOCKED:

> **CrossAI channels are interchangeable gateways into the same ASC continuity. No channel owns semantic memory. WhatsApp, Telegram and Web should converge on one normalized channel contract and the same ASC Core.**

CrossAI must not build a separate semantic backend for each messaging platform.

Preferred architecture:

```text
WhatsApp ─┐
Telegram ─┼→ CrossAI Channel Gateway → ASC Core
Web ──────┘
```

Future channels may join the same boundary without changing continuity semantics.

## 2. Channel adapter boundary

Each channel adapter is commodity transport infrastructure.

It may handle:

- incoming message/event parsing;
- sender identity binding;
- channel/chat/thread identifiers;
- text and attachments;
- reply targets;
- delivery receipts;
- channel-specific rate limits and retry metadata;
- channel-specific capabilities.

It must not independently own:

- semantic memory;
- DUMP / DECIDE / DESIGN authority;
- Ideas / Decisions / Projects authority;
- durable SAVE truth;
- project lineage;
- a competing vector/memory database;
- a competing user profile/memory authority.

## 3. Normalized inbound contract

LOCKED direction:

Channel-specific payloads should be normalized before entering ASC.

Illustrative shape:

```text
channel
channel_user_id
channel_space_id
channel_message_id
crossai_user_id
text
attachments
reply_context
occurred_at
delivery_metadata
```

The exact schema remains implementation work.

The normalized event is transport context, not automatically a durable semantic record.

## 4. Continuity authority

LOCKED:

> **Channel history is not CrossAI semantic authority.**

WhatsApp history, Telegram history and Web UI state may provide transport/retrieval context, but ASC continuity owns the semantic working state intentionally created, saved or promoted through CrossAI.

The same user should be able to move between channels while continuing the same authorized CrossAI state.

Example:

```text
WhatsApp → capture/discuss
Web      → inspect/organize
Telegram → continue/ask
WhatsApp → SAVE
```

All remain one CrossAI continuity system.

## 5. WhatsApp as first-class target

LOCKED future product direction:

WhatsApp remains a first-class future channel target. For general AI chat, WhatsApp/Telegram/Web Chat should normally terminate at CrossAI Companion, which then uses the CrossAI Compatible boundary to reach Core.

Primary ordinary-user value:

- quickly capture an idea without opening a separate AI workspace;
- forward a message, link, image, file or voice note to CrossAI;
- discuss it with the selected AI;
- save meaningful state into CrossAI;
- later inspect Ideas / Decisions / Projects in CrossAI Web.

Candidate forward-to-CrossAI UX:

```text
forward message/file/link/voice note
        ↓
CrossAI
        ↓
“This looks related to Project X.”

[ ADD TO PROJECT ]
[ SAVE AS IDEA ]
[ JUST ASK ]
```

Exact WhatsApp Business/API provider, account model, message-template rules and attachment implementation remain future DESIGN work.

## 6. Web role

CrossAI Web is not a separate semantic system.

Preferred role:

```text
Messaging channels
= capture + discuss quickly

CrossAI Web
= browse + organize + inspect + manage
```

Ideas, Decisions, Projects, Files and History should reflect the same ASC continuity regardless of where the conversation started.

## 7. Cost and scale guardrail

LOCKED:

> **CrossAI must not promise “free unlimited.”**

Messaging channels, AI providers and server/runtime infrastructure may all have quotas, rate limits or monetary cost as usage grows.

Therefore channel and provider cost are runtime/product concerns, not semantic-architecture assumptions.

The architecture must preserve continuity across different commercial modes, including possible future combinations of:

- free-first / beta quotas;
- provider free tiers where actually available;
- BYOK or user-authorized provider credentials;
- user-paid provider usage;
- CrossAI paid plans;
- paid messaging-channel capacity;
- self-hosted or alternative runtime deployment.

Changing how a message or AI call is paid for must not require changing the user's continuity model.

## 8. Busy / backpressure behavior

LOCKED direction:

When a channel/runtime becomes rate-limited, overloaded or temporarily unavailable, CrossAI must degrade truthfully rather than silently lose work.

Preferred behavior:

```text
incoming message
      ↓
accepted / queued / rejected truthfully
      ↓
visible status
      ↓
retry or resume
```

The final queue/backpressure implementation is open, but the system should preserve:

- message/request identity;
- deduplication/idempotency where required;
- clear pending/failed state;
- safe retry;
- no false SAVE receipt;
- no duplicate semantic promotion caused by transport retry.

## 9. AI cost separated from channel cost

LOCKED principle:

```text
channel cost
≠ AI inference cost
≠ durable storage cost
```

CrossAI should keep these concerns separable.

A WhatsApp message may be inexpensive or costly independently of the chosen AI model. A free channel does not imply free AI inference. A paid AI subscription/API does not imply paid CrossAI continuity.

The AI Router should therefore remain provider/cost-model agnostic.

## 10. Telegram-specific behavior remains valid

Existing Telegram-specific locks remain channel-level behavior under this generic gateway, including:

- private threaded context spaces where supported;
- creator+bot-only group ordinary-message behavior;
- multi-human group explicit @bot invocation;
- Telegram-specific topic UX.

Those do not make Telegram a separate backend.

## 11. Current implementation boundary

Current Production v1 closed beta is still Apps Script-based and does not yet implement this full multi-channel gateway.

This lock defines future architecture only.

No claim is made here that:

- WhatsApp integration is already deployed;
- cross-channel identity binding is already solved;
- per-user Google Drive OAuth is already live;
- high-volume queueing is already implemented;
- any provider/channel is permanently free.

## 12. Still open

Future DESIGN work must decide:

- normalized channel event schema;
- WhatsApp Business/API provider and account model;
- Telegram webhook/runtime details;
- cross-channel identity binding;
- message queue/backpressure implementation;
- attachment normalization;
- channel delivery receipts;
- pricing/quotas/product plan;
- abuse/spam controls;
- observability;
- privacy/retention rules for transient channel payloads;
- cross-channel thread mapping.



## 13. Companion boundary refinement

LOCKED refinement:

General conversational messaging traffic should not make CrossAI Core itself the chatbot.

```text
WhatsApp / Telegram / Web Chat
              ↓
       CrossAI Companion
              ↓
       CrossAI Compatible
              ↓
         CrossAI Core
```

CrossAI Companion may be a separate runtime/deployment and may serve many users through one channel bot/account endpoint with strict per-user identity/context isolation.

Non-conversational or specialist clients such as Temaya or Kerani AI may integrate directly through CrossAI Compatible without using Companion.

See `CROSSAI_COMPANION_ARCHITECTURE.md`.
