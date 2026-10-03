import assert from 'node:assert/strict';
import {
  authorizeProductionGitHubContract,
  parseProductionProjectRegistryJson,
  resolveProductionGitHubWriteSpec,
  validateProductionProjectRegistry
} from './github-write-policy.mjs';

const registry = {
  schema_version: '0.1',
  projects: {
    AISYNC: {
      repository: 'dzuddiyn/AISYNC',
      branch: 'main',
      path_prefix: 'records',
      extension: '.md',
      allowed_operations: ['SAVE']
    }
  }
};

const contract = {
  Project: 'AISYNC',
  'Source method': 'ZASSIMPLE',
  Operation: 'SAVE',
  'Record type': 'checkpoint',
  'Record ID': 'PROD-001',
  'Content/change': '# production content\n',
  Lineage: ['D-031', 'T-016'],
  Destination: ['GitHub']
};

const owner = { activeUser: 'owner@example.test', effectiveUser: 'owner@example.test' };

assert.equal(validateProductionProjectRegistry(registry).ok, true);
assert.equal(parseProductionProjectRegistryJson(JSON.stringify(registry)).ok, true);
assert.equal(parseProductionProjectRegistryJson('{bad').error.code, 'REGISTRY_MALFORMED_JSON');
assert.equal(authorizeProductionGitHubContract(contract, owner, registry).authorized, true);

const spec = resolveProductionGitHubWriteSpec({
  destination: 'GitHub',
  adapterId: 'github',
  contract
}, registry);
assert.deepStrictEqual(spec, {
  repository: 'dzuddiyn/AISYNC',
  branch: 'main',
  path: 'records/PROD-001.md',
  content: '# production content\n',
  commitMessage: 'AISYNC SAVE AISYNC/PROD-001'
});

for (const [label, changed, code] of [
  ['unknown project', { Project: 'OTHER' }, 'PROJECT_NOT_AUTHORIZED'],
  ['bad destination', { Destination: ['GitHub', 'ASC_DB'] }, 'DESTINATION_NOT_AUTHORIZED'],
  ['bad op', { Operation: 'DELETE' }, 'OPERATION_NOT_AUTHORIZED'],
  ['path injection', { 'Record ID': '../x' }, 'RECORD_ID_NOT_AUTHORIZED'],
  ['slash injection', { 'Record ID': 'a/b' }, 'RECORD_ID_NOT_AUTHORIZED'],
  ['object content', { 'Content/change': { a: 1 } }, 'CONTENT_NOT_SUPPORTED']
]) {
  const result = authorizeProductionGitHubContract({ ...contract, ...changed }, owner, registry);
  assert.equal(result.authorized, false, label);
  assert.equal(result.error.code, code, label);
}

assert.equal(
  authorizeProductionGitHubContract(contract, { activeUser: 'other@example.test', effectiveUser: 'owner@example.test' }, registry).error.code,
  'OWNER_REQUIRED'
);

assert.equal(validateProductionProjectRegistry({
  ...registry,
  projects: { AISYNC: { ...registry.projects.AISYNC, path_prefix: '../escape' } }
}).error.code, 'INVALID_PROJECT_PATH_PREFIX');

assert.equal(validateProductionProjectRegistry({
  ...registry,
  projects: { AISYNC: { ...registry.projects.AISYNC, extra: true } }
}).error.code, 'EXTRA_PROJECT_ENTRY_FIELD');

const original = structuredClone(registry);
const parsed = parseProductionProjectRegistryJson(JSON.stringify(registry));
parsed.registry.projects.AISYNC.branch = 'mutated';
assert.deepStrictEqual(registry, original, 'returned registry must be isolated');

console.log('T-016 production GitHub write policy: PASS');
console.log('authorized registry + deterministic Record ID mapping + path traversal guards: PASS');
