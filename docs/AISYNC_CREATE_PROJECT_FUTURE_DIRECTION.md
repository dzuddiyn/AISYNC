# AISYNC Create Project — Future Product Direction

**Status:** LOCKED FUTURE DIRECTION  
**Date:** 2026-10-05  
**Owner:** Project Owner  
**Activation:** After Production v1 is DELIVERED; not an active T-020 task  
**Depends on:** ZASS Project Bootstrap Core direction

## 1. Product goal

AISYNC should eventually let a user start a new Git-backed ZASS project without manually creating the repository and wiring it into the dashboard.

Target journey:

```text
NEW PROJECT
→ DESIGN
→ create GitHub repository
→ seed ZASS files
→ register in AISYNC
→ start project
```

The project must not become trapped inside AISYNC. Its GitHub repository remains the canonical project Source of Truth and can be used independently of AISYNC.

## 2. Shared bootstrap boundary

AISYNC must consume the ZASS Project Bootstrap Core rather than duplicate project-template semantics.

```text
npm CLI
      ┐
      ├─→ ZASS Project Bootstrap Core
      │       ├─ create files
      │       ├─ initialize project metadata
      │       └─ validate
      │
AISYNC Create Project
      ┘
              ↓
       owner confirmation
              ↓
       GitHub repository
              ↓
       AISYNC registry
              ↓
          DESIGN
```

## 3. AISYNC responsibilities

AISYNC owns the future:

- Create Project UI;
- GitHub authorization and repository-creation integration;
- explicit owner confirmation before repository creation;
- safe failure/retry behavior;
- project registry update;
- canonical/index refresh;
- project progress/current-state projection;
- handoff into the ordinary DESIGN journey after successful registration.

AISYNC must not create a GitHub repository silently as a side effect of entering DESIGN.

## 4. Factual creation states

The future UI must keep these states distinct:

```text
PROJECT IDEA
→ BOOTSTRAP PREPARED
→ OWNER CONFIRMED
→ GITHUB REPOSITORY CREATED
→ ZASS FILES SEEDED
→ AISYNC REGISTERED
→ READY FOR DESIGN
```

A failed or unknown external write must not be shown as successful registration.

## 5. Source-of-Truth rule

```text
GitHub
= canonical project artifacts + Git lineage

AISYNC
= UX + orchestration + registry/index projection + continuity runtime
```

AISYNC may refresh its view from canonical project evidence so project progress can be shown without making AISYNC the semantic master.

## 6. Activation order

Locked future order:

```text
T-020 Human Closed Beta
→ Final ZASS Gate 6 acceptance
→ Gate 6 PASS / CLOSED
→ AISYNC visual polish + Guided Journey
→ UX regression
→ T-021 Production v1 release acceptance
→ DELIVERED !!
→ ZASS CR-010 v0.4 and closure
→ npm bootstrap CLI / ZASS Project Bootstrap Core
→ AISYNC Create New Project → GitHub
```

Do not promote this future direction into the active T-020 task queue.

## 7. UX regression direction

After visual polish / Guided Journey, run a focused UX regression with:

- two returning beta participants;
- one fresh user;
- at least one desktop journey;
- at least one mobile journey.

Primary path:

```text
Landing
→ project
→ DUMP / DECIDE / DESIGN
→ provider handoff
→ return
→ SAVE
→ receipt
→ reopen
→ Guided Journey / current state
```

The regression verifies clarity and usability without reopening already-proven reliability/DR/security evidence unless the visual change actually touches those boundaries.
