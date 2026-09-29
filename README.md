# AISYNC

> Portable AI conversation continuity for personal context — without assuming every AI can directly access the same backend.

**Status:** Discovery  
**Architecture:** Not confirmed  
**Method:** ZASSIMPLE v0.1.6  
**Working name:** AISYNC

AISYNC explores a simple problem: important conversations about life, work, family, planning, research, decisions, and other long-term context often become trapped inside individual AI platforms.

The goal is to make useful context portable so that a person can move between AI systems without repeatedly explaining everything from the beginning.

---

## The problem

Different AI applications may be useful for different reasons, but they do not necessarily share memory, integrations, APIs, export formats, or storage access.

AISYNC is exploring a provider-agnostic way to support a flow such as:

```text
AI conversation
      ↓
identify useful context
      ↓
prepare a portable sync record
      ↓
owner review / confirmation
      ↓
authoritative personal information environment
      ↓
retrieve only relevant context
      ↓
another AI continues from there
```

The system must not depend on the assumption that every AI can directly read from or write to GitHub.

A copy/paste fallback should remain possible.

---

## Relationship with Dzuddiyn Library

The current **LOCKED** working boundary is:

```text
Dzuddiyn Library
= stores / captures life information

AISYNC
= transports / synchronizes relevant AI context
  between AI platforms and that information environment
```

For now, **AISYNC and Dzuddiyn Library remain separate projects**.

They are not being merged at repository or architecture level.

AISYNC may later become:

- a subsystem inside Dzuddiyn Library, or
- a separate protocol/project that uses Dzuddiyn Library as its information store.

That choice is intentionally still open until there is evidence from real use.

---

## Current experiment

The smallest proposed experiment is deliberately manual:

```text
one important AI conversation
        ↓
generate an AISYNC structured sync block
        ↓
place it into DL_INBOX
        ↓
retrieve it manually
        ↓
give it to another AI
        ↓
check whether useful continuity is preserved
```

This experiment is intended to test the core idea before introducing infrastructure.

It does **not** imply that automation is required.

---

## What AISYNC is not yet

No confirmed architecture exists.

The project has **not** selected or committed to:

- a database
- a vector database
- a knowledge graph
- Raspberry Pi services
- MCP
- Home Assistant routing
- Google Apps Script
- Google Sheets or Docs as the primary store
- automatic WhatsApp or Telegram ingestion
- a universal sync gateway implementation
- any single AI provider
- automatic merging with Dzuddiyn Library

Those may be explored later if evidence supports them.

---

## Design direction

Current exploration favors these qualities:

- platform-agnostic
- model-agnostic
- portable
- human-controlled
- privacy-aware
- maintainable by one person
- graceful fallback to manual copy/paste
- clear authority and provenance
- no silent persistence of sensitive information
- minimal duplicated manual work

These are design directions, not a confirmed architecture.

---

## Privacy

AISYNC may eventually handle highly personal information.

A future design must distinguish between information that is safe to persist and information that should be private, sensitive, highly sensitive, temporary, or not stored at all.

“Sync everything” is **not** an assumed goal.

---

## Project Source of Truth

The working project record is:

**[ZASSIM-AISYNC.md](./ZASSIM-AISYNC.md)**

It contains the current ideas, risks, open questions, experiments, and owner-locked decisions.

Important project decisions should come from that record rather than from AI memory or chat history alone.

---

## Current locked decision

**D-001 — AISYNC × Dzuddiyn Library boundary**

Keep AISYNC and Dzuddiyn Library separate for now.

Dzuddiyn Library captures/stores life information. AISYNC focuses on moving relevant AI context between AI platforms and that information environment.

Whether AISYNC later becomes part of Dzuddiyn Library or remains independent is still an open question.

---

## Project state

```text
DISCOVERY
   ↓
small real-world experiment
   ↓
evidence
   ↓
refine decisions
   ↓
architecture later
```

The project intentionally starts small.

The immediate goal is to prove that portable AI context is useful before building the machinery around it.
