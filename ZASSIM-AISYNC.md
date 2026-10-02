# AISYNC — ZASSIMPLE Working Record

**Project:** AISYNC  
**Project record version:** 0.6.14  
**Method:** ZASSIMPLE v0.2.4  
**Method source:** `ZASSIMPLE/ZASSIMPLE_MY.md`  
**Lifecycle stage:** DO IT  
**Status:** ARCHITECTURE CONFIRMED — implementation in progress  
**Owner:** Project Owner

> AISYNC is shared infrastructure for moving, translating, writing, and verifying meaningful information produced by methods and projects. It is not itself a reasoning method.

---


## ZASSIMPLE METHOD STATE

AISYNC now follows **ZASSIMPLE v0.2.4** behavior.

Surface UX:

```text
DUMP → DISTILL → DECIDE → DESIGN → DO IT → DELIVERED !!
```

Current project stage: **DO IT**  
Reason: ASC architecture was explicitly confirmed by the Project Owner on 2026-10-01. Implementation has not started; Action Plan can now be sliced into executable tasks when DO IT execution begins.

Current command surface:

- `ZASS` / `ZASS!!` — show the relevant ZASSIMPLE update, Stage Pulse, and Current Selection Matrix.
- `PROCEED/LOCK` — primary owner decision command; `LOCK` / `LOCK DECISION` remain compatibility aliases.
- `SAVE` — primary persistence command; `COMMIT` remains a compatibility alias.
- `CONFIRM ARCHITECTURE` — opens final architecture confirmation review.
- `YA, CONFIRM ARCHITECTURE` — final owner confirmation for a confirmed architecture.
- `DO IT` — after architecture confirmation, derive executable tasks and present one task at a time.

Internal lineage principle:

> ZASSIMPLE stays lightweight on the surface while preserving lineage through decision → action plan ↔ architecture → task → execution → delivery.

Implementation thoughts discovered during DECIDE or DESIGN should feed hidden action-plan lineage and may refine architecture. Architecture changes may in turn refine the action plan.

### CURRENT SELECTION MATRIX

| Option / Candidate | Must-have fit | Strength | Risk / Weakness | Evidence / Unknown | Status |
|---|---|---|---|---|---|
| Shared Method → ASC → SoT boundary | PASS | Clean separation of reasoning from persistence | Destination semantics still need design | Core boundary locked | D-002 LOCKED |
| ASC Link universal write fallback | PASS | Works even when an AI app cannot write directly | Payload/auth/large-data mechanics still open | Needs implementation experiment | D-003 LOCKED |
| ASC v0.1 core framework | PASS | Contract → Link → UI → Core → Adapter → Receipt | Implementation details remain | Action Plan created | D-004 LOCKED |
| Google Sheets as ASC DB | PASS | Simple Google-native operational store | Scale/schema limits later | v0.1 not field-tested | D-005 LOCKED |
| Google Sites as ASC UI | PASS | Familiar lightweight front-end | Dynamic implementation still open | UI information architecture locked | D-006 LOCKED |
| GitHub first adapter | PASS | Markdown + Git lineage | Auth/write handling remains | First persistence proof | D-007 LOCKED |
| Primary integrations: Obsidian, Notion, OneNote, Logseq, Joplin | PASS | Covers major local/cloud note ecosystems | Different adapter mechanics | Integration order not yet set | D-010 LOCKED |
| Airtable | UNKNOWN | Structured SaaS destination | Overlaps with Sheets | Keep for later review | CANDIDATE |
| ASC Write Contract v0.1 fields | PASS | Common language across methods/destinations | Encoding/schema types still open | Field set locked | D-011 LOCKED |
| DECIDE / DESIGN UI information architecture | PASS | Clear landing and project drill-down | Visual implementation open | Label refinement locked | D-019 LOCKED |
| Canonical JSON + ASC envelope | PASS | Separates meaning from transport/security | Exact field data types still to implement | Representation locked | D-013 LOCKED |
| GitHub canonical artifacts + Sheets operational DB | PASS | Avoids dual-master drift | Sync/index rules need implementation | Authority model locked | D-014 LOCKED |
| Google Sites shell + Apps Script engine + redirect | PASS | Simple UI with programmable confirmation flow | App Script implementation remains | Interaction pattern locked | D-015 LOCKED |
| Fine-grained PAT v0.1 → GitHub App later | PASS | Low v0.1 burden with migration path | Secret handling must be correct | Auth path locked | D-016 LOCKED |
| Google Account owner-only login | PASS | Reuses Google stack | Multi-user roles deferred | Login flow locked | D-017 LOCKED |
| ZASS Core shared by CLI / future CI; ASC consumes results | PASS | Prevents validator drift and keeps local-first independence | GitHub CI not implemented yet | Cross-system boundary locked | D-018 LOCKED |

Current direction: architecture v1.0.5 remains CONFIRMED. D-023 adds a separate public Method Gateway/read-mirror plane while preserving the existing protected write plane and eight-field ASC Write Contract. T-001 through T-003 have PASSED. The active ASC DB is under the intended Google owner profile `dzuddiyn Google`. T-004 remains IN PROGRESS; D-020 implementation is documented but its DUMP route depends on ZASSPILL being completed in ZASS SYSTEM.

