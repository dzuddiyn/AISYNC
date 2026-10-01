import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const clientCode = fs.readFileSync(new URL('./Client.html', import.meta.url), 'utf8');

class FakeStorage {
  constructor() { this.map = new Map(); }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.map.set(k, String(v)); }
}

const contract = {
  "Project":"AISYNC",
  "Source method":"ZASSIMPLE",
  "Operation":"SAVE",
  "Record type":"decision",
  "Record ID":"D-019",
  "Content/change":{"status":"LOCKED","label":"DECIDE / DESIGN"},
  "Lineage":["D-012"],
  "Destination":["GitHub","ASC_DB"]
};

const envelope = {
  envelope_version:"0.1",
  request_id:"req-t004-test",
  expires_at:"2026-10-02T06:00:00+08:00",
  integrity:{algorithm:"SHA-256",digest:null},
  contract
};

const encoded = Buffer.from(JSON.stringify(envelope), 'utf8')
  .toString('base64')
  .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');

const storage = new FakeStorage();
const sandbox = {
  TextDecoder,
  Uint8Array,
  atob: s => Buffer.from(s,'base64').toString('binary'),
  console
};
vm.createContext(sandbox);
vm.runInContext(clientCode, sandbox);

const first = sandbox.preservePendingRequest({hash:'#asc=' + encoded}, storage);
assert.equal(first.source, 'url');
assert.equal(first.fragment, '#asc=' + encoded);

// Simulate returning from a sign-in/navigation step with no fragment.
// The same browser tab retains sessionStorage, so ASC restores the pending request.
const afterAuth = sandbox.preservePendingRequest({hash:''}, storage);
assert.equal(afterAuth.source, 'session');
assert.equal(afterAuth.fragment, '#asc=' + encoded);

const decoded = sandbox.decodePendingEnvelope(afterAuth.fragment);
assert.equal(JSON.stringify(decoded.contract), JSON.stringify(contract));

// T-004 must not expose any persistence function in the client skeleton.
assert.equal(typeof sandbox.confirmAndSync, 'undefined');
assert.equal(typeof sandbox.writeToGitHub, 'undefined');

console.log('T-004 pending-request state test: PASS');
console.log('source after simulated auth:', afterAuth.source);
console.log('write functions exposed: none');
