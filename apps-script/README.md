# ASC Apps Script Web App — T-004 / T-008

Status:
- T-004 PROTECTED PREVIEW — LIVE PASS (front-door preservation handled by GitHub Pages).
- T-008 PREVIEW → CONFIRM & SYNC → RECEIPT → HISTORY → SUCCESS RETURN — LIVE PASS for the owner-locked TEST_ONLY destination only; D-030 defines the guaranteed v0.1 return as a user-activated `Return to main ASC UI` link/button, with automatic top-level navigation optional.

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
- `Client.html` — pending-fragment preservation + decode + preview + confirm/receipt/success-return logic
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

The protected preview now renders a CONFIRM & SYNC control, a write-receipt card, and a main-ASC-UI return link. The client builds a request-bound confirmation only from an explicit click. After `SYNCED` with a verified SUCCESS receipt and `HISTORY_PERSISTED`, the return link is exposed and automatic top-level navigation may also be attempted; D-030 makes the user-activated link/button the guaranteed v0.1 return path. Otherwise the pending request stays visible with a factual FAILED state.

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

Limits: this proves the TEST_ONLY destination policy only. It is not a production Record ID → GitHub path mapping; that mapping remains undecided. Failure paths (FAILED/unverified writes never redirect) are proven by the local tests above, not by a live forced failure. Replay/expiry/integrity controls were added later in T-010 (see below).


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


## D-030 successful return behavior — LOCKED / LIVE PROVEN

After a verified SUCCESS receipt and persisted HISTORY, ASC v0.1 must expose a visible user-activated `Return to main ASC UI` link/button. Automatic top-level navigation may still be attempted when the hosting/browser platform permits it, but it is not required for PASS and must not be the only return mechanism. FAILED/unverified/incomplete results stay visibly non-successful.

T-011 live proof established this behavior with owner-issued request `TEST_ONLY_T011_ZASSIMPLE_SAVE_20261002224115`: GitHub commit `50a3372c0540a9db021d0c0518b010836c58f247`, verified persisted payload, HISTORY row 6 SUCCESS, then user-activated return to the main ASC UI.

## T-010 security / replay binding — PASS (live)

- `previewAscRequest({ fragment })` validates the envelope server-side (structure, ≤ 30-minute lifetime, expiry, SHA-256 integrity, owner identity) and returns only safe fields. It never claims replay state and never writes. The client enables CONFIRM & SYNC only when this returns `securityValid` and `writeEnabled` for the same `request_id`; rejected requests are shown as `REJECTED (<code>)`.
- `confirmAndSync` re-validates in order: decode → security/expiry/integrity → explicit request-bound confirmation → owner → atomic replay claim → existing T-008 flow (Core → GitHub verify → receipt → HISTORY → successful return path).
- Replay authority: `LockService.getScriptLock()` + Script Properties key `asc.replay.v1.<sha256(request_id)>` with marker `{state, claimed_at}`. CacheService only delivers results. Already claimed → `REPLAY_REJECTED`; lock/property uncertainty → `REPLAY_STORE_UNAVAILABLE`; both with zero GitHub/HISTORY calls. A confirmed attempt stays consumed even if the write fails; retry needs a new `request_id`. No marker cleanup in v0.1.
- `GITHUB_TOKEN` is read from Script Properties only and never returned, rendered, stored client-side, or logged.

Live proof:
- Apps Script version 6 ("T-010 security and replay controls") is deployed on the existing protected deployment.
- Valid secure request `TEST_ONLY_T010_LIVE_20261002221136` produced a verified GitHub write (commit `62f576194dada61584f07752b17c91ee6865d12c`) and HISTORY row 5 SUCCESS.
- Reusing the same request_id returned `REPLAY_REJECTED` with no second HISTORY row.
- Expired request returned `REQUEST_EXPIRED`; tampered request returned `INTEGRITY_MISMATCH`; both kept CONFIRM & SYNC disabled and produced no HISTORY row.
- T-010 is PASS; T-011 is the next execution task.

## T-012B ZASS CI dashboard read binding — LOCAL PASS

- `ci/zass-ci-status.mjs` is mechanically bundled into `AscRuntime.gs` as the shared factual CI status consumer.
- `DashboardCiRead.gs` exposes `getDashboardZassCiStatus(repository, commitSha)` for the existing Apps Script dashboard server surface.
- The binding performs public GitHub API GET reads only: commit-linked workflow runs, then jobs for the selected `ZASS CI` run.
- Workflow/job identity and status normalization remain owned by the shared consumer; the binding does not implement ZASS rule codes or inspect project files to infer PASS/FAIL.
- No SpreadsheetApp, PropertiesService, CacheService, or GitHub mutation API is used by this read path.
- No dashboard HTML/UI was changed in T-012B.