---

## CORE PURPOSE

AISYNC provides a shared **transport / write layer** between reasoning methods or projects and their authoritative record destinations.

The official logical boundary is:

```text
ZASS Full
ZASSIMPLE
ZASSELECTION
        │
        ▼
  Method / reasoning layer
  ────────────────────────
  structures & records:
  • reasoning logs
  • selection logs
  • evidence
  • rationale
  • decision lineage
  • architecture provenance
        │
        ▼
      AI-SYNC
  transport / write layer
        │
   ┌────┼───────────────┐
   ▼    ▼               ▼
GitHub   Google Sheets
           (= ASC DB)
        │
        ▼
 Source of Truth records
```

Methods produce meaningful information. AISYNC handles how that information moves, is translated into the destination format, is written, and is verified.

---

## IDEA LOG

I-001 | RESOLVED BY D-002  
Idea: AISYNC may eventually become a subsystem or companion of Dzuddiyn Library rather than an isolated life-information system.  
Source: EXPLICIT  
Resolution: AISYNC is now defined as shared infrastructure that can be used by Dzuddiyn Library alongside ZASS, ZASSIMPLE, ZASSELECTION, and other projects.

---

## AGREED CANDIDATES

None currently open from this checkpoint.

---

## OPEN NOTES

R-001 | OPEN  
Risk: Transport logic must not leak back into ZASS Full, ZASSIMPLE, or ZASSELECTION until the methods become coupled to GitHub, Google Sheets, or a database implementation.

R-002 | OPEN  
Risk: Different destinations may require different schemas or write semantics. AISYNC must translate for the destination without changing the meaning of the method output.

R-003 | OPEN  
Risk: A factual write receipt or equivalent verification is needed so a method/project does not assume persistence succeeded when it did not.

R-004 | OPEN  
Risk: Sensitive information may pass through AISYNC. Privacy, authorization, minimization, and destination-specific controls remain architecture questions.

---

## DECISIONS

D-001 | SUPERSEDED IN SCOPE BY D-002  
Previous decision: Keep AISYNC and Dzuddiyn Library separate for now, with DL storing/capturing life information and AISYNC transporting relevant AI context.  
Status note: The separation remains compatible, but D-002 now defines AISYNC more generally as shared infrastructure rather than infrastructure primarily framed around DL.

D-002 | LOCKED  
Decision: Establish the official boundary between reasoning methods, AISYNC, and persistence destinations.

1. **ZASS Full / ZASSIMPLE / ZASSELECTION = method / reasoning layer.**  
   They structure and record reasoning logs, selection logs, evidence, rationale, decision lineage, and architecture provenance.

2. **Google Sheets / GitHub / AI-SYNC Database = Source of Truth record destinations.**  
   They hold authoritative records for the origin and lineage of reasoning, selection, decisions, and architecture, according to the record/destination design selected later.

3. **AI-SYNC = transport / write layer.**  
   AI-SYNC is responsible for how meaningful information moves, is translated into the required destination format, is written, and is verified.

4. **AI-SYNC is not part of ZASS or ZASSELECTION.**  
   It is shared infrastructure.

5. **Shared consumers may include:**  
   - ZASS Full
   - ZASSIMPLE
   - ZASSELECTION
   - Dzuddiyn Library
   - other projects

6. **Separation principle:**  
   The method does not need to know how GitHub, Google Sheets, or a database works. The method produces meaningful structured information; AISYNC manages transport and persistence.

Reason: This separates reasoning semantics from storage mechanics, allows multiple methods/projects to reuse one transport layer, and prevents each method from implementing destination-specific write logic.  
Locked by: Project Owner  
Date: 2026-10-01


D-003 | LOCKED  
Decision: Establish **ASC Link** as the universal write fallback / escape hatch when an AI application cannot directly persist to the required destination.

1. **Native integration is the fast path, not the requirement.**  
   If an AI app can write successfully through an approved native integration, connector, tool, or equivalent route, it may use that route.

2. **ASC Link is the universal fallback path.**  
   If direct write is unavailable or fails, the AI generates an ASC Sync Link according to the contract embedded in the method file.

3. **Method-file bootstrap.**  
   ZASS Full / ZASSIMPLE / ZASSELECTION may carry the ASC fallback instructions and ASC base link so an AI can learn the write fallback from the method file itself, whether that method was supplied by attachment, copy/paste, or an accessible repository link.

4. **User-confirmed web flow.**  
   The intended UX is:
   ```text
   user requests SAVE / SYNC / COMMIT
            ↓
   direct write attempted when available
            ↓
   if unavailable / unsuccessful
            ↓
   AI generates ASC Sync Link
            ↓
   user clicks link
            ↓
   ASC Web opens
            ↓
   login if required
            ↓
   preview proposed change
            ↓
   CONFIRM & SYNC
            ↓
   ASC writes to destination
            ↓
   verification / receipt
   ```

