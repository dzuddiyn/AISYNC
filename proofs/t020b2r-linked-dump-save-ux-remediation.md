# T-020B2R — Linked DUMP / CrossAI SAVE UX Remediation

Date: 2026-10-06  
Status: DEPLOYED — OWNER LIVE RECHECK PENDING

## Trigger

During owner preflight immediately before the first counted external T-020B2 human session, the ordinary DUMP path exposed a product-boundary failure. This owner preflight does **not** count as Human Tester #1.

Observed journey:

```text
Dashboard → DUMP → Open ASC Front Door
→ Start a new AI conversation
→ external AI
```

The Front Door appeared to be a normal CrossAI project entry, but that route was actually standalone. It did not create protected project continuity, a project handoff identity, a return/result contract, or a project SAVE bridge.

The external AI therefore correctly produced a standalone ZASSPILL Portable Thread Packet. Refreshing the CrossAI Dashboard could not show that conversation because CrossAI had never created a linked project thread for it.

The same preflight also showed that pressing the Front Door sign-in control without a pending SAVE opened the protected preview in truthful `NO REQUEST` state, but the surrounding UX made that control look like a general SAVE/sign-in action.

## Findings

### BETA-UX-005 — BLOCKER — standalone DUMP looked project-linked

The DUMP landing prominently sent an ordinary user to the static Front Door. Its "Start a new AI conversation" path did not carry:

- project/thread identity;
- `handoff_id`;
- source revision;
- scoped project continuity;
- provider-return contract;
- project SAVE preparation;
- continuity advance.

Result: an ordinary user could successfully chat across providers yet end with no CrossAI project continuity to reopen.

### BETA-UX-006 — BLOCKER — no human provider-transfer / SAVE command

The linked Workspace had the required internal return bridge, but the human-facing provider conversation did not clearly expose a memorable command for:

- saving the current checkpoint back to CrossAI;
- moving the current checkpoint to another AI.

The word "handoff" was also ambiguous because ZASSPILL uses method handoff for DUMP → DECIDE / DESIGN boundaries.

### BETA-UX-007 — MAJOR — pending-SAVE sign-in looked like a general action

On a Front Door visit with no pending `#asc` SAVE request, the visible SIGN IN control could be pressed and would open the protected preview, where the correct result was `NO REQUEST`.

This was truthful technically but confusing as ordinary-user product UX.

### BETA-UX-008 — MAJOR — ZASSPILL packet version label drift

The public ZASSPILL method was v1.0.0, but the Portable Thread Packet template still rendered:

`Method: ZASSPILL v0.1.0`

That mixed the current method version with the historical packet-format version.

## Boundary decision

Do not move CrossAI transport/runtime mechanics into ZASSPILL.

The remediation preserves:

```text
ZASSPILL = continuity meaning / method semantics
CrossAI  = project link / provider transport / return / SAVE / receipt / reopen
```

Standalone Portable Thread Packet remains a valid explicit portability capability. It is no longer presented as if it were the normal CrossAI project-continuity route.

## Remediation

### 1. DUMP landing now prefers linked project Workspace

The DUMP intro now exposes available project Workspace entry points even when the project's indexed `ui_entry` is DECIDE or DESIGN.

The ordinary wording says that a conversation CrossAI should remember must start from a project Workspace.

The static Front Door remains available only as an explicitly labelled standalone/disposable path.

### 2. Workspace exposes human CrossAI commands

A project-linked provider bootstrap now defines:

- `SAVE TO CROSSAI` — checkpoint the useful current state for CrossAI persistence;
- legacy `SAVE` remains accepted;
- `MOVE TO ANOTHER AI` — checkpoint the useful current state back to CrossAI first, then let the user choose another provider from Workspace.

For either command, the receiving AI must return the bounded `ASC_METHOD_RESULT` block and must not claim provider-local/repository persistence.

The user then follows the existing protected path:

```text
Return to CrossAI Workspace
→ CHECK AI RESULT
→ PREPARE SAVE
→ REVIEW & SAVE
→ pending Front Door request
→ CONFIRM & SYNC
→ verified receipt
→ reopen
→ USE SAVED RESULT TO CONTINUE
→ choose another AI if desired
```

