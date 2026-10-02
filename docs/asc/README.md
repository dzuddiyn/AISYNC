# GitHub Pages ASC Front Door Proof

Status: LIVE PROOF PASS — D-022 preserve/auth/replay verified.

Target public URL after GitHub Pages deployment:

```text
https://dzuddiyn.github.io/AISYNC/asc/
```

Protected ASC preview URL:

```text
https://script.google.com/macros/s/AKfycbwueOtAmw_QKpWGfHHuX-dss4TSpyhnRGLj4Y6LcEW3KR2f4tAROR8ECjlCVP1JuEm07w/exec
```

## Purpose

This static receiver/front door proves the D-022 original-tab preservation flow after the public Apps Script front door lost the incoming fragment before it could be read.

The page accepts `#asc=<payload>` directly from `window.location.hash`, stores the complete fragment in `sessionStorage`, and restores it when the URL returns without a fragment.

## Flow

```text
public GitHub Pages front door#asc=<payload>
        ↓
preserve complete fragment in sessionStorage
        ↓
SIGN IN opens protected ASC base URL in a new tab
        ↓
user returns to the original tab
        ↓
CONTINUE appends the stored fragment
        ↓
protected preview URL#asc=<payload>
```

SIGN IN never receives the fragment, payload, or a query-string copy of the payload. The front door does not infer popup failure from the return value of `window.open` when `noopener` is used; it leaves a valid CONTINUE state intact and shows a neutral return-and-continue message. The page performs no persistence and contains no CONFIRM & SYNC, GitHub/Sheets write, or DUMP/DECIDE/DESIGN routing logic.

## Local verification

Run only this proof test:

```text
node docs/asc/test-front-door.mjs
```

The test covers fragment capture, sessionStorage restoration, the clean protected sign-in URL, `noopener` sign-in behavior when `window.open` returns `null`, exact replay URL construction, and absence of persistence/write/routing functions.


## Live verification — 2026-10-02

Result: **PASS**

Verified in an Incognito session:

```text
GitHub Pages /asc/#asc=<payload>
        ↓
pending request detected
        ↓
SIGN IN opens protected Apps Script base URL in a new tab
        ↓
Google authentication
        ↓
return to original GitHub Pages tab
        ↓
CONTINUE remains enabled without refresh
        ↓
protected /exec#asc=<stored-payload>
        ↓
authenticated preview renders D-028 TEST_ONLY payload
        ↓
NO WRITE
```

The first live attempt exposed a false popup-failure state because `window.open(..., 'noopener')` may successfully open a new tab while returning `null`. The regression fix stopped using that return value as proof of failure, preserved `noopener`, and kept a valid CONTINUE state intact.

This proof validates the D-022 original-tab preservation/replay slice only. Provider selection, intent routing, method selection, and AI handoff remain later T-004 work.
