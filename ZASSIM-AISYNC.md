# AISYNC — ZASSIMPLE Working Record

**Project:** AISYNC  
**Project record version:** 0.6.35
**Method:** ZASSIMPLE v0.3.0  
**Method source:** `ZASSIMPLE/ZASSIMPLE_MY.md`  
**Lifecycle stage:** DO IT
**Status:** ASC v0.1 technical proof baseline complete; Production v1 delivery track active; T-015 PASS / T-016 CURRENT
**Owner:** Project Owner

> AISYNC is shared infrastructure for moving, translating, writing, and verifying meaningful information produced by methods and projects. It is not itself a reasoning method.

---


## ZASSIMPLE METHOD STATE

AISYNC now follows **ZASSIMPLE v0.3.0** behavior.

Surface UX:

```text
DUMP → DISTILL → DECIDE → DESIGN → DO IT → DELIVERED !!
```

Current project stage: **DO IT**  
Reason: the technical proof baseline is complete, but D-031 locks that proof completion is not project delivery. Production v1 requires canonical state, production write, private continuity, integrated human UX, reliability/operations, closed-beta human evidence, and final owner release acceptance. T-015 is PASS and T-016 is CURRENT.

Current command surface:

- `ZASS` / `ZASS!!` — show the relevant ZASSIMPLE update, Stage Pulse, and Current Selection Matrix.
- `PROCEED/LOCK` — primary owner decision command; `LOCK` / `LOCK DECISION` remain compatibility aliases.
- `SAVE` — primary persistence command; `COMMIT` remains a compatibility alias.
- `CONFIRM DESIGN` — opens the current ZASSIMPLE v0.3.0 final design confirmation review.
- `YA, CONFIRM DESIGN` — final owner confirmation for a design under the current method.
- `DO IT` — after design confirmation, execute the sliced tasks one at a time.

Historical compatibility note: AISYNC architecture v1.x was confirmed on 2026-10-01 under the earlier `YA, CONFIRM ARCHITECTURE` surface. That confirmation remains valid; under ZASSIMPLE v0.3.0, architecture is treated as a technical subtype of DESIGN.

Internal lineage principle:

> ZASSIMPLE stays lightweight on the surface while preserving lineage through decision → action plan ↔ design/technical architecture → task → execution → delivery.

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
| ZASS Core shared by CLI / GitHub CI; ASC consumes results | PASS | Prevents validator drift and keeps local-first independence | ASC depends on factual commit-linked CI availability; absence must remain NOT_FOUND, not PASS | T-012 deployed/live-read/owner-visible proof PASS | D-018 LOCKED |

Current direction: DESIGN v1.0.12 remains CONFIRMED. T-001 through T-015 and T-013A/B are PASS. D-031 locks the Production v1 delivery gate. D-032 through D-034 lock private continuity authority, native ZASSPILL continuity-contract separation, and transport-vs-semantic request identity. T-016 is CURRENT, followed by T-017 through T-021.

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

