# GitHub Adapter — T-006A / T-006B

Status: T-006A mock proof PASS; T-006B REST transport prepared; live proof NOT RUN YET.

## Boundary

```text
T-005 GitHub adapter invocation + write spec
        ↓
validate destination boundary
        ↓
read current file
        ↓
create/update/no-change decision
        ↓
write through injected client
        ↓
read persisted state
        ↓
exact content verification
        ↓
factual adapter result
```

`github-adapter.mjs` uses Node/JavaScript built-ins only. It does not call GitHub, use a PAT, build an API URL, perform persistence, or create a final Write Receipt.

T-006B adds `github-rest-client.mjs` as the real transport behind the same injected client boundary. It is tested only with fake fetch. The live proof script exists but has not been run with its safety variables.

## Input boundaries

`validateGitHubInvocation(invocation)` requires:

```text
{
  destination: "GitHub",
  adapterId: "github",
  contract: <object>
}
```

The semantic contract is opaque to this adapter. T-005 owns semantic validation.

`validateGitHubWriteSpec(writeSpec)` accepts only:

```text
{
  repository,
  path,
  branch,
  content,
  commitMessage
}
```

All fields are destination mechanics. No token, PAT, authorization header, or credential is accepted.

## Injected client interface

The adapter receives a client exposing synchronous test/mock equivalents of:

```js
githubClient.readFile({ repository, path, branch })
githubClient.writeFile({
  repository,
  path,
  branch,
  content,
  commitMessage,
  sha // included only when updating an existing file
})
```

Read results:

```text
{ ok: true, found: true, sha, content }
{ ok: true, found: false, sha: null, content: null }
{ ok: false, error: { code, message } }
```

Write results:

```text
{ ok: true, commitSha, contentSha }
{ ok: false, error: { code, message } }
```

The client owns transport later. Client exceptions become structured adapter failures.

`github-rest-client.mjs` owns the GitHub Contents API URL, headers, runtime-only Bearer token, HTTP status translation, UTF-8 Base64 transport encoding/decoding, and response-shape validation. The token is never part of a write spec, semantic contract, adapter result, error, or committed file.

## Outcomes

- `VERIFIED_WRITE` — write succeeded and persisted content exactly matches; persisted SHA is captured.
- `NO_CHANGE` — existing content exactly matches; no write is called.
- `READ_ERROR` — initial read failed; no write is called.
- `WRITE_ERROR` — write failed; no verification read is called.
- `WRITE_UNVERIFIED` — write returned, but verification read failed or content mismatched; captured `commitSha` is preserved.
- `INVALID_INPUT` — invocation, write spec, or injected client boundary is invalid.

The adapter never emits final `SUCCESS`/`FAILED` receipt claims, HISTORY entries, timestamps, request IDs, or fabricated identifiers.

## T-006B live proof safety

`live-t006b.mjs` targets:

```text
repository: dzuddiyn/AISYNC
branch: main
path: proofs/t006b-github-adapter-live.md
```

The proof content and commit message are deterministic. The script makes zero client calls unless both conditions are true:

```text
T006B_LIVE=YES
GITHUB_TOKEN=<runtime-only token>
```

Run without those variables only to verify safe refusal:

```text
node adapters/github/live-t006b.mjs
```

Do not commit a token or run the live proof accidentally. A repeated live run with identical persisted content should return `NO_CHANGE` through T-006A and create no second commit.

## Immutability

Client call arguments, semantic contracts, invocation input, and write specs are isolated copies. Client mutation attempts cannot alter caller-owned data.

## Verification

Run only:

```text
node adapters/github/test-github-adapter.mjs
```

The T-006A test uses an in-memory fake client and covers create, update, no-change, call order, structured failures, post-write verification, commit preservation on unverified writes, and the no-network/no-credential/no-receipt boundary.

The T-006B REST client test uses fake fetch only and covers URL/branch encoding, headers, exact UTF-8 Base64 transport, 404 missing files, HTTP/malformed/fetch failures, create/update request bodies, and token secrecy.
