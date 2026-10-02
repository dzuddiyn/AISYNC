# ASC Core — T-005 Pure Boundary

Status: pure proof; no persistence or destination write.

## Boundary

```text
ASC Write Contract
        ↓
validate
        ↓
authorization policy boundary
        ↓
preserve semantic meaning
        ↓
route by Destination
        ↓
adapter invocation descriptions
        ↓
neutral receipt-layer handoff description
```

`asc-core.mjs` is method-agnostic and uses only Node/JavaScript built-ins. It does not interpret ZASS semantics, route DUMP / DECIDE / DESIGN, call a provider, call GitHub/Sheets, or perform external I/O.

## Validation

`validateContract(contract)` enforces the existing eight-field ASC Write Contract v0.1:

- `Project`
- `Source method`
- `Operation`
- `Record type`
- `Record ID`
- `Content/change`
- `Lineage`
- `Destination`

It rejects missing or extra top-level fields, invalid field shapes, duplicate lineage items, duplicate destinations, and empty destinations. Ordinary invalid input returns a structured invalid result rather than throwing.

## Authorization

`authorizeRequest(contract, authorizationContext, authorizationPolicy)` fails closed without an injected policy. The policy must explicitly return `{ authorized: true }`. The policy receives a semantic copy, and denial stops processing before routing.

## Routing and interfaces

The proof supports only these routing descriptors:

```text
GitHub → github
ASC_DB → asc_db
```

Destination order is preserved. Unknown destinations can pass semantic validation but are rejected at the Core routing boundary.

`createAdapterInvocation()` describes future adapter input without commit IDs, tokens, network metadata, or write claims. `createReceiptLayerHandoff()` is neutral and does not claim success, a commit, a resource, or a timestamp.

## Verification

Run:

```text
node core/test-asc-core.mjs
```

The test uses the existing valid contract examples and covers validation, authorization order, semantic immutability, destination routing, provider independence, neutral interfaces, and the no-I/O/no-write boundary.
