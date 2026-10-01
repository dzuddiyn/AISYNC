# ASC Apps Script Web App — T-004

Status: IMPLEMENTED SKELETON — LIVE DEPLOYMENT TEST PENDING

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

1. read `#asc=...` from the current URL;
2. immediately store the fragment in `sessionStorage`;
3. if a later navigation/reload returns without the fragment, restore it from `sessionStorage`;
4. decode the T-002 envelope;
5. render the semantic contract as preview;
6. do not expose any write function.

This protects the request across same-tab navigation after the ASC page has loaded. The actual Google sign-in redirect behavior still requires a deployed owner-only Web App test before T-004 can be marked fully PASS.

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
