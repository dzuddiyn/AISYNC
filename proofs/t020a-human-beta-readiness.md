# T-020A Human Beta Readiness Check

Date: 2026-10-05
Status: PASS — readiness closed by T-020A1 / T-020A2 / T-020A3

## Objective

Determine whether AISYNC Production v1 can be handed to a non-developer beta participant with only a URL and a short task objective, without the owner sitting beside the participant to explain each click or performing hidden developer-side repair.

T-020A is a readiness gate only. It does not count as one of the minimum three accepted human beta journeys.

## Acceptance contract

PASS requires all of the following:

1. an invited non-developer can authenticate with their own Google Account;
2. access is restricted by an explicit production allowlist;
3. the ordinary entry path is clear without knowledge of Apps Script, GitHub, ASC contracts, or internal transport terminology;
4. project/thread continuation is understandable from the default Workspace;
5. DUMP / DECIDE / DESIGN remain visible but are explained in ordinary language;
6. provider handoff, return, SAVE, receipt and reopen/continuity have a clear user sequence;
7. no core step requires owner/developer intervention to repair canonical/project state;
8. factual failure/degraded guidance remains visible and does not encourage blind retry.

## Inspection baseline

Canonical main inspected:

`07ce1bf7842a52734ab29a21c4b456f5c3337853`

Protected production remained Apps Script v46 `T019F-secret-rotation`.

Repository regression before this audit remained 32/32 test files PASS with clean working tree.

## Finding BETA-AUTH-001 — BLOCKER

### Current state

`apps-script/appsscript.json` configures:

- web app access: `MYSELF`;
- execute as: `USER_DEPLOYING`.

`Code.gs` still defines the production authorization gate through `ascIsOwner_`, requiring the active/effective user relationship that was appropriate for the earlier owner-only v0.1 proof.

`DashboardContinuity.gs` and other protected ordinary-user operations depend on that same owner gate.

### Required production state

D-031 is LOCKED and requires Production v1 closed beta to use:

- invited human users only;
- minimum three distinct non-developer participants;
- Google Account as the identity gate;
- an explicit production allowlist.

### Readiness result

A MYSELF deployment cannot be given to three distinct beta participants using their own Google Accounts.

Changing only `MYSELF -> ANYONE` is also insufficient because the existing owner/effective-user authorization rule would not become a valid invited-user allowlist.

Therefore the accepted beta cannot start until a bounded Beta Access Gate is implemented and proven.

Severity: **BLOCKER**

## Finding BETA-UX-001 — MAJOR

The current Dashboard badge says:

`ASC · DUMP / DECIDE / DESIGN · read-only project view`

That wording is stale. The default Workspace now supports:

- first private-thread creation;
- scoped provider handoff;
- provider-return validation;
- secure SAVE request preparation;
- explicit private continuity advance from a verified saved result.

The underlying authority boundaries remain controlled, but the surface is no longer truthfully describable as a purely read-only project view.

Severity: **MAJOR**

## Finding BETA-UX-002 — MAJOR

The Workspace exposes implementation-facing language that was useful during owner technical proof but is too demanding for a non-developer closed beta, including:

- `private thread`;
- `ASC_METHOD_RESULT`;
- `PREVIEW RETURN`;
- `PREPARE ASC SAVE`;
- `ADVANCE THREAD FROM SAVED RESULT`;
- detailed statements about GitHub/Sheets writes in the primary journey.

These facts should remain available where needed, but the primary call-to-action sequence needs ordinary-user wording and progressive disclosure.

Severity: **MAJOR**

## Finding BETA-UX-003 — MAJOR

The public ASC Front Door currently combines two different use cases on one first screen:

A. pending protected ASC request recovery after sign-in:
- SIGN IN;
- return to original tab;
- CONTINUE.

B. new-conversation handoff:
- USER DRAFT;
- AI PROVIDER;
- ROUTE OVERRIDE;
- PREPARE HANDOFF.

On a fresh visit with no pending request, the page still prominently explains the pending-request sign-in flow. A first-time tester is not told clearly whether they are starting a new conversation or continuing a prepared SAVE request.

The Front Door is a fallback/new-conversation surface, while the protected Project Workspace is the normal continuation surface. That distinction needs to be visible.

Severity: **MAJOR**

## Finding BETA-UX-004 — MINOR

`ROUTE OVERRIDE` is implementation language.