- **GitHub** = canonical project artifacts and Git lineage, including ZASS-family Markdown artifacts such as working record, Action Plan, Design (including technical architecture where applicable), Tasks, and commit history.
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
| 0.6.35 | 2026-10-03 | T-015 PASS: canonical project/thread/index state, private Drive continuity authority, optimistic concurrency/idempotency/tombstone live proof, factual stale-index detection, merged Drive-write/freshness hotfix, and protected Apps Script deployment version 10 verified; T-016 Production Write Path promoted. |
| 0.6.34 | 2026-10-03 | LOCKED D-032/D-033/D-034 before T-015: private thread continuity authority uses a dedicated ASC Private Continuity Store; frozen native ZASSPILL continuity writes are not forced into the eight-field ASC Write Contract; transport request identity is separated from semantic idempotency identity. |
| 0.6.33 | 2026-10-03 | LOCKED D-031 Production v1 delivery gate: technical proof ≠ project DELIVERED; lifecycle confirmed as DO IT; Production v1 closed-beta scope and T-014→T-021 delivery track locked; T-014 baseline PASS and T-015 promoted. |
| 0.6.32 | 2026-10-03 | T-012 PASS: read-only commit-linked ZASS CI consumer, Apps Script binding, project-detail rendering, protected deployment v7, real SUCCESS/NOT_FOUND reads, and owner-visible NOT_FOUND proof completed without duplicating ZASS validation semantics. No further task is currently queued. |
| 0.6.31 | 2026-10-03 | LOCKED D-030 successful-return refinement from T-011 live evidence; user-activated `Return to main ASC UI` is the guaranteed v0.1 return path after verified SUCCESS + HISTORY, automatic top-level navigation is optional, and T-011 minimum end-to-end ZASSIMPLE SAVE proof is PASS. ASC v0.1 core/fallback proof is delivered; T-012 remains BLOCKED / LATER. |
| 0.6.30 | 2026-10-03 | LOCKED D-029 T-010 v0.1 envelope security/replay rules (30-minute expiry, SHA-256 integrity as error detection only, one confirmed attempt per request_id via LockService + Script Properties, owner-only gate, server-side-only GITHUB_TOKEN, preview + confirm double validation). T-010A/B LOCAL PASS; T-010 remains IN PROGRESS pending live proof. |
| 0.6.29 | 2026-10-03 | T-006 PASS: real GitHub Contents API adapter completed one controlled VERIFIED_WRITE; commit and persisted file SHA independently verified; AP-005 done and T-007 promoted. |
| 0.6.28 | 2026-10-03 | T-006A PASS: GitHub adapter local/mock mechanics published; truthful current-SHA, commit-SHA, persisted-state verification, WRITE_UNVERIFIED, Promise/throw handling, and isolation boundaries verified; T-006 remains IN PROGRESS for controlled live write. |
| 0.6.27 | 2026-10-03 | T-005 PASS: pure ASC Core boundary published; exact contract validation, fail-closed authorization, deep semantic isolation, destination routing, isolated adapter descriptors, and neutral receipt handoff verified; T-006 promoted. |
| 0.6.26 | 2026-10-03 | T-004 PASS: live copy-open provider handoff verified across Gemini/ChatGPT/Copilot field cases; exact-source guardrail held; method transport proven distinct from still-open controlled project continuity; T-005 promoted. |
| 0.6.25 | 2026-10-02 | T-004 live provider-selection / intent-routing / method-mapping proof PASS: ChatGPT/Gemini/Copilot options, deterministic DUMP/DECIDE/DESIGN routing, user override persistence, exact Method Gateway mapping, and preview-only handoff verified; actual provider handoff remains next. |
| 0.6.24 | 2026-10-02 | T-004 D-022 live preserve/auth/replay proof PASS: GitHub Pages static front door preserves #asc in the original tab; protected Apps Script handles authenticated preview; CONTINUE replay works without refresh after noopener regression fix; NO WRITE verified. |
| 0.6.23 | 2026-10-02 | LOCKED D-028 receiver-facing host refinement; T-013B PASS; GitHub Pages adopted for v0.1 receiver-facing method transport; exact-URL/no-substitution guardrail recorded; T-004 resumed. |
| 0.6.22 | 2026-10-02 | Copilot direct-read proof against the GitHub Pages ZASSIMPLE receiver URL passed. |
| 0.6.21 | 2026-10-02 | Gemini direct-read proof against the GitHub Pages ZASSIMPLE receiver URL passed after Apps Script receiver fetches failed. |
| 0.6.20 | 2026-10-02 | T-013A PASS: protected GitHub→METHODS sync live, exact-commit snapshot batch verified, authenticated GitHub read configured, and second run confirmed upsert/no duplicates. |
| 0.6.19 | 2026-10-02 | Completed ZASSIMPLE v0.3 artifact migration: `ARCHITECTURE.md` → `DESIGN.md`; preserved confirmed technical architecture/decision authority; aligned current task/design references without reopening decisions. |
| 0.6.18 | 2026-10-02 | LOCKED D-027 ASC continuity authority + cross-AI transfer UX: SAVE returns an ASC link; intentional cross-AI continuation starts from ASC Web/project tree, produces a short bootstrap + method link + controlled continuity reference, and hides raw GitHub/fallback/packet complexity from ordinary users. |
| 0.6.17 | 2026-10-02 | LOCKED D-026 receiver-format fallback: plain text/Markdown remains the primary Method Gateway response; clean HTML `/view` compatibility surface is added only if Gemini/Copilot field evidence requires it. |
| 0.6.16 | 2026-10-02 | Updated AISYNC thread/project baseline to official ZASSIMPLE v0.3.0. Current surface now uses DESIGN / CONFIRM DESIGN; architecture is treated as a technical design subtype. Historical architecture confirmation remains valid. Current DO IT task remains T-013A. |
| 0.6.15 | 2026-10-02 | LOCKED D-025 Method Gateway v0.1 implementation path: existing Write Contract unchanged; METHODS registry + protected exact-commit GitHub sync + separate public read gateway; execute T-013A → T-013B → resume T-004. |
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
- Historical dependency note: DUMP originally remained pending ZASSPILL completion. Frozen upstream ZASSPILL v1.0 is now available and is the current DUMP semantic contract; AISYNC does not redefine it.

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


D-025 | LOCKED  
Decision: Lock the **AI-SYNC Method Gateway v0.1 implementation path** selected after the architecture audit.

1. **Keep the existing ASC Write Contract v0.1 unchanged.**  
   The Method Gateway remains a separate public read-plane subsystem.

2. **Use one lightweight `METHODS` registry in the existing ASC DB for v0.1 snapshots.**  
   Locked columns:
   - method_key
   - method
   - language
   - version
   - source_repo
   - source_path
   - source_commit
   - synced_at
   - content

3. **Use two separate Apps Script surfaces.**
   - Protected sync project: canonical GitHub → METHODS.
   - Public read project: METHODS → public Markdown/plain-text endpoint.
   The public deployment must not expose sync/admin/write functions.

4. **Pin one sync run to one exact GitHub branch-head commit.**  
   Resolve the canonical ZASS repository `main` HEAD first, then fetch all three method files at that exact commit so a snapshot batch is internally consistent and traceable.

5. **v0.1 scope remains three Malay methods only.**
   - ZASSPILL_MY.md
   - ZASSIMPLE_MY.md
   - ZASSELECTION_MY.md

6. **Normal sync must not require manual Markdown copy-paste.**  
   The protected sync worker fetches canonical content, extracts version metadata, and upserts the registry.

7. **Execution order is locked as:**
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

