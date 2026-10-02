# AI-SYNC Public Method Gateway — v0.1 Proof Plan

**Status:** PLANNED — NOT IMPLEMENTED  
**Architecture:** D-023 / ASC v1.0.5  
**Scope:** Malay method proof only

## Purpose

Give receiver AIs one stable public AI-SYNC URL for reading a ZASS method while keeping GitHub as the authoritative Source of Truth.

The gateway must serve an AI-SYNC-held snapshot itself. It must not solve the problem by redirecting a receiver to GitHub, raw.githubusercontent.com, jsDelivr, Jina Reader, or another external mirror.

## v0.1 methods

| Method | Canonical path | Current review version | Approx. characters |
|---|---|---:|---:|
| ZASSPILL | `ZASSPILL/ZASSPILL_MY.md` | 0.1.0 | 20,040 |
| ZASSIMPLE | `ZASSIMPLE/ZASSIMPLE_MY.md` | 0.2.5 | 18,334 |
| ZASSELECTION | `ZASSELECTION/ZASSELECTION_MY.md` | 0.2.2 | 16,025 |

These are review-time observations only. GitHub remains canonical and the gateway must always capture the actual source commit/version during sync.

## Smallest implementation shape

```text
Official ZASS GitHub repo
        ↓
protected Apps Script sync function
        ↓
ASC DB: METHODS tab
3 rows only for v0.1
        ↓
separate public read-only Apps Script Web App
        ↓
plain Markdown response
        ↓
receiver AI
```

### 1. Snapshot store candidate

Add one operational `METHODS` tab to the existing ASC DB.

Proposed columns:

- method_key
- method
- language
- version
- source_repo
- source_path
- source_commit
- synced_at
- content

This is a mirror/index, not a new authority.

### 2. Protected sync worker

Implement one internal function such as `syncMethodsFromGitHub()`.

v0.1 behavior:
- pull only the three locked MY source paths;
- read canonical content and commit identity;
- extract/read method version;
- upsert one snapshot row per method;
- record `synced_at`;
- never require manual Markdown copy/paste.

For the first proof, prefer a simple owner-controlled time-driven sync trigger over GitHub webhook infrastructure. Webhooks can follow later if needed.

### 3. Public read gateway

Use a deployment that requires no login for GET reads.

Intended routes:

```text
GET /method/zasspill/my
GET /method/zassimple/my
GET /method/zasselection/my
```

Response body:
- the stored Markdown `content`;
- no HTML shell;
- no GitHub redirect;
- no login requirement.

A small metadata route may expose snapshot provenance separately, for example:

```text
GET /method/zasspill/my/meta
```

returning method/language/version/source_repo/source_path/source_commit/synced_at.

The Markdown endpoint itself should remain clean.

### 4. Security boundary

Public:
- GET method content
- GET snapshot metadata

Not public:
- sync
- publish
- write
- configuration
- admin

No public write endpoint is required for this proof.

## Contract boundary

### Existing ASC Write Contract v0.1

UNCHANGED:
- Project
- Source method
- Operation
- Record type
- Record ID
- Content/change
- Lineage
- Destination

### Separate Method Snapshot Record v0.1

Read-plane registry representation:
- method
- language
- version
- source_repo
- source_path
- source_commit
- synced_at
- content

Do not merge these two representations.

## Proof checklist

1. GitHub remains authoritative.
2. Snapshot identifies GitHub commit/version.
3. Public endpoint returns stored Markdown itself.
4. No login is required to read.
5. Gemini can read and identify the method/version.
6. Copilot can read and identify the method/version.
7. A GitHub update can reach the snapshot through protected sync without copy/paste.
8. ZASSPILL can carry the gateway receiving URL during DECIDE/DESIGN handoff.

## Explicit non-goals

- EN variants
- public write API
- complex registry UI
- GitHub webhook infrastructure
- additional CDN mirrors
- changing ZASSPILL/ZASSELECTION/ZASSIMPLE semantics
- making AI-SYNC a second method Source of Truth
