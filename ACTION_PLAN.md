# AISYNC — ZASSIMPLE ACTION PLAN

**Status:** PRODUCTION v1 DELIVERY TRACK
**Method:** ZASSIMPLE v0.3.0  
**Lifecycle stage:** DO IT  
**Authority:** Planning artifact only. It must not override LOCKED owner decisions.

> Implementation thoughts discovered during DESIGN may refine the design, including technical architecture where applicable. Implementation findings may refine this Action Plan. LOCKED decisions remain owner authority.

## Purpose

Turn the proven ASC v0.1 technical baseline into AISYNC Production v1: a coherent, recoverable closed-beta system that real humans can use end-to-end without developer-side data repair, while preserving the locked method/ASC/SoT boundaries.

## Current plan

AP-001 | DONE  
Source: D-002, D-004, D-011  
Action: Implement the locked ASC Write Contract v0.1 representation as canonical JSON using: Project, Source method, Operation, Record type, Record ID, Content/change, Lineage, Destination; keep transport/security metadata in a separate ASC envelope (D-013).  
Dependencies: None beyond the locked field set.  
Constraint / feasibility note: Keep destination-specific mechanics out of the method contract.  
Pass / stop condition: One generic contract can express a real ZASSIMPLE SAVE without embedding GitHub- or Sheets-specific write logic.  
Result: PASS — canonical JSON Schema + valid/invalid examples implemented under `contracts/`; T-001 verified.  
Feeds design: YES

AP-002 | DONE  
Source: D-003, D-004, D-011  
Action: Define the ASC Link representation for a small write request.  
Dependencies: AP-001.  
Constraint / feasibility note: Prefer client-side fragment transport for small payloads; exact encoding remains open.  
Pass / stop condition: An ordinary AI app with no write integration can generate a valid ASC Link from method instructions.  
Result: PASS — envelope schema + fragment-only Base64URL link encoder/decoder implemented and verified in T-002; security enforcement remains in AP-007/T-010.  
Feeds design: YES

AP-003 | DONE
Source: D-006, D-009, D-012, D-019, D-020  
Action: Implement the locked Google Sites + Apps Script UI flow, including the D-020 provider-selection/auth/intent-routing/AI-handoff front door, preview/confirm/write behavior, and redirect back to the main ASC UI after a successful confirmed update (D-015).  
Dependencies: D-012 UI information architecture.  
Constraint / feasibility note: Landing must stay simple: DUMP / DECIDE / DESIGN. User does not need to choose a mode before starting; AI-provider selection is mandatory, then ASC auto-routes after authentication. Project detail carries the richer lineage views.  
Pass / stop condition: The UI can represent the locked navigation and project-detail sections without forcing users to inspect raw Markdown.  
Result: PASS — T-004 front door/handoff, T-008 confirm-sync interaction, and T-009 dashboard/project-detail flows passed local/live proof.
Feeds design: YES

AP-004 | DONE
Source: D-002, D-004  
Action: Implement the ASC Core boundary: validate, authorize, translate, route, write through adapter, verify, return receipt; use GitHub as canonical artifact destination and Sheets as operational ASC DB per D-014.  
Dependencies: AP-001.  
Constraint / feasibility note: ASC Core must not perform reasoning or silently rewrite method meaning / LOCKED decisions.  
Pass / stop condition: The same contract can enter the Core regardless of which AI app generated it.  
Result: PASS — T-005 pure Core boundary plus T-006/T-007/T-008 adapter, receipt, HISTORY, and confirm-sync composition proved the method-agnostic Core path.
Feeds design: YES

AP-005 | DONE  
Source: D-007  
Action: Implement the first destination adapter for GitHub using the locked v0.1 fine-grained PAT path, current-file/SHA fetch, create/update, verification, and receipt flow (D-016).  
Dependencies: AP-001, AP-004.  
Constraint / feasibility note: v0.1 proof should support Markdown update → commit → verification → factual receipt.  
Pass / stop condition: A ZASSIMPLE project with no AI→GitHub integration can SAVE through ASC and receive a verified commit result.  
Result: PASS — T-006A adapter mechanics + T-006B real Contents API transport produced verified live commit `95e019604e6edd778acd0ee252c506d2729f2d09`; final receipt semantics remain AP-006/T-007.  
Feeds design: YES

AP-006 | DONE
Source: D-004, R-003  
Action: Define the factual ASC Write Receipt.  
Dependencies: AP-004, AP-005.  
Constraint / feasibility note: Must distinguish proposed state from actually persisted state.  
Pass / stop condition: Receipt clearly reports success/failure, destination, affected resource, record/commit identifier where applicable, and failure reason when not successful.  
Result: PASS — local receipt/HISTORY boundary tests passed; external live verification re-read HISTORY row 3 and confirmed all eleven persisted fields exactly, including SUCCESS status, GitHub destination/resource, commit identifier, request ID, timestamp, and receipt JSON verification fields.
Feeds design: YES

AP-007 | DONE
Source: D-003, R-004  
Action: Define minimum v0.1 security/privacy controls.  
Dependencies: AP-002, AP-003, AP-004.  
Constraint / feasibility note: No silent writes; explicit confirmation before persistence; destination credentials must not be exposed to the AI-generated link.  
Pass / stop condition: Prototype does not rely on exposed credentials, invisible persistence, or sensitive record content in ordinary query parameters.  
Result: PASS — T-010 live proof established owner gate, explicit confirmation, expiry/integrity/replay controls, server-side destination credentials, and fail-closed behavior.
Feeds design: YES

## Production v1 delivery plan

Source: D-031, D-032, D-033, D-034

AP-009 | PASS
Action: Implement canonical project/thread/index state for Production v1: stable thread identity, revision + semantic event lineage, optimistic-concurrency inputs, bootstrap/duplicate protection, tombstone/delete handling, and truthful GitHub → ASC DB/index freshness.
Dependencies: T-012 technical baseline, frozen ZASSPILL v1 upstream contract, D-032 private continuity authority, D-033 native continuity contract boundary, D-034 transport/semantic request-identity separation.
Constraint / feasibility note: authoritative private Current Thread Records/events/tombstones live in the dedicated ASC Private Continuity Store; the existing ASC DB remains a derived index. Do not force bootstrap/thread mutations through the eight-field ASC Write Contract and do not reuse transport replay IDs as semantic idempotency IDs.
Pass / stop condition: ASC can identify the current project/thread revision and index freshness factually without relying on manually maintained stale PROJECTS metadata.
Result: PASS — live private continuity mechanics and factual stale-index detection are verified; protected Apps Script deployment version 10 carries the merged implementation.
Feeds design: YES

AP-010 | PASS
Action: Replace TEST_ONLY write policy with the production GitHub write boundary: authorized project registry, deterministic Record ID → repo/branch/path mapping, GitHub App auth, idempotency, optimistic concurrency, and unknown-write reconciliation.
Dependencies: AP-009 — satisfied.
Pass / stop condition: an allowed human user can SAVE a supported production project without TEST_ONLY rules or arbitrary destination paths.
Result: PASS — canonical Production v1 GitHub write path is merged and deployed; live GitHub App SAVE and final protected-production NO_CHANGE verification both passed with independent GitHub/HISTORY evidence.
Feeds design: YES

AP-011 | PASS
Action: Implement controlled/private continuity + retrieval using the frozen ZASSPILL v1 contract, including retrieval result contracts, Packet ↔ ASC reconciliation, Portable Packet v2, cross-method handoff/result envelopes, stale-result reconciliation, and scoped private continuity references.
Dependencies: AP-009, AP-010 where persistence is required — satisfied.
Pass / stop condition: an ordinary user can continue the same project/thread across supported AI providers without a long manual handover packet and without publicizing private project continuity.
Result: PASS — local continuity/retrieval contract and private Drive live proof pass; the stale gateway/bootstrap defects were canonically repaired; full three-method exact-commit METHODS reconciliation and decoded public read verification pass; final Google Antigravity receiver re-proof fetched the exact GitHub Pages ZASSPILL gateway at v1.0.0 and preserved the exact thread, numeric source revision, distinct continuity reference, and transferred current-state sentence without provider-memory enrichment.
Feeds design: YES

AP-012 | PASS
Action: Integrate the production human journey into one coherent UI: login → project/thread → DUMP/DECIDE/DESIGN → provider handoff → SAVE → receipt/HISTORY → CI → reopen/transfer.
Dependencies: AP-009 through AP-011.
Pass / stop condition: the normal journey is usable without raw contracts, raw GitHub paths, or developer intervention.
Result: PASS — T-018A/B/C are canonical and protected production is v31. The owner journey passed real first-thread creation, Gemini DESIGN handoff, bounded provider return, non-mutating preview, secure owner-confirmed SAVE, factual GitHub/HISTORY receipt, truthful commit-linked CI/status reporting, saved-result continuity advance revision 1→2, and cross-provider reopen/transfer. Independent private-store verification confirmed handoff `ho_01M42Y3NBG6814SHNF374YWTZZ` and scoped reference `cr_01M42Y3RGRPMJKXXT79J223RRD` carry `source_revision: 2` plus the advanced saved checkpoint. Receiving ChatGPT then echoed exactly the same `thread_id`, `source_revision: 2`, advanced `current`, and `open: []`. Provider memory was not imported, providers received no write credentials, private continuity remained owner-only, and absent/stale CI/index state was reported factually instead of being mislabeled PASS.
Feeds design: YES

AP-013 | PASS
Action: Add Production v1 reliability/operations: degraded/offline behavior, backup/restore, migration safety, replay/idempotency lifecycle, truthful telemetry, secret rotation, deployment, rollback, and operator runbook.
Dependencies: AP-009 through AP-012 — satisfied.
Pass / stop condition: critical state can be recovered or rolled back truthfully without silent duplication/data loss and without exposing secrets.
Result: PASS — T-019A through T-019G are LIVE PASS and T-019H final operator runbook acceptance is PASS. The runbook has one authority-aware quick-start map, all documented operator function references resolve to source, all linked proof files exist, stale blocker wording is removed/marked historical, secret-literal scan is clean, 32/32 repository tests pass, and protected production is restored to v46. AP-013 is complete; AP-014 / T-020 Human Closed Beta becomes CURRENT.
Feeds design: YES

AP-014 | CURRENT / READY FOR HUMAN BETA
Action: Run a closed beta with invited humans. Minimum three distinct non-developer participants; target 3–5. Capture factual end-to-end evidence and failure/recovery observations.
Dependencies: AP-009 through AP-013 — satisfied.
Pass / stop condition: at least three participants complete the locked core journey without developer-side data repair or hidden manual patching of canonical/project state.
Current result: T-020A HUMAN BETA READINESS and T-020B1 Session Preparation are PASS. Owner preflight before the counted T-020B2 journey exposed BETA-UX-005 through BETA-UX-008: the visible DUMP Front Door path was standalone rather than project-linked, the ordinary provider conversation lacked clear CrossAI save/transfer commands, pending-SAVE sign-in was actionable without a pending request, and the ZASSPILL Portable Thread Packet template mixed the current method version with the historical packet-format version. T-020B2 is HOLD; no external participant is counted. T-020B2R remediation is merged through PR #63 at `6011aec2b61273b109a3c208cb8d8036eed882ed` and deployed to protected Apps Script v52 `T020B2R-linked-dump-save-ux`. The public Front Door and refreshed ZASSPILL gateway are live. Existing persistence/authority boundaries are unchanged. Next: owner live recheck of the protected linked DUMP → provider → CrossAI checkpoint/SAVE → receipt → reopen/continuity path; resume counted T-020B2 only if that journey passes without hidden repair.
Feeds design: YES

