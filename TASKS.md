# AISYNC — ZASSIMPLE TASKS

**Status:** PRODUCTION v1 DELIVERY TRACK — T-019 PASS / T-020 CURRENT
**Method:** ZASSIMPLE v0.3.0  
**Lifecycle stage:** DO IT  
**Design:** v1.0.12 CONFIRMED
**Authority:** Tasks execute the confirmed plan. They do not rewrite LOCKED decisions.

> Surface one current task to the owner by default. Future tasks remain queued until the current task passes or is explicitly blocked/replanned.

## Current task

T-020 | CURRENT — HUMAN CLOSED BETA
Source: AP-014, D-031
Depends on: T-015 through T-019 — satisfied.
Do: Run a closed beta with minimum three distinct non-developer humans; target 3–5. Capture factual end-to-end evidence and failure/recovery observations.
Pass: minimum three distinct non-developer humans complete the core journey with factual evidence and without developer-side data repair or hidden canonical-state patching.
Current result: NOT STARTED — T-019 reliability/operations is complete and the closed-beta gate is now unblocked.

## Completed

T-019 | PASS — PRODUCTION RELIABILITY & OPERATIONS
Source: AP-013, D-029, D-031
Pass evidence:
- T-019A private continuity backup/restore LIVE PASS;
- T-019B replay/idempotency lifecycle LIVE PASS;
- T-019C degraded/offline behavior LIVE PASS;
- T-019D truthful telemetry LIVE PASS;
- T-019E broader disaster recovery/migration safety LIVE PASS;
- T-019F secret rotation LIVE PASS on protected production v46;
- T-019G live deployment rollback v46 → immutable v44 → v46 PASS with exact runtime verification and unchanged canonical Git;
- T-019H final operator runbook acceptance PASS: authority-aware quick start, 7/7 documented operator function references resolved, all linked proof files present, no secret literals, no stale blocker wording, 32/32 repository tests PASS, protected production restored to v46.
Boundary preserved: GitHub canonical authority, owner-private continuity authority, operational/index ASC DB, server-side credential boundary, and immutable deployment-version authority remain distinct.
Current result: PASS — AP-013 complete. T-020 / AP-014 Human Closed Beta is CURRENT. Project lifecycle remains DO IT.

T-018 | PASS — INTEGRATED HUMAN UX
Source: AP-012, D-020, D-021, D-031
Do: Integrate the production human journey into one coherent UI: login → project/thread → DUMP/DECIDE/DESIGN → provider handoff → SAVE → receipt/HISTORY → CI → reopen/transfer.
Pass evidence:
- T-018A first private-thread bootstrap + protected project/thread/provider/route handoff merged through PR #34 and deployed; owner-visible production proof created real AISYNC thread `th_01M42FTAP1KSHHP9FMJ2M2QTWB` without synthetic semantic state.
- T-018B provider-return bridge merged through PR #35 and deployed as protected Apps Script v30; the initial Gemini false-local-SAVE defect was reproduced, then the fixed flow required bounded `ASC_METHOD_RESULT`, non-mutating PREVIEW RETURN, PREPARE ASC SAVE, protected Front Door replay/security preview, and explicit owner `CONFIRM & SYNC`.
- factual SAVE request `ASC-T018B-01M42V6M2CX4ZJAN602WD97194` completed `VERIFIED_WRITE` at commit `11ff6215ecc95f4bfc4e8282d8e82a5206b31ac3`; exact artifact `records/METHOD-RESULT-01M42TNZ3WXJFWFS39EWY581SY.md` and HISTORY `SUCCESS / write_performed=true / verified=true` were independently re-read.
- commit-linked CI/status behavior remained truthful: GitHub Pages build for the SAVE commit succeeded, while no `ZASS CI / zass-check` run existed for that method-result artifact commit; ASC did not mislabel absence as PASS, and the PROJECTS operational index remained explicitly STALE.
- T-018C saved-result continuity advance merged through PR #36 at `211edc112052c21b28b6f2d7e3b5930c62a74f06` and deployed as protected Apps Script v31. Owner action `ADVANCE THREAD FROM SAVED RESULT` independently proved private continuity revision `1 → 2`, `confirmed_outcome → continuity.current`, `still_open → continuity.open=[]`, and UPDATE event lineage containing method-result ID, handoff ID, and SAVE commit, with no new GitHub/HISTORY write.
- final cross-provider handoff to ChatGPT created `ho_01M42Y3NBG6814SHNF374YWTZZ` with scoped reference `cr_01M42Y3RGRPMJKXXT79J223RRD`; independent private-store read confirmed `source_revision: 2` and the advanced saved checkpoint.
- receiving ChatGPT independently echoed exactly: `thread_id: th_01M42FTAP1KSHHP9FMJ2M2QTWB`, `source_revision: 2`, `current: ZASSIMPLE method gateway version 0.3.0 verified and integrated human journey continuation confirmed.`, `open: []`.
Boundary preserved: provider-held personal memory/profile was not imported; providers never received GitHub credentials or write authority; private continuity remained owner-only; GitHub persistence remained owner-confirmed; stale/absent CI/index state was reported factually.
Current result: PASS — AP-012 is complete. The ordinary-user production journey is proven end to end through cross-provider reopen/transfer, and execution advances to T-019 / AP-013.

