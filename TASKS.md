# AISYNC — ZASSIMPLE TASKS

**Status:** EXECUTION QUEUE  
**Method:** ZASSIMPLE v0.2.4  
**Lifecycle stage:** DO IT  
**Architecture:** v1.0 CONFIRMED  
**Authority:** Tasks execute the confirmed plan. They do not rewrite LOCKED decisions.

> Surface one current task to the owner by default. Future tasks remain queued until the current task passes or is explicitly blocked/replanned.

## Current task

T-004 | READY  
Source: AP-003, AP-007, PF-005  
Decision / Architecture lineage: D-006, D-015, D-017, ARCH v1.0.1 § Apps Script Web App + Google Account authentication  
Do: Create the Apps Script Web App skeleton with owner-only Google Account gate and pending-request preservation across sign-in.  
Depends on: T-002  
Pass: An unauthenticated ASC Link request survives sign-in and reaches a post-login preview state without any write occurring.  
Result: NOT STARTED

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
