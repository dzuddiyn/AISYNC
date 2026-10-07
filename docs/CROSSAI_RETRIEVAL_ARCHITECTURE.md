# CrossAI Retrieval Architecture — Future Direction

**Status:** LOCKED FUTURE ARCHITECTURE DIRECTION  
**Date:** 2026-10-07  
**Owner:** Project Owner  
**Scope:** Future ASC/CrossAI retrieval architecture after Production v1 critical-path acceptance  
**Critical-path effect:** NON-BLOCKING for current T-020 Human Closed Beta and T-021 Production v1 Release

## 1. Purpose

CrossAI must not treat memory persistence as sufficient by itself.

> **Memory that cannot be retrieved reliably is operationally weak; retrieval that ignores semantic authority is unsafe.**

The future retrieval architecture therefore separates:

- semantic meaning and continuity authority;
- canonical persisted memory;
- derived retrieval infrastructure;
- retrieval intelligence;
- minimum-context assembly for a target AI.

This direction refines the existing PF-087 topic/temporal retrieval candidate without changing frozen ZASSPILL v1.0 semantics.

## 2. Locked layered architecture

~~~text
LAYER 0 — ZASSPILL v1.0
Semantic Memory Contract
truth / thread / current / superseded
lineage / revision semantics / privacy
            │
            ▼
LAYER 1 — ASC Canonical Memory
thread_id
revision
semantic events
lineage
tombstone
authority
authorization
            │
            ▼
LAYER 2 — Retrieval Substrate Interface
          PLUGGABLE
            │
     ┌──────┼──────┬─────────┐
     ▼      ▼      ▼         ▼
 Native   Cognee Graphiti    Mem0
 ASC              / Zep
     └──────┼──────┴─────────┘
            ▼
LAYER 3 — ASC Retrieval Intelligence
exact-ID
authorization filtering
metadata / lexical retrieval
semantic candidate generation
temporal reasoning
graph relationships
reranking
ambiguity detection
canonical verification
            │
            ▼
LAYER 4 — Context Assembly
minimum relevant context
provenance
token budget
current-state verification
            │
            ▼
         Target AI
~~~

## 3. Authority boundary

LOCKED:

> **ZASSPILL defines semantic memory meaning. ASC Canonical Memory holds persisted continuity authority. Retrieval substrates are derived helpers only.**

No external retrieval/memory provider may become authority over:

- Current Thread Records;
- thread identity;
- revision/event lineage;
- current vs superseded semantic meaning;
- tombstones/deletion authority;
- confirmed decisions;
- GitHub-backed canonical project artifacts where applicable;
- factual SAVE/receipt state.

A retrieval result is evidence for candidate selection, not semantic truth.

~~~text
retrieval result ≠ authority
similarity score ≠ truth
graph edge ≠ user confirmation
provider memory ≠ portable authority
~~~

## 4. Pluggable retrieval substrate

Future ASC should expose one stable retrieval-substrate boundary so the underlying engine may be replaced without changing Layers 0, 1, 3, or 4.

Candidate providers:

1. **Native ASC** — control baseline.
2. **Cognee** — first external candidate.
3. **Graphiti / Zep** — second external candidate.
4. **Mem0** — third external candidate / simplicity benchmark.
5. PostgreSQL + pgvector, Qdrant, or equivalent remain valid lower-level implementation options.

The provider boundary should support the logical capabilities needed for:

- indexing/updating derived retrieval material;
- removal/invalidation;
- lexical/semantic/graph/temporal candidate retrieval where supported;
- rebuild from canonical authorized state;
- health/freshness reporting.

Exact API shape remains future implementation design.

## 5. Why Native ASC remains the baseline

Native ASC is the required control condition.

It establishes the minimum acceptable behavior using canonical ASC/ZASSPILL contracts without depending on an external memory framework.

External providers must prove measurable value over this baseline rather than being adopted because a demo is attractive.

## 6. Retrieval bake-off gate

Provider selection requires a common comparative proof using the same sanitized or synthetic canonical corpus and the same query set.

Minimum evaluation categories:

| Test | Required question |
|---|---|
| Current fact retrieval | Does it find the current authoritative meaning? |
| Superseded trap | Does it avoid promoting stale/superseded meaning? |
| Temporal query | Can it recover relevant prior state without confusing it with current truth? |
| Relationship query | Can it find useful cross-entity/thread relationships? |
| Ambiguous thread | Does it preserve ambiguity instead of selecting falsely? |
| Exact identity | Does known thread identity resolve exactly? |
| Privacy scope | Is unauthorized cross-user/thread leakage prevented? |
| Forget/delete | Are deleted/forgotten semantics excluded correctly? |
| Context efficiency | How little context is needed for a correct answer? |
| Latency | Is retrieval responsive enough for ordinary use? |
| Explainability | Can ASC explain why an item was selected? |
| Operational burden | What deployment, maintenance, migration, cost, and lock-in burden is introduced? |
| Rebuildability | Can the derived index be reconstructed from canonical state? |

The bake-off must distinguish:

- provider retrieval quality;
- ASC canonical verification quality;
- LLM answer quality.

A provider must not receive credit for correctness that came only from downstream LLM guessing.

## 7. Cognee-first experiment order

LOCKED evaluation order:

~~~text
Native ASC baseline
        ↓
Cognee adapter
        ↓
Graphiti / Zep adapter
        ↓
Mem0 adapter
        ↓
compare
        ↓