Local proof:

```text
node ci/test-zass-ci-status.mjs
node apps-script/build-runtime.mjs --check
node apps-script/test-zass-ci-binding.mjs
node apps-script/test-dashboard-read.mjs
node apps-script/test-dashboard-ui.mjs
node apps-script/test-apps-script-binding.mjs
```

Next: T-012C renders the factual commit-linked result in project detail and performs a controlled live read proof.

## T-012C commit-linked ZASS CI project-detail rendering — DEPLOYED / LIVE READ PASS

- `DashboardClient.html` requests CI only from the selected project's existing `github_repo` and indexed `source_commit`.
- The UI renders factual repository, commit, workflow/job identity, status, conclusion, run ID, fetched timestamp, and run URL.
- `NOT_FOUND` is explicitly not represented as PASS; `READ_ERROR` remains visible as an error.
- The seven locked project-detail sections remain unchanged; CI is an additional factual status card.
- Local rendering tests cover SUCCESS / NOT_FOUND / READ_ERROR and confirm no ZASS rule-code logic is present in the dashboard client.
- Apps Script web deployment version 7: `T-012C commit-linked ZASS CI dashboard`.
- Controlled live GitHub read for `dzuddiyn/ZASS-Zero-to-Architecture-Structured-Sprint@7cdbd6818198f22245ebcaf107a3cc87611a3d72` returned `ZASS CI / zass-check`, run `37084823055`, status `SUCCESS`, conclusion `success`.
- No GitHub write, Sheet write, or project mutation was performed by this proof.

Owner-visible proof: PASS — the protected dashboard displayed `dzuddiyn/AISYNC@2e0c773faaa2597a5df72fa77fea42d911bb0412` with `Status: NOT_FOUND`, `Workflow / job: ZASS CI / zass-check`, and explicit text that no matching CI result for the exact commit is not a PASS result. T-012 is complete.

## T-015 private continuity / factual index state — LIVE PASS / DEPLOYED

- `continuity/private-continuity-state.mjs` provides runtime-neutral stable thread identity, authoritative revision reads, matching semantic-event lineage, semantic-request idempotency, optimistic concurrency, explicit bootstrap outcomes, delete/tombstone protection, and a derived thread index without inspecting method-owned semantic fields.
- `PrivateContinuityDriveStore.gs` uses a dedicated private Google Drive JSON file as the Production v1 closed-beta continuity authority. Changed writes use create → verify → Script Property pointer-swap rather than in-place `setContent`; the prior file is retired only after the verified pointer switch.
- `ContinuityState.gs` keeps continuity mutation helpers server-private; T-015 does not add a browser-callable private continuity mutation surface.
- `ProjectFreshness.gs` performs authenticated server-side GitHub reads using `GITHUB_TOKEN` from Script Properties and compares exact `github_repo + source_ref + source_commit` evidence. The token is never returned in freshness evidence.
- Live continuity proof PASS: create/read revision 1, mutation revision 2, duplicate `ALREADY_APPLIED`, stale `REVISION_CONFLICT`, event revisions `[1,2]`, delete `DELETED`, post-delete `THREAD_TOMBSTONED`; independent Drive read-back verified the authoritative tombstone and private/non-shared store/proof files.
- Live freshness proof PASS: AISYNC index `source_ref=main` at commit `2e0c773faaa2597a5df72fa77fea42d911bb0412` was correctly reported `STALE / CANONICAL_HEAD_DIFFERS_FROM_INDEXED_COMMIT` against canonical main `120d2d7042d9adfbacf3f4edea8943deb79c29b7` at proof time. No silent index repair or semantic inference occurred.
- Canonical hotfix PR #11 merged at `7a4c8777c0f79a8e34d29dff8972d0f906e1d3f8`.
- Protected Apps Script production deployment is version 10: `T-015 canonical continuity state verified hotfix`.
- All 22 repository `test-*.mjs` tests PASS after the merged hotfix.
- T-015 is PASS. T-016 Production Write Path is the next/current task.


## T-016 Production write path — PASS / DEPLOYED

