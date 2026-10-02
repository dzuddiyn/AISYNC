# ASC Apps Script Web App — T-004 / T-008

Status:
- T-004 PROTECTED PREVIEW — LIVE PASS (front-door preservation handled by GitHub Pages).
- T-008 PREVIEW → CONFIRM & SYNC → RECEIPT → HISTORY → REDIRECT — LIVE PASS for the owner-locked TEST_ONLY destination only; T-008B runtime binding deployed as Apps Script version 3.

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
- `Code.gs` — `doGet()`, template include helper, bootstrap state, T-008B `confirmAndSync` / `getConfirmSyncResult`
- `Index.html` — ASC preview + CONFIRM & SYNC shell
- `Client.html` — pending-fragment preservation + decode + preview + confirm/receipt/redirect logic
- `RuntimeShims.gs`, `AscRuntime.gs` — T-008B runtime binding (see below)
- `DashboardRead.gs`, `Dashboard.html`, `DashboardClient.html` — T-009 read-only dashboard (`?view=dashboard`; see below)
- `test-pending-request.mjs` — dependency-free state/preview-boundary test

## Pending-request behavior

The client follows this order:

1. read `#asc=...` through Apps Script's `google.script.url.getLocation()` API;
2. immediately store the fragment in `sessionStorage`;
3. if a later navigation/reload returns without the fragment, restore it from `sessionStorage`;
4. decode the T-002 envelope;
5. render the semantic contract as preview;
6. perform no write unless the owner explicitly presses CONFIRM & SYNC (T-008).

This protects the request after the protected ASC page has loaded. Live testing proved that Google sign-in itself does not preserve the incoming fragment, so pre-auth preservation is handled by the static GitHub Pages front door under `docs/asc/`.

## T-004 scope

T-004 itself performed **no persistence**. Persistence was added later by T-008, only behind explicit CONFIRM & SYNC (see the T-008 sections below).

## T-004 deployment test (completed)

The real Apps Script deployment verified:

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

This live check passed (see the D-022 live proof below); T-004 is PASS.


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

At that checkpoint provider selection, DUMP / DECIDE / DESIGN routing, and AI handoff were still open; they later passed and T-004 closed as PASS.


## T-008A confirm/sync UI — LOCAL PASS

The protected preview now renders a CONFIRM & SYNC control, a write-receipt card, and a main-ASC-UI return link. The client builds a request-bound confirmation only from an explicit click, redirects only when the server returns `SYNCED` with a verified SUCCESS receipt and `HISTORY_PERSISTED`, and otherwise keeps the pending request and a visible FAILED state.

The T-008A server placeholder was superseded by the T-008B runtime binding below.

```text
node apps-script/test-confirm-ui.mjs
```


## T-008B Apps Script runtime binding — LOCAL PASS + LIVE PASS (Apps Script version 3)

Project files for the confirm-sync web app:

```text
appsscript.json   owner-only web app manifest (unchanged)
Code.gs           doGet, bootstrap, confirmAndSync, getConfirmSyncResult, TEST_ONLY policy
RuntimeShims.gs   Utilities-based Buffer/atob/TextDecoder shims + UrlFetchApp fetchImpl
AscRuntime.gs     GENERATED bundle: transport, Core, GitHub adapter, REST client, receipts, flow + History.gs verbatim
Index.html / Client.html
```

Repository-only files (not part of the Apps Script project): `build-runtime.mjs`, `test-*.mjs`, `README.md`.

