# ASC Route Storage Model — Candidate

**Status:** CANDIDATE — NOT LOCKED  
**Date:** 2026-10-06  
**Source:** Project Owner idea  
**Scope:** Future CrossAI Sync / AISYNC storage model by DUMP / DECIDE / DESIGN route  
**Priority:** Future architecture; non-blocking for T-020 Human Closed Beta

## Core idea

Use a different persistence model for each top-level user intent instead of forcing every CrossAI interaction into the same GitHub/project structure.

```text
DUMP
→ no GitHub account required
→ conversation / continuity / history stored inside ASC

DECIDE
→ one GitHub repository for the user's selection history
→ each selection is organized by selection title/topic
→ one user may accumulate many historical selection records

DESIGN
→ each project gets its own GitHub repository
→ project artifacts live independently in that repository
→ ASC / CrossAI Sync reads/synchronizes the project state back for workspace/progress views
```

## Candidate rationale

### DUMP — ASC-native

DUMP is casual/exploratory continuity. Requiring GitHub before a user can simply unload ideas would add unnecessary onboarding friction.

Candidate direction:

```text
DUMP
→ ASC private storage
→ no GitHub account prerequisite
→ portable/retrievable continuity
```

This aligns with the existing separation between private continuity authority and Git-backed project-artifact authority.

### DECIDE — consolidated selection history

DECIDE produces structured selection records rather than a full independent software/project repository every time.

Candidate direction:

```text
one DECIDE history repository
    ├── selection topic A
    ├── selection topic B
    ├── selection topic C
    └── ...
```

The user can therefore retain many historical choices in one Git-backed selection history rather than creating one repository per comparison.

Exact repository ownership, naming, visibility, folder layout, and whether the repository is user-owned or service-managed remain open.

### DESIGN — repository per project

DESIGN creates durable project state and therefore maps naturally to one independent GitHub repository per project.

Candidate direction:

```text
Project A → GitHub repo A
Project B → GitHub repo B
Project C → GitHub repo C
```

Each project remains independently inspectable and maintainable outside CrossAI Sync.

ASC may register/index the repository and project current state so CrossAI can display project progress without becoming a competing semantic Source of Truth.

## Candidate route model

```text
CrossAI Sync
    │
    ├── DUMP
    │     └── ASC-native private continuity/history
    │
    ├── DECIDE
    │     └── consolidated GitHub selection-history repository
    │           └── records grouped by selection title/topic
    │
    └── DESIGN
          └── one GitHub repository per project
                └── ZASS project artifacts
                     ↓
                   ASC index / project progress projection
```

## Open questions before promotion

This candidate deliberately does not yet decide:

- whether DECIDE requires the user to have a GitHub account;
- whether CrossAI creates/owns a DECIDE history repository on behalf of a user;
- private/public default for DECIDE and DESIGN repositories;
- exact folder/file naming for selection topics;
- export/migration path from DUMP into DECIDE or DESIGN;
- when an existing DUMP becomes a persisted DECIDE/DESIGN artifact;
- retention/deletion controls for ASC-native DUMP history;
- repository quota/rate-limit implications;
- multi-user/team ownership model.

## Authority guardrail

This candidate must preserve the existing authority split:

- ASC-private storage may be authoritative for private DUMP continuity;
- GitHub may be authoritative for Git-backed DECIDE/DESIGN artifacts;
- ASC indexes/projections must not silently become a second semantic master;
- moving from DUMP → DECIDE or DESIGN must be an explicit transition, not an invisible persistence change.

## Promotion trigger

Revisit after Production v1 / T-021 or during the locked Project Bootstrap work.

Promote only after deciding GitHub account/ownership behavior and validating that the three-route storage model simplifies onboarding without weakening portability, privacy, or authority clarity.
