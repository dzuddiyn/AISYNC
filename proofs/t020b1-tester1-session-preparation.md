# T-020B1 — Human Tester #1 Session Preparation

Date: 2026-10-06  
Status: PASS — session contract prepared; no human beta journey counted yet

## Purpose

Prepare the first counted external Human Closed Beta session without changing production behavior, authority boundaries, persistence semantics, or the protected deployment.

T-020B1 is preparation only. It does **not** count as Human Tester #1 completing T-020. The counted journey begins only in T-020B2 when one real external non-developer human uses the live protected production surface.

## Baseline

- T-020A Human Beta Readiness: PASS.
- T-020A1 Beta Access Gate: LIVE PASS.
- T-020A2 Ordinary-User UX Readiness Cleanup: LIVE PASS.
- T-020A3 Canary Readiness Recheck: PASS.
- protected production remains Apps Script v51 `T020A2-ordinary-user-ux`.
- no production redeploy is required for T-020B1.
- repository/product naming follows the locked hierarchy: CrossAI Sync = product, CrossAI = user shorthand, AISYNC = engine/architecture, ASC = internal engineering shorthand.

The exact canonical `main` SHA must be recorded again at T-020B2 session start because documentation-only commits may advance GitHub without changing protected production.

## Tester slot and privacy

Canonical tester slot:

`BETA-TESTER-01`

Eligibility required at T-020B2 start:

- one real human;
- not the project owner;
- not a developer/operator who implemented AISYNC/CrossAI Sync;
- distinct from the T-020A1 access canary;
- distinct from future counted testers;
- uses their own signed-in Google Account.

PII rule:

- do not commit tester email, name, raw temporary-user key, or raw invitation token;
- canonical evidence may record only the pseudonymous tester slot, generated beta participant ID, timestamps, bounded project scope, and factual journey identifiers;
- raw invitation material stays outside GitHub.

## Invitation policy

Create the invitation immediately before the live session, not as part of this preparation commit.

Required invitation:

- label: `BETA-TESTER-01`;
- allowed project IDs: `AISYNC` only;
- invitation lifetime: 72 hours;
- participant access lifetime: 21 days;
- single intended external participant.

The owner sends the invitation privately to the tester. The raw token must not be pasted into an issue, commit, proof file, chat transcript intended as canonical evidence, or screenshot retained as proof.

## Tester task card

Give the tester only this task objective after enrollment:

> Use CrossAI Sync to ask an AI for one practical next step for project AISYNC. Make the useful result become the project's new current context. Stop when you believe the result is safely saved and the project can continue from it.

Do not provide button-by-button instructions unless the tester is genuinely blocked. The product must carry the ordinary journey.

## Observer rule

The owner/operator observes silently.

Allowed before the journey starts:

- confirm the tester is using the intended Google account;
- provide the private invitation;
- state the task objective above;
- explain that the tester should say aloud when something is confusing.

During the core journey:

- do not point to a button;
- do not provide the next UI step;
- do not rewrite the tester's AI prompt;
- do not edit the AI result for the tester;
- do not perform SAVE, CONFIRM & SYNC, reopen, or continuity advance on the tester's behalf;
- do not patch GitHub, Sheets, Script Properties, private continuity, or runtime state to rescue the session.

If intervention is necessary, record it exactly. The session may continue diagnostically, but it is not a clean accepted Human Tester #1 journey if developer/operator intervention is required to complete the core path.

## Core journey under observation

The session should naturally cover:

1. invitation enrollment and protected CrossAI Sync entry;
2. AISYNC project discovery/open;
3. Workspace open;
4. project conversation selection;
5. AI provider selection;
6. help mode / route selection;
7. user-authored task input;
8. PREPARE FOR AI / handoff;
9. external AI round trip;
10. AI result return to CrossAI Sync;
11. result validation;
12. SAVE preparation;
13. Public Front Door continuation;
14. protected preview;
15. explicit CONFIRM & SYNC;
16. terminal factual SAVE receipt;
17. return to main CrossAI Sync;
18. reopen AISYNC;
19. use the verified saved result as the current project context;
20. confirm the next AI conversation would use the newer continuity state.

Exact UI labels may be recorded from the live session; the observer must not substitute hidden developer controls.

## Evidence sheet

Record factual values only:

- tester slot: `BETA-TESTER-01`;
- beta participant ID;
- session start/end timestamp;
- protected deployment version and label;
- canonical `main` SHA at session start;
- canonical `main` SHA at session end;
- project ID;
- provider selected;
- help mode / route;
- thread ID;
- handoff ID;
- source revision;
- result status;
- method-result Record ID;
- SAVE request ID;
- SAVE terminal state/outcome;
- target resource path;
- commit SHA returned by the SAVE;
- independent GitHub read-back result;
- reopen result;
- continuity-advance result;
- operator intervention: none / exact intervention;
- friction observations;
- severity for each finding;
- final T-020B2 result: PASS / FAIL / BLOCKED.

Never record raw invite token, tester email, raw temporary-user identity, secret material, or credentials.

## Friction record

For every meaningful hesitation or failure, capture:

- **Expected:** what the product expected the tester to understand/do;
- **Observed:** what the tester actually understood/did;
- **Friction:** the confusing or broken point;
- **Severity:** BLOCKER / MAJOR / MINOR / COSMETIC;
- **Recovery:** self-recovered / observer intervention / not recovered;
- **Product implication:** fix now / backlog / no change.

Do not treat verbal coaching as product self-recovery.

## Immediate stop conditions

Stop the counted journey and preserve evidence if any of these occur:

- tester sees a project outside their allowed scope;
- privileged owner/admin operation becomes available to the tester;
- SAVE preview targets an unexpected repository/project/path;
- raw credentials, raw invitation identity, or secret material are exposed;
- terminal persistence state is unknown/unverified and the UI implies success;
- the wrong project/thread is advanced;
- canonical data would require developer-side repair to continue safely;
- the tester reaches a state where repeating SAVE blindly could duplicate or corrupt state.

A stopped session can be used for debugging but cannot be counted as an accepted Human Tester #1 completion.

## T-020B2 acceptance gate

Human Tester #1 passes only if the real non-developer participant:

- completes one genuine end-to-end journey through the tester-facing production path;
- requires no developer/operator intervention for the core path;
- causes no project/state loss or wrong-project overwrite;
- obtains a factual verified persistence receipt;
- has the saved artifact independently read back from canonical GitHub;
- returns to CrossAI Sync and reopens AISYNC;
- advances the verified saved result into the correct private continuity state;
- can continue from that newer state;
- exposes no BLOCKER finding.

MINOR/COSMETIC friction may coexist with PASS if it does not require intervention and is captured for backlog. A MAJOR finding requires explicit review before accepting the journey.

## T-020B1 result

The first human-beta session is now operationally prepared:

- pseudonymous tester slot defined;
- eligibility and privacy constraints defined;
- invitation policy defined without generating/storing a live token;
- tester task card frozen;
- silent-observer rule frozen;
- evidence fields frozen;
- stop conditions frozen;
- T-020B2 acceptance gate frozen;
- protected production intentionally unchanged.

Conclusion: **T-020B1 PASS — ready for T-020B2 Live Human Session.**

Next gate: **T-020B2 — Human Tester #1 Live Session**.
