# AISYNC — ZASSIMPLE ACTION PLAN

**Status:** SLICED INTO TASKS  
**Method:** ZASSIMPLE v0.3.0  
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
Source: D-006, D-009, D-012, D-019, D-020  
Action: Implement the locked Google Sites + Apps Script UI flow, including the D-020 provider-selection/auth/intent-routing/AI-handoff front door, preview/confirm/write behavior, and redirect back to the main ASC UI after a successful confirmed update (D-015).  
Dependencies: D-012 UI information architecture.  
Constraint / feasibility note: Landing must stay simple: DUMP / DECIDE / DESIGN. User does not need to choose a mode before starting; AI-provider selection is mandatory, then ASC auto-routes after authentication. Project detail carries the richer lineage views.  
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


PF-007 | RESOLVED BY T-003  
Finding: ASC DB v0.1 exists as a native Google Sheet with PROJECTS, RECORDS, ACTION_PLAN, and HISTORY. The active Sheet was migrated on 2026-10-02 to the intended Google owner profile `dzuddiyn Google`. The bootstrap row model carries GitHub source artifact/commit and explicit authority fields, so Sheets functions as operational/index storage without becoming the canonical Markdown master. Native Sheet URL is documented in `db/README.md`.


PF-008 | OPEN — T-004 DEPLOYMENT VERIFICATION  
Finding: The Apps Script Web App skeleton is implemented using owner-only Google Account deployment semantics (`MYSELF` / `USER_DEPLOYING`). Pending `#asc` state restoration and preview-only behavior pass local tests. T-004 cannot be closed until the real deployed Google authentication redirect is verified with an actual ASC Link; no write handler exists yet.


PF-009 | RESOLVED BY D-020  
Finding: ASC front-door UX now requires explicit AI-provider selection, authentication before routing, automatic DUMP/DECIDE/DESIGN classification, visible/overridable route, and capability-aware handoff to the selected AI app. DUMP maps to ZASSPILL, DECIDE to ZASSELECTION/PICKS, and DESIGN to ZASSIMPLE/IDEA. ASC selects the subsystem/contract but does not own or duplicate its semantics. ZASSPILL remains an external dependency before the DUMP path can be finalized.


PF-010 | RESOLVED BY LIVE T-004 TEST  
Finding: The deployed Apps Script Web App correctly reads and previews `#asc` payloads after the user is already authenticated, using `google.script.url.getLocation()`. However, Google's owner-only authentication redirect does not preserve the outer `#asc` fragment from a fresh unauthenticated entry. Therefore direct `/exec#asc=...` through login is not the final flow. D-020's front-door preservation model is required: preserve draft/payload before authentication, complete login, then replay the payload into the authenticated Apps Script preview. No architecture reopening is required.


PF-011 | RESOLVED BY D-022  
Finding: ASC v0.1 will not attempt to force the `#asc` fragment through Google's authentication redirect. Primary auth continuation is B: preserve the pending state in the original ASC tab, authenticate in a new tab, return, then CONTINUE/replay. Fallback A is login then click the ASC link / GO / CONTINUE again. The preserved-user-state requirement is mandatory; seamless automatic cross-tab auth recovery is deferred.


AP-008 | IN PROGRESS — D-024 GATE SATISFIED  
Source: D-023  
Action: Implement the smallest AI-SYNC Public Method Gateway proof for ZASSPILL_MY, ZASSIMPLE_MY, and ZASSELECTION_MY.  
Dependencies: Current canonical method files in the official ZASS GitHub repository.  
Constraint / feasibility note:
- GitHub remains method SoT.
- Public gateway is read-only/no-login.
- Gateway serves AI-SYNC-held Markdown snapshots itself; no redirect-to-GitHub solution.
- Sync/publish/configuration stays protected.
- Start with MY only.
- Do not modify ZASS method semantics.
Pass / stop condition: the six D-023 proof objectives pass, including direct Gemini/Copilot readability and GitHub→gateway sync without manual copy/paste.  
Feeds architecture: YES

PF-012 | RESOLVED BY D-023  
Finding: External receiver access to GitHub/raw/CDN/reader URLs is not a reliable method-distribution assumption. AI-SYNC therefore needs a separate public read plane.

PF-013 | CONTRACT BOUNDARY  
Finding: The eight-field ASC Write Contract v0.1 should remain unchanged. Public method distribution needs a separate Method Snapshot Record v0.1 containing method/language/version/source repo/path/commit/synced_at/content. This avoids mixing method-distribution metadata into protected semantic write requests.

PF-014 | MINIMUM v0.1 STORAGE CANDIDATE  
Finding: Current Malay method files are small enough for a minimal three-row registry proof (approximately 16k–20k characters each at review time). A simple `METHODS` tab in ASC DB is therefore a viable initial snapshot store; this is an implementation candidate, not a new Source of Truth. If method size/behavior later makes Sheets unsuitable, storage may change without changing D-023.


PF-015 | RESOLVED BY D-024  
Finding: D-023 changes the practical execution order, but implementation should not begin against an unfinished ZASSPILL dependency. T-004 is therefore paused at its verified boundary and T-013 remains planned/unpromoted. Once ZASSPILL is official, review its actual handoff contract and let the owner decide whether to promote T-013.

PF-016 | D-024 EXECUTION SEQUENCE  
If promoted after ZASSPILL review, split the Method Gateway proof into:
- T-013A: minimal METHODS registry + protected GitHub sync;
- T-013B: public Markdown gateway + Gemini/Copilot readability + ZASSPILL handoff proof;
then resume T-004 front-door/routing/handoff.


PF-017 | T-013A IMPLEMENTATION  
Finding: The smallest compatible implementation uses two separate Apps Script code surfaces:
- protected sync worker: GitHub → METHODS;
- public read gateway: METHODS → Markdown.
This preserves the public-read/protected-write boundary and leaves ASC Write Contract v0.1 unchanged.

PF-018 | T-013A REGISTRY CREATED  
Finding: The active ASC DB now includes a METHODS tab with the nine snapshot columns locked by D-023. Registry structure exists; live GitHub sync execution remains to verify.

PF-019 | PUBLIC GATEWAY PLATFORM NOTE  
Finding: Apps Script ContentService can serve plain text and anonymous web-app access is available through ANYONE_ANONYMOUS with execution as deployer. ContentService may deliver output via a Google-controlled content URL; this is acceptable only if Gemini/Copilot field tests prove receiver readability. The gateway must never redirect the receiver to GitHub.


PF-020 | RESOLVED BY D-025  
Finding: Lock the smallest Method Gateway implementation topology: existing ASC DB `METHODS` registry, protected exact-commit GitHub sync worker, and a separate public anonymous read-only Apps Script gateway. Keep the eight-field ASC Write Contract unchanged. Execute T-013A → T-013B → resume T-004.


PF-021 | ZASSIMPLE v0.3.0 BASELINE  
Finding: AISYNC now follows official ZASSIMPLE v0.3.0. DESIGN is the generic design surface; architecture remains a technical subtype appropriate to AISYNC. Existing confirmed architecture and LOCKED decisions remain valid. Current execution remains T-013A in DO IT.


PF-022 | RESOLVED BY D-026  
Finding: T-013B should not pre-build both Markdown and HTML surfaces. Field-test clean text/Markdown first. Add a clean HTML `/view` compatibility fallback only if a required receiver fails the primary endpoint but can read a normal webpage.