select default provider or retain Native ASC
~~~

Rationale:

- Cognee is the first candidate because its graph/vector/session-memory direction aligns strongly with the planned CrossAI retrieval problem and self-hosted/open architecture goals.
- Graphiti/Zep is evaluated next for temporal facts, changing relationships, provenance, and graph-oriented recall.
- Mem0 is evaluated as a simple memory-API/hybrid-recall benchmark.
- This order is an evaluation order, not a dependency commitment.

No provider is locked as the production default until the common bake-off passes.

## 8. ASC Retrieval Intelligence

Layer 3 remains owned by ASC even when Layer 2 uses an external provider.

ASC is responsible for:

- exact-ID routing before fuzzy retrieval where identity is known;
- authorization scope enforcement;
- metadata filtering;
- candidate generation orchestration;
- temporal/current-state checks;
- graph-relation use where useful;
- reranking;
- ambiguity preservation;
- tombstone checking;
- canonical revision/current-state verification;
- factual retrieval outcome reporting.

External providers must not silently decide UNIQUE/MULTIPLE/NO-MATCH authority contrary to the ZASSPILL contract.

## 9. Context Assembly

Context assembly is a separate layer from retrieval.

LOCKED principle:

> **Retrieve broadly enough to find the right evidence; send narrowly enough to preserve privacy, relevance, and token efficiency.**

The context assembler should:

- re-read/verify canonical state before sending material to a target AI;
- prefer current authoritative continuity over stale retrieved summaries;
- include only the minimum relevant fields/content;
- preserve provenance/reference back to canonical thread or artifact identity;
- obey authorization and portability boundaries;
- exclude tombstoned/forgotten content;
- avoid copying full user profiles, full event history, or unrelated private continuity;
- enforce a configurable token/context budget;
- surface unresolved ambiguity instead of padding the prompt with competing memories and letting the target AI guess.

Context assembly may differ by target task/provider while semantic authority remains unchanged.

## 10. Derived index lifecycle

LOCKED principle:

> **Canonical memory loss is critical. Retrieval-index loss is recoverable.**

Derived retrieval infrastructure must be:

- disposable;
- rebuildable;
- replaceable;
- versioned/freshness-aware;
- non-authoritative.

Examples include:

- vector indexes;
- graph projections;
- embeddings;
- BM25/full-text indexes;
- topic summaries;
- provider-specific memory representations.

If a derived index is unavailable, stale, corrupt, or rebuilt, ASC Canonical Memory remains authoritative.

## 11. Delete / tombstone / forget propagation

Canonical deletion or privacy erasure takes effect semantically at the ASC/ZASSPILL authority layer first.

~~~text
canonical DELETE / FORGET_CONTEXT
        ↓
authority/tombstone blocks retrieval immediately
        ↓
derived provider/index invalidation
        ↓
provider purge or rebuild
~~~

A slow or failed external-index deletion must not allow deleted content to become retrievable authority.

Canonical tombstone/authorization checks must independently suppress stale provider results until cleanup completes.

## 12. Privacy and sensitive-domain testing

Financial, personal, family, health, and other sensitive conversations are useful field-test domains for retrieval behavior, but production bake-off datasets should prefer:

- synthetic fixtures;
- sanitized/export-minimized samples;
- explicitly authorized private test corpora.

Do not publish private semantic content to a public repository merely to benchmark retrieval.

## 13. ZASSPILL upgrade boundary

ZASSPILL v1.0 remains FROZEN during this retrieval work.

Backend/retrieval limitations do **not** justify changing the ZASSPILL semantic contract.

A future ZASSPILL v1.x change requires field evidence of a semantic-contract defect such as:

- wrong/insufficient thread-boundary semantics;
- inadequate current vs superseded semantics;
- inadequate truth-type semantics;
- inadequate correction/forget/privacy semantics;
- inadequate cross-thread relationship semantics;
- another semantic invariant that cannot be solved in ASC.

Problems such as weak recall, poor ranking, slow search, missing graph traversal, insufficient embeddings, or context-window inefficiency belong to ASC retrieval architecture.

## 14. Compatibility with existing CrossAI future work

This direction refines and remains compatible with:

- PF-087 topic/temporal retrieval;
- PF-089 multi-user ownership;
- PF-090 Google Drive default / GitHub optional;
- PF-091 generic CrossAI Channel Gateway;
- user-owned durable storage;
- channel-neutral semantic memory;
- factual retrieval and SAVE truth;
- future hosted/scalable runtime migration.

No channel, external provider, vector store, or graph store becomes a competing semantic master.

## 15. Critical-path boundary

This future direction is intentionally non-blocking.

Current delivery order remains:

~~~text
T-020 Human Closed Beta
        ↓
T-021 Production v1 Release
        ↓
future retrieval bake-off / adapters when explicitly promoted
~~~

Do not create a new implementation task or interrupt current Production v1 acceptance merely because this architecture direction is locked.

## 16. Lock statement

LOCKED:

~~~text
ZASSPILL v1.0
= semantic contract

ASC Canonical Memory
= persisted continuity authority

Retrieval substrate
= pluggable + derived + rebuildable

ASC Retrieval Intelligence
= provider-independent verification/orchestration

Context Assembly
= minimum authorized relevant context

Native ASC = baseline
Cognee = first external evaluation
Graphiti/Zep = second
Mem0 = third / simplicity benchmark

Provider selection requires comparative proof.
No retrieval provider becomes semantic authority.
~~~