- `AscRuntime.gs` is produced mechanically by `node apps-script/build-runtime.mjs` from the existing ES-module owners; `--check` fails if it is stale. No Core/adapter/receipt/flow semantics are rewritten.
- GitHub transport reuses `createGitHubRestClient` with a UrlFetchApp-backed `fetchImpl` restricted to `https://api.github.com/` (`muteHttpExceptions`, no redirects).
- HISTORY persistence reuses `History.gs` `appendHistory`; its `{ ok: false }` result is surfaced as failure by the T-008A strict writer bridge.
- Destination policy is the owner-locked TEST_ONLY target only: `dzuddiyn/AISYNC`, `main`, `proofs/t008-confirm-sync-live.md`. Authorization additionally requires owner session, `Record ID` prefix `TEST_ONLY_`, and `Destination: ["GitHub"]`.
- Script Properties: `GITHUB_TOKEN` (required; never returned, logged, or hard-coded) and `ASC_MAIN_UI_URL` (accepted only if it starts with `https://sites.google.com/`). `getBootstrapState().writeEnabled` is true only when `GITHUB_TOKEN` is configured.
- The reused flow is async; `confirmAndSync` returns `RESULT_PENDING`, the settled result is stored in the owner's user cache, and the client fetches it via `getConfirmSyncResult`. A missing result is shown as FAILED/unknown, never success. Before each attempt the cached result for that request ID is removed (if removal fails the attempt is not started), and cache read/key errors in `getConfirmSyncResult` return FAILED/unknown instead of throwing, so a previous SUCCESS can never be returned for a new attempt.

```text
node apps-script/build-runtime.mjs --check
node apps-script/test-apps-script-binding.mjs
node apps-script/test-confirm-ui.mjs
```

### Live TEST_ONLY proof — PASS

Owner-confirmed run on Apps Script deployment version 3 ("T-008B Apps Script runtime binding") after the owner granted the required Google permissions:

```text
request_id:   TEST_ONLY_T008B_LIVE_20261003_0415
target:       dzuddiyn/AISYNC / main / proofs/t008-confirm-sync-live.md
commit:       fb1da42abaac61d5568548ec254e48c1a1b5aa6b
verification: remote file independently re-read and matched
HISTORY:      row 4, SUCCESS
receipt:      adapter_outcome=VERIFIED_WRITE, write_performed=true, verified=true
redirect:     main Google Sites ASC UI (https://sites.google.com/view/aisync-asc/laman-utama)
```

Limits: this proves the TEST_ONLY destination policy only. It is not a production Record ID → GitHub path mapping; that mapping remains undecided. Failure paths (FAILED/unverified writes never redirect) are proven by the local tests above, not by a live forced failure. Replay/expiry/integrity controls remain T-010.


## T-009A/B/C read-only dashboard — LOCAL PASS (not deployed)

Routing: the default route still serves the T-008 preview / CONFIRM & SYNC page; `?view=dashboard` serves `Dashboard.html`.

- `DashboardRead.gs` — `getDashboardProjects()` and `getDashboardProject(projectId)` read PROJECTS / RECORDS / ACTION_PLAN / HISTORY from the ASC DB using only `openById` → `getSheetByName` → `getDataRange` → `getDisplayValues`. Required headers are matched by name; missing tabs/headers return `TAB_MISSING` / `SCHEMA_INCOMPATIBLE` instead of data. Values are display strings, preserved exactly.
- Method-owned semantics are displayed, not computed: blank `progress_percent` is `NOT_PROVIDED` (null, never 0); a non-blank value is shown as a bar only if it is a plain 0–100 number (optional `%`), otherwise shown raw as not displayable. `latest_update`, stage, and summaries come only from PROJECTS.
- Detail filters RECORDS / ACTION_PLAN / HISTORY by exact `project_id`; duplicate PROJECTS rows are refused rather than picked.
- Every response carries source metadata (`source_artifact`, `source_commit`, `updated_at`) and freshness `UNVERIFIED`; stale index values are shown as stored and are not repaired.
- Project detail renders the seven locked sections: progress bar, progress summary, next Action Plan summary, next stage summary, Action Plan table (ACTION_PLAN), ZASS table (RECORDS), History (HISTORY).

```text
node apps-script/test-dashboard-read.mjs
node apps-script/test-dashboard-ui.mjs
```

Pending: deployment, Google Sites integration, live read proof.