AP-015 | QUEUED
Action: Prepare and release AISYNC Production v1 after beta acceptance: freeze release commit/deployment, document known limitations, verify operator runbook/rollback point, and obtain final owner acceptance.
Dependencies: AP-014 PASS.
Pass / stop condition: Production v1 release evidence is complete and the owner explicitly accepts the release. Only then may project lifecycle advance to DELIVERED !!.
Feeds design: YES


## Post-Production v1 future direction

**Status:** LOCKED FUTURE WORK — NOT ACTIVE

After AP-015 / T-021 reaches Production v1 release acceptance and the project is `DELIVERED !!`, the future productization direction is:

```text
ZASS CR-010 v0.4 + closure
→ npm bootstrap CLI / ZASS Project Bootstrap Core
→ AISYNC Create New Project → GitHub repository
→ seed ZASS files
→ register project
→ continue in DESIGN
```

AISYNC must consume the shared ZASS Project Bootstrap Core rather than duplicate bootstrap semantics. GitHub remains canonical for project artifacts; AISYNC owns create-project UX/integration, registration, and progress/current-state projection.

See [`docs/AISYNC_CREATE_PROJECT_FUTURE_DIRECTION.md`](docs/AISYNC_CREATE_PROJECT_FUTURE_DIRECTION.md).

This section does **not** add a current AP/T task and must not interrupt T-020 or AP-015.

## UI data requirements

Source: D-012

The project detail view must be able to render:

1. Project progress bar
2. Progress summary
3. Next Action Plan summary
4. Next stage summary
5. Action Plan table
6. ZASS table with all applicable source-method record components
7. History

The DECIDE / DESIGN project list must be able to render:

- project progress bar
- latest update

These UI requirements feed the data model and architecture; they do not create a second decision authority.

## Integration targets

Source: D-010

Primary locked targets:
- Obsidian
- Notion
- OneNote
- Logseq
- Joplin

Candidate only:
- Airtable

Integration order after GitHub is not yet locked.

## Planning findings

PF-001 | RESOLVED BY T-003
Finding: Google Sheets is the locked ASC DB for v0.1 (D-005). A separate ASC database is not required for the first implementation.

PF-002 | RESOLVED BY D-015  
Finding: Google Sites is the main ASC shell; Apps Script Web App provides dynamic preview/confirm/write behavior and returns the user to the main ASC UI after successful sync.

PF-003 | RESOLVED BY D-014  
Finding: The project-detail UI reads normalized operational/index data from Google Sheets logical tables PROJECTS, RECORDS, ACTION_PLAN, and HISTORY; semantic stage/progress remains method-owned.

PF-004 | RESOLVED BY D-014  
Finding: GitHub is canonical for project artifacts/Git lineage; Google Sheets is the operational/index ASC DB and must not silently become a competing editable master.

## Design feedback

The core DESIGN blockers are resolved. The confirmed technical design is maintained in `DESIGN.md`. T-014 locked the Production v1 delivery track; T-015 is PASS and T-016 is now the current executable task, followed by T-017 through T-021.


PF-005 | RESOLVED BY D-017  
Finding: Google Account is the v0.1 identity gate with owner-only access; pending ASC Link requests survive sign-in, preview precedes persistence, and successful sync returns to the main ASC UI.


PF-006 | RESOLVED BY D-018 + T-012
Finding: ZASS Core owns validation semantics; local CLI and GitHub CI are runners over the same core. GitHub CI is now operational upstream. T-012 proved ASC can consume and display factual commit-linked `ZASS CI / zass-check` status through a read-only GitHub Actions consumer without copying ZASS rule codes, inferring project validity, or mutating project state. The current AISYNC project commit correctly renders `NOT_FOUND` because no matching ZASS CI run exists for that exact commit.


PF-007 | RESOLVED BY T-003  
Finding: ASC DB v0.1 exists as a native Google Sheet with PROJECTS, RECORDS, ACTION_PLAN, and HISTORY. The active Sheet was migrated on 2026-10-02 to the intended Google owner profile `dzuddiyn Google`. The bootstrap row model carries GitHub source artifact/commit and explicit authority fields, so Sheets functions as operational/index storage without becoming the canonical Markdown master. Native Sheet URL is documented in `db/README.md`.


PF-008 | RESOLVED BY T-004
Finding: The Apps Script Web App skeleton is implemented using owner-only Google Account deployment semantics (`MYSELF` / `USER_DEPLOYING`). Pending `#asc` state restoration and preview-only behavior pass local tests. T-004 cannot be closed until the real deployed Google authentication redirect is verified with an actual ASC Link; no write handler exists yet.


PF-009 | RESOLVED BY D-020  
Finding: ASC front-door UX requires explicit AI-provider selection, authentication before routing, automatic DUMP/DECIDE/DESIGN classification, visible/overridable route, and capability-aware handoff to the selected AI app. DUMP maps to frozen upstream ZASSPILL v1.0, DECIDE to ZASSELECTION/PICKS, and DESIGN to ZASSIMPLE/IDEA. ASC selects the subsystem/contract but does not own or duplicate its semantics. The upstream ZASSPILL dependency is satisfied; production private continuity remains separate work under AP-011/T-017.


PF-010 | RESOLVED BY LIVE T-004 TEST  
Finding: The deployed Apps Script Web App correctly reads and previews `#asc` payloads after the user is already authenticated, using `google.script.url.getLocation()`. However, Google's owner-only authentication redirect does not preserve the outer `#asc` fragment from a fresh unauthenticated entry. Therefore direct `/exec#asc=...` through login is not the final flow. D-020's front-door preservation model is required: preserve draft/payload before authentication, complete login, then replay the payload into the authenticated Apps Script preview. No architecture reopening is required.


PF-011 | RESOLVED BY D-022  
Finding: ASC v0.1 will not attempt to force the `#asc` fragment through Google's authentication redirect. Primary auth continuation is B: preserve the pending state in the original ASC tab, authenticate in a new tab, return, then CONTINUE/replay. Fallback A is login then click the ASC link / GO / CONTINUE again. The preserved-user-state requirement is mandatory; seamless automatic cross-tab auth recovery is deferred.


AP-008 | PASS — METHOD GATEWAY v0.1 PROOF  
Source: D-023  
Action: Implement the smallest AI-SYNC Public Method Gateway proof for ZASSPILL_MY, ZASSIMPLE_MY, and ZASSELECTION_MY.  
Dependencies: Current canonical method files in the official ZASS GitHub repository.  
Constraint / feasibility note:
- GitHub remains method SoT.
- Public gateway is read-only/no-login.
- Gateway serves AI-SYNC-held Markdown snapshots itself; no redirect-to-GitHub solution.
- Sync/publish/configuration stays protected.
- Start with MY only.
- Do not modify ZASS method semantics.
Pass / stop condition: PASS — protected GitHub→METHODS sync verified; receiver-facing GitHub Pages proof is readable by Gemini and Copilot; ZASSPILL→DESIGN→ZASSIMPLE method-link handoff passed end-to-end with Gemini. Copilot retrieval variability is recorded as a receiver caveat.  
Feeds design: YES

PF-012 | RESOLVED BY D-023  
Finding: External receiver access to GitHub/raw/CDN/reader URLs is not a reliable method-distribution assumption. AI-SYNC therefore needs a separate public read plane.

PF-013 | CONTRACT BOUNDARY  
Finding: The eight-field ASC Write Contract v0.1 should remain unchanged. Public method distribution needs a separate Method Snapshot Record v0.1 containing method/language/version/source repo/path/commit/synced_at/content. This avoids mixing method-distribution metadata into protected semantic write requests.

PF-014 | MINIMUM v0.1 STORAGE CANDIDATE  
Finding: Current Malay method files are small enough for a minimal three-row registry proof (approximately 16k–20k characters each at review time). A simple `METHODS` tab in ASC DB is therefore a viable initial snapshot store; this is an implementation candidate, not a new Source of Truth. If method size/behavior later makes Sheets unsuitable, storage may change without changing D-023.


PF-015 | RESOLVED BY D-024  
Finding: D-023 changes the practical execution order, but implementation should not begin against an unfinished ZASSPILL dependency. T-004 is therefore paused at its verified boundary and T-013 remains planned/unpromoted. Once ZASSPILL is official, review its actual handoff contract and let the owner decide whether to promote T-013.

PF-016 | D-024 EXECUTION SEQUENCE  
If promoted after ZASSPILL review, split the Method Gateway proof into:
- T-013A: minimal METHODS registry + protected GitHub sync;
- T-013B: public Markdown gateway + Gemini/Copilot readability + ZASSPILL handoff proof;
then resume T-004 front-door/routing/handoff.


PF-017 | T-013A IMPLEMENTATION  
Finding: The smallest compatible implementation uses two separate Apps Script code surfaces:
- protected sync worker: GitHub → METHODS;
- public read gateway: METHODS → Markdown.
This preserves the public-read/protected-write boundary and leaves ASC Write Contract v0.1 unchanged.

PF-018 | T-013A REGISTRY CREATED  
Finding: The active ASC DB now includes a METHODS tab with the nine snapshot columns locked by D-023. Registry structure exists; live GitHub sync execution remains to verify.

PF-019 | PUBLIC GATEWAY PLATFORM NOTE  
Finding: Apps Script ContentService can serve plain text and anonymous web-app access is available through ANYONE_ANONYMOUS with execution as deployer. ContentService may deliver output via a Google-controlled content URL; this is acceptable only if Gemini/Copilot field tests prove receiver readability. The gateway must never redirect the receiver to GitHub.


PF-020 | RESOLVED BY D-025  
Finding: Lock the smallest Method Gateway implementation topology: existing ASC DB `METHODS` registry, protected exact-commit GitHub sync worker, and a separate public anonymous read-only Apps Script gateway. Keep the eight-field ASC Write Contract unchanged. Execute T-013A → T-013B → resume T-004.


PF-021 | ZASSIMPLE v0.3.0 BASELINE  
Finding: AISYNC now follows official ZASSIMPLE v0.3.0. DESIGN is the generic design surface; architecture remains a technical subtype appropriate to AISYNC. Existing confirmed architecture and LOCKED decisions remain valid. Current execution remains T-013A in DO IT.


PF-022 | RESOLVED BY D-026  
Finding: T-013B should not pre-build both Markdown and HTML surfaces. Field-test clean text/Markdown first. Add a clean HTML `/view` compatibility fallback only if a required receiver fails the primary endpoint but can read a normal webpage.


PF-023 | RESOLVED BY D-027  
Finding: ASC should become the continuity authority for ordinary cross-AI continuation. The source AI should not need to carry a full long-form handover packet. Normal transfer should originate from ASC Web/project tree and emit only a short receiver bootstrap, a public Method Gateway link, and a controlled continuity reference.

PF-024 | CONTINUITY SECURITY REMAINS OPEN  
Finding: Method links can be public, but saved project/thread continuity should be private/controlled/scoped. The exact minimal v0.1 mechanism (authenticated fetch, scoped token, expiry, temporary package, short ID, or equivalent) remains open and should be decided during implementation rather than guessed now.

PF-025 | UX BENCHMARK  
Finding: A long ZASSPILL field-test handover packet is now an explicit negative UX benchmark. If ordinary users still need to paste that class of packet, understand raw GitHub/fallback URLs, or manually manage method internals after ASC is complete, the continuity UX is not yet successful.


