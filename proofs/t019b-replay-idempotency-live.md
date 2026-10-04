# T-019B Live Replay / Idempotency Proof

Date: 2026-10-04
Status: PASS

## Canonical release

- Implementation merge: PR #40
- Merge commit: `e4f37e652847dc170c0876ab9b246c62cb21c23f`
- Protected Apps Script deployment: v35
- Deployment label: `T019B-replay-idempotency-lifecycle`
- Protected production deployment remained pinned to v35 throughout the live proof.

## Proof boundary

The live proof exercised the production replay/idempotency authorities and configuration:

- real Apps Script Script Properties replay store;
- real Apps Script script lock;
- production project registry;
- production GitHub App installation credential boundary;
- canonical GitHub repository `dzuddiyn/AISYNC`;
- deterministic existing target `records/T016-LIVE-20261003181842.md`.

A temporary owner-only proof deployment was generated from the immutable v35 source plus proof-only wrappers. The protected production deployment itself was not repointed.

## Deterministic live proof

Proof ID:

`T019B-LIVE-DET-20261004-103536-a317023f`

Transport request IDs:

- `T019B-DET-A-20261004-103536-a317023f`
- `T019B-DET-B-20261004-103536-a317023f`

Private evidence filename:

`AISYNC_T019B_LIVE_PROOF_T019B-LIVE-DET-20261004-103536-a317023f.json`

Observed checks:

- replay lifecycle proof: PASS;
- expired current-format marker purged: PASS;
- expired legacy marker purged: PASS;
- active marker retained: PASS;
- new marker stored in current shape: PASS;
- proof-only lifecycle markers cleaned up: PASS;
- request A claimed once: PASS;
- request A marker retained exact `expires_at + 24h`: PASS;
- request A canonical target read returned semantic `NO_CHANGE`: PASS;
- same request A replay returned `REPLAY_REJECTED`: PASS;
- replay skipped destination I/O: PASS;
- replay added no HISTORY row: PASS;
- fresh request B with identical semantic content returned `NO_CHANGE`: PASS;
- request B marker retained exact `expires_at + 24h`: PASS;
- proof requests created no synthetic HISTORY rows: PASS;
- GitHub destination reads: 2;
- GitHub destination PUTs: 0.

## Independent GitHub verification

After the live proof:

- GitHub `main` was still `e4f37e652847dc170c0876ab9b246c62cb21c23f`;
- target blob SHA was still `5427b6cc4aa0c2a87a9532121e1cb8a4bc0a7e22`;
- target content remained exactly the original T-016 production-write proof;
- therefore the live proof created no GitHub commit and performed no duplicate write.

## Harness note

An earlier browser orchestration attempt through the full async `confirmAndSync` callback path did not return deterministically in the temporary harness and is not used as PASS evidence.

The final PASS evidence came from one deterministic no-argument operator proof using the same deployed production replay, authorization, registry, and GitHub App primitives. Full confirm-sync orchestration remains covered by repository regression tests.

## Cleanup verification

After the proof:

- temporary proof deployment was undeployed;
- Apps Script development HEAD was restored and verified 16/16 files;
- temporary deployment ID was absent;
- protected production remained pinned to v35.

Conclusion: **T-019B LIVE PASS**.