T-017 | PASS — PRIVATE CONTINUITY + RETRIEVAL
Source: AP-011, D-027, D-031; frozen ZASSPILL v1.0
Do: Implement controlled/private continuity + retrieval using the frozen ZASSPILL v1 contract, including retrieval result contracts, Packet ↔ ASC reconciliation, Portable Packet v2, cross-method handoff/result envelopes, stale-result reconciliation, and scoped private continuity references.
Pass evidence:
- local retrieval, Portable Packet v2, reconciliation, cross-method handoff/result, stale-result handling, and scoped-reference contracts PASS; real private Drive synthetic proof PASS with cleanup verified.
- refreshed receiver-facing ZASSPILL Method Gateway v1.0.0 and explicit `thread_id` / numeric `source_revision` / `continuity_reference` bootstrap separation merged through PR #17 at `197276b422a8c128097b545e08cc9215ad4996c3`.
- `METHODS` >50k storage hardening merged through PR #23 at `f9e63c013b63bcfd228123f08e986c175fb50a0b`: no truncation, `gzip+base64:` physical storage only above the plain-text threshold, fail-closed encoded-size cap, transparent decode, and text-formatted snapshot rows.
- live Apps Script decode compatibility defect was found by verification, fixed with explicit gzip blob content type, regression-covered, and merged through PR #24 at `2f461e1da059c3dfdb037dc2881956aa5752218f`; fresh-clone full repository proof passed all 27 `test-*.mjs` files with `git diff --check = 0`.
- full live three-method reconciliation PASS at exact ZASS `main` commit `26b174e4dbc6570452b372712e9bf49abc86c4ef`: ZASSPILL v1.0.0 / 62,797 chars stored as 26,468-char gzip+base64, ZASSIMPLE v0.3.0 / 18,748 chars plain, ZASSELECTION v0.2.2 / 16,025 chars plain; all three rows share the same source commit and version cells remain text.
- Public Method deployment v5 returned exact decoded Markdown for all three methods; ZASSPILL returned 62,797 chars and did not expose the compressed storage representation.
- final external Google Antigravity receiver re-proof from an empty workspace fetched the exact GitHub Pages ZASSPILL gateway and returned `T017_RECEIVER_PASS`, `method_version: 1.0.0`, the exact synthetic `thread_id`, numeric `source_revision: 3`, distinct `continuity_reference`, and exact continuity sentence `Valve calibration checkpoint is row 18 with target marker 42.`
- temporary Antigravity `read_url(dzuddiyn.github.io)` permission and temporary Gemini CLI settings used only for the proof were removed after evidence capture; provider-held personal memory/profile was not part of the transferred continuity packet.
Boundary preserved: private continuity authority remains the dedicated ASC Private Continuity Store; GitHub remains canonical for project artifacts/method authority; ASC DB/Sheets remains derived/index state; method semantics remain in ZASS* rather than transport storage.
Current result: PASS — T-017 pass criteria are satisfied; AP-011 is complete and execution advances to T-018 / AP-012.

T-016 | PASS — PRODUCTION WRITE PATH
Source: AP-010, D-016, D-031
Do: Replace the proof-only TEST_ONLY write policy with the Production v1 GitHub write boundary: authorized project registry, deterministic Record ID → repository/branch/path mapping, GitHub App authentication, semantic idempotency, optimistic concurrency, and unknown-write reconciliation.
Pass evidence:
- PR #13 merged the canonical T-016 implementation to main at `cfbc379408080ee22b4eaf47835455829858b949`.
- all 24 repository `test-*.mjs` tests PASS from merged `main`; generated Apps Script runtime freshness check and `git diff --check` PASS.
- GitHub App `aisync-production-writer-dzuddiyn` is installed on exactly `dzuddiyn/AISYNC`; server-side installation ID and production project registry are configured.
- controlled owner-confirmed live SAVE `ASC-T016-20261003181842` wrote deterministic target `records/T016-LIVE-20261003181842.md` through GitHub App commit `6da32a0a36c74abc2640d55f6195b56217e0e2ca`; independent GitHub read-back matched exact content and HISTORY row 7 matched request/commit/resource with `SUCCESS`, `VERIFIED_WRITE`, `write_performed=true`, `verified=true`.
- protected production Apps Script deployment was updated from merged `main` to version 17, `T016-production-write-canonical`.
- final owner-confirmed verification `ASC-T016-FINAL-20261003185851` on protected production returned `NO_CHANGE`, `write_performed=false`, `verified=true`; independent HISTORY row 8 re-read matched exactly, and canonical `main` remained `cfbc379408080ee22b4eaf47835455829858b949`, proving no duplicate commit.
- success flow returned to the main ASC UI.
Boundary preserved: arbitrary caller-supplied repository/branch/path remains forbidden; GitHub App credentials remain server-side; private continuity authority remains separate; transport replay identity remains separate from semantic idempotency.
Current result: PASS — T-016 pass criteria are satisfied; execution advances to T-017.

