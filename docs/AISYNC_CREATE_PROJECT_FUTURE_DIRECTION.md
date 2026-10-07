# AISYNC / CrossAI Create Project — Future Product Direction

**Status:** LOCKED FUTURE DIRECTION  
**Date:** 2026-10-07  
**Owner:** Project Owner  
**Activation:** After Production v1 is DELIVERED for CrossAI-side implementation; not an active T-020/T-021 task  
**Depends on:** ZASS Project Bootstrap Core direction

## 1. Product goal

CrossAI should eventually let a user start a new ZASS-backed project without manually wiring project files, storage, and optional Git integration into the product.

LOCKED default journey:

```text
NEW PROJECT
→ create user-owned Google Drive project space
→ seed ZASS project structure
→ register in CrossAI
→ offer GitHub

   [ CREATE NEW REPO ]
   [ LINK EXISTING REPO ]
   [ NOT NOW ]

→ continue in DESIGN
```

GitHub is optional. A project must remain usable without GitHub. If GitHub is enabled, selected Git-backed artifacts may use GitHub as their canonical Git/version-control authority while ordinary project files remain in the user-owned Drive project space.

## 2. Shared bootstrap boundary

CrossAI must consume the ZASS Project Bootstrap Core rather than duplicate project-template semantics.

```text
npm CLI
      ┐
      ├─→ ZASS Project Bootstrap Core
      │       ├─ create files
      │       ├─ initialize project metadata
      │       └─ validate
      │
CrossAI Create Project
      ┘
              ↓
    user-owned Drive project space
              ↓
       CrossAI registration
              ↓
       optional GitHub connection
              ↓
            DESIGN
```

The bootstrap core owns ZASS project semantics. CrossAI owns user-facing creation, storage/integration orchestration, registration, and projection.

## 3. CrossAI responsibilities

CrossAI owns the future:

- Create Project UI;
- creation/registration of the user-owned Google Drive project space;
- consumption of the shared ZASS Project Bootstrap Core;
- safe failure/retry behavior;
- project registry update;
- factual project progress/current-state projection;
- optional GitHub authorization;
- explicit user confirmation before creating or linking a GitHub repository;
- handoff into the ordinary DESIGN journey.

CrossAI must not silently create a GitHub repository merely because the user enters DESIGN.

## 4. Factual creation states

The future UI must keep factual states distinct:

```text
PROJECT IDEA
→ DRIVE PROJECT SPACE PREPARED
→ ZASS FILES SEEDED
→ CROSSAI REGISTERED
→ READY FOR DESIGN
```

Optional Git path:

```text
GITHUB OFFERED
→ USER CHOSE CREATE / LINK / NOT NOW
→ if enabled: repository confirmed
→ Git-backed artifacts connected
```

A failed or unknown external write must never be shown as successful registration or Git connection.

## 5. Source-of-Truth rule

Default:

```text
Google Drive project space
= durable user-owned project home

CrossAI
= idea/project continuity + orchestration + registry/projection
```

When GitHub is explicitly enabled:

```text
GitHub
= canonical Git/version-control authority for selected Git-backed artifacts

Google Drive
= durable home for ordinary non-Git project content

CrossAI
= continuity / orchestration / projection
```

CrossAI must not silently maintain two editable semantic masters for the same artifact.

## 6. Locked delivery order

Current critical path remains:

```text
T-020 Human Closed Beta
→ Final ZASS Gate 6 acceptance
→ Gate 6 PASS / CLOSED
→ AISYNC visual polish + Guided Journey
→ focused UX regression
→ T-021 Production v1 release acceptance
→ DELIVERED !!
```

After Production v1 is DELIVERED, the LOCKED future productization order is:

```text
1. ZASS CR-010 v0.4: zass status + zass diff
2. Real-project field test
3. CLOSE CR-010
4. npm bootstrap CLI
5. ZASS Project Bootstrap Core
6. CrossAI Create Project vNext
   - Drive-first
   - GitHub optional
7. CrossAI Compatible v1
   - SAVE_TO_CROSSAI
   - scoped read
   - handoff / return
   - factual receipts
8. CrossAI Intelligence v1
   - idea detection
   - classification
   - related-project suggestion
   - duplicate/relationship screening
9. First real external integration
   - Temaya → CrossAI
10. CrossAI Companion MVP
11. Telegram account binding
12. WhatsApp Companion
13. Obsidian / DL integration
```

This section is future productization planning and does not add an active T-020/T-021 task.

## 7. Why Temaya integration precedes Companion

CrossAI Compatible should be proven first with a real external assistant that already exists.

```text
Temaya
→ SAVE_TO_CROSSAI
→ CrossAI idea continuity
```

This validates the integration contract and the central CrossAI value—preserving ideas born elsewhere—without first requiring CrossAI to build another chatbot.

CrossAI Companion then becomes an optional generic conversational source of ideas for ordinary users who do not already have a personal assistant.

## 8. UX regression direction

After visual polish / Guided Journey, run a focused UX regression with:

- two returning beta participants;
- one fresh user;
- at least one desktop journey;
- at least one mobile journey.

Primary path:

```text
Landing
→ working context
→ provider handoff
→ return
→ SAVE
→ receipt
→ reopen
→ Guided Journey / current state
```

The regression verifies clarity and usability without reopening already-proven reliability/DR/security evidence unless the visual change actually touches those boundaries.

## 9. Architecture invariant

```text
CrossAI strengthens idea continuity first.

Companion is optional.
GitHub is optional.
External assistants can integrate through CrossAI Compatible.
Bootstrap semantics belong to ZASS.
CrossAI consumes them rather than duplicating them.
```
