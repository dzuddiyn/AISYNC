# ASC Write Contract v0.1

Status: IMPLEMENTED FOR T-001  
Design lineage: D-011, D-013, DESIGN v1.0

## Purpose

This contract is the canonical semantic handoff between a method/project and ASC.

It contains exactly eight top-level semantic fields:

1. Project
2. Source method
3. Operation
4. Record type
5. Record ID
6. Content/change
7. Lineage
8. Destination

Transport/security metadata does not belong here. Contract version, request identity, expiry, nonce/replay data, integrity/hash data, compression, and link encoding belong to the separate ASC envelope handled by T-002.

## Field contract

| Field | Type | Required | Rule |
|---|---|---:|---|
| Project | string | YES | Non-empty project identifier/name |
| Source method | string | YES | Non-empty source method/project producer |
| Operation | string | YES | Non-empty semantic operation; no destination-specific enum in v0.1 |
| Record type | string | YES | Non-empty semantic record type |
| Record ID | string | YES | Non-empty record identifier |
| Content/change | object OR array OR non-empty string | YES | Proposed semantic record/change |
| Lineage | array<string> | YES | May be empty; items unique and non-empty |
| Destination | array<string> | YES | At least one unique non-empty destination |

Top-level extra fields are rejected. This is intentional: envelope metadata must not leak into the semantic contract.

## Method-agnostic rule

The contract must not encode GitHub file SHAs, Google Sheets row numbers, OAuth state, tokens, retry metadata, timestamps, request IDs, or other destination/transport mechanics.

Destination-specific translation happens after ASC Core accepts the semantic contract.

## Examples

- `examples/valid-zassimple-save.json` — valid real-world ZASSIMPLE SAVE-shaped payload.
- `examples/valid-text-change.json` — valid text-form content/change.
- `examples/invalid-missing-record-id.json` — invalid because a required semantic field is missing.
- `examples/invalid-envelope-leak.json` — invalid because transport metadata appears at semantic top level.
- `examples/invalid-destination.json` — invalid because Destination is empty.

## T-001 pass condition

PASS when:
- a real ZASSIMPLE SAVE is representable with these eight fields;
- required-field failure is mechanically detectable;
- extra transport/destination mechanics are rejected at the semantic boundary;
- no GitHub- or Sheets-specific write logic is required to understand the contract.


## Method Gateway boundary

D-023 introduces a public AI-SYNC Method Gateway/read mirror. It does **not** change this Write Contract.

The ASC Write Contract v0.1 remains exactly the eight semantic fields defined above.

Method-distribution snapshot metadata such as:
- method
- language
- method version
- canonical source repository/path/commit
- sync timestamp
- mirrored Markdown content

belongs to a separate **Method Snapshot Record v0.1** in the public read-plane/registry subsystem.

Reason: method distribution/readability and semantic project writes are different responsibilities. Combining them would weaken the contract boundary established by D-011/D-013.

## Production continuity boundary — D-033

D-033 does **not** change this eight-field schema. It narrows its Production v1 role.

This contract remains the project/artifact write contract for flows that already use it. Frozen ZASSPILL v1 private thread-continuity writes are a separate semantic contract and must not be coerced into this eight-field shape.

In particular:
- a bootstrap candidate may legitimately have no existing `thread_id`;
- ASC must not invent a `Record ID` merely to satisfy this schema;
- continuity semantics such as `thread_id`, `expected_revision`, semantic `request_id`, operation and changes remain governed by the frozen ZASSPILL contract;
- ASC still owns transport, persistence, authorization mechanics and verification.