T-015 | PASS — CANONICAL PROJECT / THREAD / INDEX STATE
Source: AP-009, D-014, D-027, D-031, D-032, D-033, D-034; frozen upstream ZASSPILL v1.0 Phase 3–6 contracts
Do: Implement the smallest Production v1 state slice: stable project/thread identity, revision + semantic event lineage, optimistic-concurrency inputs, bootstrap/duplicate protection, tombstone/delete behavior, and factual GitHub → ASC DB/index freshness.
Pass evidence:
- PR #10 merged the canonical state implementation to main at `120d2d7042d9adfbacf3f4edea8943deb79c29b7`; PR #11 merged the live Drive-write/freshness hotfix to main at `7a4c8777c0f79a8e34d29dff8972d0f906e1d3f8`.
- all 22 repository `test-*.mjs` tests PASS after the merged hotfix; `git diff --check` PASS.
- protected live continuity proof created a stable `th_<ULID>` thread, read revision 1, applied revision 2, returned `ALREADY_APPLIED` for the duplicate semantic request, returned `REVISION_CONFLICT` for the stale write, preserved event revisions `[1,2]`, deleted successfully, and then returned `THREAD_TOMBSTONED`.
- independent Drive read-back verified the authoritative private state JSON, the expected tombstone, and private/non-shared proof/store files.
- factual freshness proof returned `STALE / CANONICAL_HEAD_DIFFERS_FROM_INDEXED_COMMIT` for `source_ref=main` because indexed commit `2e0c773faaa2597a5df72fa77fea42d911bb0412` differed from canonical main `120d2d7042d9adfbacf3f4edea8943deb79c29b7` at proof time; ASC did not silently repair or infer project semantics.
- Apps Script version 10, `T-015 canonical continuity state verified hotfix`, is deployed on the protected production deployment; the owner-only web endpoint resolves through the Google sign-in gate as expected.
Current result: PASS — T-015 pass criteria are satisfied; execution advances to T-016.

T-014 | PASS — PRODUCTION BASELINE & DEFINITION OF DONE
Source: D-031, owner `PROCEED & LOCK` on 2026-10-03
Do: Reconcile current authority after the technical proof phase; define and lock the Production v1 scope, DELIVERED gate, non-goals, and execution track.
Pass evidence:
- D-031 locks technical proof ≠ project DELIVERED;
- project lifecycle is DO IT until Production v1 acceptance;
- Production v1 is a closed beta with minimum three distinct non-developer participants, target 3–5;
- GitHub remains canonical SoT; Sheets remains operational/index DB; GitHub is the only required production write destination;
- production write auth migrates to GitHub App; TEST_ONLY mapping is not production;
- frozen ZASSPILL v1.0 / ZASSELECTION / ZASSIMPLE routing boundaries are preserved;
- T-015 through T-021 provide the explicit path to Production v1 and final DELIVERED acceptance.
Current result: PASS — baseline and release definition are locked; execution advances to T-015.

T-012 | PASS — CONSUME COMMIT-LINKED ZASS CI STATUS
Source: PF-006, D-018  
Decision / Design lineage: D-018, DESIGN v1.0 § Cross-system validation boundary  
Do: Consume and display commit-linked ZASS CI validation status in ASC without implementing ZASS rules inside ASC.  
Depends on: ZASS SYSTEM GitHub CI existing first — **SATISFIED**.  
Dependency evidence:
- ZASS GitHub CI implementation merged to `main` at `13b9b267372ef9d18329ed5f88858dc04da3dfdc`;
- workflow `ZASS CI / zass-check` completed **SUCCESS** on the merged `main` commit;
- GitHub Actions run: `37084654404`;
- the workflow uses the existing ZASS CLI/core semantics with explicit historical baseline selection; ASC must consume the result only and must not reproduce Z001–Z101 rules.
Pass: ASC displays CI result tied to a commit while CLI/CI continue to use the same ZASS Core semantics.  
Current result: **PASS** — T-012A/B/C completed. The read-only consumer, Apps Script binding, dashboard rendering, deployment, real GitHub reads, and owner-visible UI observation all passed.
T-012A evidence:
- exact integration identity: workflow `ZASS CI`, job `zass-check`;
- input boundary: GitHub repository + full commit SHA;
- transport: GitHub Actions workflow-runs GET → matching run jobs GET;
- normalized factual states: `SUCCESS`, `FAILURE`, `IN_PROGRESS`, `QUEUED`, `NOT_FOUND`, `READ_ERROR`;
- absence of matching CI data never becomes SUCCESS;
- malformed/API/fetch failures remain READ_ERROR;
- consumer exposes GET-only behavior and no mutation/write API;
- source-level regression test confirms no ZASS rule-code implementation (no Z001–Z101 logic) and no `zass check`/project validation logic;
- `node ci/test-zass-ci-status.mjs`: PASS.
T-012B evidence:
- `ci/zass-ci-status.mjs` remains the status-identity/normalization owner and is mechanically bundled as `ascRuntime_().zassCi`;
- `apps-script/DashboardCiRead.gs` exposes `getDashboardZassCiStatus(repository, commitSha)` through the existing Apps Script dashboard server surface;
- Apps Script binding performs only public GitHub API GET reads; no Spreadsheet, Properties, Cache, GitHub write, or project mutation path is used;
- exact `ZASS CI / zass-check` mapping remains in the shared consumer, not reimplemented as ZASS validation logic in the dashboard binding;
- `node apps-script/test-zass-ci-binding.mjs`: PASS.
T-012C evidence:
- project detail now requests CI using exactly the project `github_repo` + indexed `source_commit`;
- rendered card shows repository, exact commit, workflow/job identity, factual status, conclusion, run ID, fetched timestamp, and GitHub Actions run link when present;
- `NOT_FOUND` explicitly states it is not PASS; `READ_ERROR` stays visibly read-error; no project-validity interpretation is added;
- the seven locked project-detail sections remain unchanged/in order; CI is an additional factual transport-status card;
- `node apps-script/test-dashboard-ui.mjs`: PASS with SUCCESS / NOT_FOUND / READ_ERROR rendering proof and no ZASS rule-code logic;
- full existing dashboard + confirm-sync regressions remain PASS;
- protected Apps Script deployment updated to version 7: `T-012C commit-linked ZASS CI dashboard`;
- controlled real GitHub read for commit `7cdbd6818198f22245ebcaf107a3cc87611a3d72` returned workflow `ZASS CI`, job `zass-check`, run `37084823055`, status `SUCCESS`, conclusion `success`;
- current ASC DB AISYNC project metadata points to `dzuddiyn/AISYNC@2e0c773faaa2597a5df72fa77fea42d911bb0412`; a controlled real lookup for that exact project commit returns `NOT_FOUND`, which is the truthful expected owner-visible card state because that commit has no matching `ZASS CI / zass-check` run;
- no live write or ASC DB mutation occurred.
- Owner-visible protected dashboard screenshot confirmed the deployed card renders the factual `NOT_FOUND` state for `dzuddiyn/AISYNC@2e0c773faaa2597a5df72fa77fea42d911bb0412`, including the explicit text that this is not a PASS result.