5. **AI does not need ASC-native integration to use the fallback.**  
   The minimum capability is to understand the method instructions and generate a valid hyperlink/payload.

6. **Small payload transport safety.**  
   For link-carried small payloads, prefer a client-side URL fragment (`#...`) rather than placing sensitive record content directly in ordinary query parameters. The ASC Web should parse the proposal locally before authenticated persistence. Exact encoding/encryption remains an implementation decision.

7. **Large payloads remain open.**  
   A separate package/block/upload mechanism may be introduced later if link payloads become impractical. It is not required for v0.1.

8. **Universal principle.**  
   Universal support means a common ASC information/write contract with a common confirmation path — not that every AI platform must implement the same native integration.

Reason: This avoids maintaining a native integration for every AI app while still providing a low-friction write path for ordinary AI chat applications that cannot directly write to GitHub, Google Sheets, or an ASC database.  
Locked by: Project Owner  
Date: 2026-10-01


D-004 | LOCKED  
Decision: Lock the **ASC v0.1 core framework** as six logical parts:

1. ASC Write Contract
2. ASC Link
3. ASC Web / UI
4. ASC Core
5. Destination Adapters
6. Write Receipt

The initial Action Plan AP-001 through AP-007 is accepted as the working DESIGN plan.  
Reason: This preserves a small reusable core while keeping method semantics separate from transport and destination mechanics.  
Locked by: Project Owner  
Date: 2026-10-01

D-005 | LOCKED  
Decision: **Google Sheets = ASC DB** for the initial ASC implementation. Do not introduce a separate ASC database for v0.1 unless later evidence requires it.  
Reason: Use the smallest maintainable structured store in the existing Google ecosystem.  
Locked by: Project Owner  
Date: 2026-10-01

D-006 | LOCKED  
Decision: **Google Sites = ASC UI** for the initial ASC implementation.  
Reason: Provide a lightweight user-facing surface while keeping backend/transport logic separate.  
Locked by: Project Owner  
Date: 2026-10-01

D-007 | LOCKED  
Decision: **GitHub is the first persistence adapter / proof destination** for ASC v0.1. The proof flow should support Markdown update → commit → verification → factual receipt.  
Reason: ZASS-family records already use Markdown/Git lineage, making GitHub the most direct first persistence proof.  
Locked by: Project Owner  
Date: 2026-10-01

D-008 | REFINED BY D-010  
Previous decision: Obsidian and Notion were accepted as initial external knowledge-integration targets.  
Status note: D-010 expands and replaces this target set while preserving these two integrations.

D-009 | REFINED BY D-012  
Previous decision: The Google Sites UI should start with two main entry points, **DECIDE** and **BUILD**, and surface History, project progress, summaries, and Action Plan information.  
Status note: D-012 locks the complete navigation and project-detail information architecture.

D-010 | LOCKED  
Decision: Lock these as the **primary external integration targets**:

- Obsidian
- Notion
- OneNote
- Logseq
- Joplin

Keep **Airtable** as a candidate for later review, not a locked primary integration.  
Reason: Preserve a focused initial integration set across local-first and cloud note/knowledge ecosystems without expanding the core architecture.  
Locked by: Project Owner  
Date: 2026-10-01

D-011 | LOCKED  
Decision: Lock the minimum **ASC Write Contract v0.1** field set:

- Project
- Source method
- Operation
- Record type
- Record ID
- Content/change
- Lineage
- Destination

The contract is the common semantic handoff between a method/project and ASC. Destination-specific formatting remains the responsibility of ASC/adapters.  
Reason: Provide one common write language without coupling methods to GitHub, Sheets, or other destination implementations.  
Locked by: Project Owner  
Date: 2026-10-01

D-012 | REFINED BY D-019  
Previous decision: Lock the initial **Google Sites ASC UI information architecture**.

Landing page:
- two main entry points: **DECIDE** and **BUILD**

After choosing DECIDE or BUILD:
- show a **project list**
- each project row/card shows:
  - project progress bar
  - latest update

After opening a project:
1. **Project progress bar**
2. **Progress summary**
3. **Next Action Plan summary**
4. **Next stage summary**
5. **Action Plan table**
6. **ZASS table** — full table/list of all relevant ZASS-family record components for that source method (for example I, C, D, AC, and other applicable record types)
7. **History**

Reason: Keep the top-level UX simple while exposing full project lineage only after the user enters a specific project.  
Locked by: Project Owner  
Date: 2026-10-01




D-019 | LOCKED  
Decision: Refine the two top-level ASC UI entry labels from **DECIDE / BUILD** to **DECIDE / DESIGN**.

Scope:
- landing page labels become **DECIDE** and **DESIGN**;
- project-list and project-detail flow remain unchanged;
- this is a terminology/UX patch only and does not alter the confirmed architecture semantics, persistence model, or execution lifecycle.

Reason: Align the user-facing entry wording with the intended decision/design workflow.  
Locked by: Project Owner  
Date: 2026-10-01



D-020 | LOCKED  
Decision: Lock the **ASC Start / Intent Routing / AI Handoff** front-door behavior.