- Proof-only TEST_ONLY repository/path authorization is replaced in source by `ProductionWritePolicy.gs` + `production/github-write-policy.mjs`: server-side authorized project registry, deterministic safe Record ID mapping, exact repo/branch/path selection, and owner gate before destination I/O.
- Production write credentials use `GitHubAppAuth.gs`: RS256 GitHub App JWT, short-lived installation token, and installation credentials stored only in Script Properties. The installed GitHub App is scoped to exactly `dzuddiyn/AISYNC` with Contents read/write permission.
- GitHub App manifest bootstrap exposed a real PKCS#1 private-key compatibility issue. The implementation now normalizes PKCS#1 RSA private keys to PKCS#8 server-side before Apps Script signing; a real RSA regression test covers the conversion.
- Optimistic concurrency remains SHA-based through the GitHub Contents API. 409/422 writes are surfaced as `WRITE_CONFLICT`.
- Exact-content idempotency returns `NO_CHANGE` without a second commit.
- Transport failures after a write are not blindly retried. One deterministic reconciliation read yields `VERIFIED_WRITE_RECONCILED`, `WRITE_ERROR` when desired content is confirmed absent, or `WRITE_OUTCOME_UNKNOWN` when reconciliation itself is unavailable.
- Factual receipts preserve `write_performed=true|false|null`; reconciled success does not invent a commit SHA.
- Controlled live owner-confirmed SAVE PASS: request `ASC-T016-20261003181842` wrote `records/T016-LIVE-20261003181842.md` through GitHub App commit `6da32a0a36c74abc2640d55f6195b56217e0e2ca`. Independent GitHub read-back matched exact content; independent HISTORY read-back found one matching SUCCESS row with `verified=true`.
- Temporary GitHub App setup/recovery web routes and temporary deployment were removed after bootstrap proof. Apps Script @HEAD contains only the non-temporary T-016 source.
- PR #13 merged the canonical implementation at `cfbc379408080ee22b4eaf47835455829858b949`; protected Apps Script production is version 17, `T016-production-write-canonical`.
- Final protected-production request `ASC-T016-FINAL-20261003185851` returned `NO_CHANGE`, `write_performed=false`, `verified=true`; HISTORY row 8 matched exactly and GitHub `main` remained at the PR #13 merge commit, proving no duplicate write.
- All 24 repository `test-*.mjs` tests PASS from merged `main`. T-016 is PASS; T-017 is current.

## ZASS SYSTEM Gate 2 three-route integration patch — 2026-10-04

Scope: reconcile the older DECIDE / DESIGN dashboard projection with the released ZASS SYSTEM DUMP / DECIDE / DESIGN product contract without moving method semantics into ASC.

Implemented in source:
- dashboard/read entries now support `DUMP`, `DECIDE`, and `DESIGN`;
- dashboard defaults to DUMP and shows `DUMP → ZASSPILL` plus a link to the existing public ASC Front Door;
- DUMP project rows can be projected from `PROJECTS.ui_entry` when present;
- DECIDE / DESIGN grouping, project detail, History, and commit-linked ZASS CI rendering remain unchanged;
- the dashboard adds no write/persistence function and does not implement ZASSPILL semantics;
- live ASC DB `PROJECTS.ui_entry` data validation was expanded in place from `DECIDE / DESIGN` to `DUMP / DECIDE / DESIGN`; the existing AISYNC `DESIGN` value was preserved.

Verification:
- all 24 repository `test-*.mjs` tests PASS in a LF-normalized checkout;
- `git diff --check` PASS;
- dashboard read/UI regressions explicitly cover DUMP grouping, the DUMP front-door link, and existing DECIDE / DESIGN behavior;
- live Sheet read-back confirms strict `DUMP / DECIDE / DESIGN` validation on `PROJECTS.ui_entry`.

Production deployment evidence:
- protected production deployment now points to **Apps Script version 21**, `Gate2-three-route-production-integration`;
- version 21 was built from immutable production version 17 plus exactly `Dashboard.html`, `DashboardClient.html`, and `DashboardRead`;
- post-deploy source verification matched those three files to AISYNC merge commit `f515a7d1379534501cd7a032563bfa968f8012ae`;
- the pre-existing T-017 development HEAD was restored exactly after the versioned production release and remains separate from production v21.

Gate 2 owner-visible closure: PASS — the protected/main ASC surfaces visibly rendered DUMP / DECIDE / DESIGN, DUMP → ZASSPILL, and working DECIDE / DESIGN navigation.


## ZASS SYSTEM Gate 3 workspace + contextual cards patch — 2026-10-04

Scope: replace the permanent technical project-detail wall with a conversational-first project workspace while preserving ASC as a read/projection layer.

