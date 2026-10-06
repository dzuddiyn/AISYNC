# T-020A2 Ordinary-User UX Readiness Cleanup

Date: 2026-10-06
Status: LOCAL PASS / LIVE DEPLOYMENT PROOF PENDING

## Purpose

Close the four remaining ordinary-user UX findings from T-020A without changing AISYNC authority, persistence, security, continuity, routing semantics, or Beta Access Gate behavior.

This slice is copy/interaction cleanup only. T-020A3 remains the separate canary readiness rerun.

## Findings addressed

### BETA-UX-001 — stale Dashboard identity

Removed the stale primary badge:

`read-only project view`

Replaced with:

`project workspace`

The Dashboard introduction now describes the actual user task: open a project, continue work with an AI, and review SAVE steps before anything is committed.

### BETA-UX-002 — implementation-facing Workspace language

Primary user flow no longer requires the participant to understand:

- private thread;
- `ASC_METHOD_RESULT`;
- `PREVIEW RETURN`;
- `PREPARE ASC SAVE`;
- `ADVANCE THREAD FROM SAVED RESULT`;
- GitHub/Sheets write details in the main continuation path.

The ordinary-user sequence is now expressed as:

1. choose/start a **project conversation**;
2. choose an **AI provider**;
3. choose a **help mode** — DUMP / DECIDE / DESIGN;
4. **PREPARE FOR AI**;
5. copy/open the AI;
6. paste the complete AI result back;
7. **CHECK AI RESULT**;
8. **PREPARE SAVE**;
9. **REVIEW & SAVE**;
10. after verified SAVE, **USE SAVED RESULT TO CONTINUE**.

Technical SAVE semantics remain truthful: preparing/opening does not save, and CONFIRM & SYNC remains the explicit persistence boundary.

### BETA-UX-003 — ambiguous Public Front Door entry

The public Front Door now presents two visibly separate intents:

A. **Continue a SAVE request**
- use only when AISYNC sent the user there to sign in before completing a SAVE;
- buttons: `SIGN IN TO CONTINUE` and `CONTINUE SAVE REQUEST`.

B. **Start a new AI conversation**
- natural first message;
- choose AI provider;
- optionally choose help mode;
- `PREPARE FOR AI`.

The page no longer presents pending-request recovery and new-conversation handoff as one undifferentiated first screen.

### BETA-UX-004 — ROUTE OVERRIDE terminology

Primary label changed from implementation-facing `ROUTE OVERRIDE` to:

`HOW SHOULD THE AI HELP? (optional)`

Options preserve the locked visible route contract while explaining it:

- Automatic suggestion
- DUMP — talk it out
- DECIDE — compare and choose
- DESIGN — structure and build

DUMP / DECIDE / DESIGN semantics are unchanged.

## Progressive disclosure

Technical handoff metadata remains available under a collapsed:

`Technical handoff details`

This preserves inspectability of method/gateway/bootstrap information without making internal transport terms part of the ordinary first-use path.

## Boundaries unchanged

T-020A2 does not alter:

- DUMP / DECIDE / DESIGN routing semantics;
- ZASSPILL / ZASSELECTION / ZASSIMPLE method authority;
- scoped provider handoff payload;
- provider-return validation contract;
- CONFIRM & SYNC;
- GitHub production project/path registry;
- GitHub App credential boundary;
- private continuity authority;
- Beta Access Gate;
- replay/idempotency;
- receipt/HISTORY truthfulness;
- DR, telemetry, secret rotation, or operator controls.

## Local verification

Focused tests:

- Dashboard UI/routing test: PASS;
- GitHub Pages Front Door preserve/login/replay test: PASS.

Full repository regression:

- 33/33 test files PASS;
- `git diff --check`: PASS.

UX closure scan:

- old Dashboard UX terms: 0 hits;
- old Front Door UX terms: 0 hits;
- required first-use cues missing: 0.

Regression tests now explicitly require:

- `project workspace`;
- no `read-only project view`;
- project conversation / help mode / `PREPARE FOR AI`;
- no primary `private thread`, `ASC_METHOD_RESULT`, `PREVIEW RETURN`, `PREPARE ASC SAVE`, or `ADVANCE THREAD FROM SAVED RESULT`;
- separate `Continue a SAVE request` and `Start a new AI conversation` sections;
- `Automatic suggestion` and visible DUMP / DECIDE / DESIGN choices;
- no `ROUTE OVERRIDE` label.

## Remaining gate

T-020A2 is LOCAL PASS only until:

1. source is merged canonical;
2. protected Apps Script production is deployed from the merged source;
3. public Front Door reflects merged source;
4. both live surfaces are inspected for the expected ordinary-user wording.

After T-020A2 LIVE PASS, T-020A still requires **T-020A3 — Canary Readiness Recheck** before any external human journey may count toward T-020.

Conclusion: **T-020A2 LOCAL PASS / LIVE DEPLOYMENT PROOF PENDING.**