8. **Public route shape is directional, not a production-domain lock.**
   Intended route equivalents:
   - /method/zasspill/my
   - /method/zassimple/my
   - /method/zasselection/my

9. **No overbuild in v0.1.**
   Do not add complex auth, multi-user product behavior, broad registry UI, extra connectors, webhook infrastructure, EN methods, or production URL hardening before the vertical slice proves readability.

10. **Acceptance authority remains D-023.**  
    This decision locks how the proof is implemented; it does not weaken the requirement that GitHub remains authoritative and that Gemini/Copilot must actually read the served snapshot before T-013 passes.

Reason: This is the smallest implementation compatible with current ASC boundaries while keeping public read, protected sync, GitHub authority, and method semantics cleanly separated.  
Locked by: Project Owner  
Date: 2026-10-02


## METHOD BASELINE UPDATE — ZASSIMPLE v0.3.0

Effective for this AISYNC thread/project from 2026-10-02.

Source:
- official repo: `dzuddiyn/ZASS-Zero-to-Architecture-Structured-Sprint`
- path: `ZASSIMPLE/ZASSIMPLE_MY.md`
- version: `0.3.0`
- source repo commit reviewed: `38760ddbc194ea530730bb615be2553cc38f267b`
- source file blob: `b51680d434ecdffbd7daba742e9fa6d6466d0c82`

Current behavioral alignment:
- DUMP-first remains the default conversational surface.
- Lifecycle remains `DUMP → DISTILL → DECIDE → DESIGN → DO IT → DELIVERED !!`.
- `PROCEED/LOCK` remains the owner decision command.
- `SAVE` remains the persistence command.
- current confirmation surface is `CONFIRM DESIGN` / `YA, CONFIRM DESIGN`.
- architecture remains valid as a technical subtype of DESIGN for this software/infrastructure project.
- historical AISYNC architecture confirmation under `YA, CONFIRM ARCHITECTURE` is preserved as project history and is not reopened by this method baseline update.
- current stage remains DO IT; current implementation task remains T-013A.


D-026 | LOCKED  
Decision: Lock the **Method Gateway receiver-format fallback strategy** for T-013B.

1. **Primary receiver endpoint remains clean plain text / Markdown.**
   Intended primary route shape:
   - `/method/zasspill/my`
   - `/method/zassimple/my`
   - `/method/zasselection/my`

   These routes serve the AI-SYNC-held method snapshot itself as clean text/Markdown and do not redirect to GitHub.

2. **Do not build HTML first.**
   T-013B must field-test the plain-text endpoint with Gemini and Copilot before adding a second representation.

3. **HTML compatibility view is an evidence-triggered fallback only.**
   If a receiver cannot reliably read the plain-text endpoint but can read a normal webpage, AI-SYNC may add a clean HTML view, for example:
   - `/method/zassimple/my/view`

4. **HTML fallback must preserve method content and semantics.**
   It is a transport/rendering compatibility layer only. It must not summarize, rewrite, transform, or redefine ZASS method semantics.

5. **Avoid unnecessary dual-surface complexity.**
   If the plain-text endpoint works across the required receivers, no HTML compatibility endpoint is needed for v0.1.

6. **GitHub authority and D-023/D-025 boundaries remain unchanged.**
   GitHub remains method SoT; AI-SYNC remains the snapshot/read transport layer.

Reason: The observed problem is receiver accessibility, not Markdown semantics. Plain text is the smallest machine-readable surface; HTML should exist only if field evidence shows it improves receiver compatibility.  
Locked by: Project Owner  
Date: 2026-10-02


D-027 | LOCKED  
Decision: Lock **ASC as the continuity authority and transfer hub for ordinary user cross-AI continuation**, while keeping method distribution and private project continuity as separate transport surfaces.

### 1. SAVE UX benchmark

After ASC is complete enough for ordinary use, the user should not need to paste a long ZASSPILL/ZASSELECTION/ZASSIMPLE handover packet into another AI merely to save current state.

Normal save experience:

```text
user works in AI
        ↓
SAVE
        ↓
AI gives ASC save link
        ↓
ASC preview
        ↓
CONFIRM & SYNC
        ↓
persisted state
```

Benchmark:

> **If an ordinary user still has to paste a long continuity/method packet after ASC is complete, ASC has not achieved its UX purpose.**

### 2. Cross-AI transfer begins from ASC Web

When the user wants to continue or move work to another AI, ASC Web is the preferred transfer origin.

Target UX:

```text
ASC Web
        ↓
Project Tree
        ↓
select project
        ↓
select saved thread/state
(DUMP / DECIDE / DESIGN)
        ↓
state appears in transfer/chat box
        ↓
select target AI
        ↓
TRANSFER PAGE
```

### 3. Transfer page output

The transfer page should provide the minimum portable continuation material:

- short receiving instruction;
- AI-SYNC method link for the required receiving method;
- controlled continuity/handoff link or equivalent scoped reference;
- COPY action;
- target-AI open action/link when supported;
- fallback allowing the user to open the target AI app/site manually and paste the short instruction/link.

The target AI may support a safe prefilled/deep-link path. If not, copy/paste of the short bootstrap is the official fallback. ASC must not falsely claim automatic insertion where the provider does not support it.

### 4. AI-to-AI transfer is not the authority

The source AI is not required to serialize or carry the full transfer packet itself. Its normal role may be only to point the user to ASC.

Conceptually:

```text
Source AI
  ↓
ASC link
  ↓
ASC continuity state
  ↓
target AI
```

ASC is the continuity transfer authority; individual AI chats are consumers/producers around that authority.

### 5. Public method vs controlled continuity boundary

Public method distribution:

```text
/method/<method>/<language>
→ public, read-only
→ reusable by receiver AIs
```

Project/thread continuity:

```text
/handoff/<reference>
or equivalent
→ controlled/private/scoped
→ carries project/thread state
```

Method content may be public. Project continuity must not automatically become a permanent public URL.

The exact v0.1 protection mechanism for continuity links — authenticated access, scoped token, expiry, temporary package, short ID, or another minimal mechanism — remains an implementation decision and is not locked by D-027.

### 6. Method complexity stays hidden from ordinary users

A normal user transferring work should not need to understand or manually manage:

- ZASSPILL/ZASSELECTION/ZASSIMPLE internals;
- raw GitHub URLs;
- GitHub browser fallbacks;
- Method Snapshot metadata;
- long handover packet structure;
- transport-specific fallback logic.

Second UX benchmark:

> **If moving to another AI still requires the user to understand method internals, raw GitHub/fallback URLs, or packet structure, ASC has not hidden enough transport complexity.**

### 7. Default transfer interaction

Target user-facing flow:

```text
select thread
        ↓
select AI
        ↓
TRANSFER
        ↓
copy/open
        ↓
continue
```

Same-chat method handoff remains valid inside a conversation. D-027 governs the preferred experience when the user intentionally continues/transfers through ASC across AI providers/apps.

### 8. Relationship to current tasks

- T-013 remains focused on proving the public Method Gateway.
- T-004 remains the paused ASC front-door/routing/handoff implementation and will resume after the Method Gateway proof.
- D-027 refines the target UX/authority model for T-004 and later continuity transport; it does not require premature implementation before T-013 passes.
- Existing D-020/D-021 provider selection, routing, handoff and user-first principles remain compatible.

Reason: The long ZASSPILL field-test packet is useful as a transport benchmark, but it should become infrastructure hidden behind ASC rather than a routine user burden.  
Locked by: Project Owner  
Date: 2026-10-02


## ZASSIMPLE v0.3 ARTIFACT MIGRATION

Date: 2026-10-02

The AISYNC project artifact structure now follows ZASSIMPLE v0.3.0:

```text
ACTION_PLAN.md
DESIGN.md
TASKS.md
```

`ARCHITECTURE.md` was renamed to `DESIGN.md`. The existing confirmed technical architecture remains inside DESIGN as a technical subtype. No LOCKED decision, confirmation authority, or current execution task was reopened by this migration.

Current task: **T-004**. T-013A and T-013B are PASS.


## T-013A LIVE VERIFICATION CHECKPOINT

Date: 2026-10-02  
Status: **PASS**

Evidence:
- protected `syncMethodsFromGitHub()` ran successfully against the live ASC DB;
- the METHODS registry contains the three MY method snapshots;
- snapshots from one run share the same canonical GitHub source commit;
- version/path/content fields are populated from canonical GitHub;
- authenticated GitHub API access uses `GITHUB_TOKEN` from Apps Script Script Properties, not a hard-coded secret;
- a second sync run upserted the same three records without duplication.

Execution now advances to:

```text
T-013B
public Method Gateway
↓
no-login plain-text snapshot
↓
Gemini + Copilot field proof
↓
ZASSPILL gateway-link handoff proof
```


## T-013B RECEIVER-HOST FIELD TEST

Date: 2026-10-02  
Status: **PARTIAL PASS**

Evidence:
- Apps Script public method output was readable in a normal browser;
- Apps Script plain-text and HTML receiver surfaces were not directly readable by Gemini;
- Copilot also failed to fetch the Apps Script HTML receiver surface;
- Gemini successfully fetched a normal control webpage, so receiver web access was available;
- GitHub Pages proof surface was deployed from `/docs`;
- browser read of `https://dzuddiyn.github.io/AISYNC/method/zassimple/my/`: PASS;
- Gemini direct read of that GitHub Pages URL: PASS;
- Gemini correctly identified ZASSIMPLE v0.3.0, the full lifecycle, and PROCEED/LOCK semantics.

Current interpretation:
```text
GitHub method SoT
↓
protected sync / provenance backend
↓
receiver-facing static public host
↓
Gemini / Copilot / other AI receivers
```

Apps Script remains useful for protected sync/backend behavior, but the current evidence does not support using Apps Script as the receiver-facing public host.

T-013B remaining proof was later completed by the ZASSPILL gateway-link handoff and Gemini end-to-end continuation; see the T-013B closure checkpoint below.


### Copilot receiver proof

- Copilot direct read of `https://dzuddiyn.github.io/AISYNC/method/zassimple/my/`: **PASS**.
- Combined receiver proof now stands at:
  - Browser: PASS
  - Gemini: PASS
  - Copilot: PASS

T-013B subsequently closed after the ZASSPILL gateway-link handoff proof passed.


D-028 | LOCKED  
Decision: Refine the Method Gateway receiver-facing host based on live field evidence.

