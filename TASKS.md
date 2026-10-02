# AISYNC — ZASSIMPLE TASKS

**Status:** EXECUTION QUEUE  
**Method:** ZASSIMPLE v0.3.0  
**Lifecycle stage:** DO IT  
**Architecture:** v1.0.6 CONFIRMED  
**Authority:** Tasks execute the confirmed plan. They do not rewrite LOCKED decisions.

> Surface one current task to the owner by default. Future tasks remain queued until the current task passes or is explicitly blocked/replanned.

## Current task

T-013A | IN PROGRESS — METHOD REGISTRY + PROTECTED GITHUB SYNC
Source: AP-008, D-023, D-024
Decision / Architecture lineage: D-002, D-005, D-023, D-024, ARCH v1.0.6 § Public Method Gateway / read plane
Do:
- maintain one lightweight METHODS registry in ASC DB;
- sync the three frozen/current Malay method files from canonical GitHub;
- pin each snapshot to the exact GitHub branch-head commit used for the fetch;
- extract method version from the Markdown;
- upsert snapshots without manual Markdown copy/paste.
Built:
- ASC DB METHODS tab with headers:
  method_key, method, language, version, source_repo, source_path, source_commit, synced_at, content
- `method-gateway/method-snapshot-v0.1.schema.json`
- `method-gateway/sync/RegistrySync.gs`
- `method-gateway/sync/appsscript.json`
Pass:
- protected sync function runs successfully;
- three rows are present;
- versions/content/source paths are correct;
- all three rows identify the same real GitHub commit used for that sync;
- re-running the sync updates/upserts instead of duplicating rows.
Current result: IMPLEMENTATION BUILT — LIVE Apps Script RUN/VERIFICATION PENDING.

D-025 implementation path is LOCKED:
- METHODS is the v0.1 snapshot registry;
- protected sync and public read are separate Apps Script surfaces;
- one sync run pins all three files to one exact GitHub HEAD commit;
- T-013A must pass before T-013B;
- T-004 resumes only after the Method Gateway proof is sufficiently proven.

## Paused task

T-004 | PAUSED — VERIFIED BOUNDARY  
Source: AP-003, AP-007, PF-005  
Decision / Architecture lineage: D-006, D-015, D-017, D-020, D-021, D-022, ARCH v1.0.4 § Apps Script Web App + Google Account authentication / front-door orchestration  
Do: Create the Apps Script Web App skeleton with owner-only Google Account gate and pending-request preservation across sign-in.  
Depends on: T-002  
Pass: ASC front-door preserves the pending draft/payload before authentication, completes owner sign-in, then replays the payload into the authenticated preview with no write occurring.  
Built:
- `apps-script/appsscript.json` — owner-only `MYSELF`, execute as deployer
- `apps-script/Code.gs` — preview-only web-app server
- `apps-script/Index.html`
- `apps-script/Client.html` — fragment/session preservation + preview
- `apps-script/test-pending-request.mjs`
Verification completed:
- simulated fragment → sessionStorage → fragmentless-return restoration: PASS
- T-002 envelope decode after restore: PASS
- no client write function exposed: PASS
Live verification:
- deployed owner-only Apps Script Web App: PASS
- authenticated `/exec#asc=<payload>` fragment read via `google.script.url.getLocation()`: PASS
- D-019 envelope decode + preview: PASS
- no-write preview boundary: PASS
- fresh unauthenticated `/exec#asc=<payload>` → Google sign-in → return: FAIL; the outer fragment is not preserved through Google's auth redirect
Finding:
- direct fragment-through-login is not a viable persistence path
- D-020 front-door must preserve draft/payload before launching authentication, then replay it after sign-in
Result: PARTIAL PASS — auth gate and authenticated fragment preview are proven; front-door preserve/login/replay remains to implement.

Execution gate: D-024
- no further T-004 implementation now;
- wait for official ZASSPILL;
- review its real handoff contract;
- owner then decides whether T-013 becomes the next current task;
- after a successful Method Gateway proof, return to the remaining T-004 front-door/routing/handoff work.

D-020 front-door behavior is LOCKED but not yet implemented:
- mandatory AI-provider selection + red missing-provider warning
- auth check before routing
- new-tab login attempt + copy-draft/redirect fallback
- automatic DUMP / DECIDE / DESIGN routing
- ZASSPILL / ZASSELECTION / ZASSIMPLE method mapping
- provider handoff with capability-aware prefill or copy/paste fallback
Dependency note: DUMP routing cannot be finalized until ZASSPILL's own contract/behavior is available.

D-022 auth strategy is LOCKED for v0.1:
- Primary B: preserve draft/pending state in the original ASC tab → login in new tab → return → CONTINUE → replay to authenticated preview.
- Fallback A: complete login → click ASC link / GO / CONTINUE again.
- Requirement: user draft/request must not be lost; fragment survival across auth redirect is not required.
- Fully automatic invisible auth recovery is deferred.

## Completed

T-003 | PASS  
Source: AP-003, PF-003, D-014  
Decision / Architecture lineage: D-005, D-012, D-014, D-019, ARCH v1.0.1 § Google Sheets = ASC DB  
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
Decision / Architecture lineage: D-003, D-013, ARCH v1.0 § ASC transport/security envelope + ASC Link  
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
Decision / Architecture lineage: D-011, D-013, ARCH v1.0 § ASC Write Contract  
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

T-005 | QUEUED  
Source: AP-004  
Decision / Architecture lineage: D-002, D-004, D-014, ARCH v1.0 § ASC Core  
Do: Implement the ASC Core request boundary: validate semantic contract, authorize request, preserve meaning, route by destination, and expose adapter/receipt interfaces.  
Depends on: T-001  
Pass: The same valid contract can enter Core independently of which AI app produced it, and Core contains no ZASS reasoning/validator logic.

