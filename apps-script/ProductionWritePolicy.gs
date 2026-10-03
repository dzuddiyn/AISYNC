var ASC_PRODUCTION_REGISTRY_PROPERTY_ = 'ASC_GITHUB_PROJECT_REGISTRY';

function ascProductionRegistry_() {
  var raw = ascScriptProperty_(ASC_PRODUCTION_REGISTRY_PROPERTY_);
  var parsed = ascRuntime_().productionPolicy.parseProductionProjectRegistryJson(raw);
  if (!parsed.ok) {
    return parsed;
  }
  return parsed;
}

function ascProductionRegistryConfigured_() {
  return ascProductionRegistry_().ok === true;
}

function ascProductionAuthorizationPolicy_(contract, context) {
  var parsed = ascProductionRegistry_();
  if (!parsed.ok) {
    return { authorized: false };
  }
  return ascRuntime_().productionPolicy.authorizeProductionGitHubContract(
    contract,
    context,
    parsed.registry
  );
}

function ascProductionWriteSpec_(invocation) {
  var parsed = ascProductionRegistry_();
  if (!parsed.ok) {
    throw new Error(parsed.error.code);
  }
  return ascRuntime_().productionPolicy.resolveProductionGitHubWriteSpec(
    invocation,
    parsed.registry
  );
}