Implemented in source:
- project opens on **Workspace** by default;
- explicit **Workspace / Review / History** controls provide progressive disclosure;
- Workspace shows a compact **Project Pulse** using only indexed stage, next stage, factual progress, latest update, and index freshness;
- Workspace provides **Continue naturally → ASC Front Door** without implying SAVE/persistence;
- one primary contextual card is selected only from explicit factual state;
- `STALE` index state suppresses Current Task / decision-currentness claims and shows a refresh warning instead;
- Review contains commit-linked ZASS CI, current-state summaries, Action Plan, and ZASS/project records;
- History contains the factual HISTORY audit trail separately;
- internal `AP-xxx` / `D-xxx` IDs are not shown in the default Workspace;
- no new write operation, validator logic, method semantics, or automatic Full-ZASS migration is introduced.

Contextual-card eligibility:
- **Current Task** — explicit `CURRENT / ACTIVE / IN PROGRESS / OPEN` Action Plan row;
- **Ready to Lock** — explicit decision state `READY TO LOCK / READY_TO_LOCK / PROPOSED FOR PROCEED`;
- **Design Forming** — explicit DESIGN lifecycle plus factual progress/summary;
- **Delivered** — explicit DELIVERED / COMPLETE lifecycle state.

Verification:
- all **26** repository `test-*.mjs` files PASS from the current T-017-inclusive baseline;
- `git diff --check` PASS;
- dashboard regression verifies default Workspace, progressive disclosure, stale-state suppression, each contextual-card family, Review-only CI/IDs, History-only audit data, and absence of write controls from Workspace.

Production deployment evidence:
- protected production deployment now points to **Apps Script version 23**, `Gate3-project-workspace-contextual-cards`;
- v23 was constructed from immutable Gate 2 production v21 plus exactly `Dashboard.html` and `DashboardClient.html`;
- independent post-deploy pull verified both files match AISYNC Gate 3 merge `3d006eb4bde64ab9cca9878c0ca4e9c69db4dbf9`;
- every other production file in v23 matches production v21;
- the current development HEAD containing T-017 was restored after release and remains separate from production v23.

Gate 3 owner-visible production verification: **PASS**.

Observed on protected production Apps Script v23:
- project opens on **Workspace** by default;
- **Project Pulse** shows current stage, next stage, factual progress state, index freshness, and latest update;
- index freshness is visibly **STALE** and Workspace correctly shows **Project state needs refresh** instead of presenting a stale task/decision as current;
- **Continue naturally** and the ASC Front Door action are visible without implying persistence;
- **Review** exposes commit-linked ZASS CI, progress/current-state evidence, Action Plan, and ZASS/project records on demand;
- **History** exposes the factual audit trail separately;
- the default Workspace no longer exposes the previous full technical wall.

The Review surface also displayed a factual `READ_ERROR / GITHUB_READ_FAILED` for commit-linked CI tied to the stale indexed commit. This is correct truthful-error behavior and is not a Gate 3 failure.


## ZASS SYSTEM Gate 4 factual SAVE / sync patch — 2026-10-04

Scope: project the already-proven T-016 persistence boundary into one truthful user-facing save/sync state model. No new writer is introduced.

Protected Confirm & Sync:
- explicit product states: **UNSAVED → SYNCING → SAVED / FAILED**;
- `SAVED` requires a SUCCESS receipt, `verified=true`, `HISTORY_PERSISTED`, and a synced server result;
- `VERIFIED_WRITE` shows the attributable commit/record identifier;
- `NO_CHANGE` is SAVED with `write_performed=false` and explicitly says no new commit was required;
- `VERIFIED_WRITE_RECONCILED` is SAVED only because persisted content was verified; it explicitly says no attributable commit SHA is available when none exists;
- unverified, unknown, replay-rejected, HISTORY-failed, or unavailable final results render **FAILED**, never SAVED;
- verified SAVED state remains visible and exposes the guaranteed user-activated `Return to main ASC UI` control; live Gate 4 proof showed timer-driven top-level navigation is not reliable in the Apps Script/browser sandbox, so the product no longer promises or depends on auto-return;
- compact factual receipt is shown first; raw receipt JSON remains available under details.

Project Workspace:
- Project Pulse now includes **Save / sync health**;
- factual `STALE` index freshness takes precedence over historical success, preventing an old SAVE receipt from making current project state look synchronized;
- otherwise the latest indexed `operation=SAVE` row may project SAVED only when its receipt is parseable, status SUCCESS, and `verified=true`;
- latest failed SAVE projects FAILED;
- absent/insufficient receipt evidence stays **Not provided**, not invented UNSAVED/SAVED.

