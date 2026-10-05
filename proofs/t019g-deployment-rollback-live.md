# T-019G Live Deployment / Rollback Proof

Date: 2026-10-05
Status: PASS

## Objective

Prove that the protected AISYNC Apps Script production deployment can be rolled back to a known-good immutable version and then rolled forward again to the intended current version without changing canonical Git state or development HEAD.

## Baseline

Before the rollback test:

- protected production deployment ID: `AKfycbwueOtAmw_QKpWGfHHuX-dss4TSpyhnRGLj4Y6LcEW3KR2f4tAROR8ECjlCVP1JuEm07w`;
- protected production version: v46;
- deployment label: `T019F-secret-rotation`;
- canonical GitHub main: `8e1c7347d963796ace3f42d5bcf509b85b20b938`;
- development HEAD matched the saved pre-proof snapshot.

## Live rollback

The protected production deployment was intentionally repointed from v46 to immutable v44 with proof label:

`T019G-rollback-proof-v44`

Verification after rollback:

- protected deployment pointer reported v44;
- immutable v44 runtime was pulled directly by version number;
- pulled v44 runtime matched the known v44 release snapshot exactly: 18/18 files;
- no development-HEAD change was required;
- canonical GitHub main remained `8e1c7347d963796ace3f42d5bcf509b85b20b938`.

This proves rollback uses an immutable Apps Script version rather than rebuilding an approximation of the prior release.

## Live roll-forward

The protected deployment was then repointed back to immutable v46 with the production label:

`T019F-secret-rotation`

Verification after roll-forward:

- protected deployment pointer reported v46;
- immutable v46 was pulled directly by version number;
- pulled v46 runtime matched the pre-proof immutable v46 verification snapshot exactly: 19/19 files;
- canonical GitHub main remained `8e1c7347d963796ace3f42d5bcf509b85b20b938`;
- development HEAD still matched the saved pre-proof development snapshot exactly: 16/16 files.

The temporary mismatch observed when comparing against `v46-stage` was correctly diagnosed as a bad reference directory: that staging directory had later been augmented with T-019F proof files. The authoritative immutable comparison used the pre-proof `v46-verify` snapshot and passed 19/19.

## Operational conclusion

The live sequence proved:

1. current protected production version can be identified before change;
2. an earlier known-good immutable version can be selected explicitly;
3. the protected deployment can be repointed to that immutable rollback target;
4. rollback content can be independently re-pulled and compared against its known release snapshot;
5. canonical GitHub is not rewritten by deployment rollback;
6. the intended current immutable version can be restored explicitly;
7. roll-forward content can be independently re-pulled and verified;
8. development HEAD is independent of the protected version pointer and remained/restored to its expected 16-file snapshot;
9. deployment state and canonical repository state therefore remain separate authorities.

No source rebuild, branch rewrite, or business-data mutation was required for the rollback/roll-forward operation.

Conclusion: **T-019G LIVE PASS**.
