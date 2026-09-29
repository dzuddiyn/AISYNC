# AISYNC — ZASSIMPLE Working Record

**Project:** AISYNC  
**Project record version:** 0.1.0  
**Method:** ZASSIMPLE v0.1.6  
**Status:** DISCOVERY — architecture not confirmed  
**Owner:** Project Owner

> AISYNC is a working project name. This file records project state; confirmed architecture does not yet exist.

---

## CORE PURPOSE

AISYNC explores portable continuity of important AI conversations across different AI platforms without requiring every AI to have direct GitHub access.

The broader Dzuddiyn Library (DL) may become the home for personal/life information. AISYNC focuses on moving useful AI context into and out of that information environment.

---

## IDEA LOG

I-001 | OPEN  
Idea: AISYNC may eventually become a subsystem or companion of Dzuddiyn Library rather than an isolated life-information system.  
Source: EXPLICIT  
Notes: Relationship is acknowledged, but structural merger is not yet decided.

---

## AGREED CANDIDATES

None currently open from this checkpoint.

---

## OPEN NOTES

Q-001 | OPEN  
Question: Should AISYNC eventually become an internal module of Dzuddiyn Library, or remain a separate protocol/project that uses DL as its information store?

R-001 | OPEN  
Risk: Prematurely merging AISYNC and DL could pull Dzuddiyn Library Phase 1 into schemas, databases, gateways, APIs, automation, Raspberry Pi, MCP, or Home Assistant before capture behavior has been proven.

R-002 | OPEN  
Risk: Project engineering Source of Truth and personal-information Source of Truth are different concerns and must not be silently conflated.

R-003 | OPEN  
Risk: AISYNC may handle sensitive personal information; "sync everything" must not become an implicit design rule.

---

## DECISIONS

D-001 | LOCKED  
Decision: For now, keep AISYNC and Dzuddiyn Library as separate projects with a clear working boundary: **Dzuddiyn Library stores/captures life information; AISYNC transports/synchronizes relevant AI context between AI platforms and that information environment.** Do not merge repositories or architectures yet. AISYNC may later become a DL subsystem or remain a separate protocol/project; that structural choice stays open until evidence from use is available.  
Reason: This preserves the simple Dzuddiyn Library Phase 1 capture model while allowing AISYNC to test AI-context continuity without prematurely expanding either system.  
Locked by: Project Owner  
Date: 2026-09-29

---

## MINIMUM NEXT EXPERIMENT

E-001 | PROPOSED  
One important AI conversation  
→ generate an AISYNC structured sync block  
→ place it manually into `DL_INBOX`  
→ retrieve it manually  
→ provide it to another AI  
→ observe whether useful continuity is preserved.

This is not architecture and does not imply automation.

---

## ARCHITECTURE

**Status:** PENDING CONFIRMATION

No architecture is confirmed. No database, gateway, Raspberry Pi service, MCP server, Home Assistant routing, or automatic merge with Dzuddiyn Library is selected by this decision.

---

## VERSION HISTORY

| Version | Date | Change |
|---|---|---|
| 0.1.0 | 2026-09-29 | Initial AISYNC project record. LOCKED D-001 defining the temporary AISYNC ↔ Dzuddiyn Library boundary; architecture remains open. |