T-011 | PASS — MINIMUM END-TO-END ASC v0.1 ZASSIMPLE SAVE PROOF  
Source: AP-001 through AP-007  
Decision / Design lineage: D-002 through D-018, D-029, D-030, DESIGN v1.0.10  
Do: Run the minimum end-to-end ASC v0.1 proof using a real owner-issued ZASSIMPLE SAVE request through ASC Link → protected Google owner session → preview → explicit CONFIRM & SYNC → GitHub write → verification/receipt → Sheets HISTORY → successful return path to main ASC UI.  
Depends on: T-001 through T-010 — satisfied.  
Pass: The complete fallback flow succeeds without direct AI→GitHub integration, produces a real verified commit and factual receipt, updates operational history, and preserves the confirmed design boundaries.  
Live evidence:
- Owner issued the real ZASSIMPLE command `SAVE`.
- Secure request: `TEST_ONLY_T011_ZASSIMPLE_SAVE_20261002224115`, Source method `ZASSIMPLE`, Operation `SAVE`.
- Protected owner-authenticated Apps Script preview required explicit `CONFIRM & SYNC`; T-011 reused the already-authenticated owner session, while the login/auth preservation path had already been proven by T-004.
- GitHub write outcome: `VERIFIED_WRITE`, commit `50a3372c0540a9db021d0c0518b010836c58f247`, affected resource `dzuddiyn/AISYNC/proofs/t008-confirm-sync-live.md`.
- Persisted GitHub content was independently re-read and matched the T-011 ZASSIMPLE SAVE payload; blob SHA `b021e31686be01df064b1f13992f33d7fc2c5bc3`.
- HISTORY row 6: `SUCCESS`, `write_performed=true`, `verified=true`, matching commit ID and request ID.
- Success page exposed `Return to main ASC UI`; owner reported that a user click was required. D-030 locks this as the guaranteed v0.1 return behavior; automatic top-level navigation is optional rather than a pass requirement.
Scope limit: this remains the owner-locked TEST_ONLY destination policy; general production Record ID → GitHub path mapping is still not defined by this proof.  
Current result: PASS. ASC v0.1 core/fallback proof is delivered. Historical note: at T-011 closure, T-012 was still BLOCKED / LATER; the dependency was later satisfied and T-012 subsequently completed PASS.

