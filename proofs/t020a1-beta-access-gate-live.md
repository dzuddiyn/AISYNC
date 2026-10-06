# T-020A1 Beta Access Gate — Live Proof

Date: 2026-10-06
Status: LIVE PASS

## Purpose

Close T-020A readiness blocker BETA-AUTH-001 by proving that an invited non-owner Google-account participant can enter the AISYNC Production v1 closed-beta surface with bounded project scope, while privileged owner operations remain separate and participant access can be revoked immediately.

This proof does not count as one of the minimum three accepted T-020 human beta journeys. It is an access-gate canary.

## Canonical implementation

The Beta Access Gate implementation was merged before this live proof through:

- PR #53 — invited-user access gate;
- PR #54 — Apps Script manifest reconciliation;
- PR #55 — owner-binding fix.

Canonical main at live-proof start:

`80760a56f5639671f932c09d04991be0c46947a2`

A later documentation/future-direction PR (#56) is also included in that canonical main and does not change the live Beta Access Gate behavior.

## Release versions

The Apps Script release sequence used by T-020A1 was:

- v48 — initial Beta Access Gate release;
- v49 — temporary owner-only bootstrap release used only to bind the owner temporary-user fingerprint;
- v50 — corrected final Beta Access Gate release with signed-in external-user access enabled and owner execution preserved.

Before final deployment, immutable v50 was compared against canonical Apps Script source and matched exactly: 23/23 files.

Repository verification before final deployment:

- focused Beta Access Gate security test: PASS;
- full repository suite: 33/33 test files PASS;
- `git diff --check`: PASS.

## Owner identity bootstrap

A temporary owner-only v49 deployment was created only for the owner-binding bootstrap.

Before binding, the owner administration surface reported:

- binding present: no;
- recognized as owner: yes;
- legacy owner proof: yes;
- identity source: `LEGACY_GOOGLE_IDENTITY`.

The owner then executed the bounded owner-binding operation.

After binding:

- binding present: yes;
- recognized as owner: yes;
- legacy owner proof: yes;
- identity source remained `LEGACY_GOOGLE_IDENTITY`.

Only the SHA-256 fingerprint of the temporary active-user key is persisted by the implementation. No raw temporary key is recorded in this proof.

The temporary v49 deployment was then undeployed.

## Protected production deployment

The protected production deployment was repointed to immutable v50 with label:

`T020A1-beta-access-gate-final`

The protected deployment ID remained unchanged.

At the time of the live canary, production therefore used the final signed-in beta access surface rather than the earlier owner-only v46/v48 state.

## Canary invitation

The owner created one single-use canary invitation:

- label: `BETA-CANARY-01`;
- allowed project IDs: `AISYNC` only;
- invitation lifetime: 72 hours;
- participant access lifetime: 21 days.

The UI confirmed the invitation was created and scoped to AISYNC.

The raw invitation token is intentionally omitted from this proof and was not written to the repository.

## Real non-owner enrollment

The invitation was opened in an Incognito Chrome window.

The user signed in with a Google Account that was not the AISYNC owner account.

The enrollment page then reported:

- joined as: `BETA-CANARY-01`;
- allowed projects: `AISYNC`;
- access expiry: `2026-10-27T00:39:51.820Z`.

No developer-side data repair, Script Property edit, GitHub patch, Sheets patch, or private-continuity repair was performed to make the enrollment succeed.

The tester email was not recorded in this proof.

## Scoped production access

Using the same enrolled non-owner session:

1. the protected production dashboard opened successfully;
2. the DESIGN project list exposed the allowed `AISYNC` project;
3. the `AISYNC` project detail opened successfully;
4. the project Workspace opened successfully;
5. the Workspace reached the private-continuity/handoff surface under the beta participant session.

The live dashboard therefore demonstrated project-filtered visibility for the invited participant rather than owner-wide project visibility.

Direct forbidden-project-ID denial and privileged owner-operation denial are covered by the focused Beta Access Gate security tests; this live proof does not claim that those two negative cases were manually exercised in the browser.

## Immediate revocation

The owner administration surface was refreshed after enrollment and showed the active canary participant.

The owner revoked `BETA-CANARY-01`.

The administration surface then showed:

`No beta participants enrolled yet.`

No browser restart or non-owner logout was performed.

The same Incognito non-owner production dashboard was reloaded immediately.

It changed to:

- title: `AISYNC — Access Required`;
- message: `This Google session is signed in, but it is not enrolled for the AISYNC closed beta.`

This proves participant revocation becomes effective on the next protected request and does not depend on deleting browser state.

## Boundary result

T-020A1 proves the closed-beta access boundary required by D-031:

- participant uses their own signed-in Google Account;
- participant access is created only from an owner-issued invitation;
- raw temporary-user identity is not persisted;
- raw invite token is not persisted by the implementation;
- participant scope is bounded to explicit project IDs;
- ordinary dashboard/continuity/SAVE/write paths use the beta actor boundary;
- the existing production project/path registry and GitHub App boundary remain in force;
- privileged DR, telemetry, secret rotation and beta administration remain owner-only in implementation and focused security tests;
- expired/revoked participants fail closed;
- revocation is immediately effective on the next request.

## Remaining T-020A readiness work

Closing BETA-AUTH-001 does **not** make T-020A overall PASS.

The ordinary-user UX findings from `proofs/t020a-human-beta-readiness.md` remain:

- BETA-UX-001 — stale `read-only project view` wording;
- BETA-UX-002 — implementation-facing return/SAVE terminology;
- BETA-UX-003 — ambiguous Public Front Door first-entry copy;
- BETA-UX-004 — `ROUTE OVERRIDE` terminology.

Those must be remediated and the canary readiness contract rerun before the first external participant journey can count toward T-020.

Conclusion: **T-020A1 — Beta Access Gate = LIVE PASS. BETA-AUTH-001 CLOSED.**