1. **AI provider selection is mandatory before GO / START.**  
   The user must explicitly select one supported AI chat provider before pressing the blue GO/START arrow. If no provider is selected, ASC must stop and show a **red warning directly below the blue arrow**. No login, routing, or handoff should continue.

2. **Authentication gate comes before intent routing.**  
   After GO/START with a provider selected, ASC checks the current ASC login/session. If the user is not authenticated, ASC must preserve the draft message locally and attempt to open the ASC login page in a **new tab**.

3. **Blocked-login fallback must protect the user's draft.**  
   If the browser/provider cannot open the login page in a new tab, ASC must show a **red warning** telling the user to copy the current message first, then press the login/GO action again to redirect to the login page. ASC must not silently discard the draft.

4. **ASC routes the first message automatically after authentication.**  
   The user does not need to choose DUMP / DECIDE / DESIGN manually before starting.
   - clear choice / comparison / selection intent → **DECIDE**
   - clear build / create / design / system / project intent → **DESIGN**
   - unclear, casual, scattered, exploratory, mixed, trial, or low-confidence intent → **DUMP**

5. **DUMP is the safe default.**  
   When ASC cannot confidently determine a more specific intent, it must route to DUMP rather than force DECIDE or DESIGN.

6. **Route must remain visible and user-overridable.**  
   After initial routing, ASC should show the chosen route. The user may override it. If intent materially changes later in the conversation, ASC should **suggest** switching modes rather than silently changing the active mode.

7. **Route maps to the relevant ZASS sub-system / technique.**
   - DUMP → **ZASSPILL**
   - DECIDE → **ZASSELECTION / PICKS**
   - DESIGN → **ZASSIMPLE / IDEA**

   ASC selects the appropriate sub-system and its current contract/instructions; ASC must **not duplicate or redefine the method semantics** owned by the ZASS sub-system. ZASSPILL contract/behavior remains an external dependency until the ZASS SYSTEM work is completed.

8. **Selected AI provider is the handoff destination.**  
   After routing and selecting the appropriate sub-system/contract, ASC builds the handoff for the AI provider selected by the user.

9. **Preferred handoff: provider launch + ASC bootstrap payload.**  
   Where the chosen AI provider supports a safe prefilled/deep-linked/new-chat handoff, ASC should open that AI chat and include the special ASC bootstrap message/prompt needed for the selected DUMP / DECIDE / DESIGN mode so the user can continue there.

10. **Mandatory fallback for providers without supported prefill/handoff.**  
    If automatic prompt insertion or a supported deep-link is unavailable, ASC must show the generated prompt to the user for copy/paste and provide a link/button to open the selected AI provider.

11. **No false automation claim.**  
    ASC must only claim automatic prompt insertion when the target AI provider actually supports that handoff. Otherwise the copy/paste fallback is the official behavior.

12. **Front-door orchestration does not change persistence authority.**  
    This decision adds the ASC entry/router/handoff layer only. Existing boundaries remain: ZASS sub-systems own method semantics; ASC handles orchestration/transport; persistence still follows the confirmed ASC write/verification architecture.

Reason: A plain user should be able to type naturally, choose only the AI service they want, press one button, and let ASC determine the appropriate level of structure without forcing the user to understand ZASSPILL, ZASSELECTION, ZASSIMPLE, PICKS, or IDEA first.  
Locked by: Project Owner  
Date: 2026-10-02


D-013 | LOCKED  
Decision: Lock the **ASC Write Contract representation** as canonical JSON with a separate ASC transport/security envelope.

Semantic contract fields remain exactly:
- Project
- Source method
- Operation
- Record type
- Record ID
- Content/change
- Lineage
- Destination

Transport/security metadata such as contract version, request ID, expiry, nonce/replay controls, and payload hash belong to the **ASC envelope**, not the semantic method contract.  
Reason: Preserve a clean boundary between method meaning and transport/security mechanics while using a universal machine-readable format.  
Locked by: Project Owner  
Date: 2026-10-01

D-014 | LOCKED  
Decision: Lock the **v0.1 Source-of-Truth / ASC DB authority model**:

- **GitHub** = canonical project artifacts and Git lineage, including ZASS-family Markdown artifacts such as working record, Action Plan, Architecture, Tasks, and commit history.
- **Google Sheets = ASC DB** = structured operational/index records used by ASC UI and transport/history views; it must not silently become a competing editable master for the same canonical artifact.

Minimum ASC DB logical tables/tabs:
1. PROJECTS
2. RECORDS
3. ACTION_PLAN
4. HISTORY

The method owns semantic values such as project stage/progress. ASC stores/displays them; ASC Core must not invent method progress.  
Reason: Avoid dual-master drift while giving the UI normalized structured access to project state and history.  
Locked by: Project Owner  
Date: 2026-10-01

D-015 | LOCKED  
Decision: Lock the **Google Sites + Apps Script interaction pattern** for v0.1:

- Google Sites = main ASC dashboard/navigation shell.
- Apps Script Web App = interactive ASC surface/engine for payload parsing, preview, confirmation, server-side processing, and write actions.
- ASC Link for small payloads opens the interactive web app, which parses the proposal, shows preview, requires explicit CONFIRM & SYNC, performs the write through ASC Core, shows/verifies the receipt, then **redirects the user back to the main ASC UI / Google Sites dashboard** after successful confirmation/update.
- Failed writes must show a factual failure state and must not falsely redirect as if persistence succeeded.

Reason: Keep Google Sites simple while using a Google-native programmable surface for secure interactive behavior and preserving a clean post-sync return path to the main UI.  
Locked by: Project Owner  
Date: 2026-10-01

D-016 | LOCKED  
Decision: Lock the **GitHub authentication/write path for v0.1**:

- v0.1 personal prototype: use a repo-scoped **fine-grained GitHub PAT** with minimum required Contents write permission, stored server-side and never exposed in ASC Link payload/browser-visible data.
- Write flow: fetch current file/SHA → create/update content → obtain commit result → verify persisted state → issue ASC Write Receipt.
- Later multi-user/public production path: migrate authentication to a **GitHub App** rather than expanding PAT usage.

Reason: Minimize v0.1 implementation burden while preserving a clear migration path to stronger multi-user authorization.  
Locked by: Project Owner  
Date: 2026-10-01

D-017 | LOCKED  
Decision: ASC v0.1 uses Google Account as the login and identity gate. Access is owner-only for v0.1. If a user arrives through an ASC Link before sign-in, the pending request must remain available after sign-in. Preview must appear before CONFIRM & SYNC. After a successful confirmed update, ASC returns the user to the main Google Sites UI. Failed updates remain visibly failed. Multi-user roles are deferred beyond v0.1.  
Reason: Reuse the Google stack and keep the v0.1 login flow minimal.  
Locked by: Project Owner  
Date: 2026-10-01


D-018 | LOCKED  
Decision: Lock the **ZASS SYSTEM ↔ ASC cross-system boundary**.

1. **ZASS Core owns validation semantics.**  
   Parsers, consistency rules, Git-aware checks, ACTION_PLAN consistency checks, and rule codes such as Zxxx belong to the ZASS SYSTEM core/validator.

2. **Local CLI and GitHub CI are runners over the same ZASS Core.**  
   Local `zass check` is the local-first/power-user path. GitHub CI, when implemented, must invoke the same validation semantics rather than reimplementing its own rule set.

3. **ASC must not duplicate ZASS validation logic.**  
   ASC may trigger, read, consume, store, and display ZASS validation/CI results tied to a commit, but ASC does not own a second implementation of ZASS rules.

4. **ZASS remains fully usable without ASC.**  
   AI-SYNC improves UX, onboarding, transport, persistence, dashboarding, and automation; it is not a runtime requirement for ZASS local tooling.

5. **GitHub is the shared junction / Source of Truth.**  
   Local CLI and future GitHub CI validate project state around the same Git-backed artifacts; ASC persists to and reads from the same project lineage according to the locked authority model.

6. **Current implementation truth must remain explicit.**  
   Local `zass check` exists today; GitHub CI integration is an architecture direction and must not be represented as implemented until it actually exists.

Reason: Prevent rule drift and duplicate validators while preserving local-first ZASS and allowing ASC to become the mainstream UX/automation layer.  
Locked by: Project Owner  
Date: 2026-10-01

---

## LOGICAL BOUNDARY

```text
METHOD / REASONING
(ZASS Full / ZASSIMPLE / ZASSELECTION)
        │
        │ meaningful structured information
        ▼
AI-SYNC
(transport / translate / write / verify)
        │
        ▼
DESTINATION
(GitHub / Google Sheets = ASC DB)
        │
        ▼
SOURCE OF TRUTH RECORDS
```

This is a **logical boundary decision**, not a confirmed implementation architecture.

---

## CURRENT CONSUMER SCOPE

AISYNC is shared infrastructure and may be used by:

- ZASS Full
- ZASSIMPLE
- ZASSELECTION
- Dzuddiyn Library
- other projects

A consumer should not need destination-specific knowledge merely to produce meaningful records.

---

## ARCHITECTURE

**Status:** CONFIRMED

Architecture v1.0 was confirmed by the Project Owner using the exact confirmation phrase `YA, CONFIRM ARCHITECTURE` on 2026-10-01. Implementation remains unbuilt.

This decision does **not** yet select:

- exact data types / encoding rules inside the locked ASC Write Contract fields
- authentication mechanism
- write API
- queue/event model
- conflict handling
- retry model
- exact verification receipt format
- which destination is authoritative for each record class
- synchronization direction or topology
- exact ASC Link payload schema / encoding
- large-payload fallback mechanism
- Google Sites dynamic implementation mechanism
- adapter implementation order after GitHub
- ASC Web implementation details beyond the locked Google Sites UI boundary

Remaining items are implementation details or later-phase concerns; the core v0.1 architecture blockers have been resolved by D-013 through D-016.

---

## VERSION HISTORY