PF-025 | RESOLVED BY D-028  
Finding: Apps Script anonymous output is browser-readable but is not a reliable receiver-facing host for Gemini/Copilot. A standard static public host is more compatible.

PF-026 | T-013B FIELD RESULT  
Finding: GitHub Pages receiver surface passed browser, Gemini, and Copilot direct-read tests. ZASSPILL successfully carried the exact ZASSIMPLE gateway URL into a DESIGN handoff, and Gemini continued under ZASSIMPLE using the supplied explicit test context.

PF-027 | RECEIVER SOURCE GUARDRAIL  
Finding: One Copilot handoff session failed to fetch the exact public page and substituted repository search, producing stale/incorrect version context. Receivers must not substitute alternate sources when the exact gateway fetch fails.

PF-028 | T-013 CLOSED / T-004 RESUMED  
Finding: T-013A and T-013B are complete for the v0.1 proof. Execution returns to T-004 front-door/auth-preserve/routing/handoff work.


PF-029 | T-004 LIVE AUTH-PRESERVE PROOF — PASS  
Finding: A public Apps Script front door loses the incoming `#asc` fragment before client code can reliably preserve it. A static GitHub Pages front door preserves the fragment in the original tab, while the existing owner-only Apps Script remains the protected authenticated preview.

PF-030 | D-022 LIVE FLOW — PASS  
Finding: The live flow `static /asc/#asc → sessionStorage → SIGN IN in new tab → Google auth → return to original tab → CONTINUE → protected /exec#asc → preview` passed without refresh after the noopener regression fix. The D-028 TEST_ONLY payload rendered correctly and no write occurred.

PF-031 | T-004 NEXT SLICE  
Finding: Authentication-state preservation/replay is now proven. The next smallest T-004 slice is mandatory AI-provider selection plus visible/user-overridable DUMP / DECIDE / DESIGN routing and method-link handoff, while keeping persistence disabled.


PF-032 | T-004 LIVE PROVIDER / ROUTING PROOF — PASS  
Finding: Live browser proof passed for mandatory provider selection (ChatGPT / Gemini / Copilot), deterministic DUMP / DECIDE / DESIGN suggestion, explicit user override persistence, exact route→method→Method Gateway mapping, and preview-only PREPARE HANDOFF. No provider was opened and no network/write action occurred.

PF-033 | T-004 NEXT SLICE — PROVIDER HANDOFF  
Finding: The next smallest implementation slice is capability-aware provider handoff from the prepared preview. It must use the selected provider, active route, public Method Gateway URL, and user draft; it must not claim unsupported prefill/deep-link capability and must retain the no-write boundary.

PF-034 | T-004 LIVE PROVIDER HANDOFF — PASS  
Finding: The v0.1 copy-open fallback passed live. Gemini fetched the exact ZASSIMPLE Method Gateway and continued; ChatGPT also fetched the exact gateway and continued; Copilot failed to fetch the exact gateway in one session but obeyed the no-substitution guardrail and stopped. This satisfies the T-004 capability-aware handoff boundary without claiming unsupported provider prefill.

PF-035 | METHOD TRANSPORT ≠ PROJECT CONTINUITY  
Finding: Gemini's live response showed that method transport alone is insufficient for accurate project continuation: it followed ZASSIMPLE but invented generic AISYNC architecture assumptions because no controlled project continuity was supplied. ChatGPT's stronger project alignment cannot be treated as portable-continuity proof because ambient account/project context may have contributed. D-027/PF-024 controlled continuity remains open and should be implemented separately.

PF-036 | T-004 CLOSED / T-005 PROMOTED  
Finding: T-004 pass criteria are met: auth preservation/replay, visible/user-overridable routing, exact method mapping, capability-aware copy-open provider handoff, truthful exact-source failure behavior, and no persistence. Execution advances to T-005 ASC Core.

PF-037 | T-005 PURE ASC CORE — PASS  
Finding: The ASC Core boundary is implemented as a pure method-agnostic module. Validation, fail-closed authorization, semantic preservation, destination routing, adapter invocation descriptors, and neutral receipt-layer handoff all pass without network or persistence side effects.

PF-038 | CORE ISOLATION — PASS  
Finding: Nested semantic data is deep-isolated from authorization policy mutation; GitHub and ASC_DB adapter invocation descriptors are independent copies; mixed supported/unsupported destinations fail without partial acceptance.

PF-039 | T-005 CLOSED / T-006 PROMOTED  
Finding: T-005 pass condition is met and published at commit `3a56c30d8520ab6824807c76255c973a1f838450`. Execution advances to T-006 GitHub destination adapter.

PF-040 | T-006A GITHUB ADAPTER MOCK PROOF — PASS  
Finding: The GitHub adapter mechanics are implemented and published at commit `7c1dbd64328eb8ff6590374706eb7d603b0f1dc7`. The adapter separates Core semantic input from destination mechanics, supports CREATE / UPDATE / NO_CHANGE, and verifies persistence only by re-reading exact content.

PF-041 | POST-WRITE TRUTHFULNESS  
Finding: A successful GitHub write response is not sufficient to claim verified persistence. VERIFIED_WRITE requires a valid returned commit SHA plus a subsequent read proving exact persisted content and a valid persisted file SHA. If verification fails after a write, the outcome is WRITE_UNVERIFIED and any captured commit SHA is preserved.

PF-042 | T-006 NEXT SLICE — CONTROLLED LIVE WRITE  
Finding: T-006 remains IN PROGRESS. The next smallest slice is T-006B: inject a real GitHub transport into the already-proven adapter boundary, perform one controlled repository write, re-read the persisted file, and capture factual commit/file identifiers without yet creating the final T-007 receipt or HISTORY entry.

PF-043 | T-006B LIVE GITHUB WRITE — PASS  
Finding: The controlled live proof created `proofs/t006b-github-adapter-live.md` through the real GitHub Contents API transport. Adapter outcome was VERIFIED_WRITE with commit `95e019604e6edd778acd0ee252c506d2729f2d09` and persisted content SHA `3be4eed97840c9414207f1cb4f33e7f5021847bf`.

PF-044 | LIVE PERSISTED-STATE VERIFICATION — PASS  
Finding: Remote verification independently confirmed the proof file exists on `main`, its content exactly matches the deterministic proposed content, and the remote file SHA equals the adapter's persisted/content SHA. The successful PUT response was therefore not the sole basis for the verified claim.

PF-045 | T-006 CLOSED / T-007 PROMOTED  
Finding: T-006 pass condition is met. The GitHub adapter now has proven mock mechanics, real runtime-authenticated transport, one controlled verified repository write, and factual commit/file identifiers. Execution advances to T-007 factual Write Receipt + HISTORY persistence.

PF-046 | T-007 CLOSED / T-008 PROMOTED  
Finding: T-007 pass condition is met with externally verified HISTORY row 3. Execution advances to T-008 preview → CONFIRM & SYNC → receipt → redirect.

PF-047 | T-008A RUNTIME-NEUTRAL CONFIRM/SYNC FLOW — LOCAL PASS  
Finding: `flow/confirm-sync.mjs` composes the existing ASC Core, GitHub adapter, and T-007 receipt/HISTORY owners behind a request-bound explicit confirmation gate. Local tests prove zero persistence before confirmation, fail-closed rejection before I/O, factual FAILED receipts recorded in HISTORY without redirect, and redirect only after a verified SUCCESS receipt plus persisted HISTORY. The Apps Script server endpoint currently fails closed.

PF-048 | T-008B APPS SCRIPT BINDING GAP  
Finding: The reusable owners are Node ES modules with an async adapter boundary; Apps Script cannot load them directly, and returning an async result through `google.script.run` is unproven. T-008B must bind the same sources (not re-implement them) with a UrlFetchApp GitHub transport, Script Properties `GITHUB_TOKEN`, `History.gs`, a server-side contract → write-spec rule, and the main Google Sites ASC UI URL, then prove one owner-confirmed TEST_ONLY sync live. The main ASC UI URL is not present in the repository.

PF-049 | T-008B TEST_ONLY DESTINATION POLICY — OWNER LOCKED  
Finding: T-008B uses only a controlled TEST_ONLY write-spec policy: `dzuddiyn/AISYNC`, branch `main`, path `proofs/t008-confirm-sync-live.md`. It must not be generalized into the production Record ID → GitHub path rule. The redirect target is read server-side from `ASC_MAIN_UI_URL`; it is not hard-coded.

PF-050 | T-008B APPS SCRIPT BINDING — LOCAL PASS

Finding: The existing ES-module owners are bundled mechanically into `apps-script/AscRuntime.gs` (namespaced, lazily initialised, freshness-checked) with Utilities-based encoding shims and a UrlFetchApp `fetchImpl`, so Apps Script reuses T-002/T-005/T-006/T-007/T-008A logic without re-implementation. Because returning a Promise through `google.script.run` is undocumented, the server returns `RESULT_PENDING` and the client collects the settled result from the owner's user cache. Local fake-service tests pass; live Apps Script behaviour (microtask settlement, UrlFetchApp headers, Session identity, scopes, Sites redirect) remains unproven until the owner-approved live TEST_ONLY run.

PF-051 | T-008 CLOSED / T-009 PROMOTED

Finding: T-008 pass condition is met by live evidence. Apps Script deployment version 3 ("T-008B Apps Script runtime binding"), with owner-granted Google permissions, processed owner-confirmed request `TEST_ONLY_T008B_LIVE_20261003_0415` against the owner-locked TEST_ONLY target `dzuddiyn/AISYNC` / `main` / `proofs/t008-confirm-sync-live.md`. It produced GitHub commit `fb1da42abaac61d5568548ec254e48c1a1b5aa6b`; the remote file was independently re-read and matched (blob `1cc83134ff94793a2e7e0726b36aa928fdca6a6f`). HISTORY row 4 recorded `SUCCESS` with receipt `adapter_outcome=VERIFIED_WRITE`, `write_performed=true`, `verified=true`, and the flow redirected to the main Google Sites ASC UI `https://sites.google.com/view/aisync-asc/laman-utama`. This also resolves the PF-050 live unknowns for the success path (async result settlement, UrlFetchApp transport, owner Session identity, scopes, Sites redirect). The TEST_ONLY destination policy is not production mapping; general Record ID → GitHub path mapping remains undecided. Execution advances to T-009 read/dashboard path; T-010 is not started.

PF-052 | T-009A/B/C LOCAL READ/DASHBOARD — LOCAL PASS; STALE INDEX VALUES NOT REFRESHED

Finding: The live ASC DB is structurally valid, but some operational/index values are stale (for example, the AISYNC PROJECTS row still refers to T-004 while GitHub has progressed to T-009). T-009 intentionally does not invent GitHub→Sheets semantic refresh rules: the read layer returns Sheet values exactly, exposes `source_artifact` / `source_commit` / `updated_at`, and labels index freshness `UNVERIFIED`; it never derives progress, stage, or latest update and does not repair live Sheet values. Automatic synchronization/index rules remain unlocked and need an owner decision. Local read layer, DECIDE / DESIGN landing, and seven-section project detail pass with fake services; deployment, Google Sites integration, and live read proof remain pending.

PF-053 | T-009 CLOSED / T-010 PROMOTED

Finding: T-009 pass condition is met by live owner verification. Apps Script deployment version 5 ("T-009D dashboard HTML include fix") serves the read-only dashboard at `?view=dashboard`; the published Google Sites ASC UI at `https://sites.google.com/view/aisync-asc/laman-utama` embeds that dashboard successfully. The live AISYNC DESIGN project rendered the required seven project-detail sections, including ACTION_PLAN, RECORDS/ZASS, and factual HISTORY rows for the T-003 bootstrap, T-007 HISTORY proof, and T-008 live SAVE. The dashboard preserves D-014: GitHub remains canonical, Sheets remains operational/index storage, semantic progress/stage are not invented, and stale operational values remain visibly `UNVERIFIED`. Execution advances to T-010 security/replay controls.

