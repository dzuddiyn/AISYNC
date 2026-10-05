const REGISTRY_VERSION = '0.1';
const SAFE_RECORD_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const SAFE_PATH_PREFIX = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,255}$/;
const SAFE_EXTENSION = /^\.[A-Za-z0-9]{1,10}$/;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]';
}
function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
function fail(code, message) { return { ok: false, error: { code, message } }; }
function validRepository(value) { return typeof value === 'string' && /^[^/\s]+\/[^/\s]+$/.test(value); }
function validBranch(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 255 &&
    !/[\u0000-\u001f\s]/.test(value) && !value.startsWith('-') &&
    !value.includes('..') && !value.endsWith('.') && !value.endsWith('/');
}
function validPrefix(value) {
  return typeof value === 'string' && SAFE_PATH_PREFIX.test(value) &&
    !value.startsWith('/') && !value.endsWith('/') && !value.includes('..') &&
    !value.split('/').includes('.');
}
function validExtension(value) { return typeof value === 'string' && SAFE_EXTENSION.test(value); }

function validateProjectEntry(entry) {
  if (!isPlainObject(entry)) return fail('INVALID_PROJECT_ENTRY', 'Project registry entry must be an object.');
  const allowed = ['repository', 'branch', 'path_prefix', 'extension', 'allowed_operations'];
  if (Object.keys(entry).some(key => !allowed.includes(key))) return fail('EXTRA_PROJECT_ENTRY_FIELD', 'Unsupported project registry field.');
  if (!validRepository(entry.repository)) return fail('INVALID_PROJECT_REPOSITORY', 'Project repository is invalid.');
  if (!validBranch(entry.branch)) return fail('INVALID_PROJECT_BRANCH', 'Project branch is invalid.');
  if (!validPrefix(entry.path_prefix)) return fail('INVALID_PROJECT_PATH_PREFIX', 'Project path prefix is invalid.');
  if (!validExtension(entry.extension)) return fail('INVALID_PROJECT_EXTENSION', 'Project extension is invalid.');
  if (!Array.isArray(entry.allowed_operations) || entry.allowed_operations.length === 0 ||
      entry.allowed_operations.some(op => typeof op !== 'string' || op.length === 0) ||
      new Set(entry.allowed_operations).size !== entry.allowed_operations.length) {
    return fail('INVALID_ALLOWED_OPERATIONS', 'allowed_operations must be a unique non-empty string array.');
  }
  return { ok: true };
}

export function validateProductionProjectRegistry(registry) {
  if (!isPlainObject(registry)) return fail('INVALID_REGISTRY', 'Production project registry must be an object.');
  if (registry.schema_version !== REGISTRY_VERSION) return fail('UNSUPPORTED_REGISTRY_VERSION', 'Registry schema_version must be 0.1.');
  if (!isPlainObject(registry.projects) || Object.keys(registry.projects).length === 0) {
    return fail('INVALID_REGISTRY_PROJECTS', 'Production project registry must contain projects.');
  }
  for (const projectId of Object.keys(registry.projects)) {
    if (!projectId || projectId.length > 128) return fail('INVALID_PROJECT_ID', 'Production project ID is invalid.');
    const result = validateProjectEntry(registry.projects[projectId]);
    if (!result.ok) return result;
  }
  return { ok: true };
}

