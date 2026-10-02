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


## T-008A confirm/sync UI — LOCAL PASS

The protected preview now renders a CONFIRM & SYNC control, a write-receipt card, and a main-ASC-UI return link. The client builds a request-bound confirmation only from an explicit click, redirects only when the server returns `SYNCED` with a verified SUCCESS receipt and `HISTORY_PERSISTED`, and otherwise keeps the pending request and a visible FAILED state.

`Code.gs` keeps `writeEnabled=false` and `confirmAndSync()` fails closed with `SYNC_RUNTIME_NOT_BOUND` until T-008B binds `flow/confirm-sync.mjs` into the Apps Script runtime. No live deployment of this version has been tested.

```text
node apps-script/test-confirm-ui.mjs
```


## T-008B Apps Script runtime binding — LOCAL PASS (not deployed)

Project files for the confirm-sync web app:

```text
appsscript.json   owner-only web app manifest (unchanged)
Code.gs           doGet, bootstrap, confirmAndSync, getConfirmSyncResult, TEST_ONLY policy
RuntimeShims.gs   Utilities-based Buffer/atob/TextDecoder shims + UrlFetchApp fetchImpl
AscRuntime.gs     GENERATED bundle: transport, Core, GitHub adapter, REST client, receipts, flow + History.gs verbatim
Index.html / Client.html
```

Local-only files (do not push to Apps Script): `build-runtime.mjs`, `test-*.mjs`, `README.md`.

- `AscRuntime.gs` is produced mechanically by `node apps-script/build-runtime.mjs` from the existing ES-module owners; `--check` fails if it is stale. No Core/adapter/receipt/flow semantics are rewritten.
- GitHub transport reuses `createGitHubRestClient` with a UrlFetchApp-backed `fetchImpl` restricted to `https://api.github.com/` (`muteHttpExceptions`, no redirects).
- HISTORY persistence reuses `History.gs` `appendHistory`; its `{ ok: false }` result is surfaced as failure by the T-008A strict writer bridge.
- Destination policy is the owner-locked TEST_ONLY target only: `dzuddiyn/AISYNC`, `main`, `proofs/t008-confirm-sync-live.md`. Authorization additionally requires owner session, `Record ID` prefix `TEST_ONLY_`, and `Destination: ["GitHub"]`.
- Script Properties: `GITHUB_TOKEN` (required; never returned, logged, or hard-coded) and `ASC_MAIN_UI_URL` (accepted only if it starts with `https://sites.google.com/`).
- The reused flow is async; `confirmAndSync` returns `RESULT_PENDING`, the settled result is stored in the owner's user cache, and the client fetches it via `getConfirmSyncResult`. A missing result is shown as FAILED/unknown, never success.

```text
node apps-script/build-runtime.mjs --check
node apps-script/test-apps-script-binding.mjs
node apps-script/test-confirm-ui.mjs
```

