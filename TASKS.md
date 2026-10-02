# AISYNC — ZASSIMPLE TASKS

**Status:** EXECUTION QUEUE  
**Method:** ZASSIMPLE v0.3.0  
**Lifecycle stage:** DO IT  
**Design:** v1.0.9 CONFIRMED  
**Authority:** Tasks execute the confirmed plan. They do not rewrite LOCKED decisions.

> Surface one current task to the owner by default. Future tasks remain queued until the current task passes or is explicitly blocked/replanned.

## Current task

T-005 | IN PROGRESS — ASC CORE REQUEST BOUNDARY  
Source: AP-004  
Decision / Design lineage: D-002, D-004, D-014, DESIGN v1.0 § ASC Core  
Do: Implement the ASC Core request boundary: validate semantic contract, authorize request, preserve meaning, route by destination, and expose adapter/receipt interfaces.  
Depends on: T-001  
Pass: The same valid contract can enter Core independently of which AI app produced it, and Core contains no ZASS reasoning/validator logic.  
Current result: PROMOTED after T-004 PASS.

## Completed

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

T-006 | QUEUED  
Source: AP-005  
Decision / Design lineage: D-007, D-016, DESIGN v1.0 § GitHub adapter  
Do: Implement the first GitHub destination adapter for current-file/SHA fetch, create/update, persisted-state verification, and commit result capture.  
Depends on: T-005  
Pass: A controlled test update produces a real verified GitHub commit and returns factual identifiers needed by the receipt layer.

T-007 | QUEUED  
Source: AP-006  
Decision / Design lineage: D-004, R-003, D-014, DESIGN v1.0 § Write Receipt  
Do: Implement the factual ASC Write Receipt and HISTORY persistence.  
Depends on: T-003, T-006  
Pass: SUCCESS and FAILED writes are distinguishable; successful GitHub writes record destination, affected resource, commit/record identifier, request identity/time, and HISTORY entry.

T-008 | QUEUED  
Source: AP-003, AP-007  
Decision / Design lineage: D-012, D-015, D-017, DESIGN v1.0 § Google Sites + Apps Script interaction flow  
Do: Implement preview → explicit CONFIRM & SYNC → write/verify → receipt → redirect-to-main-ASC-UI flow, with truthful failure handling.  
Depends on: T-004, T-005, T-007  
Pass: No persistence occurs before explicit confirmation; success returns to main ASC UI after verified receipt; failure stays visibly failed and does not redirect as success.

T-009 | QUEUED  
Source: AP-003, UI data requirements  
Decision / Design lineage: D-005, D-006, D-012, D-014, D-019, DESIGN v1.0 § Google Sites ASC UI  
Do: Implement the read/dashboard path: DECIDE/DESIGN landing, project list with progress + latest update, and project detail with the seven locked sections.  
Depends on: T-003, T-004  
Pass: The UI can display Project progress bar, Progress summary, Next Action Plan summary, Next stage summary, Action Plan table, ZASS table, and History from ASC DB/index data without inventing method semantics.

T-010 | QUEUED  
Source: AP-007  
Decision / Design lineage: D-003, D-013, D-015, D-016, D-017  
Do: Add v0.1 security/replay controls around link requests, owner identity, server-side destination credentials, expiry/integrity checks, and failure-safe behavior.  
Depends on: T-002, T-004, T-005, T-006  
Pass: The prototype does not expose destination credentials, does not silently write, rejects/flags invalid or expired requests according to the chosen v0.1 rules, and preserves explicit owner confirmation.

T-011 | QUEUED  
Source: AP-001 through AP-007  
Decision / Design lineage: D-002 through D-018, ARCH v1.0  
Do: Run the minimum end-to-end ASC v0.1 proof using a real ZASSIMPLE SAVE request from AI output through ASC Link → Google sign-in → preview → confirm → GitHub write → verification/receipt → Sheets HISTORY → redirect to main UI.  
Depends on: T-001 through T-010  
Pass: The complete fallback flow succeeds without direct AI→GitHub integration, produces a real verified commit and factual receipt, updates operational history, and preserves the confirmed architecture boundaries.

T-012 | BLOCKED / LATER  
Source: PF-006, D-018  
Decision / Design lineage: D-018, DESIGN v1.0 § Cross-system validation boundary  
Do: Consume and display commit-linked ZASS CI validation status in ASC without implementing ZASS rules inside ASC.  
Depends on: ZASS SYSTEM GitHub CI existing first.  
Pass: ASC displays CI result tied to a commit while CLI/CI continue to use the same ZASS Core semantics.  
Block reason: ZASS GitHub CI is not implemented yet; ASC must not invent or duplicate it.

## Delivered evidence

Implementation evidence exists for T-001, T-002, T-003, T-004, T-013A, and T-013B.

Closure checks:
- Built: PARTIAL PROJECT — T-001, T-002, T-003, T-004, T-013A, and T-013B complete
- Verified: PARTIAL PROJECT — those completed slices are verified
- Matches design: YES FOR COMPLETED SLICES
- Recorded: YES — task queue created


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
