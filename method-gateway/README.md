# AI-SYNC Public Method Gateway — v0.1 Proof Plan

**Status:** T-013A PASS — T-013B LIVE DEPLOYMENT / CROSS-AI PROOF PENDING  
**Design lineage:** D-023 / ASC DESIGN v1.0.8  
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


## Execution-order gate

D-024 gate is now satisfied by the official ZASSPILL v0.1.0 Phase 1 freeze. T-013 implementation is active.

```text
T-004 paused
T-013 planned / unpromoted
        ↓
wait for official ZASSPILL
        ↓
review actual ZASSPILL handoff contract
        ↓
owner decides whether to promote T-013
        ↓
T-013A → registry + protected sync
        ↓
T-013B → public gateway + cross-AI proof
        ↓
resume T-004
```

This prevents AISYNC from guessing unfinished ZASSPILL semantics.


## Implemented files

T-013A / T-013B code skeleton now exists:

- `method-snapshot-v0.1.schema.json` — separate read-plane record schema.
- `sync/RegistrySync.gs` — protected GitHub→METHODS sync.
- `sync/appsscript.json` — protected sync project manifest.
- `public/Gateway.gs` — public read-only snapshot server.
- `public/appsscript.json` — anonymous-read web-app manifest.

The protected sync worker first resolves the canonical repository's `main` branch HEAD commit, then fetches all three method files at that exact commit. This makes one sync run internally consistent and traceable.

## Current implementation checkpoint

T-013A: **PASS**.

Verified:
1. protected sync Apps Script runs successfully;
2. GitHub reads are authenticated with `GITHUB_TOKEN` stored in Apps Script Script Properties;
3. three METHODS snapshots are present;
4. one sync run pins all three snapshots to one GitHub source commit;
5. method version/path/content are populated;
6. a second run upserts existing rows without duplicates.

Current work: **T-013B** — deploy the separate public read-only Apps Script gateway and field-test the plain-text snapshot endpoint with Gemini and Copilot. Add the HTML `/view` compatibility surface only if receiver evidence requires it.

## Locked implementation path — D-025

The v0.1 proof implementation is now locked:

```text
Official ZASS GitHub
        ↓ exact main HEAD
protected sync Apps Script
        ↓
ASC DB / METHODS
        ↓
public read-only Apps Script
        ↓
receiver AI
```

Rules:
- one sync run uses one exact GitHub commit for all three MY methods;
- normal sync uses no manual Markdown copy-paste;
- public read and protected sync stay in separate Apps Script projects;
- public routes serve snapshot content themselves;
- ASC Write Contract v0.1 is unchanged;
- T-013A must pass before T-013B;
- T-004 resumes after the Method Gateway proof.


## Receiver format fallback — D-026

Primary:

```text
/method/<method>/my
→ text/plain Markdown
```

Evidence-triggered fallback only:

```text
/method/<method>/my/view
→ clean HTML compatibility page
```

Do not implement the HTML view unless Gemini/Copilot field tests show that the plain-text endpoint is insufficient. Both surfaces, if eventually needed, must expose the same AI-SYNC-held snapshot and preserve identical method semantics.