T-006 | QUEUED  
Source: AP-005  
Decision / Architecture lineage: D-007, D-016, ARCH v1.0 § GitHub adapter  
Do: Implement the first GitHub destination adapter for current-file/SHA fetch, create/update, persisted-state verification, and commit result capture.  
Depends on: T-005  
Pass: A controlled test update produces a real verified GitHub commit and returns factual identifiers needed by the receipt layer.

T-007 | QUEUED  
Source: AP-006  
Decision / Architecture lineage: D-004, R-003, D-014, ARCH v1.0 § Write Receipt  
Do: Implement the factual ASC Write Receipt and HISTORY persistence.  
Depends on: T-003, T-006  
Pass: SUCCESS and FAILED writes are distinguishable; successful GitHub writes record destination, affected resource, commit/record identifier, request identity/time, and HISTORY entry.

T-008 | QUEUED  
Source: AP-003, AP-007  
Decision / Architecture lineage: D-012, D-015, D-017, ARCH v1.0 § Google Sites + Apps Script interaction flow  
Do: Implement preview → explicit CONFIRM & SYNC → write/verify → receipt → redirect-to-main-ASC-UI flow, with truthful failure handling.  
Depends on: T-004, T-005, T-007  
Pass: No persistence occurs before explicit confirmation; success returns to main ASC UI after verified receipt; failure stays visibly failed and does not redirect as success.

T-009 | QUEUED  
Source: AP-003, UI data requirements  
Decision / Architecture lineage: D-005, D-006, D-012, D-014, D-019, ARCH v1.0 § Google Sites ASC UI  
Do: Implement the read/dashboard path: DECIDE/DESIGN landing, project list with progress + latest update, and project detail with the seven locked sections.  
Depends on: T-003, T-004  
Pass: The UI can display Project progress bar, Progress summary, Next Action Plan summary, Next stage summary, Action Plan table, ZASS table, and History from ASC DB/index data without inventing method semantics.

T-010 | QUEUED  
Source: AP-007  
Decision / Architecture lineage: D-003, D-013, D-015, D-016, D-017  
Do: Add v0.1 security/replay controls around link requests, owner identity, server-side destination credentials, expiry/integrity checks, and failure-safe behavior.  
Depends on: T-002, T-004, T-005, T-006  
Pass: The prototype does not expose destination credentials, does not silently write, rejects/flags invalid or expired requests according to the chosen v0.1 rules, and preserves explicit owner confirmation.

T-011 | QUEUED  
Source: AP-001 through AP-007  
Decision / Architecture lineage: D-002 through D-018, ARCH v1.0  
Do: Run the minimum end-to-end ASC v0.1 proof using a real ZASSIMPLE SAVE request from AI output through ASC Link → Google sign-in → preview → confirm → GitHub write → verification/receipt → Sheets HISTORY → redirect to main UI.  
Depends on: T-001 through T-010  
Pass: The complete fallback flow succeeds without direct AI→GitHub integration, produces a real verified commit and factual receipt, updates operational history, and preserves the confirmed architecture boundaries.

T-012 | BLOCKED / LATER  
Source: PF-006, D-018  
Decision / Architecture lineage: D-018, ARCH v1.0 § Cross-system validation boundary  
Do: Consume and display commit-linked ZASS CI validation status in ASC without implementing ZASS rules inside ASC.  
Depends on: ZASS SYSTEM GitHub CI existing first.  
Pass: ASC displays CI result tied to a commit while CLI/CI continue to use the same ZASS Core semantics.  
Block reason: ZASS GitHub CI is not implemented yet; ASC must not invent or duplicate it.

## Delivered evidence

Implementation evidence exists for T-001, T-002, and T-003.

Closure checks:
- Built: PARTIAL — T-001, T-002, and T-003 complete
- Verified: PARTIAL — T-001, T-002, and T-003 verified
- Matches architecture: YES FOR T-001, T-002, AND T-003
- Recorded: YES — task queue created


T-013 | ACTIVE — PUBLIC METHOD GATEWAY v0.1 PROOF  
Source: AP-008, D-023  
Decision / Architecture lineage: D-002, D-005, D-018, D-023, ARCH v1.0.5 § Public Method Gateway / read plane  
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
Result: STARTED — D-024 gate satisfied; T-013A implementation built, live sync verification pending.


### Planned slicing after D-024 gate

No implementation starts until the owner reviews the official ZASSPILL dependency.

If T-013 is promoted:

- **T-013A — Registry + sync:** create the minimal METHODS snapshot store and protected GitHub→AI-SYNC sync; verify source commit/version/content without manual copy-paste.
- **T-013B — Public gateway proof:** serve the stored Markdown publicly without login/redirect, test Gemini and Copilot readability, and prove ZASSPILL can carry the gateway URL during handoff.

After those pass sufficiently, resume the remaining T-004 front-door/routing/handoff work.


T-013B | QUEUED — PUBLIC METHOD GATEWAY + CROSS-AI PROOF
Source: T-013A, D-023
Do:
- deploy separate public read-only Apps Script Web App;
- expose equivalent routes for zasspill/my, zassimple/my, zasselection/my;
- return snapshot Markdown itself using ContentService text output;
- expose provenance metadata separately;
- verify no login required;
- field-test Gemini and Copilot readability;
- verify ZASSPILL handoff can carry the gateway URL.
Depends on: T-013A PASS.
Pass: acceptance conditions 2–8 of D-023 proof are demonstrated.