No new persistence authority or browser-side writer was added.

### 3. Front Door standalone boundary is explicit

The static Front Door now says:

- "Start a standalone AI conversation";
- standalone is not linked to a CrossAI project;
- it will not appear in Dashboard after refresh;
- it does not have the project SAVE/continuity path;
- use Project Dashboard for remembered / movable conversations.

The pending-SAVE SIGN IN control is disabled when no pending SAVE request exists.

If a real pending SAVE exists, the sign-in guidance also explains that a protected tab may truthfully show `NO REQUEST`; the user returns to the original Front Door and uses CONTINUE SAVE REQUEST to replay the preserved request.

### 4. ZASSPILL version-label correction

Canonical ZASS repository fix:

`ff806c2ec15ddb9d8d29aa6eaca3d6584a273c6d`

Portable Thread Packet now distinguishes:

```text
Method: ZASSPILL v1.0.0
Packet format: Portable Thread Packet v0.1
```

The AISYNC static ZASSPILL Method Gateway snapshot is refreshed to that canonical source commit.

## Local verification

Targeted regression checks on the owner workstation:

- `node apps-script/test-dashboard-ui.mjs` — PASS;
- `node apps-script/test-dashboard-continuity.mjs` — PASS;
- `node docs/asc/test-front-door.mjs` — PASS;
- `node method-gateway/test-static-zasspill-gateway.mjs` — PASS;
- `git diff --check` — PASS.

These checks prove the bounded remediation paths touched here.

A fresh Windows full-suite attempt also exposed an existing generated-runtime newline freshness mismatch in `test-apps-script-binding.mjs`; this remediation does not change the runtime bundle sources. Therefore this proof does **not** claim a fresh 33/33 full-suite result yet.

## Canonical merge and deployment

AISYNC remediation merged through PR #63.

Canonical implementation commit:

`6011aec2b61273b109a3c208cb8d8036eed882ed`

The merged Apps Script source was pushed as exactly 23 tracked production files and frozen as:

`v52 — T020B2R-linked-dump-save-ux`

Immutable v52 was pulled back independently. All 23 canonical production files matched after normalizing line endings.

The existing protected production deployment ID was repointed from v51 to:

`@52 — T020B2R-linked-dump-save-ux`

A post-deploy `clasp deployments` read confirmed that protected pointer remains on v52.

The pre-release Apps Script development HEAD was backed up before staging and restored after the immutable v52 release was created. The protected deployment remains pinned to v52 independently of that development HEAD.

## Public live verification

Fresh public reads after the merge confirmed the GitHub Pages Front Door now contains:

- `Start a standalone AI conversation`;
- `OPEN PROJECT DASHBOARD`;
- disabled SIGN IN control when no pending SAVE exists.

The public ZASSPILL gateway now contains:

- `Method: ZASSPILL v1.0.0`;
- `Packet format: Portable Thread Packet v0.1`;
- no `Method: ZASSPILL v0.1.0` template label.

## Remaining live gate

T-020B2 remains HOLD only for the owner-visible protected journey recheck.

Required owner preflight:

```text
Protected Dashboard
→ DUMP
→ linked AISYNC Workspace
→ choose conversation + AI + DUMP
→ PREPARE FOR AI
→ external AI
→ SAVE TO CROSSAI
   or MOVE TO ANOTHER AI
→ compact ASC_METHOD_RESULT return
→ CrossAI Workspace
→ CHECK AI RESULT
→ PREPARE SAVE
→ REVIEW & SAVE
→ pending Front Door request
→ CONFIRM & SYNC
→ verified receipt
→ return / reopen AISYNC
→ USE SAVED RESULT TO CONTINUE
```

No hidden repair may be used.

Only after that owner recheck passes may the counted Human Tester #1 session resume.

Conclusion: **T-020B2R DEPLOYED / OWNER LIVE RECHECK PENDING. T-020B2 remains HOLD.**