| Version | Date | Change |
|---|---|---|
| 0.6.14 | 2026-10-02 | D-024 gate satisfied by official ZASSPILL v0.1.0 Phase 1 freeze. T-013 promoted as next implementation work. METHODS registry created in ASC DB; Method Snapshot Record v0.1 schema, protected GitHub sync worker, and separate public read gateway code added. T-004 remains paused. |
| 0.6.13 | 2026-10-02 | LOCKED D-024 execution-order gate: pause T-004 at its verified boundary; keep T-013 planned but unpromoted; wait for official ZASSPILL, then review its real handoff contract and let the owner decide whether to run T-013A → T-013B before resuming T-004. |
| 0.6.12 | 2026-10-02 | LOCKED D-023 Public Method Gateway: GitHub remains method SoT; AI-SYNC holds identifiable method snapshots and serves Markdown itself through public read-only receiving URLs. Write Contract v0.1 remains unchanged; Method Snapshot Record is a separate read-plane representation. |
| 0.6.11 | 2026-10-02 | LOCKED D-022: ASC v0.1 auth preservation uses B + A fallback — preserve draft/pending state in the original ASC tab, authenticate in a new tab, return and CONTINUE; if that flow is unavailable, login then click the ASC link/GO/CONTINUE again. Seamless automatic auth recovery is deferred. |
| 0.6.10 | 2026-10-02 | T-004 live finding: authenticated Apps Script fragment preview PASS via `google.script.url.getLocation()`, but fresh unauthenticated `/exec#asc=...` loses the fragment across Google sign-in. D-020 front-door preserve → login → replay is therefore required; architecture remains confirmed. |
| 0.6.9 | 2026-10-02 | LOCKED D-021 User-First UX: user types naturally, chooses only the AI provider, and ASC handles auth/routing/sub-system/contract/handoff behind the simple DUMP / DECIDE / DESIGN surface. DUMP implementation remains pending ZASSPILL. |
| 0.6.8 | 2026-10-02 | LOCKED D-020: mandatory AI-provider selection, login-before-routing gate, automatic DUMP/DECIDE/DESIGN intent routing, visible/overridable route, ZASSPILL/ZASSELECTION/ZASSIMPLE mapping, provider handoff with supported prefill and mandatory copy/paste fallback. No code implementation started for this addendum while ZASSPILL remains pending. |
| 0.6.7 | 2026-10-02 | Operational ownership fix: recreated and verified the active ASC DB under the intended Google owner profile `dzuddiyn Google`; replaced the repo's active Sheet URL and preserved the same T-003 schema/authority boundary. T-004 remains IN PROGRESS pending real deployment/auth verification. |
| 0.6.6 | 2026-10-02 | DO IT T-004 partial: implemented owner-only Apps Script Web App skeleton, pending fragment/session preservation, and preview-only client; local state/decode/no-write tests PASS. Real deployed Google Account sign-in verification remains pending, so T-004 is not yet marked PASS. |
| 0.6.5 | 2026-10-02 | DO IT T-003 PASS: created and verified native Google Sheets ASC DB v0.1 with PROJECTS / RECORDS / ACTION_PLAN / HISTORY, authority/source lineage fields, DECIDE / DESIGN validation, operational filters, and Asia/Kuala_Lumpur timezone. T-004 promoted to READY. |
| 0.6.4 | 2026-10-01 | Small UI terminology patch: D-019 LOCKED, refining ASC landing labels from DECIDE / BUILD to DECIDE / DESIGN without changing architecture semantics. Architecture document patched to v1.0.1. |
| 0.6.3 | 2026-10-01 | DO IT T-002 PASS: implemented ASC envelope v0.1 and fragment-only Base64URL link encode/decode; verified Unicode semantic round-trip and no payload exposure in ordinary query parameters. T-003 promoted to READY; expiry/integrity/replay enforcement remains deferred to T-010. |
| 0.6.2 | 2026-10-01 | DO IT T-001 PASS: implemented canonical ASC Write Contract v0.1 JSON Schema and valid/invalid examples; verified required-field, extra-field, and destination constraints. T-002 promoted to READY; no T-002 implementation started. |
| 0.6.1 | 2026-10-01 | DO IT task slicing completed: created `TASKS.md` with T-001 current READY, T-002–T-011 queued by dependency, and T-012 blocked/later pending real ZASS GitHub CI. No implementation executed yet. |
| 0.6.0 | 2026-10-01 | LOCKED D-018 cross-system boundary: ZASS Core owns validation semantics; CLI/CI are shared-core runners; ASC consumes/displays results without duplicating rules. Architecture v1.0 CONFIRMED by exact owner command `YA, CONFIRM ARCHITECTURE`; lifecycle moved to DO IT, implementation not started. |
| 0.5.1 | 2026-10-01 | LOCKED D-017: Google Account owner-only login, pending-request preservation across sign-in, preview-before-write, and return to main ASC UI after successful sync. |
| 0.5.0 | 2026-10-01 | LOCKED D-013–D-016: canonical JSON contract + transport envelope, GitHub/Sheets authority model, Google Sites + Apps Script interaction pattern with post-sync redirect to main UI, and v0.1 GitHub fine-grained PAT write path with later GitHub App migration. Added architecture draft ready for confirmation. |
| 0.4.0 | 2026-10-01 | LOCKED D-004–D-012: ASC v0.1 framework, Google Sheets as ASC DB, Google Sites as ASC UI, GitHub first adapter, primary integrations, ASC Write Contract v0.1 fields, and DECIDE/BUILD project UI information architecture. Added first-class ACTION_PLAN.md. |
| 0.3.1 | 2026-10-01 | Synced project method from ZASSIMPLE v0.1.6 to official v0.2.4; adopted 6D lifecycle, Stage Pulse/selection-matrix behavior, PROCEED/LOCK + SAVE command surfaces, hidden action-plan lineage, and current DESIGN stage without changing D-002/D-003. |
| 0.3.0 | 2026-10-01 | LOCKED D-003: ASC Link established as the universal write fallback; native integrations remain optional fast paths; user-confirmed web preview/sync flow defined. |
| 0.2.0 | 2026-10-01 | LOCKED D-002: official Method → AI-SYNC → Source of Truth boundary; AISYNC defined as shared transport/write infrastructure reusable by ZASS Full, ZASSIMPLE, ZASSELECTION, Dzuddiyn Library, and other projects. |
| 0.1.0 | 2026-09-29 | Initial AISYNC project record. D-001 defined the temporary AISYNC ↔ Dzuddiyn Library boundary. |