1. Protected GitHub→METHODS sync remains in Apps Script.
2. Apps Script is not the official receiver-facing host for v0.1 because Gemini/Copilot could not reliably fetch it, including the tested HTML compatibility surface.
3. GitHub Pages is the v0.1 receiver-facing static host under `https://dzuddiyn.github.io/AISYNC/method/<method>/my/`.
4. GitHub remains the canonical method Source of Truth; the Pages files are transport snapshots only.
5. Receiver-facing MY routes cover ZASSPILL, ZASSIMPLE, and ZASSELECTION.
6. Receiver guardrail: use the exact Method Gateway URL supplied by the handoff. If fetch fails, report failure and do not substitute repository search, raw GitHub, or another source as authoritative method content.
7. Gemini passed the end-to-end ZASSPILL → DESIGN → ZASSIMPLE handoff. Copilot passed a dedicated direct-read test but showed retrieval variability in one later end-to-end session; this is a receiver caveat, not a semantic change.
8. T-013 closes the v0.1 transport proof. Automatic republishing of static pages after future registry refreshes remains later hardening unless evidence requires it sooner.

Locked by: Project Owner  
Date: 2026-10-02

D-029 | LOCKED

Decision: T-010 v0.1 ASC envelope security / replay rules. These rules extend D-013's transport/security envelope; the eight semantic Write Contract fields are unchanged.

1. Expiry. Every write-capable ASC envelope carries `issued_at` and `expires_at` (valid ISO date-time strings) as transport/security metadata. Require `expires_at > issued_at`, `expires_at - issued_at <= 30 minutes`, and not already expired at validation time (`REQUEST_EXPIRED`). Invalid or excessive lifetime fails closed before destination I/O. Expiry is never silently extended.
2. SHA-256 integrity. Mandatory for write-capable envelopes. `integrity.algorithm` is exactly `SHA-256`; `integrity.digest` is a lowercase 64-character hex digest of the UTF-8 canonical JSON of `{envelope_version, request_id, issued_at, expires_at, contract}` (object keys sorted recursively, array order preserved, scalars preserved, the `integrity` object excluded). Missing/bad algorithm or digest fails closed; a mismatch is `INTEGRITY_MISMATCH`. Limitation: a plain SHA-256 digest carried with the payload provides integrity consistency / error detection only. It is not sender authentication, a signature, a MAC, an authenticated envelope, or tamper-proof transport: anyone able to rewrite both payload and digest can recompute it.
3. Replay. One `request_id` may perform only one confirmed sync attempt. Preview never consumes it. After envelope security, owner identity, and explicit request-bound CONFIRM & SYNC pass, and before any GitHub/HISTORY I/O, the `request_id` is atomically claimed. A second attempt is `REPLAY_REJECTED` with zero destination writes. A confirmed attempt stays consumed even if its write later fails; any retry needs a new `request_id`. If replay state cannot be safely determined or claimed, fail closed (`REPLAY_STORE_UNAVAILABLE`). Apps Script v0.1 mechanism: `LockService` + `PropertiesService.getScriptProperties()`; CacheService is result delivery only, never the replay authority.
4. Owner identity. v0.1 stays owner-only. Before the replay claim and any destination I/O, the Google active user must be non-empty and equal the effective/deploying owner (existing v0.1 identity model). Absent/mismatched identity fails closed: no GitHub call, no HISTORY write, no replay claim.
5. Destination credential. `GITHUB_TOKEN` stays a server-side Script Property only (D-016 fine-grained repo-scoped PAT model unchanged). It is never placed in the envelope, returned by a server function, rendered in HTML, put in browser storage, logged into receipts, or included in browser-visible errors.
6. Double validation. Security is validated server-side at preview (structure, expiry/lifetime, SHA-256 integrity, owner) before CONFIRM & SYNC is shown as enabled; browser decode is transport UX only. Preview never claims replay state and never writes. At CONFIRM & SYNC everything is validated again server-side before the replay claim and before I/O; a previous browser or preview validation is never trusted as write authorization.
7. Atomic replay claim. The check-and-set runs under an Apps Script lock: lock → inspect persistent claim → reject if claimed → persist claim if unused → release. Only one simultaneous confirmed invocation for a `request_id` can win. The claim happens after explicit confirmation + security + owner checks and before destination I/O.

`request_id` is the v0.1 replay key; no separate nonce is added.

Locked by: Project Owner\
Date: 2026-10-03

D-030 | LOCKED

Decision: ASC v0.1 successful post-sync return behavior is a guaranteed **user-activated `Return to main ASC UI` link/button** after a verified SUCCESS write and persisted HISTORY.

1. After `VERIFIED SUCCESS` + HISTORY persistence, ASC must provide a visible user-activated return control to the configured main ASC UI.
2. Automatic top-level navigation may be attempted when the hosting/browser platform permits it, but it is not a v0.1 pass requirement.
3. FAILED, unverified, or incomplete writes must remain visibly non-successful and must not offer the return control in a way that falsely implies persistence succeeded.
4. This refines the post-sync wording in D-015 / D-017 without changing the existing confirmation, verification, receipt, HISTORY, authentication, or destination-credential boundaries.

Live basis: T-011 owner-issued ZASSIMPLE SAVE completed a verified GitHub write and HISTORY persistence, then remained on the Apps Script success page until the owner activated `Return to main ASC UI`.

Locked by: Project Owner\
Date: 2026-10-03

## D-032 — PRIVATE CONTINUITY AUTHORITY / STORE

