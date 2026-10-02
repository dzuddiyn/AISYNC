import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as core from './asc-core.mjs';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
}

const validZassimpleSave = readJson('../contracts/examples/valid-zassimple-save.json');
const validTextChange = readJson('../contracts/examples/valid-text-change.json');

function allowPolicy() {
  return { authorized: true };
}

function assertRejected(contract, code) {
  const result = core.validateContract(contract);
  assert.equal(result.valid, false);
  assert.equal(result.errors.some(error => error.code === code), true);
}

const validResult = core.processCoreRequest({
  contract: validZassimpleSave,
  authorizationContext: { label: 'test-owner' },
  authorizationPolicy: allowPolicy
});
assert.equal(validResult.status, 'ACCEPTED');
assert.equal(validResult.stage, 'CORE_BOUNDARY');
assert.deepStrictEqual(validResult.contract, validZassimpleSave);
assert.deepStrictEqual(validZassimpleSave, readJson('../contracts/examples/valid-zassimple-save.json'));
assert.deepStrictEqual(validResult.contract['Content/change'], validZassimpleSave['Content/change']);
assert.deepStrictEqual(validResult.contract.Lineage, ['D-002', 'D-014']);
assert.deepStrictEqual(validResult.contract.Destination, ['GitHub', 'ASC_DB']);

const textResult = core.processCoreRequest({
  contract: validTextChange,
  authorizationContext: { label: 'text-test' },
  authorizationPolicy: allowPolicy
});
assert.equal(textResult.status, 'ACCEPTED');
assert.deepStrictEqual(textResult.contract, validTextChange);

const missingRecordId = { ...validTextChange };
delete missingRecordId['Record ID'];
assertRejected(missingRecordId, 'MISSING_FIELD');

let invalidAuthorizationCalls = 0;
const invalidResult = core.processCoreRequest({
  contract: missingRecordId,
  authorizationPolicy() {
    invalidAuthorizationCalls += 1;
    return { authorized: true };
  }
});
assert.equal(invalidResult.stage, 'VALIDATION');
assert.equal(invalidAuthorizationCalls, 0);

const envelopeLeak = { ...validTextChange, expires_at: '2026-10-03T00:00:00Z' };
assertRejected(envelopeLeak, 'EXTRA_FIELD');

assertRejected({ ...validTextChange, Destination: [] }, 'INVALID_DESTINATION');
assertRejected({ ...validTextChange, Lineage: ['D-002', 'D-002'] }, 'INVALID_LINEAGE');
assertRejected({ ...validTextChange, Destination: ['GitHub', 'GitHub'] }, 'INVALID_DESTINATION');
assertRejected({ ...validTextChange, 'Content/change': null }, 'INVALID_CONTENT');
assertRejected({ ...validTextChange, 'Content/change': 42 }, 'INVALID_CONTENT');

const missingPolicy = core.processCoreRequest({ contract: validTextChange });
assert.equal(missingPolicy.status, 'REJECTED');
assert.equal(missingPolicy.stage, 'AUTHORIZATION');
assert.equal(missingPolicy.authorization.errors[0].code, 'AUTHORIZATION_POLICY_REQUIRED');

let deniedPolicyCalls = 0;
const denied = core.processCoreRequest({
  contract: validTextChange,
  authorizationContext: { label: 'denied' },
  authorizationPolicy() {
    deniedPolicyCalls += 1;
    return { authorized: false };
  }
});
assert.equal(denied.status, 'REJECTED');
assert.equal(denied.stage, 'AUTHORIZATION');
assert.equal(deniedPolicyCalls, 1);
assert.equal(Object.prototype.hasOwnProperty.call(denied, 'routes'), false);

const policyInput = structuredClone(validTextChange);
const policyResult = core.processCoreRequest({
  contract: policyInput,
  authorizationPolicy(policyContract) {
    policyContract.Project = 'mutated-inside-policy';
    return { authorized: true };
  }
});
assert.equal(policyResult.status, 'ACCEPTED');
assert.equal(policyInput.Project, 'Example Project');
assert.equal(policyResult.contract.Project, 'Example Project');

const nestedPolicyInput = structuredClone(validZassimpleSave);
const nestedPolicyResult = core.processCoreRequest({
  contract: nestedPolicyInput,
  authorizationPolicy(policyContract) {
    policyContract['Content/change'].decision = 'mutated-inside-policy';
    policyContract.Lineage.push('mutated-inside-policy');
    return { authorized: true };
  }
});
assert.equal(nestedPolicyResult.status, 'ACCEPTED');
assert.equal(
  nestedPolicyResult.contract['Content/change'].decision,
  validZassimpleSave['Content/change'].decision
);
assert.deepStrictEqual(nestedPolicyResult.contract.Lineage, ['D-002', 'D-014']);

