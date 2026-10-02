# GitHub Pages ASC Front Door Proof

Status: LIVE T-004 routing proof PASS; actual provider handoff pending.

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

## Routing proof

The user can enter a natural first message, select one required proof provider (`ChatGPT`, `Gemini`, or `Copilot`), and receive a visible route suggestion. The route can be explicitly overridden and the active route remains visible.

The deterministic proof router uses only small Malay/English cue matching:

- unclear, casual, or scattered input -> `DUMP`;
- choice or comparison input -> `DECIDE`;
- build, create, or design input -> `DESIGN`.

The active route maps to the public method gateway as follows:

```text
DUMP   -> ZASSPILL     -> https://dzuddiyn.github.io/AISYNC/method/zasspill/my/
DECIDE -> ZASSELECTION -> https://dzuddiyn.github.io/AISYNC/method/zasselection/my/
DESIGN -> ZASSIMPLE    -> https://dzuddiyn.github.io/AISYNC/method/zassimple/my/
```

The user draft, selected provider, and explicit route override are stored only in `sessionStorage`. PREPARE HANDOFF creates a local preview containing provider, route, method, gateway URL, and draft. It does not open a provider, send a request, or persist anything outside sessionStorage.
## Local verification

Run only this proof test:

```text
node docs/asc/test-front-door.mjs
```

The test covers the existing D-022 fragment capture/restoration and replay flow, provider requirement/options, sample route suggestions, exact method mappings, explicit override preservation, handoff readiness/preview, no provider/network call, and absence of persistence/write functions.


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

This proof validates the D-022 original-tab preservation/replay slice and the local T-004 provider-selection/routing/method-preview slice. Actual provider handoff remains later T-004 work.


## Live routing verification — 2026-10-02

Result: **PASS**

Live browser proof verified:

- provider selection is mandatory and limited to ChatGPT / Gemini / Copilot;
- `aku nak sembang pasal idea kebun aku` → DUMP;
- `bandingkan ChatGPT dengan Gemini untuk projek ini` → DECIDE;
- `bina architecture untuk sistem AISYNC` → DESIGN;
- DUMP → ZASSPILL → `https://dzuddiyn.github.io/AISYNC/method/zasspill/my/`;
- DECIDE → ZASSELECTION → `https://dzuddiyn.github.io/AISYNC/method/zasselection/my/`;
- DESIGN → ZASSIMPLE → `https://dzuddiyn.github.io/AISYNC/method/zassimple/my/`;
- explicit route override remained active after the draft changed;
- PREPARE HANDOFF showed only provider, route, method, public Method Gateway URL, and user draft;
- no provider website opened;
- no network call or persistence/write occurred.

This closes the provider-selection / intent-routing / method-mapping proof slice. Actual provider handoff remains the next T-004 slice.