Date: 2026-10-03
Status: **LOCKED**
Owner instruction: lock before T-015.

Decision:

```text
GitHub
= canonical project/method artifacts

ASC Private Continuity Store
= authoritative private Current Thread Records
+ semantic event lineage
+ tombstones/deletion authority

ASC DB / Sheets
= derived operational/index projection
```

Private continuity is not stored as an ordinary GitHub project artifact and the ASC DB must not become a competing semantic thread master. The exact Production v1 backing technology remains an implementation detail for T-015.

## D-033 — NATIVE ZASSPILL CONTINUITY CONTRACT BOUNDARY

Date: 2026-10-03
Status: **LOCKED**

Decision: preserve the existing eight-field ASC Write Contract v0.1 for the project/artifact write path that already uses it, but do not force frozen ZASSPILL v1 thread-continuity semantics into that shape.

Continuity writes retain the upstream semantic form:

```text
request_id
thread_id
expected_revision
operation
changes
```

Bootstrap may legitimately have no `thread_id`. ASC must resolve identity according to the frozen bootstrap/import contract and must not invent a Record ID merely to satisfy the older ASC Write Contract.

## D-034 — TRANSPORT REQUEST ID ≠ SEMANTIC IDEMPOTENCY ID

Date: 2026-10-03
Status: **LOCKED**

Decision:

```text
ASC envelope request_id
= transport/security attempt identity

ZASSPILL req_<ULID>
= logical semantic mutation/idempotency identity
```

D-029 transport replay protection remains valid. Semantic retries preserve the same ZASSPILL request ID where the frozen idempotency/WRITE_OUTCOME_UNKNOWN contract requires it. The transport replay key must not substitute for semantic idempotency.

## D-031 — PRODUCTION v1 DELIVERY GATE

Date: 2026-10-03
Status: **LOCKED**
Owner command: `PROCEED & LOCK`

Decision:

> A technical proof, subsystem proof, or vertical prototype may be complete without the AISYNC project being `DELIVERED !!`.

AISYNC Production v1 is the first human-usable closed-beta release. It requires:
- minimum three distinct non-developer human participants (target 3–5);
- production GitHub write mapping and GitHub App authorization rather than TEST_ONLY proof policy;
- canonical project/thread/revision/event state with truthful index freshness;
- private controlled continuity + retrieval aligned to frozen ZASSPILL v1;
- one coherent ordinary-user journey across routing, provider handoff, SAVE, receipt/HISTORY, CI, reopen, and transfer;
- recovery/operations proof including backup/restore, migration, degraded/offline behavior, telemetry, deployment, rollback, and secret rotation;
- no developer-side data repair or hidden canonical-state patching during accepted beta journeys;
- final release checkpoint + owner acceptance.

Until those gates pass, lifecycle remains **DO IT**. Only T-021 may promote the project to `DELIVERED !!`.

Non-goals for Production v1:
- public anonymous/multi-tenant SaaS;
- production destinations beyond GitHub;
- broad connector rollout;
- unrelated method-language expansion.

## T-015 CLOSURE CHECKPOINT

Date: 2026-10-03
Status: **PASS**

Evidence:
- canonical state implementation merged through PR #10; live Drive-write/freshness hotfix merged through PR #11;
- 22/22 repository tests PASS after the hotfix;
- private continuity live proof verified stable thread identity, revision 1 → 2, semantic duplicate idempotency, stale-revision conflict, event lineage `[1,2]`, delete, and tombstone behavior;
- independent Google Drive read-back verified the authoritative private state JSON and tombstone;
- factual freshness proof returned `STALE / CANONICAL_HEAD_DIFFERS_FROM_INDEXED_COMMIT` for the deliberately stale ASC DB index rather than silently rewriting it;
- protected Apps Script deployment is version 10: `T-015 canonical continuity state verified hotfix`.

Boundary preserved:
- private continuity authority is not GitHub project repo or Sheets;
- Sheets remains derived/index state;
- native ZASSPILL continuity semantics remain method-owned;
- transport replay identity remains separate from semantic idempotency identity.

Execution advances to **T-016 — PRODUCTION WRITE PATH**.

## T-014 CLOSURE CHECKPOINT

Date: 2026-10-03
Status: **PASS**

T-014 reconciled the current authority after the technical-proof phase and established the locked path:

```text
T-015 canonical state / freshness
↓
T-016 production write
↓
T-017 private continuity + retrieval
↓
T-018 integrated human UX
↓
T-019 reliability + operations
↓
T-020 human closed beta
↓
T-021 Production v1 release
↓
DELIVERED !!
```

Current task: **T-016**.

## T-012 CLOSURE CHECKPOINT

Date: 2026-10-03
Status: **PASS**

Boundary proven:

```text
GitHub repository + exact commit SHA
↓
GitHub Actions read
↓
exact workflow: ZASS CI
↓
exact job: zass-check
↓
factual status model
↓
ASC project-detail display
```