PF-054 | T-010A/B LOCAL SECURITY + REPLAY — LOCAL PASS; LIVE PROOF PENDING

Finding: D-029 is implemented locally. One runtime-neutral validator (`transport/envelope-security.mjs`) is shared by Node and Apps Script through the mechanical runtime build; it enforces envelope structure, a ≤ 30-minute `issued_at` / `expires_at` lifetime, and a SHA-256 digest over canonical JSON. The digest is integrity / error detection only, not sender authentication: whoever can rewrite the payload can recompute the digest, so owner identity and explicit confirmation remain the write authority. Preview validates server-side without consuming the request; confirm re-validates, checks owner identity, then claims `request_id` once under `LockService` + Script Properties before any GitHub/HISTORY I/O. A confirmed attempt stays consumed even if the write fails, so retries require a new ASC request; replay markers are not cleaned up in v0.1 (bounded hashed keys). Deployment and live proof remain pending; T-010 stays IN PROGRESS.

PF-055 | T-010 CLOSED / T-011 PROMOTED

Finding: T-010 pass condition is met by local and live evidence. Apps Script deployment version 6 ("T-010 security and replay controls") accepted owner-confirmed secure request `TEST_ONLY_T010_LIVE_20261002221136`, produced verified GitHub commit `62f576194dada61584f07752b17c91ee6865d12c`, and persisted HISTORY row 5 with SUCCESS / VERIFIED_WRITE / write_performed=true / verified=true. Reusing that request_id returned `REPLAY_REJECTED` with no second HISTORY row. Expired request `TEST_ONLY_T010_EXPIRED_20261002221136` returned `REQUEST_EXPIRED` with CONFIRM & SYNC disabled and no HISTORY row. Tampered request `TEST_ONLY_T010_TAMPER_20261002221136` returned `INTEGRITY_MISMATCH` with CONFIRM & SYNC disabled and no HISTORY row. D-029 therefore holds live for valid, replayed, expired, and altered requests. SHA-256 remains an integrity-consistency check rather than sender authentication; owner identity and explicit confirmation remain the write authority. Execution advances to T-011.

PF-056 | T-011 CLOSED / D-030 SUCCESS RETURN REFINEMENT LOCKED

Finding: The owner issued a real ZASSIMPLE `SAVE`, producing secure request `TEST_ONLY_T011_ZASSIMPLE_SAVE_20261002224115`. The protected Apps Script flow required explicit CONFIRM & SYNC, then produced GitHub `VERIFIED_WRITE` commit `50a3372c0540a9db021d0c0518b010836c58f247` to `proofs/t008-confirm-sync-live.md`; the persisted content was independently re-read (blob `b021e31686be01df064b1f13992f33d7fc2c5bc3`) and matched the ZASSIMPLE SAVE payload. HISTORY row 6 recorded SUCCESS with `write_performed=true` and `verified=true`. The success page exposed `Return to main ASC UI`, and live owner observation established that a user click was required rather than an automatic top-level redirect. D-030 therefore locks the user-activated return link/button as the guaranteed v0.1 success return path; automatic top-level navigation is optional when permitted by the platform, and failure/unverified states must not imply success. T-011 is PASS. The TEST_ONLY fixed destination remains a proof-only policy, not a general production Record ID → GitHub path rule. Historical note: at T-011 closure T-012 was still blocked; that dependency was later satisfied and T-012 completed PASS.

PF-057 | T-015 LOCAL CANONICAL STATE — PASS; LIVE BINDING PENDING

Finding: T-015 now has a local, method-agnostic continuity-state implementation aligned to D-032/D-033/D-034. `continuity/private-continuity-state.mjs` proves opaque stable thread identity, authoritative revision reads, matching event lineage, semantic `req_<ULID>` idempotency, optimistic-concurrency rejection, explicit bootstrap resolution outcomes, delete/tombstone anti-resurrection, and derived thread listing without enumerating ZASSPILL lifecycle operations or inspecting semantic fields.

`apps-script/PrivateContinuityDriveStore.gs` selects a dedicated private Google Drive JSON file as the closed-beta ASC Private Continuity Store backing, with Script Lock serialization and read-back verification; Script Properties contain only store locators. Exact GitHub→index freshness is implemented as repository/ref/commit evidence using the canonical default-branch head.

The live PROJECTS sheet was backward-compatibly extended with `source_ref=main` for AISYNC, while its stale source_commit/semantic values were deliberately not manually repaired. All repository `test-*.mjs` tests pass locally and `git diff --check` must remain clean before save. T-015 remains IN PROGRESS until the implementation is saved to canonical GitHub, deployed, the real private Drive store is created/verified, and a live dashboard read shows factual freshness from the live index. T-016 must not start yet.


PF-058 | T-015 CLOSED / T-016 PROMOTED

Finding: T-015 is PASS. Canonical implementation PR #10 merged at `120d2d7042d9adfbacf3f4edea8943deb79c29b7`; live defect recovery/hotfix PR #11 merged at `7a4c8777c0f79a8e34d29dff8972d0f906e1d3f8`. The private continuity live proof verified create/read/revision-2 mutation, semantic duplicate idempotency, stale-revision conflict, matching event lineage, delete, and tombstone behavior, with independent private Drive read-back of the authoritative JSON. The factual index proof correctly reported `STALE / CANONICAL_HEAD_DIFFERS_FROM_INDEXED_COMMIT` rather than silently repairing the ASC DB index. All 22 repository tests pass. Apps Script version 10 (`T-015 canonical continuity state verified hotfix`) is deployed on the protected production deployment and the owner-only endpoint remains behind the Google sign-in gate. AP-009 is complete; AP-010 / T-016 is promoted. No Production write-path claim is made yet.


PF-059 | T-016 CONTROLLED LIVE PRODUCTION WRITE — PASS; CANONICAL SAVE / FINAL DEPLOYMENT PENDING

Finding: T-016 Production v1 write mechanics are locally implemented and a controlled owner-confirmed live SAVE has passed through the temporary protected deployment using the server-side production project registry and a GitHub App installation credential scoped to exactly `dzuddiyn/AISYNC`.

Live request:
- request_id `ASC-T016-20261003181842`;
- Record ID `T016-LIVE-20261003181842`;
- deterministic target `dzuddiyn/AISYNC@main -> records/T016-LIVE-20261003181842.md`;
- adapter outcome `VERIFIED_WRITE`;
- GitHub commit `6da32a0a36c74abc2640d55f6195b56217e0e2ca`;
- GitHub author `aisync-production-writer-dzuddiyn[bot]`;
- HISTORY row 7 `SUCCESS`, `write_performed=true`, `verified=true`, exactly matching request/commit/resource.

Independent GitHub read-back confirmed exact file content and that the commit changed only the deterministic production target. Independent Sheets re-read found one matching HISTORY row.

GitHub App bootstrap is also independently proven: app slug `aisync-production-writer-dzuddiyn`, exact repository installation `dzuddiyn/AISYNC`, installation ID present, production registry configured, and GitHub App configuration valid. Temporary setup/recovery deployment was removed after proof; Apps Script @HEAD was cleaned back to the non-temporary T-016 implementation.

Local proof after cleanup: all 24 repository `test-*.mjs` tests PASS; runtime freshness check PASS; `git diff --check` PASS; changed-file credential-pattern scan PASS. T-016 remains IN PROGRESS until its branch is canonically saved/merged and the protected production deployment is updated from merged `main`.


PF-060 | T-016 CLOSED / T-017 PROMOTED

Finding: T-016 is PASS. Canonical Production v1 source merged through PR #13 at `cfbc379408080ee22b4eaf47835455829858b949` and protected Apps Script production was deployed from merged `main` as version 17 (`T016-production-write-canonical`). Controlled live owner SAVE `ASC-T016-20261003181842` produced GitHub App commit `6da32a0a36c74abc2640d55f6195b56217e0e2ca` at deterministic target `records/T016-LIVE-20261003181842.md`, with exact GitHub read-back and matching HISTORY row 7. Final protected-production verification `ASC-T016-FINAL-20261003185851` returned `NO_CHANGE`, `write_performed=false`, `verified=true`; HISTORY row 8 matched, canonical main stayed at the PR #13 merge commit, and the success flow returned to the main ASC UI. All 24 repository tests pass from merged main. AP-010 is complete; AP-011 / T-017 is promoted.


PF-061 | T-017 FIRST EXTERNAL RECEIVER FIELD RUN — INTEGRATION DEFECTS FOUND / FIX PREPARED

Finding: The first Gemini continuation run preserved the correct synthetic `thread_id` and `current` continuity value, but returned `method_version: 0.1.0` and placed the scoped `cr_<ULID>` continuity reference in `source_revision`. Independent inspection showed that the receiver-facing GitHub Pages ZASSPILL gateway itself was stale at v0.1.0 / source commit `38760ddbc194ea530730bb615be2553cc38f267b`, while the frozen canonical upstream contract is ZASSPILL v1.0.0. Therefore the method-version result was faithful to the stale gateway rather than a receiver hallucination. The revision/reference mix-up exposed an ambiguity in the transfer bootstrap presentation.

Local remediation prepared:
- refresh `docs/method/zasspill/my/index.html` from canonical upstream commit `9a6755ea4dc2f9a067343855331078d9a1773a0c`, ZASSPILL v1.0.0;
- emit separate `thread_id`, numeric `source_revision`, and `continuity_reference` fields;
- carry `expected_method_version` and require receivers to stop with `STALE_METHOD_GATEWAY` on version mismatch;
- add static gateway regression coverage;
- keep private WHO/provider memory outside transferred context.

The synthetic provider test project was removed from the ASC Private Continuity Store and the temporary proof deployment was undeployed after evidence capture. T-017 remains IN PROGRESS until the refreshed gateway is canonically published and external receiver re-proof passes.


PF-062 | T-017 METHODS >50K STORAGE BLOCKER — LOCAL REMEDIATION PASS / SAVE GATE

Finding: canonical ZASSPILL v1.0.0 is 62,797 characters, beyond the Google Sheets 50,000-character cell limit. The attempted reconciliation therefore exposed a real storage blocker rather than a semantic or receiver defect. Live inspection also found a partial/hybrid `METHODS` state: the ZASSPILL row had been owner-proofed at v1.0.0 using a temporary `gzip+base64:` representation, while ZASSIMPLE and ZASSELECTION remained on the prior source commit; the ZASSELECTION version cell had also been auto-coerced by Sheets from `0.2.2` into a date-formatted numeric value.

This is treated as implementation/storage hardening under PF-014/D-028, not a new authority model. The local `t017-methods-storage-hardening` patch is based on canonical `main` commit `9b820214975848491c4731b4f1acdc5b2263db08` and preserves the existing three-row, nine-column logical Method Snapshot Record and one-sync/one-source-commit rule. Physical `METHODS.content` storage now remains plain text through 45,000 characters, uses `gzip+base64:` above that threshold, fails closed if the encoded payload exceeds 49,000 characters, and is transparently decoded on read. Snapshot rows are formatted as text before write so version strings cannot be silently converted into spreadsheet dates. No truncation is allowed and GitHub remains the method Source of Truth.

