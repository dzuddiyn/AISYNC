# CrossAI Multi-User Ownership Model

**Status:** LOCKED FUTURE ARCHITECTURE DIRECTION  
**Date:** 2026-10-06  
**Owner:** Project Owner  
**Scope:** Multi-user runtime ownership, per-user deployment boundary, durable-content ownership, and migration direction beyond the closed-beta owner-executed Apps Script runtime  
**Critical-path effect:** Non-blocking for current T-020/T-021 unless explicitly promoted later

## 1. Core decision

LOCKED:

> **CrossAI is centrally maintained. Users do not receive or maintain their own Apps Script instance.**

The future multi-user product must not scale by cloning the current Apps Script project, `.gs` files, Script Properties, Sheets, or deployment once per user.

Rejected scaling model:

```text
User A → Apps Script A
User B → Apps Script B
User C → Apps Script C
...
```

Reason: this would fragment deployments, updates, security policy, migrations, observability, and recovery across user-owned script copies.

Preferred direction:

```text
Users
  ↓
CrossAI central application/runtime
  ├─ identity / access control
  ├─ ASC routing / orchestration
  ├─ service metadata / indexes
  ├─ temporary handoff state
  └─ delegated access to user-owned durable stores
          └─ Google Drive by default
                 └─ optional GitHub connection when useful
```

## 2. Current closed-beta implementation is transitional

The present Production v1 closed-beta runtime is intentionally centralized under the deployer/owner account:

- one Apps Script deployment;
- `executeAs = USER_DEPLOYING`;
- owner Script Properties hold service configuration and beta-participant records;
- the owner-private Google Drive continuity store is authoritative for the closed-beta private continuity state;
- ASC DB / Sheets is centrally operated;
- GitHub App credentials/configuration remain server-side;
- invited beta users are logical participants/tenants, not owners of separate Apps Script projects.

This is accepted as a bounded closed-beta implementation choice. It is **not** the forever multi-tenant ownership architecture.

## 3. No per-user Apps Script

LOCKED:

A new CrossAI user does not receive:

- a cloned Apps Script project;
- a personal copy of CrossAI `.gs` source files;
- a per-user deployment URL that must be upgraded independently;
- a mandatory per-user ASC Sheet merely to run the service.

CrossAI code and service deployment remain centrally maintained so product updates, security fixes, migrations, and runtime policy can be applied once.

## 4. Service state vs user-owned durable content

LOCKED separation:

### A. CrossAI service state

CrossAI may centrally retain the minimum state required to operate the service, including:

- account / tenant identity;
- authentication and authorization state;
- access-control records;
- routing metadata;
- project/file references;
- derived indexes and retrieval metadata;
- temporary handoff/return state;
- operational receipts, health, audit, and migration metadata where required.

This service state must not silently become a competing semantic master for content whose authority lives elsewhere.

### B. User-owned durable content

Durable user-owned content should increasingly live in storage the user owns and authorizes CrossAI to access, rather than remaining permanently under the CrossAI operator's personal storage account.

Preferred direction:

```text
CrossAI central service
        │
        ├─ references / metadata / lineage
        │
        └─ delegated authorization / OAuth
                 ↓
        user-owned durable storage
          └─ Google Drive by default
                 └─ optional GitHub repository/repositories when explicitly enabled
```

Examples of user-owned durable content include:

- Ideas;
- Decisions / Selection History;
- DESIGN project spaces;
- uploaded/generated files intended for durable retention;
- portable exports;
- future portable continuity snapshots or other content explicitly designated user-owned.

GitHub is not required for these ordinary durable-content categories.

## 5. Google Drive default + onboarding

LOCKED direction:

> **Login Google → allow Google Drive Access → terus guna CrossAI. GitHub hanya muncul bila memang berguna.**

Google Drive is the default durable store for ordinary CrossAI user content.

Default durable categories include:

- Ideas;
- Decisions / Selection History;
- Projects / DESIGN spaces;
- files and attachments;
- generated outputs intended for retention;
- portable exports.

CrossAI should access the user's Drive through explicit delegated authorization/OAuth with appropriate scopes rather than by copying the CrossAI Apps Script project into that user's account.

The exact OAuth client architecture, scopes, consent flow, folder layout, token storage, revocation flow, and migration mechanics remain future DESIGN work.

## 6. GitHub is optional

LOCKED:

GitHub is **not** a default onboarding requirement and is **not** mandatory for DECIDE or DESIGN.

GitHub should appear only when the user explicitly needs:

- version control;
- coding workflow;
- collaboration;
- CI;
- a public repository;
- technical provenance.

Default:

```text
CrossAI content
→ user's Google Drive
```

Optional:

```text
CrossAI project
→ [ CONNECT GITHUB ]
→ create or link repository
```

When GitHub is enabled for a specific project, GitHub may become canonical for the selected Git-backed artifacts. Google Drive remains the durable home for non-Git files and other ordinary user content. CrossAI must make this authority split explicit and must not create two competing editable masters.

The previous universal rule **One DESIGN project → one GitHub repository** is SUPERSEDED.

The previous candidate of a consolidated GitHub Selection History repository for DECIDE is also SUPERSEDED as the default; it may exist later only as an optional Git integration/export pattern.

## 7. Failure and quota truthfulness

The existing truthfulness principle remains mandatory:

- if required Google Drive authorization is missing, expired, revoked, quota-blocked, or otherwise unable to persist default durable content, CrossAI must report that state accurately;
- if an optional GitHub connection is enabled and its authorization fails, CrossAI must report the Git-backed artifact state accurately;
- CrossAI must not silently claim durable SAVE success;
- CrossAI must not automatically fall back to permanent operator-owned storage merely because the user's store is unavailable.

## 8. Migration implication

The current owner-private closed-beta continuity store may remain valid for Production v1 closed-beta evidence. Future multi-user architecture should provide an explicit migration path away from operator-personal storage as the long-term home for unrelated users' durable content.

Migration must preserve:

- identity and tenant isolation;
- lineage;
- revision/history where applicable;
- authority clarity;
- privacy boundaries;
- truthful receipts and failure states.

## 9. Authority invariant

LOCKED:

```text
CrossAI central runtime
≠ owner of all user durable content
≠ one Apps Script clone per user
```

Instead:

```text
CrossAI central runtime
+ user/tenant isolation
+ delegated access to user-owned durable stores
+ explicit authority references
```

This direction extends, rather than replaces, the existing principles:

> **CrossAI owns the continuity. The user chooses the intelligence.**

and

> **Generate anywhere. Save durably only where the user owns the storage.**

Here, “owns the continuity” means CrossAI governs the continuity semantics and authoritative relationships intentionally brought into the system; it does not mean CrossAI should permanently own every byte of user content.

## 10. Still open

This architecture direction does not yet choose:

- the final hosted backend/runtime replacing or extending Apps Script;
- database technology for central service state;
- exact Google OAuth scopes and token lifecycle;
- exact Drive folder/schema layout;
- exact per-user encryption/key-management model;
- billing/quota model;
- organization/team tenancy model;
- data residency/region model;
- exact migration date from the closed-beta owner-private continuity store;
- whether every continuity record, only portable snapshots, or another bounded subset becomes user-owned durable storage;
- exact optional GitHub connect/create/link UX and authority mapping.

Those remain future DESIGN decisions.
