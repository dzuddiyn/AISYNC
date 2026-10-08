# AISYNC Interaction Continuity — Future Work

**Status:** LOCKED FUTURE WORK — NOT ACTIVE  
**Date:** 2026-10-08  
**Origin:** moved from ZASS evolution candidate CR-016  
**Owner:** AISYNC / ASC future continuity architecture

## 1. Problem carried forward

A real-world ZASSPILL portability test showed that semantic thread context could survive a handoff while the intended interaction mode did not.

Observed example:

- user = instinct-based forecaster;
- AI = evidence-based challenger;
- relationship = friendly rival;
- tone = casual/playful but factually rigorous;
- receiving AI preserved subject/context but became overly formal.

## 2. Ownership decision

The requirement is split deliberately:

```text
ZASSPILL
→ may define an optional thread-level interaction contract

AISYNC / ASC
→ transport + verify + inject that contract between receivers

provider-local personalization
→ remains outside portable authority unless user intentionally introduces it
```

Because the runtime continuity mechanism belongs to context assembly and transport, active future-work ownership now sits in AISYNC rather than the ZASS evolution backlog.

## 3. Future object

Working architectural term:

**Interaction Continuity**

Portable object:

**Thread Interaction Contract**

User-facing phrase may remain:

**How we work together**

The minimum candidate remains:

```text
THREAD-LEVEL
OPTIONAL
EXPLICIT USER AUTHORITY
```

## 4. Privacy boundary

Do not export hidden provider profile/memory/persona merely to reproduce style.

Provider-specific personal memory/profile/private context stays outside portable authority unless the user intentionally introduces that information into the thread.

## 5. Future field gate

Before implementation or any ZASSPILL method change, future AISYNC/ASC work should prove at least:

1. one forecasting-style continuity handoff across two compatible receivers;
2. one non-forecast interaction mode;
3. explicit current user override;
4. provider-memory isolation;
5. acceptable packet/token overhead;
6. factual transport/verification without hidden personalization assumptions.

## 6. Non-goals now

This future-work record does not:

- activate an AISYNC implementation task;
- modify current T-020/T-021 scope;
- modify ZASSPILL v1.0.0;
- authorize global/session/project inheritance;
- authorize hidden persona export.

## 7. Lineage

Original ZASS candidate:

```text
CR-016 — ZASSPILL Interaction Continuity
```

The ZASS registry now keeps only a lineage tombstone. Active future-work ownership is this AISYNC record.
