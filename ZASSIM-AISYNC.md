# AISYNC — ZASSIMPLE Working Record

**Project:** AISYNC  
**Project record version:** 0.3.0  
**Method:** ZASSIMPLE v0.1.6  
**Status:** BOUNDARY LOCKED — implementation architecture not confirmed  
**Owner:** Project Owner

> AISYNC is shared infrastructure for moving, translating, writing, and verifying meaningful information produced by methods and projects. It is not itself a reasoning method.

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
GitHub Google Sheets  AI-SYNC DB
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
(GitHub / Google Sheets / AI-SYNC DB)
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

- the AISYNC protocol/schema
- the AISYNC Database technology
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
- ASC Web implementation technology

Those require later evidence and explicit decisions.

---

## VERSION HISTORY

| Version | Date | Change |
|---|---|---|
| 0.3.0 | 2026-10-01 | LOCKED D-003: ASC Link established as the universal write fallback; native integrations remain optional fast paths; user-confirmed web preview/sync flow defined. |
| 0.2.0 | 2026-10-01 | LOCKED D-002: official Method → AI-SYNC → Source of Truth boundary; AISYNC defined as shared transport/write infrastructure reusable by ZASS Full, ZASSIMPLE, ZASSELECTION, Dzuddiyn Library, and other projects. |
| 0.1.0 | 2026-09-29 | Initial AISYNC project record. D-001 defined the temporary AISYNC ↔ Dzuddiyn Library boundary. |
