# GitHub Adapter — T-006A Local/Mock Proof

Status: local adapter-mechanics proof; no real GitHub I/O.

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

## Outcomes

- `VERIFIED_WRITE` — write succeeded and persisted content exactly matches; persisted SHA is captured.
- `NO_CHANGE` — existing content exactly matches; no write is called.
- `READ_ERROR` — initial read failed; no write is called.
- `WRITE_ERROR` — write failed; no verification read is called.
- `WRITE_UNVERIFIED` — write returned, but verification read failed or content mismatched; captured `commitSha` is preserved.
- `INVALID_INPUT` — invocation, write spec, or injected client boundary is invalid.

The adapter never emits final `SUCCESS`/`FAILED` receipt claims, HISTORY entries, timestamps, request IDs, or fabricated identifiers.

## Immutability

Client call arguments, semantic contracts, invocation input, and write specs are isolated copies. Client mutation attempts cannot alter caller-owned data.

## Verification

Run only:

```text
node adapters/github/test-github-adapter.mjs
```

The test uses an in-memory fake client and covers create, update, no-change, call order, structured failures, post-write verification, commit preservation on unverified writes, and the no-network/no-credential/no-receipt boundary.
