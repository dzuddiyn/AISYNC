# T-019C Live Degraded / Offline Proof

Date: 2026-10-04
Status: PASS

## Canonical release

- Implementation PR: #42
- Canonical merge commit: `df6576a9d9655cf1c3b89072aacd40479ca133d8`
- Protected Apps Script production version: v39
- Deployment label: `T019C-degraded-offline-behavior`
- Protected production remained pinned to v39 throughout the proof.

## Proof boundary

T-019C proves truthful degraded/offline behavior without starting a production persistence write.

The final deterministic proof:

- executed the exact immutable-v39 `Client.html` behavior inside live Apps Script V8;
- fault-injected pre-confirm service unavailability;
- fault-injected response loss after exactly one CONFIRM send using a non-writing stub;
- exercised the real live server `getConfirmSyncResult(request_id)` binding for a never-submitted proof request;
- performed read-only HISTORY checks for the proof request IDs;
- did not invoke the production GitHub write path or create a HISTORY row.

This proves the runtime state machine and recovery controls under controlled failure injection. It is not evidence of a real external network outage during an actual GitHub write.

## Deterministic live proof

Proof ID:

`T019C-LIVE-20261004-112655-9312eff5`

Client-side proof request:

`T019C-LIVE-CLIENT-20261004-112655-9312eff5`

Server-result proof request:

`T019C-LIVE-RESULT-20261004-112655-9312eff5`

Private evidence filename:

`AISYNC_T019C_LIVE_PROOF_T019C-LIVE-20261004-112655-9312eff5.json`

Observed checks all returned true:

- `preconfirm_unavailable_is_degraded`;
- `preconfirm_confirm_disabled`;
- `preconfirm_retry_server_check_visible`;
- `retry_server_check_stays_nonwriting_degraded`;
- `postconfirm_response_loss_is_outcome_unknown`;
- `postconfirm_duplicate_confirm_disabled`;
- `postconfirm_check_result_visible`;
- `postconfirm_message_forbids_reconfirm`;
- `verified_write_history_failure_is_degraded`;
- `write_unverified_is_degraded`;
- `write_outcome_unknown_is_unknown`;
- `server_missing_result_is_outcome_unknown`;
- `server_unknown_lookup_no_history`;
- `check_result_is_lookup_only_unknown`;
- `server_probe_created_no_history`.

Result: `T019C_LIVE_PROOF_PASS`.

## Independent verification

After the proof:

- HISTORY search returned zero rows for the client-side proof request ID;
- HISTORY search returned zero rows for the server-result proof request ID;
- GitHub `main` was still `df6576a9d9655cf1c3b89072aacd40479ca133d8`;
- canonical target `records/T016-LIVE-20261003181842.md` still had blob SHA `5427b6cc4aa0c2a87a9532121e1cb8a4bc0a7e22`;
- target content remained unchanged;
- therefore the proof created no GitHub commit or duplicate persistence write.

## Harness note

Temporary version v40 used the first browser-driven proof harness. It did not produce deterministic evidence and is not counted as PASS evidence.

The final PASS evidence used temporary v41 with a deterministic owner-only operator. It ran the exact v39 client logic in Apps Script V8 and used the live server result lookup only.

## Cleanup verification

After the proof:

- temporary proof deployment was undeployed;
- Apps Script development HEAD was restored and independently verified 16/16 files;
- temporary deployment ID was absent;
- protected production remained pinned to v39.

Conclusion: **T-019C LIVE PASS**.
