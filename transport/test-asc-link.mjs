import assert from "node:assert/strict";
import {
  ASC_LINK_CONSTANTS,
  buildAscLink,
  createEnvelope,
  decodeAscLink,
  decodeEnvelope,
  encodeEnvelope
} from "./asc-link.mjs";

const contract = {
  "Project": "AISYNC",
  "Source method": "ZASSIMPLE",
  "Operation": "SAVE",
  "Record type": "decision",
  "Record ID": "D-018",
  "Content/change": {
    "status": "LOCKED",
    "decision": "Unicode round-trip test: ✓ keputusan dikekalkan."
  },
  "Lineage": ["D-002", "D-014"],
  "Destination": ["GitHub", "ASC_DB"]
};

const envelope = createEnvelope(contract, {
  requestId: "req-t002-001",
  expiresAt: "2026-10-01T12:00:00.000Z"
});

assert.equal(ASC_LINK_CONSTANTS.envelopeVersion, "0.1");
assert.equal(envelope.integrity.algorithm, "SHA-256");
assert.equal(envelope.integrity.digest, null);

const encoded = encodeEnvelope(envelope);
const decodedDirect = decodeEnvelope(encoded);
assert.deepEqual(decodedDirect, envelope);

const baseUrl = "https://script.google.com/macros/s/example/exec?view=sync";
const link = buildAscLink(baseUrl, envelope);
const url = new URL(link);

assert.equal(url.searchParams.get("view"), "sync");
assert.equal(url.searchParams.has("asc"), false);
assert.match(url.hash, /^#asc=[A-Za-z0-9_-]+$/);

const decodedFromLink = decodeAscLink(link);
assert.deepEqual(decodedFromLink, envelope);
assert.deepEqual(decodedFromLink.contract, contract);

const serializedContract = JSON.stringify(contract);
assert.equal(url.search.includes(serializedContract), false);
assert.equal(url.search.includes("D-018"), false);

assert.throws(
  () => decodeAscLink("https://example.test/sync?asc=secret#asc=e30"),
  /must not be carried/
);

assert.throws(
  () => createEnvelope(contract, { requestId: "", expiresAt: "2026-10-01T12:00:00Z" }),
  /requestId is required/
);

console.log("T-002 transport tests: PASS");
console.log("fragment:", url.hash.slice(0, 48) + "...");
console.log("query:", url.search);