T-010 | PASS — SECURITY / REPLAY CONTROLS  
Source: AP-007  
Decision / Design lineage: D-003, D-013, D-015, D-016, D-017, D-029  
Do: Add v0.1 security/replay controls around link requests, owner identity, server-side destination credentials, expiry/integrity checks, and failure-safe behavior.  
Depends on: T-002, T-004, T-005, T-006 — satisfied.  
Pass: The prototype does not expose destination credentials, does not silently write, rejects/flags invalid or expired requests according to D-029, and preserves explicit owner confirmation.  
Built / proven:
- T-010A | PASS — runtime-neutral envelope security validator with canonical JSON, ≤30-minute issued/expiry window, SHA-256 integrity consistency, factual failure codes, and no network/persistence side effects.
- T-010B | PASS — Apps Script server preview revalidates security + owner before enabling CONFIRM & SYNC; confirm revalidates again, requires explicit request-bound confirmation, checks owner, atomically claims request_id with LockService + Script Properties, then enters the existing verified T-008 write/receipt/HISTORY flow.
- Credential boundary | PASS — GITHUB_TOKEN remains server-side Script Property only.
- Deployment | LIVE PASS — Apps Script version 6, "T-010 security and replay controls", on the existing protected deployment ID.
Live evidence:
- Valid secure request `TEST_ONLY_T010_LIVE_20261002221136` → VERIFIED_WRITE, GitHub commit `62f576194dada61584f07752b17c91ee6865d12c`, persisted proof content independently re-read, HISTORY row 5 SUCCESS, verified=true, write_performed=true.
- Reusing the same request_id → `REPLAY_REJECTED`; owner UI showed failure and HISTORY remained a single row for that request.
- Expired request `TEST_ONLY_T010_EXPIRED_20261002221136` → `REQUEST_EXPIRED`; CONFIRM & SYNC disabled; no HISTORY row.
- Tampered request `TEST_ONLY_T010_TAMPER_20261002221136` → `INTEGRITY_MISMATCH`; CONFIRM & SYNC disabled; no HISTORY row.
Boundary: SHA-256 here is integrity consistency/error detection only, not sender authentication; owner identity + explicit confirmation remain the write authority. Replay markers are not cleaned up in v0.1.  
Current result: PASS. Execution advances to T-011 end-to-end ASC v0.1 proof.

T-009 | PASS — MAIN ASC UI / DASHBOARD  
Source: AP-003, UI data requirements  
Decision / Design lineage: D-005, D-006, D-012, D-014, D-019, DESIGN v1.0 § Google Sites ASC UI  
Do: Implement the read/dashboard path: DECIDE/DESIGN landing, project list with progress + latest update, and project detail with the seven locked sections.  
Depends on: T-003 PASS, T-004 PASS — satisfied.  
Pass: The UI displays Project progress bar, Progress summary, Next Action Plan summary, Next stage summary, Action Plan table, ZASS table, and History from ASC DB/index data without inventing method semantics.  
Built / proven:
- T-009A | PASS — read-only ASC DB adapter `apps-script/DashboardRead.gs`; schema validation, exact `project_id` filtering, no mutation calls, no semantic inference, blank progress remains not-provided, source metadata exposed with freshness `UNVERIFIED`.
- T-009B | PASS — `?view=dashboard` DECIDE / DESIGN landing; project grouping uses `PROJECTS.ui_entry` only; progress bar shown only when provided; latest update displayed exactly from ASC DB.
- T-009C | PASS — project detail renders all seven locked sections in order from PROJECTS / ACTION_PLAN / RECORDS / HISTORY.
- T-009D | LIVE PASS — Apps Script deployment version 5, "T-009D dashboard HTML include fix", serves the live dashboard on the existing owner-only deployment; PR #5 fixed the malformed HTML include found during first live deployment.
- T-009E | LIVE PASS — published Google Sites ASC UI at `https://sites.google.com/view/aisync-asc/laman-utama` embeds the dashboard successfully. Live owner verification showed the AISYNC DESIGN project, project detail, Action Plan table, ZASS table, and HISTORY rows including bootstrap T-003, T-007 proof, and T-008 live SAVE.
Freshness boundary: live ASC DB operational/index values may be stale; the dashboard displays them faithfully and marks freshness `UNVERIFIED`. T-009 does not invent GitHub→Sheets semantic refresh rules.
Current result: PASS. Execution advances to T-010 security/replay controls.

