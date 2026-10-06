# ASC Route Storage Model — Drive-First Product Direction

**Status:** LOCKED PRODUCT DIRECTION  
**Date:** 2026-10-06  
**Source:** Project Owner  
**Scope:** Future CrossAI Sync durable storage by semantic route  
**Priority:** Future architecture; non-blocking for current T-020/T-021

## Supersession

This document supersedes the earlier route-storage candidate that proposed:

- a consolidated GitHub DECIDE repository; and
- one mandatory GitHub repository per DESIGN project.

Those GitHub-first defaults are no longer current.

## Locked onboarding

> **Login Google → allow Google Drive Access → terus guna CrossAI. GitHub hanya muncul bila memang berguna.**

## Locked default storage model

```text
CrossAI
  │
  ├─ AI CHAT / Ideas
  │    └─ user's Google Drive
  │
  ├─ Decisions / Selection History
  │    └─ user's Google Drive
  │
  └─ Projects / DESIGN
       └─ user's Google Drive
             │
             └─ optional [ CONNECT GITHUB ]
```

Google Drive is the default durable store for ordinary user-owned CrossAI content.

GitHub is optional.

## AI CHAT / Ideas

Durable saved ideas live in the user's Google Drive by default. CrossAI may retain service/index/reference metadata centrally, but durable user-owned content does not require GitHub.

## Decisions / Selection History

Decisions and selection history live in the user's Google Drive by default.

A GitHub account/repository is not required to compare options, save a decision, retain rationale, or browse prior selections.

The former candidate of one consolidated GitHub Selection History repository is **SUPERSEDED as the default**. A Git representation may later be offered only as an explicit optional integration/export.

## Projects / DESIGN

LOCKED:

> **One DESIGN project = one durable project space. GitHub is optional.**

Default:

```text
Project
→ user-owned Google Drive project space
```

GitHub appears only when useful for:

- version control;
- coding workflow;
- collaboration;
- CI;
- public repositories;
- technical provenance.

Optional Git-enabled mode:

```text
Project in Drive
   ↓
[ CONNECT GITHUB ]
   ↓
create or link repository
```

When GitHub is enabled, CrossAI must state which artifacts are Git-backed. GitHub may become canonical for those selected Git-backed artifacts; Google Drive remains the durable home/authority for ordinary non-Git content and files. CrossAI must not silently maintain two editable semantic masters for the same artifact.

## Authority guardrail

Default authority:

```text
ordinary durable user content
→ user's Google Drive
```

Optional authority:

```text
explicitly Git-enabled artifact
→ GitHub canonical for that Git-backed artifact
```

CrossAI/ASC may maintain indexes, references, routing metadata, receipts and derived retrieval state, but those must not silently replace the selected durable authority.

## Current closed-beta exception

The current owner-executed Apps Script + owner-private Drive continuity implementation remains a bounded Production v1 closed-beta architecture. It does not yet implement per-user Drive OAuth and must not be represented as doing so.

## Open implementation details

Still open:

- exact Google OAuth scopes and consent flow;
- user Drive folder/file schema;
- token storage and revocation;
- multi-device/account recovery;
- quota UX;
- optional GitHub connect/create/link UX;
- GitHub repository ownership/privacy defaults when enabled;
- migration from owner-private beta continuity to user-owned durable storage;
- exact mapping between private continuity records and durable Drive artifacts.

## Canonical references

See:

- `docs/CROSSAI_PRODUCT_DIRECTION.md`
- `docs/CROSSAI_MULTI_USER_OWNERSHIP.md`