D-021 | LOCKED  
Decision: Lock the **User-First UX principle** for the ASC front door.

- The user starts by typing naturally; the system must not require knowledge of ZASSPILL, ZASSELECTION, ZASSIMPLE, PICKS, IDEA, contracts, or internal architecture before starting.
- The user is required to choose only the target AI provider before GO/START.
- ASC handles authentication, intent routing, sub-system selection, contract selection, and provider handoff behind the simple surface.
- DUMP / DECIDE / DESIGN are the only user-facing structural choices exposed by default.
- Initial route is automatic; DUMP remains the safe default for unclear intent.
- Later mode changes are suggested, not silently forced.
- Internal ZASS sub-system names may stay hidden unless the user explicitly wants to learn the system.
- The exact DUMP implementation remains pending ZASSPILL completion. This decision does not pre-empt or redefine ZASSPILL semantics.

Reason: preserve a plain-user-first experience while keeping deeper ZASS method structure modular and hidden until needed.  
Locked by: Project Owner  
Date: 2026-10-02


D-022 | LOCKED  
Decision: Lock the **ASC v0.1 authentication-state preservation strategy** as **B + A fallback**.

### Primary path B — preserve in original ASC tab
1. Before authentication, ASC preserves the user's current draft/request state in the original ASC front-door tab.
2. The preserved minimum state may include the user draft, selected AI provider, pending ASC payload/request reference, and routing state required for continuation.
3. ASC opens Google authentication in a new tab when possible.
4. The original ASC tab remains the holder of the pending state; the design does **not** require the `#asc` fragment itself to survive Google's authentication redirect.
5. After login succeeds, the user returns to the original ASC tab and presses **CONTINUE**.
6. ASC then replays/reconstructs the pending request into the authenticated Apps Script flow and proceeds to preview.
7. The user draft/request must not be silently lost when authentication is required.

### Fallback A — login, then click/continue again
If the browser, popup policy, tab behavior, or provider flow prevents the primary path:
1. ASC tells the user that login is required.
2. The user completes login.
3. ASC clearly instructs the user to click the ASC link / GO / CONTINUE again.
4. The second authenticated entry replays/opens the pending request where possible.
5. Existing D-020 draft-protection warning remains applicable: if state cannot be safely preserved, ASC must tell the user to copy the message before redirecting.

### Explicit v0.1 non-goal
A fully automatic seamless auth-return mechanism with invisible cross-tab/session recovery (**Option C**) is not required for ASC v0.1. It may be considered later only if the simpler flow proves materially inadequate.

### Requirement refinement
The v0.1 requirement is:

> **The user's draft/pending request must not be lost when authentication is required.**

It is **not** a requirement that the URL fragment itself survive the Google login redirect.

Reason: live T-004 testing proved authenticated fragment preview works, while a fresh unauthenticated `/exec#asc=...` loses the fragment across Google authentication. B + A provides a simpler, more reliable user-first path without adding complexity merely to save one click.  
Locked by: Project Owner  
Date: 2026-10-02


D-023 | LOCKED  
Decision: Establish the **AI-SYNC Public Method Gateway / Read Mirror** as the portable receiving-method transport layer for ZASS methods.

1. **GitHub remains the authoritative Source of Truth for method content.**  
   The official ZASS repository owns canonical method files, versions, and Git commit lineage.

2. **AI-SYNC owns portable method readability.**  
   AI-SYNC provides a public read gateway/mirror so receiver AIs do not need reliable direct access to GitHub, GitHub raw URLs, jsDelivr, Jina Reader, or another third-party mirror.

3. **The gateway must serve its own synced snapshot.**  
   The public AI-SYNC method URL must not merely redirect, wrap, or proxy the receiver onward to GitHub. The gateway serves Markdown content from an AI-SYNC-held snapshot/registry.