T-008 | PASS — PREVIEW → CONFIRM & SYNC → RECEIPT → REDIRECT\
Source: AP-003, AP-007\
Decision / Design lineage: D-012, D-015, D-017, DESIGN v1.0 § Google Sites + Apps Script interaction flow\
Do: Implement preview → explicit CONFIRM & SYNC → write/verify → receipt → redirect-to-main-ASC-UI flow, with truthful failure handling.\
Depends on: T-004, T-005, T-007 — all PASS.\
Pass: No persistence occurs before explicit confirmation; success returns to main ASC UI after verified receipt; failure stays visibly failed and does not redirect as success.\
Built / proven:
- T-008A | LOCAL PASS — `flow/confirm-sync.mjs` composes ASC Core → GitHub adapter → factual receipt → HISTORY without duplicating them; request-bound explicit confirmation required (zero GitHub/HISTORY calls before it); Core/authorization/routing/config rejection stops before any I/O; READ_ERROR / WRITE_ERROR / WRITE_UNVERIFIED / INVALID_INPUT → FAILED receipt recorded in HISTORY with no redirect; verified write with HISTORY failure → FAILED with no redirect; redirect only after SUCCESS + verified receipt + HISTORY_PERSISTED (PR #1, commit `fbd7e2d284164b2c2ffd88441088ce599c737511`);
- T-008B | LOCAL PASS + LIVE PASS — `apps-script/AscRuntime.gs` mechanically bundles transport/Core/GitHub adapter/REST client/receipts/flow + `History.gs` verbatim; UrlFetchApp `fetchImpl` restricted to `https://api.github.com/`; `GITHUB_TOKEN` and `ASC_MAIN_UI_URL` read from Script Properties only; redirect accepted only with prefix `https://sites.google.com/`; TEST_ONLY authorization (owner session + `Record ID` prefix `TEST_ONLY_` + `Destination: ["GitHub"]`); `RESULT_PENDING` → user cache → `getConfirmSyncResult`, with stale-result clearing per request ID and fail-closed cache handling (PR #2, commits `7774018f49948e0c1493a3cc9703e98da0ec5ee5`, `12917e595bb95ed4fbcccb180fbfbb49ea8d8175`; merge `b0261b02e3fdf7a93eb210e78bd0f33d8ad8d956`).
Live evidence (owner-verified unless noted):
- Apps Script deployment: version 3, "T-008B Apps Script runtime binding";
- owner explicitly granted the required Google permissions;
- request_id: `TEST_ONLY_T008B_LIVE_20261003_0415`;
- target: `dzuddiyn/AISYNC`, branch `main`, path `proofs/t008-confirm-sync-live.md` (owner-locked TEST_ONLY policy);
- GitHub commit: `fb1da42abaac61d5568548ec254e48c1a1b5aa6b` (parent `b0261b0`; message `TEST_ONLY T-008B confirm sync TEST_ONLY_T008B_LIVE`; changes only the proof file) — repository-verified;
- remote GitHub file content independently re-read and matched; remote blob SHA `1cc83134ff94793a2e7e0726b36aa928fdca6a6f` equals the committed blob — repository-verified;
- HISTORY row 4: `SUCCESS`;
- receipt: `adapter_outcome=VERIFIED_WRITE`, `write_performed=true`, `verified=true`;
- successful flow redirected to `https://sites.google.com/view/aisync-asc/laman-utama`.
Scope limits:
- the TEST_ONLY destination policy is a controlled proof policy, NOT the production mapping; general Record ID → GitHub path mapping remains undecided;
- only `Destination: ["GitHub"]` is supported; ASC_DB record destination and replay/expiry/integrity controls (T-010) are not implemented;
- live failure paths (FAILED/unverified writes not redirecting) are proven by local tests, not by a live forced failure.
- D-030 later refines the user-visible success return requirement: the guaranteed v0.1 path is the user-activated `Return to main ASC UI` link/button; automatic top-level navigation is optional.
Result: PASS — explicit confirmation preceded persistence, a real verified GitHub commit produced a factual SUCCESS receipt and HISTORY row, and the flow returned to the main Google Sites ASC UI.

T-007 | PASS — FACTUAL WRITE RECEIPT + HISTORY
Source: AP-006  
Decision / Design lineage: D-004, R-003, D-014, DESIGN v1.0 § Write Receipt  
Do: Implement the factual ASC Write Receipt and HISTORY persistence.  
Depends on: T-003, T-006  
Pass: SUCCESS and FAILED writes are distinguishable; successful GitHub writes record destination, affected resource, commit/record identifier, request identity/time, and HISTORY entry.  
Current result: PASS — local receipt/HISTORY boundary tests passed; external live verification confirmed HISTORY row 3 with all 11 persisted fields exactly re-read and consistent with the embedded factual receipt.
Live evidence:
- request_id: `TEST_ONLY_T007_HISTORY_20261003_01`;
- status: `SUCCESS`;
- destination: `GitHub`;
- affected_resource: `dzuddiyn/AISYNC/proofs/t006b-github-adapter-live.md`;
- commit_or_record_id: `95e019604e6edd778acd0ee252c506d2729f2d09`;
- timestamp: `2026-10-02T19:03:32.135Z`;
- receipt_json confirms `adapter_outcome=VERIFIED_WRITE`, `write_performed=true`, and `verified=true`;
- persisted scalar fields matched the embedded receipt after re-read.

T-006 | PASS — GITHUB DESTINATION ADAPTER  
Source: AP-005  
Decision / Design lineage: D-007, D-016, DESIGN v1.0 § GitHub adapter  
Built / proven:
- T-006A local/mock adapter mechanics: CREATE / UPDATE / NO_CHANGE, current-SHA enforcement, exact read → write → read verification, truthful WRITE_UNVERIFIED handling, Promise/throw containment, and no fake identifiers;
- T-006B GitHub REST transport: runtime-only GITHUB_TOKEN, Contents API GET/PUT translation, UTF-8/Base64 handling, structured HTTP/fetch errors, and no credential leakage;
- live proof target: `proofs/t006b-github-adapter-live.md` on `dzuddiyn/AISYNC` branch `main`;
- controlled live CREATE produced commit `95e019604e6edd778acd0ee252c506d2729f2d09`;
- persisted content SHA verified as `3be4eed97840c9414207f1cb4f33e7f5021847bf`;
- remote re-read matched the deterministic proposed content exactly;
- live adapter result: VERIFIED_WRITE, writePerformed=true, verified=true;
- no final T-007 Write Receipt or HISTORY entry was created by T-006.
Result: PASS — a controlled real GitHub write produced a verified commit and factual identifiers needed by the receipt layer.

T-005 | PASS — ASC CORE REQUEST BOUNDARY  
Source: AP-004  
Decision / Design lineage: D-002, D-004, D-014, DESIGN v1.0 § ASC Core  
Built / proven:
- exact eight-field ASC Write Contract validation;
- structured rejection for ordinary invalid input;
- fail-closed injected authorization boundary;
- authorization mutation isolated by deep copy;
- accepted semantic contract deep-equals input and nested semantic data remains isolated;
- Destination routing: GitHub → github, ASC_DB → asc_db;
- destination order preserved;
- mixed known/unknown destinations fail without partial accepted routing;
- adapter invocation descriptors are isolated deep copies;
- neutral receipt-layer handoff only; no fake SUCCESS/commit/resource/timestamp;
- provider-context labels do not change accepted contract or routes;
- no network, persistence/write, or ZASS reasoning.
Verification:
- `node core/test-asc-core.mjs`: PASS;
- published commit: `3a56c30d8520ab6824807c76255c973a1f838450`.
Result: PASS — same valid semantic contract can enter Core independently of AI provider, and Core remains method-agnostic with no destination write side effects.

T-004 | PASS — FRONT-DOOR / AUTH PRESERVE / ROUTING / HANDOFF  
Source: AP-003, AP-007, PF-005, D-020, D-021, D-022, D-027, D-028  
Decision / Design lineage: D-006, D-015, D-017, D-020, D-021, D-022, D-027, D-028, DESIGN v1.0.9  
Built / proven:
- static GitHub Pages front door preserves pending #asc state in the original tab;
- owner-only Apps Script remains the protected authenticated preview;
- SIGN IN → Google auth → return → CONTINUE replay passed live without refresh;
- mandatory provider selection supports ChatGPT / Gemini / Copilot;
- deterministic DUMP / DECIDE / DESIGN suggestion + explicit override passed live;
- exact route → ZASSPILL / ZASSELECTION / ZASSIMPLE → public Method Gateway mapping passed;
- PREPARE HANDOFF creates a short receiver bootstrap;
- COPY HANDOFF + OPEN PROVIDER use the v0.1 copy-open fallback only;
- provider base URLs carry no draft, method URL, #asc payload, or prompt query;
- changing draft/provider/override invalidates prepared state and requires PREPARE again;
- no persistence/write occurs in this task.
Receiver field evidence:
- Gemini fetched the exact ZASSIMPLE Method Gateway and continued, but without controlled project continuity it produced generic/inaccurate project assumptions;
- ChatGPT fetched the exact gateway and continued with a project-aligned response, but that session may have had ambient project context and therefore is not a clean portability proof;
- Copilot could not fetch the exact gateway in the tested session and correctly stopped rather than substituting repository search/raw GitHub/another source.
Result: PASS — all T-004 pass criteria met. Receiver fetch variability and controlled/private project continuity remain separate concerns under D-027/PF-024, not blockers to the front-door/provider-handoff proof.

T-013B | PASS — PUBLIC METHOD GATEWAY + CROSS-AI PROOF  
Source: T-013A, D-023, D-025, D-026, D-028  
Decision / Design lineage: D-023, D-025, D-026, D-028, DESIGN v1.0.9 § Public Method Gateway / receiver-facing host refinement  
Built / proven:
- public GitHub Pages receiver surface under `https://dzuddiyn.github.io/AISYNC/method/<method>/my/`;
- MY pages for ZASSPILL, ZASSIMPLE, and ZASSELECTION;
- browser anonymous read: PASS;
- Gemini direct read of ZASSIMPLE page: PASS;
- Copilot direct read of ZASSIMPLE page: PASS;
- ZASSPILL generated an exact DESIGN → ZASSIMPLE handoff carrying the public gateway URL;
- Gemini end-to-end handoff continued under ZASSIMPLE using the supplied explicit test context.
Caveat:
- one later Copilot end-to-end handoff session failed to fetch the exact page and substituted repository search, producing stale/incorrect version context;
- receiver guardrail: exact gateway URL only; on fetch failure, report failure and do not substitute another source as method authority.
Scope:
- this proves method-link handoff;
- it does not prove the future controlled/private continuity transport.
Result: PASS — T-013B v0.1 proof closed; T-004 resumed.


T-013A | PASS — METHOD REGISTRY + PROTECTED GITHUB SYNC
Source: AP-008, D-023, D-024, D-025
Decision / Design lineage: D-002, D-005, D-023, D-024, D-025, DESIGN v1.0.8 § Public Method Gateway / read plane
Built:
- ASC DB `METHODS` registry with the locked nine-column snapshot shape;
- `method-gateway/method-snapshot-v0.1.schema.json`;
- `method-gateway/sync/RegistrySync.gs`;
- `method-gateway/sync/appsscript.json`;
- authenticated GitHub API reads using `GITHUB_TOKEN` from Apps Script Script Properties; no token is hard-coded in the repository.
Verification:
- protected `syncMethodsFromGitHub()` completed successfully;
- three Malay method snapshots were written;
- all three snapshots were pinned to the same GitHub source commit for the sync run;
- method version/path/content fields populated correctly;
- second run updated existing rows without creating duplicates.
Result: PASS — protected GitHub→METHODS sync is live and upsert behavior is verified.


T-003 | PASS  
Source: AP-003, PF-003, D-014  
Decision / Design lineage: D-005, D-012, D-014, D-019, DESIGN v1.0.8 § Google Sheets = ASC DB  
Built:
- native Google Sheet `AISYNC ASC DB v0.1`
- tabs: `PROJECTS`, `RECORDS`, `ACTION_PLAN`, `HISTORY`
- repo schema/authority documentation: `db/README.md`
Verification:
- four tabs present with frozen header rows and filters
- AISYNC bootstrap project/record/action/history rows readable
- `DECIDE / DESIGN` validation active
- Action Plan status validation active
- HISTORY `SUCCESS / FAILED` validation active
- timezone set to `Asia/Kuala_Lumpur`
- GitHub source artifact/commit and authority fields explicitly preserve canonical-vs-operational boundary
- Ownership migration verified: active ASC DB now belongs to the intended `dzuddiyn Google` profile; repo URL updated
Result: PASS — one AISYNC project is represented operationally without making Sheets a competing canonical master.



T-002 | PASS  
Source: AP-002, AP-007  
Decision / Design lineage: D-003, D-013, DESIGN v1.0 § ASC transport/security envelope + ASC Link  
Built:
- `transport/asc-envelope-v0.1.schema.json`
- `transport/asc-link.mjs`
- `transport/test-asc-link.mjs`
- `transport/README.md`
Verification:
- T-001 contract round-tripped through encode → ASC Link fragment → decode without semantic loss
- Unicode content round-tripped correctly
- payload remained absent from ordinary query parameters
- query-carried `asc` payload was rejected
- integrity digest remains an explicit placeholder for T-010 rather than a false security claim
Result: PASS — small-payload ASC Link transport works through `#asc=<Base64URL envelope>` and preserves contract semantics.



T-001 | PASS  
Source: AP-001  
Decision / Design lineage: D-011, D-013, DESIGN v1.0 § ASC Write Contract  
Built:
- `contracts/asc-write-contract-v0.1.schema.json`
- `contracts/README.md`
- valid/invalid contract examples under `contracts/examples/`
Verification:
- two valid examples passed semantic validation
- missing `Record ID` rejected
- leaked top-level transport metadata rejected
- empty `Destination` rejected
Result: PASS — locked eight-field semantic contract is representable and mechanically distinguishable from invalid payloads without GitHub/Sheets-specific write logic.

## Queue

T-021 | QUEUED — PRODUCTION v1 RELEASE
Source: AP-015, D-031
Depends on: T-020 PASS.
Pass: release commit/deployment, known limitations, operator runbook, rollback point, and owner acceptance are recorded. Only then advance lifecycle to DELIVERED !!.

## Delivered evidence

Implementation evidence exists for T-001 through T-019 and T-013A/B. T-012 completed the technical proof baseline; T-014 locked Production v1 delivery criteria; T-015 through T-019 are PASS; T-020 Human Closed Beta is current.

Closure checks:
- Built: YES — ASC v0.1 core/fallback path, method gateway slices, and commit-linked ZASS CI consumer through T-012 are implemented
- Verified: YES — live T-011 owner-issued ZASSIMPLE SAVE produced verified GitHub persistence + factual HISTORY; T-012 added deployed/live-read/owner-visible commit-linked ZASS CI proof
- Matches design: YES — including D-029 security/replay and D-030 successful-return refinement
- Recorded: YES — canonical GitHub tracking/evidence updated
- Current: T-020 — Human Closed Beta


T-013 | PASS — PUBLIC METHOD GATEWAY v0.1 PROOF  
Source: AP-008, D-023  
Decision / Design lineage: D-002, D-005, D-018, D-023, DESIGN v1.0.8 § Public Method Gateway / read plane  
Do: Prove the smallest public AI-readable method mirror for the three Malay methods only:
1. add a lightweight Method Registry snapshot store;
2. sync canonical GitHub method content without manual copy/paste;
3. expose public read-only Markdown endpoints that serve the stored content themselves;
4. expose traceable source version/commit metadata;
5. field-test Gemini and Copilot readability;
6. verify ZASSPILL can carry the gateway URL for DECIDE/DESIGN handoff.
Depends on: D-023, D-024; official ZASSPILL ready enough for contract/handoff review and owner promotion decision.  
Pass:
- GitHub remains canonical SoT;
- snapshot source commit/version is identifiable;
- endpoint serves Markdown itself without GitHub redirect;
- public read requires no login;
- Gemini and Copilot can read the endpoint;
- GitHub update can sync without copy/paste;
- ZASSPILL can hand off a gateway URL.
Constraint: do not add EN methods, public write/admin APIs, webhook complexity, or extra connectors in this proof.
Result: PASS — T-013A protected sync and T-013B receiver-facing/cross-AI proof completed; execution returned to T-004.


### Planned slicing after D-024 gate

No implementation starts until the owner reviews the official ZASSPILL dependency.

If T-013 is promoted:

- **T-013A — Registry + sync:** create the minimal METHODS snapshot store and protected GitHub→AI-SYNC sync; verify source commit/version/content without manual copy-paste.
- **T-013B — Public gateway proof:** serve the stored Markdown publicly without login/redirect, test Gemini and Copilot readability, and prove ZASSPILL can carry the gateway URL during handoff.

After those pass sufficiently, resume the remaining T-004 front-door/routing/handoff work.


D-026 receiver-format rule is LOCKED:
- test clean text/Markdown endpoint first;
- add a clean HTML `/view` compatibility endpoint only if Gemini/Copilot evidence requires it;
- do not alter method semantics in the fallback view.
