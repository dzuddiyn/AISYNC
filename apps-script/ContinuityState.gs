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

function ascListPrivateContinuityThreadRecords_(projectId) {
  return ascPrivateContinuityService_().listThreadRecords({
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


function ascZasspillRetrievalService_() {
  return ascRuntime_().zasspillContinuity.createZasspillRetrievalService({
    continuityService: ascPrivateContinuityService_()
  });
}

function ascZasspillGetById_(projectId, threadId) {
  return ascZasspillRetrievalService_().getById({
    projectId: projectId,
    threadId: threadId
  });
}

function ascZasspillResolveThread_(projectId, cue, exclude, lifecycleIntent) {
  return ascZasspillRetrievalService_().resolveThread({
    projectId: projectId,
    cue: cue,
    exclude: Array.isArray(exclude) ? exclude : [],
    lifecycleIntent: lifecycleIntent == null ? null : lifecycleIntent
  });
}

function ascZasspillListThreads_(projectId) {
  return ascZasspillRetrievalService_().listThreads({
    projectId: projectId
  });
}

function ascZasspillExportPacketV2_(projectId, threadId, exportedAt, provenance) {
  var readResult = ascZasspillGetById_(projectId, threadId);
  if (readResult.status !== 'FOUND') return readResult;
  return ascRuntime_().zasspillContinuity.exportPortablePacketV2({
    readResult: readResult,
    exportedAt: exportedAt || new Date().toISOString(),
    provenance: provenance || { source: 'ASC Private Continuity Store' }
  });
}

function ascZasspillRenderPacketV2_(packet) {
  return ascRuntime_().zasspillContinuity.renderPortablePacketV2(packet);
}

function ascZasspillParsePacketV2_(markdown) {
  return ascRuntime_().zasspillContinuity.parsePortablePacketV2(markdown);
}

function ascZasspillReconcilePacket_(packet, ascReadResult, ascAvailable) {
  return ascRuntime_().zasspillContinuity.reconcilePortablePacket({
    packet: packet,
    ascReadResult: ascReadResult,
    ascAvailable: ascAvailable !== false
  });
}

function ascZasspillCrossMethodService_() {
  return ascRuntime_().zasspillContinuity.createCrossMethodContinuityService({
    continuityService: ascPrivateContinuityService_(),
    store: ascPrivateContinuityStore_()
  });
}

function ascZasspillCreateMethodHandoff_(input) {
  return ascZasspillCrossMethodService_().createHandoff(input);
}

function ascZasspillRecordMethodResult_(input) {
  return ascZasspillCrossMethodService_().recordMethodResult(input);
}

function ascZasspillReconcileMethodResult_(input) {
  return ascZasspillCrossMethodService_().reconcileMethodResult(input);
}

function ascZasspillSecureBearerToken_() {
  return 'ct_' +
    Utilities.getUuid().replace(/-/g, '') +
    Utilities.getUuid().replace(/-/g, '');
}

function ascZasspillScopedReferenceService_() {
  return ascRuntime_().zasspillContinuity.createScopedContinuityReferenceService({
    continuityService: ascPrivateContinuityService_(),
    store: ascPrivateContinuityStore_(),
    fingerprint: ascSha256Hex_,
    newBearerToken: ascZasspillSecureBearerToken_
  });
}

function ascZasspillIssueScopedReference_(input) {
  return ascZasspillScopedReferenceService_().issue(input);
}

function ascZasspillRedeemScopedReference_(input) {
  return ascZasspillScopedReferenceService_().redeem(input);
}

function ascZasspillBuildScopedTransferBootstrap_(input) {
  return ascRuntime_().zasspillContinuity.buildScopedTransferBootstrap(input);
}