The visible DUMP / DECIDE / DESIGN contract must remain, but the user control can be phrased as an optional help mode, for example:

- Automatic suggestion;
- DUMP — just talk / unload the idea;
- DECIDE — compare and choose;
- DESIGN — structure and build.

Severity: **MINOR**

## What already passes readiness

The audit did not find a need to reopen the following proven boundaries:

- production GitHub App write authorization;
- explicit protected CONFIRM & SYNC;
- factual receipt/HISTORY semantics;
- replay/idempotency protection;
- degraded/offline truthfulness;
- private continuity authority;
- cross-provider scoped handoff contracts;
- verified saved-result continuity advance;
- backup/recovery/migration safety;
- secret rotation;
- deployment rollback/roll-forward;
- operator runbook.

These remain T-015 through T-019 evidence and are not reimplemented in T-020A.

## Required remediation before first human tester

### Gate 1 — Beta Access Gate — BLOCKER

Implement a closed-beta identity/allowlist mechanism that satisfies D-031 while preserving owner-executed access to the existing private continuity, ASC DB and server-side GitHub App boundaries.

Do not solve this by sharing the owner's Google account, making testers script editors, weakening the GitHub project/path registry, or moving private continuity into a public URL.

### Gate 2 — Ordinary-user copy pass — MAJOR

Change only the first-use wording/labels needed for a non-developer to understand:

- where to start;
- what DUMP / DECIDE / DESIGN mean;
- how to continue a project;
- how to open the AI provider;
- what to paste back;
- when something is merely prepared versus actually SAVED;
- how to continue after a verified SAVE.

Do not hide factual failure/degraded states.

### Gate 3 — Canary rehearsal

After the blocker and major copy fixes, rerun T-020A as an owner-operated canary using the exact instructions intended for a tester.

PASS only if the owner can follow the tester instructions without relying on developer knowledge or hidden state repair.

## Conclusion

**T-020A = BLOCKED / NOT READY FOR HUMAN BETA YET.**

Primary blocker: `BETA-AUTH-001`.

T-020 / AP-014 remains CURRENT, but the first external human beta journey must not begin until the Beta Access Gate is implemented and T-020A is rerun to PASS.


## Post-audit update — 2026-10-06

BETA-AUTH-001 is now **CLOSED** by T-020A1 Beta Access Gate LIVE PASS.

Canonical live evidence: `proofs/t020a1-beta-access-gate-live.md`.

T-020A itself remains **BLOCKED / NOT READY FOR COUNTED HUMAN BETA** because BETA-UX-001 through BETA-UX-004 still require ordinary-user wording/entry remediation followed by the same canary readiness rerun.


## Post-audit update — 2026-10-06 (T-020A2)

BETA-UX-001 through BETA-UX-004 are now **CLOSED** by T-020A2 Ordinary-User UX Readiness Cleanup LIVE PASS.

Canonical live evidence: `proofs/t020a2-ordinary-user-ux-readiness.md`.

Protected Apps Script production is v51 `T020A2-ordinary-user-ux`; the merged public Front Door and protected Dashboard both show the ordinary-user wording and live scans show zero occurrences of the old primary UX terms.

T-020A itself remains **BLOCKED only pending T-020A3 — Canary Readiness Recheck**. No external human journey may count toward T-020 until that canary passes.


## Final readiness closure — 2026-10-06 (T-020A3)

T-020A3 **PASS** completed the owner-operated canary through the exact tester-facing production path on protected v51:

Workspace → Gemini handoff → provider SAVE return block → CHECK AI RESULT → PREPARE SAVE → Public Front Door → protected preview → CONFIRM & SYNC → SAVED / VERIFIED_WRITE → Return to main ASC UI → reopen AISYNC → USE SAVED RESULT TO CONTINUE.

The canary SAVE produced canonical commit `8dc54763e14040658b452bf20adac5d939c3d8e4` and record `records/METHOD-RESULT-01M47F1VDEFB0C45VJ1BZJBG7N.md`; independent Git read-back matched the factual receipt.

No developer-side repair or hidden canonical/private-state patch was required.

Canonical evidence: `proofs/t020a3-canary-readiness.md`.

**T-020A HUMAN BETA READINESS = PASS.** The next counted gate is T-020B — Human Tester #1. The owner canary does not count toward the minimum three beta participants.
