# AISYNC — ZASSIMPLE ACTION PLAN

**Status:** INTERNAL WORKING ARTIFACT  
**Method:** ZASSIMPLE v0.2.4  
**Lifecycle stage:** DESIGN  
**Authority:** Planning artifact only. It must not override LOCKED owner decisions.

> Implementation thoughts discovered during DESIGN may refine architecture. Architecture findings may refine this Action Plan. LOCKED decisions remain owner authority.

## Purpose

Turn the locked ASC boundaries into a minimum testable v0.1 without coupling ZASS-family methods to destination-specific mechanics.

## Current plan

AP-001 | OPEN  
Source: D-002, D-004, D-011  
Action: Define the concrete ASC Write Contract v0.1 representation using the locked fields: Project, Source method, Operation, Record type, Record ID, Content/change, Lineage, Destination.  
Dependencies: None beyond the locked field set.  
Constraint / feasibility note: Keep destination-specific mechanics out of the method contract.  
Pass / stop condition: One generic contract can express a real ZASSIMPLE SAVE without embedding GitHub- or Sheets-specific write logic.  
Feeds architecture: YES

AP-002 | OPEN  
Source: D-003, D-004, D-011  
Action: Define the ASC Link representation for a small write request.  
Dependencies: AP-001.  
Constraint / feasibility note: Prefer client-side fragment transport for small payloads; exact encoding remains open.  
Pass / stop condition: An ordinary AI app with no write integration can generate a valid ASC Link from method instructions.  
Feeds architecture: YES

AP-003 | OPEN  
Source: D-006, D-009, D-012  
Action: Design the Google Sites ASC UI flow.  
Dependencies: D-012 UI information architecture.  
Constraint / feasibility note: Landing must stay simple: DECIDE / BUILD. Project detail carries the richer lineage views.  
Pass / stop condition: The UI can represent the locked navigation and project-detail sections without forcing users to inspect raw Markdown.  
Feeds architecture: YES

AP-004 | OPEN  
Source: D-002, D-004  
Action: Define the ASC Core boundary: validate, authorize, translate, route, write through adapter, verify, return receipt.  
Dependencies: AP-001.  
Constraint / feasibility note: ASC Core must not perform reasoning or silently rewrite method meaning / LOCKED decisions.  
Pass / stop condition: The same contract can enter the Core regardless of which AI app generated it.  
Feeds architecture: YES

AP-005 | OPEN  
Source: D-007  
Action: Implement the first destination adapter for GitHub.  
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

The DECIDE / BUILD project list must be able to render:

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

PF-002 | OPEN  
Finding: Google Sites is the locked ASC UI (D-006), but the mechanism used to provide dynamic preview/confirm/write behavior inside that UI remains an implementation question.

PF-003 | OPEN  
Finding: The locked project-detail UI requires normalized access to progress, current/next stage, Action Plan, ZASS records, latest update, and history. This may materially shape the Google Sheets record structure and should feed the architecture draft.

PF-004 | OPEN  
Finding: GitHub remains a Source of Truth destination and the first persistence proof, while Google Sheets is the ASC operational database. Exact authority by record class still needs explicit architecture treatment.

## Architecture feedback

The Action Plan currently suggests these architecture concerns must be resolved before confirmation:

- common contract representation
- Google Sites dynamic interaction mechanism
- Google Sheets table/record model
- GitHub authentication/write path
- receipt/verification format
- project progress derivation
- history model
- source-of-truth authority by record class
- privacy/authentication/replay rules

Do not mark architecture confirmed until the owner completes the ZASSIMPLE confirmation gate.
