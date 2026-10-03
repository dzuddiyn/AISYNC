# AI-SYNC Public Method Gateway — v0.1 Proof Plan

**Status:** T-013A PASS — T-013B PASS — v0.1 proof complete  
**Design lineage:** D-023 / D-025 / D-026 / D-028 / ASC DESIGN v1.0.9  
**Scope:** Malay method proof only

## Purpose

Give receiver AIs one stable public AI-SYNC URL for reading a ZASS method while keeping GitHub as the authoritative Source of Truth.

The gateway must serve an AI-SYNC-held snapshot itself. It must not solve the problem by redirecting a receiver to GitHub, raw.githubusercontent.com, jsDelivr, Jina Reader, or another external mirror.

## v0.1 methods

| Method | Canonical path | Current review version | Approx. characters |
|---|---|---:|---:|
| ZASSPILL | `ZASSPILL/ZASSPILL_MY.md` | 1.0.0 | 62,797 |
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

T-013B is **PASS**. Apps Script remained useful for protected sync/backend behavior but was not reliable as the receiver-facing host. GitHub Pages became the v0.1 receiver surface. Browser, Gemini, and Copilot direct-read tests passed; ZASSPILL carried the exact ZASSIMPLE gateway URL into a DESIGN handoff; Gemini completed the end-to-end handoff under ZASSIMPLE using the supplied explicit test context.

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


## Receiver-host field evidence — 2026-10-02

Apps Script transport:
- anonymous browser access to base `/exec`: PASS;
- query-route method content in browser: PASS;
- provenance/meta JSON in browser: PASS;
- Gemini direct fetch of Apps Script plain text: FAIL;
- Gemini direct fetch of Apps Script HTML compatibility view: FAIL;
- Copilot direct fetch of Apps Script HTML compatibility view: FAIL.

Control:
- Gemini successfully fetched a normal public webpage (`example.com`), showing that Gemini web access itself was available.

GitHub Pages proof:
- proof page: `https://dzuddiyn.github.io/AISYNC/method/zassimple/my/`;
- anonymous browser access: PASS;
- Gemini direct fetch: PASS;
- Gemini correctly identified:
  - method: ZASSIMPLE;
  - version: 0.3.0;
  - lifecycle: DUMP → DISTILL → DECIDE → DESIGN → DO IT → DELIVERED !!;
  - PROCEED/LOCK semantics.

Interpretation:
- Apps Script remains suitable for protected sync/backend functions.
- For receiver-facing method transport, a standard static host is currently more compatible.
- This is a transport finding only; GitHub remains the method Source of Truth and method semantics are unchanged.


Copilot proof:
- direct fetch of `https://dzuddiyn.github.io/AISYNC/method/zassimple/my/`: PASS;
- receiver correctly identified the method information from the public page.

Current receiver-facing result:
- Browser: PASS
- Gemini: PASS
- Copilot: PASS
- ZASSPILL gateway-link handoff: PENDING


## T-013B closure

Status: **PASS**

Receiver-facing v0.1 URLs:
- `https://dzuddiyn.github.io/AISYNC/method/zasspill/my/`
- `https://dzuddiyn.github.io/AISYNC/method/zassimple/my/`
- `https://dzuddiyn.github.io/AISYNC/method/zasselection/my/`

Proof summary:
- browser anonymous access: PASS;
- Gemini direct read: PASS;
- Copilot direct read: PASS;
- ZASSPILL generated the exact DESIGN → ZASSIMPLE handoff URL: PASS;
- Gemini end-to-end continuation under ZASSIMPLE: PASS.

Copilot caveat:
- one later handoff session failed to fetch the exact page and substituted repository search, yielding stale/incorrect version context;
- therefore the receiver-source guardrail is mandatory: if the exact gateway fetch fails, report the failure and do not substitute another source as method authority.

Proof record:
- `proofs/zasspill-to-zassimple-handoff.md`

D-028 records the host refinement and receiver-source guardrail. T-013 is closed for the v0.1 proof; execution resumes at T-004.


## T-017 receiver-freshness hardening

T-017 external-provider field evidence showed that the static GitHub Pages ZASSPILL receiver page had remained at the historical v0.1.0 proof snapshot even though canonical ZASSPILL had advanced to frozen v1.0.0. The receiver correctly read the stale page, which means the transport was reachable but the snapshot was not current enough for Production v1 continuity.

Remediation for T-017:
- refresh the static ZASSPILL MY receiver page from canonical upstream ZASS commit `9a6755ea4dc2f9a067343855331078d9a1773a0c`;
- expose version 1.0.0 and exact source commit in page metadata;
- make transfer bootstraps carry `expected_method_version`;
- require the receiver to stop with `STALE_METHOD_GATEWAY` instead of silently continuing when gateway version differs;
- keep the exact-source/no-substitution rule;
- cover the static receiver snapshot with a regression test.

This is evidence-triggered hardening allowed by D-028/T-013B. It does not move semantic authority from the canonical ZASS repository to AISYNC.
