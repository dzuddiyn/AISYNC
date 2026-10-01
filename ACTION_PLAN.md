# AISYNC — ZASSIMPLE ACTION PLAN

**Status:** SLICED INTO TASKS  
**Method:** ZASSIMPLE v0.2.4  
**Lifecycle stage:** DO IT  
**Authority:** Planning artifact only. It must not override LOCKED owner decisions.

> Implementation thoughts discovered during DESIGN may refine architecture. Architecture findings may refine this Action Plan. LOCKED decisions remain owner authority.

## Purpose

Turn the locked ASC boundaries into a minimum testable v0.1 without coupling ZASS-family methods to destination-specific mechanics.

## Current plan

AP-001 | DONE  
Source: D-002, D-004, D-011  
Action: Implement the locked ASC Write Contract v0.1 representation as canonical JSON using: Project, Source method, Operation, Record type, Record ID, Content/change, Lineage, Destination; keep transport/security metadata in a separate ASC envelope (D-013).  
Dependencies: None beyond the locked field set.  
Constraint / feasibility note: Keep destination-specific mechanics out of the method contract.  
Pass / stop condition: One generic contract can express a real ZASSIMPLE SAVE without embedding GitHub- or Sheets-specific write logic.  
Result: PASS — canonical JSON Schema + valid/invalid examples implemented under `contracts/`; T-001 verified.  
Feeds architecture: YES

AP-002 | DONE  
Source: D-003, D-004, D-011  
Action: Define the ASC Link representation for a small write request.  
Dependencies: AP-001.  
Constraint / feasibility note: Prefer client-side fragment transport for small payloads; exact encoding remains open.  
Pass / stop condition: An ordinary AI app with no write integration can generate a valid ASC Link from method instructions.  
Result: PASS — envelope schema + fragment-only Base64URL link encoder/decoder implemented and verified in T-002; security enforcement remains in AP-007/T-010.  
Feeds architecture: YES

AP-003 | OPEN  
Source: D-006, D-009, D-012, D-019  
Action: Implement the locked Google Sites + Apps Script UI flow, including preview/confirm/write behavior and redirect back to the main ASC UI after a successful confirmed update (D-015).  
Dependencies: D-012 UI information architecture.  
Constraint / feasibility note: Landing must stay simple: DECIDE / DESIGN. Project detail carries the richer lineage views.  
Pass / stop condition: The UI can represent the locked navigation and project-detail sections without forcing users to inspect raw Markdown.  
Feeds architecture: YES

AP-004 | OPEN  
Source: D-002, D-004  
Action: Implement the ASC Core boundary: validate, authorize, translate, route, write through adapter, verify, return receipt; use GitHub as canonical artifact destination and Sheets as operational ASC DB per D-014.  
Dependencies: AP-001.  
Constraint / feasibility note: ASC Core must not perform reasoning or silently rewrite method meaning / LOCKED decisions.  
Pass / stop condition: The same contract can enter the Core regardless of which AI app generated it.  
Feeds architecture: YES

AP-005 | OPEN  
Source: D-007  
Action: Implement the first destination adapter for GitHub using the locked v0.1 fine-grained PAT path, current-file/SHA fetch, create/update, verification, and receipt flow (D-016).  
Dependencies: AP-001, AP-004.  
Constraint / feasibility note: v0.1 proof should support Markdown update → commit → verification → factual receipt.  
Pass / stop condition: A ZASSIMPLE project with no AI→GitHub integration can SAVE through ASC and receive a verified commit result.  
Feeds architecture: YES

AP-006 | OPEN  
Source: D-004, R-003  
Action: Define the factual ASC Write Receipt.  
Dependencies: AP-004, AP-005.  
Constraint / feasibility note: Must distinguish proposed state from actually persisted state.  
Pass / stop condition: Receipt clearly reports success/failure, destination, affected resource, record/commit identifier where applicable, and failure reason when not successful.  
Feeds architecture: YES

AP-007 | OPEN  
Source: D-003, R-004  
Action: Define minimum v0.1 security/privacy controls.  
Dependencies: AP-002, AP-003, AP-004.  
Constraint / feasibility note: No silent writes; explicit confirmation before persistence; destination credentials must not be exposed to the AI-generated link.  
Pass / stop condition: Prototype does not rely on exposed credentials, invisible persistence, or sensitive record content in ordinary query parameters.  
Feeds architecture: YES

## UI data requirements

Source: D-012

The project detail view must be able to render:

1. Project progress bar
2. Progress summary
3. Next Action Plan summary
4. Next stage summary
5. Action Plan table
6. ZASS table with all applicable source-method record components
7. History

The DECIDE / DESIGN project list must be able to render:

- project progress bar
- latest update

These UI requirements feed the data model and architecture; they do not create a second decision authority.

## Integration targets

Source: D-010

Primary locked targets:
- Obsidian
- Notion
- OneNote
- Logseq
- Joplin

Candidate only:
- Airtable

Integration order after GitHub is not yet locked.

## Planning findings

PF-001 | OPEN  
Finding: Google Sheets is the locked ASC DB for v0.1 (D-005). A separate ASC database is not required for the first implementation.

PF-002 | RESOLVED BY D-015  
Finding: Google Sites is the main ASC shell; Apps Script Web App provides dynamic preview/confirm/write behavior and returns the user to the main ASC UI after successful sync.

PF-003 | RESOLVED BY D-014  
Finding: The project-detail UI reads normalized operational/index data from Google Sheets logical tables PROJECTS, RECORDS, ACTION_PLAN, and HISTORY; semantic stage/progress remains method-owned.

PF-004 | RESOLVED BY D-014  
Finding: GitHub is canonical for project artifacts/Git lineage; Google Sheets is the operational/index ASC DB and must not silently become a competing editable master.

## Architecture feedback

The core DESIGN blockers are resolved by D-013 through D-018. Architecture v1.0 is confirmed. The Action Plan has now been sliced into `TASKS.md`. Current executable task: T-001. Future tasks remain queued until prior dependencies pass or are explicitly replanned.


PF-005 | RESOLVED BY D-017  
Finding: Google Account is the v0.1 identity gate with owner-only access; pending ASC Link requests survive sign-in, preview precedes persistence, and successful sync returns to the main ASC UI.


PF-006 | RESOLVED BY D-018  
Finding: ZASS Core owns validation semantics; local CLI and future GitHub CI are runners over the same core. ASC may consume/display commit-linked validation results but must not duplicate validator logic. GitHub CI is not yet implemented and must remain represented as future work until built.