Verification:
- all **26** repository `test-*.mjs` files PASS;
- `git diff --check` PASS;
- confirm UI regressions cover UNSAVED/SYNCING/SAVED/FAILED, delayed return, VERIFIED_WRITE, NO_CHANGE, reconciled success, and unverified failure;
- dashboard regressions cover STALE precedence, verified SAVED, NO_CHANGE, FAILED, and insufficient receipt evidence;
- browser client still exposes no direct GitHub/Sheets/token writer.

Production deployment evidence:
- protected production deployment now points to **Apps Script version 24**, `Gate4-factual-save-sync`;
- v24 was constructed from immutable Gate 3 production v23 plus exactly `Index.html`, `Client.html`, and `DashboardClient.html`;
- independent post-deploy pull verified all three files match AISYNC Gate 4 merge `c4ab3e2be49a295e741f5a35ac0bde1667bd1a06`;
- every other production file in v24 matches production v23;
- the current development HEAD containing T-017 was restored after release and remains separate from production v24.

Remaining Gate 4 closure evidence: owner-visible production proof of UNSAVED → SYNCING → SAVED/FAILED and Project Pulse save/sync health.


## Gate 4 owner-visible return finding — 2026-10-04

Live production proof reached a factual `SAVED / NO_CHANGE / verified=true` receipt successfully. The attempted timer-driven top-level navigation did **not** move the browser back to the main ASC UI.

This is a UX/platform behavior finding, not a persistence failure.

D-030 already defines the guaranteed v0.1 return path as a user-activated `Return to main ASC UI` link/button and makes automatic top-level navigation optional. Gate 4 now follows that decision literally:
- after factual SAVED, the receipt remains visible;
- the pending fragment is cleared;
- a prominent user-activated return control is exposed;
- no timer-driven top-level navigation is promised or required.

The live failure therefore resulted in a bounded UX compatibility fix, not an architecture reopen.


## Gate 4 owner-visible SAVED proof + D-030 return fix — 2026-10-04

Owner-visible production proof reached a factual successful receipt:

```text
State: SAVED
Outcome: NO_CHANGE
Resource: dzuddiyn/AISYNC/records/T016-LIVE-20261003181842.md
New write performed: no
Verified: true
Request: ASC-G4-NOCHANGE-20261004013025
Timestamp: 2026-10-04T01:33:38.236Z
```

This proves the Gate 4 production UI can render a verified `SAVED` state without inventing a new commit when the authoritative content already matches.

Live UX finding:
- the attempted 3-second timer-driven top-level return did not navigate the browser;
- persistence and receipt truth were unaffected;
- D-030 already defines the user-activated `Return to main ASC UI` control as the guaranteed path.

Bounded fixes:
1. PR #25 / `75a76bd0f8aba9c8c68dfea3aba4735ba4cb7690`
   - empty protected page now shows `NO REQUEST`, not `UNSAVED`;
   - sign-in/no-payload message tells the user to return to the original Public Front Door tab and press CONTINUE.
2. PR #26 / `9abddcfd8a5abd91f81d041a85b5474b74493b7b`
   - removes dependence on timer-driven top-level navigation;
   - factual SAVED receipt remains visible;
   - the guaranteed user-activated `Return to main ASC UI` control is prominent.

Production:
- protected production deployment now points to **Apps Script version 26**, `Gate4-D030-return-control-fix`;
- v26 is production v25 plus exactly `Index.html` and `Client.html`;
- independent pull verified both files match PR #26 merge;
- every other production file matches v25;
- all **27** repository `test-*.mjs` files PASS and `git diff --check` PASS.

The failed auto-return is therefore closed as a bounded UX/platform compatibility finding, not a persistence or architecture failure.


## Gate 4 owner-visible closure proof — 2026-10-04

Final owner-visible production acceptance is complete.

Observed on protected production:
- valid pending request visibly showed **UNSAVED** before confirmation;
- after explicit **CONFIRM & SYNC**, the UI visibly showed **SYNCING** before the final state;
- factual receipt rendered **SAVED** with `Outcome: NO_CHANGE`, `New write performed: no`, and `Verified: true`;
- the successful receipt remained factual without inventing a commit;
- Workspace Project Pulse visibly showed **Save / sync health: STALE** while the prior SAVE receipt was successful, proving the UI does not conflate persistence success with index freshness;
- the D-030 user-activated return control is the guaranteed post-SAVE path; timer-driven auto-return is not required.

Gate 4 owner-visible acceptance: **PASS**.
