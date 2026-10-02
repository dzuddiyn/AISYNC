# ASC Apps Script Web App — T-004

Status: PROTECTED PREVIEW LIVE PASS — front-door preservation handled by GitHub Pages

## Purpose

T-004 creates the first Apps Script Web App surface for ASC.

The deployment model is owner-only Google Account access:

- web app access: `MYSELF`
- execution identity: `USER_DEPLOYING`
- Google provides the sign-in/access gate before ASC HTML is served
- ASC does not implement a second password/login database

This matches the Apps Script web-app manifest model documented by Google.

## Files

- `appsscript.json` — V8 runtime + owner-only web-app configuration
- `Code.gs` — `doGet()`, template include helper, preview-only bootstrap state
- `Index.html` — ASC preview shell
- `Client.html` — pending-fragment preservation + decode + preview logic
- `test-pending-request.mjs` — dependency-free state/preview-boundary test

## Pending-request behavior

The client follows this order:

1. read `#asc=...` through Apps Script's `google.script.url.getLocation()` API;
2. immediately store the fragment in `sessionStorage`;
3. if a later navigation/reload returns without the fragment, restore it from `sessionStorage`;
4. decode the T-002 envelope;
5. render the semantic contract as preview;
6. do not expose any write function.

This protects the request after the protected ASC page has loaded. Live testing proved that Google sign-in itself does not preserve the incoming fragment, so pre-auth preservation is handled by the static GitHub Pages front door under `docs/asc/`.

## Explicit non-goal

T-004 performs **no persistence**.

There is no `CONFIRM & SYNC` server write handler yet. GitHub/Sheets writes remain later tasks.

## Deployment test still required

A real Apps Script deployment must verify:

```text
ASC Link with #asc payload
      ↓
Google Account gate
      ↓
owner authenticates
      ↓
Web App loads
      ↓
pending payload available
      ↓
preview rendered
      ↓
NO WRITE
```

Until that live check is performed, T-004 remains implementation-complete but verification-pending.


## Local verification result

`test-pending-request.mjs` result:

- fragment capture: PASS
- sessionStorage restore after simulated fragmentless return: PASS
- envelope decode after restore: PASS
- persistence/write functions exposed: NONE

This does not replace the required real Google Account web-app deployment test.


## Live-test finding: Apps Script IFRAME URL access

The first live deployment showed that reading `window.location.hash` inside the Apps Script HTML iframe does not reliably expose the outer `/exec#asc=...` fragment.

The client now uses the Apps Script-supported `google.script.url.getLocation()` API, which is specifically intended to expose web-app URL parameters and fragments from IFRAME-based Apps Script HTML. Local tests retain a `window.location` fallback.

A new deployment version must be tested before T-004 can be marked PASS.


## Live auth redirect finding

Real deployment verification established two different behaviors:

### Authenticated entry — PASS

```text
already signed in
    ↓
/exec#asc=<payload>
    ↓
google.script.url.getLocation()
    ↓
decode envelope
    ↓
preview D-019
    ↓
NO WRITE
```

### Unauthenticated entry — fragment not preserved

```text
fresh browser
    ↓
/exec#asc=<payload>
    ↓
Google Account sign-in
    ↓
return to /exec
    ↓
#asc payload absent
```

Therefore T-004 must not rely on the Apps Script login redirect to carry the ASC fragment.

The locked D-020 front-door flow is now the implementation path:

```text
ASC front door
    ↓
preserve draft/payload locally
    ↓
launch owner authentication
    ↓
authenticated return
    ↓
replay payload into /exec#asc=<payload>
    ↓
preview
    ↓
NO WRITE
```

The authenticated fragment-reading mechanism itself is verified and should remain unchanged.


## D-022 live preserve/auth/replay proof

Date: 2026-10-02  
Result: **PASS**

Field-proven split:

```text
GitHub Pages static front door
/public /asc/#asc=<payload>
        ↓ preserve in original tab
SIGN IN
        ↓
protected owner-only Apps Script
        ↓ Google auth
return to original static tab
        ↓
CONTINUE
        ↓
protected /exec#asc=<stored-payload>
        ↓
decode + preview
        ↓
NO WRITE
```

The protected preview correctly rendered the D-028 TEST_ONLY contract after replay. No persistence handler was exposed or invoked.

T-004 is not fully complete yet: provider selection, visible/user-overridable DUMP / DECIDE / DESIGN routing, and AI handoff remain to implement.