Evidence: the real 62,797-character ZASSPILL v1.0.0 payload was already round-trip proven by the temporary owner-only Apps Script reconciliation at about 26.4k stored characters; the canonicalized local regression test passes; a fresh clone of current `main` plus the patch passes all 27 repository `test-*.mjs` files with `git diff --check = 0`.

T-017 remains IN PROGRESS. Next gate after explicit owner SAVE: commit/push the bounded patch, review/merge PR, deploy the canonical sync/read implementation, run one full three-method exact-HEAD reconciliation, independently verify all three live `METHODS` rows share the same canonical source commit with correct versions/content, then rerun the external Gemini continuation proof. T-017 closes only if that field re-proof passes.


PF-063 | T-017 CLOSED / T-018 PROMOTED

Finding: T-017 is PASS. Canonical gateway/bootstrap remediation was merged through PR #17 (`197276b422a8c128097b545e08cc9215ad4996c3`). The Google Sheets >50k method-snapshot blocker was canonically hardened through PR #23 (`f9e63c013b63bcfd228123f08e986c175fb50a0b`) without truncation and without changing the logical METHODS contract or GitHub method authority. Live verification then exposed an Apps Script gzip decode compatibility defect; the explicit gzip blob content-type fix and stronger regression coverage merged through PR #24 (`2f461e1da059c3dfdb037dc2881956aa5752218f`).

The live METHODS registry was fully reconciled in one three-method batch against exact ZASS `main` commit `26b174e4dbc6570452b372712e9bf49abc86c4ef`: ZASSPILL v1.0.0 / 62,797 chars stored as 26,468-char `gzip+base64:`, ZASSIMPLE v0.3.0 / 18,748 chars plain, and ZASSELECTION v0.2.2 / 16,025 chars plain. All three rows share the same source commit, version cells remain text, and Public Method deployment v5 transparently returns the original Markdown rather than physical storage encoding.

Final external receiver re-proof used Google Antigravity CLI from an empty workspace with only a scoped temporary `read_url(dzuddiyn.github.io)` permission. It fetched the exact receiver-facing GitHub Pages ZASSPILL gateway and returned `T017_RECEIVER_PASS`, `method_version: 1.0.0`, exact `thread_id: th_01ARZ3NDEKTSV4RRFFQ69G5FAV`, numeric `source_revision: 3`, distinct `continuity_reference: cr_01ARZ3NDEKTSV4RRFFQ69G5FB8`, and exact continuity sentence `Valve calibration checkpoint is row 18 with target marker 42.` The temporary read-url permission and temporary Gemini CLI settings were removed after proof; no provider-held personal memory/profile was transferred. AP-011 is complete and AP-012 / T-018 is promoted.


PF-064 | T-018A PROJECT / THREAD CONTINUATION HANDOFF — LOCAL PASS / SAVE GATE

Finding: after T-017 closure, the remaining human-journey gap was factual and narrow: Project Workspace could show project state, save/sync health, Review/CI, and History, but `Continue naturally` still opened a generic public Front Door without the selected private project/thread continuity. That meant Project → Thread → Route/Provider → handoff was not yet one coherent owner workflow.

Local remediation adds an owner-only Apps Script binding (`DashboardContinuity.gs`) plus Workspace controls. The protected dashboard now lists only minimal private thread projections (title/current/revision identity), requires explicit AI provider, keeps DUMP/DECIDE/DESIGN visible and overridable, accepts the user's next-message draft, creates the existing cross-method handoff + 10-minute scoped continuity reference server-side, builds the existing T-017 scoped bootstrap with expected method-version guard, and returns only the bootstrap/provider URL to the owner client. The opaque bearer token returned by the reference service is deliberately not returned to the browser. No GitHub/Sheets writer is added and no provider-held memory/profile is imported.

The ordinary surface hides raw bootstrap mechanics by default. After PREPARE HANDOFF it exposes COPY HANDOFF, SHOW HANDOFF TEXT (manual fallback), and OPEN PROVIDER. The generic public Front Door remains available only as a new-conversation fallback. Existing Workspace/Review/History, factual SAVE health, CI, and persistence boundaries remain unchanged.

Evidence: focused dashboard continuity/UI/read tests PASS; fresh clone of canonical `main` `81d53f9a04b1b015e6750f9d5df12ee51179ea90` with the bounded patch passes all 28 repository `test-*.mjs` files and `git diff --check = 0`. T-018 remains IN PROGRESS; after owner SAVE/merge/deploy, continue with the remaining factual SAVE → receipt/HISTORY → CI → reopen/transfer join and owner-visible production journey proof.


PF-065 | T-018A PRODUCTION DEPLOY + ZERO-THREAD BOOTSTRAP — LOCAL REMEDIATION PASS / SAVE GATE

Production deployment: canonical PR #33 handoff slice was released from immutable production v27 plus the required canonical T-017 runtime/continuity wrappers and T-018A Workspace files, producing protected Apps Script version 28 (`T018A-project-thread-handoff`). An independent clone of version 28 matched all 16 production files exactly, and the development HEAD was restored after release. Owner-visible production Workspace verification confirmed the new `Continue this project` card, Thread / AI provider / Route / What next controls, and PREPARE HANDOFF surface.

Live blocker investigation: the production UI truthfully showed `No private thread available`. Independent Google Drive inspection of the owner-only continuity store found no `AISYNC` project/thread; only the prior T-015 proof project remains and its test thread is tombstoned/deleted. Therefore the UI state is factual, not a read defect, and synthetic T-017 receiver-proof data must not be copied into AISYNC.

Bounded remediation: zero-thread projects now expose explicit first-thread bootstrap. The owner supplies `Thread title` and `What next?`; `START PRIVATE THREAD` persists only `{ title, continuity: { current } }` through the existing private continuity bootstrap with `NO_MATCH`. ASC generates the private request/thread/revision/event identities, does not invent lifecycle state or other method semantics, rejects creation if a thread appears before the write, and does not touch GitHub or Sheets. After success the Workspace reloads continuity, selects the created thread, and the existing scoped handoff path becomes available.

Evidence: focused continuity/UI/read regressions PASS; fresh clone of canonical `main` `b9483b39e5d38594cc86ff525659c80502d382f5` with the bounded four-file patch passes all 28 repository `test-*.mjs` files and `git diff --check = 0`. Next gate is owner SAVE/merge/deploy of this first-thread bootstrap, followed by a live owner creation + handoff proof. T-018 remains IN PROGRESS.


PF-066 | T-018B PROVIDER RETURN → PROTECTED ASC SAVE — FIELD DEFECT FOUND / LOCAL PASS / SAVE GATE

Live field finding: after T-018A first-thread + scoped Gemini DESIGN handoff passed in production, the owner issued `SAVE` inside Gemini. Gemini responded as if state had been saved locally/in-session and files were ready to push. Independent ASC Private Continuity Store read-back proved the opposite: the live handoff still had `result=null`, the scoped reference had not become persistence evidence, and no GitHub/HISTORY SAVE occurred. Therefore the provider response is treated as a factual T-018 UX defect, not a successful SAVE.

Bounded remediation: outbound handoff bootstrap now adds an explicit SAVE/return-to-ASC instruction. A receiving AI must not claim provider-local/repository persistence; on owner SAVE it returns one short `ASC_METHOD_RESULT_BEGIN … ASC_METHOD_RESULT_END` JSON block containing the exact handoff/thread/source revision/producing method plus owner-confirmed outcome, still-open items, and artifact refs. Workspace exposes the return mechanics only after handoff preparation: `Return from AI` → `PREVIEW RETURN` → `PREPARE ASC SAVE` → `OPEN ASC SAVE`.

Authority/security boundary: preview is non-mutating. The server parses a strict result shape, re-reads the protected handoff, verifies handoff/thread/source-revision/target-method identity, reconciles against the current private-thread revision, and rejects prose-only false-save claims, stale/divergent results, unknown handoffs, or production-policy denial. On owner `PREPARE ASC SAVE`, the result envelope is recorded idempotently against the real handoff and represented as a separate GitHub artifact `METHOD-RESULT-<handoff ULID>` under the existing production `records/` mapping. ASC—not the provider—creates/seals the existing v0.1 transport envelope and returns the existing public Front Door fragment link. GitHub/Sheets persistence still does not occur until the protected ASC preview is opened and the owner explicitly presses `CONFIRM & SYNC`.

No continuity semantic auto-application is introduced in this slice. Accepted method-result recording and GitHub artifact persistence remain separate from deciding how a method outcome should update `continuity.current`; reopen/transfer reconciliation stays as the next T-018 slice after live SAVE proof.

Evidence: focused T-018A/T-018B continuity + dashboard UI/read regressions PASS. The exact failure mode from the field run—ordinary prose claiming a local checkpoint without an `ASC_METHOD_RESULT` block—is rejected with `METHOD_RESULT_BLOCK_MISSING`. Fresh clone of canonical `main` `da64175b5fcd80cc428bd0487d8569f60b41cd59` plus the bounded patch passes all 28 repository `test-*.mjs` files and `git diff --check = 0`. Next gate: owner SAVE of T-018B, merge/deploy, then rerun the Gemini SAVE journey through protected preview → CONFIRM & SYNC → factual receipt/HISTORY → CI.


PF-067 | T-018B LIVE SAVE PASS + T-018C SAVED RESULT REOPEN/TRANSFER — LOCAL PASS / SAVE GATE

Production evidence: protected Apps Script v30 completed the ordinary-user T-018B chain from a fresh Gemini DESIGN handoff through bounded `ASC_METHOD_RESULT`, read-only return preview, PREPARE ASC SAVE, Public Front Door replay, protected security preview, and owner `CONFIRM & SYNC`. Request `ASC-T018B-01M42V6M2CX4ZJAN602WD97194` returned `SAVED / VERIFIED_WRITE`; independent GitHub read confirmed commit `11ff6215ecc95f4bfc4e8282d8e82a5206b31ac3` and exact artifact `records/METHOD-RESULT-01M42TNZ3WXJFWFS39EWY581SY.md`; independent HISTORY read confirmed `SUCCESS`, `write_performed=true`, `verified=true`. GitHub Pages run `37184900100` for the SAVE commit completed successfully. No `ZASS CI / zass-check` run exists for that artifact commit, so Pages success is not treated as ZASS CI PASS. The PROJECTS operational index remains STALE on old source commit `2e0c773faaa2597a5df72fa77fea42d911bb0412`.

Reopen/transfer finding: after canonical SAVE, the private thread `th_01M42FTAP1KSHHP9FMJ2M2QTWB` truthfully remains revision 1 with the pre-SAVE `continuity.current`. T-018B intentionally did not auto-apply provider semantics. Therefore creating another handoff immediately would transfer the old checkpoint even though the result artifact is SAVED.

T-018C bounded remediation: Workspace continuity read now detects recorded CONFIRMED_RESULT handoffs that are still at their source revision and have a matching verified GitHub SAVE receipt in HISTORY. These are surfaced after reload as `Saved result ready to continue`; the owner must explicitly select `ADVANCE THREAD FROM SAVED RESULT`. No client-session provider text is required. If multiple verified saved results are pending, all are shown and ASC explicitly refuses to choose one automatically.

Advance authority: the server re-reads the protected handoff result, validates handoff/thread/source-revision/producing-method identity, requires the exact `records/METHOD-RESULT-<handoff ULID>.md` HISTORY receipt with GitHub `SUCCESS` and `verified=true`, and re-reads the current private thread. A stale or divergent revision fails closed. On exact source revision, the existing private continuity mutation primitive applies `confirmed_outcome → continuity.current` and explicit `still_open → continuity.open`, preserves all other semantic fields, appends event lineage containing method-result record ID, handoff ID and SAVE commit, and increments the revision exactly once. Deterministic request identity makes retries idempotent; an exact already-applied event returns `ALREADY_ADVANCED`. This action performs no new GitHub or Sheets write.