const unknownDestination = { ...validTextChange, Destination: ['FutureSystem'] };
const unknownResult = core.processCoreRequest({
  contract: unknownDestination,
  authorizationPolicy: allowPolicy
});
assert.equal(unknownResult.status, 'REJECTED');
assert.equal(unknownResult.stage, 'ROUTING');
assert.equal(unknownResult.routing.error.code, 'UNSUPPORTED_DESTINATION');

const mixedDestination = { ...validTextChange, Destination: ['GitHub', 'FutureSystem'] };
const mixedResult = core.processCoreRequest({
  contract: mixedDestination,
  authorizationPolicy: allowPolicy
});
assert.equal(mixedResult.status, 'REJECTED');
assert.equal(mixedResult.stage, 'ROUTING');
assert.deepStrictEqual(mixedResult.routing.routes, []);
assert.equal(Object.prototype.hasOwnProperty.call(mixedResult, 'adapterInvocations'), false);

const githubRoute = core.routeDestinations({ Destination: ['GitHub'] });
assert.deepStrictEqual(githubRoute.routes, [{ destination: 'GitHub', adapterId: 'github' }]);

const databaseRoute = core.routeDestinations({ Destination: ['ASC_DB'] });
assert.deepStrictEqual(databaseRoute.routes, [{ destination: 'ASC_DB', adapterId: 'asc_db' }]);

const orderedRoutes = core.routeDestinations({ Destination: ['GitHub', 'ASC_DB'] });
assert.deepStrictEqual(orderedRoutes.routes, [
  { destination: 'GitHub', adapterId: 'github' },
  { destination: 'ASC_DB', adapterId: 'asc_db' }
]);

const invocation = core.createAdapterInvocation(validZassimpleSave, orderedRoutes.routes[0]);
assert.deepStrictEqual(Object.keys(invocation).sort(), ['adapterId', 'contract', 'destination']);
assert.equal(invocation.destination, 'GitHub');
assert.equal(invocation.adapterId, 'github');
assert.deepStrictEqual(invocation.contract, validZassimpleSave);
assert.equal(Object.prototype.hasOwnProperty.call(invocation, 'commitId'), false);
assert.equal(Object.prototype.hasOwnProperty.call(invocation, 'writeResult'), false);

const githubInvocation = core.createAdapterInvocation(validZassimpleSave, orderedRoutes.routes[0]);
const databaseInvocation = core.createAdapterInvocation(validZassimpleSave, orderedRoutes.routes[1]);
githubInvocation.contract['Content/change'].status = 'mutated-by-github-adapter';
githubInvocation.contract.Lineage.push('mutated-by-github-adapter');
assert.equal(databaseInvocation.contract['Content/change'].status, 'LOCKED');
assert.deepStrictEqual(databaseInvocation.contract.Lineage, ['D-002', 'D-014']);
assert.equal(validZassimpleSave['Content/change'].status, 'LOCKED');
assert.deepStrictEqual(validZassimpleSave.Lineage, ['D-002', 'D-014']);

const receiptHandoff = core.createReceiptLayerHandoff({ adapter: 'github', result: 'future adapter result' });
assert.equal(receiptHandoff.kind, 'ADAPTER_RESULT_TO_RECEIPT_LAYER');
assert.equal(Object.prototype.hasOwnProperty.call(receiptHandoff, 'status'), false);
assert.equal(Object.prototype.hasOwnProperty.call(receiptHandoff, 'commitId'), false);
assert.equal(Object.prototype.hasOwnProperty.call(receiptHandoff, 'success'), false);

const providerContexts = ['ChatGPT', 'Gemini', 'Copilot'].map(function (provider) {
  return core.processCoreRequest({
    contract: validZassimpleSave,
    authorizationContext: { provider },
    authorizationPolicy: allowPolicy
  });
});
assert.equal(providerContexts.every(result => result.status === 'ACCEPTED'), true);
assert.equal(
  JSON.stringify(providerContexts[0].contract),
  JSON.stringify(providerContexts[1].contract)
);
assert.equal(
  JSON.stringify(providerContexts[1].contract),
  JSON.stringify(providerContexts[2].contract)
);
assert.deepStrictEqual(providerContexts[0].routes, providerContexts[1].routes);
assert.deepStrictEqual(providerContexts[1].routes, providerContexts[2].routes);

let networkCalls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = function () {
  networkCalls += 1;
};
core.processCoreRequest({ contract: validTextChange, authorizationPolicy: allowPolicy });
globalThis.fetch = originalFetch;
assert.equal(networkCalls, 0);

assert.equal(typeof core.writeToGitHub, 'undefined');
assert.equal(typeof core.writeToSheets, 'undefined');
assert.equal(typeof core.persistContract, 'undefined');
assert.equal(typeof core.fetch, 'undefined');
assert.equal(typeof core.suggestRoute, 'undefined');
assert.equal(typeof core.getRouteConfig, 'undefined');

console.log('ASC Core T-005 pure boundary test: PASS');
console.log('validation, authorization, semantic preservation, routing, and interfaces: PASS');
console.log('network/persistence/write calls: none');
console.log('ZASS reasoning/router logic: none');