Evidence:
- T-012A local consumer tests PASS for SUCCESS, FAILURE, IN_PROGRESS, QUEUED, NOT_FOUND, and READ_ERROR;
- T-012B Apps Script/dashboard binding PASS with GET-only GitHub Actions transport and no project/Sheet mutation;
- T-012C project-detail rendering PASS locally for SUCCESS / NOT_FOUND / READ_ERROR;
- protected Apps Script deployment version 7: `T-012C commit-linked ZASS CI dashboard`;
- real upstream read of `dzuddiyn/ZASS-Zero-to-Architecture-Structured-Sprint@7cdbd6818198f22245ebcaf107a3cc87611a3d72` returned `ZASS CI / zass-check`, run `37084823055`, SUCCESS;
- current ASC DB AISYNC index points to `dzuddiyn/AISYNC@2e0c773faaa2597a5df72fa77fea42d911bb0412`; real lookup correctly returned NOT_FOUND;
- owner-visible protected dashboard screenshot confirmed that exact AISYNC commit is displayed with `Status: NOT_FOUND` and explicit wording that absence is not a PASS result.

Guardrail preserved:
- ASC does not implement or copy ZASS validation rules;
- ASC does not infer PASS/FAIL from project files;
- missing CI data does not become PASS;
- this path is read-only and does not mutate GitHub, ASC DB, or project state.

Historical T-012 closure state: no further task was queued at that checkpoint. D-031 subsequently opened the Production v1 delivery track; T-015 is now PASS and current task is **T-016**.

## T-013B CLOSURE CHECKPOINT

Date: 2026-10-02  
Status: **PASS**

Evidence:
- browser anonymous read of the GitHub Pages receiver surface: PASS;
- Gemini direct read of the ZASSIMPLE receiver page: PASS;
- Copilot direct read of the ZASSIMPLE receiver page: PASS;
- ZASSPILL generated a DESIGN → ZASSIMPLE handoff carrying the exact public Method Gateway URL: PASS;
- Gemini consumed that handoff and continued under ZASSIMPLE using the supplied explicit test context: PASS;
- Copilot showed one receiver-specific retrieval failure in a later handoff session and incorrectly substituted repository search; D-028 therefore requires exact-URL/no-substitution behavior.

Scope:
- method-link handoff is proven;
- controlled/private ASC continuity transport is not yet proven and remains later work under D-027/T-004-related evolution.

Execution returns to:

```text
T-004
front-door
↓
preserve draft/request
↓
Google auth
↓
CONTINUE / replay
↓
visible DUMP / DECIDE / DESIGN route
↓
provider handoff using public Method Gateway
```


## T-004 D-022 LIVE AUTH-PRESERVE CHECKPOINT

Date: 2026-10-02  
Status: **PASS for preserve/auth/replay slice; T-004 remains IN PROGRESS**

Field finding:
- a public Apps Script front door opened anonymously but lost the incoming `#asc` fragment before client preservation;
- GitHub Pages static front door at `/asc/` preserved the fragment directly from `window.location.hash`;
- the original tab stored the complete pending fragment in `sessionStorage`;
- SIGN IN opened the protected owner-only Apps Script base URL in a new tab without carrying the payload;
- Google authentication completed in the protected tab;
- returning to the original static front-door tab preserved the pending request;
- after fixing the `window.open(..., 'noopener')` false-failure regression, CONTINUE remained enabled without refresh;
- CONTINUE replayed the stored fragment into protected `/exec#asc=<payload>`;
- protected preview rendered the D-028 TEST_ONLY contract;
- NO WRITE occurred.

Current proven topology:

```text
GitHub Pages static front door
        ↓ preserve #asc in original tab
SIGN IN
        ↓
owner-only Apps Script
        ↓ Google auth
return to original tab
        ↓
CONTINUE
        ↓
protected Apps Script #asc replay
        ↓
preview
        ↓
NO WRITE
```

Next T-004 slice:

```text
mandatory AI provider selection
        ↓
visible + user-overridable intent route
DUMP / DECIDE / DESIGN
        ↓
ZASSPILL / ZASSELECTION / ZASSIMPLE
        ↓
public Method Gateway URL
        ↓
provider handoff
```


## T-004 LIVE PROVIDER / ROUTING CHECKPOINT

Date: 2026-10-02  
Status: **PASS for provider-selection/routing/mapping slice; T-004 remains IN PROGRESS**

Live proof verified:

```text
user draft
    ↓
mandatory provider
ChatGPT / Gemini / Copilot
    ↓
route suggestion
DUMP / DECIDE / DESIGN
    ↕ explicit user override
    ↓
method mapping
ZASSPILL / ZASSELECTION / ZASSIMPLE
    ↓
public Method Gateway URL
    ↓
PREPARE HANDOFF preview only
```

Evidence:
- DUMP sample routed correctly;
- DECIDE comparison sample routed correctly;
- DESIGN build/architecture sample routed correctly;
- ambiguous/default behavior remains DUMP;
- explicit route override survived later draft edits;
- exact route→method→gateway mappings were shown;
- PREPARE HANDOFF required a non-empty draft, provider, and active route;
- preview contained provider, route, method, gateway URL, and draft;
- no provider site opened;
- no network call or persistence/write occurred;
- prior D-022 auth-preserve/replay regression tests remained PASS.

Next T-004 slice:

```text
prepared handoff
    ↓
selected provider capability
    ↓
supported deep-link/prefill when truthfully available
OR
short copy/paste fallback
    ↓
target AI opens
    ↓
receiver reads exact public Method Gateway URL
```

The implementation must not claim provider capabilities that have not been proven.

## T-004 CLOSURE CHECKPOINT

Date: 2026-10-03  
Status: **PASS**

T-004 pass criteria are now satisfied:

```text
front door
↓
preserve pending request across Google auth
↓
CONTINUE / replay
↓
mandatory provider selection
↓
visible + user-overridable route
DUMP / DECIDE / DESIGN
↓
exact ZASS method + Method Gateway mapping
↓
PREPARE HANDOFF
↓
COPY bootstrap
↓
OPEN provider base URL
↓
manual paste
↓
receiver uses exact Method Gateway
```

Live receiver evidence:

- **Gemini:** exact ZASSIMPLE gateway fetch PASS; continued under DESIGN. It then introduced generic/inaccurate AISYNC assumptions because the handoff did not contain controlled project continuity.
- **ChatGPT:** exact gateway fetch PASS; continued with a project-aligned architecture response. This demonstrates the handoff path but is not isolated proof of portable project continuity because ambient project/account context may have contributed.
- **Copilot:** exact gateway fetch FAIL in the tested session; receiver correctly stopped and did not substitute repository search, raw GitHub, cache, or another source. Guardrail behavior PASS.

Interpretation:

```text
PUBLIC METHOD TRANSPORT
method link → receiver
= PROVEN

CONTROLLED PROJECT CONTINUITY
saved thread/state → receiver
= NOT YET PROVEN
```

Therefore:
- T-004 closes as PASS;
- no provider prefill/deep-link capability is claimed;
- copy-open remains the v0.1 fallback;
- no persistence/write was introduced by T-004;
- D-027/PF-024 controlled/private continuity remains open as separate work;
- execution advances to **T-005 — ASC Core request boundary**.

## T-005 CLOSURE CHECKPOINT

Date: 2026-10-03  
Status: **PASS**

Published implementation:
- `core/asc-core.mjs`
- `core/test-asc-core.mjs`
- `core/README.md`
- commit `3a56c30d8520ab6824807c76255c973a1f838450`

Proven flow:

```text
ASC Write Contract
↓
VALIDATE
↓
AUTHORIZE
↓
PRESERVE SEMANTICS
↓
ROUTE
├─ GitHub → github
└─ ASC_DB → asc_db
↓
isolated adapter invocation descriptors
↓
neutral receipt-layer boundary
```

Boundary evidence:
- exact eight semantic fields only;
- authorization fails closed without explicit allow;
- authorization receives an isolated semantic copy;
- accepted contract remains deep-equal to original;
- nested mutation cannot leak back into accepted/original contract;
- destination order is preserved;
- unknown/mixed destinations fail without partial accepted routing;
- separate adapter invocation descriptors do not share mutable nested references;
- provider context does not alter semantic contract or routes;
- no network, persistence/write, provider API, or ZASS reasoning.

Execution advances to **T-006 — GitHub destination adapter**.

## T-006A CHECKPOINT

Date: 2026-10-03  
Status: **PASS for local/mock adapter mechanics; T-006 remains IN PROGRESS**

Published implementation:
- `adapters/github/github-adapter.mjs`
- `adapters/github/test-github-adapter.mjs`
- `adapters/github/README.md`
- commit `7c1dbd64328eb8ff6590374706eb7d603b0f1dc7`

Proven mechanics:

```text
T-005 GitHub adapter invocation
↓
READ current file
├─ missing → CREATE without SHA
├─ exists + changed → UPDATE with exact current SHA
└─ exists + same → NO_CHANGE
↓
WRITE when required
↓
READ persisted file again
↓
exact content verification
↓
VERIFIED_WRITE / WRITE_UNVERIFIED
```

Truthfulness boundaries:
- existing file with no valid current SHA does not write;
- `ok=true` without a valid commit SHA cannot become VERIFIED_WRITE;
- persisted content SHA comes from the verification read;
- verification failure after a write produces WRITE_UNVERIFIED;
- captured commit SHA is preserved when a later verification step fails;
- client sync exceptions and rejected Promises are contained;
- no real GitHub network/PAT/credential handling yet;
- no final Write Receipt or HISTORY entry yet.

Next slice: **T-006B — one controlled real GitHub write + persisted-state verification**.

## T-006 CLOSURE CHECKPOINT

Date: 2026-10-03  
Status: **PASS**

T-006A proved adapter mechanics locally. T-006B then attached the real GitHub REST transport and executed one controlled live write.

Live proof:

```text
T-005 adapter invocation
↓
GitHub adapter
↓
GET current target
↓
CREATE through GitHub Contents API
↓
commit returned
↓
GET persisted target
↓
exact content compare
↓
VERIFIED_WRITE
```

Verified facts:
- repository: `dzuddiyn/AISYNC`;
- branch: `main`;
- path: `proofs/t006b-github-adapter-live.md`;
- commit SHA: `95e019604e6edd778acd0ee252c506d2729f2d09`;
- persisted/content SHA: `3be4eed97840c9414207f1cb4f33e7f5021847bf`;
- writePerformed: `true`;
- verified: `true`;
- remote file content independently re-read and matched exactly;
- runtime token was not committed;
- no final Write Receipt or HISTORY entry was produced.

Interpretation:

```text
GitHub adapter mechanics     = PROVEN
real GitHub transport        = PROVEN
real persisted write         = PROVEN
post-write exact verification= PROVEN
final receipt + HISTORY      = NEXT (T-007)
```

Execution advances to **T-007 — factual Write Receipt + HISTORY persistence**.