Local verification: focused T-018A/T-018B/T-018C continuity, UI and read regressions PASS; missing receipt fails `VERIFIED_SAVE_REQUIRED`; stale revision fails `REVISION_CONFLICT`; exact retry is idempotent; multi-pending UI requires explicit owner choice. Fresh clone of canonical `main` `11ff6215ecc95f4bfc4e8282d8e82a5206b31ac3` plus the bounded T-018C patch passes all 28 repository `test-*.mjs` files and `git diff --check = 0`.

Next gate: owner SAVE T-018C, merge/deploy from immutable production v30, prove live thread revision 1→2 with new current/open + event lineage, then prepare a handoff to a second AI provider and independently verify that its source revision and minimum continuity use revision 2 rather than the old checkpoint.


PF-068 | T-018 INTEGRATED HUMAN UX — FULL END-TO-END PASS / CLOSURE SAVE GATE

Closure evidence: protected production v31 completed the ordinary-user chain from project/thread through provider handoff, owner-confirmed SAVE, factual receipt/HISTORY, truthful CI/index status, saved-result continuity advance, and reopen/transfer to a second AI provider. Private continuity advanced from revision 1 to revision 2 only after a verified GitHub SAVE receipt. The next ChatGPT handoff stored `source_revision: 2`, the advanced saved `current`, and `open: []`; receiving ChatGPT echoed exactly the same `thread_id`, `source_revision: 2`, `current`, and `open: []` with no provider-memory enrichment.

Pass interpretation: T-018's CI requirement is satisfied by truthful commit-linked status integration, not by inventing a `ZASS CI` result where no workflow exists. The method-result SAVE commit had a successful GitHub Pages build but no `ZASS CI / zass-check` run, while the operational project index remained STALE; ASC preserved those factual states. This is correct integration behavior and not a hidden PASS claim.

Boundary result: no provider received write credentials, no provider-local save was accepted as canonical persistence, PREVIEW remained non-mutating, private continuity remained owner-only, continuity advance created no extra GitHub/HISTORY write, stale revisions fail closed, and cross-provider transfer carried only scoped minimum continuity.

Historical checkpoint after T-018: T-018 / AP-012 PASS and T-019 / AP-013 became CURRENT while T-020/T-021 remained queued. Current tracking later in this file now records T-019 / AP-013 PASS and AP-014 / T-020 CURRENT. AISYNC remains `DO IT` until closed beta and release acceptance complete.

Next gate: owner SAVE of the documentation-only T-018 closure/promote patch.


PF-069 | T-019A PRIVATE CONTINUITY BACKUP / RESTORE — LOCAL PASS / LIVE PROOF PENDING

Finding: the existing owner-private Drive store already used copy-on-write verified state files, but prior authorities were only retired to Drive Trash and there was no bounded recoverable backup catalog, explicit restore contract, expected-current guard, or schema-safe recovery procedure. T-019A adds reliability without changing authority: every changed private-continuity transaction must first create a private PRE_WRITE snapshot of the current authoritative state, read it back, validate it, and keep retention within 20 active snapshots. If backup creation/verification/retention fails, the mutation aborts before the authoritative Script Property pointer moves. Read-only transactions create neither snapshot nor new version.

Manual backup/list/restore primitives remain server-private. Restore requires the backup ID plus the exact current authoritative file ID observed during inspection, rejects stale-current races, malformed/unrecognized backups, unsupported backup versions, and unsupported state schema, then creates a PRE_RESTORE safety snapshot, writes the selected backup state into a new verified authoritative file, moves the pointer only through the normal verified write path, and independently re-reads the restored state. The selected backup and safety backup are protected from retention during the restore. A restore never points authority directly at a backup file.

Evidence: unit regression proves pre-write snapshot contains the pre-mutation state, backup failure leaves state/pointer unchanged, manual backup/list, divergent-state restore, PRE_RESTORE safety backup, stale-current rejection, unsupported-schema rejection, and 20-snapshot retention. Continuity integration regression proves eight existing T-015/T-017 state mutations produce eight active backups while exactly one state file remains active authority. Fresh clone of canonical base `7f8cced5a2672cf4462674d7cd3450c2452e988e` with the bounded patch passes all 28 repository `test-*.mjs` files and `git diff --check = 0`.

Boundary/limitation: backups remain in the same owner Drive environment, so this slice is rollback/recovery for state-file corruption, bad mutation, operator error, and schema-incompatible restore attempts; it is not yet account-wide disaster recovery. Live Drive backup/restore proof, replay-marker lifecycle, degraded/offline behavior, telemetry, secret rotation, deployment/rollback and full operator acceptance remain open under T-019 / AP-013.


PF-070 | T-019A PRIVATE CONTINUITY RECOVERY — LIVE PASS

Finding: canonical T-019A source merged through PR #38 at `115aafba5af21c1905c0073a4d299fe28cd93e5c` and deployed as protected Apps Script v32. The live owner-only proof restored the exact same private semantic state through a new authoritative file, proving the recovery path without changing project/thread meaning. Authority moved from `1LC5xtpMVc0TBP69b6Ael5COo5tBrBSlK` to `1Tengb02h3dbadqNP2d53vsBkVYc3UGYb`; baseline backup `14dAnxbSqF4zN55loZ_lZ6f7n66iH4KBu` and PRE_RESTORE safety backup `1EE6FUFLVYQ2NB_iU1UsAb6sKTdF2nfOB` were independently re-read as private and both contained state exactly equal to the restored authority. Schema remained 0.1, project count remained 2, and AISYNC continuity remained revision 2 with unchanged current/open semantics. Temporary proof deployment was removed, development HEAD restored/verified 16/16, and protected production remained @32.

Historical checkpoint after T-019A: T-019A was LIVE PASS and T-019 / AP-013 remained CURRENT; replay/idempotency and later reliability slices were still ahead at that time. Those later slices are now completed through T-019H.


PF-071 | T-019B REPLAY / IDEMPOTENCY LIFECYCLE — LOCAL PASS / SAVE GATE

Finding: T-010 replay protection was secure but operationally unbounded because Script Property markers had no expiry lifecycle. T-019B keeps the same hashed-key + script-lock authority while binding marker lifecycle to the envelope expiry already verified by D-029. New markers store claimed_at/expires_at/purge_after and retain for 24 hours after envelope expiry. Legacy T-010 markers are conservatively purgeable only after claimed_at + the locked 30-minute maximum envelope lifetime + 24 hours. Cleanup happens atomically before a new claim; malformed marker state, list/delete failure or unverifiable deletion fails closed before GitHub/HISTORY I/O.

Regression also re-proves D-034 separation: same transport ID is REPLAY_REJECTED with no duplicate destination/HISTORY work, while a fresh transport ID carrying identical semantic GitHub content reaches the adapter and returns NO_CHANGE with no second PUT. After marker cleanup, the original expired envelope still fails SECURITY / REQUEST_EXPIRED, so lifecycle cleanup does not reopen replay. T-019B is LOCAL PASS; canonical save/merge/deploy/live proof remain pending.

PF-072 | T-019B REPLAY / IDEMPOTENCY LIFECYCLE — LIVE PASS

Finding: canonical T-019B implementation merged through PR #40 at `e4f37e652847dc170c0876ab9b246c62cb21c23f` and protected Apps Script production is pinned to v35 (`T019B-replay-idempotency-lifecycle`). Deterministic live proof `T019B-LIVE-DET-20261004-103536-a317023f` exercised the real production Script Properties replay store under the script lock, production project registry, GitHub App installation credential boundary, and the existing canonical T-016 target. Current-format and legacy expired markers purged, active markers remained, new markers carried exact `expires_at + 24h` retention, same transport request was rejected as `REPLAY_REJECTED`, and a fresh transport request carrying identical semantic content verified `NO_CHANGE`.

The live proof made 2 GitHub reads and 0 GitHub PUTs. Independent GitHub verification afterward confirmed `main` still at `e4f37e652847dc170c0876ab9b246c62cb21c23f`, target blob `5427b6cc4aa0c2a87a9532121e1cb8a4bc0a7e22` unchanged, and exact target content unchanged. Temporary proof deployment was removed, development HEAD restored/verified 16/16, and protected production remained v35. Canonical evidence is recorded in `proofs/t019b-replay-idempotency-live.md`.

Conclusion: T-019B is LIVE PASS. T-019 / AP-013 remains CURRENT. At this checkpoint degraded/offline behavior was the next reliability slice; after T-019C closure, remaining work is truthful telemetry, broader disaster recovery, secret rotation, deployment/rollback, and final operator runbook acceptance.

PF-073 | T-019C DEGRADED / OFFLINE BEHAVIOR — LIVE PASS

Finding: the existing write path already failed closed but collapsed several materially different reliability states into ordinary FAILED. T-019C introduces a factual operational distinction without changing persistence authority. Before CONFIRM, protected-preview unavailability is DEGRADED: the pending fragment remains in session storage, CONFIRM stays disabled, and RETRY SERVER CHECK repeats only the non-writing security/owner preview. RESULT_CACHE_UNAVAILABLE remains same-transport retryable only because it is proven pre-claim/pre-write.

After CONFIRM has been sent, browser/server response loss, FLOW_EXCEPTION, missing/unreadable cached result, and adapter WRITE_OUTCOME_UNKNOWN are OUTCOME UNKNOWN with writePerformed=null. The UI forbids blind duplicate CONFIRM and exposes CHECK RESULT, which performs only getConfirmSyncResult(request_id). WRITE_UNVERIFIED is DEGRADED. A verified destination write whose HISTORY persistence fails is also DEGRADED and explicitly must not be repeated. No degraded/unknown state can claim SAVED or redirect.

The Public Front Door already supplies the bounded offline-safe fallback: draft/provider/route are session-preserved, handoff bootstrap preparation is client-side, visible manual copy remains available when clipboard integration fails, and no persistence writer is exposed. This does not invent ASC revisions/events/receipts; upstream ZASSPILL LOCAL_CHANGES/reconciliation semantics remain authoritative for offline semantic work.

Focused regressions for confirm UI, Apps Script binding, and Public Front Door pass with zero real network/GitHub/Sheets writes. Canonical implementation then merged through PR #42 at `df6576a9d9655cf1c3b89072aacd40479ca133d8`, deployed as protected Apps Script v39, and passed deterministic live proof `T019C-LIVE-20261004-112655-9312eff5`. Independent HISTORY search found zero proof rows; GitHub `main` plus the canonical T-016 target remained unchanged; temporary proof deployment was removed and development HEAD restored/verified 16/16. T-019C is LIVE PASS.

PF-074 | T-019D TRUTHFUL TELEMETRY — LIVE PASS

Finding: existing AISYNC surfaces already exposed several truthful signals (index STALE/UNVERIFIED, CI READ_ERROR/NOT_FOUND, factual receipts), but there was no single operator snapshot with a conservative cross-source contract. T-019D adds owner-only `getProductionTelemetry(project_id)` as an ephemeral, non-persisted observation. It reads current ASC DB project evidence, canonical GitHub/index freshness, the existing private continuity authority without invoking store creation, GitHub App auth via a short-lived token probe with no credential disclosure/repository write, and the latest indexed SAVE/HISTORY receipt.

