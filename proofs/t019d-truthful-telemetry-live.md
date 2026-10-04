# T-019D Live Truthful Telemetry Proof

Date: 2026-10-04
Status: PASS

## Canonical release

- Implementation PR: #44
- Canonical merge commit: `3873e3289b9051d65c4d315daeb1e68adabaa615`
- Protected Apps Script production version: v42
- Deployment label: `T019D-truthful-telemetry`
- Protected production remained pinned to v42 throughout the proof.

## Proof boundary

T-019D proves that production telemetry reports direct evidence conservatively.

The proof does not require overall telemetry to be `OK`. A `DEGRADED`, `UNKNOWN`, or `ERROR` result can still satisfy the telemetry contract when it truthfully matches the observed required probes.

The owner-only live proof:

- executed two real `getProductionTelemetry('AISYNC')` snapshots using exact immutable-v42 runtime behavior;
- observed ASC DB, canonical GitHub/index freshness, private continuity, GitHub App auth, and latest SAVE/HISTORY evidence;
- verified snapshot state classification against the required-probe evidence;
- fingerprinted HISTORY and private continuity before and after the telemetry calls;
- checked returned data for credential/token/private-key material;
- did not invoke a repository write;
- created a private Drive JSON evidence artifact only after the no-mutation fingerprints had been captured.

## Live proof

Proof ID:

`T019D-LIVE-20261004-121558-21ca5345`

Private evidence filename:

`AISYNC_T019D_LIVE_PROOF_T019D-LIVE-20261004-121558-21ca5345.json`

First snapshot:

- observed at `2026-10-04T12:16:00.422Z`;
- overall: `DEGRADED`;
- ASC DB: `OK`;
- canonical GitHub: `OK`;
- index freshness: `STALE`;
- private continuity: `OK`;
- GitHub App auth: `OK`;
- latest SAVE: `SUCCESS`.

Second snapshot:

- observed at `2026-10-04T12:16:02.925Z`;
- overall: `DEGRADED`;
- probe states matched the first snapshot.

The `DEGRADED` result is the expected truthful outcome because at least one required observation was stale. T-019D PASS therefore means the telemetry did not mislabel stale production evidence as healthy.

All proof checks returned true:

- `first_snapshot_ok`;
- `second_snapshot_ok`;
- `first_ephemeral`;
- `second_ephemeral`;
- `secrets_flag_false`;
- `required_probe_shape`;
- `overall_matches_probe_evidence`;
- `refresh_observation_not_older`;
- `no_secret_material_returned`;
- `github_auth_probe_nonwriting`;
- `history_unchanged`;
- `continuity_unchanged`.

Result: `T019D_LIVE_PROOF_PASS`.

## Independent verification

After the proof:

- Drive metadata confirmed the evidence JSON existed as `application/json`, `shared=false`, with only the owner permission visible;
- HISTORY search for `T019D-LIVE` returned zero matching rows;
- GitHub `main` was still `3873e3289b9051d65c4d315daeb1e68adabaa615`;
- canonical target `records/T016-LIVE-20261003181842.md` still had blob SHA `5427b6cc4aa0c2a87a9532121e1cb8a4bc0a7e22`;
- canonical target content remained unchanged.

The proof therefore did not create a GitHub commit, did not add a HISTORY event, and did not mutate private continuity state.

## Cleanup

Temporary proof version v43 used an owner-only harness above immutable v42.

After proof completion:

- temporary proof deployment was undeployed;
- Apps Script development HEAD was restored;
- development HEAD was independently verified 16/16 files;
- temporary deployment ID was absent;
- protected production remained pinned to v42.

Conclusion: **T-019D LIVE PASS**.
