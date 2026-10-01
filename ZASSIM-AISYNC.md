# AISYNC — ZASSIMPLE Working Record

**Project:** AISYNC  
**Project record version:** 0.4.0  
**Method:** ZASSIMPLE v0.2.4  
**Method source:** `ZASSIMPLE/ZASSIMPLE_MY.md`  
**Lifecycle stage:** DESIGN  
**Status:** BOUNDARY LOCKED — implementation architecture not confirmed  
**Owner:** Project Owner

> AISYNC is shared infrastructure for moving, translating, writing, and verifying meaningful information produced by methods and projects. It is not itself a reasoning method.

---


## ZASSIMPLE METHOD STATE

AISYNC now follows **ZASSIMPLE v0.2.4** behavior.

Surface UX:

```text
DUMP → DISTILL → DECIDE → DESIGN → DO IT → DELIVERED !!
```

Current project stage: **DESIGN**  
Reason: core boundaries and the ASC Link fallback are LOCKED, while implementation architecture remains unconfirmed.

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
| DECIDE / BUILD UI information architecture | PASS | Clear landing and project drill-down | Visual implementation open | Section set locked | D-012 LOCKED |

Current direction: build and validate the minimum ASC v0.1 flow using the locked contract, Google Sites UI, Google Sheets ASC DB, and GitHub first adapter.

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

D-012 | LOCKED  
Decision: Lock the initial **Google Sites ASC UI information architecture**.

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

**Status:** PENDING CONFIRMATION

The boundary is LOCKED, but implementation architecture remains open.

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

Those require later evidence and explicit decisions.

---

## VERSION HISTORY

| Version | Date | Change |
|---|---|---|
| 0.4.0 | 2026-10-01 | LOCKED D-004–D-012: ASC v0.1 framework, Google Sheets as ASC DB, Google Sites as ASC UI, GitHub first adapter, primary integrations, ASC Write Contract v0.1 fields, and DECIDE/BUILD project UI information architecture. Added first-class ACTION_PLAN.md. |
| 0.3.1 | 2026-10-01 | Synced project method from ZASSIMPLE v0.1.6 to official v0.2.4; adopted 6D lifecycle, Stage Pulse/selection-matrix behavior, PROCEED/LOCK + SAVE command surfaces, hidden action-plan lineage, and current DESIGN stage without changing D-002/D-003. |
| 0.3.0 | 2026-10-01 | LOCKED D-003: ASC Link established as the universal write fallback; native integrations remain optional fast paths; user-confirmed web preview/sync flow defined. |
| 0.2.0 | 2026-10-01 | LOCKED D-002: official Method → AI-SYNC → Source of Truth boundary; AISYNC defined as shared transport/write infrastructure reusable by ZASS Full, ZASSIMPLE, ZASSELECTION, Dzuddiyn Library, and other projects. |
| 0.1.0 | 2026-09-29 | Initial AISYNC project record. D-001 defined the temporary AISYNC ↔ Dzuddiyn Library boundary. |
