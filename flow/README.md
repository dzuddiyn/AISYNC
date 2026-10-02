# ASC Confirm & Sync Flow — T-008A

Status: T-008A LOCAL PASS — runtime-neutral orchestration and client gating tested; Apps Script runtime binding and live proof (T-008B) not yet done.

## Boundary

```text
decoded ASC envelope
        ↓
previewRequest()                      pure, no I/O
        ↓
explicit CONFIRM & SYNC               { confirmed: true, action: 'CONFIRM_AND_SYNC', requestId }
        ↓
ASC Core (T-005)                      validate → authorize → route
        ↓
GitHub adapter (T-006)                read → write → read verification
        ↓
factual receipt (T-007)               createWriteReceipt()
        ↓
HISTORY (T-007)                       persistHistory() — SUCCESS and FAILED receipts
        ↓
redirect decision                     SYNCED → main ASC UI; anything else stays visible
```

`confirm-sync.mjs` composes the existing owners and duplicates none of them. All I/O and configuration are injected: authorization policy/context, server-side `resolveGitHubWriteSpec`, GitHub client, HISTORY writer, clock, `sourceCommit`, and `mainUiUrl`.

## States

| state | redirect | meaning |
|---|---|---|
| `AWAITING_CONFIRMATION` | none | preview, or confirmation missing/not request-bound; zero GitHub/HISTORY calls |
| `FAILED` stage `CORE` / `ROUTING` / `CONFIG` | none | rejected before any write; no receipt, no HISTORY |
| `FAILED` stage `WRITE` | none | adapter outcome READ_ERROR / WRITE_ERROR / WRITE_UNVERIFIED / INVALID_INPUT; FAILED receipt recorded in HISTORY; captured commit IDs preserved without upgrade |
| `FAILED` stage `HISTORY` | none | verified GitHub receipt exists but HISTORY did not persist (thrown or `ok:false`) |
| `SYNCED_REDIRECT_UNAVAILABLE` | none | verified write + HISTORY, but no valid `https://` main ASC UI URL configured |
| `SYNCED` | `mainUiUrl` | verified SUCCESS receipt + HISTORY_PERSISTED |

v0.1 slice limit: only `Destination: ["GitHub"]` is accepted; any other set (including `["GitHub", "ASC_DB"]`) fails closed before writing, so no partial persistence can occur.

## Verification

```text
node flow/test-confirm-sync.mjs
node apps-script/test-confirm-ui.mjs
```

## T-008B binding

Bound into Apps Script by `apps-script/AscRuntime.gs` (generated) — see `apps-script/README.md`. Live owner-confirmed TEST_ONLY proof is still pending.
