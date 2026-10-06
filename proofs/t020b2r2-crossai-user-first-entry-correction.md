# T-020B2R2 — CrossAI User-First Entry Correction

Date: 2026-10-06  
Status: LOCAL PASS — MERGE / DEPLOY / OWNER RECHECK PENDING

## Trigger

Owner review of protected production v52 showed that T-020B2R still solved the wrong user journey.

The visible DUMP screen required a new beta participant to enter the existing AISYNC project Workspace. That mixed the internal AISYNC implementation/test project with the CrossAI product experience.

The owner restated the original product journey:

```text
public CrossAI landing
→ type naturally
→ choose AI provider
→ GO
→ if not authenticated: Google sign-in
→ return to the same CrossAI start experience with draft preserved
→ GO again
→ CrossAI saves a new conversation
→ route by intent:
   casual / unclear → DUMP / ZASSPILL
   choose / compare → DECIDE / ZASSELECTION
   build / design → DESIGN / ZASSIMPLE
→ if intent conflicts, ask the user on the protected next page
→ provider handoff
```

This is not a new architecture invention. It restores the already-LOCKED D-020 / D-021 / D-022 behavior:

- provider selection before GO;
- login-before-routing;
- user-first natural-language start;
- CrossAI handles routing/method details behind the surface;
- draft state survives authentication;
- DUMP is the safe default when intent is not clearly DECIDE or DESIGN.

## Root cause

T-020A2/T-020B2R overfit the beta proof around the existing AISYNC project Dashboard.

That Dashboard is valid as an operator/project workspace but is not the correct blank-account product landing.

The product boundary is corrected to:

```text
CrossAI
= public/user-facing product

AISYNC / ASC
= internal transport, persistence, continuity and operator infrastructure
```

A new beta user must not need to know the AISYNC project exists.

## Correction

### 1. Public CrossAI landing restored

`docs/asc/` is again the primary blank-account entry.

Visible first-use surface:

- natural-language text box;
- AI provider choice;
- one GO action;
- no project selection;
- no AISYNC project card;
- no ZASSPILL/ZASSELECTION/ZASSIMPLE terminology;
- no route inference before the authentication gate.

The old pending `#asc` SAVE replay remains available only when an actual pending SAVE fragment exists.

### 2. Enrollment returns to CrossAI, not Dashboard

After a beta invitation is claimed, the user-facing action is now:

`OPEN CROSSAI`

and points to the public CrossAI landing.

The internal operator Dashboard remains available separately.

### 3. D-022 auth preservation restored

First GO:

- validates non-empty draft + provider;
- stores draft/provider/start identity in browser state;
- opens the protected CrossAI auth check in a new tab;
- leaves the original public CrossAI tab holding the draft.

Protected auth success posts a lightweight `crossai-auth-ready` message back to the opener.

The user returns to the original CrossAI tab and presses GO again.

### 4. Protected start occurs only after auth

Second GO sends an encoded fragment to:

`?view=crossai-start#start=...`

Because the user has already passed the auth gate, the protected Apps Script page can safely read the fragment with `google.script.url.getLocation()`.

The public page does not perform DUMP/DECIDE/DESIGN routing before login.

### 5. New conversation is saved before provider handoff

The protected runtime derives a stable private CrossAI namespace from the signed-in beta participant identity.

It creates a new private continuity thread before opening the external AI.

The initial chat therefore exists in CrossAI even though the user has no pre-existing GitHub project or AISYNC project row.

This is private conversation continuity, not a GitHub project-artifact write.

### 6. Intent routing is protected and user-first

Protected routing rules:

- clear choice/compare intent → DECIDE;
- clear build/design intent → DESIGN;
- casual/unclear intent → DUMP;
- conflicting DECIDE + DESIGN signals → ask the user to choose on the protected start page before the thread is created.

The protected page asks using human language:

- Just talk / casual
- Choose / compare
- Build / design

Method names remain hidden from ordinary first use.

### 7. Provider return saves private CrossAI continuity

The handoff supports:

- `SAVE TO CROSSAI`
- `MOVE TO ANOTHER AI`

The provider returns the existing bounded `ASC_METHOD_RESULT` envelope.

For this blank-account conversation path, the user pastes that result back into the protected CrossAI start page and presses `SAVE CHECKPOINT`.

The checkpoint updates the user's private CrossAI continuity with optimistic revision checks.

It does **not** claim a GitHub/project-artifact SAVE.

This aligns with the candidate route-specific storage direction already recorded in `docs/ASC_ROUTE_STORAGE_MODEL_CANDIDATE.md`: DUMP continuity may remain ASC-native, while durable DECIDE/DESIGN artifact storage can be promoted separately later.

## Files

New protected user surfaces/runtime:

- `apps-script/CrossAiAuth.html`
- `apps-script/CrossAiStart.html`
- `apps-script/CrossAiStart.gs`

Updated user entry:

- `docs/asc/index.html`
- `docs/asc/client.js`
- `apps-script/BetaEnroll.html`
- `apps-script/Code.gs`

## Local verification

PASS on owner workstation:

- `node docs/asc/test-front-door.mjs`
- `node apps-script/test-crossai-start.mjs`
- `node apps-script/test-crossai-routing.mjs`
- `node apps-script/test-dashboard-continuity.mjs`
- `node apps-script/test-beta-access.mjs`
- `git diff --check`

Proven by focused tests:

- public front door has no pre-login method routing;
- draft/provider are preserved;
- legacy pending SAVE replay remains;
- ambiguous intent asks before thread creation;
- blank-account conversation creates a user-isolated private thread;
- provider handoff carries no bearer token;
- returned checkpoint can advance private continuity without a GitHub project dependency;
- beta enrollment points to public CrossAI landing;
- existing project-linked Dashboard continuity tests remain PASS;
- beta access security tests remain PASS.

## Gate

T-020B2 remains HOLD.

Before any external participant is counted:

1. merge this correction to canonical `main`;
2. publish the public CrossAI landing;
3. deploy protected Apps Script from merged source;
4. owner recheck the exact blank-account journey from beta enrollment;
5. confirm no AISYNC project knowledge is required;
6. confirm a new private CrossAI conversation exists before provider handoff;
7. confirm ambiguous intent asks the user rather than silently forcing a conflicting route;
8. confirm provider checkpoint returns to the same CrossAI conversation.

Conclusion: **T-020B2R2 LOCAL PASS / DEPLOYMENT PENDING.**
