// T-015 â€” private continuity state binding.
//
// All functions are private server-side helpers (trailing underscore). They are not
// exposed as browser-callable entry points. Authorization/public UX is later work.

function ascPrivateContinuityStore_() {
  return {
    read: function () {
      return ascContinuityStoreRead_();
    },
    transact: function (mutator) {
      return ascContinuityStoreTransact_(mutator);
    }
  };
}

function ascPrivateContinuityService_() {
  return ascRuntime_().continuity.createPrivateContinuityService({
    store: ascPrivateContinuityStore_(),
    fingerprint: ascSha256Hex_
  });
}

function ascReadPrivateContinuityThread_(projectId, threadId) {
  return ascPrivateContinuityService_().getThread({
    projectId: projectId,
    threadId: threadId
  });
}

function ascListPrivateContinuityThreads_(projectId) {
  return ascPrivateContinuityService_().listThreads({
    projectId: projectId
  });
}

function ascReadPrivateContinuityEvents_(projectId, threadId) {
  return ascPrivateContinuityService_().readEvents({
    projectId: projectId,
    threadId: threadId
  });
}

function ascBootstrapPrivateContinuityThread_(input) {
  return ascPrivateContinuityService_().bootstrap(input);
}

function ascApplyPrivateContinuityMutation_(input) {
  return ascPrivateContinuityService_().applyMutation(input);
}

function ascDeletePrivateContinuityThread_(input) {
  return ascPrivateContinuityService_().deleteThread(input);
}

function ascAssessProjectIndexFreshness_(input) {
  return ascRuntime_().indexFreshness.assessIndexFreshness(input);
}