4. **No second Source of Truth.**  
   AI-SYNC method snapshots are transport/read mirrors only. If a snapshot conflicts with GitHub, GitHub is authoritative. Snapshot metadata must identify the GitHub source version/commit used.

5. **Public read boundary.**  
   Public method reads require no login and are read-only. The public read surface is separate from protected ASC write/admin/sync-configuration flows.

6. **Clean receiver format.**  
   The method endpoint returns plain text / Markdown suitable for browsers and AI receivers. Registry metadata remains separately inspectable and must not require altering the method semantics.

7. **Portable method URLs become the primary receiving links.**  
   Intended public routes:
   - `/method/zasspill/my`
   - `/method/zassimple/my`
   - `/method/zasselection/my`

   GitHub links may remain as Source-of-Truth/reference links, but the portable AI-readable receiving link is the AI-SYNC gateway.

8. **Locked sync direction.**
   ```text
   GitHub method commit/update
           ↓
   AI-SYNC Method Registry sync
           ↓
   AI-SYNC-held snapshot
           ↓
   Public Method Gateway
           ↓
   receiver AI
   ```

9. **Method semantics remain outside AI-SYNC.**  
   ZASSPILL, ZASSELECTION, and ZASSIMPLE continue to own their own behavior/contracts. AI-SYNC solves transport/readability only and must not rewrite method semantics to solve access problems.

10. **v0.1 proof scope is three Malay methods only.**
    - `ZASSPILL_MY.md`
    - `ZASSIMPLE_MY.md`
    - `ZASSELECTION_MY.md`

    English variants follow only after the Malay proof works.

11. **v0.1 sync must not require manual copy/paste.**  
    A protected/internal sync worker pulls canonical GitHub content into the Method Registry/snapshot store. Public users/AI receivers never receive sync or publish privileges.

12. **ASC Write Contract v0.1 remains unchanged.**  
    The eight-field semantic Write Contract is a protected write-plane handoff and is not expanded with Method Gateway metadata. Method snapshots use a separate read-plane registry record.

Reason: cross-AI field testing showed that direct external method URLs cannot be assumed readable across receiver platforms. This is a transport/readability problem and belongs to AI-SYNC, while GitHub remains canonical and ZASS methods remain semantically unchanged.  
Locked by: Project Owner  
Date: 2026-10-02


D-024 | LOCKED  
Decision: Lock the **post-D-023 execution-order gate**. This locks sequencing only; it does not start implementation.

1. **Do not implement further ASC front-door or Method Gateway code yet.**
2. **T-004 is paused at its current verified boundary.** Its authenticated preview path is proven; preserve/login/replay and DUMP/DECIDE/DESIGN front-door work remain pending.
3. **T-013 remains planned/queued and is not promoted yet.**
4. Wait until **ZASSPILL is official enough to act as the real DUMP/handoff dependency**.
5. When the official ZASSPILL is available, review its actual receiving-method link/handoff contract and then let the Project Owner decide whether T-013 should become the next current task.
6. If T-013 is promoted, execute it in two smallest slices:
   - **T-013A:** create the minimal METHODS registry snapshot store + protected GitHub→AI-SYNC sync; no public endpoint proof yet.
   - **T-013B:** expose the public read-only Markdown gateway and prove Gemini/Copilot readability plus ZASSPILL DECIDE/DESIGN handoff.
7. Only after the Method Gateway proof is sufficiently proven should ASC resume the remaining **T-004 front-door/routing/handoff** implementation.
8. Do not speculate about, duplicate, or alter ZASSPILL semantics while waiting.

Locked execution sequence:

```text
NOW
T-004 paused at verified boundary
T-013 planned / not promoted
        ↓
WAIT FOR OFFICIAL ZASSPILL
        ↓
review real ZASSPILL handoff contract
        ↓
OWNER DECIDES
        ↓
if T-013 promoted:
T-013A → METHODS registry + GitHub sync
        ↓
T-013B → public Method Gateway + cross-AI proof
        ↓
resume T-004 front-door / routing / handoff
```

Reason: Avoid implementing transport assumptions against an unfinished ZASSPILL contract, while preserving the D-023 architecture and the already proven T-004 work.  
Locked by: Project Owner  
Date: 2026-10-02


## T-013 IMPLEMENTATION PROMOTION

Status: ACTIVE IMPLEMENTATION  
Date: 2026-10-02

The D-024 execution gate is now satisfied because ZASSPILL v0.1.0 Phase 1 is officially FROZEN / CORE PROOF PASSED.

Current execution order:

```text
T-013A
METHODS registry + protected GitHub sync
        ↓
T-013B
public Method Gateway + Gemini/Copilot proof
        ↓
resume T-004
front-door / routing / handoff
```

Implementation evidence already created:
- ASC DB now includes `METHODS` with the locked 9-column snapshot shape.
- `method-gateway/method-snapshot-v0.1.schema.json`
- `method-gateway/sync/RegistrySync.gs`
- `method-gateway/sync/appsscript.json`
- `method-gateway/public/Gateway.gs`
- `method-gateway/public/appsscript.json`

T-004 remains paused at its verified boundary.