export function authorizeProductionGitHubContract(contract, context, registry) {
  const registryValidation = validateProductionProjectRegistry(registry);
  if (!registryValidation.ok) return { authorized: false, error: registryValidation.error };
  const owner = Boolean(context) && typeof context.activeUser === 'string' && context.activeUser.length > 0 &&
    context.activeUser === context.effectiveUser;
  const beta = Boolean(context) && context.betaAuthorized === true &&
    typeof context.betaParticipantId === 'string' && context.betaParticipantId.length > 0;
  if (!owner && !beta) {
    return {
      authorized: false,
      error: { code: 'BETA_ACCESS_REQUIRED', message: 'Owner or invited beta access is required.' }
    };
  }
  if (!contract || typeof contract !== 'object' || Array.isArray(contract)) {
    return { authorized: false, error: { code: 'INVALID_CONTRACT', message: 'Contract is required.' } };
  }
  if (beta) {
    const allowedProjects = Array.isArray(context.betaAllowedProjects) ? context.betaAllowedProjects : [];
    if (!allowedProjects.includes(contract.Project)) {
      return {
        authorized: false,
        error: { code: 'BETA_PROJECT_NOT_ALLOWED', message: 'This beta participant is not allowed to write this project.' }
      };
    }
  }
  const entry = registry.projects[contract.Project];
  if (!entry) return { authorized: false, error: { code: 'PROJECT_NOT_AUTHORIZED', message: 'Project is not in the production registry.' } };
  if (!Array.isArray(contract.Destination) || contract.Destination.length !== 1 || contract.Destination[0] !== 'GitHub') {
    return { authorized: false, error: { code: 'DESTINATION_NOT_AUTHORIZED', message: 'Production v1 supports GitHub only.' } };
  }
  if (!entry.allowed_operations.includes(contract.Operation)) {
    return { authorized: false, error: { code: 'OPERATION_NOT_AUTHORIZED', message: 'Operation is not authorized.' } };
  }
  if (typeof contract['Record ID'] !== 'string' || !SAFE_RECORD_ID.test(contract['Record ID']) ||
      contract['Record ID'] === '.' || contract['Record ID'] === '..') {
    return { authorized: false, error: { code: 'RECORD_ID_NOT_AUTHORIZED', message: 'Record ID is invalid.' } };
  }
  if (typeof contract['Content/change'] !== 'string') {
    return { authorized: false, error: { code: 'CONTENT_NOT_SUPPORTED', message: 'Production GitHub SAVE requires string Content/change.' } };
  }
  return { authorized: true };
}

export function resolveProductionGitHubWriteSpec(invocation, registry) {
  if (!invocation || invocation.destination !== 'GitHub' || invocation.adapterId !== 'github' ||
      !invocation.contract || typeof invocation.contract !== 'object') throw new Error('INVALID_GITHUB_INVOCATION');
  const validation = validateProductionProjectRegistry(registry);
  if (!validation.ok) throw new Error(validation.error.code);
  const contract = invocation.contract;
  const entry = registry.projects[contract.Project];
  if (!entry) throw new Error('PROJECT_NOT_AUTHORIZED');
  if (!entry.allowed_operations.includes(contract.Operation)) throw new Error('OPERATION_NOT_AUTHORIZED');
  if (typeof contract['Record ID'] !== 'string' || !SAFE_RECORD_ID.test(contract['Record ID']) ||
      contract['Record ID'] === '.' || contract['Record ID'] === '..') throw new Error('RECORD_ID_NOT_AUTHORIZED');
  if (typeof contract['Content/change'] !== 'string') throw new Error('CONTENT_NOT_SUPPORTED');
  return {
    repository: entry.repository,
    branch: entry.branch,
    path: entry.path_prefix + '/' + contract['Record ID'] + entry.extension,
    content: contract['Content/change'],
    commitMessage: 'AISYNC ' + contract.Operation + ' ' + contract.Project + '/' + contract['Record ID']
  };
}

export function parseProductionProjectRegistryJson(text) {
  if (typeof text !== 'string' || text.length === 0) return fail('REGISTRY_MISSING', 'Production project registry is not configured.');
  let registry;
  try { registry = JSON.parse(text); } catch (_error) { return fail('REGISTRY_MALFORMED_JSON', 'Production project registry JSON is malformed.'); }
  const validation = validateProductionProjectRegistry(registry);
  if (!validation.ok) return validation;
  return { ok: true, registry: clone(registry) };
}

export const PRODUCTION_REGISTRY_VERSION = REGISTRY_VERSION;
