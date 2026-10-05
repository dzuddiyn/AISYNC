# T-019F Live Secret Rotation Proof

Date: 2026-10-05
Status: PASS

## Canonical release

- Implementation PR: #48
- Canonical merge commit: `a6b9921a9700b6f93a2d69ab3e0fb17407c9e424`
- Protected Apps Script production version: v46
- Deployment label: `T019F-secret-rotation`

## Proof boundary

T-019F proves that the production GitHub App private key can be rotated without exposing secret values, while retaining a bounded rollback window and retiring the legacy long-lived read token only after the new GitHub App key is proven healthy.

Raw key material is not recorded in this proof. Evidence uses SHA-256 fingerprints, authentication outcomes, canonical GitHub read-back, sanitized rotation metadata, and deployment state.

## Pre-revocation live proof

The new GitHub App private key was generated in GitHub and staged only in server-side Script Property `ASC_GITHUB_APP_PRIVATE_KEY_CANDIDATE`.

The owner-only temporary proof surface then executed:

1. candidate validation against GitHub App installation auth;
2. first promotion to active;
3. canonical GitHub read using the promoted key;
4. manual rollback to the previous key;
5. revalidation of the candidate;
6. second promotion to active;
7. second canonical GitHub read.

Result: `T019F_PRE_REVOKE_PASS`.

All pre-revocation checks returned true:

- candidate validated before promotion;
- first promotion returned `ACTIVE_VERIFIED`;
- promoted key read canonical GitHub successfully;
- manual rollback returned `MANUAL_ROLLBACK_VERIFIED`;
- candidate revalidated after rollback;
- second promotion returned `ACTIVE_VERIFIED`;
- re-promoted key read canonical GitHub successfully;
- previous key remained retained for external revocation;
- legacy PAT was not touched before finalization;
- all returned surfaces reported `secret_values_exposed=false`.

Observed fingerprints:

- retired/old key: `cda5c2f0f4ee21e31b6fef47d1f5528851864ccc1aa244284ed194342172e369`;
- new active key: `d1e2b2c43d673e4c76b8d22708b8ca0bd6ac773c381b5359658639cae875fc55`.

The second promotion metadata recorded:

- rotation ID: `rot_1ff0f34e-164c-490d-adb6-2a2be7822196`;
- promoted at: `2026-10-05T02:21:56.855Z`;
- verified at: `2026-10-05T02:21:57.402Z`.

Canonical GitHub after the second promotion remained readable at:

`a6b9921a9700b6f93a2d69ab3e0fb17407c9e424`.

## External revocation gate

The old private key was then deleted/revoked in the GitHub App settings while the new promoted key remained active.

The system did not finalize merely from human confirmation. The final proof first attempted authentication using the locally retained previous key and observed:

- status: `OLD_KEY_REVOKED_CONFIRMED`;
- revoked: `true`;
- validation error code: `GITHUB_APP_TOKEN_REQUEST_FAILED`.

This independently confirmed the previous GitHub-side key could no longer authenticate before local previous-secret removal.

## Final live proof

Result: `T019F_LIVE_PROOF_PASS`.

All final checks returned true:

- old-key revocation confirmed by authentication failure;
- rotation finalized;
- previous local secret removed;
- new active key still read canonical GitHub;
- legacy PAT retired or already absent;
- candidate slot empty;
- final metadata truthfully reported `FINALIZED` and `old_github_key_revoked=true`;
- all returned surfaces reported `secret_values_exposed=false`.

Finalization evidence:

- active fingerprint: `d1e2b2c43d673e4c76b8d22708b8ca0bd6ac773c381b5359658639cae875fc55`;
- retired fingerprint: `cda5c2f0f4ee21e31b6fef47d1f5528851864ccc1aa244284ed194342172e369`;
- previous secret removed: `true`;
- finalized at: `2026-10-05T02:26:12.787Z`;
- legacy token retirement: `LEGACY_READ_TOKEN_RETIRED`;
- legacy token present afterward: `false`;
- canonical GitHub read after finalize: `OK`;
- canonical main observed after finalize: `a6b9921a9700b6f93a2d69ab3e0fb17407c9e424`.

## Cleanup

The live proof used temporary Apps Script version v47 and a separate owner-only temporary deployment.

After proof completion:

- temporary v47 deployment was undeployed;
- Apps Script development HEAD was restored to the exact pre-proof snapshot;
- development HEAD restore was independently verified 16/16 files;
- protected production remained pinned to v46 `T019F-secret-rotation`.

Conclusion: **T-019F LIVE PASS**.
