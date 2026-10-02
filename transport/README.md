# ASC Link Transport v0.1

Status: T-002 PASS

## Boundary

T-001 defined the semantic ASC Write Contract.

T-002 wraps that contract in a transport envelope:

```text
ASC envelope
├─ envelope_version
├─ request_id
├─ expires_at
├─ integrity
│  ├─ algorithm: SHA-256
│  └─ digest: null   ← placeholder until T-010
└─ contract          ← unchanged T-001 semantic object
```

The link format for small payloads is:

```text
<ASC_WEB_APP_URL>#asc=<UTF-8-BASE64URL-ENCODED-ENVELOPE>
```

The payload is carried only in the URL fragment. It is not placed in ordinary query parameters.

## Files

- `asc-envelope-v0.1.schema.json` — envelope schema.
- `asc-link.mjs` — create/encode/decode/build-link functions.
- `test-asc-link.mjs` — dependency-free Node 20+ verification.

## Explicit non-goals for T-002

T-002 does not claim that Base64URL is encryption.

T-002 does not yet enforce:
- expiry rejection;
- cryptographic digest verification;
- nonce/replay protection;
- authentication or authorization.

Those security controls belong to T-010. The current integrity field reserves the design/security slot without pretending the security implementation already exists.

## T-002 pass condition

A valid T-001 contract must:
1. survive encode → link → decode without semantic loss;
2. support Unicode content;
3. remain absent from ordinary query parameters;
4. reject links that attempt to carry `asc` in the query string.


## Verified result

Executed against the committed module with Node:
- semantic round-trip: PASS
- Unicode round-trip: PASS
- fragment-only payload: PASS
- ordinary query payload exposure: NONE
- query-carried ASC payload rejection: PASS

Expiry rejection, digest verification, and replay protection remain intentionally deferred to T-010.