Each probe carries its source and observation timestamp. Missing evidence stays NOT_OBSERVED / UNVERIFIED / UNKNOWN; STALE and FAILED remain visible. Overall ERROR wins on failed/not-configured required probes, DEGRADED on stale/failed observations, UNKNOWN on incomplete evidence, and OK is possible only when every required probe has direct acceptable evidence. Review loads telemetry on demand and exposes REFRESH TELEMETRY; Workspace remains compact/default and there is no background polling.

Focused server and UI regressions prove truthful state classification, no continuity-store creation, no telemetry persistence/business-state mutation, no credential material in output, and factual rendering of OK/DEGRADED/UNKNOWN/ERROR. Canonical implementation then merged through PR #44 at `3873e3289b9051d65c4d315daeb1e68adabaa615`, deployed as protected Apps Script v42, and passed live owner proof `T019D-LIVE-20261004-121558-21ca5345`. The live snapshots truthfully stayed `DEGRADED` because index freshness was `STALE`; HISTORY and private continuity fingerprints were unchanged, no secret material was returned, GitHub remained unchanged, temporary v43 proof deployment was removed, and development HEAD restored/verified 16/16. T-019D is LIVE PASS.

PF-075 | T-019E BROADER DISASTER RECOVERY / MIGRATION SAFETY — LIVE PASS

Finding: T-019A recovered private continuity inside its existing owner Drive environment, but Production v1 still lacked a portable cross-component recovery package and a safe way to move the operational ASC DB without editing code. T-019E adds a versioned owner-private DR bundle containing exact PROJECTS / RECORDS / ACTION_PLAN / HISTORY matrices, validated private continuity state, canonical GitHub recovery point, non-secret configuration context, and per-component/overall checksums. Credential values are deliberately excluded.

Migration safety is fail-closed: unsupported bundle/schema versions, missing/duplicate required DB headers, row-shape/checksum mismatch, invalid continuity state/checksum, invalid canonical recovery point, or secret-like material all reject the bundle. No implicit schema upgrade occurs.

ASC DB reads and HISTORY writes now share the same `ASC_DB_SPREADSHEET_ID` Script Property with the locked v0.1 ID as fallback. Recovery can build a private staged spreadsheet from the bundle and validate its exact checksum before any production pointer change. Migration requires expected-current ID and expected candidate SHA-256, revalidates after the switch, and restores the prior pointer if verification fails. Continuity disaster recovery likewise refuses to overwrite a healthy authority, can rebuild only when the current authority is unavailable, and restores prior folder/file pointers if post-recovery verification fails.

Focused T-019E tests prove bundle creation/validation, corruption and secret rejection, four-tab recovery-copy reconstruction, guarded DB migration, continuity disaster recovery, and rollback behavior. Existing dashboard/HISTORY regressions remain PASS under the shared pointer and the full repository suite passes. Canonical implementation merged through PR #46 at `05f3a336bd41e8cf2f73ea2cb82e203328d852ca`, deployed as protected Apps Script v44, and passed live proof `T019E-LIVE-20261004-131641-26c53994`. The live proof migrated to a private checksum-identical ASC DB recovery copy, verified both read and HISTORY targeting, rolled back to the original DB with exact configuration restored, left HISTORY/continuity/GitHub unchanged, removed the staged copy, removed temporary proof v45, and restored development HEAD 16/16. T-019E is LIVE PASS.

PF-076 | T-019F SECRET ROTATION — LIVE PASS

Finding: Production v1 already used a GitHub App for writes, but the active private key had no bounded rotation state machine and project freshness still depended on a separate long-lived GITHUB_TOKEN. T-019F adds server-private staged rotation: candidate key validation occurs before any active-key mutation; promotion is script-lock protected, preserves the previous key temporarily, verifies the promoted active key, and auto-rolls back if verification fails. Manual rollback remains available until finalization. Finalization requires explicit confirmation that the previous GitHub-side key has been revoked, revalidates the active key, then removes the previous local secret.

Rotation status emits only key-presence booleans, SHA-256 fingerprints, legacy-token presence, and allowlisted audit metadata. Arbitrary metadata is sanitized and no key/token values are returned.

Project freshness now reuses GitHub App installation auth rather than GITHUB_TOKEN. A bounded retirement primitive removes the legacy PAT only after App authentication succeeds and restores the PAT on failure.

Focused tests prove candidate validation, promotion, auto-rollback, manual rollback, revocation-gated finalize, legacy PAT retirement/rollback, duplicate/missing-candidate safety, and no-secret status output. Canonical implementation then merged through PR #48 at `a6b9921a9700b6f93a2d69ab3e0fb17407c9e424`, deployed as protected Apps Script v46, and passed live proof: a real newly generated candidate key validated, promoted, read canonical GitHub, rolled back, revalidated, and promoted again; the old GitHub-side key was then revoked and independently failed auth before finalization; previous local secret and legacy PAT were removed; the new active key still read canonical GitHub; no secret value was exposed; temporary proof v47 was removed; development HEAD restored/verified 16/16. T-019F is LIVE PASS.


PF-077 | T-019G DEPLOYMENT / ROLLBACK — LIVE PASS

Finding: individual releases had been deployed successfully, but T-019 still required proof that the protected production pointer could be rolled back to a known-good immutable release and restored again without conflating deployment state with Git/source state.

Live proof started from protected production v46, repointed the same deployment to immutable v44, verified the pointer and exact v44 content 18/18, and independently confirmed canonical GitHub main was unchanged. Production was then rolled forward to immutable v46, verified against the pre-proof v46 release snapshot 19/19, while canonical GitHub again remained unchanged. Development HEAD remained independently stable at 16/16.

Conclusion: deployment rollback and roll-forward are operationally proven. The deployment pointer is a separate authority from canonical Git, application data, continuity state, and credentials. T-019G is LIVE PASS; AP-013 remains CURRENT pending final operator runbook acceptance.


PF-078 | T-019H FINAL OPERATOR RUNBOOK ACCEPTANCE — PASS

Finding: after T-019A through T-019G had each passed their reliability slices, the remaining risk was operator ambiguity rather than missing runtime behavior. Historical checkpoint language could still read as if completed work were pending, and the runbook lacked one front-door decision map for choosing the correct authority-specific recovery procedure.

Final acceptance added a single Operator quick start map, normalized stale checkpoint wording, and machine-audited the runbook. T-019A through T-019G each appear exactly once as top-level sections; all 7 documented operator function references resolve to current source; all linked canonical proof files exist; secret-literal scan is zero; stale-blocker scan is zero; 32/32 repository tests pass; git diff check passes; protected production is restored to v46 after live rollback/roll-forward proof; canonical Git state remains separate from deployment/data/continuity/credential authorities.

Conclusion: T-019H PASS. T-019 / AP-013 is complete. AP-014 / T-020 Human Closed Beta becomes CURRENT. The project remains DO IT; T-021 release acceptance and explicit owner release acceptance are still required before DELIVERED !!.


PF-079 | T-020A HUMAN BETA READINESS CHECK — BLOCKED

Finding: T-019 closed reliability/operations successfully, but the first closed-beta readiness audit found one true access blocker and three major ordinary-user UX gaps before any external participant can be counted.

BETA-AUTH-001 is a blocker: the protected Apps Script manifest still uses MYSELF / USER_DEPLOYING and the ordinary protected authorization path still assumes the owner session. D-031 instead requires invited Google-account users behind an explicit production allowlist. The current gate therefore cannot admit the minimum three distinct non-developer participants. Broadening the deployment alone is insufficient; the authorization boundary itself must distinguish invited beta humans from privileged owner-only operations while preserving owner-executed access to the private continuity store, ASC DB and GitHub App boundary.

UX findings: the Dashboard still says read-only project view even though Workspace now creates private continuity and prepares SAVE; the ordinary return/SAVE journey exposes implementation-facing ASC_METHOD_RESULT / PREVIEW RETURN / PREPARE ASC SAVE / private-thread terminology; and the Public Front Door mixes pending-request sign-in recovery with new-conversation handoff on the same first screen. ROUTE OVERRIDE is a minor terminology issue; DUMP / DECIDE / DESIGN remains the locked visible routing contract.

Readiness evidence is recorded in proofs/t020a-human-beta-readiness.md. Existing T-015 through T-019 runtime/reliability boundaries remain accepted and are not reopened by this audit.

Conclusion: T-020A is BLOCKED / NOT READY FOR HUMAN BETA. T-020 / AP-014 remains CURRENT. Implement the bounded Beta Access Gate and ordinary-user copy fixes, then rerun the exact readiness contract as a canary before counting any external beta journey.


PF-080 | T-020A1 BETA ACCESS GATE — LIVE PASS

Finding: T-020A readiness correctly blocked because Production v1 still used the owner-only Apps Script gate while D-031 requires invited Google-account humans behind an explicit production allowlist.

Implementation direction now exists as a bounded access layer:
- Apps Script web-app access is widened from MYSELF to ANYONE while execution remains USER_DEPLOYING, preserving access to the owner's existing server-side continuity/ASC DB/GitHub App authorities;
- non-owner beta identity uses Session.getTemporaryActiveUserKey(), hashed with SHA-256 before persistence; raw temporary keys are never stored;
- owner creates single-use, expiring invitations scoped to exact production project IDs;
- invitation claim binds the current signed-in Google session fingerprint to a participant record with bounded expiry (maximum 29 days, below the temporary-key rotation window);
- raw invitation token is returned only in the invitation URL and only its SHA-256 hash is stored;
- participant access is project-scoped and enforced across dashboard reads, CI reads, private continuity, provider handoff/return, SAVE preparation and production GitHub write authorization;
- ordinary preview/CONFIRM & SYNC accepts owner OR active beta actor but still uses the existing production project/path registry and GitHub App boundary;
- privileged DR, telemetry, secret rotation and beta administration remain owner-only;
- participant revocation deletes the allowlist record and is immediately effective;
- expired invitation and expired participant records fail closed;
- owner cannot accidentally consume a participant invitation;
- server helpers that should not be browser-callable are private-suffixed where required.

Local security/regression evidence:
- T-020A1 beta access gate focused test PASS;
- signed-in invitation -> hashed user allowlist -> project scope -> revoke PASS;
- raw invitation/user keys not persisted or returned by admin listing PASS;
- owner accidental-claim guard PASS;
- expired invitation and expired participant fail closed;
- full repository suite 33/33 test files PASS;
- git diff --check PASS.

Live closure: canonical implementation is merged; owner temporary-user identity was bound through a temporary owner-only v49 bootstrap; protected production is immutable v50 `T020A1-beta-access-gate-final`; and a real non-owner Google-account canary enrolled from a single-use invitation scoped only to `AISYNC`, opened the protected AISYNC project Workspace, then lost access immediately after owner revocation without browser restart or hidden state repair. The raw invite token and tester email are omitted from proof. Direct forbidden-project and privileged-owner negative paths remain covered by focused security tests. Canonical live evidence: `proofs/t020a1-beta-access-gate-live.md`.

Conclusion: T-020A1 is LIVE PASS. BETA-AUTH-001 is CLOSED. T-020A overall remains BLOCKED only by the ordinary-user UX readiness findings recorded in `proofs/t020a-human-beta-readiness.md`.


PF-081 | T-020A2 ORDINARY-USER UX READINESS CLEANUP — LIVE PASS

Finding: after T-020A1 closed the access blocker, the remaining readiness risk was ordinary-user comprehension rather than authority or persistence behavior.

