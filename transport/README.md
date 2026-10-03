# ASC Link Transport v0.1

Status: T-002 PASS

## Boundary

T-001 defined the semantic ASC Write Contract.

T-002 wraps that contract in a transport envelope:

```text
ASC envelope
├─ envelope_version
├─ request_id
├─ issued_at        ← T-010 (D-029)
├─ expires_at       ← ≤ 30 minutes after issued_at
├─ integrity
│  ├─ algorithm: SHA-256
│  └─ digest         ← lowercase hex SHA-256 of canonical JSON (T-010)
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


## T-010A envelope security — LOCAL PASS (D-029)

`envelope-security.mjs` is the single runtime-neutral validator (Node + Apps Script via the mechanical runtime build). `createEnvelope()` now requires `issuedAt`; `sealEnvelope(envelope, sha256Hex)` fills `integrity.digest`; `validateEnvelopeSecurity(envelope, { now, sha256Hex })` enforces exact envelope keys, strict ISO date-times with explicit offset, `expires_at > issued_at`, lifetime and remaining lifetime ≤ 30 minutes, not expired (`REQUEST_EXPIRED`), `SHA-256` algorithm, lowercase 64-hex digest, and digest match (`INTEGRITY_MISMATCH`).

Digest input: canonical JSON (keys sorted recursively, array order preserved) of `{envelope_version, request_id, issued_at, expires_at, contract}`, UTF-8 encoded. This is integrity / error detection only — not a signature, MAC, or sender authentication. Replay and owner checks live in the server binding (T-010B).

## Production semantic-idempotency boundary — D-034

The envelope `request_id` above is a transport/security-attempt identity. It must not be treated as the frozen ZASSPILL semantic idempotency key.

For private continuity writes:

```text
envelope request_id
= transport replay/security identity

ZASSPILL req_<ULID>
= logical semantic request/idempotency identity
```

Therefore a semantic retry may use a new transport envelope while preserving the same semantic `req_<ULID>` when required by ZASSPILL idempotency or WRITE_OUTCOME_UNKNOWN recovery. D-029 replay protection remains intact; semantic idempotency is a separate Production v1 concern.

```text
node transport/test-envelope-security.mjs
```