The Dashboard primary path now describes the user journey as project conversation → AI provider → help mode → PREPARE FOR AI → CHECK AI RESULT → PREPARE SAVE → REVIEW & SAVE → USE SAVED RESULT TO CONTINUE. The stale read-only label and implementation-facing thread/return/SAVE button language are removed from the primary flow. Technical handoff metadata remains available through progressive disclosure rather than being required for first use.

The Public Front Door now separates two intents: Continue a SAVE request versus Start a new AI conversation. The new-conversation section uses natural-language input, AI provider selection, and an optional human-readable help-mode control while preserving visible DUMP / DECIDE / DESIGN semantics. ROUTE OVERRIDE is no longer exposed as the user label.

Boundaries are unchanged: routing methods, scoped handoff content, provider-return validation, CONFIRM & SYNC, GitHub registry/App auth, private continuity, Beta Access Gate, replay/idempotency, receipts/HISTORY, DR/telemetry/secret rotation/operator controls are untouched.

Verification: Dashboard UI test PASS; Front Door preserve/login/replay test PASS; full repository suite 33/33 PASS; git diff check PASS; old Dashboard UX scan 0; old Front Door UX scan 0; required first-use cues missing 0. PR #58 merged to canonical main `777cc0c491d72cbef56a7b6dd684241738074519`. Apps Script immutable v51 matched canonical source 23/23, protected production was independently verified at `@51 - T020A2-ordinary-user-ux`, development HEAD was restored exact 23/23, and live Dashboard/Public Front Door accessibility scans confirmed all required ordinary-user cues with zero old primary UX terms.

Evidence: proofs/t020a2-ordinary-user-ux-readiness.md.

Conclusion: T-020A2 LIVE PASS. BETA-UX-001 through BETA-UX-004 are CLOSED. T-020A3 canary readiness recheck remains the final readiness gate.


PF-082 | T-020A3 CANARY READINESS RECHECK — PASS

Finding: after T-020A1 and T-020A2 closed the access and ordinary-user UX blockers, the remaining question was whether the owner could follow the exact future tester instructions through the complete production journey without developer knowledge or hidden state repair.

The live canary used project AISYNC, an existing project conversation, Gemini, DESIGN help mode and an ordinary natural-language request. PREPARE FOR AI produced a valid handoff. When direct copy was unreliable, the visible SHOW PREPARED TEXT fallback carried the journey without backend intervention. Gemini received the handoff, returned a normal ZASSIMPLE response, then produced the required CONFIRMED_RESULT block after the user issued SAVE. AISYNC validated the return, prepared SAVE, routed through the Public Front Door, displayed the protected preview, and required explicit CONFIRM & SYNC.

The terminal receipt was SAVED / VERIFIED_WRITE. Canonical record `records/METHOD-RESULT-01M47F1VDEFB0C45VJ1BZJBG7N.md` was written at commit `8dc54763e14040658b452bf20adac5d939c3d8e4` and independently read back exactly. After Return to main ASC UI, the project was reopened and USE SAVED RESULT TO CONTINUE advanced private continuity; the UI confirmed the saved result is now the current project context and the next AI conversation will use it.

Truthful stale/unverified project-index guidance remained visible; no false PASS or blind-retry instruction was introduced. No Script Property, Sheets, GitHub, continuity-store, or other hidden repair was used.

Evidence: `proofs/t020a3-canary-readiness.md`.

Conclusion: T-020A3 PASS. T-020A HUMAN BETA READINESS = PASS. AP-014 remains CURRENT and is now READY FOR HUMAN BETA. Next counted gate: T-020B — Human Tester #1. The canary is not counted as a participant.


PF-083 | ASC ROUTE-SPECIFIC STORAGE MODEL — SUPERSEDED BY PF-090

Finding: Project Owner promoted the broader CrossAI route/storage product direction on 2026-10-06. User-facing AI CHAT maps internally to DUMP/ZASSPILL and remains low-friction/ASC-native without a GitHub prerequisite merely to chat or retain an idea. DESIGN is locked directionally as one GitHub repository per project, with CrossAI projecting factual project state back into the product. Explicit promotion between idea → DECIDE/DESIGN is required.

DECIDE remains the open storage-design portion: the product concept is Selection History and the candidate implementation is one consolidated Git-backed selection-history repository organized by selection title/topic, but GitHub account requirement, repository ownership/service-management, privacy, layout, quota and team behavior are not yet locked.

The broader locked direction also includes Web + Telegram over the same ASC core, Telegram AI CHAT, selectable AI routing, scoped cross-AI handoff/return, factual support/retrieval, group context-space behavior, and user-owned durable file-storage direction. It remains non-blocking for current T-020/T-021.

See `docs/CROSSAI_PRODUCT_DIRECTION.md` and `docs/ASC_ROUTE_STORAGE_MODEL_CANDIDATE.md`.

PF-084 | CROSSAI USER-FIRST ENTRY CORRECTION — LOCAL PASS / DEPLOYMENT PENDING

Finding: owner review of v52 proved the beta implementation had drifted from LOCKED D-020/D-021/D-022 by making the existing AISYNC project Workspace the practical blank-account entry. The correct product boundary is CrossAI user-facing, AISYNC/ASC internal. A new beta user should type naturally on a public CrossAI landing, choose only an AI provider, pass Google/beta auth with the draft preserved, then let the protected runtime route DUMP/DECIDE/DESIGN and create a new private CrossAI conversation before provider handoff. Conflicting DECIDE+DESIGN signals ask the user on the protected next page.

Implementation now exists on the T-020B2R2 correction branch: enrollment returns to public CrossAI; public start performs no pre-login method routing; protected `crossai-auth` and `crossai-start` surfaces handle auth return, route choice, private-thread creation, scoped handoff, and private continuity checkpoint SAVE/MOVE. Existing operator Dashboard/project-linked SAVE behavior remains intact and is no longer treated as the blank-account product landing.

Focused verification PASS: CrossAI public front door, protected start runtime, protected route binding, existing Dashboard continuity regression, beta access security regression, and git diff check.

Evidence: `proofs/t020b2r2-crossai-user-first-entry-correction.md`.

Conclusion: T-020B2 remains HOLD. Merge/deploy and owner blank-account recheck are required before any external tester may count.



PF-085 | CROSSAI HIDDEN METHOD ROUTING UX — LOCKED FUTURE DIRECTION

Finding: Project Owner simplified the future CrossAI ordinary-user entry surface. Telegram `/start` exposes only `💬 AI CHAT — just talk, I am here to hear.` and `❓ HELP — just ask.` The product should hide DUMP / DECIDE / DESIGN from ordinary-user entry/navigation and let ASC infer/use those as internal semantic routes. Human-facing browse concepts remain Ideas / Decisions / Projects. Internal mappings stay DUMP → ZASSPILL, DECIDE → ZASSELECTION, DESIGN → ZASSIMPLE and may still appear in diagnostics/advanced/developer surfaces.

This is a future product UX direction and does not retroactively change current T-020/T-021 acceptance evidence or the existing Production v1 routing contract until separately promoted into implementation work.

See `docs/CROSSAI_PRODUCT_DIRECTION.md`.


PF-086 | TELEGRAM PRIVATE THREADED CONTEXT SPACES — LOCKED FUTURE DIRECTION

Finding: For a single user, Telegram private threaded topics are preferred over creating a creator+bot group merely to separate personal contexts, where Telegram capabilities/final implementation permit it. Each topic may map to a scoped CrossAI context space under the same ASC authority. Existing Telegram Group behavior remains locked for shared/group use. Technical nuance remains open: creator+bot-only ordinary-message response versus multi-human `@bot`-only response must be implemented deliberately in the bot/ASC layer and must not assume Telegram Privacy Mode alone can dynamically enforce participant-count behavior.

PF-087 | TOPIC / TEMPORAL RETRIEVAL INDEX — ARCHITECTURE CANDIDATE

Finding: Future CrossAI retrieval may combine LLM topic-change detection, temporal markers/indexing, full-text search, embeddings/vector similarity, and topic summaries. Candidate technologies include PostgreSQL + pgvector, Qdrant, or equivalent. Hard guardrail: this is derived retrieval infrastructure only and must never become semantic authority over ASC private continuity, GitHub canonical project artifacts, confirmed decisions, or factual SAVE/receipt state. Topic-change detection may produce assistant signals such as asking whether to save a shifted subject as a separate idea; the human decides before ASC records a new semantic boundary.

PF-088 | AMP INTERCHANGE COMPATIBILITY — CANDIDATE

Finding: AMP-style AI conversation/memory interchange is worth monitoring as a future export/import compatibility surface. CrossAI may provide Markdown, neutral JSON, and AMP-compatible adapters if useful/mature. AMP is not architecture authority and does not replace ZASSPILL, ASC continuity contracts, lineage, privacy boundaries, or SAVE truth.

See `docs/CROSSAI_PRODUCT_DIRECTION.md`.


PF-089 | CROSSAI MULTI-USER OWNERSHIP MODEL — LOCKED FUTURE ARCHITECTURE DIRECTION

Finding: CrossAI must scale as a centrally maintained application/runtime, not by giving every user a cloned Apps Script project, personal `.gs` deployment, Script Properties set, or mandatory per-user ASC Sheet. The current owner-executed Apps Script runtime and owner-private Drive continuity store remain a bounded Production v1 closed-beta implementation, not the permanent multi-tenant ownership model.

Locked direction: CrossAI may retain central service state required for identity, authorization, routing, derived indexes, references, temporary handoff/return state, receipts and operations. Durable user-owned content should increasingly live in storage the user owns and explicitly authorizes CrossAI to access. Google Drive is the preferred first user-owned storage ecosystem through delegated authorization/OAuth; Git-backed DESIGN artifacts continue toward user/team-authorized GitHub repositories. CrossAI must preserve truthful failure/quota/revocation behavior and must not silently fall back to permanent operator-owned storage.

Exact OAuth scopes/token lifecycle, hosted backend, central database, Drive layout, encryption/key model, team tenancy and migration mechanics remain future DESIGN decisions.

See `docs/CROSSAI_MULTI_USER_OWNERSHIP.md`.


PF-090 | GOOGLE DRIVE DEFAULT / GITHUB OPTIONAL — LOCKED FUTURE ARCHITECTURE DIRECTION

Finding: Project Owner superseded the earlier GitHub-first storage assumptions. Future CrossAI onboarding is locked as: **Login Google → allow Google Drive Access → terus guna CrossAI. GitHub hanya muncul bila memang berguna.** Google Drive becomes the default durable store for ordinary user-owned CrossAI content, including Ideas, Decisions/Selection History, DESIGN project spaces, files/attachments, generated retained outputs and exports.

GitHub is optional and should appear only when the user needs version control, coding workflow, collaboration, CI, public repositories or technical provenance. The earlier universal rule `one DESIGN project = one GitHub repository` and the earlier default candidate of a consolidated GitHub DECIDE repository are SUPERSEDED. One DESIGN project now means one durable project space; by default that space is in the user's Google Drive.

If GitHub is explicitly enabled for a project, GitHub may become canonical only for the selected Git-backed artifacts while Drive remains the durable home/authority for non-Git content. CrossAI must never silently create competing editable semantic masters.

This is a future product/architecture direction. Current Production v1 closed-beta owner-executed Apps Script + owner-private Drive continuity remains a bounded transitional implementation and does not yet claim per-user Drive OAuth.

See `docs/CROSSAI_PRODUCT_DIRECTION.md`, `docs/CROSSAI_MULTI_USER_OWNERSHIP.md`, and `docs/ASC_ROUTE_STORAGE_MODEL_CANDIDATE.md`.
